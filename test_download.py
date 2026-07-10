import asyncio
import httpx
from config import SUPABASE_SECRET_KEY, SUPABASE_URL

async def test():
    bucket = "interview-answers"
    path = "sess-9c1e6ac6-c1a5-463b-bf8e-f73c99edcb25/2/0000.webm"
    
    headers = {
        "apikey": SUPABASE_SECRET_KEY,
        "Authorization": f"Bearer {SUPABASE_SECRET_KEY}",
    }
    
    url1 = f"{SUPABASE_URL.rstrip('/')}/storage/v1/object/{bucket}/{path}"
    url2 = f"{SUPABASE_URL.rstrip('/')}/storage/v1/object/authenticated/{bucket}/{path}"
    
    async with httpx.AsyncClient() as client:
        res1 = await client.get(url1, headers=headers)
        print("URL1:", res1.status_code, res1.text)
        
        res2 = await client.get(url2, headers=headers)
        print("URL2:", res2.status_code, res2.text)

asyncio.run(test())
