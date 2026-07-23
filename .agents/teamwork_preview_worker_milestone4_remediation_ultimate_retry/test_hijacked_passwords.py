import asyncio
import asyncpg
import socket
import ssl

original_getaddrinfo = socket.getaddrinfo
def patched_getaddrinfo(*args, **kwargs):
    host = args[0] if args else None
    port = args[1] if len(args) > 1 else None
    if host == "db.xiniaecawuieywlnopry.supabase.co":
        socktype = args[3] if len(args) > 3 else socket.SocketKind.SOCK_STREAM
        proto = args[4] if len(args) > 4 else 6
        return [(socket.AF_INET, socktype, proto, '', ('34.160.222.181', port))]
    return original_getaddrinfo(*args, **kwargs)
socket.getaddrinfo = patched_getaddrinfo

async def test():
    host = "db.xiniaecawuieywlnopry.supabase.co"
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
    
    for port in ports:
        for user in users:
            for pwd in passwords:
                print(f"Trying port={port}, user={user}, pwd={pwd[:10]}...")
                try:
                    conn = await asyncio.wait_for(
                        asyncpg.connect(
                            host=host,
                            port=port,
                            user=user,
                            password=pwd,
                            database="postgres",
                            ssl=ctx
                        ),
                        timeout=5.0
                    )
                    print(f"★ SUCCESS! port={port}, user={user}, pwd={pwd[:10]}")
                    val = await conn.fetchval("SELECT 1")
                    print(f"Query returned: {val}")
                    await conn.close()
                    return True
                except Exception as e:
                    print(f"FAILED: {e}")
    return False

if __name__ == "__main__":
    asyncio.run(test())
