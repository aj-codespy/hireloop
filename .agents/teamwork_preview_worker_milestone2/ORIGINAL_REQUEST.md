## 2026-07-14T14:04:27Z
<USER_REQUEST>
You are a teamwork_preview_worker.
Your working directory is `/Users/aj_builds/Documents/Programs/HireLoop/.agents/teamwork_preview_worker_milestone2/`.
Your task is to implement the Backend and Database remediations as outlined below:

### 1. Database Migrations
Create the following migrations under `supabase/migrations/`:
- `20260714193500_proctoring_atomic_rpcs.sql`: Create PostgreSQL RPC functions `public.append_proctoring_event_rpc` and `public.flag_session_proctoring_rpc` to update `proctoring_log` and `proctoring_summary` atomically on the database using row-level locking (`FOR UPDATE`). Refer to the design in `/Users/aj_builds/Documents/Programs/HireLoop/.agents/teamwork_preview_explorer_milestone1_2/handoff.md`.
- `20260714193600_add_applications_status_check.sql`: Add a CHECK constraint to the `applications` table to restrict the `status` column to the following 11 values: 'applied', 'auto_rejected', 'shortlisted', 'interview_sent', 'interviewed', 'interview_expired', 'passed_ai', 'rejected_ai', 'partner_review', 'hired', 'rejected_final'.
- `20260714193700_secure_ai_usage_logs_rls.sql`: Drop the existing insecure SELECT policy on `ai_usage_logs` and recreate it to be scoped to organization members who are admins (checking `public.is_org_member(j.org_id, ARRAY['owner', 'admin'])`).

### 2. Backend (FastAPI Python API) Changes
Modify the code in `apps/api/`:
- Establish a shared `httpx.AsyncClient` pool utility (e.g. `apps/api/utils/http_pool.py`) managed via FastAPI lifespan context manager. Update `apps/api/main.py` to initialize and close the pool on startup/shutdown.
- Replace all inline `httpx.AsyncClient` instantiations in the following files with imports of the shared client via `get_http_client()` (making calls directly on the returned client, without `async with` blocks):
  - `apps/api/interview/answer_upload.py`
  - `apps/api/interview/email_notify.py`
  - `apps/api/interview/question_audio.py`
  - `apps/api/interview/supabase_store.py` (ensure both `_request` and audio/image upload use the pool client)
- Update `apps/api/interview/supabase_store.py` to call the atomic RPC functions `rpc/append_proctoring_event_rpc` and `rpc/flag_session_proctoring_rpc` instead of fetching, modifying, and patching python-side.
- Add `save_transcript_only` in `SupabaseInterviewStore` inside `supabase_store.py` which only PATCHes the `transcript` column payload.
- In `apps/api/interview/structured_relay.py`:
  - Initialize an `asyncio.Lock()` instance (`self._db_lock = asyncio.Lock()`) in `StructuredInterviewRelay.__init__`.
  - Update `_transcribe_in_background` to acquire the lock and call `save_transcript_only` to serialize and restrict background writes.
  - In `_advance_locked`, modify background tasks (`_save_skipped` and `_save_index`) to capture mutable state variables (`self.session.current_index` and `self.session.question_started_at`) immediately when the tasks are scheduled, and run the updates within `self._db_lock`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Please implement these changes cleanly. Ensure Python linting/formatting is respected, and verify that migrations apply successfully. You can run python tests using pytest, but please verify using the backend tests.
When complete, write a clear `handoff.md` and report back using send_message to recipient 9f7f5c95-747c-4945-9a3f-f770336c5428.
</USER_REQUEST>
