import asyncio
import asyncpg
import ssl

async def test():
    host = "34.160.222.181"
    users = ["postgres", "postgres.xiniaecawuieywlnopry"]
    passwords = [
        "Cxx4d_CSXL3mFq6dUUyXLg_BjJsRSLX",
        "sb_secret_Cxx4d_CSXL3mFq6dUUyXLg_BjJsRSLX"
    ]
    databases = ["postgres", "supabase", "db", "xiniaecawuieywlnopry"]
    ports = [5432, 6543]
    
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    for port in ports:
        for user in users:
            for pwd in passwords:
                for db in databases:
                    print(f"Trying port={port}, user={user}, db={db}...")
                    try:
                        conn = await asyncio.wait_for(
                            asyncpg.connect(
                                host=host,
                                port=port,
                                user=user,
                                password=pwd,
                                database=db,
                                ssl=ctx
                            ),
                            timeout=2.0
                        )
                        print(f"★ SUCCESS! port={port}, user={user}, db={db}")
                        await conn.close()
                        return
                    except Exception as e:
                        pass

if __name__ == "__main__":
    asyncio.run(test())
