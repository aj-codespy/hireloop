## 2026-07-08T01:07:19Z
You are a teamwork_preview_worker subagent. Your working directory is /Users/aj_builds/Documents/Programs/HireLoop/.agents/worker_milestone2/.
Your task is to implement the following changes in the HireLoop codebase:

1. **Backend Server Action Update**:
   - File: `apps/web/src/app/actions/hireloop.ts`
   - Modify `setJobQuestionsAction` to read `process.env.INTERVIEW_INTERNAL_SECRET` and `process.env.NEXT_PUBLIC_API_URL` (defaulting to `"http://localhost:8000"`).
   - If `INTERVIEW_INTERNAL_SECRET` is missing (i.e. not configured or empty string), throw an Error: `throw new Error("Audio generation failed: Missing INTERVIEW_INTERNAL_SECRET environment variable.")`.
   - Perform the background fetch request to `${apiUrl}/admin/questions/render-audio` using a POST method, sending JSON header `"Content-Type": "application/json"`, authorization header `"X-Internal-Secret": secret`, and a body of `{ question_ids: questionIds, langs: ["en", "hi"] }`.
   - If the response from the API is not successful (`!response.ok`), read the response body as text and throw an error detailing the status and error content.
   - If a network error or fetch failure occurs, log it to the console via `console.error` and rethrow the error with a clean error message. Do NOT swallow any error.

2. **Frontend UI Toast Notifications (Sonner)**:
   - File: `apps/web/src/components/jobs/job-detail-view.tsx`
     - Wrap the `setJobQuestions` promise inside a `toast.promise` call to display dynamic UI feedback to the admin.
     - The loading message should say: `"Generating question audio in the background..."`
     - The success message should say: `"Questions saved successfully"`
     - The error message callback should return the custom thrown error message or fallback.
   - File: `apps/web/src/components/jobs/job-creation-wizard.tsx`
     - Wrap the `setJobQuestions` promise inside a `toast.promise` call during the wizard's step 3 save flow.
     - The loading message should say: `"Generating question audio in the background..."`
     - The success message should say: `publishLive ? "Job published" : "Job saved as draft"`
     - The error message callback should return the custom thrown error message or fallback.

Guidelines:
- Create and update your `progress.md` with a liveness heartbeat.
- Follow the domain skill: `/Users/aj_builds/.gemini/config/plugins/modern-web-guidance-plugin/skills/modern-web-guidance/SKILL.md` (which covers modern component state and toast UI feedback).
- Run lint checks (`npm run lint` or `npx next lint`) or build checks in `apps/web` if needed to ensure the code is syntax-error-free and typescript compiles successfully.
- Document all your modifications in /Users/aj_builds/Documents/Programs/HireLoop/.agents/worker_milestone2/changes.md.
- When done, write your `handoff.md` and notify the parent orchestrator via `send_message`.

MANDATORY INTEGRITY WARNING:
> DO NOT CHEAT. All implementations must be genuine. DO NOT
> hardcode test results, create dummy/facade implementations, or
> circumvent the intended task. A Forensic Auditor will independently
> verify your work. Integrity violations WILL be detected and your
> work WILL be rejected.
