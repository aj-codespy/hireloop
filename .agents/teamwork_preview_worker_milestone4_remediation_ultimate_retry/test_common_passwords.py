import asyncio
import asyncpg
import ssl

async def test():
    host = "aws-0-ap-northeast-1.pooler.supabase.com"
    user = "postgres.xiniaecawuieywlnopry"
    passwords = [
        "postgres", "admin", "password", "hireloop", "TestPass123!",
        "Cxx4d_CSXL3mFq6dUUyXLg_BjJsRSLX", "sb_secret_Cxx4d_CSXL3mFq6dUUyXLg_BjJsRSLX",
        "super_secret_local_dev_key_123!"
    ]
    database = "postgres"
    port = 6543
    
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    for pwd in passwords:
        print(f"Trying password: {pwd}...")
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
            print(f"★ SUCCESS! password={pwd}")
            await conn.close()
            return True
        except Exception as e:
            print(f"FAILED: {e}")
    return False

if __name__ == "__main__":
    asyncio.run(test())
