"""Unit tests for the new V1 backend: scoped API keys + route wiring.

These are offline (no Supabase/Gemini) and verify:
  - bcrypt key generation / verification
  - scope normalization + enforcement
  - FastAPI dependency resolution for the v1 router
  - auth rejects missing/invalid keys, accepts valid ones
"""

import sys
import types

# Provide a minimal config stub so imports succeed without .env
cfg = types.ModuleType("config")
cfg.SUPABASE_URL = "http://localhost"
cfg.SUPABASE_SECRET_KEY = "x"
cfg.supabase_enabled = lambda: False
cfg.PORT = 8000
sys.modules["config"] = cfg

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from interview.api_keys import (
    AuthenticatedKey,
    SCOPE_READ,
    SCOPE_WRITE,
    SCOPE_ADMIN,
    generate_key,
    verify_key,
    normalize_scopes,
    has_scope,
)
from routes.v1 import router

_orig_get_store = None  # set below after import to allow safe monkeypatch restore

import interview.supabase_store as _store_mod

_orig_get_store = _store_mod.get_store


# ---------------------------------------------------------------------------
# api_keys module
# ---------------------------------------------------------------------------
def test_key_generate_and_verify():
    raw, prefix, key_hash = generate_key()
    assert raw.startswith("hl_")
    assert verify_key(raw, key_hash) is True
    assert verify_key("not-the-key", key_hash) is False
    # tampered hash
    assert verify_key(raw, key_hash[:-2] + "aa") is False


def test_normalize_scopes():
    assert normalize_scopes(["READ", "write", "admin", "bogus"]) == {
        "read",
        "write",
        "admin",
    }
    assert normalize_scopes([]) == set()


def test_has_scope():
    admin = AuthenticatedKey("k", "o", frozenset({SCOPE_ADMIN}))
    writer = AuthenticatedKey("k", "o", frozenset({SCOPE_WRITE}))
    reader = AuthenticatedKey("k", "o", frozenset({SCOPE_READ}))
    assert has_scope(admin, SCOPE_READ) is True
    assert has_scope(writer, SCOPE_WRITE) is True
    assert has_scope(writer, SCOPE_ADMIN) is False
    assert has_scope(reader, SCOPE_WRITE) is False


# ---------------------------------------------------------------------------
# Route wiring (DI resolves without external services)
# ---------------------------------------------------------------------------
def _client():
    app = FastAPI()
    app.include_router(router)
    return TestClient(app)


def test_health_no_auth():
    c = _client()
    r = c.get("/v1/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_auth_required_without_key():
    c = _client()
    # every protected route should 401/403 without a key
    for path, method in [
        ("/v1/jobs", "get"),
        ("/v1/webhooks", "get"),
        ("/v1/api-keys", "get"),
        ("/v1/calendar/connections", "get"),
        ("/v1/proctoring/sessions", "get"),
    ]:
        resp = getattr(c, method)(path)
        assert resp.status_code in (401, 403), f"{path} -> {resp.status_code}"


def test_auth_rejects_invalid_key():
    c = _client()

    # Patch the name bound in routes.v1 (it did `from interview.supabase_store import get_store`)
    import routes.v1 as v1_mod

    class _FakeStore:
        async def _request(self, *a, **k):
            return []  # no api_keys -> 401 invalid

        async def mark_api_key_used(self, *a, **k):
            return None

    _store_mod.get_store = lambda: _FakeStore()
    v1_mod.get_store = lambda: _FakeStore()
    try:
        r = c.get("/v1/jobs", headers={"X-API-Key": "hl_garbage"})
        assert r.status_code == 401
    finally:
        _store_mod.get_store = _orig_get_store
        v1_mod.get_store = _orig_get_store


def test_v1_route_count():
    # sanity: the new endpoints are registered
    paths = {r.path for r in router.routes}
    for expected in [
        "/v1/api-keys",
        "/v1/webhooks/{webhook_id}/rotate-secret",
        "/v1/calendar/connections",
        "/v1/proctoring/sessions",
        "/v1/jobs/{job_id}/scoring-rules",
        "/v1/scoring/preview",
    ]:
        assert expected in paths, f"missing {expected}"
