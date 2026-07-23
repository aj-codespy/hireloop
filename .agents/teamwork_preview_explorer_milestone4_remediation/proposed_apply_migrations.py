import asyncio
import os
import sys
import asyncpg
from pathlib import Path

# Resolve project root relative to this script
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

def load_env(env_path: Path) -> dict[str, str]:
    """Helper to parse key-value pairs from a .env file."""
    env = {}
    if env_path.exists():
        with open(env_path, "r") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    k, v = line.split("=", 1)
                    # Strip quotes
                    v = v.strip().strip("'").strip('"')
                    env[k.strip()] = v
    return env

async def apply_migrations():
    # Load settings from root .env file
    env = load_env(PROJECT_ROOT / ".env")
    
    # 1. Parse DB credentials
    supabase_url = env.get("SUPABASE_URL", "https://xiniaecawuieywlnopry.supabase.co")
    # Extract project ref from SUPABASE_URL (e.g. xiniaecawuieywlnopry)
    project_ref = supabase_url.split("//")[-1].split(".")[0]
    
    # Extract password from SUPABASE_SECRET_KEY
    secret_key = env.get("SUPABASE_SECRET_KEY", "sb_secret_Cxx4d_CSXL3mFq6dUUyXLg_BjJsRSLX")
    db_password = secret_key.replace("sb_secret_", "") if secret_key.startswith("sb_secret_") else secret_key
    
    host = os.environ.get("DB_HOST", f"db.{project_ref}.supabase.co")
    user = os.environ.get("DB_USER", "postgres")
    database = os.environ.get("DB_NAME", "postgres")
    
    # Define ports to try (6543 for pooling/transaction, 5432 for direct connection)
    ports = [6543, 5432]
    
    migration_files = [
        "supabase/migrations/20260714193500_proctoring_atomic_rpcs.sql",
        "supabase/migrations/20260714193600_add_applications_status_check.sql",
        "supabase/migrations/20260714193700_secure_ai_usage_logs_rls.sql"
    ]

    conn = None
    connected = False
    
    # Try connecting to the database
    for port in ports:
        try:
            print(f"Attempting connection to {host}:{port}...")
            conn = await asyncio.wait_for(
                asyncpg.connect(
                    host=host,
                    port=port,
                    user=user,
                    password=db_password,
                    database=database
                ),
                timeout=5.0
            )
            connected = True
            print(f"Successfully connected to database on port {port}!")
            break
        except Exception as e:
            print(f"Failed to connect on port {port}: {e}")
            
    if not connected or conn is None:
        print("Error: Could not connect to the remote database on any port.", file=sys.stderr)
        return False
        
    try:
        # Wrap all migrations in a transaction to ensure atomicity
        async with conn.transaction():
            print("Beginning migration transaction...")
            for file_rel_path in migration_files:
                file_path = PROJECT_ROOT / file_rel_path
                if not file_path.exists():
                    raise FileNotFoundError(f"Migration file not found at: {file_path}")
                    
                print(f"Reading migration: {file_rel_path}...")
                with open(file_path, "r") as f:
                    sql_content = f.read()
                    
                print(f"Applying SQL from: {file_rel_path}...")
                # asyncpg.Connection.execute runs multiple commands in one call
                await conn.execute(sql_content)
                print(f"✓ Migration {file_rel_path} applied successfully.")
                
        print("★ All migrations applied and committed successfully!")
        return True
    except Exception as e:
        print(f"✕ Migration transaction failed and was rolled back: {e}", file=sys.stderr)
        return False
    finally:
        if conn:
            await conn.close()

if __name__ == "__main__":
    success = asyncio.run(apply_migrations())
    if not success:
        sys.exit(1)
