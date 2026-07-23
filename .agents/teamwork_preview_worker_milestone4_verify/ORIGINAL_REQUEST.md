## 2026-07-15T10:05:50Z
You are the Verification & Concurrency Worker for Milestone 4 (Verification & Audit) of the HireLoop project.
Your working directory is `/Users/aj_builds/Documents/Programs/HireLoop/.agents/teamwork_preview_worker_milestone4_verify/`.

Your objective is to:
1. Run and execute the database migrations under `supabase/migrations/`:
   - `20260714193500_proctoring_atomic_rpcs.sql`
   - `20260714193600_add_applications_status_check.sql`
   - `20260714193700_secure_ai_usage_logs_rls.sql`
   Make sure they are applied to the remote Supabase database. You can use/adapt `apply_migrations.py` or `.agents/teamwork_preview_explorer_milestone4_remediation/proposed_apply_migrations.py`. Try connecting to host `34.160.222.181` or `db.xiniaecawuieywlnopry.supabase.co` on port `5432` or `6543`, with user `postgres` or `postgres.xiniaecawuieywlnopry` and password `Cxx4d_CSXL3mFq6dUUyXLg_BjJsRSLX` or `sb_secret_Cxx4d_CSXL3mFq6dUUyXLg_BjJsRSLX`.
2. Verify that the migrations applied successfully:
   - Check if RPC functions `append_proctoring_event_rpc` and `flag_session_proctoring_rpc` exist.
   - Check if CHECK constraint on `applications.status` exists.
   - Check if RLS policy on `ai_usage_logs` exists.
3. Run the concurrency verification script: `python3 scripts/verify_proctoring_concurrency.py`. Ensure it passes (exactly 20 events, no updates overwritten, exit code 0).
4. Run the backend E2E tests: `PYTHONPATH=apps/api python3 scripts/test_interview_e2e.py` and ensure they pass.
5. Run the Supabase persistence tests: `node --env-file=apps/web/.env.local apps/web/scripts/test-interview-persistence.mjs` and ensure they pass.
6. Run a Next.js production build (`npm run build` in `apps/web/`) and run `npm run lint` in `apps/web/` to confirm that there are no lints or errors.
7. Document all command execution outputs, test results, and verified layout in your handoff report (`handoff.md`).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
