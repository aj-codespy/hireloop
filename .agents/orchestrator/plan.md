# Project Plan: HireLoop Admin UI Feedback, Error Handling, and Config

## Architecture
- React/Next.js frontend calling a server action or API route.
- The server action or API route makes a background API call to `POST /admin/questions/render-audio`.
- Background audio rendering needs configuration via `INTERVIEW_INTERNAL_SECRET` and `NEXT_PUBLIC_API_URL`.
- Sonner toast component used in the frontend to notify the user.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Exploration & Discovery | Locate save handler, API route/server action, sonner usage, env files. | None | PLANNED |
| 2 | Implementation | Integrate sonner toast for pending/success/failure, config env vars, add error handling. | M1 | PLANNED |
| 3 | Verification | Write Node/Python script for env & error simulation, confirm toast logic in component. | M2 | PLANNED |

## Interface Contracts
- Server action/API route must accept saving job questions and call `POST /admin/questions/render-audio`.
- API Call authorization headers: must pass `INTERVIEW_INTERNAL_SECRET` for authentication.
- API Endpoint URL: must construct from `NEXT_PUBLIC_API_URL` (default: `http://localhost:8000`).
- Sonner toasts:
  - Pending: "question audio is generating in the background" / "saving questions..."
  - Success: toast completed successfully when audio generation is done.
  - Failure: visible error toast to the admin when background API call fails.
