# Context: HireLoop Admin UI Feedback, Error Handling, and Config

## Codebase Context
- Project: HireLoop (job interview/audio prep app).
- Framework: React, Next.js.
- Database/Backend: Supabase, Node.js API (localhost:8000).
- Key Libraries: `sonner` for toast notifications.

## Requirements
1. **Admin UI Feedback (Sonner)**:
   - When saving job questions, show a toast indicating audio is generating in the background.
   - Show a success toast when complete.
2. **Error Handling & Failure Logging**:
   - Surface failures (missing secret, network issues, API errors) in the background `POST /admin/questions/render-audio` call.
   - Display a visible error toast to the admin instead of silent failures.
3. **Environment Configuration**:
   - Read `INTERVIEW_INTERNAL_SECRET` and `NEXT_PUBLIC_API_URL` (default: `http://localhost:8000`) from `.env.local` for the `render-audio` call.
4. **Verification**:
   - Node.js or Python script to verify environment variables read and simulate fetch errors.
   - Visually/programmatically verify toast logic in components.
