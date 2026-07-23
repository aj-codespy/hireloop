# Architectural Audit Report — Next.js Frontend (`apps/web`)

This report summarizes a complete architectural audit of the Next.js App Router frontend for the HireLoop workspace, focusing on missing error states, unhandled promise rejections, client/server boundary issues, and silent API failures.

---

## 1. Observations

### 1.1. Missing Error States
* **No Next.js Route Error Boundaries**: A search for `error.tsx` or `global-error.tsx` files inside `apps/web/src/app` returned **0 results**.
* **Misleading Database/Network Failures**: In `apps/web/src/lib/supabase/queries.ts:444-449`, database query errors on `applications` retrieval are caught and return a silent `null` instead of raising or propagating the error:
  ```typescript
  const { data: appRow, error: appError } = await supabase
    .from("applications")
    .select("*")
    .eq("interview_token", token)
    .maybeSingle();
  if (appError || !appRow) return null;
  ```
  On the client side (`apps/web/src/app/candidate/[token]/page.tsx:13-23`), returning `null` maps directly to:
  ```typescript
  if (!ctx) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-4">
        <h1 className="text-xl font-semibold">Invalid or expired interview link</h1>
  ```
  This misleads candidates to believe their link is invalid when there might actually be a critical Supabase service outage.
* **Similar silent failures on other public fetch actions**: 
  - `loadPublicJobAction` and `loadPublicOrgJobsAction` in `apps/web/src/app/actions/hireloop.ts` return `null` on query errors, rendering pages with generic "not accepting applications" rather than a system failure state.

### 1.2. Unhandled Promise Rejections
* **Server Actions lacking try/catch**: Server actions in `apps/web/src/app/actions/enterprise.ts` (e.g. `createRequisitionAction`, `approveRequisitionAction`, `scheduleHumanInterviewAction`, `createOfferAction`, `exportCandidateDataAction`, `eraseCandidateDataAction`) do not contain try/catch blocks wrapper. If `new Date(input.startsAt).toISOString()` or Supabase queries throw, it results in an unhandled promise rejection on the server.
* **Context Provider Hydration**: In `apps/web/src/lib/store/provider.tsx:129-143`, hydration wraps `loadHireLoopStateAction()` with `try/finally` but **lacks a catch block**:
  ```typescript
  async function hydrate() {
    try {
      const remote = await loadHireLoopStateAction();
      if (cancelled) return;
      if (remote) {
        setState(remote);
        setUsingSupabase(true);
      } else {
        setState(loadLocalState());
        setUsingSupabase(false);
      }
    } finally {
      if (!cancelled) setHydrated(true);
    }
  }
  ```
  Any error thrown by `loadHireLoopStateAction()` becomes an unhandled promise rejection on client hydration.
* **Refresh State action**: `refreshState` in `provider.tsx:99-108` also makes an unhandled call to `loadHireLoopStateAction()`.
* **Client Handlers with Unhandled Promises**:
  - `submitScorecard` in `apps/web/src/components/candidates/candidate-detail-view.tsx:97-114` calls `submitScorecardAction` but fails to wrap it in a try/catch. If the action throws, the loading state `actionLoading === "scorecard"` stays active indefinitely, and the browser receives an unhandled promise rejection.
  - `ApplicationDocumentLink` in `apps/web/src/components/candidates/application-document-link.tsx:20-26` calls `getApplicationDocumentUrlAction` with `try/finally` but **no catch block**, meaning thrown errors reject unhandled.
  - `startRecording()` and `stopRecording()` in `apps/web/src/components/candidate/interview-structured.tsx` lack try/catch wrappers around browser Media APIs. If `new MediaRecorder` throws on Safari due to unsupported mime-types or lack of permissions, it triggers an unhandled rejection.

### 1.3. Incorrect Client/Server Boundaries
* **Client Component Layout**: The root layout for the admin section (`apps/web/src/app/admin/layout.tsx:1`) is marked `"use client"`:
  ```typescript
  "use client";
  import { usePathname } from "next/navigation";
  ...
  ```
  This is done to bypass the dashboard sidebar/header shell for `/admin/login`. By marking the layout `"use client"`, all nested pages are client-side hydrated. Next.js best practices dictate using **Route Groups** (e.g. `/admin/(dashboard)/layout.tsx` and `/admin/login/page.tsx`) to avoid making the layout a client component.
* **Global Provider Overload**: `HireLoopProvider` is declared in `apps/web/src/app/layout.tsx` and wraps all children. It fetches all candidate, organization, and job tables client-side inside `useEffect` (`loadHireLoopStateAction`). Next.js App Router pages should fetch specific server-side data per-route to leverage server-side caching and minimize client payload.

### 1.4. Silent API Failures
* **Swallowed catch blocks in server actions**:
  - `transitionApplicationStageAction` in `apps/web/src/app/actions/hireloop.ts:304-334` suppresses all errors during log insertions:
    ```typescript
    try {
      await supabase.from("application_stage_history").insert({...});
      await supabase.from("activity_log").insert({...});
    } catch {
      // Backward-compatible until enterprise workflow migration is applied.
    }
    ```
  - `notifyCandidateStatus` in `apps/web/src/app/actions/hireloop.ts:264-273` swallows errors from `sendApplicationStatusEmail` silently without logging or monitoring.
* **Malformed WS Messages**: In `InterviewStructured` (`apps/web/src/components/candidate/interview-structured.tsx:473`), the WebSocket parses data using `JSON.parse(event.data)` without a try/catch block. Malformed packets will crash the WebSocket connection listener.

---

## 2. Logic Chain

1. **No `error.tsx` boundary files exist in the app router** (Observation 1.1) $\rightarrow$ Uncaught server actions or rendering errors crash the rendering tree rather than displaying localized error cards, degrading UX.
2. **Supabase queries return `null` on errors** (Observation 1.1) $\rightarrow$ Errors (e.g. database down) are mislabeled as "expired links" or "non-existent jobs" to the end user.
3. **Server actions and async client actions do not wrap database calls or Browser APIs in catch blocks** (Observation 1.2) $\rightarrow$ Unexpected errors (database failure, Safari audio restrictions) trigger unhandled promise rejections, leaving UI buttons in a locked loader state.
4. **Root admin layout is `"use client"`** (Observation 1.3) $\rightarrow$ The layout performs path-based logic client-side rather than leveraging App Router Route Groups, limiting server-side features.
5. **Server actions contain empty catch blocks** (Observation 1.4) $\rightarrow$ Audit logging and email system failures go entirely unnoticed and unlogged, preventing system health observation.

---

## 3. Caveats
* **Supabase Client vs Admin Configuration**: The codebase relies heavily on dynamic checks for database presence (`isSupabaseServerEnabled()`). Some fallback paths write to `localStorage` instead of Supabase. The audit focused on the database-enabled paths; local storage fallbacks were not audited for disk-quota-exceeded errors.
* **External Error Logging**: This audit did not inspect if an external telemetry package (like Sentry) is integrated into `logger`. If it is, silent catch blocks might prevent telemetry from capturing failures.

---

## 4. Conclusion
The frontend suffers from critical architectural gaps in error handling. Specifically, the lack of route-level error boundaries, unhandled promise rejections on client callbacks, and swallowed errors inside server actions present a high risk of application lock-ups and silent system degradation.

---

## 5. Step-by-Step Fix Strategy (Action Plan)

### Step 1: Add Next.js Route Error Boundaries
1. Create a root error boundary at `apps/web/src/app/error.tsx` to catch layout/rendering exceptions.
2. Create a global error boundary at `apps/web/src/app/global-error.tsx` to handle root-level crashes.
3. Define specific error pages for candidate/admin sections (`apps/web/src/app/admin/error.tsx` and `apps/web/src/app/candidate/error.tsx`) to show structured recovery guides.

### Step 2: Refactor DB Mappings and Action Exception Handling
1. In `apps/web/src/lib/supabase/queries.ts`, modify `fetchInterviewContextByToken` and related helper functions to propagate the actual database error or raise custom errors (e.g. `DatabaseConnectionError`) rather than returning `null`.
2. Wrap all server actions in `apps/web/src/app/actions/enterprise.ts` and `apps/web/src/app/actions/hireloop.ts` inside standardized `try/catch` wrappers. Ensure that instead of crashing, actions return structured validation states: `{ ok: false, error: "Friendly message" }`.
3. Re-throw Next.js redirect errors correctly using `isNextRedirectError(error)` inside all action catch blocks.

### Step 3: Implement Try/Catch in Client Callbacks
1. **Hydration handler**: Update `hydrate` and `refreshState` in `apps/web/src/lib/store/provider.tsx` to catch errors from `loadHireLoopStateAction()` and fallback gracefully to `loadLocalState()`.
2. **Scorecard submission**: Wrap `submitScorecardAction` in `CandidateDetailView` with a `try/catch/finally` block to prevent button loaders from locking up and toast the user on exception.
3. **Media recording and file download**: Wrap `new MediaRecorder` instantiation in `InterviewStructured` and `getApplicationDocumentUrlAction` in `ApplicationDocumentLink` inside try/catch blocks. Gracefully fall back to alternative audio formats or display an action error toast.

### Step 4: Fix Client/Server boundaries
1. Remove `"use client"` from `apps/web/src/app/admin/layout.tsx`.
2. Reorganize routes under `/admin` into Route Groups:
   - Create `apps/web/src/app/admin/(dashboard)/layout.tsx` to render the `DashboardShell`. Move dashboard pages into `/admin/(dashboard)/`.
   - Keep `apps/web/src/app/admin/login/page.tsx` outside of the dashboard route group so it does not render the sidebar/header layout.

### Step 5: Implement Logging in Swallowed Catches
1. Replace empty catch blocks in `transitionApplicationStageAction` and `notifyCandidateStatus` with structured log calls using the imported `logger.error("Description", err)`.
2. In `InterviewStructured`, wrap `JSON.parse(event.data)` in a try/catch, logging the issue and gracefully handling invalid packets.

---

## 6. Verification Method

To verify the audit findings and proposed fixes:
1. **Locate boundaries**: Run the command:
   ```sh
   find apps/web/src/app -name "error.tsx" -o -name "global-error.tsx"
   ```
   Confirm that it returns the newly created error boundary files.
2. **Simulate a DB Outage**: Temporarily invalidate Supabase environment variables in `.env.local` and visit the interview URL. Verify that it displays a system outage message rather than an "Invalid or expired link" message.
3. **Simulate Action Crashes**: Throw a dummy exception inside `submitScorecardAction` on the server. Verify that the "Submit Scorecard" button recovers and displays a toast message, instead of remaining disabled.
4. **Confirm Layout boundaries**: Inspect `apps/web/src/app/admin/layout.tsx` and ensure `"use client"` is removed. Build the next application using:
   ```sh
   npm run build
   ```
   Confirm that server-side layout optimization compiles successfully.
