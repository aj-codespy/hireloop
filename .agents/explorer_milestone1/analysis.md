# Explorer Milestone 1: Exploration & Discovery

This folder contains exploration results for finding where job questions are saved, where the background API call is made, how `sonner` is used, and the environment variables configuration.

---

## 1. Frontend: Admin Job Questions Saving

Admin users save job questions in two key React component flows:

### A. Job Details Page (Existing Job Edit)
* **File Path**: `apps/web/src/components/jobs/job-detail-view.tsx`
* **Trigger Interface**: In the "Questions" tab of the job detail interface, the user clicks "Edit" to render `<JobQuestionsEditor>` (defined in `apps/web/src/components/jobs/job-questions-editor.tsx`).
* **Trigger Callback** (lines 202–210):
  ```typescript
  onSave={async (next, interviewQuestionCount) => {
    try {
      await setJobQuestions(jobId, next, interviewQuestionCount);
      setEditingQuestions(false);
      toast.success("Questions saved");
    } catch {
      toast.error("Could not save questions");
    }
  }}
  ```
  `setJobQuestions` is retrieved from `useHireLoop()`.

### B. Job Creation Wizard (New Job Setup)
* **File Path**: `apps/web/src/components/jobs/job-creation-wizard.tsx`
* **Trigger Interface**: In step 2 of the wizard, the user configures the questions. In step 3, the final save operation is performed via `saveJob()` (lines 149–150):
  ```typescript
  const job = await createJob(input);
  await setJobQuestions(job.id, validQuestions, interviewQuestionCount);
  ```
  This creates the job entry and then uploads the questions associated with the job.

### C. State Provider (Frontend Core Store Interface)
* **File Path**: `apps/web/src/lib/store/provider.tsx`
* **Details**: The `setJobQuestions` callback is defined at lines 209–275. When Supabase is enabled (`usingSupabase === true`), it makes a call to the server action `setJobQuestionsAction` (imported from `@/app/actions/hireloop`):
  ```typescript
  await setJobQuestionsAction(jobId, inputs, interviewQuestionCount);
  ```

---

## 2. Backend Flow: Save & Audio Rendering (`render-audio`)

When saving questions, the backend flow uses a Next.js Server Action which persists the questions and triggers a background TTS rendering API call.

* **File Path**: `apps/web/src/app/actions/hireloop.ts`
* **Function**: `setJobQuestionsAction` (lines 181–208)
* **API Details & Credentials**:
  ```typescript
  export async function setJobQuestionsAction(
    jobId: string,
    questions: QuestionInput[],
    interviewQuestionCount?: number | null
  ): Promise<void> {
    await requireOrgRole(ORG_MANAGER_ROLES);
    await setJobQuestionsInDb(jobId, questions, interviewQuestionCount);

    const questionIds = questions.map((q) => q.id).filter(Boolean) as string[];
    if (!questionIds.length) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    const secret = process.env.INTERVIEW_INTERNAL_SECRET ?? "";
    if (!secret) return;

    try {
      await fetch(`${apiUrl}/admin/questions/render-audio`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Secret": secret,
        },
        body: JSON.stringify({ question_ids: questionIds, langs: ["en", "hi"] }),
      });
    } catch {
      // Question save succeeded; audio can be rendered via scripts/render-question-audio.mjs
    }
  }
  ```
* **Execution Flow**:
  1. Checks permissions (`requireOrgRole`).
  2. Commits questions data to database via `setJobQuestionsInDb` (queried from `apps/web/src/lib/supabase/queries.ts`).
  3. Extracts IDs for newly saved/updated questions.
  4. Reads `process.env.NEXT_PUBLIC_API_URL` and `process.env.INTERVIEW_INTERNAL_SECRET`.
  5. **If the secret is empty, it returns early** without making any API request (to prevent failure in dev envs where TTS generation isn't configured).
  6. Sends a `POST` request to `${apiUrl}/admin/questions/render-audio` with custom header `"X-Internal-Secret"` and a JSON body specifying `question_ids` and `langs: ["en", "hi"]`.
  7. Wraps the request in a `try...catch` block so failures in TTS rendering do not block the admin's database save operation.

---

## 3. Sonner Toast Library Setup & Usage

`sonner` is configured globally and used inline across the application:

### A. Core Configuration (UI Wrapper)
* **File Path**: `apps/web/src/components/ui/sonner.tsx`
* **Details**: Wraps the `Toaster` component from `"sonner"` (imported as `Sonner`). It defines custom theme properties (`--normal-bg`, `--normal-text`, `--normal-border`, `--border-radius`), mounts Lucide react icons (`CircleCheckIcon`, `InfoIcon`, `TriangleAlertIcon`, `OctagonXIcon`, `Loader2Icon`) for specific toast styles (success, info, warning, error, loading), and defines a custom CSS class name `.cn-toast`.

### B. Root Mounting
* **File Path**: `apps/web/src/app/layout.tsx`
* **Details**: Imports `<Toaster>` from `@/components/ui/sonner` on line 3 and mounts it on line 42 as `<Toaster position="top-right" />` inside the application's root ThemeProvider/Layout tree.

### C. Client Usages
* **Pattern**: Imported directly from `"sonner"` (e.g. `import { toast } from "sonner";`) and called dynamically within handlers:
  * `toast.success("Questions saved")` / `toast.error("Could not save questions")` inside `job-detail-view.tsx` (lines 128, 130, 206, 208, etc.)
  * `toast.success("Job published")` / `toast.error("Could not save job")` in `job-creation-wizard.tsx` (lines 153, 155)
  * `toast.success("OTP sent")` / `toast.error(...)` inside authentication flows (e.g., `otp-auth-form.tsx`, `candidate-auth-form.tsx`).

---

## 4. Environment Variables Configuration

The repository handles environment configurations per service:

### A. Environment Files Found
1. **Frontend App (`apps/web/`)**:
   * `.env.example`: Template for environment setup.
   * `.env.local`: Local development configuration variables (loaded automatically in Next.js).
2. **Backend API (`apps/api/`)**:
   * `.env.example`: Template for the Python backend env setup.
   * `.env`: Local development configuration variables.

### B. Analysis of Key Environment Variables

#### `NEXT_PUBLIC_API_URL`
* **Where defined**:
  * `apps/web/.env.example`: `NEXT_PUBLIC_API_URL=http://localhost:8000`
  * `apps/web/.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:8000`
* **Where used**:
  * `apps/web/src/lib/config.ts` (line 2): Sets the frontend's main `API_BASE_URL` with a fallback to `http://localhost:8000` (used for generating WebSockets and HTTP requests).
  * `apps/web/src/app/actions/hireloop.ts` (line 192): In `setJobQuestionsAction` to construct the URL for triggering audio rendering.
* **Fallback behavior**: Defaults to `"http://localhost:8000"` if undefined.

#### `INTERVIEW_INTERNAL_SECRET`
* **Where defined**:
  * `apps/web/.env.example`: `INTERVIEW_INTERNAL_SECRET=change-me-in-production`
  * `apps/api/.env.example`: `INTERVIEW_INTERNAL_SECRET=change-me-in-production`
  * *Note: Not configured in the local active files (`apps/web/.env.local` or `apps/api/.env`)*.
* **Where used**:
  * **Frontend Side** (`apps/web/src/app/actions/hireloop.ts`, lines 193–194):
    ```typescript
    const secret = process.env.INTERVIEW_INTERNAL_SECRET ?? "";
    if (!secret) return; // Returns early, skipping the API call entirely
    ```
  * **Backend Side** (`apps/api/main.py`, lines 103–105):
    ```python
    expected = os.getenv("INTERVIEW_INTERNAL_SECRET", "")
    if not expected or x_internal_secret != expected:
        raise HTTPException(status_code=403, detail="Forbidden")
    ```
* **Development/Missing Secret Behavior**:
  Since it is not defined in active local environment configurations, `secret` becomes `""` on the frontend side. As a result, the frontend returns early during saving, and the HTTP request to the API is **never** made. If it were made, the API would return a `403 Forbidden` response since `expected` is empty/undefined. In production, matching non-empty secrets must be defined in both services to enable automatic TTS pre-rendering.
