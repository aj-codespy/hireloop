import asyncio
import asyncpg
import ssl

regions = [
    "us-east-1", "us-east-2", "us-west-1", "us-west-2",
    "ap-southeast-1", "ap-southeast-2", "ap-northeast-1", "ap-northeast-2",
    "eu-central-1", "eu-west-1", "eu-west-2", "eu-west-3", "eu-north-1",
    "sa-east-1", "ca-central-1"
]

async def test_region(region):
    host = f"aws-0-{region}.pooler.supabase.com"
    user = "postgres.xiniaecawuieywlnopry"
    password = "Cxx4d_CSXL3mFq6dUUyXLg_BjJsRSLX"
    database = "postgres"
    port = 6543
    
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    try:
        conn = await asyncio.wait_for(
            asyncpg.connect(
                host=host,
                port=port,
                user=user,
                password=password,
                database=database,
                ssl=ctx
            ),
            timeout=2.0
        )
        print(f"Region {region}: SUCCESS")
        await conn.close()
    except Exception as e:
        print(f"Region {region}: {e}")

async def main():
    for region in regions:
        await test_region(region)

if __name__ == "__main__":
    asyncio.run(main())
