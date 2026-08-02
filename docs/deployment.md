# HireLoop — Test Deployment Guide

This document records the **current test deployment** setup used for HireLoop, so anyone can redeploy, verify, or extend it later.

> Scope: **test / staging**, not hardened production.  
> Last updated: 2026-08-02 — sections 1–4, 6 verified; section 5 (browser smoke) partially verified via curl (see §5); connectivity re-verified 2026-08-02 (frontend ✅, backend ✅, Supabase ✅, Brevo ✅)

---

## Current live endpoints

| Surface | Provider | URL |
|---------|----------|-----|
| Frontend | Vercel | https://hireloop-dev.vercel.app (canonical) |
| Frontend (legacy) | Vercel | https://hireloop-blush.vercel.app — same app, serves 200; **not** the canonical URL (Cloud Run `ALLOWED_ORIGINS` only lists `hireloop-dev`) |
| Backend API | Google Cloud Run | https://hireloop-api-991739524857.asia-south1.run.app |
| Backend API (alias) | Google Cloud Run | https://hireloop-api-c34t3cinba-el.a.run.app |
| Database / Auth | Supabase | `https://xiniaecawuieywlnopry.supabase.co` |

Both Cloud Run URLs point at the same service and respond on `/health` (re-verified 2026-08-02: both return `{"status":"ok",...}`, frontend returns HTTP 200). **No Koyeb deployment exists** — the backend runs only on Cloud Run.

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
- `APP_URL` = `https://hireloop-dev.vercel.app`
- `ALLOWED_ORIGINS` = `https://hireloop-dev.vercel.app,http://localhost:3000,http://localhost:3001`
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

Project: **hireloop-dev** → Settings → Environment Variables → Production (and Preview if needed).

### Required for Cloud Run cohesion

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://hireloop-api-991739524857.asia-south1.run.app` |
| `NEXT_PUBLIC_APP_URL` | `https://hireloop-dev.vercel.app` |
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

- **Site URL:** `https://hireloop-dev.vercel.app`
- **Redirect URLs** include:
  - `https://hireloop-dev.vercel.app/auth/callback`
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
  --update-env-vars='^@^APP_URL=https://hireloop-dev.vercel.app@ALLOWED_ORIGINS=https://hireloop-dev.vercel.app,http://localhost:3000,http://localhost:3001'
```

### Inspect current env **names** (not values)

```bash
gcloud run services describe hireloop-api \
  --region=asia-south1 \
  --format='yaml(spec.template.spec.containers[0].env)'
```

---

## End-to-end test checklist — Status ✅

1. **API up**
   - [x] `GET /health` returns ok — verified on Cloud Run
   - [x] `GET /docs` loads — FastAPI docs accessible

2. **Frontend pointed at API**
   - [x] Vercel has `NEXT_PUBLIC_API_URL` set to Cloud Run — deployed
   - [x] Vercel redeployed after env change — latest build pushed

3. **Shared secret**
   - [x] `INTERVIEW_INTERNAL_SECRET` identical on Cloud Run and Vercel — matching value deployed

4. **Supabase**
   - [x] Same project URL on web + API — consistent across both
   - [x] Auth redirect URLs include Vercel domain — configured in Supabase dashboard

5. **Browser smoke**
   - [x] Open https://hireloop-dev.vercel.app — returns HTTP 200 (verified via curl 2026-08-02)
   - [ ] Sign in works (requires browser session)
   - [ ] Network calls go to Cloud Run host
   - [ ] Interview WebSocket connects to  
         `wss://hireloop-api-991739524857.asia-south1.run.app/ws/interview?...`

6. **Email (verified)**
   - [x] Brevo SMTP vars present on Cloud Run — configured
   - [x] Send/regenerate interview link succeeds — Brevo API integration tested and working (email received)

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
| Web | `npm run dev` on `:3000` | Vercel `hireloop-dev` |
| API URL in web | `http://localhost:8001` | Cloud Run HTTPS URL |
| CORS | localhost origins | Vercel + localhost origins |
| SQLite | optional `DEV_SQLITE=1` | must be `0` |
| Secrets | `apps/api/.env`, `apps/web/.env.local` | Cloud Run + Vercel env |

---

## Related docs

- [`docs/scope.md`](./scope.md) — system boundary, in/out of scope, platform promises
- [`docs/product.md`](./product.md) — user journeys, feature tiers, AI behavior policy
- [`docs/features.md`](./features.md) — feature register with status
- [`docs/vertical-inventory/`](./vertical-inventory/) — per-vertical feature inventory
- [`apps/api/README.md`](../apps/api/README.md) — interview API notes
- [`supabase/README.md`](../supabase/README.md) — schema / setup

> Note: the old `docs/environment.md` and `docs/api.md` references were removed — those files never existed. Env-var reference lives in the sections above; API surface lives in [`docs/vertical-inventory/backend-v1-api.md`](./vertical-inventory/backend-v1-api.md) + the live OpenAPI at `/docs`.

---

## Schema drift check (run before/after deploys)

Prod schema can silently drift from `supabase/migrations/` (happened 2026-07 — `api_keys` table and `organizations.slug` went missing, breaking v1 auth and org signup). Run the drift check before and after any deploy:

```bash
node scripts/check-prod-schema.mjs
# Expected: "Schema OK: 19 dependencies verified" (exit 0)
```

The script verifies the 19 tables/columns the app depends on against prod PostgREST. A failing check means a schema object is missing from prod — apply the migration or reload the PostgREST schema cache before deploying new code. See `docs/prod-schema-before-2026-08-02.md` for the Phase 0 repair record.

---

## Future improvements (not done yet)

- [ ] Custom domain for API (e.g. `api.hireloop.io`)
- [ ] Move secrets to Google Secret Manager
- [ ] Rotate `INTERVIEW_INTERNAL_SECRET` away from local-dev value
- [ ] Set Cloud Run `min-instances=1` if interview cold starts are painful
- [ ] Add CI deploy workflow (GitHub Actions → Cloud Run)
- [ ] Separate staging vs production GCP/Vercel projects
