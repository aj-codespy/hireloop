"""Persist interview sessions to Supabase via PostgREST."""

from __future__ import annotations

import logging
import random
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx

from config import SUPABASE_SECRET_KEY, SUPABASE_URL, supabase_enabled
from interview.questions import Question
from interview.session import SessionStatus, TranscriptEntry

logger = logging.getLogger(__name__)

DEFAULT_QUESTION_SECONDS = 90


@dataclass
class ApplicationContext:
    application_id: str
    candidate_id: str
    job_role_id: str
    passing_score: float | None
    token: str
    candidate_email: str = ""
    candidate_name: str = ""
    job_title: str = ""


class SupabaseInterviewStore:
    def __init__(self) -> None:
        if not supabase_enabled():
            raise RuntimeError("SUPABASE_URL and SUPABASE_SECRET_KEY are required")
        self._base = f"{SUPABASE_URL.rstrip('/')}/rest/v1"
        self._headers = {
            "apikey": SUPABASE_SECRET_KEY,
            "Authorization": f"Bearer {SUPABASE_SECRET_KEY}",
            "Content-Type": "application/json",
        }

    async def _request(
        self,
        method: str,
        path: str,
        *,
        params: dict | None = None,
        json: Any = None,
        prefer: str | None = None,
    ) -> Any:
        headers = dict(self._headers)
        if prefer:
            headers["Prefer"] = prefer
        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.request(
                method,
                f"{self._base}/{path}",
                headers=headers,
                params=params,
                json=json,
            )
            if res.status_code >= 400:
                raise RuntimeError(f"Supabase {method} {path}: {res.status_code} {res.text}")
            if res.status_code == 204 or not res.content:
                return None
            return res.json()

    async def load_application_for_interview(self, token: str) -> ApplicationContext:
        rows = await self._request(
            "GET",
            "applications",
            params={
                "interview_token": f"eq.{token}",
                "select": "id,candidate_id,job_role_id,status,token_expires_at",
            },
        )
        if not rows:
            raise ValueError("Invalid interview token")
        row = rows[0]
        status = row.get("status") or ""
        resumable = await self.find_resumable_session(row["id"])

        if row.get("token_expires_at"):
            expires = datetime.fromisoformat(row["token_expires_at"].replace("Z", "+00:00"))
            if expires < datetime.now(timezone.utc):
                await self.notify_interview_expired(
                    row["id"],
                    row["candidate_id"],
                    row["job_role_id"],
                    status,
                    session_id=resumable["id"] if resumable else None,
                )
                raise ValueError("Interview link has expired")

        allowed = status in ("interview_sent", "shortlisted") or (
            status == "interviewed" and resumable and not resumable.get("reconnect_expired")
        )
        if status == "interviewed" and resumable and resumable.get("reconnect_expired"):
            await self.notify_interview_expired(
                row["id"],
                row["candidate_id"],
                row["job_role_id"],
                status,
                session_id=resumable["id"],
            )
            raise ValueError("Your interview window has ended. Check your email for details.")
        if status in ("passed_ai", "rejected_ai", "interview_expired", "rejected_final", "hired"):
            raise ValueError("This interview has already been completed")
        if not allowed:
            # If they were in an interview but it's not resumable, check if it was flagged
            if status == "interviewed" and not resumable:
                flagged_check = await self._request(
                    "GET",
                    "interview_sessions",
                    params={
                        "application_id": f"eq.{row['id']}",
                        "status": "eq.flagged",
                        "select": "proctoring_summary",
                        "limit": "1",
                    },
                )
                if flagged_check:
                    summary = flagged_check[0].get("proctoring_summary") or {}
                    reason = summary.get("reason", "Repeated proctoring violations detected")
                    raise ValueError(f"This interview was terminated due to a proctoring violation: {reason}")
            raise ValueError("This application is not eligible for interview")

        job_rows = await self._request(
            "GET",
            "job_roles",
            params={"id": f"eq.{row['job_role_id']}", "select": "id,passing_score,title"},
        )
        passing_score = job_rows[0].get("passing_score") if job_rows else None
        job_title = job_rows[0].get("title", "") if job_rows else ""

        cand_rows = await self._request(
            "GET",
            "candidates",
            params={"id": f"eq.{row['candidate_id']}", "select": "name,email"},
        )
        candidate_name = cand_rows[0].get("name", "") if cand_rows else ""
        candidate_email = cand_rows[0].get("email", "") if cand_rows else ""

        return ApplicationContext(
            application_id=row["id"],
            candidate_id=row["candidate_id"],
            job_role_id=row["job_role_id"],
            passing_score=float(passing_score) if passing_score is not None else None,
            token=token,
            candidate_email=candidate_email or "",
            candidate_name=candidate_name or "",
            job_title=job_title or "",
        )

    async def load_application_by_token(self, token: str) -> ApplicationContext:
        return await self.load_application_for_interview(token)

    async def notify_interview_expired(
        self,
        application_id: str,
        candidate_id: str,
        job_role_id: str,
        current_status: str,
        *,
        session_id: str | None = None,
    ) -> None:
        if current_status == "interview_expired":
            return

        if session_id:
            await self.expire_session(session_id, application_id)
        else:
            await self._request(
                "PATCH",
                "applications",
                params={"id": f"eq.{application_id}"},
                json={"status": "interview_expired"},
                prefer="return=minimal",
            )

        job_rows = await self._request(
            "GET",
            "job_roles",
            params={"id": f"eq.{job_role_id}", "select": "title"},
        )
        cand_rows = await self._request(
            "GET",
            "candidates",
            params={"id": f"eq.{candidate_id}", "select": "name,email"},
        )
        job_title = job_rows[0].get("title", "") if job_rows else ""
        candidate_name = cand_rows[0].get("name", "") if cand_rows else ""
        candidate_email = cand_rows[0].get("email", "") if cand_rows else ""

        from interview.email_notify import send_interview_expired_email

        await send_interview_expired_email(
            candidate_email=candidate_email or "",
            candidate_name=candidate_name or "",
            job_title=job_title or "",
        )

    async def find_resumable_session(self, application_id: str) -> dict | None:
        rows = await self._request(
            "GET",
            "interview_sessions",
            params={
                "application_id": f"eq.{application_id}",
                "status": "eq.in_progress",
                "select": "id,current_question_index,transcript,started_at,reconnect_expires_at,language,question_ids,question_started_at,answer_chunks",
                "order": "created_at.desc",
                "limit": "1",
            },
        )
        if not rows:
            return None
        row = rows[0]
        reconnect_expired = False
        if row.get("reconnect_expires_at"):
            expires = datetime.fromisoformat(row["reconnect_expires_at"].replace("Z", "+00:00"))
            reconnect_expired = expires < datetime.now(timezone.utc)
        row["reconnect_expired"] = reconnect_expired
        return row

    @staticmethod
    def _row_to_question(row: dict) -> Question:
        return Question(
            id=row["id"],
            section=row["section"],
            prompt_text=row["prompt_text"],
            ideal_answer_notes=row.get("ideal_answer_notes") or "",
            time_limit_seconds=int(row["time_limit_seconds"] or DEFAULT_QUESTION_SECONDS),
            audio_url=row.get("audio_url"),
            audio_url_hi=row.get("audio_url_hi"),
        )

    async def _load_question_rows(self, job_role_id: str) -> list[dict]:
        rows = await self._request(
            "GET",
            "questions",
            params={
                "job_role_id": f"eq.{job_role_id}",
                "is_active": "eq.true",
                "select": "id,section,prompt_text,ideal_answer_notes,time_limit_seconds,order_index,is_mandatory,audio_url,audio_url_hi",
                "order": "order_index.asc",
            },
        )
        return rows or []

    async def select_questions_for_interview(self, job_role_id: str) -> tuple[list[Question], list[str]]:
        rows = await self._load_question_rows(job_role_id)
        if not rows:
            raise ValueError("No interview questions configured for this job")

        job_rows = await self._request(
            "GET",
            "job_roles",
            params={"id": f"eq.{job_role_id}", "select": "interview_question_count"},
        )
        total = job_rows[0].get("interview_question_count") if job_rows else None

        mandatory = [r for r in rows if r.get("is_mandatory")]
        variable = [r for r in rows if not r.get("is_mandatory")]

        if total is None:
            selected = rows
        else:
            total = int(total)
            mandatory_count = len(mandatory)
            if total < mandatory_count:
                raise ValueError(
                    "Interview question count must be at least the number of mandatory questions"
                )
            if total > len(rows):
                raise ValueError("Interview question count exceeds the active question pool")
            variable_needed = total - mandatory_count
            if variable_needed > len(variable):
                raise ValueError("Not enough variable questions in the pool for this interview size")
            picked_variable = random.sample(variable, variable_needed) if variable_needed else []
            selected = sorted(mandatory, key=lambda r: r["order_index"]) + sorted(
                picked_variable, key=lambda r: r["order_index"]
            )

        questions = [self._row_to_question(r) for r in selected]
        return questions, [r["id"] for r in selected]

    async def load_questions_for_session(self, session_id: str) -> list[Question]:
        rows = await self._request(
            "GET",
            "interview_sessions",
            params={"id": f"eq.{session_id}", "select": "question_ids"},
        )
        if not rows:
            raise ValueError("Interview session not found")
        question_ids = rows[0].get("question_ids") or []
        if not question_ids:
            raise ValueError("Interview session has no questions configured")

        pool = await self._request(
            "GET",
            "questions",
            params={
                "id": f"in.({','.join(question_ids)})",
                "select": "id,section,prompt_text,ideal_answer_notes,time_limit_seconds,order_index,audio_url,audio_url_hi",
            },
        )
        if not pool:
            raise ValueError("Interview questions could not be loaded")
        by_id = {r["id"]: r for r in pool}
        ordered = [by_id[qid] for qid in question_ids if qid in by_id]
        return [self._row_to_question(r) for r in ordered]

    async def load_questions_for_job(self, job_role_id: str) -> list[Question]:
        rows = await self._load_question_rows(job_role_id)
        if not rows:
            raise ValueError("No interview questions configured for this job")
        return [self._row_to_question(r) for r in rows]

    async def create_session(
        self,
        application_id: str,
        *,
        language: str = "en",
        reconnect_hours: int = 2,
        question_ids: list[str] | None = None,
    ) -> str:
        session_id = f"sess-{uuid.uuid4()}"
        now = datetime.now(timezone.utc)
        reconnect_at = now + timedelta(hours=reconnect_hours)
        payload: dict[str, Any] = {
            "id": session_id,
            "application_id": application_id,
            "status": "in_progress",
            "started_at": now.isoformat(),
            "question_started_at": now.isoformat(),
            "transcript": [],
            "current_question_index": 0,
            "language": language,
            "reconnect_expires_at": reconnect_at.isoformat(),
        }
        if question_ids:
            payload["question_ids"] = question_ids
        await self._request(
            "POST",
            "interview_sessions",
            json=payload,
            prefer="return=minimal",
        )
        await self._request(
            "PATCH",
            "applications",
            params={"id": f"eq.{application_id}"},
            json={"status": "interviewed"},
            prefer="return=minimal",
        )
        return session_id

    @staticmethod
    def _transcript_to_json(entries: list[TranscriptEntry]) -> list[dict]:
        return [
            {
                "speaker": e.speaker,
                "text": e.text,
                "timestampOffsetSeconds": e.timestamp_offset_seconds,
                **({"questionId": e.question_id} if e.question_id else {}),
            }
            for e in entries
        ]

    @staticmethod
    def transcript_from_json(rows: list[dict]) -> list[TranscriptEntry]:
        return [
            TranscriptEntry(
                speaker=r.get("speaker", "candidate"),
                text=r.get("text", ""),
                timestamp_offset_seconds=float(r.get("timestampOffsetSeconds", 0)),
                question_id=r.get("questionId"),
            )
            for r in rows
        ]

    async def save_question_answer(
        self,
        session_id: str,
        *,
        current_index: int,
        entries: list[TranscriptEntry],
        question_started_at: datetime | None = None,
    ) -> None:
        payload: dict[str, Any] = {
            "transcript": self._transcript_to_json(entries),
            "current_question_index": current_index,
        }
        if question_started_at is not None:
            payload["question_started_at"] = question_started_at.isoformat()
        await self._request(
            "PATCH",
            "interview_sessions",
            params={"id": f"eq.{session_id}"},
            json=payload,
            prefer="return=minimal",
        )

    async def save_answer_chunks_meta(self, session_id: str, answer_chunks: dict) -> None:
        await self._request(
            "PATCH",
            "interview_sessions",
            params={"id": f"eq.{session_id}"},
            json={"answer_chunks": answer_chunks},
            prefer="return=minimal",
        )

    async def get_session_state(self, token: str) -> dict | None:
        """Return resumable session state for reconnect — never reinitializes."""
        ctx = await self.load_application_for_interview(token)
        existing = await self.find_resumable_session(ctx.application_id)
        if not existing or existing.get("reconnect_expired"):
            return None
        return {
            "session_id": existing["id"],
            "current_index": int(existing.get("current_question_index") or 0),
            "question_started_at": existing.get("question_started_at"),
            "started_at": existing.get("started_at"),
            "language": existing.get("language") or "en",
            "transcript_length": len(existing.get("transcript") or []),
        }

    async def validate_interview_upload(
        self, token: str, session_id: str, question_index: int
    ) -> dict:
        """Verify token owns session and question_index is current or recent."""
        ctx = await self.load_application_for_interview(token)
        rows = await self._request(
            "GET",
            "interview_sessions",
            params={
                "id": f"eq.{session_id}",
                "application_id": f"eq.{ctx.application_id}",
                "status": "eq.in_progress",
                "select": "id,current_question_index,answer_chunks",
            },
        )
        if not rows:
            raise ValueError("Invalid session")
        row = rows[0]
        current = int(row.get("current_question_index") or 0)
        # Allow upload for current question or one behind (late chunk after advance).
        if question_index not in (current, current - 1):
            raise ValueError("Question index mismatch")
        return row

    async def save_transcript(self, session_id: str, entries: list[TranscriptEntry]) -> None:
        await self.save_question_answer(session_id, current_index=0, entries=entries)

    async def expire_session(self, session_id: str, application_id: str) -> None:
        now = datetime.now(timezone.utc).isoformat()
        await self._request(
            "PATCH",
            "interview_sessions",
            params={"id": f"eq.{session_id}"},
            json={"status": "abandoned", "ended_at": now},
            prefer="return=minimal",
        )
        await self._request(
            "PATCH",
            "applications",
            params={"id": f"eq.{application_id}"},
            json={"status": "interview_expired"},
            prefer="return=minimal",
        )

    @staticmethod
    def _map_status(status: SessionStatus) -> str:
        if status in (SessionStatus.COMPLETED, SessionStatus.TIMED_OUT):
            return "completed"
        if status == SessionStatus.ABANDONED:
            return "abandoned"
        if status == SessionStatus.FLAGGED:
            return "flagged"
        return "in_progress"

    async def finalize_session(
        self,
        session_id: str,
        *,
        status: SessionStatus,
        elapsed_seconds: float,
        entries: list[TranscriptEntry],
        current_index: int = 0,
    ) -> None:
        now = datetime.now(timezone.utc).isoformat()
        rows = await self._request(
            "GET",
            "interview_sessions",
            params={"id": f"eq.{session_id}", "select": "status"},
        )
        mapped = self._map_status(status)
        if rows and rows[0].get("status") == "flagged":
            mapped = "flagged"
        await self._request(
            "PATCH",
            "interview_sessions",
            params={"id": f"eq.{session_id}"},
            json={
                "status": mapped,
                "ended_at": now,
                "total_duration_seconds": int(round(elapsed_seconds)),
                "transcript": self._transcript_to_json(entries),
                "current_question_index": current_index,
            },
            prefer="return=minimal",
        )

    async def upload_proctoring_snapshot(
        self,
        session_id: str,
        image_bytes: bytes,
        *,
        mime_type: str = "image/jpeg",
    ) -> str | None:
        object_path = f"{session_id}/{uuid.uuid4().hex}.jpg"
        upload_url = f"{SUPABASE_URL.rstrip('/')}/storage/v1/object/proctoring-snapshots/{object_path}"
        headers = {
            "apikey": SUPABASE_SECRET_KEY,
            "Authorization": f"Bearer {SUPABASE_SECRET_KEY}",
            "Content-Type": mime_type,
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(upload_url, headers=headers, content=image_bytes)
            if res.status_code >= 400:
                logger.warning("Snapshot upload failed: %s %s", res.status_code, res.text)
                return None
        return object_path

    async def append_proctoring_event(
        self,
        session_id: str,
        *,
        event_type: str,
        severity: str,
        detail: str,
        question_index: int | None = None,
        analysis: dict | None = None,
        snapshot_path: str | None = None,
    ) -> None:
        rows = await self._request(
            "GET",
            "interview_sessions",
            params={"id": f"eq.{session_id}", "select": "proctoring_log"},
        )
        log: list[dict] = (rows[0].get("proctoring_log") if rows else None) or []
        entry: dict[str, Any] = {
            "at": datetime.now(timezone.utc).isoformat(),
            "type": event_type,
            "severity": severity,
            "detail": detail,
        }
        if question_index is not None:
            entry["questionIndex"] = question_index
        if analysis:
            entry["analysis"] = analysis
        if snapshot_path:
            entry["snapshotPath"] = snapshot_path
        log.append(entry)
        await self._request(
            "PATCH",
            "interview_sessions",
            params={"id": f"eq.{session_id}"},
            json={"proctoring_log": log},
            prefer="return=minimal",
        )

    async def flag_session_proctoring(
        self,
        session_id: str,
        *,
        summary: dict,
    ) -> None:
        await self._request(
            "PATCH",
            "interview_sessions",
            params={"id": f"eq.{session_id}"},
            json={"status": "flagged", "proctoring_summary": summary},
            prefer="return=minimal",
        )

    async def save_scores(
        self,
        session_id: str,
        application_id: str,
        *,
        question_scores: list[dict],
        overall_score: dict,
        passed: bool,
    ) -> None:
        rows = await self._request(
            "GET",
            "interview_sessions",
            params={"id": f"eq.{session_id}", "select": "status,proctoring_summary"},
        )
        flagged = False
        if rows:
            row = rows[0]
            summary = row.get("proctoring_summary") or {}
            flagged = row.get("status") == "flagged" or bool(summary.get("flagged"))

        if flagged:
            passed = False
            concerns = overall_score.get("concerns") or ""
            overall_score = {
                **overall_score,
                "pass": False,
                "concerns": f"{concerns} Proctoring violations flagged — manual review required.".strip(),
            }

        await self._request(
            "PATCH",
            "interview_sessions",
            params={"id": f"eq.{session_id}"},
            json={
                "question_scores": question_scores,
                "overall_score": overall_score,
            },
            prefer="return=minimal",
        )
        await self._request(
            "PATCH",
            "applications",
            params={"id": f"eq.{application_id}"},
            json={"status": "passed_ai" if passed else "rejected_ai"},
            prefer="return=minimal",
        )


def get_store() -> SupabaseInterviewStore | None:
    if not supabase_enabled():
        return None
    return SupabaseInterviewStore()
