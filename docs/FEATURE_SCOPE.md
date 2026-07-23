# HireLoop Feature Scope & User Flows

**Version:** 1.0  
**Status:** Living document — updated per sprint  
**Scope:** Complete feature inventory (✅ Built | 🟡 Partial | ⬜ Planned)

---

## 1. Feature Inventory by Domain

### 1.1 Organization & Tenant Management

| Feature | Status | Description | Key Files |
|---------|--------|-------------|-----------|
| Organization Profile | ✅ | Name, logo, primary color, intro video, website, about | `organizations` table, `updateOrganizationAction`, `company/page.tsx` |
| Multi-Organization Support | 🟡 | DB schema ready; UI assumes single org; needs org switcher | `fetchHireLoopState(scopeOrgId?)`, `admin-routes.ts` |
| Department Management | 🟡 | `departments` table + RLS; linked to requisitions/jobs; no dedicated UI | `20260706200000_enterprise_workflow_foundations.sql` |
| Team Invitations | ✅ | Invite form with role selector; email sent via Resend | `invite-team-member-form.tsx`, `enterprise.ts` actions |
| Role-Based Access (RBAC) | 🟡 | 8 roles in DB + RLS; UI enforcement incomplete | `types.ts` `OrgMemberRole`, `permissions.ts`, `require-role.ts` |
| Org Switcher (Multi-org User) | ⬜ | User belongs to multiple orgs; switch in header | — |
| Billing & Subscription | ⬜ | Stripe integration; usage metering (interviews/month) | — |
| Custom Domain / White-label | ⬜ | Candidate portal on `careers.company.com` | — |

### 1.2 Job & Requisition Management

| Feature | Status | Description | Key Files |
|---------|--------|-------------|-----------|
| Requisition Approval Flow | 🟡 | Draft → Pending → Approved/Rejected; headcount, budget, hiring manager | `requisitions` table, `requisitions/page.tsx` (stub) |
| Job Creation Wizard | ✅ | 5-step: Details → Form → Questions → Rules → Publish | `job-creation-wizard.tsx` |
| Job Details Editor | ✅ | Edit title, description, status, form fields, eligibility, passing score | `job-details-editor.tsx`, `job-form-fields-editor.tsx` |
| Application Form Builder | ✅ | Drag-drop fields: text, number, email, phone, dropdown, file, doc | `form-fields-builder.tsx`, `form-fields.ts` |
| Eligibility Rules Engine | ✅ | Numeric thresholds (>=, <=, =) on form fields; auto-reject on apply | `eligibility.ts`, `queries.ts:evaluateEligibility` |
| Question Bank Editor | ✅ | Sections (Tech/HR/Situational), mandatory/variable, time limits, score thresholds | `job-questions-editor.tsx` |
| Interview Question Count Config | ✅ | Set total questions per interview (mandatory + sampled variable) | `interview-questions.ts` validation |
| Question Audio Pre-render | ✅ | TTS (EN/HI) generated on save; stored in Supabase Storage | `setJobQuestionsAction` → `/admin/questions/render-audio` |
| Job Sharing / Apply Link | ✅ | Public link `/apply/{jobId}`; branded with org colors/logo | `share-job-link.tsx`, `apply/[jobId]/page.tsx` |
| Job Status (Draft/Live/Closed) | ✅ | Controls public visibility | `job_roles.status` CHECK constraint |
| Job Duplication / Templates | ⬜ | Clone existing job; save as template | — |
| Department-Scoped Job Views | ⬜ | Filter jobs by department in admin UI | — |

### 1.3 Candidate Application & Portal

| Feature | Status | Description | Key Files |
|---------|--------|-------------|-----------|
| Public Apply Page | ✅ | Branded form, file upload, eligibility check, instant feedback | `apply/[jobId]/page.tsx`, `apply-page-client.tsx` |
| Resume / Document Upload | ✅ | Supabase Storage (private bucket); signed URLs for admin | `storage.ts`, `application-document-link.tsx` |
| Candidate Profile Portal | ✅ | `/candidate/profile` — view applications, status, re-attempt expired | `candidate/profile/page.tsx` |
| Candidate Auth | ✅ | Email/password + Google OAuth; magic link; account_type=candidate | `auth/*.tsx`, `auth_profiles.sql` |
| Application Status Tracking | ✅ | Real-time status badge; interview link when sent | `candidate/profile/page.tsx` |
| Duplicate Application Prevention | ✅ | One application per candidate per job | `submitApplicationInDb` check |

### 1.4 AI Interview Engine (Core Product)

| Feature | Status | Description | Key Files |
|---------|--------|-------------|-----------|
| Voice-First Interview | ✅ | Questions spoken via pre-rendered TTS; answers recorded via WebRTC | `candidate-interview-flow.tsx`, `interview-structured.tsx` |
| Structured Q&A Flow | ✅ | Mandatory questions always asked; variable pool sampled per session | `session.py`, `structured_relay.py` |
| Bilingual Support (EN/HI) | ✅ | Candidate selects language; TTS/STT/scoring in selected language | `TTS_VOICE_EN/HI`, `STT_MODEL`, language toggle in UI |
| Real-Time Proctoring | ✅ | Face detection (MediaPipe), multi-face, gaze, tab-switch, fullscreen | `proctoring-panel.tsx`, `use-proctoring.ts`, `proctoring.py` |
| AI Snapshot Analysis | ✅ | Periodic webcam snapshots → Gemini Vision → severity classification | `structured_relay.py:_handle_proctoring_snapshot` |
| Auto-Flag on Violations | ✅ | Configurable thresholds (default: 3 critical OR 15 warnings = flag) | `structured_relay.py:_flag_proctoring_session` |
| Session Resumability | ✅ | Reconnect within 2h (configurable); state persisted in DB | `session.py`, `supabase_store.py:find_resumable_session` |
| Chunked Audio Upload | ✅ | Answers uploaded in chunks over HTTP (reliable); assembled server-side | `answer_upload.py`, `/interview/answers/chunk` endpoint |
| Speech-to-Text (STT) | ✅ | Gemini Flash STT (async, background); placeholder entry during interview | `stt.py`, `_transcribe_in_background` |
| Interview Timer (Question + Overall) | ✅ | Per-question + total limits; server-authoritative; grace period on timeout | `session.py`, `_timer_loop` |
| Full Transcript Storage | ✅ | Speaker-labeled, timestamped, per-question entries in `interview_sessions.transcript` | `session.py:TranscriptEntry`, `supabase_store.py` |

### 1.5 AI Scoring & Evaluation

| Feature | Status | Description | Key Files |
|---------|--------|-------------|-----------|
| Per-Question Scoring (0-10) | ✅ | LLM (Gemini Flash) evaluates each answer against ideal notes | `scoring.py:_build_prompt`, `score_interview` |
| Overall Weighted Score | ✅ | Aggregated totalScore (0-10) with pass/fail vs threshold | `scoring.py` returns `overallScore.totalScore` |
| Strengths & Concerns Summary | ✅ | 2-3 sentence narrative each; generated by LLM | `scoring.py` prompt → `overallScore.strengths/concerns` |
| Red Flags Detection | ✅ | Array of flag strings per question (e.g., "inconsistent experience") | `scoring.py` → `QuestionScore.redFlags` |
| Passing Score Gate | ✅ | Job-level `passing_score`; auto-transition to `passed_ai`/`rejected_ai` | `job_roles.passing_score`, `queries.ts` |
| Score Persistence | ✅ | Stored in `interview_sessions.question_scores` + `overall_score` JSONB | `supabase_store.py:save_scores` |
| Score Breakdown UI | ✅ | Admin candidate view: per-question score, rationale, transcript snippet | `score-breakdown.tsx`, `candidate-detail-view.tsx` |
| Scoring Failure Handling | ✅ | `ScoringError` raised (never silent 0); interview flagged for manual review | `scoring.py:ScoringError` |
| Human Scorecard (Separate) | ✅ | Structured scorecard for human rounds: competencies, recommendation, score | `scorecards` table, `submitScorecardAction`, `candidate-detail-view.tsx` |

### 1.6 Pipeline & Candidate Management

| Feature | Status | Description | Key Files |
|---------|--------|-------------|-----------|
| Configurable Pipeline Stages | 🟡 | `pipeline_stages` table per job; types: apply, auto_screen, ai_interview, recruiter_review, human_interview, offer, hired, rejected | `20260706200000_enterprise_workflow_foundations.sql` |
| Kanban Board | ✅ | Drag-drop columns per status; stale indicators (>3 days) | `pipeline-kanban.tsx` |
| Candidates Table | ✅ | Sortable, filterable, paginated; inline score badges | `candidates-table.tsx`, `candidates/page.tsx` |
| Candidate Detail View | ✅ | Tabbed: Application, Documents, Job, Proctoring, Transcript, Scores, Scorecard | `candidate-detail-view.tsx`, `candidates/[id]/page.tsx` |
| Application Stage History | 🟡 | `application_stage_history` table; audit trail of transitions | `transitionApplicationStageAction` |
| Bulk Actions | ⬜ | Select multiple → change stage, send message, export | — |
| Candidate Search (Global) | 🟡 | `people-search/page.tsx` stub; cross-job search by name/email/status | — |
| Candidate Tags / Notes | ⬜ | Private recruiter notes; tags for filtering | — |
| Candidate Communication Log | ⬜ | Unified timeline of all messages (AI + human) per candidate | — |

### 1.7 Human Interview Orchestration

| Feature | Status | Description | Key Files |
|---------|--------|-------------|-----------|
| Interview Scheduling | 🟡 | `interview_schedules` table; multi-attendee, location/meeting_url, status | `scheduling/page.tsx` (stub) |
| Interviewer Calendar Sync | ⬜ | Google/Outlook OAuth; availability slots; conflict detection | — |
| Candidate Self-Scheduling | ⬜ | Candidate picks slot → confirms → calendar invites sent | — |
| Automated Reminders | ⬜ | 24h, 2h, 15min before via email + calendar | — |
| Rescheduling Flow | ⬜ | Initiated by either party; auto-notify all | — |
| Panel Interviews | ⬜ | Multiple interviewers, single slot, consolidated scorecard | — |
| Scorecard Submission | ✅ | Structured: competencies (JSON), recommendation (5-point), score (0-10), notes | `scorecards` table, `submitScorecardAction` |
| Scorecard Review Dashboard | ⬜ | Hiring manager sees all scorecards for a candidate side-by-side | — |

### 1.8 Offers & Hiring

| Feature | Status | Description | Key Files |
|---------|--------|-------------|-----------|
| Offer Management | 🟡 | `offers` table: draft → pending_approval → approved → sent → accepted/declined/withdrawn | `offers/page.tsx` (stub) |
| Offer Approval Workflow | 🟡 | Owner/Admin approve before send | `offers` RLS policies |
| Offer Letter Template | ⬜ | Configurable template with merge fields; PDF generation | — |
| E-Signature Integration | ⬜ | DocuSign / HelloSign / native canvas signature | — |
| Offer Expiry Tracking | 🟡 | `expires_at` timestamp; status auto-expire | `offers` table |
| Hired/Rejected Finalization | ✅ | `markCandidateHiredAction`, `rejectCandidateFinalAction` + email notify | `hireloop.ts` actions |

### 1.9 Communication & Messaging

| Feature | Status | Description | Key Files |
|---------|--------|-------------|-----------|
| Interview Link Email | ✅ | Branded email with link, expiry, instructions | `send-interview-link.ts` |
| Interview Expiry Email | ✅ | Auto-sent when token expires | `send-interview-expired.ts` |
| Application Status Email | ✅ | Template per status (shortlisted, rejected, hired, etc.) | `send-application-status.ts` |
| Admin → Candidate Direct Message | ⬜ | From any candidate view; email + in-app notification; template library | — |
| Bulk Messaging | ⬜ | Select candidates → send template | — |
| Communication Timeline | ⬜ | Per-candidate thread view | — |
| Webhook Notifications | ⬜ | `candidate.message.sent`, `application.stage_changed` | — |

### 1.10 Reporting & Analytics

| Feature | Status | Description | Key Files |
|---------|--------|-------------|-----------|
| Dashboard Overview | ✅ | Metrics cards (applications, active jobs, interviewed, awaiting decision) | `admin-dashboard.tsx`, `use-dashboard-insights.ts` |
| Applications Over Time | ✅ | Line chart (monthly apps + completed interviews) | `pipeline-line-chart.tsx` |
| Source Breakdown | ✅ | Donut chart (website, referral, job board, etc.) | `sources-donut-chart.tsx` |
| Pipeline Funnel | ✅ | Funnel conversion % per stage | `pipeline-funnel-chart.tsx` |
| Candidate Export (CSV) | 🟡 | Manual trigger; applications + scores + status | `reports/page.tsx` (stub) |
| EEO / Compliance Report | 🟡 | `compliance/page.tsx` stub; demographic data capture needed | — |
| Time-to-Hire Metrics | ⬜ | Stage duration averages, bottlenecks | — |
| Interviewer Calibration | ⬜ | Score variance across interviewers | — |
| Question Performance Analytics | ⬜ | Which questions correlate with hire success | — |
| Scheduled Exports (S3/SFTP/Sheets) | ⬜ | Daily/weekly automated drops | — |

### 1.11 Compliance & Audit

| Feature | Status | Description | Key Files |
|---------|--------|-------------|-----------|
| Activity Log | 🟡 | `activity_log` table: org-wide immutable event stream | `20260706200000_enterprise_workflow_foundations.sql` |
| Proctoring Audit Trail | ✅ | Per-session event log + AI analysis + snapshots | `proctoring-log-view.tsx`, `proctoring-snapshot-gallery.tsx` |
| Data Retention Policies | ⬜ | Configurable per org; auto-delete/anonymize | — |
| GDPR/DSAR Export | ⬜ | Candidate data package (application, interview, scores, logs) | — |
| SOC2 / ISO Prep | ⬜ | Audit log export, access controls review | — |

### 1.12 Integration & Extensibility

| Feature | Status | Description | Key Files |
|---------|--------|-------------|-----------|
| Webhook System | ⬜ | Register endpoints; retry with backoff; signature verification | — |
| REST API | ⬜ | `/api/v1/jobs`, `/applications`, `/candidates`, `/scores` | — |
| GraphQL API | ⬜ | Flexible queries for dashboard embedding | — |
| ATS Connectors (Pre-built) | ⬜ | Greenhouse, Lever, Workday, BambooHR, Ashby | — |
| Custom Field Mapping | ⬜ | UI to map HireLoop fields → target system fields | — |
| SSO (SAML/OIDC) | ⬜ | Okta, Entra ID, Google Workspace, Auth0 | — |
| SCIM Provisioning | ⬜ | Auto-provision/deprovision team members | — |

---

## 2. Key User Flows

### 2.1 Admin: Organization Onboarding (First-Time Setup)
```
1. Admin signs up (email/password or Google OAuth)
2. Account type = "org_admin" → profile created
3. Onboarding wizard:
   a. Organization details (name, logo, color, intro video)
   b. Invite team members (email + role)
   c. Create first department(s)
   d. Select pipeline template (Graduate / Internship / Custom)
   e. Configure email templates (interview invite, reminder, result)
   f. Set up integration (webhook URL, API key) — optional
4. Landing on Dashboard → "Create your first job" CTA
```

### 2.2 Admin: Job Creation & Publishing
```
1. Navigate to /admin/jobs/new
2. Step 1 - Job Details: Title, description
3. Step 2 - Application Form: Add/remove fields, set required, add document fields
4. Step 3 - Interview Questions:
   - Add questions per section (Technical/HR/Situational)
   - Mark mandatory vs variable
   - Set time limits, score thresholds
   - Configure total questions per interview
5. Step 4 - Rules & Thresholds:
   - Eligibility rules (e.g., CGPA >= 7.0)
   - Passing score gate (optional)
   - Publish immediately vs save as draft
6. Step 5 - Publish: Review summary, copy apply link, share
7. Background: Question audio pre-rendered (EN + HI) via API call
```

### 2.3 Candidate: Application & Interview
```
1. Candidate clicks apply link → /apply/{jobId}
2. Fills branded form, uploads resume/documents
3. Submits → Eligibility engine evaluates rules
   - PASS: Status = "interview_sent", token generated, email sent
   - FAIL: Status = "auto_rejected", thank you page
4. Candidate receives email with interview link: /candidate/{token}
5. Interview Flow:
   a. Intro: Org video, role, language selector (EN/HI)
   b. Consent: Recording + proctoring agreement
   c. Proctoring Setup: Camera permission, face calibration
   d. Mic Check: Record test, playback verification
   e. Live Interview:
      - Question spoken (TTS audio plays)
      - Candidate taps Record → Speaks → Stop → Next
      - Timer counts down (server-authoritative)
      - Proctoring runs continuously (webcam + browser)
   f. Completion: Thank you page, next steps, profile link
6. Background: Answers transcribed (STT), interview scored (LLM)
7. Candidate can check status at /candidate/profile
```

### 2.4 Admin: Candidate Review & Pipeline Management
```
1. Dashboard → "View Pipeline" or /admin/candidates
2. Kanban view: Drag candidate cards across stages
   - Applied → Shortlisted → Interview Sent → Interviewed → Passed AI → Final Interview → Hired
3. Click candidate → Detail view with tabs:
   - Application: Form responses, documents
   - Documents: Resume, certificates (download)
   - Job & Interview: Questions config, interview link management
   - Proctoring: Event log, snapshot gallery, flag summary
   - Transcript: Full Q&A with timestamps
   - AI Scores: Per-question + overall, strengths/concerns, red flags
   - Scorecard: Submit human evaluation (if at human stage)
4. Actions (per stage):
   - Send/Regenerate interview link
   - Move to final interview (triggers scheduling)
   - Submit scorecard
   - Mark hired / Reject final
   - Send direct message (email)
```

### 2.5 Human Interview Round (Post-AI)
```
1. Admin moves candidate to "Final Interview" stage
2. System creates requisition-linked scheduling workflow:
   a. Hiring manager adds interviewers (from team)
   b. Interviewers connect calendars (Google/Outlook) — future
   c. Define interview slots (date ranges, duration, panel vs 1:1)
3. Candidate receives scheduling link → picks slot
4. Calendar events created for all attendees with meeting link
5. Reminders sent automatically (24h, 2h, 15min)
6. Interview conducted (Zoom/Meet/Teams/In-person)
7. Interviewers submit scorecards (structured)
8. Hiring manager reviews consolidated scorecards
9. Decision → Mark Hired / Reject Final → Offer flow
```

### 2.6 Offer Management
```
1. Admin initiates offer from candidate detail (status = partner_review)
2. Draft offer: compensation JSON, start date, expiry
3. Send for approval (Owner/Admin)
4. Approved → Send to candidate (email with link)
5. Candidate accepts/declines → status updated
6. If accepted → status = hired, onboarding triggered (webhook)
```

---

## 3. Feature Prioritization Matrix (PaaS Launch)

| Priority | Feature | Effort | Rationale |
|----------|---------|--------|-----------|
| **P0** | Multi-org onboarding + org switcher | M | Core PaaS requirement |
| **P0** | Department-scoped UI (jobs, candidates, reports) | M | Enterprise deal requirement |
| **P0** | RBAC enforcement in UI (not just RLS) | M | Security/compliance |
| **P0** | Webhook system (core events) | M | Integration requirement |
| **P0** | Admin → Candidate messaging (email + in-app) | S | Daily workflow |
| **P0** | Bulk candidate actions | S | High-volume hiring |
| **P0** | Scheduled CSV exports (S3/email) | M | ERP/ATS integration |
| **P1** | Interviewer calendar sync + self-scheduling | L | Human round automation |
| **P1** | Offer letter templates + e-sign | M | Close loop |
| **P1** | Pre-built ATS connectors (Greenhouse, Lever) | L | Enterprise sales |
| **P1** | Question bank library (org-wide, versioned) | M | Reusability |
| **P2** | SSO/SAML | L | Enterprise security |
| **P2** | Custom domain / white-label | M | Branding |
| **P2** | Advanced analytics (time-to-hire, interviewer calibration) | M | Differentiation |
| **P3** | GDPR/DSAR automation | M | Compliance |
| **P3** | AI-suggested follow-up questions | L | Innovation |
| **P3** | Candidate benchmarking (anonymized) | L | Network effect |

---

## 4. Configuration vs. Customization Boundary

| Aspect | Configurable (Admin UI) | Requires Code / Custom Build |
|--------|-------------------------|------------------------------|
| Pipeline Stages | ✅ Name, order, type, required, config JSON | ❌ New stage types |
| Application Form Fields | ✅ Label, type, required, options, order | ❌ Custom field types (e.g., video upload) |
| Eligibility Rules | ✅ Field, operator, value | ❌ Complex logic (AND/OR groups) |
| Question Bank | ✅ Sections, mandatory, time limit, score threshold | ❌ Custom scoring rubrics |
| Interview Question Count | ✅ Total per interview | ❌ Adaptive branching logic |
| Proctoring Thresholds | ✅ Warning/critical counts, auto-flag rules | ❌ Custom vision models |
| Passing Score | ✅ Numeric threshold | ❌ Multi-dimensional pass criteria |
| Email Templates | ✅ Subject, body (HTML), merge tags | ❌ Custom email providers |
| Scorecard Competencies | ✅ Name, weight, description | ❌ Custom rating scales |
| Offer Fields | ✅ Compensation JSON, dates | ❌ Custom approval chains |
| Webhook Events | ✅ Subscribe to event types | ❌ Custom payload transforms |
| Role Permissions | ❌ Fixed 8 roles | ✅ Code change for new roles |

---

*This document should be updated every sprint. Features marked ✅ have working code; 🟡 have partial implementation (DB + API but incomplete UI); ⬜ are planned.*