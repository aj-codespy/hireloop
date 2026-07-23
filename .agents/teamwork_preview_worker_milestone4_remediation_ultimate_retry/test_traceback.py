import asyncio
import asyncpg
import traceback

async def main():
    try:
        conn = await asyncpg.connect(
            host="34.160.222.181",
            port=6543,
            user="postgres",
            password="Cxx4d_CSXL3mFq6dUUyXLg_BjJsRSLX",
            database="postgres",
            ssl="require"
        )
        print("Connected!")
        await conn.close()
    except Exception:
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
