import asyncio
import json
from types import SimpleNamespace
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

import main as main_mod
from interview import answer_upload as au_mod
from interview import supabase_store as sb_mod


class MinimalStore:
    async def validate_interview_upload(self, token, session_id, question_index):
        # allow the upload for the requested question index
        return {"current_question_index": question_index}

    async def load_application_for_interview(self, token: str):
        # return a minimal context object that the websocket handler accepts
        return SimpleNamespace(application_id=f"app-{token}", candidate_id="cand-1", job_role_id="job-1")


@pytest.fixture(autouse=True)
def patch_store(monkeypatch):
    store = MinimalStore()
    # ensure routes and main use this store
    monkeypatch.setattr(sb_mod, "get_store", lambda: store)
    # patch references that were imported at module load time
    import routes.v1 as v1_mod
    monkeypatch.setattr(v1_mod, "get_store", lambda: store)
    monkeypatch.setattr(main_mod, "get_store", lambda: store)
    return store


@pytest.fixture
def client():
    return TestClient(main_mod.app)


def test_chunk_upload_route(client, monkeypatch):
    # stub out the actual upload implementation to avoid external HTTP calls
    async def fake_upload(session_id, question_index, chunk_index, data, mime_type="audio/webm"):
        return f"{session_id}/{question_index}/{chunk_index:04d}.webm"

    monkeypatch.setattr(au_mod, "upload_answer_chunk", fake_upload)
    # main.py imported upload_answer_chunk at module load; patch that reference too
    import main as _main
    monkeypatch.setattr(_main, "upload_answer_chunk", fake_upload)

    headers = {
        "X-Interview-Token": "tok-1",
        "X-Session-Id": "sess-1",
        "X-Question-Index": "0",
        "X-Chunk-Index": "0",
    }
    resp = client.post("/interview/answers/chunk", data=b"audio-bytes", headers=headers)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["ok"] is True
    assert body["path"].endswith("0000.webm")


def test_websocket_connect_accepts_valid_token(client):
    with client.websocket_connect("/ws/interview?token=testtok&lang=en") as ws:
        msg = ws.receive_json()
        assert msg.get("type") == "bootstrap"


def test_create_scorecard_end_to_end(monkeypatch, client):
    # create a simple fake store that records posted scorecards
    class ScoreStore(MinimalStore):
        def __init__(self):
            self.scorecards = {}
            self._api_keys = {}
        
        def seed_key(self, scopes):
            from interview.api_keys import generate_key
            raw, prefix, key_hash = generate_key()
            kid = f"key-test"
            entry = {"id": kid, "org_id": "org_test", "key_hash": key_hash, "scopes": scopes, "active": True, "expires_at": None}
            self._api_keys[kid] = entry
            return raw

        async def _request(self, method: str, table: str, params=None, json=None):
            # api_keys lookup used by get_auth
            if table == "api_keys" and params and params.get("active") == "eq.true":
                return list(self._api_keys.values())
            if table == "scorecards" and method == "POST":
                sid = json["id"]
                self.scorecards[sid] = json
                return [json]
            if table == "applications" and method == "GET":
                aid = params.get("id", "").replace("eq.", "")
                return [{"id": aid, "status": "interviewed", "job_role_id": "j", "candidate_id": "c", "org_id": "org_test"}]
            return [{}]

        async def mark_api_key_used(self, key_id: str) -> None:
            # no-op for tests
            return None

    store = ScoreStore()
    raw = store.seed_key(["admin"])  # returns raw API key
    monkeypatch.setattr(sb_mod, "get_store", lambda: store)
    monkeypatch.setattr(main_mod, "get_store", lambda: store)
    import routes.v1 as v1_mod
    monkeypatch.setattr(v1_mod, "get_store", lambda: store)

    headers = {"X-API-Key": raw}

    # create application id and submit scorecard
    app_id = "app-e2e"
    payload = {"recommendation": "strong_yes", "overall_score": 9.0, "competencies": [{"name": "coding", "score": 9}], "notes": "Good"}
    resp = client.post(f"/v1/applications/{app_id}/scorecards", json=payload, headers=headers)
    assert resp.status_code == 200, resp.text
    js = resp.json()
    assert js["recommendation"] == "strong_yes"
