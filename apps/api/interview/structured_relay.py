"""Structured Q&A interview relay — no Gemini Live."""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import WebSocket

from config import GEMINI_API_KEY, INTERVIEW_OVERALL_LIMIT_SECONDS, INTERVIEW_RECONNECT_HOURS, supabase_enabled
import base64
import time

from interview.proctoring import analyze_proctoring_snapshot, severity_from_analysis, calculate_cheating_probability
from interview.questions import load_demo_questions
from interview.scoring import score_interview
from interview.session import InterviewSession, SessionStatus
from interview.stt import decode_audio_payload, transcribe_audio
from interview.answer_upload import assemble_answer_audio
from interview.supabase_store import ApplicationContext, SupabaseInterviewStore, get_store

logger = logging.getLogger(__name__)

SUPPORTED_LANGUAGES = ("en", "hi")

# After a question times out, wait this long for the client to upload the
# recording it was capturing before force-advancing with an empty answer.
TIMEOUT_ANSWER_GRACE_SECONDS = 60

# Minimum seconds between server-side proctoring snapshot analyses. The client
# may stream snapshots more often, but we only run the (paid) vision model at
# this cadence to bound AI cost and DB snapshot writes.
SNAPSHOT_MIN_INTERVAL_SECONDS = 10

# Max proctoring snapshots allowed per session to prevent API spam costs
MAX_SNAPSHOTS_PER_SESSION = 350


class StructuredInterviewRelay:

    def __init__(
        self,
        websocket: WebSocket,
        *,
        token: str | None = None,
        language: str = "en",
    ) -> None:
        self.websocket = websocket
        self.token = token
        self.language = language if language in SUPPORTED_LANGUAGES else "en"
        self.store: SupabaseInterviewStore | None = get_store()
        self.ctx: ApplicationContext | None = None
        self.db_session_id: str | None = None
        self.session = InterviewSession(
            questions=[],
            overall_limit_seconds=INTERVIEW_OVERALL_LIMIT_SECONDS,
        )
        self._timer_task: asyncio.Task | None = None
        self._done_event = asyncio.Event()
        self._client_gone = False
        self._lock = asyncio.Lock()
        self._send_lock = asyncio.Lock()
        self._question_timeout_at: float | None = None
        self._transcribe_tasks: set[asyncio.Task] = set()
        self._finalize_task: asyncio.Task | None = None
        self._proctoring_warnings = 0
        self._proctoring_critical = 0
        self._last_snapshot_at = 0.0
        self._snapshot_analyzing = False

    async def run(self) -> None:
        if not GEMINI_API_KEY:
            await self._send_json(
                {"type": "error", "message": "GEMINI_API_KEY is not set. Copy .env.example to .env."}
            )
            return

        try:
            questions, resumed = await self._bootstrap_session()
        except ValueError as exc:
            await self._send_json({"type": "error", "message": str(exc)})
            return

        self.session.questions = questions
        if resumed:
            self.session.status = SessionStatus.IN_PROGRESS
            now = datetime.now(timezone.utc)
            if self.session.started_at is None:
                self.session.started_at = now
            elif self.session.overall_remaining_seconds() <= 0:
                self.session.started_at = now
            if self.session.question_started_at is None:
                self.session.question_started_at = now
        else:
            self.session.start()

        if self.session.current_index >= len(self.session.questions):
            async with self._lock:
                await self._complete_interview()
            return

        first = self.session.current_question_payload(language=self.language)
        await self._send_json(
            {
                "type": "session_started",
                "question_count": len(self.session.questions),
                "overall_limit_seconds": self.session.overall_limit_seconds,
                "overall_remaining_seconds": int(self.session.overall_remaining_seconds()),
                "question_remaining_seconds": int(self.session.question_remaining_seconds()),
                "current_index": self.session.current_index,
                "session_id": self.db_session_id,
                "resumed": resumed,
                "language": self.language,
            }
        )
        await self._emit_question(first)
        self._timer_task = asyncio.create_task(self._timer_loop())
        # Backfill Gemini TTS for any questions missing pre-rendered audio
        # (e.g. SQL/API seeds that skipped the render step). Non-blocking —
        # this interview may still use browser fallback if URLs were null.
        asyncio.create_task(self._ensure_missing_question_audio(questions))
        await self._done_event.wait()

    async def _ensure_missing_question_audio(self, questions: list) -> None:
        if not self.store:
            return
        missing = [
            q.id
            for q in questions
            if not getattr(q, "audio_url", None) or not getattr(q, "audio_url_hi", None)
        ]
        if not missing:
            return
        try:
            from interview.question_audio import render_questions_for_job

            await render_questions_for_job(self.store, missing, langs=("en", "hi"))
            logger.info("Pre-rendered TTS for questions: %s", missing)
        except Exception as exc:
            logger.warning("Background question TTS render failed: %s", exc)

    async def _bootstrap_session(self) -> tuple[list, bool]:
        if self.store:
            if not self.token:
                raise ValueError("Interview token is required")
            self.ctx = await self.store.load_application_for_interview(self.token)
            existing = await self.store.find_resumable_session(self.ctx.application_id)
            if existing:
                if existing.get("reconnect_expired"):
                    await self._handle_reconnect_expired(existing)
                    raise ValueError(
                        "Your interview window has ended. Check your email for details."
                    )
                self.db_session_id = existing["id"]
                self.session.current_index = int(existing.get("current_question_index") or 0)
                self.session.transcripts = self.store.transcript_from_json(
                    existing.get("transcript") or []
                )
                if existing.get("started_at"):
                    self.session.started_at = datetime.fromisoformat(
                        existing["started_at"].replace("Z", "+00:00")
                    )
                if existing.get("question_started_at"):
                    self.session.question_started_at = datetime.fromisoformat(
                        str(existing["question_started_at"]).replace("Z", "+00:00")
                    )
                self.session.status = SessionStatus.IN_PROGRESS
                questions = await self.store.load_questions_for_session(existing["id"])
                return questions, True

            questions, question_ids = await self.store.select_questions_for_interview(
                self.ctx.job_role_id
            )
            self.db_session_id = await self.store.create_session(
                self.ctx.application_id,
                language=self.language,
                reconnect_hours=INTERVIEW_RECONNECT_HOURS,
                question_ids=question_ids,
            )
            return questions, False

        if supabase_enabled() and not self.token:
            raise ValueError("Interview token is required when Supabase is configured")
        self.session.start()
        return load_demo_questions(), False

    async def _handle_reconnect_expired(self, session_row: dict) -> None:
        if not self.store or not self.ctx:
            return
        await self.store.notify_interview_expired(
            self.ctx.application_id,
            self.ctx.candidate_id,
            self.ctx.job_role_id,
            "interviewed",
            session_id=session_row["id"],
        )

    async def handle_client_message(self, message: dict[str, Any] | bytes) -> None:
        if isinstance(message, bytes):
            return

        msg_type = message.get("type")
        if msg_type == "ping":
            await self._send_json({"type": "pong"})
        elif msg_type == "submit_answer":
            await self._handle_submit_answer(message)
        elif msg_type == "next_question":
            expected = message.get("question_index")
            async with self._lock:
                await self._advance_locked(
                    expected_index=expected if isinstance(expected, int) else None,
                    skipped=not self._current_answer_saved(),
                )
        elif msg_type == "finish_interview":
            async with self._lock:
                await self._complete_interview()
        elif msg_type == "proctoring_event":
            asyncio.create_task(self._handle_proctoring_event(message))
        elif msg_type == "proctoring_snapshot":
            asyncio.create_task(self._handle_proctoring_snapshot(message))

    async def _handle_proctoring_event(self, message: dict) -> None:
        event_type = message.get("event_type", "unknown")
        severity = message.get("severity", "warning")
        detail = message.get("detail", "")

        if severity == "critical":
            self._proctoring_critical += 1
            self._last_violation_detail = detail
        elif severity == "warning":
            self._proctoring_warnings += 1
            self._last_violation_detail = detail

        if self.store and self.db_session_id:
            await self.store.append_proctoring_event(
                self.db_session_id,
                event_type=event_type,
                severity=severity,
                detail=detail,
                question_index=message.get("question_index"),
            )

        await self._send_json(
            {
                "type": "proctoring_alert",
                "event_type": event_type,
                "severity": severity,
                "detail": detail,
                "warning_count": self._proctoring_warnings,
                "critical_count": self._proctoring_critical,
            }
        )

        if self._proctoring_critical >= 3 or self._proctoring_warnings >= 15:
            reason = getattr(self, "_last_violation_detail", "Repeated proctoring violations detected")
            await self._flag_proctoring_session(reason)

    async def _handle_proctoring_snapshot(self, message: dict) -> None:
        if self._snapshot_analyzing:
            return
        now = time.monotonic()
        if now - self._last_snapshot_at < SNAPSHOT_MIN_INTERVAL_SECONDS:
            return
        self._last_snapshot_at = now

        b64 = message.get("image_base64", "")
        if not b64:
            return

        try:
            image_bytes = base64.b64decode(b64)
        except Exception:
            return

        mime = message.get("mime_type", "image/jpeg")
        self._snapshot_analyzing = True
        snapshot_path: str | None = None
        try:
            if self.store and self.db_session_id:
                snapshot_path = await self.store.upload_proctoring_snapshot(
                    self.db_session_id, image_bytes, mime_type=mime
                )

            loop = asyncio.get_running_loop()
            analysis = await loop.run_in_executor(
                None,
                lambda: analyze_proctoring_snapshot(image_bytes, mime_type=mime),
            )
            severity = severity_from_analysis(analysis)
            detail = analysis.get("explanation", "Snapshot analyzed")

            # Track counts for dashboard
            if severity == "critical":
                self._proctoring_critical += 1
            elif severity == "warning":
                self._proctoring_warnings += 1

            # Calculate cheating probability (0-100)
            # This is the V1 approach: never auto-end, just compute probability
            proctoring_log = getattr(self.session, 'proctoring_log', [])
            cheating_probability = calculate_cheating_probability(
                proctoring_log,
                [{"at": time.time(), "analysis": analysis, "severity": severity}]
            )

            # Store probability in session for persistence
            if not hasattr(self.session, 'proctoring_log'):
                self.session.proctoring_log = []
            self.session.proctoring_log.append({
                "at": time.time(),
                "type": "ai_snapshot",
                "severity": severity,
                "detail": detail,
                "analysis": analysis,
                "snapshot_path": snapshot_path,
                "cheating_probability": cheating_probability,
            })

            if self.store and self.db_session_id:
                await self.store.append_proctoring_event(
                    self.db_session_id,
                    event_type="ai_snapshot",
                    severity=severity,
                    detail=detail,
                    question_index=message.get("question_index"),
                    analysis=analysis,
                    snapshot_path=snapshot_path,
                )

            await self._send_json(
                {
                    "type": "proctoring_alert",
                    "event_type": "ai_snapshot",
                    "severity": severity,
                    "detail": detail,
                    "analysis": analysis,
                    "warning_count": self._proctoring_warnings,
                    "critical_count": self._proctoring_critical,
                    "cheating_probability": cheating_probability,
                }
            )

            # V1: NEVER auto-flag/end interview based on probability
            # Only explicit critical violations (phone, second person) could flag
            # but even then, we just log - never end the interview

        except Exception as exc:
            logger.warning("Proctoring snapshot analysis failed: %s", exc)
        finally:
            self._snapshot_analyzing = False

    async def _flag_proctoring_session(self, reason: str) -> None:
        if not self.store or not self.db_session_id:
            return
        await self.store.flag_session_proctoring(
            self.db_session_id,
            summary={
                "flagged": True,
                "reason": reason,
                "warnings": self._proctoring_warnings,
                "critical": self._proctoring_critical,
            },
        )
        await self._send_json(
            {
                "type": "proctoring_flagged",
                "reason": reason,
                "warnings": self._proctoring_warnings,
                "critical": self._proctoring_critical,
            }
        )
        await self._complete_interview(status=SessionStatus.FLAGGED)

    def _current_answer_saved(self) -> bool:
        q = self.session.current_question
        if not q:
            return True
        return any(
            e.speaker == "candidate" and e.question_id == q.id for e in self.session.transcripts
        )

    async def _handle_submit_answer(self, message: dict) -> None:
        """Accept an answer upload, acknowledge instantly, advance to the next
        question immediately, and transcribe in the background. The candidate
        never waits on speech-to-text."""
        if not self.session.is_active():
            return

        async with self._lock:
            q = self.session.current_question
            if not q:
                return
            # Ignore answers for a question we already moved past (stale upload).
            submitted_index = message.get("question_index")
            if isinstance(submitted_index, int) and submitted_index != self.session.current_index:
                logger.info(
                    "Ignoring stale answer for index %s (current %s)",
                    submitted_index,
                    self.session.current_index,
                )
                return

            index = self.session.current_index
            self._question_timeout_at = None

            chunk_count = message.get("chunk_count")
            audio_bytes = b""
            mime_type = "audio/webm"
            if chunk_count and self.db_session_id and not message.get("audio_base64"):
                try:
                    chunk_count_int = int(chunk_count)
                    if chunk_count_int <= 0 or chunk_count_int > 100:
                        raise ValueError(f"Invalid chunk_count: {chunk_count_int}")
                    audio_bytes, mime_type = await assemble_answer_audio(
                        self.db_session_id, index, chunk_count_int
                    )
                except Exception as exc:
                    logger.error("Failed to assemble chunked answer: %s", exc, exc_info=True)
                    await self._send_json(
                        {
                            "type": "answer_error",
                            "index": index,
                            "message": "Answer upload incomplete. Please record again.",
                        }
                    )
                    return
            else:
                audio_bytes, mime_type = decode_audio_payload(message)

            if not audio_bytes:
                logger.warning("Rejecting empty answer audio for index %s", index)
                await self._send_json(
                    {
                        "type": "answer_error",
                        "index": index,
                        "message": "No audio received. Please record again.",
                    }
                )
                return

            # Placeholder entry keeps transcript ordering and marks the
            # question as answered; the background task fills in the text.
            entry = self.session.add_transcript("candidate", "…", question_id=q.id)

            await self._send_json({"type": "answer_received", "index": index})

            task = asyncio.create_task(
                self._transcribe_in_background(entry, audio_bytes, mime_type, q.id, index)
            )
            self._transcribe_tasks.add(task)
            task.add_done_callback(self._transcribe_tasks.discard)

            # Advance right away — the interview keeps flowing.
            await self._advance_locked(expected_index=index, skipped=False)

    async def _transcribe_in_background(
        self,
        entry,
        audio_bytes: bytes,
        mime_type: str,
        question_id: str,
        index: int,
    ) -> None:
        text = ""
        if audio_bytes:
            loop = asyncio.get_running_loop()
            try:
                text = await asyncio.wait_for(
                    loop.run_in_executor(
                        None,
                        lambda: transcribe_audio(
                            audio_bytes, mime_type=mime_type, language=self.language
                        ),
                    ),
                    timeout=90,
                )
            except asyncio.TimeoutError:
                logger.warning("Transcription timed out for question %s", question_id)
                text = "(transcription unavailable)"
            except Exception as exc:
                logger.error("Transcription failed: %s", exc, exc_info=True)
                text = "(transcription failed)"

        entry.text = text
        if self.store and self.db_session_id:
            try:
                await self.store.save_question_answer(
                    self.db_session_id,
                    current_index=self.session.current_index,
                    entries=self.session.transcripts,
                    question_started_at=self.session.question_started_at,
                )
            except Exception as exc:
                logger.error("Failed to persist answer: %s", exc, exc_info=True)

        await self._send_json(
            {
                "type": "answer_saved",
                "question_id": question_id,
                "text": text,
                "index": index,
            }
        )

    async def _await_pending_transcriptions(self) -> None:
        pending = [t for t in self._transcribe_tasks if not t.done()]
        if not pending:
            return
        logger.info("Waiting for %d pending transcription(s) before scoring", len(pending))
        try:
            await asyncio.wait_for(asyncio.gather(*pending, return_exceptions=True), timeout=120)
        except asyncio.TimeoutError:
            logger.warning("Some transcriptions did not finish before scoring")

    async def _advance_locked(
        self,
        *,
        expected_index: int | None = None,
        skipped: bool = False,
        forced: bool = False,
    ) -> None:
        """Advance to the next question. Caller must hold self._lock (or be the
        timer loop, which acquires it). Idempotent via expected_index."""
        if not self.session.is_active():
            return
        if expected_index is not None and expected_index != self.session.current_index:
            # Stale request — we already advanced (e.g. server forced + client tapped Next).
            return

        q = self.session.current_question
        if q and not self._current_answer_saved():
            self.session.add_transcript("candidate", "", question_id=q.id)
            if self.store and self.db_session_id:
                async def _save_skipped():
                    try:
                        await self.store.save_question_answer(
                            self.db_session_id,
                            current_index=self.session.current_index,
                            entries=self.session.transcripts,
                            question_started_at=self.session.question_started_at,
                        )
                    except Exception as exc:
                        logger.error("Failed to persist skipped answer: %s", exc, exc_info=True)
                asyncio.create_task(_save_skipped())
                
            await self._send_json(
                {
                    "type": "answer_saved",
                    "question_id": q.id,
                    "text": "",
                    "index": self.session.current_index,
                    "skipped": skipped or forced,
                }
            )

        self.session.current_index += 1
        self.session.question_started_at = datetime.now(timezone.utc)
        self.session._question_timer_forced = False
        self._question_timeout_at = None

        if self.session.current_index >= len(self.session.questions):
            await self._complete_interview()
            return

        payload = self.session.current_question_payload(language=self.language)
        if self.store and self.db_session_id:
            async def _save_index():
                try:
                    await self.store.save_question_answer(
                        self.db_session_id,
                        current_index=self.session.current_index,
                        entries=self.session.transcripts,
                        question_started_at=self.session.question_started_at,
                    )
                except Exception as exc:
                    logger.error("Failed to persist question index: %s", exc, exc_info=True)
            asyncio.create_task(_save_index())
            
        await self._emit_question(payload, forced_advance=forced)
        await self._send_timer_tick()

    async def _emit_question(self, payload: dict, *, forced_advance: bool = False) -> None:
        """Send question text immediately with pre-rendered audio_url when available.
        Never blocks on live TTS — skip/advance stays instant."""
        event = {"type": "question_changed", **payload}
        if forced_advance:
            event["forced"] = True
        await self._send_json(event)

    async def _send_timer_tick(self) -> None:
        await self._send_json(
            {
                "type": "timer",
                "question_remaining_seconds": int(self.session.question_remaining_seconds()),
                "overall_remaining_seconds": int(self.session.overall_remaining_seconds()),
                "question_index": self.session.current_index,
            }
        )

    async def _timer_loop(self) -> None:
        """Single long-lived loop that drives all time-based transitions.
        Never exits until the session ends; failures in one tick don't kill it."""
        try:
            while self.session.is_active() and not self._client_gone:
                try:
                    await self._send_timer_tick()

                    o_remaining = self.session.overall_remaining_seconds()
                    q_remaining = self.session.question_remaining_seconds()

                    if o_remaining <= 0 and self.session.mark_overall_timer_forced():
                        await self._send_json(
                            {"type": "question_timeout", "reason": "overall"}
                        )
                        async with self._lock:
                            await self._complete_interview(status=SessionStatus.TIMED_OUT)
                        return

                    if q_remaining <= 0 and self.session.mark_question_timer_forced():
                        # Tell the client time is up. If it was recording, it
                        # will stop and upload; give it a grace window before
                        # force-advancing with an empty answer.
                        self._question_timeout_at = time.monotonic()
                        await self._send_json(
                            {
                                "type": "question_timeout",
                                "reason": "question",
                                "index": self.session.current_index,
                                "grace_seconds": TIMEOUT_ANSWER_GRACE_SECONDS,
                            }
                        )

                    if (
                        self._question_timeout_at is not None
                        and time.monotonic() - self._question_timeout_at
                        >= TIMEOUT_ANSWER_GRACE_SECONDS
                    ):
                        index = self.session.current_index
                        self._question_timeout_at = None
                        async with self._lock:
                            await self._advance_locked(
                                expected_index=index, skipped=True, forced=True
                            )
                except asyncio.CancelledError:
                    raise
                except Exception as exc:
                    logger.error("Timer tick failed: %s", exc, exc_info=True)

                await asyncio.sleep(1)
        except asyncio.CancelledError:
            logger.debug("Timer loop cancelled")

    async def _complete_interview(self, status: SessionStatus = SessionStatus.COMPLETED) -> None:
        if not self.session.is_active() and self._done_event.is_set():
            return

        self.session.finish(status)
        # Don't cancel the timer task from inside itself (overall-timeout path):
        # self-cancel would raise CancelledError on the next await and abort
        # session finalization and scoring. The loop exits on its own since the
        # session is no longer active.
        current = asyncio.current_task()
        if self._timer_task and self._timer_task is not current and not self._timer_task.done():
            self._timer_task.cancel()

        await self._send_json(
            {
                "type": "session_ended",
                "status": self.session.status.value,
                "elapsed_seconds": round(self.session.elapsed_seconds, 1),
                "transcript_count": len(self.session.transcripts),
                "questions_answered": min(
                    self.session.current_index + (1 if self._current_answer_saved() else 0),
                    len(self.session.questions),
                ),
                "session_id": self.db_session_id,
            }
        )

        async def _finish_and_score():
            try:
                # Transcriptions may still be running in the background; scoring needs
                # the final texts.
                await self._await_pending_transcriptions()

                if self.store and self.db_session_id and self.ctx:
                    await self.store.finalize_session(
                        self.db_session_id,
                        status=self.session.status,
                        elapsed_seconds=self.session.elapsed_seconds,
                        entries=self.session.transcripts,
                        current_index=self.session.current_index,
                    )
                    if self.session.transcripts:
                        await self._run_scoring()
            except Exception as e:
                logger.error("Error in background finalize/score: %s", e, exc_info=True)
            finally:
                self._done_event.set()

        # Keep a strong reference so Cloud Run does not GC the task, and so
        # client_disconnected can avoid aborting finalize/score early.
        self._finalize_task = asyncio.create_task(_finish_and_score())

    async def _run_scoring(self) -> None:
        if not self.store or not self.db_session_id or not self.ctx:
            return

        await self._send_json({"type": "scoring_started"})
        try:
            loop = asyncio.get_running_loop()
            custom_rules = getattr(self.ctx, "custom_scoring_rules", None)
            result = await loop.run_in_executor(
                None,
                lambda: score_interview(
                    self.session.questions,
                    self.session.transcripts,
                    self.ctx.passing_score,
                    custom_rules,
                ),
            )
            await self.store.save_scores(
                self.db_session_id,
                self.ctx.application_id,
                question_scores=result["question_scores"],
                overall_score=result["overall_score"],
                passed=result["passed"],
            )
            await self._send_json(
                {
                    "type": "scoring_complete",
                    "passed": result["passed"],
                    "total_score": result["overall_score"].get("totalScore"),
                }
            )
        except Exception as exc:
            logger.error("Scoring failed: %s", exc, exc_info=True)
            await self._send_json({"type": "scoring_error", "message": str(exc)})

    def client_disconnected(self) -> None:
        """Called when the client socket goes away. Flags stop the loops (they
        exit on their next tick) without cancelling in-flight persistence or
        scoring. The session row stays in_progress so the candidate can
        reconnect within the allowed window.

        Do not set ``_done_event`` while finalize/score is still running —
        that would let ``run()`` return and Cloud Run can freeze CPU before
        transcripts and scores are persisted.
        """
        self._client_gone = True
        finalize = getattr(self, "_finalize_task", None)
        if finalize is None or finalize.done():
            self._done_event.set()

    async def _send_json(self, payload: dict) -> None:
        if self._client_gone:
            return
        try:
            async with self._send_lock:
                await self.websocket.send_json(payload)
        except Exception as exc:
            name = exc.__class__.__name__
            msg = str(exc).lower()
            if (
                name in {"WebSocketDisconnect", "ClientDisconnected", "ConnectionClosedError", "ConnectionClosedOK"}
                or (isinstance(exc, RuntimeError) and ("disconnect" in msg or "close" in msg))
            ):
                self.client_disconnected()
                return
            raise
