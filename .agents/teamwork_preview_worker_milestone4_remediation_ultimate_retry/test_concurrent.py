import asyncio
import asyncpg
import ssl

hosts = [
    "db.xiniaecawuieywlnopry.supabase.co",
    "34.160.222.181"
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

ssl_options = [("require", "require"), ("ctx", ctx), ("True", True), ("False", False), ("None", None)]

async def attempt(host, port, user, pwd, ssl_name, ssl_opt):
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
        print(f"★★ SUCCESS: host={host}, port={port}, user={user}, pwd={pwd[:10]}, ssl={ssl_name}")
        await conn.close()
        return True
    except Exception as e:
        # If it's a password failure or success, print it. Otherwise keep quiet to avoid log noise
        err = str(e)
        if "authentication failed" in err or "password" in err:
            print(f"AUTH FAIL: host={host}, port={port}, user={user}, pwd={pwd[:10]}, ssl={ssl_name} -> {err}")
        return False

async def main():
    tasks = []
    for host in hosts:
        for port in ports:
            for user in users:
                for pwd in passwords:
                    for ssl_name, ssl_opt in ssl_options:
                        tasks.append(attempt(host, port, user, pwd, ssl_name, ssl_opt))
    await asyncio.gather(*tasks)
    print("Concurrently tested all combinations.")

if __name__ == "__main__":
    asyncio.run(main())
