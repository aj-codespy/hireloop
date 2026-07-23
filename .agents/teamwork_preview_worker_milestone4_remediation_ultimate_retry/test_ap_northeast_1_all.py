import asyncio
import asyncpg
import ssl

async def test():
    host = "aws-0-ap-northeast-1.pooler.supabase.com"
    user = "postgres.xiniaecawuieywlnopry"
    passwords = [
        "Cxx4d_CSXL3mFq6dUUyXLg_BjJsRSLX",
        "sb_secret_Cxx4d_CSXL3mFq6dUUyXLg_BjJsRSLX"
    ]
    database = "postgres"
    ports = [5432, 6543]
    
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    for port in ports:
        for pwd in passwords:
            print(f"Trying port={port}, password={pwd[:10]}...")
            try:
                conn = await asyncio.wait_for(
                    asyncpg.connect(
                        host=host,
                        port=port,
                        user=user,
                        password=pwd,
                        database=database,
                        ssl=ctx
                    ),
                    timeout=5.0
                )
                print(f"★ SUCCESS! port={port}, password={pwd[:10]}")
                val = await conn.fetchval("SELECT 1")
                print(f"Query returned: {val}")
                await conn.close()
                return True
            except Exception as e:
                print(f"FAILED: {e}")
    return False

if __name__ == "__main__":
    asyncio.run(test())
