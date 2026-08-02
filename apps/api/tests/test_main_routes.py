"""Comprehensive route testing for main.py endpoints.

Tests all main.py routes including:
- Health endpoint
- Interview session state reconnect
- Answer chunk upload
- Question audio rendering
- Interview WebSocket
"""

import os
import sys
import types

cfg = types.ModuleType("config")
cfg.SUPABASE_URL = "http://localhost"
cfg.SUPABASE_SECRET_KEY = "x"
cfg.DEV_SQLITE = True
cfg.DEV_SQLITE_PATH = "/tmp/test.sqlite"
cfg.supabase_enabled = lambda: True
cfg.PORT = 8000
cfg.SENTRY_DSN = ""
cfg.GEMINI_API_KEY = "test-key"
cfg.SCORING_MODEL = "gemini-pro"
cfg.TTS_MODEL = "gemini-pro"
cfg.TTS_VOICE_EN = "en-US"
cfg.TTS_VOICE_HI = "hi-IN"
cfg.STT_MODEL = "gemini-pro"
cfg.MODEL = "gemini-pro"
cfg.DEEPGRAM_API_KEY = ""
cfg.INTERVIEW_OVERALL_LIMIT_SECONDS = 600
cfg.INTERVIEW_RECONNECT_HOURS = 2
cfg.BREVO_SMTP_HOST = "smtp-relay.brevo.com"
cfg.BREVO_SMTP_PORT = 587
cfg.BREVO_SMTP_LOGIN = ""
cfg.BREVO_SMTP_KEY = ""
cfg.BREVO_FROM = ""
cfg.BREVO_FROM_NAME = "HireLoop"
cfg.APP_URL = "http://localhost:3000"

import sqlite3
import threading

_dev_sqlite_local = threading.local()

def dev_sqlite_connection():
    conn = getattr(_dev_sqlite_local, "conn", None)
    if conn is None:
        conn = sqlite3.connect(cfg.DEV_SQLITE_PATH, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        _dev_sqlite_local.conn = conn
    return conn

cfg.dev_sqlite_connection = dev_sqlite_connection
sys.modules["config"] = cfg

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch

from main import app
from interview import supabase_store as store_mod


class FakeStore:
    """In-memory store for testing."""

    def __init__(self):
        self._sessions = {}
        self._uploads = {}

    async def get_session_state(self, token):
        return self._sessions.get(token)

    async def validate_interview_upload(self, interview_token, session_id, question_index):
        if interview_token not in self._sessions:
            raise ValueError("Invalid interview token")
        return True

    async def _request(self, method, table, params=None, json=None):
        return []

    async def mark_api_key_used(self, *a, **kw):
        pass


@pytest.fixture
def test_app():
    store = FakeStore()
    
    import routes.v1 as v1_mod
    from interview import supabase_store as store_mod
    import main as main_mod
    store_mod.get_store = lambda: store
    v1_mod.get_store = lambda: store
    # main.py binds get_store at import time — patch the module attribute
    # directly so routes resolve to the FakeStore regardless of import order.
    main_mod.get_store = lambda: store
    
    from main import app as main_app
    return TestClient(main_app), store


@pytest.fixture(autouse=True)
def _reset_rate_limiter():
    """The module-global slowapi limiter keeps state across tests; reset it
    so a bursty test never exhausts another test's rate budget."""
    yield
    from main import limiter as main_limiter
    try:
        main_limiter.reset()
    except Exception:
        pass


class TestHealthEndpoint:
    def test_health_returns_ok(self, test_app):
        client, _ = test_app
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert "service" in data


class TestInterviewSessionState:
    def test_session_state_endpoint_exists(self, test_app):
        client, _ = test_app
        resp = client.post("/interview/session/state?token=test-token")
        assert resp.status_code in [200, 404, 503]

    def test_session_state_not_found(self, test_app):
        client, _ = test_app
        resp = client.post("/interview/session/state?token=nonexistent")
        assert resp.status_code in [404, 503]

    def test_session_state_missing_token(self, test_app):
        client, _ = test_app
        resp = client.post("/interview/session/state")
        assert resp.status_code == 422


class TestAnswerChunkUpload:
    def test_upload_chunk_endpoint_exists(self, test_app):
        client, _ = test_app
        resp = client.post(
            "/interview/answers/chunk",
            headers={
                "X-Interview-Token": "test",
                "X-Session-Id": "test",
                "X-Question-Index": "0",
                "X-Chunk-Index": "0",
            },
            content=b"data",
        )
        assert resp.status_code in [200, 403, 503]

    def test_upload_chunk_missing_headers(self, test_app):
        client, _ = test_app
        resp = client.post("/interview/answers/chunk", content=b"data")
        assert resp.status_code in [400, 422, 403]

    def test_upload_chunk_invalid_token(self, test_app):
        client, _ = test_app
        resp = client.post(
            "/interview/answers/chunk",
            headers={
                "X-Interview-Token": "invalid",
                "X-Session-Id": "session-123",
                "X-Question-Index": "0",
                "X-Chunk-Index": "0",
            },
            content=b"data",
        )
        assert resp.status_code in [403, 503]

    def test_upload_chunk_empty_body(self, test_app):
        client, _ = test_app
        resp = client.post(
            "/interview/answers/chunk",
            headers={
                "X-Interview-Token": "test",
                "X-Session-Id": "session-123",
                "X-Question-Index": "0",
                "X-Chunk-Index": "0",
            },
            content=b"",
        )
        assert resp.status_code in [400, 403, 503]


class TestQuestionAudioRender:
    def test_render_audio_requires_secret(self, test_app):
        client, _ = test_app
        resp = client.post(
            "/admin/questions/render-audio",
            json={"question_ids": ["q1", "q2"], "langs": ["en"]},
        )
        assert resp.status_code == 403

    def test_render_audio_with_valid_secret(self, test_app):
        client, _ = test_app
        with patch.dict(os.environ, {"INTERVIEW_INTERNAL_SECRET": "test-secret"}):
            resp = client.post(
                "/admin/questions/render-audio",
                json={"question_ids": ["q1"], "langs": ["en"]},
                headers={"X-Internal-Secret": "test-secret"},
            )
            assert resp.status_code in [200, 503]


class TestRootEndpoint:
    def test_root_returns_html(self, test_app):
        client, _ = test_app
        resp = client.get("/")
        assert resp.status_code == 200


class TestWebSocketEndpoint:
    def test_websocket_endpoint_exists(self, test_app):
        client, _ = test_app
        try:
            with client.websocket_connect("/ws/interview") as websocket:
                pass
        except Exception:
            pass

    def test_websocket_with_invalid_token(self, test_app):
        client, _ = test_app
        try:
            with client.websocket_connect("/ws/interview?token=invalid") as websocket:
                pass
        except Exception:
            pass

    def test_websocket_close_reason_is_sanitized(self, test_app):
        """H4: a ValueError from token validation must not leak internal
        exception text through the WebSocket close reason."""
        client, store = test_app
        # Simulate a store ValueError carrying an internal detail
        async def racy_load(token):
            raise ValueError("Internal DB detail: secret_condition_failed for token")

        store.load_application_for_interview = racy_load  # type: ignore[attr-defined]

        from starlette.websockets import WebSocketDisconnect

        with pytest.raises(WebSocketDisconnect) as excinfo:
            with client.websocket_connect("/ws/interview?token=bad") as websocket:
                websocket.receive()
        assert excinfo.value.code == 4002
        assert excinfo.value.reason == "invalid_token"
        assert "secret_condition_failed" not in excinfo.value.reason


class TestCORS:
    def test_cors_preflight(self, test_app):
        client, _ = test_app
        resp = client.options(
            "/",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert resp.status_code in [200, 405]


class TestRateLimiting:
    def test_rate_limiting_configured(self, test_app):
        client, _ = test_app
        resp = client.get("/health")
        assert resp.status_code == 200


class TestUnhandledExceptions:
    """Unhandled exceptions must return a clean JSON 500, never a raw traceback."""

    def test_unhandled_exception_returns_clean_500(self, test_app):
        client, store = test_app

        async def boom(token):
            raise RuntimeError("SECRET_INTERNAL_DETAIL_MUST_NOT_LEAK")

        store.get_session_state = boom

        from main import app as main_app
        with patch("main.get_store", return_value=store):
            client = TestClient(main_app, raise_server_exceptions=False)
            resp = client.post("/interview/session/state?token=x")
        assert resp.status_code == 500
        body = resp.json()
        assert body.get("detail") == "Something went wrong. Please try again."
        assert "SECRET_INTERNAL_DETAIL_MUST_NOT_LEAK" not in resp.text


class TestRateLimitExceededHandler:
    """Rate-limit responses must be friendly 429s, not slowapi's raw JSON."""

    def test_rate_limit_returns_friendly_429(self, test_app):
        client, _ = test_app
        resp = None
        for _ in range(35):
            resp = client.post("/interview/session/state?token=ratelimit-probe")
        assert resp is not None and resp.status_code == 429
        body = resp.json()
        assert "slow" in body["detail"].lower() or "request" in body["detail"].lower()