# Project: HireLoop Architecture Audit & Remediation

## Architecture
- **Frontend**: Next.js (`apps/web`) using TypeScript, React, and Tailwind CSS. Communicates with Supabase (directly via Supabase client or server actions) and the Backend API.
- **Backend**: FastAPI Python application (`apps/api`) using Supabase client, async tasks, and external integrations.
- **Database**: Supabase Postgres DB (`supabase/migrations`, `supabase/seed.sql`) storing applications, profiles, interviews, proctoring logs, and AI usage logs.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Exploration & Audit | Perform comprehensive audit of backend, database schema, and frontend. Document issues. | None | DONE |
| 2 | Backend & DB Remediation | Implement connection pooling, proctoring race condition fix, CHECK constraints, RLS tenant fixes, transcription index fixes. | M1 | DONE |
| 3 | Frontend Remediation | Fix Next.js frontend issues found during audit (missing error states, unhandled promise rejections, client/server boundary issues). | M1 | DONE |
| 4 | Verification & Audit | Write concurrency verification script, test all scenarios, run build verification, run forensic integrity audit. | M2, M3 | DONE |

## Interface Contracts
- **Supabase / PostgreSQL**:
  - `applications.status` check constraint must enforce valid status values.
  - `ai_usage_logs` RLS policies must prevent cross-tenant access by checking organization membership.
- **Backend Connection Pooling**:
  - Maintain a shared `httpx.AsyncClient` instance/pool in `apps/api` instead of instantiating client per-request.
- **Proctoring Logs Updates**:
  - Concurrent updates to `proctoring_logs` must not overwrite each other. Must use atomic updates, optimistic locking, or database transactions.
- **Transcription Saves**:
  - Fix stale index tracking when saving background transcription chunks to avoid out-of-order data corruption.
