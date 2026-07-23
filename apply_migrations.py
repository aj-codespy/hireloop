import asyncio
import asyncpg
import sys

async def run_migrations():
    host = "34.160.222.181"
    port = 6543
    user = "postgres"
    password = "Cxx4d_CSXL3mFq6dUUyXLg_BjJsRSLX"
    database = "postgres"
    
    migration_files = [
        "supabase/migrations/20260714193500_proctoring_atomic_rpcs.sql",
        "supabase/migrations/20260714193600_add_applications_status_check.sql",
        "supabase/migrations/20260714193700_secure_ai_usage_logs_rls.sql"
    ]
    
    try:
        print(f"Connecting to database {host}:{port} with SSL...")
        conn = await asyncpg.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database,
            ssl="require"
        )
        print("Connected successfully!")
        
        for file_path in migration_files:
            print(f"Applying migration: {file_path}...")
            with open(file_path, "r") as f:
                sql = f.read()
            # Split the statements or run as a single script
            await conn.execute(sql)
            print(f"Successfully applied {file_path}")
            
        await conn.close()
        print("All migrations applied successfully!")
        return True
    except Exception as e:
        print(f"Migration failed: {e}", file=sys.stderr)
        return False

if __name__ == "__main__":
    success = asyncio.run(run_migrations())
    if not success:
        sys.exit(1)
