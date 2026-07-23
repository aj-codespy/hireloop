import asyncio
import asyncpg
import ssl

async def test_conn():
    hosts = ["db.xiniaecawuieywlnopry.supabase.co", "34.160.222.181"]
    users = ["postgres", "postgres.xiniaecawuieywlnopry"]
    passwords = [
        "Cxx4d_CSXL3mFq6dUUyXLg_BjJsRSLX",
        "sb_secret_Cxx4d_CSXL3mFq6dUUyXLg_BjJsRSLX"
    ]
    ports = [5432, 6543]
    
    ssl_ctx = ssl.create_default_context()
    ssl_ctx.check_hostname = False
    ssl_ctx.verify_mode = ssl.CERT_NONE
    
    ssl_options = [ssl_ctx, "require", True]
    
    for host in hosts:
        for port in ports:
            for user in users:
                for pwd in passwords:
                    for ssl_val in ssl_options:
                        print(f"Trying host={host}, port={port}, user={user}, password={pwd[:10]}..., ssl={ssl_val}")
                        try:
                            conn = await asyncio.wait_for(
                                asyncpg.connect(
                                    host=host,
                                    port=port,
                                    user=user,
                                    password=pwd,
                                    database="postgres",
                                    ssl=ssl_val
                                ),
                                timeout=5.0
                            )
                            print(f"SUCCESS! Connected with host={host}, port={port}, user={user}, password={pwd[:10]}...")
                            val = await conn.fetchval("SELECT 1")
                            print(f"Query returned: {val}")
                            await conn.close()
                            return
                        except Exception as e:
                            print(f"Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_conn())
