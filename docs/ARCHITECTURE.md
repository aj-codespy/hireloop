# HireLoop Architecture Documentation

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              HIRELOOP ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────┐     ┌──────────────────┐     ┌────────────────────────────┐  │
│  │  CANDIDATE   │     │    ADMIN PORTAL  │     │      INTEGRATIONS          │  │
│  │   PORTAL     │     │   (Next.js 16)   │     │  (Webhooks, API, Exports)  │  │
│  │  (Next.js)   │     │                  │     │                            │  │
│  └──────┬───────┘     └────────┬─────────┘     └──────────────┬─────────────┘  │
│         │                      │                              │                │
│         │ HTTPS/WSS            │ HTTPS                        │ HTTPS          │
│         ▼                      ▼                              ▼                │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                        SUPABASE (PostgreSQL + Auth + Storage)             │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │  │
│  │  │   Auth      │  │  Database   │  │  Realtime   │  │  Storage        │  │  │
│  │  │  (Users,    │  │  (Tables,   │  │  (Subscrip- │  │  (Buckets:      │  │  │
│  │  │   Roles,    │  │   RLS, RPC) │  │   tions)    │  │   question-audio,│  │  │
│  │  │   Sessions) │  │             │  │             │  │   interview-    │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │   answers,      │  │  │
│  │                                                     │   proctoring-   │  │  │
│  │                                                     │   snapshots)    │  │  │
│  │                                                     └─────────────────┘  │  │
│  └──────────────────────────────┬──────────────────────────────────────────┘  │
│                                 │                                             │
│                    ┌────────────┴────────────┐                                │
│                    │   SERVICE ROLE KEY      │                                │
│                    │   (Server Actions,      │                                │
│                    │    Backend API)         │                                │
│                    └────────────┬────────────┘                                │
│                                 │                                             │
│         ┌───────────────────────┼───────────────────────┐                    │
│         ▼                       ▼                       ▼                    │
│  ┌─────────────┐        ┌─────────────┐        ┌─────────────┐             │
│  │  BACKEND    │        │  EXTERNAL   │        │  EMAIL      │             │
│  │  API        │        │  AI SERVICES│        │  (Resend)   │             │
│  │  (FastAPI)  │        │             │        │             │             │
│  │             │        │  • Gemini   │        │             │             │
│  │  • WebSocket│        │    (Live,   │        │             │             │
│  │    Interview│        │    Flash,   │        │             │             │
│  │  • TTS/STT  │        │    TTS, STT)│        │             │             │
│  │  • Scoring  │        │  • Deepgram │        │             │             │
│  │  • Proctor  │        │    (STT alt)│        │             │             │
│  └─────────────┘        └─────────────┘        └─────────────┘             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend Framework** | Next.js | 16.2.10 (App Router) | React 19, Server Components, Server Actions |
| **Language** | TypeScript | 5.x | Type safety across stack |
| **Styling** | Tailwind CSS | 4.x | Utility-first, dark mode via `next-themes` |
| **UI Components** | shadcn/ui + Radix | Latest | Accessible, composable primitives |
| **State Management** | React Context + Local Storage | — | Client-side interview state, admin dashboard cache |
| **Database** | Supabase (PostgreSQL) | 15+ | Primary data store, RLS, Realtime, RPC |
| **Auth** | Supabase Auth | — | Email/password, OAuth (Google), magic links |
| **Storage** | Supabase Storage | — | Audio (Q&A), documents, proctoring snapshots |
| **Backend API** | FastAPI | 0.115+ | WebSocket interview relay, TTS/STT, scoring |
| **Python Runtime** | Python | 3.13 | Async, type hints, pydantic |
| **AI - LLM** | Google Gemini | 2.5 Flash / Live | Interview conduction, scoring, TTS |
| **AI - STT** | Deepgram (optional) | — | Alternative speech-to-text |
| **Email** | Resend | — | Transactional emails (interview links, status) |
| **Charts** | Recharts | 3.9+ | Dashboard visualizations |
| **Animation** | Framer Motion | 12.42+ | Page transitions, micro-interactions |
| **Toast/Notifications** | Sonner | 2.0+ | User feedback |

---

## 3. Data Model (Core Tables)

### 3.1 Organization & Membership
```sql
organizations (id, name, logo_url, primary_color, intro_video_url, website, about, created_at)
organization_members (id, org_id, user_id, role, created_at)
  -- roles: owner, admin, recruiter, hiring_manager, interviewer, coordinator, reporting_viewer, final_interviewer
departments (id, org_id, name, created_at) -- unique(org_id, name)
profiles (id, account_type, email, full_name, phone, resume_url, created_at, updated_at)
  -- account_type: candidate, org_admin, partner
```

### 3.2 Jobs & Requisitions
```sql
requisitions (id, org_id, department_id, title, headcount, budget_range, hiring_manager_id, 
              status, approval_notes, created_by, approved_by, approved_at, created_at, updated_at)
  -- status: draft, pending_approval, approved, rejected, closed

job_roles (id, org_id, department_id, requisition_id, title, description, status, 
           eligibility_rules, passing_score, interview_question_count, form_fields, 
           created_at, updated_at)
  -- status: draft, live, closed
  -- eligibility_rules: jsonb array of {fieldKey, operator, value, label}
  -- form_fields: jsonb array of ApplicationFormField
  -- interview_question_count: null = all active questions; number = mandatory + random variable
```

### 3.3 Questions
```sql
questions (id, question_bank_id, job_role_id, section, prompt_text, ideal_answer_notes,
           time_limit_seconds, score_threshold, order_index, is_active, is_mandatory,
           audio_url, audio_url_hi, created_at)
  -- section: technical, hr, situational
  -- is_mandatory: always asked; variable questions sampled from pool
```

### 3.4 Candidates & Applications
```sql
candidates (id, org_id, profile_id, name, email, phone, resume_url, source, created_at)
  -- org_id nullable (global identity via email/profile_id)

applications (id, candidate_id, job_role_id, form_response, status, 
              interview_token, token_expires_at, current_stage_id, created_at)
  -- status: applied, auto_rejected, shortlisted, interview_sent, interviewed,
  --         interview_expired, passed_ai, rejected_ai, partner_review, hired, rejected_final
  -- form_response: jsonb with ApplicationDocument refs for file uploads
```

### 3.5 Interview Pipeline
```sql
pipeline_stages (id, org_id, job_role_id, name, stage_type, order_index, is_required, config, created_at)
  -- stage_type: apply, auto_screen, ai_interview, recruiter_review, human_interview, offer, hired, rejected

application_stage_history (id, application_id, from_stage_id, to_stage_id, 
                           from_status, to_status, actor_id, reason, metadata, created_at)

interview_sessions (id, application_id, started_at, ended_at, status, 
                    total_duration_seconds, question_scores, overall_score,
                    proctoring_log, proctoring_summary, answer_chunks, 
                    question_started_at, created_at)
  -- status: in_progress, completed, abandoned, flagged
  -- proctoring_log: jsonb array of ProctoringLogEntry
  -- proctoring_summary: jsonb {flagged, reason, warnings, critical}
  -- answer_chunks: jsonb map of question_index -> {chunk_paths[], chunk_count, mime_type, finalized}
```

### 3.6 Human Evaluation
```sql
scorecards (id, application_id, stage_id, reviewer_id, recommendation, 
            overall_score, competencies, notes, submitted_at, created_at, updated_at)
  -- recommendation: strong_yes, yes, hold, no, strong_no

interview_schedules (id, application_id, stage_id, scheduled_by, starts_at, ends_at,
                     location, meeting_url, status, attendee_ids, created_at, updated_at)
  -- status: scheduled, rescheduled, completed, cancelled, no_show

offers (id, application_id, status, compensation, start_date, expires_at,
        approved_by, sent_at, responded_at, created_at, updated_at)
  -- status: draft, pending_approval, approved, sent, accepted, declined, withdrawn
```

### 3.7 AI & Proctoring
```sql
ai_usage_logs (id, org_id, model, operation, input_tokens, output_tokens, 
               cost_usd, metadata, created_at)
  -- RLS: org-scoped

proctoring_logs (via interview_sessions.proctoring_log jsonb)
  -- entries: {at, type, severity, detail, question_index, analysis, snapshot_path}

storage.buckets:
  - question-audio (public, 5MB, audio/*)
  - interview-answers (private, 10MB, audio/*)
  - proctoring-snapshots (private, 5MB, image/*)
  - application-documents (private, 10MB, application/*)
```

### 3.8 Audit & Activity
```sql
activity_log (id, org_id, actor_id, entity_type, entity_id, action, metadata, created_at)
  -- entity_type: application, job_role, candidate, offer, scorecard, interview_schedule
```

---

## 4. API Contracts

### 4.1 Frontend Server Actions (Next.js)
Located in `apps/web/src/app/actions/`

| Action | Purpose | Auth |
|--------|---------|------|
| `loadHireLoopStateAction()` | Load org-scoped dashboard state | Org admin |
| `loadCandidatePortalDataAction()` | Candidate's applications & jobs | Candidate |
| `loadInterviewByTokenAction(token)` | Public interview context (no auth) | Token-based |
| `loadPublicJobAction(jobId)` | Public job details for apply page | Public (live only) |
| `loadPublicOrgJobsAction(orgId)` | Org's public careers page | Public |
| `createJobAction(input)` | Create job role | Org manager |
| `updateJobAction(id, patch)` | Update job | Org manager |
| `setJobQuestionsAction(jobId, questions, count)` | Save questions + trigger TTS | Org manager |
| `submitApplicationAction(jobId, formData)` | Public application submit | Public / Candidate |
| `sendToFinalInterviewAction(appId)` | Transition to human round | Pipeline roles |
| `markCandidateHiredAction(appId)` | Hire candidate | Pipeline roles |
| `rejectCandidateFinalAction(appId)` | Final rejection | Pipeline roles |
| `transitionApplicationStageAction(input)` | Move candidate in pipeline | Pipeline roles |
| `submitScorecardAction(input)` | Human scorecard submission | Reviewer roles |
| `regenerateAndSendInterviewLinkAction(appId)` | New interview token + email | Pipeline roles |
| `updateOrganizationAction(patch)` | Org branding/settings | Owner/Admin |
| `getProctoringSnapshotUrlAction(sessionId, path)` | Signed URL for proctoring image | Org member |
| `getApplicationDocumentUrlAction(storagePath)` | Signed URL for candidate doc | Org member |

### 4.2 Backend API (FastAPI) — `apps/api/main.py`

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/health` | GET | Health check | Public |
| `/interview/session/state` | GET | Reconnect session state | Token query |
| `/interview/answers/chunk` | POST | Upload audio chunk | X-Interview-Token, X-Session-Id headers |
| `/admin/questions/render-audio` | POST | Pre-render TTS for questions | X-Internal-Secret |
| `/ws/interview` | WS | Live interview relay | Token + lang query |

#### WebSocket Protocol (`/ws/interview?token=xxx&lang=en`)

**Client → Server Messages:**
```json
{ "type": "ping" }
{ "type": "submit_answer", "question_index": 0, "chunk_count": 5, "audio_base64": "..." }
{ "type": "next_question", "question_index": 0 }
{ "type": "finish_interview" }
{ "type": "proctoring_event", "event_type": "face_missing", "severity": "warning", "detail": "...", "question_index": 0 }
{ "type": "proctoring_snapshot", "image_base64": "...", "mime_type": "image/jpeg", "question_index": 0 }
```

**Server → Client Messages:**
```json
{ "type": "bootstrap" }
{ "type": "session_started", "question_count": 5, "overall_limit_seconds": 600, "overall_remaining_seconds": 600, "question_remaining_seconds": 90, "current_index": 0, "session_id": "...", "resumed": false, "language": "en" }
{ "type": "question_changed", "index": 0, "question_id": "q1", "section": "technical", "prompt": "...", "ideal_answer_notes": "...", "time_limit_seconds": 90, "audio_url": "https://..." }
{ "type": "timer", "question_remaining_seconds": 89, "overall_remaining_seconds": 599, "question_index": 0 }
{ "type": "question_timeout", "reason": "question", "index": 0, "grace_seconds": 60 }
{ "type": "answer_received", "index": 0 }
{ "type": "answer_saved", "question_id": "q1", "text": "Candidate answer...", "index": 0 }
{ "type": "session_ended", "status": "completed", "elapsed_seconds": 342.1, "transcript_count": 10, "questions_answered": 5, "session_id": "..." }
{ "type": "scoring_started" }
{ "type": "scoring_complete", "passed": true, "total_score": 7.8 }
{ "type": "scoring_error", "message": "..." }
{ "type": "proctoring_alert", "event_type": "...", "severity": "warning", "detail": "...", "warning_count": 1, "critical_count": 0 }
{ "type": "proctoring_flagged", "reason": "...", "warnings": 5, "critical": 2 }
{ "type": "error", "message": "..." }
```

### 4.3 Internal RPCs (Supabase)

| RPC | Purpose |
|-----|---------|
| `append_proctoring_event_rpc(session_id, event_type, severity, detail, question_index)` | Atomic proctoring log append |
| `flag_session_proctoring_rpc(session_id, summary)` | Atomic session flagging |
| `is_org_member(org_id, roles[])` | RLS helper |
| `job_org_id(job_role_id)` | RLS helper |

---

## 5. Key Workflows

### 5.1 Job Creation Flow
```
Admin → Job Wizard (5 steps)
  1. Job Details (title, description)
  2. Application Form (drag-drop fields, presets)
  3. Interview Questions (sections, mandatory/variable, count)
  4. Rules & Thresholds (eligibility rules, passing score, publish)
  5. Publish → creates job_roles row + questions rows + triggers TTS via /admin/questions/render-audio
```

### 5.2 Candidate Application Flow
```
Candidate → Public Job Page → Apply Form
  → submitApplicationAction
  → Eligibility evaluation (server-side)
  → If pass: create interview_token (72hr), send email with /candidate/{token}
  → If fail: status = auto_rejected
```

### 5.3 AI Interview Flow
```
Candidate clicks /candidate/{token}
  → loadInterviewByTokenAction → InterviewTokenContext
  → CandidateInterviewFlow (React)
    1. Intro (language select, org video)
    2. Consent (recording, proctoring)
    3. Proctoring Setup (camera permission, face detection calibration)
    4. Mic Check (audio level test)
    5. Live Interview (InterviewStructured)
       - WebSocket to /ws/interview
       - Question audio plays (pre-rendered TTS)
       - Candidate records answer → chunked upload → WebSocket submit_answer
       - Server transcribes (background) → advances immediately
       - Proctoring snapshots every 10s (client) → AI analysis → log + alert
       - Timer enforcement (question + overall)
    6. Complete / Flagged → Score in background (Gemini Flash)
```

### 5.4 Scoring Flow
```
Interview ends → _finish_and_score()
  → Wait for pending transcriptions (max 120s)
  → finalize_session in DB
  → score_interview(questions, transcripts, passing_score)
    → Gemini Flash structured prompt → JSON with questionScores + overallScore
  → save_scores to interview_sessions + applications table
  → If pass + passing_score configured: application.status = passed_ai
  → Else: rejected_ai
  → WebSocket: scoring_complete {passed, total_score}
```

### 5.5 Human Review Pipeline
```
Admin Dashboard → Pipeline Kanban (/admin/candidates)
  → Candidate Detail View (tabs: Application, Documents, Job, Proctoring, Transcript, Scores, Scorecard)
  → Actions: Send to Final Interview, Regenerate Link, Scorecard, Hire, Reject
  → Scorecard: recommendation + score + notes → scorecards table
  → Interview Scheduling: calendar slots → interview_schedules table + email
  → Offer: compensation + dates → offers table → email → candidate accepts/declines
```

---

## 6. Security Model

### 6.1 Row Level Security (RLS)
All tables have RLS enabled. Policies use `public.is_org_member(org_id, roles?)` helper.

| Table | Read Policy | Write Policy |
|-------|-------------|--------------|
| organizations | org member | owner/admin |
| job_roles | org member | owner/admin |
| questions | org member (via job_roles) | owner/admin |
| candidates | org member (via applications) | — (public insert for apply) |
| applications | org member (via job_roles) | pipeline roles (update status) |
| interview_sessions | org member (via applications) | org member (update via backend) |
| pipeline_stages | org member | owner/admin |
| scorecards | org member | reviewer roles |
| interview_schedules | org member | pipeline roles |
| offers | org member | owner/admin |
| departments | org member | owner/admin |
| requisitions | org member | owner/admin |
| activity_log | org member | org member (insert) |
| ai_usage_logs | org member | service role only |

### 6.2 Authentication
- **Supabase Auth** — email/password, Google OAuth, magic links
- **Session** — JWT in httpOnly cookie (SSR) + localStorage (client)
- **Server Actions** — `createServerClient()` with cookies
- **Backend API** — Service role key (bypasses RLS) + token validation
- **WebSocket** — Token in query string, validated on bootstrap

### 6.3 Proctoring Security
- Snapshots: private bucket, signed URLs (1hr), path = `{session_id}/{uuid}.jpg`
- Answer audio: private bucket, service-role only
- WebRTC: Client-side face detection (MediaPipe) + server-side AI snapshot analysis
- Flags: 3 critical OR 15 warnings = auto-flag (configurable per job)

### 6.4 Rate Limiting & Abuse Prevention (TODO)
- ⚠️ **Current Gap**: No rate limiting on public endpoints
- ⚠️ **Current Gap**: WebSocket accepted before token validation
- ⚠️ **Current Gap**: CORS `allow_origins=["*"]` with credentials

---

## 7. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRODUCTION                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │   Vercel     │     │   Railway    │     │   Supabase   │    │
│  │  (Frontend)  │     │  (Backend)   │     │  (Managed)   │    │
│  │              │     │              │     │              │    │
│  │ Next.js 16   │     │ FastAPI      │     │ PostgreSQL   │    │
│  │ Server Acts  │◄────►│ WebSocket    │◄────►│ Auth         │    │
│  │ Static Assets│     │ TTS/STT      │     │ Storage      │    │
│  │ Edge Funcs   │     │ Scoring      │     │ Realtime     │    │
│  │              │     │ Proctoring   │     │ RPCs         │    │
│  └──────────────┘     └──────────────┘     └──────────────┘    │
│         │                    │                    │             │
│         └────────────────────┴────────────────────┘             │
│                              │                                   │
│                    ┌─────────┴─────────┐                         │
│                    │   External AI     │                         │
│                    │  (Gemini, Deepgram)│                        │
│                    └───────────────────┘                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Environment Variables (Critical):**
```bash
# Frontend (Vercel)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_API_URL=http://localhost:8000  # or production API URL
INTERVIEW_INTERNAL_SECRET=<shared-with-backend>

# Backend (Railway)
SUPABASE_URL
SUPABASE_SECRET_KEY
GEMINI_API_KEY
DEEPGRAM_API_KEY
INTERVIEW_INTERNAL_SECRET=<same-as-frontend>
PORT=8000
INTERVIEW_OVERALL_LIMIT_SECONDS=600
INTERVIEW_RECONNECT_HOURS=2

# Email (Resend)
RESEND_API_KEY
RESEND_FROM=noreply@hireloop.com
APP_URL=https://app.hireloop.com
```

---

## 8. Current Technical Debt & Known Issues

| Area | Issue | Severity | File/Location |
|------|-------|----------|---------------|
| **Backend** | No shared `httpx.AsyncClient` pool | High | `apps/api/utils/http_pool.py` exists but not used |
| **Backend** | Proctoring RPCs not deployed to prod Supabase | Critical | `supabase/migrations/20260714193500_proctoring_atomic_rpcs.sql` |
| **Backend** | WebSocket accepted before token validation | High | `apps/api/main.py:121` |
| **Backend** | CORS `allow_origins=["*"]` with credentials | High | `apps/api/main.py:27` |
| **Backend** | No rate limiting on public endpoints | High | `apps/api/main.py` |
| **Database** | `applications.status` CHECK constraint missing some values | Medium | Migration `20260714193600_add_applications_status_check.sql` |
| **Database** | `ai_usage_logs` RLS cross-tenant leak (fixed in migration) | High | Migration `20260714193700_secure_ai_usage_logs_rls.sql` |
| **Frontend** | Some Server Actions don't handle fetch errors gracefully | Medium | `apps/web/src/app/actions/hireloop.ts` |
| **Frontend** | Missing error boundaries on interview pages | Medium | `apps/web/src/app/candidate/[token]/page.tsx` |
| **Testing** | No automated backend test suite (pytest not configured) | Medium | `apps/api/` |
| **Testing** | No E2E interview flow test | Medium | — |

---

## 9. Scaling Considerations

| Component | Current Limit | Scaling Strategy |
|-----------|---------------|------------------|
| **Concurrent Interviews** | ~50 (WebSocket + AI) | Horizontal API pods; Redis for session state; connection pooling |
| **TTS/STT API Calls** | Gemini rate limits | Pre-render question audio; chunked upload + async transcription; cache TTS |
| **Proctoring Snapshots** | 350/session, 10s interval | Configurable; batch analysis; optional client-only mode |
| **Database Connections** | Supabase pooler (100) | PgBouncer; read replicas for analytics |
| **Storage** | Supabase (1GB free) | Lifecycle policies; move cold data to S3/R2 |
| **Email** | Resend limits | Queue + batch; provider fallback |

---

## 10. Monitoring & Observability (Current State)

| Tool | Coverage |
|------|----------|
| **Logging** | `loguru` in backend; `console.log` in frontend; no centralized aggregation |
| **Error Tracking** | None configured (Sentry recommended) |
| **Metrics** | None (Prometheus + Grafana recommended) |
| **Tracing** | None (OpenTelemetry recommended) |
| **Uptime** | None (Better Uptime / PagerDuty recommended) |

---

*Generated from codebase analysis — keep updated with each architecture change.*