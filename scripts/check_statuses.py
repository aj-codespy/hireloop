#!/usr/bin/env python3
"""Check invalid application status values in Supabase."""
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")

if not SUPABASE_URL or not SUPABASE_SECRET_KEY:
    print("Missing env vars")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)

# Get all distinct status values
result = supabase.from_("applications").select("status").execute()
statuses = set(row["status"] for row in result.data if row.get("status"))

print("=== Current status values in database ===")
for s in sorted(statuses):
    print(f"  '{s}'")

# Valid statuses from migration
valid_statuses = {
    'applied', 'auto_rejected', 'shortlisted', 'interview_sent',
    'interviewed', 'interview_expired', 'passed_ai', 'rejected_ai',
    'partner_review', 'hired', 'rejected_final'
}

invalid = statuses - valid_statuses
if invalid:
    print(f"\n=== INVALID statuses (not in constraint) ===")
    for s in sorted(invalid):
        print(f"  '{s}'")
    
    # Count rows per invalid status
    for s in sorted(invalid):
        count_result = supabase.from_("applications").select("id", count="exact").eq("status", s).execute()
        print(f"    '{s}': {count_result.count} rows")
else:
    print("\n=== All statuses are valid ===")