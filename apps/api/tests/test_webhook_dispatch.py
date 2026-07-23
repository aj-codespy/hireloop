"""Unit tests for the webhook framework: payload building, HMAC signing, and dispatch retry logic."""

import sys
import types

# Config stub
cfg = types.ModuleType("config")
cfg.SUPABASE_URL = "http://localhost"
cfg.SUPABASE_SECRET_KEY = "x"
cfg.DEV_SQLITE = False
cfg.DEV_SQLITE_PATH = "/tmp/test.sqlite"
cfg.supabase_enabled = lambda: False
cfg.PORT = 8000
sys.modules["config"] = cfg

import json
import time
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

from interview.webhooks import (
    WebhookEventType,
    WebhookDispatcher,
    WebhookEvent,
    build_webhook_payload,
    sign_payload,
    verify_signature,
    build_application_payload,
    build_score_payload,
    build_candidate_qualified_payload,
)
from routes.v1 import router


# ---------------------------------------------------------------------------
# Webhook payload builders
# ---------------------------------------------------------------------------
def test_build_application_payload():
    app = {"id": "app_1", "status": "shortlisted", "form_response": {"name": "Alice"}, "created_at": "2026-01-01T00:00:00Z"}
    candidate = {"id": "cand_1", "name": "Alice"}
    job = {"id": "job_1", "title": "Engineer"}
    payload = build_application_payload(app, candidate, job)

    assert payload["application_id"] == "app_1"
    assert payload["candidate_id"] == "cand_1"
    assert payload["job_id"] == "job_1"
    assert payload["eligibility_passed"] is True  # status != auto_rejected


def test_build_score_payload():
    session = {"id": "sess_1"}
    app = {"id": "app_1", "candidate_id": "cand_1", "job_role_id": "job_1"}
    overall = {"totalScore": 8.5, "passingThreshold": 7.0, "generatedAt": "2026-01-01T00:00:00Z"}
    payload = build_score_payload(session, app, overall, passed=True,
                                   question_scores=[{"questionId": "q1", "score": 8.0}],
                                   strengths="Strong", concerns="None")

    assert payload["session_id"] == "sess_1"
    assert payload["overall_score"] == 8.5
    assert payload["passed"] is True
    assert payload["strengths"] == "Strong"


def test_build_candidate_qualified_payload():
    application = {"id": "app_1"}
    candidate = {"id": "cand_1", "name": "Bob"}
    job = {"id": "job_1", "title": "Manager"}
    payload = build_candidate_qualified_payload(
        application, candidate, job,
        ai_score=9.0, human_scorecards=[{"score": 8}],
        proctoring_flagged=False, cheating_probability=5,
    )

    assert payload["ai_score"] == 9.0
    assert payload["cheating_probability"] == 5
    assert payload["proctoring_flagged"] is False


# ---------------------------------------------------------------------------
# Webhook payload envelope + signing
# ---------------------------------------------------------------------------
def test_build_webhook_payload_envelope():
    payload = build_webhook_payload(
        WebhookEventType.APPLICATION_CREATED,
        application={"id": "app_1"},
        candidate={"id": "cand_1"},
        job={"id": "job_1"},
    )
    assert payload["event_id"] is not None
    assert payload["event_type"] == "application.created"
    assert payload["version"] == "2026-07-18"
    assert "data" in payload


def test_sign_and_verify():
    payload = {"event_id": "evt_1", "data": {"hello": "world"}}
    secret = "whsec_test_secret_32chars_xxxxxxxxxxxx"

    signature = sign_payload(payload, secret)
    assert signature.startswith("sha256=") or len(signature) == 64  # hex

    assert verify_signature(payload, secret, signature) is True
    assert verify_signature(payload, secret, "bad_sig") is False


# ---------------------------------------------------------------------------
# Webhook dispatch retry logic (unit, no HTTP)
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_dispatcher_max_retries_moves_to_dlq():
    """After MAX_RETRIES failed attempts, the event moves to dead_letter."""
    store = AsyncMock()
    store.get_webhook_subscriptions = AsyncMock(return_value=[])
    store.update_webhook_event = AsyncMock()

    http_client = AsyncMock()
    http_client.post = AsyncMock(side_effect=Exception("Network error"))

    dispatcher = WebhookDispatcher(http_client, store)
    event = WebhookEvent(
        id="evt_dlq",
        org_id="org_1",
        event_type="application.created",
        payload={"event_id": "evt_dlq"},
        attempts=WebhookDispatcher.MAX_RETRIES,  # Already at max
        status="pending",
    )
    # Trigger delivery (should move to dead_letter)
    await dispatcher._deliver(event, "https://example.com/webhook", "secret")

    assert event.status == "dead_letter"
    assert store.update_webhook_event.called


@pytest.mark.asyncio
async def test_dispatcher_retry_on_500():
    """Non-2xx response schedules retry."""
    store = AsyncMock()
    store.update_webhook_event = AsyncMock()
    store.get_webhook_subscriptions = AsyncMock(return_value=[])

    mock_resp = MagicMock()
    mock_resp.status_code = 500
    mock_resp.text = "Internal Server Error"

    http_client = AsyncMock()
    http_client.post = AsyncMock(return_value=mock_resp)

    dispatcher = WebhookDispatcher(http_client, store)
    event = WebhookEvent(
        id="evt_retry",
        org_id="org_1",
        event_type="application.created",
        payload={"event_id": "evt_retry"},
        attempts=0,
        status="pending",
    )
    await dispatcher._deliver(event, "https://example.com/webhook", "secret")

    assert event.attempts == 1
    assert event.status == "pending"  # Not delivered, not dead_letter yet
    assert event.response_code == 500
    assert store.update_webhook_event.called


# ---------------------------------------------------------------------------
# API client pattern integration (FastAPI test client)
# ---------------------------------------------------------------------------
def test_v1_health_endpoint():
    """Quick check that the v1 router's health endpoint works."""
    from fastapi import FastAPI
    from fastapi.testclient import TestClient

    app = FastAPI()
    app.include_router(router)
    client = TestClient(app)

    resp = client.get("/v1/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"


# ---------------------------------------------------------------------------
# HMAC signature edge cases
# ---------------------------------------------------------------------------
def test_sign_and_verify_tampered_body():
    """Tampering the payload after signing must cause verification to fail."""
    import copy
    payload = {"event_id": "evt_1", "data": {"score": 8.0}}
    secret = "whsec_test_secret_32chars_long_enough"
    sig = sign_payload(payload, secret)

    tampered = copy.deepcopy(payload)
    tampered["data"]["score"] = 9.0
    assert verify_signature(tampered, secret, sig) is False
    assert verify_signature(payload, secret, sig) is True  # original still valid


def test_verify_rejects_wrong_secret():
    """Verification with a different secret must fail."""
    payload = {"event_id": "evt_2", "data": {"hello": "world"}}
    sig = sign_payload(payload, "correct_secret")
    assert verify_signature(payload, "wrong_secret", sig) is False


def test_signature_is_deterministic():
    """Same payload + secret always produces the same signature."""
    payload = {"a": 1, "b": 2}
    secret = "deterministic_secret"
    assert sign_payload(payload, secret) == sign_payload(payload, secret)


def test_signature_changes_with_payload():
    """Different payloads produce different signatures (same secret)."""
    secret = "s"
    sig1 = sign_payload({"x": 1}, secret)
    sig2 = sign_payload({"x": 2}, secret)
    assert sig1 != sig2


def test_event_id_uniqueness():
    """Each built webhook payload gets a unique event_id."""
    seen: set[str] = set()
    for _ in range(100):
        payload = build_webhook_payload(
            WebhookEventType.APPLICATION_CREATED,
            application={"id": "a"}, candidate={"id": "c"}, job={"id": "j"},
        )
        assert payload["event_id"] not in seen
        seen.add(payload["event_id"])


def test_verify_empty_payload():
    """Empty payload must produce a valid signature that self-verifies."""
    payload: dict = {}
    secret = "s"
    sig = sign_payload(payload, secret)
    assert verify_signature(payload, secret, sig) is True
