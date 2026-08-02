"""Persist interview sessions to Supabase via PostgREST."""

from __future__ import annotations

import json
import logging
import random
import time
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
import sqlite3

from config import DEV_SQLITE, SUPABASE_SECRET_KEY, SUPABASE_URL, supabase_enabled
from utils.http_pool import get_http_client, request_with_retry
from interview.questions import Question
from interview.session import SessionStatus, TranscriptEntry
from interview.webhooks import WebhookEvent

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
    custom_scoring_rules: dict | None = None

    def __post_init__(self):
        if self.custom_scoring_rules is None:
            self.custom_scoring_rules = {}


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
        url = f"{self._base}/{path}"
        # Use request_with_retry to tolerate transient network/server failures
        res = await request_with_retry(method, url, headers=headers, params=params, json=json, timeout=30.0, retries=3)
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
            params={"id": f"eq.{row['job_role_id']}", "select": "id,passing_score,title,custom_scoring_rules"},
        )
        passing_score = job_rows[0].get("passing_score") if job_rows else None
        custom_scoring_rules = job_rows[0].get("custom_scoring_rules") if job_rows else None
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
            custom_scoring_rules=custom_scoring_rules or {},
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
        mapped = self._map_status(status)

        # First try an atomic RPC if the DB implements it; fall back to conservative
        # PATCH sequence if the RPC is not available.
        rpc_payload = {
            "p_session_id": session_id,
            "p_status": mapped,
            "p_ended_at": now,
            "p_total_duration_seconds": int(round(elapsed_seconds)),
            "p_transcript": self._transcript_to_json(entries),
            "p_current_index": current_index,
        }
        try:
            await self._request("POST", "rpc/finalize_session_rpc", json=rpc_payload, prefer="return=minimal")
            return
        except Exception:
            # RPC not present or failed — continue with existing patch flow
            pass

        rows = await self._request(
            "GET",
            "interview_sessions",
            params={"id": f"eq.{session_id}", "select": "status"},
        )
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
        client = get_http_client()
        res = await client.post(upload_url, headers=headers, content=image_bytes, timeout=30.0)
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
        await self._request(
            "POST",
            "rpc/append_proctoring_event_rpc",
            json={"p_session_id": session_id, "p_new_event": entry},
            prefer="return=minimal",
        )

    async def flag_session_proctoring(
        self,
        session_id: str,
        *,
        summary: dict,
    ) -> None:
        await self._request(
            "POST",
            "rpc/flag_session_proctoring_rpc",
            json={
                "p_session_id": session_id,
                "p_new_reason": summary.get("reason"),
                "p_warnings_count": summary.get("warnings", 0),
                "p_critical_count": summary.get("critical", 0),
            },
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
            params={"id": f"eq.{session_id}", "select": "status,proctoring_summary,round_id"},
        )
        flagged = False
        current_round_id = None
        if rows:
            row = rows[0]
            summary = row.get("proctoring_summary") or {}
            flagged = row.get("status") == "flagged" or bool(summary.get("flagged"))
            current_round_id = row.get("round_id")

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

        # Multi-round logic
        final_status = "passed_ai" if passed else "rejected_ai"
        update_payload: dict[str, Any] = {"status": final_status}

        if passed and current_round_id:
            # Check if there is a next round
            app_rows = await self._request(
                "GET",
                "applications",
                params={"id": f"eq.{application_id}", "select": "job_role_id,candidate_id"},
            )
            if app_rows:
                job_role_id = app_rows[0].get("job_role_id")
                candidate_id = app_rows[0].get("candidate_id")
                # Get current round's order_index
                curr_round_rows = await self._request(
                    "GET",
                    "job_rounds",
                    params={"id": f"eq.{current_round_id}", "select": "order_index"},
                )
                if curr_round_rows:
                    curr_order = curr_round_rows[0].get("order_index", 0)
                    # Find the next round
                    next_round_rows = await self._request(
                        "GET",
                        "job_rounds",
                        params={
                            "job_role_id": f"eq.{job_role_id}",
                            "order_index": f"gt.{curr_order}",
                            "order": "order_index.asc",
                            "limit": "1",
                        },
                    )
                    if next_round_rows:
                        next_round = next_round_rows[0]
                        update_payload["current_round_id"] = next_round["id"]
                        
                        # Generate token for the next round
                        new_token = f"int-{uuid.uuid4().hex}"
                        expires_at = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
                        update_payload["interview_token"] = new_token
                        update_payload["token_expires_at"] = expires_at
                        update_payload["status"] = "interview_sent"

                        # Send email asynchronously
                        if candidate_id:
                            cand_rows = await self._request(
                                "GET",
                                "candidates",
                                params={"id": f"eq.{candidate_id}", "select": "name,email"},
                            )
                            job_rows = await self._request(
                                "GET",
                                "job_roles",
                                params={"id": f"eq.{job_role_id}", "select": "title"},
                            )
                            if cand_rows and job_rows:
                                from interview.email_notify import send_interview_invite_email
                                from config import APP_URL
                                
                                await send_interview_invite_email(
                                    candidate_email=cand_rows[0].get("email", ""),
                                    candidate_name=cand_rows[0].get("name", ""),
                                    job_title=job_rows[0].get("title", ""),
                                    interview_url=f"{APP_URL.rstrip('/')}/candidate/{new_token}",
                                    expires_at=expires_at,
                                )
        
        await self._request(
            "PATCH",
            "applications",
            params={"id": f"eq.{application_id}"},
            json=update_payload,
            prefer="return=minimal",
        )

    # ------------------------------------------------------------------
    # API keys (scoped REST API access)
    # ------------------------------------------------------------------
    async def create_api_key(
        self,
        *,
        org_id: str,
        name: str,
        key_hash: str,
        prefix: str,
        scopes: list[str],
        created_by: str | None = None,
        expires_at: str | None = None,
    ) -> str:
        """Insert a new API key row; returns the generated id."""
        kid = f"key-{uuid.uuid4().hex[:12]}"
        await self._request(
            "POST",
            "api_keys",
            json={
                "id": kid,
                "org_id": org_id,
                "name": name,
                "key_hash": key_hash,
                "prefix": prefix,
                "scopes": scopes,
                "active": True,
                "expires_at": expires_at,
                "created_by": created_by,
            },
            prefer="return=minimal",
        )
        return kid

    async def get_api_key_by_hash(self, key_hash: str) -> dict | None:
        """Lookup active key by its bcrypt hash (indexed column)."""
        rows = await self._request(
            "GET",
            "api_keys",
            params={
                "key_hash": f"eq.{key_hash}",
                "active": "eq.true",
                "select": "id,org_id,scopes,expires_at",
            },
        )
        return rows[0] if rows else None

    async def list_api_keys(self, org_id: str) -> list[dict]:
        rows = await self._request(
            "GET",
            "api_keys",
            params={
                "org_id": f"eq.{org_id}",
                "order": "created_at.desc",
                "select": "id,name,prefix,scopes,active,last_used_at,expires_at,created_at",
            },
        )
        return rows or []

    async def update_api_key(self, key_id: str, org_id: str, updates: dict) -> None:
        await self._request(
            "PATCH",
            "api_keys",
            params={"id": f"eq.{key_id}", "org_id": f"eq.{org_id}"},
            json=updates,
            prefer="return=minimal",
        )

    async def mark_api_key_used(self, key_id: str) -> None:
        await self._request(
            "PATCH",
            "api_keys",
            params={"id": f"eq.{key_id}"},
            json={"last_used_at": datetime.now(timezone.utc).isoformat()},
            prefer="return=minimal",
        )

    # ------------------------------------------------------------------
    # Webhook subscriptions (full CRUD)
    # ------------------------------------------------------------------
    async def create_webhook_subscription(
        self, *, org_id: str, url: str, secret: str, events: list[str], description: str | None = None
    ) -> str:
        sub_id = f"wh-{uuid.uuid4().hex[:12]}"
        await self._request(
            "POST",
            "webhook_subscriptions",
            json={
                "id": sub_id,
                "org_id": org_id,
                "url": url,
                "secret": secret,
                "events": events,
                "version": "2026-07-18",
                "active": True,
                "description": description,
            },
            prefer="return=minimal",
        )
        return sub_id

    async def list_webhook_subscriptions(self, org_id: str) -> list[dict]:
        rows = await self._request(
            "GET",
            "webhook_subscriptions",
            params={
                "org_id": f"eq.{org_id}",
                "order": "created_at.desc",
                "select": "id,url,events,version,active,description,created_at,updated_at",
            },
        )
        return rows or []

    async def get_webhook_subscription(self, sub_id: str, org_id: str) -> dict | None:
        rows = await self._request(
            "GET",
            "webhook_subscriptions",
            params={
                "id": f"eq.{sub_id}",
                "org_id": f"eq.{org_id}",
                "select": "id,url,secret,events,version,active,description,created_at,updated_at",
            },
        )
        return rows[0] if rows else None

    async def update_webhook_subscription(self, sub_id: str, org_id: str, updates: dict) -> None:
        updates = {**updates, "updated_at": datetime.now(timezone.utc).isoformat()}
        await self._request(
            "PATCH",
            "webhook_subscriptions",
            params={"id": f"eq.{sub_id}", "org_id": f"eq.{org_id}"},
            json=updates,
            prefer="return=minimal",
        )

    async def delete_webhook_subscription(self, sub_id: str, org_id: str) -> None:
        await self._request(
            "DELETE",
            "webhook_subscriptions",
            params={"id": f"eq.{sub_id}", "org_id": f"eq.{org_id}"},
            prefer="return=minimal",
        )

    async def get_webhook_deliveries(self, sub_id: str, org_id: str, limit: int = 50) -> list[dict]:
        rows = await self._request(
            "GET",
            "webhook_events",
            params={
                "org_id": f"eq.{org_id}",
                "payload->>subscription_id": f"eq.{sub_id}",
                "order": "created_at.desc",
                "limit": str(limit),
                "select": "id,event_type,status,attempts,response_code,created_at",
            },
        )
        return rows or []

    # ------------------------------------------------------------------
    # Webhook event queue (dispatch worker)
    # ------------------------------------------------------------------
    async def create_webhook_event(self, event: WebhookEvent) -> None:
        await self._request(
            "POST",
            "webhook_events",
            json={
                "id": event.id,
                "org_id": event.org_id,
                "event_type": event.event_type,
                "payload": event.payload,
                "status": event.status,
                "attempts": event.attempts,
                "created_at": event.created_at.isoformat(),
            },
            prefer="return=minimal",
        )

    async def update_webhook_event(self, event: WebhookEvent) -> None:
        updates: dict = {
            "status": event.status,
            "attempts": event.attempts,
            "response_code": event.response_code,
            "response_body": event.response_body,
        }
        if event.last_attempt_at:
            updates["last_attempt_at"] = event.last_attempt_at.isoformat()
        if event.next_retry_at:
            updates["next_retry_at"] = event.next_retry_at.isoformat()
        await self._request(
            "PATCH",
            "webhook_events",
            params={"id": f"eq.{event.id}"},
            json=updates,
            prefer="return=minimal",
        )

    async def get_pending_webhook_events(self, limit: int = 50) -> list[WebhookEvent]:
        now = datetime.now(timezone.utc).isoformat()
        rows = await self._request(
            "GET",
            "webhook_events",
            params={
                "status": "in.(pending,failed)",
                "or": f"(next_retry_at.is.null,next_retry_at.lte.{now})",
                "order": "created_at.asc",
                "limit": str(limit),
                "select": "*",
            },
        )
        events: list[WebhookEvent] = []
        for r in rows or []:
            events.append(
                WebhookEvent(
                    id=r["id"],
                    org_id=r["org_id"],
                    event_type=r["event_type"],
                    payload=r.get("payload") or {},
                    status=r.get("status", "pending"),
                    attempts=r.get("attempts", 0),
                    last_attempt_at=r.get("last_attempt_at"),
                    next_retry_at=r.get("next_retry_at"),
                    response_code=r.get("response_code"),
                    response_body=r.get("response_body"),
                    created_at=r.get("created_at"),
                )
            )
        return events

    async def get_webhook_subscriptions(
        self, org_id: str, event_type: str
    ) -> list[dict]:
        """Subscriptions for an org that listen to `event_type` (with secret for signing)."""
        rows = await self._request(
            "GET",
            "webhook_subscriptions",
            params={
                "org_id": f"eq.{org_id}",
                "active": "eq.true",
                "events": f"cs.{{{event_type}}}",
                "select": "id,url,secret,events,version,active",
            },
        )
        return rows or []

    # ------------------------------------------------------------------
    # Calendar connections + slots
    # ------------------------------------------------------------------
    async def create_calendar_connection(
        self,
        *,
        org_id: str,
        user_id: str,
        provider: str,
        access_token_encrypted: str,
        refresh_token_encrypted: str,
        expires_at: str,
        calendars: list[dict] | None = None,
    ) -> str:
        cid = f"cal-{uuid.uuid4().hex[:12]}"
        await self._request(
            "POST",
            "calendar_connections",
            json={
                "id": cid,
                "org_id": org_id,
                "user_id": user_id,
                "provider": provider,
                "access_token_encrypted": access_token_encrypted,
                "refresh_token_encrypted": refresh_token_encrypted,
                "expires_at": expires_at,
                "calendars": calendars or [],
                "active": True,
            },
            prefer="return=minimal",
        )
        return cid

    async def list_calendar_connections(self, org_id: str, user_id: str | None = None) -> list[dict]:
        params = {
            "org_id": f"eq.{org_id}",
            "order": "created_at.desc",
            "select": "id,provider,calendars,active,created_at",
        }
        if user_id:
            params["user_id"] = f"eq.{user_id}"
        rows = await self._request("GET", "calendar_connections", params=params)
        return rows or []

    async def delete_calendar_connection(self, conn_id: str, org_id: str) -> None:
        await self._request(
            "DELETE",
            "calendar_connections",
            params={"id": f"eq.{conn_id}", "org_id": f"eq.{org_id}"},
            prefer="return=minimal",
        )

    async def create_interview_slots(self, org_id: str, slots: list[dict]) -> list[str]:
        if not slots:
            return []
        for s in slots:
            s["id"] = f"slot-{uuid.uuid4().hex[:12]}"
        await self._request("POST", "interview_slots", json=slots, prefer="return=minimal")
        return [s["id"] for s in slots]

    async def list_interview_slots(self, schedule_id: str, org_id: str) -> list[dict]:
        rows = await self._request(
            "GET",
            "interview_slots",
            params={
                "schedule_id": f"eq.{schedule_id}",
                "order": "starts_at.asc",
                "select": "id,starts_at,ends_at,interviewer_ids,max_candidates,status,booked_by",
            },
        )
        return rows or []

    async def book_interview_slot(self, slot_id: str, candidate_id: str) -> None:
        await self._request(
            "PATCH",
            "interview_slots",
            params={"id": f"eq.{slot_id}"},
            json={
                "status": "booked",
                "booked_by": candidate_id,
                "booked_at": datetime.now(timezone.utc).isoformat(),
            },
            prefer="return=minimal",
        )

    # ------------------------------------------------------------------
    # Proctoring dashboard
    # ------------------------------------------------------------------
    async def get_proctoring_sessions(
        self, org_id: str, *, job_id: str | None = None, flagged_only: bool = False, limit: int = 50
    ) -> list[dict]:
        params = {
            "order": "created_at.desc",
            "limit": str(limit),
            "select": (
                "id,application_id,status,cheating_probability,proctoring_summary,"
                "created_at,applications(job_role_id,status)"
            ),
        }
        if job_id:
            params["applications"] = f"job_role_id=eq.{job_id}"
        if flagged_only:
            params["cheating_probability"] = "gte.50"
        rows = await self._request("GET", "interview_sessions", params=params)
        return rows or []

    async def set_proctoring_override(self, session_id: str, *, flagged: bool, note: str, actor_id: str) -> None:
        await self._request(
            "PATCH",
            "interview_sessions",
            params={"id": f"eq.{session_id}"},
            json={
                "cheating_probability": 100 if flagged else 0,
                "proctoring_ended_interview": flagged,
                "proctoring_summary": {"manual_override": True, "note": note, "actor_id": actor_id},
            },
            prefer="return=minimal",
        )

    async def dispatch_candidate_qualified_webhook(
        self,
        application_id: str,
        candidate: dict,
        job: dict,
        ai_score: float,
        human_scorecards: list,
        proctoring_flagged: bool,
        cheating_probability: int,
    ) -> None:
        """Dispatch candidate.qualified webhook when candidate becomes qualified."""
        from interview.webhooks import build_webhook_payload, WebhookEventType

        # Get org_id from job
        org_id = job.get("org_id")
        if not org_id:
            return

        # Build webhook payload
        payload = build_webhook_payload(
            WebhookEventType.CANDIDATE_QUALIFIED,
            application={"id": application_id},
            candidate=candidate,
            job=job,
            ai_score=ai_score,
            human_scorecards=human_scorecards,
            proctoring_flagged=proctoring_flagged,
            cheating_probability=cheating_probability,
        )

        # Get active subscriptions for this org and event
        subs = await self._request(
            "GET",
            "webhook_subscriptions",
            params={
                "org_id": f"eq.{org_id}",
                "active": "eq.true",
                "events": f"cs.{{candidate.qualified}}",
            },
        )

        # Dispatch to each subscription
        for sub in subs or []:
            if "candidate.qualified" in sub.get("events", []):
                await self._deliver_webhook(
                    url=sub["url"],
                    secret=sub["secret"],
                    payload=payload,
                    org_id=org_id,
                    event_type="candidate.qualified",
                )

    async def _deliver_webhook(
        self,
        url: str,
        secret: str,
        payload: dict,
        org_id: str,
        event_type: str,
    ) -> None:
        """Deliver webhook with HMAC signature."""
        import hmac
        import hashlib

        body = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode()
        signature = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()

        headers = {
            "Content-Type": "application/json",
            "X-HireLoop-Signature": f"sha256={signature}",
            "X-HireLoop-Timestamp": str(int(time.time())),
            "X-HireLoop-Version": "2026-07-18",
        }

        try:
            client = get_http_client()
            response = await client.post(url, content=body, headers=headers, timeout=10.0)
            logger.info(f"Webhook delivered: {event_type} - {response.status_code}")
        except Exception as exc:
            logger.error(f"Webhook delivery failed: {exc}")


def get_store() -> Any | None:  # → SupabaseInterviewStore | DevSqliteStore | None
    if not supabase_enabled():
        return None
    if DEV_SQLITE:
        return DevSqliteStore()
    return SupabaseInterviewStore()


# ---------------------------------------------------------------------------
# Dev SQLite store — lightweight local fallback when DEV_SQLITE=1
# ---------------------------------------------------------------------------

class DevSqliteStore:
    """Minimal in-process SQLite store for local development.

    Implements the subset of ``SupabaseInterviewStore`` needed to run the
    interview relay without provisioning a Supabase project.  Tables are
    created lazily on first use.
    """

    def __init__(self) -> None:
        from config import dev_sqlite_connection
        self._conn = dev_sqlite_connection()
        self._ensure_tables()

    def _ensure_tables(self) -> None:
        self._conn.executescript("""
            CREATE TABLE IF NOT EXISTS applications (
                id TEXT PRIMARY KEY,
                candidate_id TEXT,
                job_role_id TEXT,
                status TEXT DEFAULT 'applied',
                interview_token TEXT,
                token_expires_at TEXT,
                current_stage_id TEXT,
                created_at TEXT
            );
            CREATE TABLE IF NOT EXISTS interview_sessions (
                id TEXT PRIMARY KEY,
                application_id TEXT,
                started_at TEXT,
                ended_at TEXT,
                status TEXT DEFAULT 'in_progress',
                question_scores TEXT,  -- json
                overall_score TEXT,     -- json
                proctoring_log TEXT,    -- json array
                proctoring_summary TEXT, -- json
                answer_chunks TEXT,     -- json
                question_started_at TEXT,
                created_at TEXT
            );
            CREATE TABLE IF NOT EXISTS questions (
                id TEXT PRIMARY KEY,
                job_role_id TEXT,
                section TEXT,
                prompt_text TEXT,
                ideal_answer_notes TEXT,
                time_limit_seconds INTEGER,
                score_threshold REAL,
                order_index INTEGER,
                is_active INTEGER DEFAULT 1,
                is_mandatory INTEGER DEFAULT 0,
                audio_url TEXT,
                audio_url_hi TEXT,
                created_at TEXT
            );
            CREATE TABLE IF NOT EXISTS job_roles (
                id TEXT PRIMARY KEY,
                org_id TEXT,
                title TEXT,
                description TEXT,
                status TEXT DEFAULT 'draft',
                passing_score REAL,
                interview_question_count INTEGER,
                custom_scoring_rules TEXT,  -- json
                created_at TEXT
            );
            CREATE TABLE IF NOT EXISTS candidates (
                id TEXT PRIMARY KEY,
                org_id TEXT,
                profile_id TEXT,
                name TEXT,
                email TEXT,
                created_at TEXT
            );
        """)

    def _row_to_dict(self, row: sqlite3.Row | None) -> dict | None:
        if row is None:
            return None
        return dict(row)

    def _rows_to_dicts(self, rows: list[sqlite3.Row]) -> list[dict]:
        return [dict(r) for r in rows]

    async def _request(self, method: str, path: str, *, params=None, json=None, prefer=None) -> Any:
        """Stub — not used by the relay path."""
        return None

    async def load_application_for_interview(self, token: str) -> ApplicationContext:
        cur = self._conn.execute(
            "SELECT * FROM applications WHERE interview_token = ?",
            (token,),
        )
        row = cur.fetchone()
        if not row:
            raise ValueError("Invalid or expired interview link")
        d = dict(row)
        # Parse custom_scoring_rules from job
        job_cur = self._conn.execute(
            "SELECT custom_scoring_rules FROM job_roles WHERE id = ?",
            (d["job_role_id"],),
        )
        job_row = job_cur.fetchone()
        custom_rules = None
        if job_row and job_row["custom_scoring_rules"]:
            import json
            custom_rules = json.loads(job_row["custom_scoring_rules"])

        return ApplicationContext(
            application_id=d["id"],
            candidate_id=d.get("candidate_id", ""),
            job_role_id=d.get("job_role_id", ""),
            passing_score=None,
            token=token,
            custom_scoring_rules=custom_rules,
        )

    async def load_questions_for_session(self, session_id: str) -> list:
        cur = self._conn.execute(
            "SELECT job_role_id, question_started_at FROM interview_sessions WHERE id = ?",
            (session_id,),
        )
        row = cur.fetchone()
        if not row:
            return []
        job_id = row["job_role_id"]
        cur = self._conn.execute(
            "SELECT * FROM questions WHERE job_role_id = ? AND is_active = 1 ORDER BY order_index",
            (job_id,),
        )
        rows = cur.fetchall()
        return [Question(**dict(r)) for r in rows]

    async def create_session(self, application_id: str, questions: list, question_ids: list, session_id: str) -> None:
        import json
        self._conn.execute(
            "INSERT INTO interview_sessions (id, application_id, status, question_started_at, created_at) VALUES (?, ?, 'in_progress', ?, datetime('now'))",
            (session_id, application_id, json.dumps({qid: None for qid in question_ids})),
        )
        self._conn.commit()

    async def save_question_answer(self, session_id: str, question_id: str, text: str) -> None:
        pass  # no-op for dev mode

    async def finalize_session(self, session_id: str, status: str, duration_seconds: float, answer_chunks: dict, application_id: str) -> None:
        import json
        self._conn.execute(
            "UPDATE interview_sessions SET status = ?, ended_at = datetime('now'), answer_chunks = ? WHERE id = ?",
            (status, json.dumps(answer_chunks), session_id),
        )
        self._conn.commit()

    async def save_scores(self, application_id: str, session_id: str, question_scores: list, overall_score: dict) -> None:
        import json
        self._conn.execute(
            "UPDATE interview_sessions SET question_scores = ?, overall_score = ? WHERE id = ?",
            (json.dumps(question_scores), json.dumps(overall_score), session_id),
        )
        self._conn.commit()

    async def find_resumable_session(self, application_id: str) -> dict | None:
        cur = self._conn.execute(
            "SELECT * FROM interview_sessions WHERE application_id = ? AND status = 'in_progress' ORDER BY created_at DESC LIMIT 1",
            (application_id,),
        )
        row = cur.fetchone()
        return self._row_to_dict(row)

    async def get_session_state(self, token: str) -> dict | None:
        cur = self._conn.execute(
            "SELECT a.interview_token, s.* FROM applications a JOIN interview_sessions s ON s.application_id = a.id WHERE a.interview_token = ? LIMIT 1",
            (token,),
        )
        row = cur.fetchone()
        return self._row_to_dict(row)

    async def validate_interview_upload(self, token: str, session_id: str, question_index: int) -> None:
        cur = self._conn.execute(
            "SELECT 1 FROM applications WHERE interview_token = ?",
            (token,),
        )
        if not cur.fetchone():
            raise ValueError("Invalid interview token")

    async def select_questions_for_interview(self, job_role_id: str) -> tuple[list, list]:
        cur = self._conn.execute(
            "SELECT * FROM questions WHERE job_role_id = ? AND is_active = 1 ORDER BY is_mandatory DESC, order_index",
            (job_role_id,),
        )
        rows = cur.fetchall()
        qs = [Question(**dict(r)) for r in rows]
        return qs, [q.id for q in qs]

    # Stub methods — no-op for dev mode
    async def save_transcript(self, *args, **kwargs) -> None: pass
    async def expire_session(self, *args, **kwargs) -> None: pass
    async def upload_proctoring_snapshot(self, *args, **kwargs) -> None: pass
    async def append_proctoring_event(self, *args, **kwargs) -> None: pass
    async def flag_session_proctoring(self, *args, **kwargs) -> None: pass
    async def notify_interview_expired(self, *args, **kwargs) -> None: pass
    async def create_api_key(self, *args, **kwargs) -> Any: return None
    async def list_api_keys(self, *args, **kwargs) -> list: return []
    async def update_api_key(self, *args, **kwargs) -> None: pass
    async def mark_api_key_used(self, *args, **kwargs) -> None: pass
    async def create_webhook_subscription(self, *args, **kwargs) -> Any: return None
    async def list_webhook_subscriptions(self, *args, **kwargs) -> list: return []
    async def get_webhook_subscription(self, *args, **kwargs) -> Any: return None
    async def update_webhook_subscription(self, *args, **kwargs) -> None: pass
    async def delete_webhook_subscription(self, *args, **kwargs) -> None: pass
    async def get_webhook_deliveries(self, *args, **kwargs) -> list: return []
    async def create_calendar_connection(self, *args, **kwargs) -> Any: return None
    async def list_calendar_connections(self, *args, **kwargs) -> list: return []
    async def delete_calendar_connection(self, *args, **kwargs) -> None: pass
    async def create_interview_slots(self, *args, **kwargs) -> list: return []
    async def list_interview_slots(self, *args, **kwargs) -> list: return []
    async def book_interview_slot(self, *args, **kwargs) -> None: pass
    async def get_proctoring_sessions(self, *args, **kwargs) -> list: return []
    async def set_proctoring_override(self, *args, **kwargs) -> None: pass
    async def dispatch_candidate_qualified_webhook(self, *args, **kwargs) -> None: pass
    async def create_webhook_event(self, *args, **kwargs) -> None: pass
    async def update_webhook_event(self, *args, **kwargs) -> None: pass
    async def get_pending_webhook_events(self, *args, **kwargs) -> list: return []
    async def get_webhook_subscriptions(self, *args, **kwargs) -> list: return []
    async def _deliver_webhook(self, *args, **kwargs) -> None: pass
    async def load_questions_for_job(self, *args, **kwargs) -> list: return []
    async def save_answer_chunks_meta(self, *args, **kwargs) -> None: pass
