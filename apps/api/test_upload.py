import asyncio
import httpx
from config import SUPABASE_SECRET_KEY, SUPABASE_URL

async def test():
    bucket = "interview-answers"
    path = "test-session/0/0000.webm"
    data = b"fake audio data"
    
    upload_url = f"{SUPABASE_URL.rstrip('/')}/storage/v1/object/{bucket}/{path}"
    headers = {
        "apikey": SUPABASE_SECRET_KEY,
        "Authorization": f"Bearer {SUPABASE_SECRET_KEY}",
        "Content-Type": "audio/webm",
        "x-upsert": "true",
    }
    async with httpx.AsyncClient() as client:
        res = await client.post(upload_url, headers=headers, content=data)
        print("POST URL:", upload_url)
        print("POST STATUS:", res.status_code, res.text)
        
asyncio.run(test())
