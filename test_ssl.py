import asyncio
import asyncpg
import ssl

async def main():
    host = "34.160.222.181"
    password = "Cxx4d_CSXL3mFq6dUUyXLg_BjJsRSLX"
    database = "postgres"
    user = "postgres"
    port = 6543
    
    # Context 1: standard create_default_context
    ctx1 = ssl.create_default_context()
    ctx1.check_hostname = False
    ctx1.verify_mode = ssl.CERT_NONE
    
    contexts = {
        "ssl_none_ctx": ctx1,
        "ssl_true": True,
        "ssl_require": "require",
    }
    
    for name, ssl_opt in contexts.items():
        print(f"Trying ssl={name}...")
        try:
            conn = await asyncpg.connect(
                host=host,
                port=port,
                user=user,
                password=password,
                database=database,
                ssl=ssl_opt,
                timeout=10.0
            )
            print(f"SUCCESS with {name}!")
            val = await conn.fetchval("SELECT 1")
            print(f"Query returned: {val}")
            await conn.close()
            return
        except Exception as e:
            print(f"FAILED with {name}: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
