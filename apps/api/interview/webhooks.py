"""Webhook framework for HireLoop V1."""

from __future__ import annotations

import hashlib
import hmac
import json
import logging
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Callable, Optional
from uuid import uuid4

import httpx

logger = logging.getLogger(__name__)


class WebhookEventType(str, Enum):
    """Supported webhook event types."""

    APPLICATION_CREATED = "application.created"
    INTERVIEW_LINK_SENT = "interview.link_sent"
    INTERVIEW_STARTED = "interview.started"
    INTERVIEW_COMPLETED = "interview.completed"
    INTERVIEW_FLAGGED = "interview.flagged"
    SCORE_AVAILABLE = "score.available"
    STAGE_CHANGED = "stage.changed"
    CANDIDATE_QUALIFIED = "candidate.qualified"
    SCORECARD_SUBMITTED = "scorecard.submitted"
    INTERVIEW_SCHEDULED = "interview.scheduled"
    INTERVIEW_RESCHEDULED = "interview.rescheduled"
    OFFER_CREATED = "offer.created"
    OFFER_SENT = "offer.sent"
    OFFER_RESPONDED = "offer.responded"
    CANDIDATE_HIRED = "candidate.hired"
    CANDIDATE_REJECTED = "candidate.rejected"


# Event payload builders
def build_application_payload(application: dict, candidate: dict, job: dict) -> dict:
    return {
        "application_id": application["id"],
        "candidate_id": candidate["id"],
        "job_id": job["id"],
        "form_response": application.get("form_response", {}),
        "eligibility_passed": application.get("status") != "auto_rejected",
        "created_at": application.get("created_at"),
    }


def build_interview_link_sent_payload(application: dict, candidate: dict, job: dict, interview_url: str, expires_at: str, language: str) -> dict:
    return {
        "application_id": application["id"],
        "candidate_id": candidate["id"],
        "job_id": job["id"],
        "interview_url": interview_url,
        "expires_at": expires_at,
        "language": language,
        "sent_at": datetime.now(timezone.utc).isoformat(),
    }


def build_interview_started_payload(session: dict, application: dict, question_count: int) -> dict:
    return {
        "session_id": session["id"],
        "application_id": application["id"],
        "question_count": question_count,
        "started_at": session.get("started_at"),
    }


def build_interview_completed_payload(session: dict, application: dict, status: str, duration_seconds: float, questions_answered: int) -> dict:
    return {
        "session_id": session["id"],
        "application_id": application["id"],
        "status": status,
        "duration_seconds": duration_seconds,
        "questions_answered": questions_answered,
        "completed_at": datetime.now(timezone.utc).isoformat(),
    }


def build_interview_flagged_payload(session: dict, application: dict, reason: str, violation_count: int, snapshots: list) -> dict:
    return {
        "session_id": session["id"],
        "application_id": application["id"],
        "reason": reason,
        "violation_count": violation_count,
        "snapshots": snapshots,
        "flagged_at": datetime.now(timezone.utc).isoformat(),
    }


def build_score_payload(session: dict, application: dict, overall_score: dict, passed: bool, question_scores: list, strengths: str, concerns: str) -> dict:
    return {
        "session_id": session["id"],
        "application_id": application["id"],
        "candidate_id": application["candidate_id"],
        "job_id": application["job_role_id"],
        "overall_score": overall_score.get("totalScore"),
        "passed": passed,
        "passing_threshold": overall_score.get("passingThreshold"),
        "question_scores": question_scores,
        "strengths": strengths,
        "concerns": concerns,
        "generated_at": overall_score.get("generatedAt"),
    }


def build_stage_changed_payload(application: dict, from_stage_id: str, to_stage_id: str, stage_type: str, actor_id: str) -> dict:
    return {
        "application_id": application["id"],
        "candidate_id": application["candidate_id"],
        "job_id": application["job_role_id"],
        "from_stage_id": from_stage_id,
        "to_stage_id": to_stage_id,
        "stage_type": stage_type,
        "actor_id": actor_id,
        "changed_at": datetime.now(timezone.utc).isoformat(),
    }


def build_candidate_qualified_payload(
    application: dict,
    candidate: dict,
    job: dict,
    ai_score: float,
    human_scorecards: list,
    proctoring_flagged: bool,
    cheating_probability: int,
) -> dict:
    return {
        "application_id": application["id"],
        "candidate_id": candidate["id"],
        "job_id": job["id"],
        "ai_score": ai_score,
        "human_scorecards": human_scorecards,
        "proctoring_flagged": proctoring_flagged,
        "cheating_probability": cheating_probability,
        "qualified_at": datetime.now(timezone.utc).isoformat(),
    }


def build_scorecard_payload(scorecard: dict, application: dict, reviewer: dict) -> dict:
    return {
        "scorecard_id": scorecard["id"],
        "application_id": application["id"],
        "reviewer_id": reviewer["id"],
        "recommendation": scorecard.get("recommendation"),
        "overall_score": scorecard.get("overall_score"),
        "competencies": scorecard.get("competencies", []),
        "submitted_at": scorecard.get("submitted_at"),
    }


def build_interview_scheduled_payload(schedule: dict, application: dict, attendees: list, meeting_url: str, stage_id: str) -> dict:
    return {
        "schedule_id": schedule["id"],
        "application_id": application["id"],
        "starts_at": schedule["starts_at"],
        "ends_at": schedule["ends_at"],
        "attendees": attendees,
        "meeting_url": meeting_url,
        "stage_id": schedule.get("stage_id"),
        "scheduled_at": datetime.now(timezone.utc).isoformat(),
    }


def build_interview_rescheduled_payload(schedule: dict, application: dict, old_starts_at: str, new_starts_at: str, initiator: str) -> dict:
    return {
        "schedule_id": schedule["id"],
        "application_id": application["id"],
        "old_starts_at": old_starts_at,
        "new_starts_at": new_starts_at,
        "initiator": initiator,
        "rescheduled_at": datetime.now(timezone.utc).isoformat(),
    }


def build_offer_payload(offer: dict, application: dict, action: str) -> dict:
    base = {
        "offer_id": offer["id"],
        "application_id": application["id"],
        "candidate_id": application["candidate_id"],
        "job_id": application["job_role_id"],
        "status": offer["status"],
        "compensation": offer.get("compensation", {}),
        "start_date": offer.get("start_date"),
        "expires_at": offer.get("expires_at"),
    }
    if action == "sent":
        base["sent_at"] = offer.get("sent_at")
    elif action == "responded":
        base["responded_at"] = offer.get("responded_at")
        base["response"] = offer.get("status")
    return base


EVENT_BUILDERS: dict[str, Callable[..., dict]] = {
    WebhookEventType.APPLICATION_CREATED: build_application_payload,
    WebhookEventType.INTERVIEW_LINK_SENT: build_interview_link_sent_payload,
    WebhookEventType.INTERVIEW_STARTED: build_interview_started_payload,
    WebhookEventType.INTERVIEW_COMPLETED: build_interview_completed_payload,
    WebhookEventType.INTERVIEW_FLAGGED: build_interview_flagged_payload,
    WebhookEventType.SCORE_AVAILABLE: build_score_payload,
    WebhookEventType.STAGE_CHANGED: build_stage_changed_payload,
    WebhookEventType.CANDIDATE_QUALIFIED: build_candidate_qualified_payload,
    WebhookEventType.SCORECARD_SUBMITTED: build_scorecard_payload,
    WebhookEventType.INTERVIEW_SCHEDULED: build_interview_scheduled_payload,
    WebhookEventType.INTERVIEW_RESCHEDULED: build_interview_rescheduled_payload,
    WebhookEventType.OFFER_CREATED: lambda offer, app, action="created": build_offer_payload(offer, app, action),
    WebhookEventType.OFFER_SENT: lambda offer, app: build_offer_payload(offer, app, "sent"),
    WebhookEventType.OFFER_RESPONDED: lambda offer, app: build_offer_payload(offer, app, "responded"),
    WebhookEventType.CANDIDATE_HIRED: lambda app, cand, _cand: build_offer_payload({"status": "hired"}, app, "hired"),
    WebhookEventType.CANDIDATE_REJECTED: lambda app, cand, reason: build_offer_payload({"status": "rejected", "reason": reason}, app, "rejected"),
}


@dataclass
class WebhookSubscription:
    id: str
    org_id: str
    url: str
    secret: str
    events: list[str]
    version: str = "2026-07-18"
    active: bool = True
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass
class WebhookEvent:
    id: str
    org_id: str
    event_type: str
    payload: dict
    status: str = "pending"  # pending, delivered, failed, dead_letter
    attempts: int = 0
    last_attempt_at: datetime | None = None
    next_retry_at: datetime | None = None
    response_code: int | None = None
    response_body: str | None = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


def sign_payload(payload: dict, secret: str) -> str:
    """Generate HMAC-SHA256 signature for webhook payload."""
    body = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode()
    signature = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    return signature


def verify_signature(payload: dict, secret: str, signature: str) -> bool:
    """Verify HMAC-SHA256 signature."""
    expected = sign_payload(payload, secret)
    return hmac.compare_digest(expected, signature)


def build_webhook_payload(event_type: str, **kwargs) -> dict:
    """Build standardized webhook payload."""
    builder = EVENT_BUILDERS.get(event_type)
    if not builder:
        raise ValueError(f"No builder for event type: {event_type}")

    data = builder(**kwargs)
    return {
        "event_id": str(uuid4()),
        "event_type": event_type,
        "version": "2026-07-18",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": data,
    }


class WebhookDispatcher:
    """Handles webhook delivery with retry logic and DLQ."""

    # Retry schedule: 1m, 5m, 15m, 1h, 6h, 24h (max 72h)
    RETRY_SCHEDULE = [60, 300, 900, 3600, 21600, 86400]
    MAX_RETRIES = 6
    MAX_DELIVERY_TIME = 72 * 3600  # 72 hours

    def __init__(self, http_client: httpx.AsyncClient, store: Any):
        self.http_client = http_client
        self.store = store

    async def dispatch(self, org_id: str, event_type: str, payload: dict, subscriptions: list[dict]) -> None:
        """Dispatch webhook to all matching subscriptions."""
        webhook_payload = build_webhook_payload(event_type, **payload)

        for sub in subscriptions:
            if event_type not in sub["events"]:
                continue

            webhook_event = WebhookEvent(
                id=str(uuid4()),
                org_id=org_id,
                event_type=event_type,
                payload=webhook_payload,
            )

            # Store event
            await self.store.create_webhook_event(webhook_event)

            # Schedule delivery
            await self._deliver(webhook_event, sub["url"], sub["secret"])

    async def _deliver(self, event: WebhookEvent, url: str, secret: str) -> None:
        """Deliver webhook with retry logic."""
        body = json.dumps(event.payload, separators=(",", ":"), sort_keys=True).encode()
        signature = sign_payload(event.payload, secret)

        headers = {
            "Content-Type": "application/json",
            "X-HireLoop-Signature": f"sha256={sign_payload(event.payload, secret)}",
            "X-HireLoop-Timestamp": str(int(time.time())),
            "X-HireLoop-Version": "2026-07-18",
            "X-HireLoop-Event-ID": event.id,
            "X-HireLoop-Event-Type": event.event_type,
        }

        try:
            response = await self.http_client.post(url, content=body, headers=headers, timeout=10.0)
            event.attempts += 1
            event.last_attempt_at = datetime.now(timezone.utc)
            event.response_code = response.status_code
            event.response_body = response.text[:500] if response.text else None

            if 200 <= response.status_code < 300:
                event.status = "delivered"
                await self.store.update_webhook_event(event)
                logger.info(f"Webhook delivered: {event.event_type} to {event.id}")
                return

            # Non-2xx response, schedule retry
            logger.warning(f"Webhook failed: {response.status_code} - {response.text[:200]}")

        except httpx.TimeoutException:
            event.attempts += 1
            event.last_attempt_at = datetime.now(timezone.utc)
            logger.warning(f"Webhook timeout: {event.id}")

        except Exception as exc:
            event.attempts += 1
            event.last_attempt_at = datetime.now(timezone.utc)
            logger.error(f"Webhook error: {exc}")

        # Schedule retry or move to DLQ
        if event.attempts >= self.MAX_RETRIES:
            event.status = "dead_letter"
            await self.store.update_webhook_event(event)
            logger.error(f"Webhook moved to DLQ after {event.attempts} attempts: {event.id}")
        else:
            delay = self.RETRY_SCHEDULE[event.attempts - 1] if event.attempts <= len(self.RETRY_SCHEDULE) else self.RETRY_SCHEDULE[-1]
            event.next_retry_at = datetime.fromtimestamp(datetime.now(timezone.utc).timestamp() + delay, tz=timezone.utc)
            event.status = "pending"
            await self.store.update_webhook_event(event)

    async def process_retries(self) -> None:
        """Process pending retries (called by background job)."""
        pending = await self.store.get_pending_webhook_events()
        for event in pending:
            subs = await self.store.get_webhook_subscriptions(event.org_id, event.event_type)
            for sub in subs:
                if event.event_type in sub["events"]:
                    await self._deliver(event, sub["url"], sub["secret"])
                    break


# Store interface (to be implemented by supabase_store)
class WebhookStore:
    async def create_webhook_event(self, event: WebhookEvent) -> None:
        raise NotImplementedError

    async def update_webhook_event(self, event: WebhookEvent) -> None:
        raise NotImplementedError

    async def get_pending_webhook_events(self) -> list[WebhookEvent]:
        raise NotImplementedError

    async def get_webhook_subscriptions(self, org_id: str, event_type: str) -> list[dict]:
        raise NotImplementedError

    async def create_subscription(self, sub: dict) -> str:
        raise NotImplementedError

    async def get_subscription(self, sub_id: str) -> dict | None:
        raise NotImplementedError

    async def list_subscriptions(self, org_id: str) -> list[dict]:
        raise NotImplementedError

    async def update_subscription(self, sub_id: str, updates: dict) -> None:
        raise NotImplementedError

    async def delete_subscription(self, sub_id: str) -> None:
        raise NotImplementedError