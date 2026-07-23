import asyncio
from interview.supabase_store import get_store

async def main():
    store = get_store()
    rows = await store._request("GET", "interview_sessions", params={"order": "created_at.desc", "limit": "1"})
    print("TRANSCRIPTS:")
    print(rows[0].get("transcript"))
    print("SCORES:")
    print(rows[0].get("overall_score"))

asyncio.run(main())
