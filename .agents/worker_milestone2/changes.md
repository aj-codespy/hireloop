# Modification Log - worker_milestone2

## 1. Backend Server Action Update

### File: `apps/web/src/app/actions/hireloop.ts`
- **Change**: Updated `setJobQuestionsAction` to read `process.env.INTERVIEW_INTERNAL_SECRET` and `process.env.NEXT_PUBLIC_API_URL` (defaulting to `"http://localhost:8000"`).
- **Logic**:
  - Validates that `INTERVIEW_INTERNAL_SECRET` is defined and non-empty. Throws a precise `Error("Audio generation failed: Missing INTERVIEW_INTERNAL_SECRET environment variable.")` otherwise.
  - Performed background HTTP POST request to `${apiUrl}/admin/questions/render-audio` with JSON payload `{ question_ids: questionIds, langs: ["en", "hi"] }`.
  - Added authorization header `"X-Internal-Secret"` sending the secret.
  - Implemented error handling for non-ok API responses (`!response.ok`), reading the response text and throwing a detailed error.
  - Captured fetch/network errors, logging them with `console.error` and rethrowing as clean error messages so they are not swallowed.

---

## 2. Frontend UI Toast Notifications

### File: `apps/web/src/components/jobs/job-detail-view.tsx`
- **Change**: Wrapped the `setJobQuestions` invocation inside a `toast.promise` call.
- **Messages**:
  - Loading: `"Generating question audio in the background..."`
  - Success: `"Questions saved successfully"`
  - Error: Callback returning `err.message` or falling back to `"Could not save questions"`.
- **Logic**: Awaits the promise inside the `try` block, and only resets the editing view state (`setEditingQuestions(false)`) if the save succeeds.

### File: `apps/web/src/components/jobs/job-creation-wizard.tsx`
- **Change**: Wrapped the `setJobQuestions` invocation inside a `toast.promise` call during Step 3 publish/save flow.
- **Messages**:
  - Loading: `"Generating question audio in the background..."`
  - Success: `publishLive ? "Job published" : "Job saved as draft"`
  - Error: Callback returning `err.message` or falling back to `"Could not save job"`.
- **Logic**: Separates `createJob` (which handles basic creation error) and `setJobQuestions` (which handles the promise-wrapped action). Awaits both sequentially and transitions to the success screen if successful.
