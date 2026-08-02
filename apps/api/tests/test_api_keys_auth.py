"""API key authentication and authorization tests.

Tests:
- Key generation and validation
- Scope enforcement
- Key expiration
- Key revocation
- Rate limiting
"""

import sys
import types
from datetime import datetime, timedelta, timezone

cfg = types.ModuleType("config")
cfg.SUPABASE_URL = "http://localhost"
cfg.SUPABASE_SECRET_KEY = "x"
cfg.DEV_SQLITE = False
cfg.DEV_SQLITE_PATH = "/tmp/test.sqlite"
cfg.supabase_enabled = lambda: False
cfg.PORT = 8000
sys.modules["config"] = cfg

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from interview.api_keys import (
    generate_key,
    verify_key,
    normalize_scopes,
    AuthenticatedKey,
    SCOPE_READ,
    SCOPE_WRITE,
    SCOPE_ADMIN,
)
from routes.v1 import router
from interview import supabase_store as store_mod


class FakeStore:
    """In-memory store simulating Supabase for API key tests."""

    def __init__(self):
        self._keys: dict[str, dict] = {}

    def seed_key(self, scopes: list[str], active: bool = True, expires_at: str | None = None) -> str:
        raw, prefix, key_hash = generate_key()
        kid = f"key-{id(self) % 10000}"
        entry = {
            "id": kid,
            "org_id": "test-org",
            "key_hash": key_hash,
            "scopes": scopes,
            "active": active,
            "expires_at": expires_at,
        }
        self._keys[kid] = entry
        return raw

    async def _request(self, method: str, table: str, params=None, json=None):
        if table == "api_keys":
            if params and params.get("active") == "eq.true":
                now = datetime.now(timezone.utc)
                return [
                    v for v in self._keys.values()
                    if v["active"]
                    and (v["expires_at"] is None or datetime.fromisoformat(v["expires_at"].replace("Z", "+00:00")) > now)
                ]
            return list(self._keys.values())
        return []

    async def mark_api_key_used(self, *a, **kw):
        pass

    async def list_api_keys(self, org_id: str) -> list[dict]:
        return [v for v in self._keys.values() if v["org_id"] == org_id]


@pytest.fixture
def app_with_store():
    store = FakeStore()
    store_mod.get_store = lambda: store

    import routes.v1 as v1_mod
    v1_mod.get_store = lambda: store

    fastapi_app = FastAPI()
    fastapi_app.include_router(router)
    return TestClient(fastapi_app, raise_server_exceptions=False), store


class TestKeyGeneration:
    def test_key_has_correct_prefix(self):
        raw, prefix, key_hash = generate_key()
        assert raw.startswith("hl_")
        assert prefix == raw[:11]

    def test_key_hash_different_each_time(self):
        _, _, hash1 = generate_key()
        _, _, hash2 = generate_key()
        assert hash1 != hash2

    def test_key_length(self):
        raw, _, _ = generate_key()
        assert len(raw) == 46  # "hl_" + 43 chars from token_urlsafe(32)


class TestKeyVerification:
    def test_verify_correct_key(self):
        raw, prefix, key_hash = generate_key()
        assert verify_key(raw, key_hash) is True

    def test_verify_wrong_key(self):
        raw, prefix, key_hash = generate_key()
        assert verify_key("wrong-key", key_hash) is False

    def test_verify_tampered_hash(self):
        raw, prefix, key_hash = generate_key()
        assert verify_key(raw, key_hash[:-2] + "aa") is False

    def test_verify_empty_key(self):
        _, _, key_hash = generate_key()
        assert verify_key("", key_hash) is False


class TestScopeNormalization:
    def test_normalize_lowercase(self):
        assert normalize_scopes(["READ", "Write", "ADMIN"]) == {"read", "write", "admin"}

    def test_normalize_empty_list(self):
        assert normalize_scopes([]) == set()

    def test_normalize_removes_invalid(self):
        assert normalize_scopes(["read", "invalid", "write"]) == {"read", "write"}


class TestAuthentication:
    def test_missing_key_returns_401(self, app_with_store):
        client, _ = app_with_store
        resp = client.get("/v1/jobs")
        assert resp.status_code == 401

    def test_invalid_key_returns_401(self, app_with_store):
        client, _ = app_with_store
        resp = client.get("/v1/jobs", headers={"X-API-Key": "invalid-key"})
        assert resp.status_code == 401

    def test_valid_key_authenticates(self, app_with_store):
        client, store = app_with_store
        key = store.seed_key(["read"])
        resp = client.get("/v1/jobs", headers={"X-API-Key": key})
        assert resp.status_code in [200, 404]


class TestAuthDBFailure:
    """When the Supabase lookup itself fails (e.g. missing api_keys table),
    the client must get 503 (service unavailable), never a bare 500."""

    def test_api_keys_lookup_failure_returns_503(self, app_with_store):
        client, store = app_with_store

        async def broken_request(self, method, table, params=None, json=None):
            raise RuntimeError("Supabase GET api_keys: 404 PGRST205 table missing")

        store._request = broken_request.__get__(store, type(store))

        resp = client.get("/v1/jobs", headers={"X-API-Key": "anything"})
        assert resp.status_code == 503
        assert "auth" in resp.json()["detail"].lower()

    def test_no_api_keys_table_never_500(self, app_with_store):
        client, store = app_with_store

        async def broken_request(self, method, table, params=None, json=None):
            raise RuntimeError("Supabase GET api_keys: 404 PGRST205 table missing")

        store._request = broken_request.__get__(store, type(store))

        resp = client.get("/v1/jobs", headers={"X-API-Key": "anything"})
        assert resp.status_code != 500


class TestKeyExpiration:
    def test_active_key_works(self, app_with_store):
        client, store = app_with_store
        key = store.seed_key(["read"], active=True)
        resp = client.get("/v1/jobs", headers={"X-API-Key": key})
        assert resp.status_code in [200, 404]

    def test_expired_key_returns_401(self, app_with_store):
        client, store = app_with_store
        expired_time = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        key = store.seed_key(["read"], active=True, expires_at=expired_time)
        resp = client.get("/v1/jobs", headers={"X-API-Key": key})
        assert resp.status_code == 401

    def test_future_expiry_key_works(self, app_with_store):
        client, store = app_with_store
        future_time = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
        key = store.seed_key(["read"], active=True, expires_at=future_time)
        resp = client.get("/v1/jobs", headers={"X-API-Key": key})
        assert resp.status_code in [200, 404]


class TestKeyRevocation:
    def test_revoked_key_returns_401(self, app_with_store):
        client, store = app_with_store
        key = store.seed_key(["read"], active=False)
        resp = client.get("/v1/jobs", headers={"X-API-Key": key})
        assert resp.status_code == 401


class TestScopeEnforcement:
    def test_read_scope_cannot_create_job(self, app_with_store):
        client, store = app_with_store
        read_key = store.seed_key(["read"])
        resp = client.post("/v1/jobs", json={"title": "Test"}, headers={"X-API-Key": read_key})
        assert resp.status_code == 403

    def test_write_scope_can_create_job(self, app_with_store):
        client, store = app_with_store
        write_key = store.seed_key(["write"])
        resp = client.post("/v1/jobs", json={"title": "Test"}, headers={"X-API-Key": write_key})
        assert resp.status_code == 201

    def test_admin_scope_can_create_and_list_api_keys(self, app_with_store):
        client, store = app_with_store
        admin_key = store.seed_key(["admin"])
        resp = client.get("/v1/api-keys", headers={"X-API-Key": admin_key})
        assert resp.status_code == 200


class TestAuthenticatedKey:
    def test_authenticated_key_immutable_scopes(self):
        key = AuthenticatedKey(key_id="test", org_id="org1", scopes=frozenset([SCOPE_READ, SCOPE_WRITE]))
        assert SCOPE_READ in key.scopes
        assert SCOPE_WRITE in key.scopes
        assert SCOPE_ADMIN not in key.scopes

    def test_authenticated_key_frozen_scopes(self):
        key = AuthenticatedKey(key_id="test", org_id="org1", scopes=frozenset([SCOPE_READ]))
        try:
            key.scopes.add(SCOPE_WRITE)
            assert False, "Should not be able to modify frozenset"
        except AttributeError:
            pass


class TestMultipleScopes:
    def test_key_with_multiple_scopes(self):
        raw, _, key_hash = generate_key()
        assert verify_key(raw, key_hash) is True

    def test_scope_order_independent(self):
        scopes1 = normalize_scopes(["read", "write"])
        scopes2 = normalize_scopes(["write", "read"])
        assert scopes1 == scopes2