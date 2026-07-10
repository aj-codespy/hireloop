# HireLoop Web

Next.js frontend with admin and candidate portals:

| Portal | Routes | Purpose |
|---|---|---|
| **Admin** | `/admin/*` | Jobs, candidates, pipeline, reports, team settings |
| **Candidate** | `/apply/[jobId]`, `/candidate/[token]` | Public apply + token-gated structured interview |

## Run locally

```bash
cd apps/web
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Data layer

**With Supabase** (recommended): set env vars in `.env.local` — see [`/supabase/README.md`](../../supabase/README.md).

**Without Supabase**: data lives in browser `localStorage` via `src/lib/store/provider.tsx`.

## Interview API

Structured interview UI connects to FastAPI:

```
NEXT_PUBLIC_API_URL=http://localhost:8000  →  ws://localhost:8000/ws/interview
```

Start `apps/api` with `GEMINI_API_KEY` for scoring and proctoring vision.

## Email (Resend)

Set `RESEND_API_KEY`, `RESEND_FROM`, and `NEXT_PUBLIC_APP_URL` in `.env.local` to enable **Regenerate & send link** from the candidate detail page (for expired links / special cases).
