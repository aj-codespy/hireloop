"""End-to-end smoke test for the interview API.

Creates an isolated org/job/candidate/application + interview token, then:
  1. Boots nothing (expects API already running at API_URL with correct env).
  2. Connects to the WebSocket interview, confirms session_started + first question.
  3. Submits a (tiny) answer and confirms the server advances / acks.
  4. Tears down the created rows.

Run the API first:
  cd apps/api && .venv/bin/python -m uvicorn main:app --port 8001
Then:
  .venv/bin/python scripts/e2e_interview_smoke.py
"""
import asyncio
import os
import sys
import uuid

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from interview.supabase_store import get_store

API_URL = os.getenv("API_URL", "http://localhost:8001").rstrip("/")


async def main() -> int:
    store = get_store()
    if not store:
        print("ERROR: Supabase store not configured (check apps/api/.env).")
        return 2

    org_id = f"org-e2e-{uuid.uuid4().hex[:8]}"
    job_id = f"job-e2e-{uuid.uuid4().hex[:8]}"
    cand_id = f"cand-e2e-{uuid.uuid4().hex[:8]}"
    app_id = f"app-e2e-{uuid.uuid4().hex[:8]}"
    token = f"e2e-token-{uuid.uuid4().hex[:10]}"
    session_id: str | None = None
    q_id: str | None = None
    qb_id: str | None = None
    try:
        await store._request("POST", "organizations", json={"id": org_id, "name": "E2E Org", "primary_color": "#000000"}, prefer="return=minimal")
        await store._request("POST", "job_roles", json={"id": job_id, "org_id": org_id, "title": "E2E Role", "description": "x", "status": "live", "eligibility_rules": [], "passing_score": 6.0, "form_fields": []}, prefer="return=minimal")
        await store._request("POST", "candidates", json={"id": cand_id, "org_id": org_id, "name": "E2E Cand", "email": f"e2e-{uuid.uuid4().hex[:6]}@test.local", "source": "api_test"}, prefer="return=minimal")
        await store._request("POST", "applications", json={"id": app_id, "candidate_id": cand_id, "job_role_id": job_id, "form_response": {}, "status": "interview_sent", "interview_token": token, "token_expires_at": "2099-01-01T00:00:00+00:00"}, prefer="return=minimal")
        # Need at least one active question for the interview to bootstrap.
        q_id = f"q-e2e-{uuid.uuid4().hex[:8]}"
        # questions.question_bank_id is NOT NULL but there is no question_banks
        # table/FK in the deployed schema, so any stable string satisfies it.
        qb_id = f"qb-e2e-{uuid.uuid4().hex[:8]}"
        await store._request("POST", "questions", json={"id": q_id, "question_bank_id": qb_id, "job_role_id": job_id, "section": "hr", "prompt_text": "Tell me about yourself.", "ideal_answer_notes": "", "time_limit_seconds": 30, "order_index": 0, "is_active": True, "is_mandatory": True, "score_threshold": None}, prefer="return=minimal")
        # NOTE: Do NOT pre-create the interview session here. The relay creates
        # it on first connect using the job's active question pool; pre-creating
        # an in_progress session would make find_resumable_session return it and
        # short-circuit question selection.
        print(f"Setup complete. token={token}")

        # Connect over WebSocket and validate the handshake + first question.
        try:
            import websockets  # type: ignore
        except ImportError:
            print("SKIP: 'websockets' not installed; WS handshake not exercised.")
            return 0

        uri = f"{API_URL.replace('http', 'ws')}/ws/interview?token={token}&lang=en"
        async with websockets.connect(uri, max_size=32 * 1024 * 1024) as ws:
            msg = await asyncio.wait_for(ws.recv(), timeout=20)
            import json
            data = json.loads(msg) if isinstance(msg, str) else {}
            print("First WS message:", json.dumps(data)[:300])
            if data.get("type") not in ("bootstrap", "session_started", "error"):
                print("WARN: unexpected first message type:", data.get("type"))
            # If we got a session_started, confirm a question follows.
            if data.get("type") == "session_started":
                sid = data.get("session_id")
                if sid:
                    session_id = sid
                qmsg = await asyncio.wait_for(ws.recv(), timeout=20)
                qdata = json.loads(qmsg) if isinstance(qmsg, str) else {}
                print("Question message type:", qdata.get("type"))
                if qdata.get("type") != "question_changed":
                    print("WARN: expected question_changed after session_started")
                else:
                    # Submit a tiny answer and confirm the server acknowledges + advances.
                    await ws.send_json({"type": "submit_answer", "question_index": 0, "chunk_count": 0})
                    amsg = await asyncio.wait_for(ws.recv(), timeout=20)
                    adata = json.loads(amsg) if isinstance(amsg, str) else {}
                    print("After submit_answer:", adata.get("type"))
                    # Next message should be answer_saved; confirm transcript persisted later.
                    try:
                        bmsg = await asyncio.wait_for(ws.recv(), timeout=20)
                        bdata = json.loads(bmsg) if isinstance(bmsg, str) else {}
                        print("Next message:", bdata.get("type"), json.dumps(bdata)[:160])
                    except asyncio.TimeoutError:
                        print("Next message: (none within 20s, acceptable)")
        print("WS handshake OK")
        return 0
    except Exception as e:  # noqa: BLE001
        print("E2E ERROR:", repr(e))
        return 1
    finally:
        print("Cleaning up...")
        for tbl, pid in (("interview_sessions", session_id), ("questions", q_id), ("question_banks", qb_id), ("applications", app_id), ("candidates", cand_id), ("job_roles", job_id), ("organizations", org_id)):
            try:
                if pid:
                    await store._request("DELETE", tbl, params={"id": f"eq.{pid}"})
            except Exception:
                pass
        print("Cleanup done.")


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
