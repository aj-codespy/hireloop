# HireLoop — Product Scope Document

**Version:** 1.0  
**Status:** Draft for review  
**Last Updated:** 2026-07-17  

---

## 1. Product Vision

### 1.1 Mission Statement
> **Enable non-technical companies to run world-class AI-powered hiring at scale — without building internal interview infrastructure.**

HireLoop transforms the hiring funnel for companies that recruit high volumes of interns, graduates, and early-career candidates. It replaces manual screening, scheduling, and first-round interviews with an AI-driven voice interview platform that includes proctoring, automated scoring, and structured evaluation — all packaged as a multi-tenant PaaS that integrates into existing HR workflows.

### 1.2 The Problem
- **High-volume hiring is broken:** Companies hiring 50–500+ interns/graduates per cycle spend 60–80% of recruiter time on scheduling, conducting, and scoring first-round interviews.
- **Inconsistent evaluation:** Human interviewers vary wildly in questioning, scoring, and bias. No audit trail exists.
- **Candidate experience is poor:** Long wait times, scheduling ping-pong, no feedback, opaque process.
- **No infrastructure for AI interviews:** Building voice AI + proctoring + scoring + compliance in-house takes 12–18 months and dedicated ML/engineering teams.
- **Existing ATS/HRIS don't solve this:** They manage workflow but don't *conduct* interviews.

### 1.3 The Solution
HireLoop is an **AI Interview Infrastructure Platform (PaaS)** that:
1. **Admin Portal:** Lets companies define roles, interview structures, question banks, scoring rubrics, and pipeline stages — with department-level segregation for large orgs.
2. **Candidate Portal:** Voice-based, proctored AI interviews in English/Hindi with real-time TTS/STT, adaptive questioning, and instant scoring.
3. **Scoring & Insights:** Per-question scores (0–10), overall weighted score, strengths/concerns summary, red flags, pass/fail against configurable thresholds.
4. **Human-in-the-loop Handoff:** Seamless transition to human interview rounds (scheduling, scorecards, offers) with full audit trail.
5. **Integration Layer:** Webhooks, bulk exports, API access so data flows into existing ATS/HRIS/ERP — we don't replace the system of record.

---

## 2. Target Users & Personas

### 2.1 Primary Buyer: HR Leaders / Talent Acquisition Heads
- **Company size:** 50–5,000 employees (mid-market to enterprise)
- **Hiring volume:** 20–500+ hires/year (interns, grads, early-career)
- **Pain:** "We lose 40% of candidates to scheduling delays; our interview quality is inconsistent; we have no data on why we hire/reject."
- **Budget:** $2,000–$50,000/year depending on volume

### 2.2 Primary Users

| Persona | Role | Key Jobs-to-be-Done |
|---------|------|---------------------|
| **Org Admin / Owner** | Sets up company, invites team, configures branding, billing | "Onboard my team, define our hiring process once, get out of the way" |
| **Recruiter / Talent Acquisition** | Creates jobs, manages pipeline, sends interview links, reviews AI scores | "Screen 200 applicants in 2 hours, not 2 weeks" |
| **Hiring Manager** | Approves requisitions, reviews shortlisted candidates, conducts final interviews | "See only the best 5 candidates with AI scores + my team's scorecards" |
| **Interviewer (Human Round)** | Receives calendar invites, conducts structured interviews, submits scorecards | "Don't make me reinvent questions — give me a scorecard tied to the role" |
| **Coordinator** | Schedules human rounds, sends reminders, manages logistics | "Auto-schedule 50 final-round interviews without 50 email threads" |

### 2.3 Candidate (End User)
- **Profile:** Students, recent graduates, early-career professionals
- **Devices:** Mobile-first (phone), laptop optional
- **Languages:** English, Hindi (expandable)
- **Expectations:** "Start interview in 2 clicks, know where I stand, get feedback if rejected"

---

## 3. Value Proposition (PaaS Positioning)

| Dimension | Traditional Approach | HireLoop PaaS |
|-----------|---------------------|---------------|
| **Time to first interview** | 3–10 days (scheduling) | <5 minutes (instant link) |
| **Interview consistency** | Low (human variance) | 100% (fixed script + AI scoring) |
| **Proctoring / Integrity** | None / manual | AI webcam + browser integrity + audio analysis |
| **Scoring audit trail** | Subjective notes | Per-question scores + rationale + transcript |
| **Bias mitigation** | Training only | Structured rubric + blind AI scoring |
| **Integration** | Manual CSV export | Webhooks + API + scheduled exports |
| **Setup time** | Months (build/buy) | Hours (configure + publish) |
| **Cost per interview** | $50–200 (recruiter time) | $2–5 (compute + AI) |

### 3.1 PaaS Differentiators
- **Multi-tenant with data isolation:** Each org is a secure tenant; departments provide logical separation within org.
- **Configurable pipeline:** Not a fixed funnel — orgs define stages (apply → auto-screen → AI interview → recruiter review → human interview(s) → offer).
- **White-label candidate experience:** Org logo, colors, intro video, custom domain (future).
- **Role-based access:** Owner/Admin/Recruiter/Hiring Manager/Interviewer/Coordinator/Viewer — each sees only what they need.
- **Compliance-ready:** Audit logs, EEO data capture, data retention policies, export-for-audit.

---

## 4. Core Product Capabilities (MVP → v1.0)

### 4.1 AI Interview Engine (✅ Built — ~90% complete)
- **Voice-first:** Questions spoken via pre-rendered TTS (EN/HI), answers recorded via WebM/WebRTC
- **Structured Q&A:** Mandatory questions (always asked) + variable pool (sampled per candidate)
- **Proctoring:** Face detection, multi-face, gaze deviation, tab switching, fullscreen enforcement, AI snapshot analysis
- **Scoring:** LLM-based (Gemini) per-question + overall with strengths/concerns/red-flags, pass/fail threshold
- **Resumable sessions:** Reconnect within window (default 2h) if network drops
- **Transcripts:** Full STT transcript stored, searchable, exportable

### 4.2 Admin Portal (✅ Core built — needs PaaS extensions)
- **Organization setup:** Branding, intro video, team invitations with roles
- **Job creation wizard:** 5-step (Details → Form → Questions → Rules → Publish)
- **Application form builder:** Text, number, email, phone, dropdown, file upload fields
- **Eligibility rules:** Auto-reject on numeric thresholds (e.g., CGPA ≥ 7.0, grad year = 2025)
- **Question bank editor:** Sections (Technical/HR/Situational), mandatory/variable, time limits, score thresholds
- **Pipeline dashboard:** Kanban + funnel charts + source analytics
- **Candidate detail view:** Tabs for Application, Documents, Job config, Proctoring log, Transcript, AI Scores, Human Scorecard

### 4.3 Candidate Experience (✅ Built)
- **Public apply page:** Branded, form + resume upload, instant eligibility check
- **Interview flow:** Consent → Proctoring setup (camera permissions) → Mic check → Live structured interview → Completion
- **Language toggle:** English / Hindi
- **Status portal:** Candidate login to see application status, re-attempt expired links (if allowed)

### 4.4 Human Interview Rounds (🟡 Partial — Scheduling + Scorecards exist)
- **Requisitions:** Headcount approval flow before job goes live
- **Pipeline stages:** Configurable per job (apply, auto_screen, ai_interview, recruiter_review, human_interview, offer, hired, rejected)
- **Interview scheduling:** Multi-attendee, calendar holds, meeting links, status tracking
- **Scorecards:** Structured competencies, recommendation (Strong Yes → Strong No), overall score, notes
- **Offers:** Draft → approval → send → accept/decline/expire tracking

### 4.5 Reporting & Compliance (🟡 Partial)
- **Dashboard:** Applications over time, source donut, funnel conversion
- **Candidate reports:** Per-interview transcript, score breakdown, proctoring summary
- **Activity log:** Org-wide audit trail
- **Export:** CSV/JSON for applications, scores, transcripts (manual today)

---

## 5. PaaS Extension Requirements (The "Productize" Work)

### 5.1 Multi-Organization & Department Architecture
| Feature | Current State | Required for PaaS |
|---------|---------------|-------------------|
| **Organizations** | Single org assumed in UI; org_id in DB | ✅ Multi-org onboarding, org switching, billing boundary |
| **Departments** | `departments` table exists, linked to requisitions | ✅ Dept-level job grouping, dept-scoped admin views, dept-level reporting |
| **Team invitations** | Basic invite form exists | ✅ Role-based invite flows, bulk invite, SSO/SAML (future) |
| **Role-based access** | 8 roles defined in DB + RLS | ✅ Full UI enforcement per role, permission matrix docs |

### 5.2 Admin Onboarding & Configuration
- **Org setup wizard:** Name, logo, colors, intro video, domain verification (future)
- **Default pipeline templates:** "Graduate Program" (5 stages), "Internship" (4 stages), "Custom"
- **Question bank library:** Shared across jobs, versioned, org-wide + dept-scoped
- **Email templates:** Branded interview invite, reminder, expiry, result notifications
- **Integration settings:** Webhook endpoints, API keys, export schedules

### 5.3 Candidate Communication & Messaging
- **Direct messaging:** Admin → Candidate (email + in-app notification) from any dashboard view
- **Bulk actions:** "Send to final interview" → auto-email + status transition + calendar invites
- **Template library:** Reusable message templates with merge tags ({{candidate_name}}, {{job_title}}, {{interview_link}})
- **Communication log:** Full history per candidate (AI + human messages)

### 5.4 Advanced Scheduling (Human Rounds)
- **Interviewer availability:** Connect Google/Outlook calendar, define interview slots
- **Auto-scheduling:** Candidate picks slot → confirms → calendar events created for all attendees
- **Reminders:** 24h, 2h, 15min before (email + calendar)
- **Rescheduling:** Candidate or interviewer initiated, auto-notify all parties
- **Panel interviews:** Multiple interviewers, single slot, consolidated scorecard

### 5.5 Data Export & Integration Layer
- **Webhooks:** `application.created`, `interview.completed`, `score.available`, `stage.changed`, `offer.sent`, `candidate.hired`
- **Scheduled exports:** Daily/weekly CSV to S3/SFTP/Google Sheets
- **API access:** REST + GraphQL for ATS sync (Greenhouse, Lever, Workday, BambooHR, custom)
- **Field mapping:** Configurable mapping from HireLoop schema → target system schema

---

## 6. Pricing & Packaging (PaaS Model)

| Tier | Target | Monthly | Included | Overage |
|------|--------|---------|----------|---------|
| **Starter** | SMB (20–50 hires/yr) | $299 | 50 AI interviews, 5 team seats, 3 jobs, email support | $5/interview |
| **Growth** | Mid-market (50–200 hires/yr) | $999 | 250 AI interviews, 15 seats, 15 jobs, departments, webhooks, API, priority support | $4/interview |
| **Scale** | Enterprise (200+ hires/yr) | $2,999 | 1,000 AI interviews, 50 seats, unlimited jobs, SSO, custom SLA, dedicated CSM, custom exports | $3/interview |
| **Custom** | High-volume / Partner | Custom | Volume discounts, white-label, on-prem option, data residency | — |

**Note:** "AI interview" = one completed candidate session (regardless of question count). Human rounds, scorecards, scheduling included in all tiers.

---

## 7. Success Metrics (North Star + Guardrails)

| Metric | Target (12 mo) | Measurement |
|--------|----------------|-------------|
| **Active Organizations** | 100 | Orgs with ≥1 live job |
| **Interviews Completed / Month** | 10,000 | Unique candidate sessions with status=completed |
| **Time-to-First-Interview (median)** | <15 min | Application created → interview link sent |
| **AI Score ↔ Human Score Correlation** | r ≥ 0.7 | Pearson on overlapped candidate set |
| **Candidate Completion Rate** | >85% | Started → Completed (not abandoned/flagged) |
| **Net Revenue Retention** | >110% | Expansion > Churn |
| **API/Webhook Adoption** | >60% of Scale tier | Orgs with ≥1 active integration |

---

## 8. Competitive Landscape & Differentiation

| Competitor | Type | Gap HireLoop Fills |
|------------|------|-------------------|
| **HireVue / Modern Hire** | Enterprise video interview | $$$ (5-figure contracts), rigid, no PaaS self-serve, weak proctoring |
| **Spark Hire / VidCruiter** | Async video interview | One-way video only, no live AI conversation, no scoring |
| **Codility / HackerRank** | Technical assessment | Code-only, no voice/HR/situational, no proctoring for non-code |
| **Vervoe / TestGorilla** | Skills testing | MCQ/simulations, not conversational AI interview |
| **ATS (Greenhouse, Lever, Workday)** | Workflow management | Don't conduct interviews — they integrate *with* us |
| **Custom build** | Internal engineering | 12–18 mo, $500k+, ongoing ML maintenance |

**HireLoop's Moat:**
1. **Voice-first AI interview + proctoring** in one integrated loop (not stitched services)
2. **PaaS self-serve** — HR teams configure without engineering
3. **Structured scoring with rationale** — explainable AI, not black box
4. **Bilingual (EN/HI) voice** — critical for India/emerging markets
5. **Human-round orchestration built-in** — not just "AI then done"

---

## 9. Roadmap Phases

### Phase 0: Foundation Hardening (Current — Weeks 1–4)
- [ ] Deploy pending Supabase migrations (proctoring RPCs, RLS fixes)
- [ ] Backend concurrency fixes (HTTP pool, atomic proctoring)
- [ ] Frontend build/lint clean, error boundary coverage
- [ ] Load test interview relay (50 concurrent sessions)

### Phase 1: PaaS Core (Weeks 5–10)
- [ ] Multi-org onboarding flow + org switcher
- [ ] Department-scoped UI (job grouping, reporting, permissions)
- [ ] Role-based access matrix enforced in UI (not just RLS)
- [ ] Admin setup wizard (branding, templates, email config)
- [ ] Webhook system + API keys management
- [ ] Bulk candidate actions + messaging (email templates, merge tags)

### Phase 2: Human Round Orchestration (Weeks 11–16)
- [ ] Interviewer calendar sync (Google/Outlook)
- [ ] Candidate self-scheduling with slot management
- [ ] Panel interview support + consolidated scorecard
- [ ] Automated reminders + rescheduling flow
- [ ] Offer letter template + e-signature (DocuSign/HelloSign or native)

### Phase 3: Integration & Scale (Weeks 17–24)
- [ ] Pre-built ATS connectors (Greenhouse, Lever, Workday, BambooHR)
- [ ] GraphQL API + schema registry
- [ ] Scheduled exports (S3, SFTP, Google Sheets, email)
- [ ] Custom field mapping UI
- [ ] SSO/SAML (Okta, Entra ID, Google Workspace)
- [ ] Audit log export for compliance (SOC2/GDPR prep)

### Phase 4: Intelligence & Differentiation (Months 7–12)
- [ ] Candidate benchmarking across org (anonymized)
- [ ] Question performance analytics (which questions predict success)
- [ ] Bias audit reports (demographic parity on scores)
- [ ] AI-suggested follow-up questions for human rounds
- [ ] White-label candidate domain + custom branding

---

## 10. Open Decisions — **RESOLVED 2026-07-18**

| # | Decision | Options | **Decision** | Status |
|---|----------|---------|--------------|--------|
| **D1** | **Where does system responsibility end?** | A) After AI interview + score<br>B) After human interview scheduling<br>C) After offer acceptance<br>D) Full lifecycle including onboarding | **B** — We own AI screening + handoff to human rounds. Offer/onboarding = customer's ATS/HRIS. Export/webhook is the boundary. | ✅ Resolved |
| **D2** | **Department model: strict or flexible?** | A) Hard partition (candidates/depts don't mix)<br>B) Tags (candidate can belong to multiple depts)<br>C) Hierarchical (dept → sub-dept → team) | **B** — Tags with default dept. Allows matrix orgs. UI shows "Primary Department" + tags. | ✅ Resolved |
| **D3** | **Proctoring strictness default?** | A) Strict (flag on any violation)<br>B) Balanced (3 warnings → flag)<br>C) Lenient (log only, human reviews) | **Modified B** — **Never end interviews for proctoring**. Flag with cheating score percentage probability on dashboard. Show score + answers but clearly distinguish flagged candidates (visual badge, separate filter). Configurable thresholds per job. | ✅ Resolved |
| **D4** | **Candidate re-attempt policy?** | A) One link, one attempt, no retry<br>B) Configurable retakes (admin sets max)<br>C) Auto-retry on technical failure only | **B** — Admin config: max attempts, cooldown period. Expired links = new token via admin action. | ✅ Resolved |
| **D5** | **Scoring model: proprietary vs. bring-your-own?** | A) Only our Gemini scoring<br>B) Pluggable scoring (customer can bring fine-tuned model)<br>C) Rule-based + AI hybrid | **Hybrid** — **Default: Gemini scoring. Per-job admin can add custom parameters/rules** (weighting, keywords, rubric overrides) that augment the LLM prompt. For Scale tier: webhook for fully custom scoring engine. | ✅ Resolved |
| **D6** | **Data residency / sovereignty?** | A) Single region (US/EU/IN)<br>B) Per-org region selection<br>C) On-prem / VPC deploy | **Supabase single region or VPC** — Not yet decided between single-region managed vs VPC deploy. Will decide before Scale tier launch. | ✅ Resolved (TBD: Single vs VPC) |

---

## 11. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **AI scoring hallucination / bias** | Medium | High | Structured prompt + validation + human review flag + audit log; bias dashboard in Phase 4 |
| **Proctoring false positives (candidate flagged unfairly)** | Medium | High | Configurable thresholds; "flagged" ≠ "rejected" — human review mandatory; candidate appeal flow |
| **WebRTC/audio issues on candidate mobile devices** | High | Medium | Graceful degradation (audio-only mode); chunked upload with resume; extensive device testing |
| **Supabase rate limits / costs at scale** | Medium | Medium | Connection pooling; RPC batching; migrate high-volume tables to dedicated Postgres if needed |
| **Competitor copies voice+proctoring loop** | Medium | Medium | Speed to PaaS features (self-serve, integrations, compliance); proprietary scoring prompts; bilingual TTS |
| **Regulatory (AI Act, EEOC, GDPR)** | Low-Med | High | Proactive compliance: explainable scores, data retention config, DPA, audit export, no automated final rejection without human sign-off option |

---

## 12. Appendix: Glossary

| Term | Definition |
|------|------------|
| **AI Interview** | Structured voice conversation conducted by HireLoop's AI (TTS questions → STT answers → LLM scoring) |
| **Proctoring** | Continuous webcam + browser integrity monitoring during interview |
| **Mandatory Question** | Asked in every interview for a given job |
| **Variable Question** | Sampled from pool per interview (configurable count) |
| **Requisition** | Internal headcount approval before job goes live |
| **Pipeline Stage** | Configurable step in hiring funnel (e.g., `ai_interview`, `recruiter_review`, `human_interview`) |
| **Scorecard** | Structured human evaluation (competencies + recommendation + score + notes) |
| **Tenant** | Organization — hard data isolation boundary |
| **Department** | Logical grouping within org for reporting/permissions |
| **Webhook** | HTTP POST to customer endpoint on defined events |

---

*Document owned by: Product & Engineering*  
*Next review: Weekly during Phase 1, then bi-weekly*