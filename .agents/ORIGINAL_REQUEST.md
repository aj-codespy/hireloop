# Original User Request

## Initial Request — 2026-07-08T00:52:59+05:30

Add an admin UI hint (toast notification) and failure logging when job questions are saved, ensuring the auto-render API call is properly configured for localhost development.

Working directory: /Users/aj_builds/Documents/Programs/HireLoop
Integrity mode: demo

## Requirements

### R1. Admin UI Feedback
When an admin saves job questions, display a toast notification using the existing `sonner` library indicating that the question audio is generating in the background. Display a success toast when complete.

### R2. Error Handling & Logging
If the background API call to `POST /admin/questions/render-audio` fails (e.g., missing secret, network error, or API failure), surface a visible error via a toast notification to the admin so it is not silently ignored.

### R3. Environment Configuration
Ensure the web app uses `INTERVIEW_INTERNAL_SECRET` (for server action auth) and `NEXT_PUBLIC_API_URL` (pointing to `http://localhost:8000` for local dev) from `.env.local` when making the render-audio API call.

## Acceptance Criteria

### Implementation Quality
- [ ] The `sonner` toast notification is successfully integrated into the job questions save flow.
- [ ] Network failures or missing secrets correctly trigger an error toast rather than failing silently.
- [ ] The web app correctly reads and passes `INTERVIEW_INTERNAL_SECRET` and `NEXT_PUBLIC_API_URL` in the background fetch request.

### Verification (Agent-as-Judge / Static Analysis)
- [ ] The implementing agent must write a quick Node.js/Python script to verify the web app's server action or API route correctly reads the environment variables and handles simulated fetch errors.
- [ ] The implementing agent must visually or programmatically confirm the toast logic is present in the React component handling the save.
