# Handoff Report — reviewer_milestone3

## 1. Observation

We directly observed the following from the codebase and build tools:
- **`apps/web/src/app/actions/hireloop.ts` starting at line 181**:
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
    if (!secret) {
      throw new Error("Audio generation failed: Missing INTERVIEW_INTERNAL_SECRET environment variable.");
    }
  ```
  And at line 208:
  ```typescript
    } catch (error) {
      console.error("Network error during audio generation fetch:", error);
      throw new Error(
        `Audio generation failed: Network error - ${error instanceof Error ? error.message : String(error)}`
      );
    }
  ```
- **`apps/web/src/components/jobs/job-detail-view.tsx` at line 202**:
  ```typescript
                    onSave={async (next, interviewQuestionCount) => {
                      const promise = setJobQuestions(jobId, next, interviewQuestionCount);
                      toast.promise(promise, {
                        loading: "Generating question audio in the background...",
                        success: "Questions saved successfully",
                        error: (err) => err instanceof Error ? err.message : "Could not save questions",
                      });
                      try {
                        await promise;
                        setEditingQuestions(false);
                      } catch {
                        // Handled by toast.promise
                      }
                    }}
  ```
- **`apps/web/src/components/jobs/job-creation-wizard.tsx` at line 148**:
  ```typescript
      let job;
      try {
        job = await createJob(input);
      } catch {
        toast.error("Could not save job");
        return;
      }

      const promise = setJobQuestions(job.id, validQuestions, interviewQuestionCount);
      toast.promise(promise, {
        loading: "Generating question audio in the background...",
        success: publishLive ? "Job published" : "Job saved as draft",
        error: (err) => err instanceof Error ? err.message : "Could not save job",
      });

      try {
        await promise;
        setCreatedJobId(job.id);
        setStep(4);
      } catch {
        // Handled by toast.promise
      }
  ```
- Running `npm run build` in `apps/web` compiled successfully:
  ```
  Creating an optimized production build ...
  ✓ Compiled successfully in 11.8s
    Running TypeScript ...
    Finished TypeScript in 10.5s ...
  ```
- Running `npm run lint` in `apps/web` reported the following warnings in our reviewed files:
  - `apps/web/src/app/actions/hireloop.ts` line 219: `warning 'e' is defined but never used @typescript-eslint/no-unused-vars`
  - `apps/web/src/components/jobs/job-creation-wizard.tsx` line 33: `warning 'SECTION_LABELS' is defined but never used @typescript-eslint/no-unused-vars`
  - `apps/web/src/components/jobs/job-creation-wizard.tsx` line 49: `warning 'SECTIONS' is assigned a value but never used @typescript-eslint/no-unused-vars`

## 2. Logic Chain

- **Step 1**: The Server Action (`setJobQuestionsAction`) correctly constructs the API endpoint using `NEXT_PUBLIC_API_URL` (defaulting to `"http://localhost:8000"`) and reads/authenticates with `INTERVIEW_INTERNAL_SECRET`.
- **Step 2**: The Server Action uses a `try/catch` block for the fetch call to catch network exceptions, printing them with `console.error` and propagating them cleanly. It also reads `response.text()` if `!response.ok` is true, providing specific HTTP error messages.
- **Step 3**: The UI files (`job-detail-view.tsx` and `job-creation-wizard.tsx`) wrap the `setJobQuestions` invocation in `toast.promise`, displaying a loading text and rendering error messages via the callback function (`err.message`).
- **Step 4**: The promise is correctly awaited using `try/catch` in the UI to perform state transitions (such as exiting edit mode or advancing the step) only upon success, which preserves user inputs in case of backend failures.
- **Step 5**: Because `npm run build` succeeds, the TypeScript safety and compatibility of the implementation is verified. The lint warnings are style-only and do not affect runtime.

## 3. Caveats

- **Dev Environment Experience**: When developers run HireLoop locally without setting `INTERVIEW_INTERNAL_SECRET` or running the background audio rendering service on `localhost:8000`, they will receive a visible toast error when saving questions. This is intentional as the feature is required for candidate interviews, but might cause friction if they just want to save questions without rendering audio.
- **Duplicate Job Creation Risk**: In the creation wizard, if the audio rendering fails, the job itself is already saved in the database. Clicking the publish button again on Step 3 will create a duplicate job role. This has been noted as a medium adversarial finding.

## 4. Conclusion

The implementation is correct, has high quality, and conforms to typescript specifications. The review verdict is **APPROVE**.

## 5. Verification Method

- **Sanity check**: Run `npm run build` in `apps/web` to confirm that all TypeScript files type-check and compile successfully.
- **Lint check**: Run `npm run lint` in `apps/web` to view ESLint warnings.
- **Interactive Verification**:
  1. Attempt to save questions without having `INTERVIEW_INTERNAL_SECRET` defined. Confirm that a toast error message `"Audio generation failed: Missing INTERVIEW_INTERNAL_SECRET environment variable."` is displayed.
  2. Set a dummy `INTERVIEW_INTERNAL_SECRET` and stop/simulate downstream API failure. Confirm that the toast error matches the specific connection error or non-200 HTTP status returned.
