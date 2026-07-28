# HireLoop — Test Deployment Guide

This document records the **current test deployment** setup used for HireLoop, so anyone can redeploy, verify, or extend it later.

> Scope: **test / staging**, not hardened production.  
> Last updated: 2026-07-28

---

## Current live endpoints

| Surface | Provider | URL |
|---------|----------|-----|
| Frontend | Vercel | https://hireloop-blush.vercel.app |
| Backend API | Google Cloud Run | https://hireloop-api-991739524857.asia-south1.run.app |
| Backend API (alias) | Google Cloud Run | https://hireloop-api-c34t3cinba-el.a.run.app |
| Database / Auth | Supabase | `https://xiniaecawuieywlnopry.supabase.co` |

Both Cloud Run URLs point at the same service and respond on `/health`.

### Quick health checks

```bash
curl -sS https://hireloop-api-991739524857.asia-south1.run.app/health
curl -sS https://hireloop-api-c34t3cinba-el.a.run.app/health
```

Expected:

```json
{"status":"ok","service":"hireloop-interview-api","mode":"structured"}
```

API docs:  
https://hireloop-api-991739524857.asia-south1.run.app/docs

---

## Architecture (test)

```text
Browser
  └─ Vercel (Next.js apps/web)
       ├─ Supabase (auth + Postgres)
       └─ Cloud Run (FastAPI apps/api)
            ├─ Gemini (interview / scoring / TTS / STT)
            ├─ Supabase (service role)
            └─ Brevo SMTP (email)
```

- Frontend owns UI + Supabase Auth session.
- Backend owns interview WebSocket relay (`/ws/interview`), scoring, TTS pre-render, and related API routes.
- Shared secret `INTERVIEW_INTERNAL_SECRET` authenticates trusted frontend → API calls.

---

## Google Cloud project details

| Field | Value |
|-------|-------|
| GCP project ID | `getplaced-489115` |
| GCP project name | `getPlaced` |
| Deploy account | `ajayush2301@gmail.com` |
| Region | `asia-south1` (Mumbai) |
| Cloud Run service | `hireloop-api` |
| Latest known revision | `hireloop-api-00002-5zc` |
| Source path deployed | `apps/api` |
| Dockerfile | `apps/api/Dockerfile` |
| Build context | `apps/api` (not repo root) |

### Cloud Run runtime settings

| Setting | Value | Why |
|---------|-------|-----|
| Container port | `8080` | Cloud Run injects `PORT`; app listens on `$PORT` |
| CPU | `1` | Enough for test interviews |
| Memory | `512Mi` | Raise to `1Gi` if OOM |
| Min instances | `0` | Cheapest; cold starts possible |
| Max instances | `2` | Cap spend |
| Concurrency | `80` | Multiple connections per instance |
| Request timeout | `3600s` | Required for long WebSocket interviews |
| Session affinity | `on` | Helps WebSocket reconnect stickiness |
| Auth | Allow unauthenticated | Public API URL for browser/WebSocket clients |
| `DEV_SQLITE` | `0` | Use Supabase, not local SQLite |

---

## Backend env vars on Cloud Run

These are set on the `hireloop-api` service (values live in Cloud Run / local `apps/api/.env` — **do not commit secrets**).

### AI / Gemini
- `GEMINI_API_KEY`
- `MODEL`
- `SCORING_MODEL`
- `STT_MODEL`
- `TTS_MODEL`
- `TTS_VOICE_EN`
- `TTS_VOICE_HI`

### Supabase
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`

### Interview / app
- `INTERVIEW_INTERNAL_SECRET` — must match Vercel frontend
- `INTERVIEW_OVERALL_LIMIT_SECONDS`
- `INTERVIEW_RECONNECT_HOURS`
- `APP_URL` = `https://hireloop-blush.vercel.app`
- `ALLOWED_ORIGINS` = `https://hireloop-blush.vercel.app,http://localhost:3000,http://localhost:3001`
- `DEV_SQLITE` = `0`

### Brevo email
- `BREVO_FROM`
- `BREVO_FROM_NAME`
- `BREVO_SMTP_HOST`
- `BREVO_SMTP_PORT`
- `BREVO_SMTP_LOGIN`
- `BREVO_SMTP_KEY`

### Do not set on Cloud Run
- `PORT` — reserved / auto-injected by Cloud Run

Full variable reference: [`docs/environment.md`](./environment.md)

---

## Frontend env vars on Vercel

Project: **hireloop-blush** → Settings → Environment Variables → Production (and Preview if needed).

### Required for Cloud Run cohesion

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://hireloop-api-991739524857.asia-south1.run.app` |
| `NEXT_PUBLIC_APP_URL` | `https://hireloop-blush.vercel.app` |
| `INTERVIEW_INTERNAL_SECRET` | same value as Cloud Run / `apps/api/.env` |

### Required for Supabase

| Variable | Notes |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Same Supabase project as API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Anon / publishable key |
| `SUPABASE_SECRET_KEY` | Server-only secret key |

### Optional
- `NEXT_PUBLIC_WS_URL` — **not required** for the main interview UI.  
  `apps/web/src/lib/config.ts` derives `wss://…/ws/interview` from `NEXT_PUBLIC_API_URL`.
- Brevo / Resend vars — only if the web app sends email itself.

After changing any `NEXT_PUBLIC_*` var, **redeploy** the Vercel project (new build required).

---

## Supabase Auth redirects (required for login)

In Supabase Dashboard → **Authentication → URL Configuration**:

- **Site URL:** `https://hireloop-blush.vercel.app`
- **Redirect URLs** include:
  - `https://hireloop-blush.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback` (local)

---

## How this test backend was deployed

### One-time GCP prep
1. `gcloud` authenticated as `ajayush2301@gmail.com`
2. Project set to `getplaced-489115`
3. APIs enabled:
   - Cloud Run
   - Cloud Build
   - Artifact Registry
4. Billing linked on the GCP project (required even for free quota)

### Dockerfile notes (`apps/api/Dockerfile`)
Cloud Run–ready image:
- Builds from `apps/api` using `requirements.txt` (not missing `pyproject.toml`)
- Listens on `${PORT:-8080}`
- Uses **1 uvicorn worker** (Cloud Run scales instances)
- Defaults `DEV_SQLITE=0`
- Includes `.dockerignore` to skip `.venv`, `.env`, sqlite files, tests, logs

### Deploy command used

```bash
# From machine with gcloud auth + project selected
# Env file must NOT include PORT

gcloud run deploy hireloop-api \
  --source "apps/api" \
  --region asia-south1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --timeout 3600 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 2 \
  --concurrency 80 \
  --session-affinity \
  --env-vars-file /path/to/env.yaml \
  --quiet
```

### Update CORS / frontend origin later

Comma-separated values need a custom delimiter:

```bash
gcloud run services update hireloop-api \
  --region=asia-south1 \
  --update-env-vars='^@^APP_URL=https://hireloop-blush.vercel.app@ALLOWED_ORIGINS=https://hireloop-blush.vercel.app,http://localhost:3000,http://localhost:3001'
```

### Inspect current env **names** (not values)

```bash
gcloud run services describe hireloop-api \
  --region=asia-south1 \
  --format='yaml(spec.template.spec.containers[0].env)'
```

---

## End-to-end test checklist

1. **API up**
   - [ ] `GET /health` returns ok
   - [ ] `GET /docs` loads
2. **Frontend pointed at API**
   - [ ] Vercel has `NEXT_PUBLIC_API_URL` set to Cloud Run
   - [ ] Vercel redeployed after env change
3. **Shared secret**
   - [ ] `INTERVIEW_INTERNAL_SECRET` identical on Cloud Run and Vercel
4. **Supabase**
   - [ ] Same project URL on web + API
   - [ ] Auth redirect URLs include Vercel domain
5. **Browser smoke**
   - [ ] Open https://hireloop-blush.vercel.app
   - [ ] Sign in works
   - [ ] Network calls go to Cloud Run host
   - [ ] Interview WebSocket connects to  
         `wss://hireloop-api-991739524857.asia-south1.run.app/ws/interview?...`
6. **Email (optional)**
   - [ ] Brevo SMTP vars present on Cloud Run
   - [ ] Send/regenerate interview link succeeds

---

## Cost / behavior notes (test)

- Cloud Run `min instances = 0` → idle is cheap, but **first request after idle can cold-start**.
- WebSocket interviews can run up to **60 minutes** (Cloud Run max request timeout).
- Free quota exists, but a billing account is still required on GCP.
- This is **not** a production hardening checklist (no custom domain, no Cloud Armor, no secret rotation policy documented here).

---

## Local development vs test cloud

| Concern | Local | Test cloud |
|---------|-------|------------|
| API | `uvicorn` on `localhost:8000` / `8001` | Cloud Run `hireloop-api` |
| Web | `npm run dev` on `:3000` | Vercel `hireloop-blush` |
| API URL in web | `http://localhost:8001` | Cloud Run HTTPS URL |
| CORS | localhost origins | Vercel + localhost origins |
| SQLite | optional `DEV_SQLITE=1` | must be `0` |
| Secrets | `apps/api/.env`, `apps/web/.env.local` | Cloud Run + Vercel env |

---

## Related docs

- [`docs/environment.md`](./environment.md) — full env var reference
- [`docs/api.md`](./api.md) — API surface
- [`apps/api/README.md`](../apps/api/README.md) — interview API notes
- [`supabase/README.md`](../supabase/README.md) — schema / setup

---

## Future improvements (not done yet)

- [ ] Custom domain for API (e.g. `api.hireloop.io`)
- [ ] Move secrets to Google Secret Manager
- [ ] Rotate `INTERVIEW_INTERNAL_SECRET` away from local-dev value
- [ ] Set Cloud Run `min-instances=1` if interview cold starts are painful
- [ ] Add CI deploy workflow (GitHub Actions → Cloud Run)
- [ ] Separate staging vs production GCP/Vercel projects
