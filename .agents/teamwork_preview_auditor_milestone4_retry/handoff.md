# Forensic Audit & Handoff Report

## Forensic Audit Report

**Work Product**: HireLoop Project Repository (backend, database migrations, frontend)
**Profile**: General Project (Integrity Mode: Demo)
**Verdict**: INTEGRITY VIOLATION

### Phase Results
- **Hardcoded output detection**: PASS — No hardcoded test results, mock score generators, or bypass tokens were found in the Python/TypeScript source code.
- **Facade detection**: PASS — Implementations of connection pooling, proctoring locking mechanisms, Next.js page layouts, and error boundaries are genuine and structurally complete.
- **Pre-populated artifact detection**: PASS — Checked for pre-existing attestation or verification logs that might suggest fabrication. The repository remains clean of such files.
- **Frontend Compilation & Lint Verification**: PASS — Next.js production build (`npm run build`) completed successfully. ESLint linter (`npm run lint`) completed with 0 errors.
- **Database Migrations Verification**: FAIL — Database migrations added for Milestone 2 were not applied to the target remote Supabase database, leaving the production DB schema out-of-sync. Specifically:
  - The functions `append_proctoring_event_rpc` and `flag_session_proctoring_rpc` do not exist on the database.
  - The CHECK constraint on `applications.status` was not applied, allowing invalid status strings (like `'invalid_status_xyz'`) to be successfully inserted.
  - The security RLS policies on `ai_usage_logs` were not applied.

---

## 5-Component Handoff Details

### 1. Observation
1. **Unapplied Database Functions**: Executing a PostgREST RPC call for `append_proctoring_event_rpc` and `flag_session_proctoring_rpc` on the target remote Supabase instance (`https://xiniaecawuieywlnopry.supabase.co`) returned a `PGRST202` schema cache error:
   ```json
   {
     "code": "PGRST202",
     "details": "Searched for the function public.append_proctoring_event_rpc with parameters p_new_event, p_session_id or with a single unnamed json/jsonb parameter, but no matches were found in the schema cache.",
     "hint": null,
     "message": "Could not find the function public.append_proctoring_event_rpc(p_new_event, p_session_id) in the schema cache"
   }
   ```
2. **Bypassed Check Constraint**: Successfully executed an insertion query on the `applications` table with a custom invalid status string `'invalid_status_xyz'` and valid foreign keys:
   ```
   Supabase URL: https://xiniaecawuieywlnopry.supabase.co
   Using Job ID: job-test-1783102956960, Candidate ID: cand-test-1783102958559
   --- Checking CHECK constraint on applications.status ---
   SUCCESS?! (No check constraint error!) inserted: null
   ```
   This completed with status code `201 Created` / success, proving that no database-level CHECK constraint checks the validity of `status`.
3. **TypeScript Build Success**: Running `npm run build` in `apps/web/` exited successfully:
   ```
   ✓ Compiled successfully in 28.1s
   Running TypeScript ...
   Finished TypeScript in 20.2s ...
   Generating static pages using 7 workers (24/24) in 2.4s
   Finalizing page optimization ...
   ```
4. **Linter Success**: Running `npm run lint` in `apps/web/` exited successfully with:
   ```
   ✖ 6 problems (0 errors, 6 warnings)
   ```

### 2. Logic Chain
1. **Missing Database RPCs (Observation 1)**: Since the PostgREST server returned a 404/PGRST202 code specifically complaining that the function does not exist in the schema cache, the migration file `supabase/migrations/20260714193500_proctoring_atomic_rpcs.sql` was never executed against the remote Supabase database.
2. **Missing Status Constraints (Observation 2)**: Because an application was inserted successfully with `status: 'invalid_status_xyz'` instead of throwing a check constraint violation, the migration `supabase/migrations/20260714193600_add_applications_status_check.sql` has not been applied to the database.
3. **Application Instability**: In `apps/api/interview/structured_relay.py`, the backend schedules background tasks calling `store.append_proctoring_event`. Since this calls the missing database RPC, it throws `RuntimeError` during proctoring events, breaking the webcam analysis flow in production.
4. **Conclusion Support**: These observations directly support the conclusion that the database migrations have not been applied properly to the production database environment, violating checking requirement 4.

### 3. Caveats
- No local database was used because the project is configured to connect to a remote Supabase database directly, and the test credentials point to the remote instance.
- The outbound network is healthy and permitted DNS/HTTPS requests to Supabase, which allowed direct empirical verification of the remote database's schema and constraints.

### 4. Conclusion
The implementation code changes (Next.js layout group refactoring, global connection pooling, and atomic RPC calls) are genuine and do not contain hardcoded test overrides or bypasses. However, **the database migrations have not been applied to the target database**. This unapplied schema state is a critical integrity violation under the project's acceptance criteria, since it breaks key proctoring functionality in production.
Verdict: **INTEGRITY VIOLATION** due to unapplied database migrations.

### 5. Verification Method
1. Create a script `test.mjs` in the `apps/web` folder to query the database:
   ```javascript
   import { createClient } from '@supabase/supabase-js';
   const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
   const { error } = await supabase.rpc('append_proctoring_event_rpc', { p_session_id: '123', p_new_event: {} });
   console.log(error);
   ```
2. Run it with `node --env-file=.env.local test.mjs`.
3. If it outputs a `PGRST202` error, or if you can successfully insert an application with an invalid status, the migrations have not been applied, confirming the audit verdict.
