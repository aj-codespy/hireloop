# Gap Analysis: Current State vs. Production PaaS

**Version:** 1.0  
**Status:** Assessment Complete  
**Codebase Analyzed:** `/Users/aj_builds/Documents/Programs/HireLoop` (as of 2026-07-17)  
**Reference Docs:** ARCHITECTURE.md, FEATURE_SCOPE.md, PAAS_MULTITENANT_DESIGN.md, INTERVIEW_LIFECYCLE_DECISION.md

---

## 1. Executive Summary

| Metric | Assessment |
|--------|------------|
| **Core AI Interview Product** | ~85% complete (voice, proctoring, scoring, transcript) |
| **Admin Portal (Single Org)** | ~75% complete (jobs, candidates, pipeline, reports) |
| **Multi-Tenant PaaS Foundation** | ~35% complete (DB ready, UI/RBAC gaps) |
| **Human Round Orchestration** | ~40% complete (DB + API, no calendar sync, no self-scheduling) |
| **Integration Layer** | ~10% complete (webhooks designed, not built) |
| **Production Hardening** | ~50% complete (migrations pending, rate limiting missing) |

**Overall PaaS Readiness:** ~45% — Core product works; PaaS wrapper needs 3-4 months focused effort.

---

## 2. Feature-by-Feature Gap Analysis

### 2.1 Organization & Tenant Management

| Feature | Status | Evidence | Gap | Effort |
|---------|--------|----------|-----|--------|
| Organization Profile | ✅ | `organizations` table, `company/page.tsx`, `updateOrganizationAction` | Multi-org UI (switcher, onboarding) | M |
| Team Invitations | 🟡 | `invite-team-member-form.tsx`, `enterprise.ts:inviteTeamMemberAction` | Bulk invite, SSO, role templates | S |
| Department Management | 🟡 | `departments` table + RLS, linked to requisitions/jobs | Dedicated UI (CRUD, lead assignment, dept-scoped views) | M |
| Role-Based Access (RBAC) | 🟡 | 8 roles in DB + RLS policies (`rls_org_scope.sql`) | **UI enforcement missing** — all authenticated users see everything | M |
| Org Switcher (Multi-org User) | ⬜ | `fetchHireLoopState(scopeOrgId?)` accepts param but UI doesn't use it | Header dropdown, persisted context, deep links | M |
| Billing/Subscription | ⬜ | `subscription_tier` field in org table (planned) | Stripe integration, usage metering, invoicing | L |
| Custom Domain/White-label | ⬜ | `custom_domain` field planned | DNS verification, SSL, branded candidate portal | L |

### 2.2 Job & Requisition Management

| Feature | Status | Evidence | Gap | Effort |
|---------|--------|----------|-----|--------|
| Job Creation Wizard | ✅ | `job-creation-wizard.tsx` (5 steps) | Department linking, template library | S |
| Application Form Builder | ✅ | `form-fields-builder.tsx`, `form-fields.ts` | Conditional logic, field dependencies | M |
| Eligibility Rules | ✅ | `eligibility.ts`, evaluated on submit | Complex rules (AND/OR groups), date-based | S |
| Question Bank Editor | ✅ | `job-questions-editor.tsx` (mandatory/variable, sections) | Org-wide library, versioning, import/export | M |
| Question Audio Pre-render | ✅ | `setJobQuestionsAction` → `/admin/questions/render-audio` | Queue/retry for failures, progress UI | S |
| Requisition Approval Flow | 🟡 | `requisitions` table + status enum, `requisitions/page.tsx` (stub) | Full UI: create → approve → link to job | M |
| Pipeline Stages Config | 🟡 | `pipeline_stages` table + RLS, `pipeline_stages` linked to jobs | Visual editor (drag-drop), stage types, config JSON | M |
| Job Templates/Library | ⬜ | — | Save/publish templates, clone from template | M |

### 2.3 Candidate Application & Portal

| Feature | Status | Evidence | Gap | Effort |
|---------|--------|----------|-----|--------|
| Public Apply Page | ✅ | `apply/[jobId]/page.tsx`, `apply-page-client.tsx` | Department filter on careers page, SEO schema | S |
| Form Submission + Eligibility | ✅ | `submitApplicationAction`, `evaluateEligibility` | Resume parsing prefill, save draft | S |
| Candidate Auth | ✅ | `candidate/login`, `candidate/signup`, `auth_profiles.sql` | SSO login, magic links | S |
| Candidate Profile Portal | ✅ | `candidate/profile/page.tsx` | Interview history, document vault, data export | M |
| Interview Link + Token | ✅ | `loadInterviewByTokenAction`, token expiry, reconnect | Retake policy UI, cooldown config | S |
| Multi-language Interview | ✅ | EN/HI toggle in flow, TTS/STT per language | Additional languages, UI translation | M |

### 2.4 AI Interview Engine (Core Product)

| Feature | Status | Evidence | Gap | Effort |
|---------|--------|----------|-----|--------|
| Voice Interview (TTS/STT) | ✅ | `structured_relay.py`, `tts.py`, `stt.py`, `InterviewStructured` | Audio-only fallback, bandwidth adaptation | S |
| Structured Q&A Flow | ✅ | `session.py`, `InterviewStructured` | Adaptive branching, follow-up questions | M |
| Proctoring (Client) | ✅ | `use-proctoring.ts`, `proctoring-panel.tsx`, MediaPipe | Mobile Safari support, false positive tuning | M |
| Proctoring (Server AI) | ✅ | `structured_relay.py:_handle_proctoring_snapshot`, `proctoring.py` | Custom violation types, evidence packaging | S |
| Auto-flag Thresholds | ✅ | 3 critical / 15 warnings (configurable in code) | Per-job config UI, graduated response | S |
| Session Resumability | ✅ | `find_resumable_session`, reconnect window | Reconnect UI progress indicator | S |
| Chunked Audio Upload | ✅ | `/interview/answers/chunk`, `answer_upload.py` | Progress UI, resume on failure | S |
| Transcription (Async) | ✅ | `_transcribe_in_background`, `stt.py` | Speaker diarization, confidence scores | M |
| LLM Scoring | ✅ | `scoring.py`, structured prompt, validation | Custom rubrics, bias audit, explainability | M |
| Score Persistence | ✅ | `supabase_store.py:save_scores`, `interview_sessions` JSONB | Score versioning, manual override | S |
| Score Breakdown UI | ✅ | `score-breakdown.tsx`, `candidate-detail-view.tsx` | Comparative benchmarking, trend lines | M |

### 2.5 Pipeline & Candidate Management

| Feature | Status | Evidence | Gap | Effort |
|---------|--------|----------|-----|--------|
| Kanban Board | ✅ | `pipeline-kanban.tsx` (drag-drop columns) | Department swimlanes, WIP limits, bulk drag | M |
| Candidates Table | ✅ | `candidates-table.tsx`, `candidates/page.tsx` | Advanced filters, saved views, export | S |
| Candidate Detail View | ✅ | `candidate-detail-view.tsx` (7 tabs) | Communication timeline, tags, internal notes | M |
| Proctoring Log View | ✅ | `proctoring-log-view.tsx`, `proctoring-snapshot-gallery.tsx` | Export evidence pack (PDF) | S |
| Transcript View | ✅ | `transcript-view.tsx` | Search, speaker filter, download | S |
| AI Score Detail | ✅ | `score-breakdown.tsx` | Question-level trends, cohort comparison | M |
| Human Scorecard | ✅ | `scorecards` table, `submitScorecardAction`, scorecard tab | Competency library, calibration reports | M |
| Stage History | 🟡 | `application_stage_history` table, logged in `transitionApplicationStageAction` | Timeline visualization, SLA tracking | S |
| Bulk Actions | ⬜ | — | Select multiple → move, message, export, delete | M |
| Global People Search | 🟡 | `people-search/page.tsx` (stub) | Cross-job search, filters, saved searches | M |
| Candidate Tags/Notes | ⬜ | — | Private recruiter notes, custom tags | S |

### 2.6 Human Interview Orchestration

| Feature | Status | Evidence | Gap | Effort |
|---------|--------|----------|-----|--------|
| Interview Scheduling | 🟡 | `interview_schedules` table, `scheduling/page.tsx` (stub) | **Calendar sync (Google/Outlook)**, slot management | L |
| Candidate Self-Scheduling | ⬜ | — | Public scheduling page, conflict resolution | L |
| Automated Reminders | ⬜ | — | 24h/2h/15m email + calendar | M |
| Panel Interviews | ⬜ | `attendee_ids` array in table | Multi-interviewer scheduling, consolidated scorecard | M |
| Rescheduling Flow | ⬜ | `status` enum has `rescheduled` | Initiator tracking, auto-notify all | S |
| Interviewer Dashboard | ⬜ | — | My interviews, prep materials, scorecard template | M |
| Scorecard Calibration | ⬜ | — | Side-by-side comparison, bias flags | L |

### 2.7 Offers & Hiring

| Feature | Status | Evidence | Gap | Effort |
|---------|--------|----------|-----|--------|
| Offer Management | 🟡 | `offers` table + status enum, `offers/page.tsx` (stub) | **Templates**, approval chain, e-signature | M |
| Offer Templates | ⬜ | — | Variable substitution, PDF generation, versioning | M |
| E-Signature | ⬜ | — | DocuSign/HelloSign integration or native canvas | M |
| Offer Expiry Tracking | 🟡 | `expires_at` field | Auto-expire cron, reminders | S |
| Hire/Reject Actions | ✅ | `markCandidateHiredAction`, `rejectCandidateFinalAction` | Onboarding handoff webhook | S |

### 2.8 Communication & Messaging

| Feature | Status | Evidence | Gap | Effort |
|---------|--------|----------|-----|--------|
| Interview Invite Email | ✅ | `send-interview-link.ts`, Resend integration | Template editor, preview, test send | S |
| Status Change Emails | ✅ | `send-application-status.ts` | Per-status templates, branding | S |
| Interview Expiry Email | ✅ | `send-interview-expired.ts` | — | — |
| Admin → Candidate DM | ⬜ | — | **Compose from any view**, templates, merge tags | M |
| Bulk Messaging | ⬜ | — | Select candidates → send template | M |
| Communication Timeline | ⬜ | — | Unified thread per candidate (email + in-app) | M |
| In-App Notifications | ⬜ | — | Bell icon, real-time (Supabase Realtime) | M |

### 2.9 Reporting & Analytics

| Feature | Status | Evidence | Gap | Effort |
|---------|--------|----------|-----|--------|
| Dashboard Overview | ✅ | `admin-dashboard.tsx` (metrics, charts, action items) | Custom date ranges, dept filter | S |
| Pipeline Funnel | ✅ | `pipeline-funnel-chart.tsx` | Stage conversion benchmarks | S |
| Sources Donut | ✅ | `sources-donut-chart.tsx` | Source ROI, cost per hire | S |
| Applications Over Time | ✅ | `pipeline-line-chart.tsx` | Cohort analysis | S |
| Reports Page | 🟡 | `reports/page.tsx` (stub) | **Scheduled exports**, custom report builder | M |
| Compliance/EEO | 🟡 | `compliance/page.tsx` (stub) | Demographic capture, EEO-1 report, adverse impact | M |
| Time-to-Hire Metrics | ⬜ | — | Stage duration, bottlenecks | M |
| Interviewer Calibration | ⬜ | — | Score variance, pass rate by interviewer | L |
| Question Analytics | ⬜ | — | Predictive validity, adverse impact per question | L |

### 2.10 Integration & Export Layer

| Feature | Status | Evidence | Gap | Effort |
|---------|--------|----------|-----|--------|
| Webhook Framework | ⬜ | — | **Registration, HMAC, retry, DLQ, versioning** | M |
| Core Webhook Events | ⬜ | — | 14 events defined in `INTEGRATION_EXPORT_SPEC.md` | S |
| REST API v1 | ⬜ | — | Jobs, Applications, Candidates, Scores, Stages, Offers | M |
| GraphQL API | ⬜ | — | Flexible queries for embedded dashboards | L |
| Scheduled Exports | ⬜ | — | S3/SFTP/Sheets, CSV/JSON/Parquet, field mapping | M |
| ATS Connectors | ⬜ | — | **Greenhouse, Lever, Ashby** (bidirectional) | L |
| API Key Management | ⬜ | — | Scoped keys, rotation, audit log | M |
| SSO/SAML | ⬜ | — | Okta, Entra ID, Google Workspace | L |
| SCIM Provisioning | ⬜ | — | Auto-provision/deprovision team members | L |

### 2.11 Compliance & Security

| Feature | Status | Evidence | Gap | Effort |
|---------|--------|----------|-----|--------|
| RLS (Row Level Security) | ✅ | All tables + policies in migrations | **Multi-org enforcement verified** | — |
| Audit Log | 🟡 | `activity_log` table + RLS | Immutable write, tamper evidence, export | S |
| Data Retention Policies | ⬜ | `retention_days` field planned | Automated purge/anonymize jobs | M |
| GDPR/DSAR Export | ⬜ | — | One-click candidate data package | M |
| Proctoring Data Retention | 🟡 | Snapshots in private bucket | Auto-delete unflagged after 30d | S |
| Rate Limiting | ⬜ | **MISSING** — `main.py` CORS `*`, no rate limits | **Critical** — API, WebSocket, auth endpoints | M |
| WebSocket Auth Timing | 🟡 | Accepted before token check (`main.py:121`) | Validate token at handshake | S |
| CORS Configuration | 🟡 | `allow_origins=["*"]` + credentials | Explicit origins per environment | S |
| Secrets Management | 🟡 | `.env` files | Vault/parameter store, rotation | M |
| Penetration Testing | ⬜ | — | Annual third-party | — |

### 2.12 Infrastructure & Operations

| Feature | Status | Evidence | Gap | Effort |
|---------|--------|----------|-----|--------|
| Supabase Migrations Deployed | 🟡 | **Blocked** — `proctoring_atomic_rpcs.sql` not deployed | Deploy to prod, verify concurrency script | S |
| HTTP Connection Pooling | ⬜ | `http_pool.py` exists but not used in all clients | Shared `httpx.AsyncClient` everywhere | S |
| Backend Tests | ⬜ | `pytest` not in `apps/api` requirements | Unit + integration test suite | M |
| Frontend Build/Lint | ✅ | `npm run build` + `lint` pass | — | — |
| E2E Tests | ⬜ | — | Playwright: apply → interview → score → hire | L |
| Monitoring/Logging | 🟡 | `loguru` in backend, console in frontend | **Centralized** (Datadog/Sentry/Grafana) | M |
| Error Tracking | ⬜ | — | Sentry integration | S |
| Uptime Monitoring | ⬜ | — | Better Uptime / PagerDuty | S |
| CI/CD Pipeline | 🟡 | GitHub Actions? (not visible) | Automated deploy, migration, smoke tests | M |
| Database Backups | 🟡 | Supabase managed | Point-in-time recovery tested | — |
| Disaster Recovery | ⬜ | — | RPO/RTO defined, failover tested | L |

---

## 3. Technical Debt Register (from ARCHITECTURE.md + Code Review)

| ID | Component | Issue | Severity | File/Location | Effort to Fix |
|----|-----------|-------|----------|---------------|---------------|
| TD-01 | Backend HTTP | No shared `httpx.AsyncClient` pool | High | `apps/api/utils/http_pool.py` exists but unused | S |
| TD-02 | Proctoring RPCs | Atomic RPCs not deployed to production Supabase | Critical | `supabase/migrations/20260714193500_proctoring_atomic_rpcs.sql` | S |
| TD-03 | WebSocket Auth | Connection accepted before token validation | High | `apps/api/main.py:121` | S |
| TD-04 | CORS | `allow_origins=["*"]` with credentials | High | `apps/api/main.py:27` | S |
| TD-05 | Rate Limiting | None on public endpoints | Critical | `apps/api/main.py` | M |
| TD-06 | Applications Status CHECK | Missing some status values in constraint | Medium | Migration `20260714193600_add_applications_status_check.sql` | S |
| TD-07 | AI Usage Logs RLS | Cross-tenant leak fixed in migration not deployed | High | Migration `20260714193700_secure_ai_usage_logs_rls.sql` | S |
| TD-08 | Backend Test Setup | `pytest` not in requirements, manual test scripts | Medium | `apps/api/` | M |
| TD-09 | Frontend Error Boundaries | Missing on interview pages | Medium | `apps/web/src/app/candidate/[token]/page.tsx` | S |
| TD-10 | Server Action Error Handling | Some fetch errors not surfaced to UI | Medium | `apps/web/src/app/actions/hireloop.ts` | S |

---

## 4. Risk Register

| Risk ID | Risk | Likelihood | Impact | Mitigation |
|---------|------|------------|--------|------------|
| R-01 | Proctoring false positives cause candidate complaints / legal risk | Medium | High | Configurable thresholds, human review mandatory for flagged, appeal flow |
| R-02 | AI scoring bias (demographic disparity) | Medium | High | Bias audit dashboard (Phase 4), human-in-the-loop for all rejections |
| R-03 | WebRTC/audio failures on candidate mobile devices | High | Medium | Graceful degradation (audio-only), chunked HTTP upload fallback, device testing lab |
| R-04 | Supabase rate limits / cost at scale | Medium | Medium | Connection pooling, pre-render TTS, batch proctoring, dedicated PG if needed |
| R-05 | Competitor copies voice+proctoring loop | Medium | Medium | Speed to PaaS features, proprietary scoring prompts, bilingual TTS moat |
| R-06 | Regulatory (AI Act, EEOC, GDPR) | Low-Med | High | Explainable scores, no automated final rejection, DPA, data residency options |
| R-07 | Key person dependency (ML/AI prompts) | Medium | Medium | Document prompt engineering, version prompts, automated regression tests |
| R-08 | Multi-org data leak via RLS bug | Low | Critical | Comprehensive RLS test suite, penetration testing |
| R-09 | Webhook delivery failures cause data inconsistency | Medium | High | Idempotency keys, DLQ with replay, customer-facing delivery dashboard |
| R-10 | Candidate drop-off due to interview complexity | Medium | High | UX testing, time-to-complete metrics, progressive disclosure |

---

## 5. Prioritized Backlog for PaaS Launch

### P0 — Must Have for PaaS Beta (Weeks 1-8)

| # | Item | Category | Effort | Dependencies |
|---|------|----------|--------|--------------|
| 1 | Deploy pending Supabase migrations (proctoring RPCs, RLS fixes, CHECK constraints) | Infra | S | Supabase CLI access |
| 2 | Fix WebSocket auth (validate at handshake) + CORS + Rate limiting | Security | M | — |
| 3 | Implement HTTP connection pooling (use `http_pool.py`) | Infra | S | — |
| 4 | Build Org Switcher + Multi-org Onboarding Wizard | PaaS Core | M | RBAC UI enforcement |
| 5 | Enforce RBAC in UI (hide/show per role) | PaaS Core | M | `useOrgPermissions` hook exists |
| 6 | Department Management UI (CRUD, lead assignment, scoped views) | PaaS Core | M | — |
| 7 | Webhook Framework (register, HMAC, retry, DLQ, versioning) | Integration | M | — |
| 8 | Core Webhook Events (14 events) | Integration | S | Webhook framework |
| 9 | Admin → Candidate Messaging (compose, templates, timeline) | Communication | M | — |
| 10 | Bulk Candidate Actions (select → move, message, export) | Pipeline | M | — |
| 11 | Scheduled Exports (S3/SFTP, CSV/JSON, field mapping) | Integration | M | Export framework |
| 12 | Calendar Sync (Google/Outlook) for Interview Scheduling | Human Rounds | L | OAuth setup |
| 13 | Candidate Self-Scheduling Page | Human Rounds | L | Calendar sync |
| 14 | Offer Templates + PDF Generation + E-Sign Webhook | Offers | M | — |

### P1 — Differentiation & Scale (Weeks 9-16)

| # | Item | Category | Effort |
|---|------|----------|--------|
| 15 | Question Bank Library (org-wide, versioned, import/export) | Jobs | M |
| 16 | Pipeline Stage Visual Editor (drag-drop, config JSON) | Pipeline | M |
| 17 | Custom Report Builder + Scheduled Dashboard Emails | Reporting | M |
| 18 | EEO/Compliance Reports (demographics, adverse impact) | Compliance | M |
| 19 | Greenhouse Connector (bidirectional) | Integration | L |
| 20 | Lever Connector (bidirectional) | Integration | L |
| 21 | API Keys Management (scoped, rotation, audit) | Integration | M |
| 22 | In-App Notifications (Realtime, bell icon) | Communication | M |
| 23 | Interviewer Dashboard (my interviews, prep, scorecards) | Human Rounds | M |
| 24 | Automated Reminders (24h/2h/15m) for Human Rounds | Human Rounds | M |
| 25 | Data Retention Policies + Auto-Purge Jobs | Compliance | M |

### P2 — Enterprise & Maturity (Weeks 17-28)

| # | Item | Category | Effort |
|---|------|----------|--------|
| 26 | SSO/SAML (Okta, Entra ID, Google) | Security | L |
| 27 | SCIM Provisioning | Security | L |
| 28 | Custom Domain / White-label Candidate Portal | PaaS Core | L |
| 29 | Billing/Subscription (Stripe, usage metering) | PaaS Core | L |
| 30 | GraphQL API + Embedded Dashboard SDK | Integration | L |
| 31 | Ashby / Workday / BambooHR Connectors | Integration | L |
| 32 | Bias Audit Dashboard (demographic parity on scores) | Analytics | M |
| 33 | Question Performance Analytics (predictive validity) | Analytics | L |
| 34 | Interviewer Calibration Reports | Analytics | L |
| 35 | Advanced Scheduling (panel optimization, load balancing) | Human Rounds | L |
| 36 | Disaster Recovery Plan + Failover Test | Infra | L |

---

## 6. Effort Summary by Category

| Category | P0 Items | P1 Items | P2 Items | Total Effort (Person-Weeks) |
|----------|----------|----------|----------|----------------------------|
| Infrastructure | 3 | 0 | 1 | 6 |
| Security/Compliance | 1 | 1 | 3 | 14 |
| PaaS Core (Multi-org, Dept, RBAC) | 4 | 1 | 2 | 18 |
| Integration (Webhooks, API, Exports, ATS) | 5 | 3 | 2 | 26 |
| Human Round Orchestration | 2 | 3 | 1 | 16 |
| Communication | 1 | 1 | 0 | 6 |
| Reporting/Analytics | 0 | 2 | 3 | 12 |
| Offers/Hiring | 1 | 0 | 0 | 4 |
| **Total** | **17** | **11** | **12** | **~102 person-weeks** |

**Team Sizing Recommendation:** 3-4 engineers × 6-8 months for P0+P1; +2 for P2.

---

## 7. Architecture Decisions Needed

| # | Decision | Options | Recommendation | Blocking |
|---|----------|---------|----------------|----------|
| AD-01 | Webhook signature algorithm | HMAC-SHA256 vs JWT | HMAC-SHA256 (simpler, standard) | P0 |
| AD-02 | API versioning strategy | URL (`/v1/`) vs Header | URL path (explicit, cacheable) | P0 |
| AD-03 | Calendar sync: build vs buy | Google/Outlook APIs vs Nylas/Cal.com | Build (control, cost) — 2 providers only | P0 |
| AD-04 | E-sign: embed DocuSign vs native | DocuSign API vs canvas signature | DocuSign (legal compliance) | P1 |
| AD-05 | Multi-region data residency | Supabase multi-region vs single | Per-org region (Scale tier) | P1 |
| AD-06 | Candidate re-attempt policy | Configurable per job | Job-level `max_attempts` + `cooldown_hours` | P0 |
| AD-07 | Proctoring strictness default | Strict/Balanced/Lenient | Balanced (3 critical / 15 warnings) | P0 |
| AD-08 | Scoring model pluggability | Fixed (Gemini) vs webhook for custom | Webhook for Scale tier (custom scoring engine) | P1 |

---

## 8. File Reference Index (Key Implementation Files)

```
# Core Interview Engine
apps/api/interview/structured_relay.py    # WebSocket relay, timers, proctoring, scoring
apps/api/interview/session.py             # Session state machine
apps/api/interview/scoring.py             # LLM scoring with validation
apps/api/interview/proctoring.py          # AI snapshot analysis
apps/api/interview/stt.py / tts.py        # Speech services
apps/api/interview/answer_upload.py       # Chunked audio assembly
apps/api/interview/supabase_store.py      # DB persistence

# Frontend Interview Flow
apps/web/src/components/candidate/candidate-interview-flow.tsx
apps/web/src/components/candidate/interview-structured.tsx
apps/web/src/components/candidate/proctoring-*.tsx
apps/web/src/lib/proctoring/use-proctoring.ts

# Admin Portal
apps/web/src/app/admin/(dashboard)/jobs/new/page.tsx          # Job wizard
apps/web/src/app/admin/(dashboard)/jobs/[id]/questions/page.tsx
apps/web/src/app/admin/(dashboard)/candidates/[id]/page.tsx   # Detail view
apps/web/src/components/jobs/job-creation-wizard.tsx
apps/web/src/components/jobs/job-questions-editor.tsx
apps/web/src/components/candidates/candidate-detail-view.tsx
apps/web/src/components/dashboard/admin-dashboard.tsx

# Server Actions
apps/web/src/app/actions/hireloop.ts       # Core mutations
apps/web/src/app/actions/auth.ts           # Auth helpers
apps/web/src/app/actions/enterprise.ts     # Team invites

# Database
supabase/migrations/*.sql                  # All schema + RLS
supabase/seed.sql                          # Test data

# Types & Lib
apps/web/src/lib/types.ts                  # All TS interfaces
apps/web/src/lib/supabase/queries.ts       # Data access
apps/web/src/lib/eligibility.ts            # Rules engine
apps/web/src/lib/interview-questions.ts    # Validation
```

---

## 9. Definition of Done for PaaS Beta

- [ ] All P0 items complete + tested
- [ ] 3+ design partners onboarded on multi-org
- [ ] Webhook delivery >99.9% for 30 days
- [ ] Load test: 50 concurrent interviews, <2% error rate
- [ ] Security review passed (OWASP Top 10)
- [ ] GDPR/DSAR flow tested end-to-end
- [ ] Documentation: API docs, webhook guide, admin guide
- [ ] SLA: 99.5% uptime, <500ms p95 API latency

---

*This analysis is based on codebase state as of 2026-07-17. Re-evaluate after P0 completion.*