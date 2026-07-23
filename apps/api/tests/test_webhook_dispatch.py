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
