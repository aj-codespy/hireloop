import httpx
import json

async def main():
    url = "https://xiniaecawuieywlnopry.supabase.co/rest/v1/"
    headers = {
        "apikey": "sb_secret_Cxx4d_CSXL3mFq6dUUyXLg_BjJsRSLX",
        "Authorization": "Bearer sb_secret_Cxx4d_CSXL3mFq6dUUyXLg_BjJsRSLX"
    }
    
    async with httpx.AsyncClient() as client:
        res = await client.get(url, headers=headers)
        if res.status_code >= 400:
            print(f"Error: {res.status_code} {res.text}")
            return
        
        schema = res.json()
        print("Paths / functions available in PostgREST:")
        for path in sorted(schema.get("paths", {}).keys()):
            print(path)

import asyncio
asyncio.run(main())
