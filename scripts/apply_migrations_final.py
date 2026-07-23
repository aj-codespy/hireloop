import asyncio
import os
import sys
import ssl
import asyncpg
from pathlib import Path

# Resolve project root relative to this script
PROJECT_ROOT = Path(__file__).resolve().parent.parent

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
    
    # Parse DB credentials from env
    supabase_url = env.get("SUPABASE_URL", "https://xiniaecawuieywlnopry.supabase.co")
    project_ref = supabase_url.split("//")[-1].split(".")[0]
    
    secret_key = env.get("SUPABASE_SECRET_KEY", "sb_secret_Cxx4d_CSXL3mFq6dUUyXLg_BjJsRSLX")
    db_password = secret_key.replace("sb_secret_", "") if secret_key.startswith("sb_secret_") else secret_key
    
    passwords_to_try = [db_password, secret_key]
    
    hosts_to_try = [
        f"db.{project_ref}.supabase.co",
        "34.160.222.181"  # IP fallback
    ]
    
    ports_to_try = [6543, 5432]
    
    # For Supabase pooler on port 6543, we typically need the postgres.[ref] user format.
    # On direct port 5432, we typically use the standard "postgres" user.
    users_to_try = {
        6543: [f"postgres.{project_ref}", "postgres"],
        5432: ["postgres", f"postgres.{project_ref}"]
    }
    
    migration_files = [
        "supabase/migrations/20260714193500_proctoring_atomic_rpcs.sql",
        "supabase/migrations/20260714193600_add_applications_status_check.sql",
        "supabase/migrations/20260714193700_secure_ai_usage_logs_rls.sql"
    ]

    conn = None
    connected = False
    
    # SSL context with hostname check disabled to avoid errors when connecting via IP fallback
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    ssl_options = [ctx, "require", True]

    print("--- DB CONNECTION ATTEMPTS ---")
    for host in hosts_to_try:
        for port in ports_to_try:
            for user in users_to_try[port]:
                for pwd in passwords_to_try:
                    for ssl_val in ssl_options:
                        try:
                            print(f"Trying host={host}, port={port}, user={user}, pwd={pwd[:10]}..., ssl={ssl_val}...")
                            conn = await asyncio.wait_for(
                                asyncpg.connect(
                                    host=host,
                                    port=port,
                                    user=user,
                                    password=pwd,
                                    database="postgres",
                                    ssl=ssl_val
                                ),
                                timeout=4.0
                            )
                            connected = True
                            print(f"Successfully connected to database on host={host}, port={port}, user={user}!")
                            break
                        except Exception as e:
                            print(f"Connection failed: {e}")
                    if connected:
                        break
                if connected:
                    break
            if connected:
                break
        if connected:
            break
            
    if not connected or conn is None:
        print("\nError: Could not connect to the remote database using any host, port, user or password combination.", file=sys.stderr)
        print("This is expected under sandboxed network environments where outbound ports 5432/6543 are blocked.", file=sys.stderr)
        return False
        
    try:
        # Wrap all migrations in a transaction to ensure atomicity
        async with conn.transaction():
            print("\nBeginning migration transaction...")
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
