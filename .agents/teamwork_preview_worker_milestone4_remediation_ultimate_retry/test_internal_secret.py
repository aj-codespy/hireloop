import asyncio
import asyncpg
import socket
import ssl

original_getaddrinfo = socket.getaddrinfo
target_ip = "35.79.125.133"

def patched_getaddrinfo(*args, **kwargs):
    host = args[0] if args else None
    port = args[1] if len(args) > 1 else None
    if host == "aws-0-ap-northeast-1.pooler.supabase.com":
        socktype = args[3] if len(args) > 3 else socket.SocketKind.SOCK_STREAM
        proto = args[4] if len(args) > 4 else 6
        return [(socket.AF_INET, socktype, proto, '', (target_ip, port))]
    return original_getaddrinfo(*args, **kwargs)
socket.getaddrinfo = patched_getaddrinfo

async def test():
    host = "aws-0-ap-northeast-1.pooler.supabase.com"
    user = "postgres.xiniaecawuieywlnopry"
    pwd = "super_secret_local_dev_key_123!"
    database = "postgres"
    ports = [5432, 6543]
    
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    for port in ports:
        print(f"Trying port={port}...")
        try:
            conn = await asyncio.wait_for(
                asyncpg.connect(
                    host=host,
                    port=port,
                    user=user,
                    password=pwd,
                    database=database,
                    ssl=ctx
                ),
                timeout=5.0
            )
            print(f"★ SUCCESS! port={port}")
            val = await conn.fetchval("SELECT 1")
            print(f"Query returned: {val}")
            await conn.close()
            return True
        except Exception as e:
            print(f"FAILED: {e}")
    return False

if __name__ == "__main__":
    asyncio.run(test())
