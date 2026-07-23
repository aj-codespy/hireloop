import asyncio
import os
import httpx
from dotenv import load_dotenv

load_dotenv("apps/api/.env")

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SECRET = os.environ.get("SUPABASE_SECRET_KEY")

async def test():
    headers = {
        "apikey": SUPABASE_SECRET,
        "Authorization": f"Bearer {SUPABASE_SECRET}",
    }
    
    url = f"{SUPABASE_URL}/storage/v1/object/list/interview-answers"
    body = {"prefix": "sess-e414cf84-e2ba-4c55-b919-e95a1cfd9255/2/", "limit": 100}
    
    async with httpx.AsyncClient() as client:
        res = await client.post(url, headers=headers, json=body)
        print("List:", res.status_code, [f["name"] for f in res.json()])

asyncio.run(test())
