import asyncio
import asyncpg
import ssl

async def test_exhaustive():
    hosts = [
        "db.xiniaecawuieywlnopry.supabase.co",
        "34.160.222.181",
        "aws-0-ap-northeast-1.pooler.supabase.com"
    ]
    users = ["postgres", "postgres.xiniaecawuieywlnopry"]
    passwords = [
        "Cxx4d_CSXL3mFq6dUUyXLg_BjJsRSLX",
        "sb_secret_Cxx4d_CSXL3mFq6dUUyXLg_BjJsRSLX",
        "super_secret_local_dev_key_123!"
    ]
    ports = [5432, 6543]
    
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    ssl_options = ["require", ctx, True, False, None]
    
    for host in hosts:
        for port in ports:
            for user in users:
                for pwd in passwords:
                    for ssl_opt in ssl_options:
                        try:
                            conn = await asyncio.wait_for(
                                asyncpg.connect(
                                    host=host,
                                    port=port,
                                    user=user,
                                    password=pwd,
                                    database="postgres",
                                    ssl=ssl_opt
                                ),
                                timeout=2.0
                            )
                            print(f"★ SUCCESS: host={host}, port={port}, user={user}, pwd={pwd[:10]}, ssl={ssl_opt}")
                            await conn.close()
                            return
                        except Exception as e:
                            pass
    print("FINISHED testing all combinations. None succeeded.")

if __name__ == "__main__":
    asyncio.run(test_exhaustive())
