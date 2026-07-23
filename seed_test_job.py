import asyncio
import uuid
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'apps/api')))

from interview.supabase_store import get_store
from interview.question_audio import render_questions_for_job

async def seed_interview():
    store = get_store()
    
    orgs = await store._request("GET", "organizations")
    if not orgs:
        print("No organizations found, creating one.")
        org_id = "test-org"
        await store._request("POST", "organizations", json={"id": org_id, "name": "Test Org"})
    else:
        org_id = orgs[0]["id"]
        
    job_id = f"job-{uuid.uuid4()}"
    print(f"Creating job {job_id}")
    await store._request("POST", "job_roles", json={
        "id": job_id,
        "org_id": org_id,
        "title": "Software Engineer (Short Test)",
        "description": "A test interview with 3 mandatory questions.",
        "status": "live",
        "passing_score": 50,
        "interview_question_count": 3
    })
    
    q1_id = f"q-{uuid.uuid4()}"
    q2_id = f"q-{uuid.uuid4()}"
    q3_id = f"q-{uuid.uuid4()}"
    
    print("Creating questions...")
    await store._request("POST", "questions", json=[
        {
            "id": q1_id,
            "job_role_id": job_id,
            "question_bank_id": "test-bank",
            "section": "technical",
            "prompt_text": "Can you describe a time when you had to optimize the performance of a web application? What steps did you take?",
            "ideal_answer_notes": "Mentioned profiling, indexing, caching, or reducing network requests.",
            "order_index": 1,
            "is_mandatory": True,
            "time_limit_seconds": 120,
            "score_threshold": 60
        },
        {
            "id": q2_id,
            "job_role_id": job_id,
            "question_bank_id": "test-bank",
            "section": "technical",
            "prompt_text": "Explain the difference between a process and a thread in an operating system.",
            "ideal_answer_notes": "Processes have separate memory spaces, threads share memory. Threads are lighter weight.",
            "order_index": 2,
            "is_mandatory": True,
            "time_limit_seconds": 120,
            "score_threshold": 60
        },
        {
            "id": q3_id,
            "job_role_id": job_id,
            "question_bank_id": "test-bank",
            "section": "hr",
            "prompt_text": "Why do you want to work for our company, and where do you see yourself in five years?",
            "ideal_answer_notes": "Candidate shows enthusiasm and a clear career trajectory.",
            "order_index": 3,
            "is_mandatory": True,
            "time_limit_seconds": 120,
            "score_threshold": 50
        }
    ])
    
    print("Rendering audio for questions...")
    results = await render_questions_for_job(store, [q1_id, q2_id, q3_id])
    print("Done! Audio URLs:")
    print(results)
    print(f"Test Job created. ID: {job_id}")

if __name__ == "__main__":
    asyncio.run(seed_interview())
