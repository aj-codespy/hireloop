#!/usr/bin/env python3
"""End-to-end interview API tests (Gemini + Supabase + WebSocket)."""
from __future__ import annotations

import asyncio
import json
import sys
import uuid
from datetime import datetime, timezone, timedelta

import httpx
import websockets
from dotenv import load_dotenv

from config import GEMINI_API_KEY, SCORING_MODEL, PORT, supabase_enabled
from interview.questions import Question
from interview.scoring import score_interview
from interview.session import TranscriptEntry
from interview.supabase_store import get_store

load_dotenv()

passed = 0
failed = 0


def ok(name: str) -> None:
    global passed
    passed += 1
    print(f"  ✓ {name}")


def fail(name: str, detail: str) -> None:
    global failed
    failed += 1
    print(f"  ✗ {name}: {detail}")


async def test_gemini_scoring() -> None:
    print("\n1. Gemini Flash scoring")
    if not GEMINI_API_KEY:
        fail("GEMINI_API_KEY set", "missing")
        return
    ok("GEMINI_API_KEY set")

    questions = [
        Question(
            id="q-test",
            section="technical",
            prompt_text="Describe REST API design.",
            ideal_answer_notes="Mentions endpoints, auth, errors",
            time_limit_seconds=90,
        )
    ]
    entries = [
        TranscriptEntry(speaker="ai", text="Describe REST API design.", timestamp_offset_seconds=0, question_id="q-test"),
        TranscriptEntry(
            speaker="candidate",
            text="I design REST APIs with clear resources, JWT auth, and consistent error codes.",
            timestamp_offset_seconds=8,
            question_id="q-test",
        ),
    ]
    try:
        result = score_interview(questions, entries, passing_score=6.0)
        total = result["overall_score"].get("totalScore")
        if total is None:
            fail("scoring returns totalScore", str(result))
        else:
            ok(f"scoring works (score={total}/10, passed={result['passed']})")
    except Exception as exc:
        fail("scoring API call", str(exc))


async def test_websocket_flow() -> None:
    print("\n3. WebSocket interview flow")
    store = get_store()
    if not store:
        fail("supabase store", "not configured")
        return

    token = f"e2e-{uuid.uuid4().hex[:10]}"
    org_id = f"org-e2e-{uuid.uuid4().hex[:8]}"
    job_id = f"job-e2e-{uuid.uuid4().hex[:8]}"
    cand_id = f"cand-e2e-{uuid.uuid4().hex[:8]}"
    app_id = f"app-e2e-{uuid.uuid4().hex[:8]}"
    q_id = f"q-e2e-{uuid.uuid4().hex[:8]}"

    try:
        await store._request("POST", "organizations", json={"id": org_id, "name": "E2E Org", "primary_color": "#000"}, prefer="return=minimal")
        await store._request(
            "POST",
            "job_roles",
            json={"id": job_id, "org_id": org_id, "title": "E2E Job", "description": "t", "status": "live", "eligibility_rules": [], "passing_score": 5, "form_fields": []},
            prefer="return=minimal",
        )
        await store._request(
            "POST",
            "questions",
            json={
                "id": q_id,
                "question_bank_id": "bank-tech",
                "job_role_id": job_id,
                "section": "technical",
                "prompt_text": "What is your greatest strength?",
                "ideal_answer_notes": "Specific example",
                "order_index": 1,
                "is_active": True,
                "time_limit_seconds": 60,
            },
            prefer="return=minimal",
        )
        await store._request(
            "POST",
            "candidates",
            json={"id": cand_id, "org_id": org_id, "name": "E2E", "email": f"e2e-{uuid.uuid4().hex[:6]}@test.local", "source": "website"},
            prefer="return=minimal",
        )
        await store._request(
            "POST",
            "applications",
            json={
                "id": app_id,
                "candidate_id": cand_id,
                "job_role_id": job_id,
                "form_response": {},
                "status": "interview_sent",
                "interview_token": token,
                "token_expires_at": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
            },
            prefer="return=minimal",
        )

        api_port = PORT
        uri = f"ws://127.0.0.1:{api_port}/ws/interview?token={token}"
        events: list[dict] = []
        async with websockets.connect(uri, open_timeout=15) as ws:
            deadline = asyncio.get_event_loop().time() + 20
            while asyncio.get_event_loop().time() < deadline:
                try:
                    raw = await asyncio.wait_for(ws.recv(), timeout=15)
                except asyncio.TimeoutError:
                    break
                if isinstance(raw, bytes):
                    continue
                event = json.loads(raw)
                events.append(event)
                if event.get("type") == "session_started":
                    ok(f"session_started ({event.get('question_count')} questions)")
                if event.get("type") == "error":
                    fail("websocket session", event.get("message", "unknown"))
                    return
                if event.get("type") == "session_started":
                    await ws.send(json.dumps({"type": "stop"}))
                if event.get("type") in ("session_ended", "scoring_complete", "scoring_error"):
                    break

        types_seen = {e.get("type") for e in events}
        if "question_changed" in types_seen:
            ok("question_changed received")
        else:
            fail("question_changed", "not received")

        if "session_ended" in types_seen:
            ok("session_ended received")
        else:
            fail("session_ended", "not received")

        # Give scoring a moment if session completed
        await asyncio.sleep(2)
        rows = await store._request("GET", "interview_sessions", params={"application_id": f"eq.{app_id}", "select": "id,status,transcript"})
        if rows:
            ok(f"DB session created (status={rows[0]['status']})")
        else:
            fail("DB session", "not found")

    except Exception as exc:
        fail("websocket flow", str(exc))
    finally:
        sessions = await store._request("GET", "interview_sessions", params={"application_id": f"eq.{app_id}", "select": "id"}) or []
        for s in sessions:
            await store._request("DELETE", "interview_sessions", params={"id": f"eq.{s['id']}"})
        await store._request("DELETE", "applications", params={"id": f"eq.{app_id}"})
        await store._request("DELETE", "candidates", params={"id": f"eq.{cand_id}"})
        await store._request("DELETE", "questions", params={"job_role_id": f"eq.{job_id}"})
        await store._request("DELETE", "job_roles", params={"id": f"eq.{job_id}"})
        await store._request("DELETE", "organizations", params={"id": f"eq.{org_id}"})


async def test_api_health() -> None:
    print("\n4. API health")
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            res = await client.get(f"http://127.0.0.1:{PORT}/health")
            if res.status_code == 200:
                ok("API health endpoint")
            else:
                fail("API health", f"status {res.status_code}")
    except Exception as exc:
        fail("API health", str(exc))


async def test_demo_token() -> None:
    print("\n5. Demo seed token (demo-token-rahul)")
    store = get_store()
    if not store:
        return
    try:
        ctx = await store.load_application_by_token("demo-token-rahul")
        questions = await store.load_questions_for_job(ctx.job_role_id)
        ok(f"demo token valid ({len(questions)} questions for job)")
    except Exception as exc:
        fail("demo token", str(exc))


async def main() -> None:
    print("\n=== HireLoop Interview E2E Tests ===")
    print(f"Supabase: {'enabled' if supabase_enabled() else 'disabled'}")
    print(f"Scoring model: {SCORING_MODEL}")

    await test_api_health()
    await test_gemini_scoring()
    await test_demo_token()
    await test_websocket_flow()

    print("\n=== Results ===")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    if failed:
        print("\n❌ Some interview tests failed\n")
        sys.exit(1)
    print("\n✅ All interview tests passed\n")


if __name__ == "__main__":
    asyncio.run(main())
