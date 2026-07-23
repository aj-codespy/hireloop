import asyncio
import asyncpg
import ssl

async def test():
    host = "aws-0-us-east-1.pooler.supabase.com"
    user = "postgres.xiniaecawuieywlnopry"
    password = "Cxx4d_CSXL3mFq6dUUyXLg_BjJsRSLX"
    database = "postgres"
    port = 6543
    
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    for ssl_val in ["require", ctx, True, False, None]:
        print(f"Trying ssl={ssl_val}...")
        try:
            conn = await asyncio.wait_for(
                asyncpg.connect(
                    host=host,
                    port=port,
                    user=user,
                    password=password,
                    database=database,
                    ssl=ssl_val
                ),
                timeout=5.0
            )
            print(f"★ SUCCESS! Connected to pooler on port {port} with ssl={ssl_val}!")
            val = await conn.fetchval("SELECT 1")
            print(f"Query returned: {val}")
            await conn.close()
            return
        except Exception as e:
            print(f"FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(test())
