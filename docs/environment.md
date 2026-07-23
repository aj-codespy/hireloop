# HireLoop Environment Variables

Central reference for all environment variables across both services.
Keep this document updated when adding/changing variables.

---

## Backend API (`apps/api/.env`)

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `GEMINI_API_KEY` | `str` | ✅ | — | Google Gemini API key for AI interview relay, scoring, TTS, STT |
| `SCORING_MODEL` | `str` | ❌ | `gemini-2.5-flash` | Model used for interview scoring |
| `STT_MODEL` | `str` | ❌ | `gemini-2.5-flash` | Model used for speech-to-text transcription |
| `TTS_MODEL` | `str` | ❌ | `gemini-2.5-flash-preview-tts` | Model used for text-to-speech question audio |
| `TTS_VOICE_EN` | `str` | ❌ | `Kore` | TTS voice name for English audio |
| `TTS_VOICE_HI` | `str` | ❌ | `Kore` | TTS voice name for Hindi audio |
| `MODEL` | `str` | ❌ | `gemini-3.1-flash-live-preview` | Legacy live model (no longer used by structured mode) |
| `DEEPGRAM_API_KEY` | `str` | ❌ | — | Optional: faster STT provider for production |
| `PORT` | `int` | ❌ | `8000` | API server port |
| `INTERVIEW_OVERALL_LIMIT_SECONDS` | `int` | ❌ | `600` | Maximum total interview duration |
| `INTERVIEW_RECONNECT_HOURS` | `int` | ❌ | `2` | Window for resuming a disconnected session |
| `SUPABASE_URL` | `str` | ✅ | — | Supabase project URL (also accepts `NEXT_PUBLIC_SUPABASE_URL`) |
| `SUPABASE_SECRET_KEY` | `str` | ✅ | — | Supabase service role key (bypasses RLS; also accepts `SUPABASE_SERVICE_ROLE_KEY`) |
| `RESEND_API_KEY` | `str` | ❌ | — | Resend API key for transactional emails |
| `RESEND_FROM` | `str` | ❌ | — | From address for emails (e.g., `noreply@hireloop.com`) |
| `APP_URL` | `str` | ❌ | `http://localhost:3000` | Frontend app URL (also accepts `NEXT_PUBLIC_APP_URL`) |
| `INTERVIEW_INTERNAL_SECRET` | `str` | ❌ | — | Shared secret for admin→API calls (must match web `.env.local` value) |
| `ALLOWED_ORIGINS` | `str` (CSV) | ❌ | `http://localhost:3000,http://localhost:3001` | Comma-separated CORS origins |
| `DEV_SQLITE` | `int` | ❌ | `0` | Set `DEV_SQLITE=1` to use local SQLite instead of Supabase for dev |

### Required for Calendar Sync
| `GOOGLE_CLIENT_ID` | `str` | ❌ | — | Google OAuth client ID for calendar integration |
| `GOOGLE_CLIENT_SECRET` | `str` | ❌ | — | Google OAuth client secret |
| `OUTLOOK_CLIENT_ID` | `str` | ❌ | — | Microsoft OAuth client ID for Outlook calendar |
| `OUTLOOK_CLIENT_SECRET` | `str` | ❌ | — | Microsoft OAuth client secret |

---

## Frontend Web (`apps/web/.env.local`)

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `str` | ✅ | `http://localhost:8001` | Backend API origin (note: API default port is 8000, web .env.example uses 8001) |
| `NEXT_PUBLIC_APP_URL` | `str` | ✅ | `http://localhost:3000` | Frontend app origin |
| `RESEND_API_KEY` | `str` | ❌ | — | Resend API key (used by Server Actions for admin emails) |
| `RESEND_FROM` | `str` | ❌ | — | From address for emails |
| `NEXT_PUBLIC_SUPABASE_URL` | `str` | ✅ | — | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `str` | ✅ | — | Supabase anon/public key (client-safe) |
| `SUPABASE_SECRET_KEY` | `str` | ✅ | — | Supabase service role key for Server Actions (may be `SUPABASE_SERVICE_ROLE_KEY` in legacy projects) |
| `INTERVIEW_INTERNAL_SECRET` | `str` | ❌ | — | Must match `apps/api/.env` value for pre-render question TTS on job save |

---

## Root (`/.env` — optional, for presentation tooling)

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `OPENAI_API_KEY` | `str` | ❌ | — | Used by presentation-generation scripts (`pptxgenjs`-based) |

---

## Quick-Start for Development

### Minimal backend setup (with Supabase):
```bash
cd apps/api
cp .env.example .env
# Fill in: GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SECRET_KEY
# Run: python main.py
```

### Backend-only dev (no Supabase needed):
```bash
cd apps/api
export DEV_SQLITE=1
# Run: python main.py  (uses local dev.sqlite)
```

### Full stack:
```bash
# Terminal 1: Backend
cd apps/api && python main.py

# Terminal 2: Frontend
cd apps/web && npm run dev

# Ports: API=8000, Web=3000
```

---

## Production Deployment

| Service | Platform | Critical Env Vars |
|---------|----------|-------------------|
| Frontend | Vercel | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_API_URL`, `INTERVIEW_INTERNAL_SECRET`, `RESEND_API_KEY`, `RESEND_FROM` |
| Backend API | Railway | `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `GEMINI_API_KEY`, `PORT`, `INTERVIEW_INTERNAL_SECRET`, `RESEND_API_KEY`, `RESEND_FROM`, `APP_URL`, `ALLOWED_ORIGINS` |
| Database | Supabase (managed) | Managed — no env vars needed |

**Note:** `INTERVIEW_INTERNAL_SECRET` must match between Vercel and Railway deployments.

---

*Last updated: 2026-07-21 | Source: `apps/api/.env.example` + `apps/web/.env.example`*