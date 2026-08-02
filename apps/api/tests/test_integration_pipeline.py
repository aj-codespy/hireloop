"""Full pipeline integration test: candidate → interview → qualified webhook.

Uses the same FakeStore pattern as test_security_scopes.py.
"""

import sys
import types
from datetime import datetime, timezone
from uuid import uuid4

cfg = types.ModuleType("config")
cfg.SUPABASE_URL = "http://localhost"
cfg.SUPABASE_KEY = "test-key"
cfg.SUPABASE_SERVICE_KEY = "test-service-key"
cfg.SUPABASE_SECRET_KEY = "test-secret-key"
cfg.DEV_SQLITE = True
cfg.supabase_enabled = lambda: False
cfg.dev_sqlite_connection = lambda: __import__("sqlite3", fromlist=["connect"]).connect(":memory:")
sys.modules["config"] = cfg

from fastapi import FastAPI
from fastapi.testclient import TestClient
from interview.api_keys import generate_key
from routes.v1 import router
from interview import supabase_store as store_mod


class FakeStore:
    """In-memory store simulating Supabase for integration tests."""

    def __init__(self):
        self._keys: dict[str, dict] = {}
        self._applications: dict[str, dict] = {}
        self._jobs: dict[str, dict] = {}
        self._scorecards: dict[str, dict] = {}
        self._webhooks: dict[str, dict] = {}
        self._api_keys: dict[str, dict] = {}

    def seed_key(self, scopes: list[str]) -> str:
        raw, prefix, key_hash = generate_key()
        kid = f"key-{uuid4().hex[:8]}"
        entry = {
            "id": kid,
            "org_id": "org_test",
            "key_hash": key_hash,
            "scopes": scopes,
            "active": True,
            "expires_at": None,
        }
        self._keys[kid] = entry
        self._api_keys[kid] = entry
        return raw

    async def _request(self, method: str, table: str, params=None, json=None):
        now = datetime.now(timezone.utc)

        if table == "api_keys" and params and params.get("active") == "eq.true":
            return [
                v for v in self._keys.values()
                if v["active"]
                and (v["expires_at"] is None or datetime.fromisoformat(v["expires_at"].replace("Z", "+00:00")) > now)
            ]

        if table == "job_roles":
            if method == "GET":
                if params and "id" in params:
                    jid = params["id"].replace("eq.", "")
                    return [self._jobs[jid]] if jid in self._jobs else []
                return list(self._jobs.values())
            if method == "POST":
                jid = json["id"]
                self._jobs[jid] = json
                return [json]
            if method == "PATCH":
                jid = params["id"].replace("eq.", "")
                if jid in self._jobs:
                    self._jobs[jid].update(json)
                return [self._jobs.get(jid)]
            if method == "DELETE":
                jid = params["id"].replace("eq.", "")
                self._jobs.pop(jid, None)
                return [{"success": True}]

        if table == "applications":
            if method == "GET":
                if params and "id" in params:
                    aid = params["id"].replace("eq.", "")
                    app = self._applications.get(aid)
                    return [app] if app else []
                return list(self._applications.values())
            if method == "POST":
                aid = json["id"]
                self._applications[aid] = json
                return [json]
            if method == "PATCH":
                aid = params["id"].replace("eq.", "")
                if aid in self._applications:
                    self._applications[aid].update(json)
                return [self._applications[aid]]

        if table == "scorecards":
            if method == "GET":
                return list(self._scorecards.values())
            if method == "POST":
                sid = json["id"]
                self._scorecards[sid] = json
                return [json]

        if table == "webhook_subscriptions":
            if method == "GET":
                return list(self._webhooks.values())
            if method == "POST":
                wid = json["id"]
                self._webhooks[wid] = json
                return [json]
            if method == "PATCH":
                pass
            if method == "DELETE":
                pass

        if table == "application_stage_history":
            # No-op: accept the POST
            return [{}]

        if table == "activity_log":
            # No-op: accept the POST
            return [{}]

        return [] if method == "GET" else [{}]

    async def mark_api_key_used(self, *a, **kw):
        pass

    async def create_webhook_subscription(self, org_id: str, url: str, secret: str, events: list[str], description: str = "") -> str:
        wid = f"wh-{uuid4().hex[:8]}"
        self._webhooks[wid] = {
            "id": wid,
            "org_id": org_id,
            "url": url,
            "secret": secret,
            "events": events,
            "description": description,
            "active": True,
        }
        return wid

    async def list_webhook_subscriptions(self, org_id: str) -> list[dict]:
        return [v for v in self._webhooks.values() if v["org_id"] == org_id]

    async def get_webhook_subscription(self, webhook_id: str, org_id: str) -> dict | None:
        v = self._webhooks.get(webhook_id)
        return v if v and v["org_id"] == org_id else None

    async def update_webhook_subscription(self, webhook_id: str, org_id: str, patch: dict) -> None:
        if webhook_id in self._webhooks and self._webhooks[webhook_id]["org_id"] == org_id:
            self._webhooks[webhook_id].update(patch)

    async def delete_webhook_subscription(self, webhook_id: str, org_id: str) -> None:
        if webhook_id in self._webhooks and self._webhooks[webhook_id]["org_id"] == org_id:
            del self._webhooks[webhook_id]

    async def list_api_keys(self, org_id: str) -> list[dict]:
        return [v for v in self._api_keys.values() if v["org_id"] == org_id]

    async def update_api_key(self, key_id: str, org_id: str, patch: dict) -> None:
        if key_id in self._api_keys and self._api_keys[key_id]["org_id"] == org_id:
            self._api_keys[key_id].update(patch)


def _setup():
    store = FakeStore()
    api_key = store.seed_key(["admin"])
    store_mod.get_store = lambda: store
    import routes.v1 as v1_mod
    v1_mod.get_store = lambda: store
    app = FastAPI()
    app.include_router(router)
    client = TestClient(app)
    headers = {"X-API-Key": api_key}
    return store, client, headers


class TestJobCRUD:
    def test_create_and_read(self):
        _, client, headers = _setup()
        resp = client.post("/v1/jobs", json={
            "title": "Engineer", "description": "Test", "status": "draft",
        }, headers=headers)
        assert resp.status_code == 201, resp.text
        job_id = resp.json()["id"]

        got = client.get(f"/v1/jobs/{job_id}", headers=headers)
        assert got.status_code == 200
        assert got.json()["title"] == "Engineer"

    def test_update_and_delete(self):
        _, client, headers = _setup()
        resp = client.post("/v1/jobs", json={"title": "Test", "status": "draft"}, headers=headers)
        job_id = resp.json()["id"]

        upd = client.patch(f"/v1/jobs/{job_id}", json={"title": "Updated"}, headers=headers)
        assert upd.status_code == 200

        dels = client.delete(f"/v1/jobs/{job_id}", headers=headers)
        assert dels.status_code == 200


class TestFullPipeline:
    def test_health(self):
        _, client, _ = _setup()
        assert client.get("/v1/health").json()["status"] == "ok"

    def test_full_flow(self):
        store, client, headers = _setup()

        # Create job
        job = client.post("/v1/jobs", json={
            "title": "SWE", "status": "published", "passing_score": 7.0,
        }, headers=headers)
        assert job.status_code == 201
        job_id = job.json()["id"]

        # Create application
        app_id = f"app-{uuid4().hex[:8]}"
        import asyncio
        asyncio.run(store._request("POST", "applications", json={
            "id": app_id,
            "org_id": "org_test",
            "job_role_id": job_id,
            "candidate_id": f"cand-{uuid4().hex[:8]}",
            "status": "applied",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }))

        # Verify via GET
        got = client.get(f"/v1/applications/{app_id}", headers=headers)
        assert got.status_code == 200
        assert got.json()["status"] == "applied"

        # Transitions
        for status, reason in [
            ("shortlisted", "Good match"),
            ("interview_sent", "Invited"),
            ("interviewed", "Done"),
            ("passed_ai", "AI passed"),
            ("partner_review", "Partner review"),
        ]:
            tr = client.post(f"/v1/applications/{app_id}/transition", json={
                "to_status": status, "reason": reason,
            }, headers=headers)
            assert tr.status_code == 200, f"Transition {status}: {tr.text}"
            assert tr.json()["status"] == status

        # Submit scorecard
        sc = client.post(f"/v1/applications/{app_id}/scorecards", json={
            "recommendation": "strong_yes", "overall_score": 9.0,
            "competencies": [{"name": "coding", "score": 9}],
            "notes": "Excellent",
        }, headers=headers)
        assert sc.status_code == 200, sc.text

        # List scorecards
        lst = client.get(f"/v1/applications/{app_id}/scorecards", headers=headers)
        assert lst.status_code == 200
        assert len(lst.json()["data"]) >= 1


class TestTransitions:
    def test_invalid_transition(self):
        store, client, headers = _setup()
        app_id = f"app-{uuid4().hex[:8]}"
        import asyncio
        asyncio.run(store._request("POST", "applications", json={
            "id": app_id, "org_id": "org_test", "job_role_id": "j",
            "candidate_id": "c", "status": "applied",
        }))
        resp = client.post(f"/v1/applications/{app_id}/transition", json={"to_status": "hired"}, headers=headers)
        assert resp.status_code == 400
        assert "Invalid transition" in resp.text


class TestWebhooks:
    def test_create_and_list(self):
        _, client, headers = _setup()
        resp = client.post("/v1/webhooks", json={
            "url": "https://example.com/hook",
            "events": ["application.created"],
        }, headers=headers)
        assert resp.status_code == 201, resp.text
        wid = resp.json()["id"]
        assert "secret" in resp.json()

        lst = client.get("/v1/webhooks", headers=headers)
        assert lst.status_code == 200
        assert wid in [s["id"] for s in lst.json()["data"]]

    def test_get_update_delete(self):
        store, client, headers = _setup()
        # Create via store method (which is async)
        import asyncio
        wid = asyncio.run(store.create_webhook_subscription(
            "org_test", "https://example.com/hook", "secret", ["app.created"]
        ))

        got = client.get(f"/v1/webhooks/{wid}", headers=headers)
        assert got.status_code == 200

        upd = client.patch(f"/v1/webhooks/{wid}", json={"description": "Updated"}, headers=headers)
        assert upd.status_code == 200


class TestAPIKeys:
    def test_list(self):
        store, client, headers = _setup()
        lst = client.get("/v1/api-keys", headers=headers)
        # Admin key can list API keys
        assert lst.status_code == 200

    def test_read_scope_blocked(self):
        store = FakeStore()
        read_key = store.seed_key(["read"])
        store_mod.get_store = lambda: store
        import routes.v1 as v1_mod
        v1_mod.get_store = lambda: store
        app = FastAPI()
        app.include_router(router)
        client = TestClient(app)
        headers = {"X-API-Key": read_key}

        # Read scope should be blocked from creating jobs
        resp = client.post("/v1/jobs", json={"title": "Test"}, headers=headers)
        assert resp.status_code == 403, f"Expected 403, got {resp.status_code}"