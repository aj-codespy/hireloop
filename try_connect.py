import asyncio
import asyncpg
import sys
import socket
import ssl

# Hijack getaddrinfo to force IPv4
original_getaddrinfo = socket.getaddrinfo
def patched_getaddrinfo(*args, **kwargs):
    host = args[0] if args else None
    port = args[1] if len(args) > 1 else None
    
    if host == "db.xiniaecawuieywlnopry.supabase.co":
        socktype = args[3] if len(args) > 3 else socket.SocketKind.SOCK_STREAM
        proto = args[4] if len(args) > 4 else 6
        result = [
            (socket.AF_INET, socktype, proto, '', ('34.160.222.181', port))
        ]
        return result
    return original_getaddrinfo(*args, **kwargs)
socket.getaddrinfo = patched_getaddrinfo

async def try_conn():
    host = "db.xiniaecawuieywlnopry.supabase.co"
    password = "Cxx4d_CSXL3mFq6dUUyXLg_BjJsRSLX"
    database = "postgres"
    
    ssl_ctx = ssl.create_default_context()
    ssl_ctx.check_hostname = False
    ssl_ctx.verify_mode = ssl.CERT_NONE
    
    tests = [
        # Port 6543
        {"port": 6543, "user": "postgres.xiniaecawuieywlnopry", "ssl": ssl_ctx},
        {"port": 6543, "user": "postgres", "ssl": ssl_ctx},
        # Port 5432
        {"port": 5432, "user": "postgres.xiniaecawuieywlnopry", "ssl": ssl_ctx},
        {"port": 5432, "user": "postgres", "ssl": ssl_ctx},
    ]
    
    for t in tests:
        print(f"Testing port={t['port']}, user={t['user']}...")
        try:
            conn = await asyncio.wait_for(
                asyncpg.connect(
                    host=host,
                    port=t["port"],
                    user=t["user"],
                    password=password,
                    database=database,
                    ssl=t["ssl"]
                ),
                timeout=5.0
            )
            print("SUCCESS!")
            val = await conn.fetchval("SELECT 1")
            print(f"Query returned: {val}")
            await conn.close()
            return
        except Exception as e:
            print(f"FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(try_conn())
