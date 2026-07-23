import asyncio
import asyncpg

async def main():
    hosts = ["localhost", "127.0.0.1"]
    ports = [5432, 5433, 6543]
    passwords = [
        "Cxx4d_CSXL3mFq6dUUyXLg_BjJsRSLX",
        "sb_secret_Cxx4d_CSXL3mFq6dUUyXLg_BjJsRSLX",
        "super_secret_local_dev_key_123!",
        ""
    ]
    ssl_options = [False, None, "require"]
    
    for host in hosts:
        for port in ports:
            for pwd in passwords:
                for ssl in ssl_options:
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
                            timeout=1.0
                        )
                        print(f"SUCCESS! host={host}, port={port}, ssl={ssl}, password={pwd}")
                        await conn.close()
                        return
                    except Exception as e:
                        pass

if __name__ == "__main__":
    asyncio.run(main())
