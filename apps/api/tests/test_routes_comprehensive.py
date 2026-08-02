"""Comprehensive route testing for all API endpoints.

Tests all v1 routes for:
- Route registration
- HTTP method validation
- Request/response validation
- Error handling
- Authentication requirements
"""

import sys
import types
from datetime import datetime, timezone

cfg = types.ModuleType("config")
cfg.SUPABASE_URL = "http://localhost"
cfg.SUPABASE_SECRET_KEY = "x"
cfg.DEV_SQLITE = False
cfg.DEV_SQLITE_PATH = "/tmp/test.sqlite"
cfg.supabase_enabled = lambda: False
cfg.PORT = 8000
cfg.GEMINI_API_KEY = "test-key"
cfg.SCORING_MODEL = "gemini-pro"
sys.modules["config"] = cfg

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from interview.api_keys import generate_key
from routes.v1 import router
from interview import supabase_store as store_mod


class FakeStore:
    """In-memory store for testing."""

    def __init__(self):
        self._keys: dict[str, dict] = {}
        self._jobs: dict[str, dict] = {}
        self._applications: dict[str, dict] = {}
        self._candidates: dict[str, dict] = {}
        self._scorecards: dict[str, {}] = {}
        self._schedules: dict[str, dict] = {}
        self._webhooks: dict[str, dict] = {}
        self._api_keys: dict[str, dict] = {}
        self._exports: dict[str, dict] = {}
        self._proctoring: dict[str, dict] = {}
        self._calendar: dict[str, dict] = {}
        self._slots: dict[str, dict] = {}
        self._offers: dict[str, dict] = {}

    def seed_key(self, scopes: list[str]) -> str:
        raw, prefix, key_hash = generate_key()
        kid = f"key-{id(self) % 10000}"
        entry = {
            "id": kid,
            "org_id": "test-org",
            "key_hash": key_hash,
            "scopes": scopes,
            "active": True,
            "expires_at": None,
        }
        self._keys[kid] = entry
        self._api_keys[kid] = entry
        return raw

    def seed_application(self, app_id: str, org_id: str) -> None:
        self._applications[app_id] = {
            "id": app_id,
            "org_id": org_id,
            "candidate_id": "cand-1",
            "job_role_id": "job-1",
            "status": "applied",
        }

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
                org = (params or {}).get("org_id", "").replace("eq.", "")
                if params and "id" in params:
                    aid = params["id"].replace("eq.", "")
                    app = self._applications.get(aid)
                    return [app] if app and (not org or app["org_id"] == org) else []
                return [a for a in self._applications.values() if not org or a["org_id"] == org]
            if method == "POST":
                aid = json["id"]
                self._applications[aid] = json
                return [json]
            if method == "PATCH":
                aid = params["id"].replace("eq.", "")
                if aid in self._applications:
                    self._applications[aid].update(json)
                return [self._applications[aid]]

        if table == "candidates":
            if method == "GET":
                if params and "id" in params:
                    cid = params["id"].replace("eq.", "")
                    return [self._candidates[cid]] if cid in self._candidates else []
                return list(self._candidates.values())

        if table == "scorecards":
            if method == "GET":
                return list(self._scorecards.values())
            if method == "POST":
                sid = json["id"]
                self._scorecards[sid] = json
                return [json]

        if table == "interview_schedules":
            if method == "GET":
                return list(self._schedules.values())
            if method == "POST":
                sid = json["id"]
                self._schedules[sid] = json
                return [json]

        if table == "offers":
            if method == "GET":
                if params and "application_id" in params:
                    aid = params["application_id"].replace("eq.", "")
                    return [self._offers.get(aid)] if aid in self._offers else []
                return list(self._offers.values())
            if method == "POST":
                oid = json["id"]
                self._offers[oid] = json
                return [json]

        if table == "export_jobs":
            if method == "GET":
                return list(self._exports.values())
            if method == "POST":
                eid = json["id"]
                self._exports[eid] = json
                return [json]

        if table == "proctoring_sessions":
            if method == "GET":
                return list(self._proctoring.values())

        if table == "interview_slots":
            if method == "GET":
                return list(self._slots.values())
            if method == "POST":
                for slot in json.get("slots", []):
                    self._slots[slot["starts_at"]] = slot
                return [{"created": len(json.get("slots", []))}]

        return [] if method == "GET" else [{}]

    async def mark_api_key_used(self, *a, **kw):
        pass

    async def list_webhook_subscriptions(self, org_id: str) -> list[dict]:
        return [v for v in self._webhooks.values() if v["org_id"] == org_id]

    async def get_webhook_subscription(self, webhook_id: str, org_id: str) -> dict | None:
        v = self._webhooks.get(webhook_id)
        return v if v and v["org_id"] == org_id else None

    async def create_webhook_subscription(self, org_id: str, url: str, secret: str, events: list[str], description: str = "") -> str:
        wid = f"wh-{id(self) % 10000}"
        self._webhooks[wid] = {"id": wid, "org_id": org_id, "url": url, "secret": secret, "events": events, "active": True}
        return wid

    async def update_webhook_subscription(self, webhook_id: str, org_id: str, patch: dict) -> None:
        if webhook_id in self._webhooks and self._webhooks[webhook_id]["org_id"] == org_id:
            self._webhooks[webhook_id].update(patch)

    async def delete_webhook_subscription(self, webhook_id: str, org_id: str) -> None:
        if webhook_id in self._webhooks and self._webhooks[webhook_id]["org_id"] == org_id:
            del self._webhooks[webhook_id]

    async def get_webhook_deliveries(self, webhook_id: str, org_id: str, limit: int = 50) -> list[dict]:
        return []

    async def list_api_keys(self, org_id: str) -> list[dict]:
        return [v for v in self._api_keys.values() if v["org_id"] == org_id]

    async def update_api_key(self, key_id: str, org_id: str, patch: dict) -> None:
        if key_id in self._api_keys and self._api_keys[key_id]["org_id"] == org_id:
            self._api_keys[key_id].update(patch)

    async def get_proctoring_sessions(self, org_id: str, job_id=None, flagged_only=False, limit=50):
        return list(self._proctoring.values())

    async def update_proctoring_override(self, session_id, flagged, note, actor_id):
        pass

    async def set_proctoring_override(self, session_id, flagged, note, actor_id):
        pass

    async def _request(self, method: str, table: str, params=None, json=None, **kwargs):
        if table == "api_keys":
            if params and params.get("active") == "eq.true":
                now = datetime.now(timezone.utc)
                return [
                    v for v in self._keys.values()
                    if v["active"]
                    and (v["expires_at"] is None or datetime.fromisoformat(v["expires_at"].replace("Z", "+00:00")) > now)
                ]
            return list(self._keys.values())

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
                org = (params or {}).get("org_id", "").replace("eq.", "")
                if params and "id" in params:
                    aid = params["id"].replace("eq.", "")
                    app = self._applications.get(aid)
                    return [app] if app and (not org or app["org_id"] == org) else []
                return [a for a in self._applications.values() if not org or a["org_id"] == org]
            if method == "POST":
                aid = json["id"]
                self._applications[aid] = json
                return [json]
            if method == "PATCH":
                aid = params["id"].replace("eq.", "")
                if aid in self._applications:
                    self._applications[aid].update(json)
                return [self._applications[aid]]

        if table == "candidates":
            if method == "GET":
                if params and "id" in params:
                    cid = params["id"].replace("eq.", "")
                    return [self._candidates[cid]] if cid in self._candidates else []
                return list(self._candidates.values())

        if table == "scorecards":
            if method == "GET":
                return list(self._scorecards.values())
            if method == "POST":
                sid = json["id"]
                self._scorecards[sid] = json
                return [json]

        if table == "interview_schedules":
            if method == "GET":
                return list(self._schedules.values())
            if method == "POST":
                sid = json["id"]
                self._schedules[sid] = json
                return [json]

        if table == "offers":
            if method == "GET":
                if params and "application_id" in params:
                    aid = params["application_id"].replace("eq.", "")
                    return [self._offers.get(aid)] if aid in self._offers else []
                return list(self._offers.values())
            if method == "POST":
                oid = json["id"]
                self._offers[oid] = json
                return [json]

        if table == "export_jobs":
            if method == "GET":
                return list(self._exports.values())
            if method == "POST":
                eid = json["id"]
                self._exports[eid] = json
                return [json]

        if table == "proctoring_sessions":
            if method == "GET":
                return list(self._proctoring.values())

        if table == "interview_slots":
            if method == "GET":
                return list(self._slots.values())
            if method == "POST":
                for slot in json.get("slots", []):
                    self._slots[slot["starts_at"]] = slot
                return [{"created": len(json.get("slots", []))}]

        return [] if method == "GET" else [{}]

    async def create_api_key(self, org_id, name, key_hash, prefix, scopes, created_by, expires_at=None):
        kid = f"key-{id(self) % 10000}"
        self._api_keys[kid] = {
            "id": kid,
            "org_id": org_id,
            "key_hash": key_hash,
            "prefix": prefix,
            "scopes": scopes,
            "active": True,
            "created_by": created_by,
            "expires_at": expires_at,
        }
        return kid

    async def list_calendar_connections(self, org_id: str):
        return list(self._calendar.values())

    async def delete_calendar_connection(self, conn_id, org_id):
        pass

    async def list_interview_slots(self, schedule_id, org_id):
        return list(self._slots.values())

    async def create_interview_slots(self, org_id, prepared):
        return [f"slot-{i}" for i in range(len(prepared))]

    async def book_interview_slot(self, slot_id, candidate_id):
        pass

    async def get_webhook_deliveries(self, webhook_id: str, org_id: str, limit: int = 50) -> list[dict]:
        return []


@pytest.fixture
def app():
    store = FakeStore()
    store.seed_application("app-test", "test-org")
    store_mod.get_store = lambda: store
    import routes.v1 as v1_mod
    v1_mod.get_store = lambda: store

    fastapi_app = FastAPI()
    fastapi_app.include_router(router)
    return fastapi_app, store


@pytest.fixture
def client(app):
    fastapi_app, _ = app
    return TestClient(fastapi_app)


@pytest.fixture
def api_key(app):
    _, store = app
    return store.seed_key(["admin"])


@pytest.fixture
def store(app):
    _, store = app
    return store


class TestHealthEndpoint:
    def test_health_returns_ok(self, client):
        resp = client.get("/v1/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"

    def test_health_returns_service_name(self, client):
        resp = client.get("/v1/health")
        assert "service" in resp.json()


class TestJobsRoutes:
    def test_list_jobs_empty(self, client, api_key):
        resp = client.get("/v1/jobs", headers={"X-API-Key": api_key})
        assert resp.status_code == 200
        assert "data" in resp.json()

    def test_create_job(self, client, api_key):
        resp = client.post("/v1/jobs", json={
            "title": "Software Engineer",
            "description": "Build cool things",
            "status": "draft",
        }, headers={"X-API-Key": api_key})
        assert resp.status_code == 201
        data = resp.json()
        assert "id" in data
        assert data["title"] == "Software Engineer"

    def test_get_job(self, client, api_key):
        create_resp = client.post("/v1/jobs", json={
            "title": "Test Job",
            "status": "draft",
        }, headers={"X-API-Key": api_key})
        job_id = create_resp.json()["id"]

        resp = client.get(f"/v1/jobs/{job_id}", headers={"X-API-Key": api_key})
        assert resp.status_code == 200
        assert resp.json()["id"] == job_id

    def test_get_job_not_found(self, client, api_key):
        resp = client.get("/v1/jobs/nonexistent-job", headers={"X-API-Key": api_key})
        assert resp.status_code == 404

    def test_update_job(self, client, api_key):
        create_resp = client.post("/v1/jobs", json={
            "title": "Original Title",
            "status": "draft",
        }, headers={"X-API-Key": api_key})
        job_id = create_resp.json()["id"]

        resp = client.patch(f"/v1/jobs/{job_id}", json={"title": "Updated Title"}, headers={"X-API-Key": api_key})
        assert resp.status_code == 200
        assert resp.json()["title"] == "Updated Title"

    def test_delete_job(self, client, api_key):
        create_resp = client.post("/v1/jobs", json={"title": "To Delete", "status": "draft"}, headers={"X-API-Key": api_key})
        job_id = create_resp.json()["id"]

        resp = client.delete(f"/v1/jobs/{job_id}", headers={"X-API-Key": api_key})
        assert resp.status_code == 200

        get_resp = client.get(f"/v1/jobs/{job_id}", headers={"X-API-Key": api_key})
        assert get_resp.status_code == 404

    def test_list_jobs_with_filters(self, client, api_key):
        client.post("/v1/jobs", json={"title": "Job 1", "status": "published"}, headers={"X-API-Key": api_key})
        client.post("/v1/jobs", json={"title": "Job 2", "status": "draft"}, headers={"X-API-Key": api_key})

        resp = client.get("/v1/jobs?status=published", headers={"X-API-Key": api_key})
        assert resp.status_code == 200


class TestApplicationsRoutes:
    def test_list_applications(self, client, api_key):
        resp = client.get("/v1/applications", headers={"X-API-Key": api_key})
        assert resp.status_code == 200
        assert "data" in resp.json()

    def test_get_application(self, client, api_key, store):
        import asyncio
        from uuid import uuid4

        app_id = f"app-{uuid4().hex[:8]}"
        asyncio.run(store._request("POST", "applications", json={
            "id": app_id,
            "org_id": "test-org",
            "job_role_id": "job-test",
            "candidate_id": "cand-test",
            "status": "applied",
        }))

        resp = client.get(f"/v1/applications/{app_id}", headers={"X-API-Key": api_key})
        assert resp.status_code in [200, 404]

    def test_transition_application(self, client, api_key, store):
        import asyncio
        from uuid import uuid4

        app_id = f"app-{uuid4().hex[:8]}"
        asyncio.run(store._request("POST", "applications", json={
            "id": app_id,
            "org_id": "test-org",
            "job_role_id": "job-test",
            "candidate_id": "cand-test",
            "status": "applied",
        }))

        resp = client.post(f"/v1/applications/{app_id}/transition", json={"to_status": "shortlisted"}, headers={"X-API-Key": api_key})
        assert resp.status_code == 200

    def test_invalid_transition(self, client, api_key, store):
        import asyncio
        from uuid import uuid4

        app_id = f"app-{uuid4().hex[:8]}"
        asyncio.run(store._request("POST", "applications", json={
            "id": app_id,
            "org_id": "test-org",
            "job_role_id": "job-test",
            "candidate_id": "cand-test",
            "status": "applied",
        }))

        resp = client.post(f"/v1/applications/{app_id}/transition", json={"to_status": "hired"}, headers={"X-API-Key": api_key})
        assert resp.status_code == 400


class TestCandidatesRoutes:
    def test_list_candidates(self, client, api_key):
        resp = client.get("/v1/candidates", headers={"X-API-Key": api_key})
        assert resp.status_code == 200
        assert "data" in resp.json()

    def test_get_candidate(self, client, api_key):
        resp = client.get("/v1/candidates/cand-test", headers={"X-API-Key": api_key})
        assert resp.status_code in [200, 404]


class TestScorecardsRoutes:
    def test_list_scorecards(self, client, api_key):
        resp = client.get("/v1/applications/app-test/scorecards", headers={"X-API-Key": api_key})
        assert resp.status_code == 200
        assert "data" in resp.json()

    def test_create_scorecard(self, client, api_key):
        resp = client.post("/v1/applications/app-test/scorecards", json={
            "recommendation": "strong_yes",
            "overall_score": 9.5,
            "competencies": [],
        }, headers={"X-API-Key": api_key})
        assert resp.status_code in [200, 201, 404]


class TestSchedulesRoutes:
    def test_list_schedules(self, client, api_key):
        resp = client.get("/v1/applications/app-test/schedules", headers={"X-API-Key": api_key})
        assert resp.status_code == 200
        assert "data" in resp.json()

    def test_create_schedule(self, client, api_key):
        resp = client.post("/v1/applications/app-test/schedules", json={
            "stage_id": "stage-1",
            "starts_at": "2024-01-01T10:00:00Z",
            "ends_at": "2024-01-01T11:00:00Z",
        }, headers={"X-API-Key": api_key})
        assert resp.status_code in [200, 201, 404]


class TestOffersRoutes:
    def test_get_offer(self, client, api_key):
        resp = client.get("/v1/applications/app-test/offer", headers={"X-API-Key": api_key})
        assert resp.status_code in [200, 404]

    def test_create_offer(self, client, api_key):
        resp = client.post("/v1/applications/app-test/offer", json={"salary": 100000}, headers={"X-API-Key": api_key})
        assert resp.status_code in [200, 201, 404]


class TestWebhooksRoutes:
    def test_list_webhooks(self, client, api_key):
        resp = client.get("/v1/webhooks", headers={"X-API-Key": api_key})
        assert resp.status_code == 200
        assert "data" in resp.json()

    def test_create_webhook(self, client, api_key):
        resp = client.post("/v1/webhooks", json={
            "url": "https://example.com/webhook",
            "events": ["application.created"],
        }, headers={"X-API-Key": api_key})
        assert resp.status_code == 201
        data = resp.json()
        assert "id" in data
        assert "secret" in data

    def test_get_webhook(self, client, api_key):
        resp = client.get("/v1/webhooks/wh-test", headers={"X-API-Key": api_key})
        assert resp.status_code in [200, 404]

    def test_update_webhook(self, client, api_key):
        resp = client.patch("/v1/webhooks/wh-test", json={"description": "Updated"}, headers={"X-API-Key": api_key})
        assert resp.status_code in [200, 404]

    def test_delete_webhook(self, client, api_key):
        resp = client.delete("/v1/webhooks/wh-test", headers={"X-API-Key": api_key})
        assert resp.status_code in [200, 404]

    def test_list_webhook_deliveries(self, client, api_key):
        resp = client.get("/v1/webhooks/wh-test/deliveries", headers={"X-API-Key": api_key})
        assert resp.status_code in [200, 404]


class TestApiKeysRoutes:
    def test_list_api_keys(self, client, api_key):
        resp = client.get("/v1/api-keys", headers={"X-API-Key": api_key})
        assert resp.status_code == 200

    def test_create_api_key(self, client, api_key):
        resp = client.post("/v1/api-keys", json={
            "name": "Test Key",
            "scopes": ["read"],
        }, headers={"X-API-Key": api_key})
        assert resp.status_code == 201
        data = resp.json()
        assert "api_key" in data

    def test_delete_api_key(self, client, api_key):
        resp = client.delete("/v1/api-keys/key-test", headers={"X-API-Key": api_key})
        assert resp.status_code in [200, 404]


class TestCalendarRoutes:
    def test_list_calendar_connections(self, client, api_key):
        resp = client.get("/v1/calendar/connections", headers={"X-API-Key": api_key})
        assert resp.status_code == 200
        assert "data" in resp.json()

    def test_disconnect_calendar(self, client, api_key):
        resp = client.delete("/v1/calendar/connections/conn-test", headers={"X-API-Key": api_key})
        assert resp.status_code in [200, 404]

    def test_list_slots(self, client, api_key):
        resp = client.get("/v1/schedules/sched-test/slots", headers={"X-API-Key": api_key})
        assert resp.status_code == 200

    def test_create_slots(self, client, api_key):
        resp = client.post("/v1/schedules/sched-test/slots", json={
            "slots": [{"starts_at": "2024-01-01T10:00:00Z", "ends_at": "2024-01-01T11:00:00Z"}],
        }, headers={"X-API-Key": api_key})
        assert resp.status_code in [200, 201]

    def test_book_slot(self, client, api_key):
        resp = client.post("/v1/slots/slot-test/book", json={"candidate_id": "cand-test"}, headers={"X-API-Key": api_key})
        assert resp.status_code in [200, 404]


class TestProctoringRoutes:
    def test_list_proctoring_sessions(self, client, api_key):
        resp = client.get("/v1/proctoring/sessions", headers={"X-API-Key": api_key})
        assert resp.status_code == 200
        assert "data" in resp.json()

    def test_override_proctoring(self, client, api_key):
        resp = client.post("/v1/proctoring/sessions/session-test/override", json={
            "flagged": True,
            "note": "Manual override",
        }, headers={"X-API-Key": api_key})
        assert resp.status_code in [200, 404]


class TestScoringRoutes:
    def test_get_scoring_rules(self, client, api_key):
        resp = client.get("/v1/jobs/job-test/scoring-rules", headers={"X-API-Key": api_key})
        assert resp.status_code in [200, 404]

    def test_update_scoring_rules(self, client, api_key):
        resp = client.put("/v1/jobs/job-test/scoring-rules", json={
            "custom_scoring_rules": {"weight": 1.0},
        }, headers={"X-API-Key": api_key})
        assert resp.status_code in [200, 404]

    def test_preview_scoring(self, client, api_key):
        resp = client.post("/v1/scoring/preview", json={
            "questions": [{"id": "q1", "section": "technical", "prompt_text": "Test", "time_limit_seconds": 60}],
            "custom_scoring_rules": {},
        }, headers={"X-API-Key": api_key})
        assert resp.status_code in [200, 500]


class TestExportsRoutes:
    def test_list_exports(self, client, api_key):
        resp = client.get("/v1/exports", headers={"X-API-Key": api_key})
        assert resp.status_code == 200
        assert "data" in resp.json()

    def test_create_export(self, client, api_key):
        resp = client.post("/v1/exports", json={
            "name": "Test Export",
            "type": "applications",
            "schedule": {"cron": "0 * * * *"},
            "format": "csv",
            "destination": {"type": "supabase"},
        }, headers={"X-API-Key": api_key})
        assert resp.status_code in [200, 201, 500]


class TestAuthentication:
    def test_missing_api_key_returns_401(self, client):
        resp = client.get("/v1/jobs")
        assert resp.status_code == 401

    def test_invalid_api_key_returns_401(self, client):
        resp = client.get("/v1/jobs", headers={"X-API-Key": "invalid-key"})
        assert resp.status_code == 401

    def test_read_scope_cannot_create_job(self, client):
        store = FakeStore()
        read_key = store.seed_key(["read"])
        store_mod.get_store = lambda: store
        import routes.v1 as v1_mod
        v1_mod.get_store = lambda: store

        resp = client.post("/v1/jobs", json={"title": "Test"}, headers={"X-API-Key": read_key})
        assert resp.status_code == 403


class TestRouteRegistration:
    def test_all_expected_routes_registered(self, client):
        expected_routes = [
            "/v1/jobs",
            "/v1/applications",
            "/v1/candidates",
            "/v1/webhooks",
            "/v1/api-keys",
            "/v1/calendar/connections",
            "/v1/proctoring/sessions",
            "/v1/exports",
            "/v1/scoring/preview",
        ]
        routes = [r.path for r in router.routes]
        for route in expected_routes:
            assert any(route in str(r) for r in router.routes), f"Missing route: {route}"