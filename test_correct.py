import asyncio
import asyncpg
import sys

async def test():
    host = "db.xiniaecawuieywlnopry.supabase.co"
    
    tests = [
        # Pooler (Port 6543)
        {"port": 6543, "user": "postgres.xiniaecawuieywlnopry", "pwd": "Cxx4d_CSXL3mFq6dUUyXLg_BjJsRSLX"},
        {"port": 6543, "user": "postgres.xiniaecawuieywlnopry", "pwd": "sb_secret_Cxx4d_CSXL3mFq6dUUyXLg_BjJsRSLX"},
        # Direct (Port 5432)
        {"port": 5432, "user": "postgres", "pwd": "Cxx4d_CSXL3mFq6dUUyXLg_BjJsRSLX"},
        {"port": 5432, "user": "postgres", "pwd": "sb_secret_Cxx4d_CSXL3mFq6dUUyXLg_BjJsRSLX"},
    ]
    
    for t in tests:
        port = t["port"]
        user = t["user"]
        pwd = t["pwd"]
        print(f"Testing port={port}, user={user}, password={pwd[:10]}...")
        try:
            conn = await asyncio.wait_for(
                asyncpg.connect(
                    host=host,
                    port=port,
                    user=user,
                    password=pwd,
                    database="postgres",
                    ssl="require"
                ),
                timeout=10.0
            )
            print(f"★ SUCCESS! port={port}, user={user}")
            val = await conn.fetchval("SELECT 1")
            print(f"Query returned: {val}")
            await conn.close()
            return True
        except Exception as e:
            print(f"FAILED: {e}")
    return False

if __name__ == "__main__":
    asyncio.run(test())
