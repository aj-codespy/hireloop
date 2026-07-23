import asyncio
import asyncpg
import ssl

async def test():
    host = "34.160.222.181"
    password = "Cxx4d_CSXL3mFq6dUUyXLg_BjJsRSLX"
    
    # Try different ssl parameters
    options = []
    
    # 1. ssl=False
    options.append(("ssl=False", False))
    
    # 2. ssl=True
    options.append(("ssl=True", True))
    
    # 3. ssl="require" (this was failing with connection_lost)
    options.append(("ssl='require'", "require"))
    
    # 4. ssl context with no verification
    ctx_no_verify = ssl.create_default_context()
    ctx_no_verify.check_hostname = False
    ctx_no_verify.verify_mode = ssl.CERT_NONE
    options.append(("ssl=ctx_no_verify", ctx_no_verify))
    
    # 5. ssl context with default verification
    ctx_verify = ssl.create_default_context()
    options.append(("ssl=ctx_verify", ctx_verify))

    for name, ssl_val in options:
        for port in [6543, 5432]:
            print(f"Testing port={port}, {name}...")
            try:
                conn = await asyncio.wait_for(
                    asyncpg.connect(
                        host=host,
                        port=port,
                        user="postgres",
                        password=password,
                        database="postgres",
                        ssl=ssl_val
                    ),
                    timeout=5.0
                )
                print(f"SUCCESS on port={port} with {name}!")
                val = await conn.fetchval("SELECT 1")
                print(f"Query returned: {val}")
                await conn.close()
                return
            except Exception as e:
                print(f"FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(test())
