#!/usr/bin/env python3
"""Verification script for concurrent updates to proctoring event logs."""

import asyncio
import sys
import uuid
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

from interview.supabase_store import get_store

load_dotenv()


async def verify_concurrency() -> bool:
    print("Initializing Supabase store...")
    store = get_store()
    if not store:
        print("Error: Supabase store is not configured or disabled.")
        return False

    # 1. Setup test session metadata
    token = f"concurrency-token-{uuid.uuid4().hex[:8]}"
    org_id = f"org-concurrency-{uuid.uuid4().hex[:8]}"
    job_id = f"job-concurrency-{uuid.uuid4().hex[:8]}"
    cand_id = f"cand-concurrency-{uuid.uuid4().hex[:8]}"
    app_id = f"app-concurrency-{uuid.uuid4().hex[:8]}"
    session_id = None

    try:
        # Create test organization
        print(f"Creating test organization: {org_id}")
        await store._request(
            "POST",
            "organizations",
            json={"id": org_id, "name": "Concurrency Test Org", "primary_color": "#FF5733"},
            prefer="return=minimal",
        )

        # Create test job role
        print(f"Creating test job: {job_id}")
        await store._request(
            "POST",
            "job_roles",
            json={
                "id": job_id,
                "org_id": org_id,
                "title": "Concurrency Analyst",
                "description": "Verify DB concurrency",
                "status": "live",
                "eligibility_rules": [],
                "passing_score": 6.0,
                "form_fields": [],
            },
            prefer="return=minimal",
        )

        # Create test candidate
        print(f"Creating test candidate: {cand_id}")
        await store._request(
            "POST",
            "candidates",
            json={
                "id": cand_id,
                "org_id": org_id,
                "name": "Concurrency Tester",
                "email": f"concurrency-{uuid.uuid4().hex[:6]}@test.local",
                "source": "api_test",
            },
            prefer="return=minimal",
        )

        # Create test application
        print(f"Creating test application: {app_id}")
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

        # Create test interview session
        print("Creating test interview session...")
        session_id = await store.create_session(app_id)
        print(f"Test session created: {session_id}")

        # Verify initial proctoring log state
        rows = await store._request(
            "GET",
            "interview_sessions",
            params={"id": f"eq.{session_id}", "select": "proctoring_log"},
        )
        if not rows:
            print("Error: Could not retrieve created session from database.")
            return False

        initial_log = rows[0].get("proctoring_log") or []
        print(f"Initial proctoring log length: {len(initial_log)} (Expected: 0)")
        if len(initial_log) != 0:
            print("Warning: Initial proctoring log is not empty!")

        # 2. Spawn 20 concurrent requests calling `append_proctoring_event`
        num_requests = 20
        print(f"Spawning {num_requests} concurrent requests to append proctoring events...")

        async def append_event_task(index: int):
            await store.append_proctoring_event(
                session_id=session_id,
                event_type="test_concurrency",
                severity="low",
                detail=f"Concurrent request #{index}",
                question_index=0,
            )

        # Execute concurrently using asyncio.gather
        await asyncio.gather(*(append_event_task(i) for i in range(num_requests)))
        print("All concurrent requests completed.")

        # 3. Verify resulting proctoring log array in the database has exactly 20 entries
        rows_after = await store._request(
            "GET",
            "interview_sessions",
            params={"id": f"eq.{session_id}", "select": "proctoring_log"},
        )
        if not rows_after:
            print("Error: Could not retrieve session state after concurrent updates.")
            return False

        final_log = rows_after[0].get("proctoring_log") or []
        final_len = len(final_log)
        print(f"Final proctoring log length: {final_len} (Expected: {num_requests})")

        if final_len == num_requests:
            print("\nSUCCESS: No updates were overwritten! Concurrency verification PASSED.")
            return True
        else:
            print(f"\nFAILURE: Expected {num_requests} entries, but found {final_len}. Some updates were overwritten.")
            return False

    except Exception as e:
        print(f"An error occurred during verification: {e}")
        import traceback
        traceback.print_exc()
        return False

    finally:
        # Cleanup created records in reverse order
        print("\nCleaning up test database records...")
        try:
            if session_id:
                print(f"Deleting session {session_id}")
                await store._request("DELETE", "interview_sessions", params={"id": f"eq.{session_id}"})
            print(f"Deleting application {app_id}")
            await store._request("DELETE", "applications", params={"id": f"eq.{app_id}"})
            print(f"Deleting candidate {cand_id}")
            await store._request("DELETE", "candidates", params={"id": f"eq.{cand_id}"})
            print(f"Deleting job {job_id}")
            await store._request("DELETE", "job_roles", params={"id": f"eq.{job_id}"})
            print(f"Deleting organization {org_id}")
            await store._request("DELETE", "organizations", params={"id": f"eq.{org_id}"})
            print("Cleanup completed.")
        except Exception as cleanup_err:
            print(f"Error during cleanup: {cleanup_err}")


if __name__ == "__main__":
    success = asyncio.run(verify_concurrency())
    if not success:
        sys.exit(1)
    sys.exit(0)
