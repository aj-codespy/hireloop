## 2026-07-15T04:42:34Z
<USER_REQUEST>
You are the Migration & Concurrency Worker (Ultimate Retry) for Milestone 4 (Verification & Audit) of the HireLoop project.
Your working directory is `/Users/aj_builds/Documents/Programs/HireLoop/.agents/teamwork_preview_worker_milestone4_remediation_ultimate_retry/`.

Your objective is to:
1. Identify database connectivity parameters by running `python3 test_postgres_conn.py`. Note which host, port, and password succeeds.
2. Apply the three database migrations located under `supabase/migrations/`:
   - `20260714193500_proctoring_atomic_rpcs.sql`
   - `20260714193600_add_applications_status_check.sql`
   - `20260714193700_secure_ai_usage_logs_rls.sql`
   Ensure they are executed in a transaction against the remote Supabase database. You can adapt `apply_migrations.py` or `.agents/teamwork_preview_explorer_milestone4_remediation/proposed_apply_migrations.py` to use the working connection parameters (e.g. host, port, password, ssl).
3. Verify that the migrations applied successfully:
   - Check if RPC functions `append_proctoring_event_rpc` and `flag_session_proctoring_rpc` exist.
   - Check if CHECK constraint on `applications.status` exists.
   - Check if RLS policy on `ai_usage_logs` exists.
4. Run the concurrency verification script: `python3 scripts/verify_proctoring_concurrency.py`. Ensure it passes (exactly 20 events, no updates overwritten, exit code 0).
5. Run the backend E2E tests: `PYTHONPATH=apps/api python3 scripts/test_interview_e2e.py` and ensure they pass.
6. Run the Supabase persistence tests: `node --env-file=apps/web/.env.local apps/web/scripts/test-interview-persistence.mjs` and ensure they pass.
7. Run a Next.js production build (`npm run build` in `apps/web/`) and run `npm run lint` in `apps/web/` to confirm that there are no lints or errors.
8. Document all command execution outputs, test results, and verified layout in your handoff report (`handoff.md`).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
</USER_REQUEST>
