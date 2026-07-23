import asyncio
import uuid
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
load_dotenv()

from interview.supabase_store import get_store

async def test_constraints():
    store = get_store()
    org_id = f"org-test-{uuid.uuid4().hex[:8]}"
    job_id = f"job-test-{uuid.uuid4().hex[:8]}"
    cand_id = f"cand-test-{uuid.uuid4().hex[:8]}"
    app_id = f"app-test-{uuid.uuid4().hex[:8]}"
    
    try:
        # Create test organization
        await store._request(
            "POST", "organizations",
            json={"id": org_id, "name": "Constraint Test Org", "primary_color": "#FF5733"},
            prefer="return=minimal",
        )
        # Create test job role
        await store._request(
            "POST", "job_roles",
            json={
                "id": job_id, "org_id": org_id, "title": "Constraint Analyst",
                "description": "Verify DB check constraints", "status": "live",
                "eligibility_rules": [], "passing_score": 6.0, "form_fields": []
            },
            prefer="return=minimal",
        )
        # Create test candidate
        await store._request(
            "POST", "candidates",
            json={
                "id": cand_id, "org_id": org_id, "name": "Constraint Tester",
                "email": f"constraint-{uuid.uuid4().hex[:6]}@test.local", "source": "api_test"
            },
            prefer="return=minimal",
        )
        
        # 1. Attempt to insert invalid status 'invalid_status_123'
        print("Inserting application with invalid status...")
        try:
            await store._request(
                "POST", "applications",
                json={
                    "id": app_id,
                    "candidate_id": cand_id,
                    "job_role_id": job_id,
                    "form_response": {},
                    "status": "invalid_status_123",
                    "interview_token": f"token-{uuid.uuid4().hex[:8]}",
                    "token_expires_at": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
                },
                prefer="return=minimal",
            )
            print("WARNING: Application with invalid status was inserted successfully! Constraint does NOT exist.")
            # Clean up the invalid app
            await store._request("DELETE", "applications", params={"id": f"eq.{app_id}"})
            return False
        except Exception as e:
            if "status_check" in str(e).lower() or "new row for relation" in str(e).lower() or "violates check constraint" in str(e).lower():
                print("SUCCESS: Database rejected invalid status with constraint error as expected:", e)
                return True
            else:
                print("FAILED: Unexpected exception:", e)
                return False
                
    finally:
        # Cleanup
        try:
            await store._request("DELETE", "candidates", params={"id": f"eq.{cand_id}"})
            await store._request("DELETE", "job_roles", params={"id": f"eq.{job_id}"})
            await store._request("DELETE", "organizations", params={"id": f"eq.{org_id}"})
        except Exception as err:
            print("Cleanup error:", err)

if __name__ == "__main__":
    import sys
    sys.path.append("apps/api")
    asyncio.run(test_constraints())
