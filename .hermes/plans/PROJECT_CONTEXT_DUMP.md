# HireLoop — Complete Project Context Dump

> For agents: everything you need to understand, test, and review the HireLoop codebase.
> Generated: 2026-07-26

---

## What HireLoop Is

**Structured AI-powered interview orchestration platform.** HireLoop replaces forms, calendars, video tools, and spreadsheets with a single workflow. AI handles screening consistency. People own every decision.

**Tagline:** "Structured interviews. Reviewable evidence. Defensible decisions."
**System boundary:** HireLoop owns AI screening + human orchestration → qualified candidate list → `candidate.qualified` webhook. Customer owns offer/background-check/HRIS onboarding.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16.2.10, React 19.2.4, TypeScript 5 |
| **Styling** | Tailwind CSS v4, `tw-animate-css`, CSS variables design tokens |
| **UI Library** | Base UI v1.6.0 (shadcn v4 adapter), shadcn v4.13.0 |
| **Icons** | @phosphor-icons/react v2.1.10 (wrapper component, strokeWidth 1.5) |
| **Animations** | GSAP 3.15.0, @gsap/react 2.1.2, ScrollTrigger |
| **Charts** | Recharts 3.9.1 |
| **Auth** | Supabase Auth (OTP + Google OAuth + Magic Link) |
| **Backend** | FastAPI (Python 3.11 system), Uvicorn with WatchFiles reload |
| **Database** | Supabase (PostgREST API) + SQLite dev fallback (`DEV_SQLITE=1`) |
| **AI** | Google Gemini API (scoring, TTS, STT) |
| **Testing** | Jest 30 + Testing Library (frontend), pytest 55 tests (backend), Playwright (visual regression) |
| **Email** | Brevo SMTP |
| **Font** | Geist (sans), Geist Mono (monospace) |

---

## File Structure (Root: `/Users/aj_builds/Documents/Programs/HireLoop`)

```
├── apps/
│   ├── web/                          # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/                  # 30 Next.js pages (see below)
│   │   │   ├── components/           # 118 React components
│   │   │   │   ├── ui/               # shadcn/Base UI components (25+)
│   │   │   │   ├── animations/       # GSAP scroll-reveal, stagger-reveal
│   │   │   │   ├── layout/           # AppHeader, AppSidebar, Breadcrumbs
│   │   │   │   ├── dashboard/        # Admin dashboard KPIs, charts
│   │   │   │   ├── candidates/       # Candidate table, detail, pipeline board
│   │   │   │   ├── jobs/             # Job creation, questions list
│   │   │   │   ├── auth/             # Sign-in forms, role gate
│   │   │   │   ├── home/             # Landing page components
│   │   │   │   ├── brand/            # Logo, LogoMark
│   │   │   │   ├── icons/            # PhosphorIcon wrapper, icon-map.ts
│   │   │   │   ├── webhooks/         # Webhook CRUD
│   │   │   │   ├── scheduling/       # Calendar, time slots
│   │   │   │   ├── charts/           # Recharts wrappers
│   │   │   │   ├── reports/          # Reports page components
│   │   │   │   ├── pipeline/         # Kanban pipeline board
│   │   │   │   ├── candidate/        # Candidate-facing forms (apply, profile)
│   │   │   │   ├── partner/          # Partner review portal
│   │   │   │   ├── final-interview/  # Final interview portal
│   │   │   │   ├── theme/            # ModeToggle, ThemeProvider
│   │   │   │   └── motion/           # HoverLift, Stagger animations
│   │   │   ├── hooks/                # Custom React hooks
│   │   │   ├── lib/                  # Shared utilities, store, auth, API
│   │   │   │   ├── store/            # HireLoopProvider (React Context state)
│   │   │   │   ├── supabase/         # Supabase client, queries
│   │   │   │   ├── auth/             # Permissions, role checks
│   │   │   │   ├── api/              # API client helpers
│   │   │   │   ├── data/             # Data utilities
│   │   │   │   └── interview/        # Interview flow helpers
│   │   │   └── utils/                # Server/client Supabase utils
│   │   │       └── supabase/         # Server-side Supabase client
│   │   ├── public/                   # Static assets (brand, favicon, SVGs)
│   │   ├── jest.config.cjs           # Jest config
│   │   ├── jest.setup.ts             # Jest setup (mocks)
│   │   └── package.json
│   │
│   └── api/                          # FastAPI backend (Python)
│       ├── main.py                   # Server entry, WebSocket relay, HTTP routes
│       ├── config.py                 # Environment config, SQLite dev fallback
│       ├── routes/
│       │   └── v1.py                 # REST v1 API (28 endpoints)
│       ├── interview/                # Core interview logic
│       │   ├── supabase_store.py     # Supabase data access
│       │   ├── structured_relay.py   # WebSocket interview relay
│       │   ├── scoring.py            # Gemini scoring engine
│       │   ├── proctoring.py         # Proctoring violation detection
│       │   ├── questions.py          # Question generation
│       │   ├── question_audio.py     # TTS pre-rendering
│       │   ├── answer_upload.py      # Audio chunk uploads
│       │   ├── webhooks.py           # Webhook dispatch, HMAC signing
│       │   ├── api_keys.py           # API key management (bcrypt)
│       │   ├── calendar.py           # Calendar sync
│       │   ├── exports.py            # Report exports
│       │   ├── email_notify.py       # Brevo email
│       │   ├── session.py            # Session management
│       │   ├── stt.py / tts.py       # Speech-to-text / Text-to-speech
│       │   └── prompts.py            # Gemini prompt templates
│       └── tests/                    # 55 pytest tests
│           ├── test_v1_backend.py
│           ├── test_webhook_dispatch.py
│           ├── test_security_scopes.py
│           ├── test_integration_pipeline.py
│           └── load/                 # Load tests
│
├── DOCS-1-overviews/                 # Product documentation
│   ├── 1.1_HireLoop_Platform_Overview.md
│   └── 1.10_HireLoop_Product_Architecture.md
│
├── design-system/hireloop/           # Design system tokens
│   └── MASTER.md
├── brand-guidelines.md               # Brand identity guide
├── design.md                         # Design spec
├── DEMO_SCRIPT.md                    # 20-min product demo script
├── ORIGINAL_REQUEST.md               # Original project requirements
├── PROJECT.md                        # Project overview
├── README.md                         # Setup instructions
├── PLAN-frontend-ux.md               # Frontend UX optimization plan
├── docker-compose.dev.yml            # Docker dev setup
├── docker-compose.prod.yml           # Docker prod setup
├── prometheus.yml                    # Monitoring config
├── .github/workflows/                # CI/CD pipeline config
├── supabase/migrations/              # Database migrations
└── scripts/                          # Utility scripts
```

---

## Frontend Pages (30 total)

### Public Pages
| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `landing-page.tsx` | Marketing landing page (hero, product, workflow, security, CTA) |
| `/hero` | `hero/page.tsx` | Demo hero variant page |
| `/login` | `login/page.tsx` | Sign-in (redirects to admin login) |
| `/auth/signup` | `auth-signup.tsx` | Auth signup form |
| `/auth/callback` | `auth-callback.tsx` | OAuth callback handler |
| `/apply/[jobId]` | `apply-page-client.tsx` | Job application form |
| `/candidate/login` | `candidate-auth-form.tsx` | Candidate sign-in |
| `/candidate/signup` | `candidate-auth-form.tsx` | Candidate sign-up |
| `/candidate/[token]` | `interview-page-client.tsx` | Live interview (WebSocket relay) |
| `/candidate/profile` | `candidate-profile.tsx` | Candidate profile + status |
| `/schedule/[token]` | `schedule/SchedulePage.tsx` | Book interview time slot |

### Admin Pages (auth-protected)
| Route | Description |
|-------|-------------|
| `/admin/login` | Admin login |
| `/admin` | Dashboard (KPI stats, charts, activity, recent apps) |
| `/admin/candidates` | Candidate table + board (kanban) views |
| `/admin/candidates/[id]` | Candidate detail (transcript, scores, proctoring) |
| `/admin/jobs` | Job listings |
| `/admin/jobs/new` | Job creation wizard (title, rules, questions, scoring) |
| `/admin/jobs/[id]` | Job detail |
| `/admin/jobs/[id]/questions` | Question bank management |
| `/admin/webhooks` | Webhook CRUD + activity log |
| `/admin/api-keys` | API key generation + management |
| `/admin/scheduling` | Interview scheduling + calendar |
| `/admin/reports` | Analytics (line, funnel, donut charts) |
| `/admin/settings` | General settings |
| `/admin/company` | Organization profile |
| `/admin/offers` | Offer management |
| `/admin/compliance` | Compliance page |
| `/admin/requisitions` | Budget/headcount tracking |
| `/admin/people-search` | People search (candidates) |
| `/admin/welcome` | First-time onboarding tour |

### Other Pages
| Route | Description |
|-------|-------------|
| `/partner/login` | Partner review portal login |
| `/partner/candidates` | Partner candidate review |
| `/final-interview/login` | Final interview portal login |
| `/final-interview/candidates` | Final interview list |
| `/org/[orgId]/jobs` | Org-specific jobs view |
| `/api/health` | Health check |
| `/api/team/invite` | Team invite API |

---

## Backend API — 33 Routes (28 v1 + 5 main)

### Main Routes (main.py)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | Serve frontend static HTML |
| GET | `/health` | Health check → `{"status":"ok","mode":"structured"}` |
| POST | `/interview/session/state` | Reconnect endpoint for interview session |
| POST | `/interview/answers/chunk` | Upload audio chunk |
| POST | `/admin/questions/render-audio` | Pre-render TTS (requires internal secret) |
| WS | `/ws/interview` | WebSocket interview relay (token-based auth) |

### v1 Routes (routes/v1.py) — API Key Auth
| Method | Route | Scopes |
|--------|-------|--------|
| GET | `/v1/health` | none (public) |
| GET/POST | `/v1/jobs` | read/write |
| GET/PATCH/DELETE | `/v1/jobs/{job_id}` | read/write |
| GET | `/v1/applications` | read |
| GET | `/v1/applications/{app_id}` | read |
| POST | `/v1/applications/{app_id}/transition` | write |
| GET | `/v1/applications/{app_id}/score` | read |
| GET/POST | `/v1/applications/{app_id}/scorecards` | read/write |
| GET/POST | `/v1/applications/{app_id}/schedules` | read/write |
| GET/POST | `/v1/applications/{app_id}/offer` | read/write |
| GET | `/v1/candidates` | read |
| GET | `/v1/candidates/{candidate_id}` | read |
| GET | `/v1/jobs/{job_id}/stages` | read |
| GET/POST | `/v1/webhooks` | read/write |
| GET/PATCH/DELETE | `/v1/webhooks/{webhook_id}` | read/write |
| POST | `/v1/webhooks/{webhook_id}/rotate-secret` | admin |
| GET | `/v1/webhooks/{webhook_id}/deliveries` | read |
| GET/POST | `/v1/api-keys` | admin |
| DELETE | `/v1/api-keys/{key_id}` | admin |
| GET | `/v1/calendar/connections` | read |
| DELETE | `/v1/calendar/connections/{conn_id}` | write |
| GET/POST | `/v1/schedules/{schedule_id}/slots` | read/write |
| POST | `/v1/slots/{slot_id}/book` | write |
| GET | `/v1/proctoring/sessions` | read |
| POST | `/v1/proctoring/sessions/{session_id}/override` | admin |
| GET/POST | `/v1/jobs/{job_id}/scoring-rules` | read/write |
| POST | `/v1/scoring/preview` | write |
| GET/POST | `/v1/exports` | read/write |

---

## Key Architecture Details

### State Management
- **React Context** via `HireLoopProvider` in `src/lib/store/provider.tsx`
- No Zustand or Redux — Context + hooks pattern
- Auth state via Supabase `useSession` / `useUser`

### Authentication
- **Supabase Auth** with 3 modes: Password, OTP (magic link), Google OAuth
- Server-side session validation via `supabase/server.ts`
- Frontend auth via `useAuth` hook + `RoleGate` component
- Admin routes protected by middleware proxy (redirects to `/admin/login`)

### Interview Flow (Core Loop)
1. Candidate receives secure link → `/candidate/[token]`
2. WebSocket connects to `/ws/interview` with token validation
3. Server sends `bootstrap` → questions delivered one-by-one
4. Candidate records voice answers (chunked audio via WebSocket + HTTP backup)
5. Audio → STT transcription (Gemini) → scoring (Gemini prompts)
6. Proctoring events captured client-side (MediaPipe face detection)
7. Session state persisted to Supabase for reconnection (up to 2h window)
8. Admin reviews transcript + scores + proctoring timeline in candidate detail

### Scoring
- Gemini AI evaluates answers against scoring prompts (`prompts.py`)
- Per-question scores + overall score
- Human-in-the-loop: scorecards override AI scores
- Custom scoring rules per job role

### Webhooks
- Event types: `application.created`, `score.created`, `candidate.qualified`, `candidate.rejected`, `interview.completed`, `schedule.created`
- HMAC-SHA256 signed payloads
- Retry with exponential backoff (max 5 attempts) + dead-letter queue
- Delivery log with status tracking

### Design System
- **Brand color:** Rust orange `#F97316` → `#EA6B2D` gradient
- **Typography:** Geist (sans), Geist Mono (monospace)
- **Icons:** Phosphor icons via wrapper component, `strokeWidth: 1.5`
- **Spacing:** Generous whitespace (`py-28 sm:py-40` sections)
- **Shadows:** Premium ambient shadows (`shadow-[0_12px_40px_rgba(15,15,15,0.08)]`)
- **Motion:** GSAP scroll reveals with blur+fade, stagger entries, custom cubic-bezier easing

---

## Test Suite Status

| Suite | Count | Status | Last Verified |
|-------|-------|--------|---------------|
| Frontend Jest | 11 tests | ✅ All pass | 2026-07-26 |
| Backend pytest | 55 tests | ✅ All pass | 2026-07-26 |
| TypeScript (`tsc --noEmit`) | — | ✅ 0 errors | 2026-07-26 |
| Build (`npm run build`) | — | ✅ Compiled | 2026-07-26 |
| ESLint | — | ⚠️ 7 errors (5 `no-explicit-any`, 2 React 19 false positives) | 2026-07-26 |

### Frontend Test Files
- `src/app/(demo)/hero/Hero.test.tsx` — Hero renders without crashing (GSAP mocked)
- `src/components/auth/__tests__/role-gate.test.tsx` — RoleGate component (5 tests)
- `src/components/jobs/__tests__/questions-list.test.tsx` — QuestionsList (5 tests)

### Backend Test Files
- `tests/test_v1_backend.py` — API key, health, auth, route count
- `tests/test_webhook_dispatch.py` — Payload building, HMAC signing, retry, DLQ (16 tests)
- `tests/test_security_scopes.py` — Scope enforcement (33 tests)
- `tests/test_integration_pipeline.py` — Full pipeline integration

---

## Known Issues (as of 2026-07-26)

### Fixed in this session
| Issue | Fix |
|-------|-----|
| `self.set is not a function` (GSAP) | Changed both `ScrollReveal` and `StaggerReveal` from `self.set()` to `gsap.set()` |
| `<button> cannot contain nested <button>` | Landing page SheetTrigger → `render` prop pattern |
| `<a> cannot be descendant of <a>` | Removed redundant `<Link>` wrapper around `<Logo>` (Logo already renders its own link) |
| v1 API routes returning 404 | Fixed by running API with `PYTHONPATH=""` to prevent cross-venv pydantic_core contamination |
| `GripVertical` Phosphor icon missing | Remapped to `DotsSixVertical` |
| `FileCheck2` Phosphor icon missing | Remapped to `ClipboardText` |
| 3 missing image 404s | Created SVG placeholders in `public/` |

### Remaining
| Issue | Severity | Notes |
|-------|----------|-------|
| ESLint `no-explicit-any` (5 instances) | Low | Intentional (PhosphorIcon wrapper, generic handlers) |
| ESLint React false positives (2) | Low | Known React 19 lint plugin issues |
| Supabase auth `getSession()` deprecation warning | Low | Recommended to use `getUser()` instead — logged in dev console |
| Turbopack lockfile warning | Low | Multiple lockfiles detected — set `turbopack.root` in `next.config.ts` |
| Missing `loading.tsx` for some routes | Low | Only admin has skeleton loading |
| 63 ESLint warnings (unused imports) | Low | `PhosphorIcon`, `Image`, `StaggerReveal`, `Scorecard` imported but unused in some files |

### Missing Features (Not Implemented)
- AI question generation from job description (question bank is manual)
- AI-powered candidate matching
- Server-side proctoring verification (client-only MediaPipe currently)
- Report export to CSV/PDF from frontend (backend `exports.py` exists but no UI)
- Redis caching (env vars exist, no implementation)
- CI/CD pipeline (doc has YAML but no `.github/workflows/` active)
- SSO/SAML enterprise auth
- Prometheus/Grafana metrics endpoints

---

## Running Locally

```bash
# Frontend dev server (port 3000)
cd apps/web && npm run dev

# API backend with SQLite dev mode (port 8001)
cd apps/api && PYTHONPATH="" DEV_SQLITE=1 python main.py

# Run all tests
cd apps/api && python -m pytest tests/ -v    # 55 backend tests
cd apps/web && npm run test                   # 11 frontend tests
cd apps/web && npx tsc --noEmit               # TypeScript check
cd apps/web && npm run build                  # Full build

# Full TypeScript check (alias)
cd apps/web && npm run test:web               # alias for tsc --noEmit
```

### Required `.env.local` for API
```
GEMINI_API_KEY=your-key-here
INTERVIEW_INTERNAL_SECRET=your-secret
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Hiring a Testing Agent? Here's What to Focus On

1. **Interview WebSocket flow** — start API, connect via WS, verify bootstrap, question delivery, answer upload
2. **Admin auth flow** — login, session persistence, role-gate enforcement
3. **v1 API key auth** — generate key via UI, test read/write/admin scope enforcement
4. **Webhook dispatch** — trigger events, verify HMAC signatures, retry behavior
5. **AJAX/admin actions** — all server actions should handle missing Supabase gracefully
6. **Dark mode** — toggle theme, verify contrast on all pages
7. **Mobile responsive** — check admin sidebar collapse, candidate table, landing page
8. **GSAP animations** — verify `prefers-reduced-motion` disables all animations
9. **Error boundaries** — render error pages for API failures (global-error.tsx, error.tsx)
10. **Empty states** — candidates, jobs, webhooks, reports all show empty state when no data
