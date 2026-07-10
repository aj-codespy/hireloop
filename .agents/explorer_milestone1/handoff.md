# Handoff Report - Explorer Milestone 1

This report compiles findings regarding the frontend job questions saving, backend audio rendering, `sonner` toast configuration, and environment variable details in the HireLoop codebase.

---

## 1. Observation

### Frontend Job Questions Saving
1. **Existing Job Edit Flow**:
   * File path: `apps/web/src/components/jobs/job-detail-view.tsx`
   * Line numbers: 199–212
   * Content:
     ```typescript
     <JobQuestionsEditor
       questions={questions.map(toQuestionInput)}
       interviewQuestionCount={job.interviewQuestionCount}
       onSave={async (next, interviewQuestionCount) => {
         try {
           await setJobQuestions(jobId, next, interviewQuestionCount);
           setEditingQuestions(false);
           toast.success("Questions saved");
         } catch {
           toast.error("Could not save questions");
         }
       }}
       onCancel={() => setEditingQuestions(false)}
     />
     ```
2. **Job Creation Wizard Flow**:
   * File path: `apps/web/src/components/jobs/job-creation-wizard.tsx`
   * Line numbers: 148–156
   * Content:
     ```typescript
     try {
       const job = await createJob(input);
       await setJobQuestions(job.id, validQuestions, interviewQuestionCount);
       setCreatedJobId(job.id);
       setStep(4);
       toast.success(publishLive ? "Job published" : "Job saved as draft");
     } catch {
       toast.error("Could not save job");
     }
     ```
3. **Core Store Handler**:
   * File path: `apps/web/src/lib/store/provider.tsx`
   * Line numbers: 215–216
   * Content:
     ```typescript
     if (usingSupabase) {
       await setJobQuestionsAction(jobId, inputs, interviewQuestionCount);
     ```

### Backend Save & Audio Rendering Flow
1. **Next.js Server Action**:
   * File path: `apps/web/src/app/actions/hireloop.ts`
   * Line numbers: 181–208
   * Content:
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
2. **Backend API Route**:
   * File path: `apps/api/main.py`
   * Line numbers: 97–111
   * Content:
     ```python
     @app.post("/admin/questions/render-audio")
     async def render_question_audio_route(
         body: RenderAudioRequest,
         x_internal_secret: str = Header(default="", alias="X-Internal-Secret"),
     ) -> JSONResponse:
         """Pre-render TTS for questions (called from admin after saving questions)."""
         expected = os.getenv("INTERVIEW_INTERNAL_SECRET", "")
         if not expected or x_internal_secret != expected:
             raise HTTPException(status_code=403, detail="Forbidden")
         ...
     ```

### Sonner Toast Library Setup & Usages
1. **Toaster Setup**:
   * File path: `apps/web/src/components/ui/sonner.tsx`
   * Line numbers: 4–49 (Customizes Lucide icons and themes for success, info, warning, error, loading).
2. **Global Mounting**:
   * File path: `apps/web/src/app/layout.tsx`
   * Line numbers: 3, 42
   * Content:
     ```typescript
     import { Toaster } from "@/components/ui/sonner";
     ...
     <Toaster position="top-right" />
     ```
3. **Usage Example**:
   * File path: `apps/web/src/components/jobs/job-detail-view.tsx`
   * Line numbers: 5, 206, 208
   * Content:
     ```typescript
     import { toast } from "sonner";
     ...
     toast.success("Questions saved");
     ...
     toast.error("Could not save questions");
     ```

### Environment Variables
1. **Web Configuration Files**:
   * File path: `apps/web/.env.example`
     - Line 1: `NEXT_PUBLIC_API_URL=http://localhost:8000`
     - Line 20: `INTERVIEW_INTERNAL_SECRET=change-me-in-production`
   * File path: `apps/web/.env.local`
     - Line 1: `NEXT_PUBLIC_API_URL=http://localhost:8000`
     - *`INTERVIEW_INTERNAL_SECRET` is missing in this file.*
2. **API Configuration Files**:
   * File path: `apps/api/.env.example`
     - Line 24: `INTERVIEW_INTERNAL_SECRET=change-me-in-production`
   * File path: `apps/api/.env`
     - *`INTERVIEW_INTERNAL_SECRET` is missing in this file.*

---

## 2. Logic Chain

1. **Frontend Action Entrypoint**: Admin question configurations are adjusted in `<JobQuestionsEditor>`. When finalized, it emits an `onSave` event containing the valid questions array.
2. **Local Store Dispatch**: `onSave` invokes `setJobQuestions` from the React store provider context, which in turn calls Next.js Server Action `setJobQuestionsAction`.
3. **Action & Backend Handshake**:
   - `setJobQuestionsAction` updates Supabase database tables.
   - It checks `process.env.INTERVIEW_INTERNAL_SECRET`.
   - In local development, this secret is blank (as it is not defined in `apps/web/.env.local` or `apps/api/.env`).
   - The condition `if (!secret) return;` triggers, terminating the action early and skipping the `POST /admin/questions/render-audio` API request.
   - If defined, the request is sent to `NEXT_PUBLIC_API_URL` (default: `http://localhost:8000`) with `"X-Internal-Secret"` header.
   - The FastAPI backend validates this header against its own `INTERVIEW_INTERNAL_SECRET` and returns a 403 Forbidden on failure/mismatch.
4. **Toast Handling**: Feedback to users about saving questions or jobs is uniformly emitted via the `toast` function from the `"sonner"` package, which dynamically renders overlays using `<Toaster>` configured in the root layouts.

---

## 3. Caveats

- We did not deploy a live local server instance or initiate network packets (read-only investigation scope).
- Mappings assume default local ports (`8000` for api, `3000` for web) as stated in env configurations.

---

## 4. Conclusion

The application successfully connects frontend admin components to the audio rendering backend flow using Next.js Server Actions. However, in default local development environments, automatic TTS rendering is skipped due to the absence of `INTERVIEW_INTERNAL_SECRET` in both `.env.local` and `.env` files. To enable local TTS pre-rendering, a matching string must be explicitly added to both configuration files.

---

## 5. Verification Method

To verify these discoveries:
1. **Code Inspect**:
   * View `apps/web/src/app/actions/hireloop.ts` to inspect the server action code.
   * View `apps/api/main.py` to inspect the header secret validation route.
2. **Next.js Lint check**:
   * Run `npm run lint` within `apps/web` to confirm import paths for `sonner` and `provider` resolve correctly without static compile errors.
3. **Environment Setup Verification**:
   * Run the following commands to check if files exist and search their configuration keys:
     - `grep "INTERVIEW_INTERNAL_SECRET" apps/web/.env.local` (should return nothing)
     - `grep "INTERVIEW_INTERNAL_SECRET" apps/api/.env` (should return nothing)
