## 2026-07-14T14:23:36Z
You are a teamwork_preview_worker.
Your working directory is `/Users/aj_builds/Documents/Programs/HireLoop/.agents/teamwork_preview_worker_milestone3/`.
Your task is to implement the Frontend architectural remediations as outlined below based on the audit report:

Please refer to the audit report at `/Users/aj_builds/Documents/Programs/HireLoop/.agents/teamwork_preview_explorer_milestone1_3/handoff.md`.

### 1. Add Next.js Route Error Boundaries
- Create a root error boundary at `apps/web/src/app/error.tsx` to handle uncaught rendering exceptions.
- Create a global error boundary at `apps/web/src/app/global-error.tsx` for root layout crashes.
- Create section-specific error boundaries:
  - `apps/web/src/app/admin/error.tsx`
  - `apps/web/src/app/candidate/error.tsx`
Ensure these display localized error status details and guides for recovery.

### 2. Refactor DB Mappings and Action Exception Handling
- Modify queries in `apps/web/src/lib/supabase/queries.ts`:
  - `fetchInterviewContextByToken` and related helpers must propagate actual database errors (or throw a clear exception) instead of returning `null` on errors.
- Wrap all server actions in `apps/web/src/app/actions/enterprise.ts` and `apps/web/src/app/actions/hireloop.ts` inside try/catch blocks. Make sure they return structured status payloads: `{ ok: false, error: "friendly message" }` rather than letting exceptions reject unhandled.
- Remember to re-throw Next.js redirect/notFound checks if they are raised:
  ```typescript
  import { isRedirectError } from 'next/dist/client/components/redirect';
  import { isNotFoundError } from 'next/dist/client/components/not-found';
  
  if (isRedirectError(err) || isNotFoundError(err)) {
      throw err;
  }
  ```

### 3. Implement Try/Catch in Client Callbacks
- Hydration: Update `hydrate` and `refreshState` in `apps/web/src/lib/store/provider.tsx` to catch errors from `loadHireLoopStateAction()` and fallback gracefully to local state.
- Scorecard submission: Wrap `submitScorecardAction` in `CandidateDetailView` (`apps/web/src/components/candidates/candidate-detail-view.tsx`) with a `try/catch/finally` block to prevent button loaders from locking up and toast the user on exception.
- Media recording and file download: Wrap `new MediaRecorder` instantiation in `InterviewStructured` (`apps/web/src/components/candidate/interview-structured.tsx`) and `getApplicationDocumentUrlAction` in `ApplicationDocumentLink` (`apps/web/src/components/candidates/application-document-link.tsx`) inside try/catch blocks.

### 4. Client/Server boundaries (Route Groups)
- Reorganize `/admin` layout/pages:
  - Remove `"use client"` from `apps/web/src/app/admin/layout.tsx`.
  - Create a route group dashboard layout: `apps/web/src/app/admin/(dashboard)/layout.tsx`. Move admin pages that require the dashboard shell sidebar/header into `apps/web/src/app/admin/(dashboard)/` and move their dashboard-specific layout wrapping there.
  - Keep `apps/web/src/app/admin/login/page.tsx` outside of the dashboard route group so it does not render the sidebar/header layout.

### 5. Logging and Error Swallowing Remediation
- Replace empty catch blocks in `transitionApplicationStageAction` and `notifyCandidateStatus` inside `apps/web/src/app/actions/hireloop.ts` with explicit calls to `logger.error("Description", err)`.
- Wrap `JSON.parse(event.data)` inside the WebSocket message handler of `InterviewStructured` in a try/catch, logging the issue and gracefully handling invalid packets.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Please implement these changes cleanly. Ensure TypeScript compilation passes via `npm run build` in the frontend directory (`apps/web`), and formatting/linting is clean.
When complete, write a clear `handoff.md` and report back using send_message to recipient 9f7f5c95-747c-4945-9a3f-f770336c5428.
