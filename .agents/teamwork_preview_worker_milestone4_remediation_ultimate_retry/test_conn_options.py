import asyncio
import asyncpg

async def test_conn():
    hosts = ["db.xiniaecawuieywlnopry.supabase.co", "34.160.222.181"]
    passwords = [
        "Cxx4d_CSXL3mFq6dUUyXLg_BjJsRSLX",
        "sb_secret_Cxx4d_CSXL3mFq6dUUyXLg_BjJsRSLX",
        "super_secret_local_dev_key_123!"
    ]
    ports = [5432, 6543]
    ssl_options = ["require", False, None]
    
    for host in hosts:
        for port in ports:
            for pwd in passwords:
                for ssl in ssl_options:
                    print(f"Trying host={host}, port={port}, ssl={ssl}, password={pwd[:10]}...")
                    try:
                        conn = await asyncio.wait_for(
                            asyncpg.connect(
                                host=host,
                                port=port,
                                user="postgres",
                                password=pwd,
                                database="postgres",
                                ssl=ssl
                            ),
                            timeout=3.0
                        )
                        print(f"SUCCESS! Connected to {host}:{port} with ssl={ssl}, password {pwd[:10]}")
                        val = await conn.fetchval("SELECT 1")
                        print(f"Query returned: {val}")
                        await conn.close()
                        return
                    except Exception as e:
                        print(f"Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_conn())
