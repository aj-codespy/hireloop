# Interview Lifecycle Boundary Decision

**Document Type:** Architectural Decision Record (ADR)  
**Status:** Proposed — Requires Product + Engineering Sign-off  
**Date:** 2026-07-17  
**Deciders:** Product Lead, Engineering Lead, GTM Lead  
**Related:** PRODUCT_SCOPE.md, FEATURE_SCOPE.md, PAAS_MULTITENANT_DESIGN.md

---

## 1. Problem Statement

HireLoop currently handles the **AI screening interview** end-to-end:
- Candidate applies → Eligibility check → AI voice interview (proctored) → Transcription → LLM scoring → Pass/Fail

**The gap:** After the AI interview, candidates who pass enter **human interview rounds** (technical panel, hiring manager, cultural fit). The system currently:
- ✅ Tracks pipeline stages (`pipeline_stages` table with `human_interview` type)
- ✅ Schedules interviews (`interview_schedules` table with attendees, calendar links)
- ✅ Collects scorecards (`scorecards` table with competencies, recommendations)
- ❌ **Does not conduct** the human interview (no video call, no live collaboration)
- ❌ **Does not manage** offer negotiation, background checks, onboarding
- ❌ **No clear boundary** communicated to customers: "We do X, you do Y"

**Risk:** Customers expect "end-to-end hiring platform" but hit a wall after AI screening. They must cobble together Zoom + Greenhouse + DocuSign + HRIS. We lose expansion revenue and get churn.

---

## 2. Decision Options

| Option | Scope | System Responsibility Ends At | Customer Responsibility | Revenue Impact |
|--------|-------|-------------------------------|------------------------|----------------|
| **A: AI Screening Only** | Minimal | AI interview complete + score delivered | Everything else: scheduling, human interviews, offers, onboarding, ATS sync | Low — Point solution, competes with Vervoe, TestGorilla |
| **B: AI Screening + Human Round Orchestration** ⭐ **Recommended** | Core PaaS | Offer letter sent + candidate response recorded | Background checks, onboarding, HRIS/payroll, equity, benefits | High — Owns the "interview-to-offer" loop; integrates with ATS/HRIS |
| **C: Full Lifecycle (ATS Replacement)** | Maximum | Employee onboarded (Day 1 ready) | Nothing — we replace Greenhouse/Lever/Workday | Highest — But massive scope, 2+ years to parity, direct competition with well-funded incumbents |

---

## 3. Confirmed Decision: Option B with Clarified Boundary

### 3.1 Boundary Definition

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        HIRELOOP SYSTEM BOUNDARY                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌────────────┐  │
│   │   APPLY     │───▶│  AI SCREEN  │───▶│ HUMAN ROUND │───▶│  QUALIFIED │  │
│   │  (Forms,    │    │ (Voice AI,  │    │ (Schedule,  │    │  CANDIDATE │  │
│   │  Eligibility)   Proctoring,  │    │  Scorecards, │    │  LIST      │  │
│   │             │    │  Scoring)   │    │  Video Link) │    │            │  │
│   └─────────────┘    └─────────────┘    └─────────────┘    └─────┬──────┘  │
│                                                                    │         │
│                              SYSTEM OWNS THIS ────────────────────┘         │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    INTEGRATION LAYER (Webhooks/API)                  │   │
│   │  application.created  •  interview.completed  •  score.available    │   │
│   │  stage.changed  •  candidate.qualified  •  candidate.hired          │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    CUSTOMER'S ECOSYSTEM (Not Owned)                 │   │
│   │  ATS (Greenhouse/Lever)  •  HRIS (BambooHR/Workday)  •  Calendar  │   │
│   │  Video (Zoom/Meet/Teams)  •  DocuSign  •  Background Check  • Payroll │   │
│   │  Offer Management  •  Employee Onboarding  •  Employee Database    │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 What We Own (In-Boundary)

| Phase | Capability | Status | Notes |
|-------|------------|--------|-------|
| **Apply** | Branded application form, file upload, eligibility rules | ✅ Built | |
| **AI Screen** | Voice interview, proctoring, transcription, LLM scoring | ✅ Built | Core differentiator |
| **Proctoring** | **Never ends interview** — flags with cheating score % probability, shows on dashboard with clear visual distinction | 🟡 Partial | Flag display + cheating probability scoring needed |
| **Pipeline** | Configurable stages, Kanban, drag-drop, stage history | ✅ Built | `pipeline_stages` table |
| **Human Scheduling** | Multi-attendee scheduling, slot management, calendar links, reminders | 🟡 Partial | `interview_schedules` table exists; no calendar sync yet |
| **Scorecards** | Structured competencies, recommendations, overall score, notes | ✅ Built | `scorecards` table |
| **Qualified Candidate List** | Filtered view of candidates who passed AI + human rounds, ready for offer | ✅ Built | Pipeline stage `partner_review`/`hired` |
| **Audit/Compliance** | Activity log, proctoring evidence, score rationale | ✅ Built | `activity_log`, proctoring snapshots |
| **Integration Out** | Webhooks for all above events, REST API, scheduled exports | ⬜ Planned | Critical for Option B |

### 3.3 What We Explicitly Don't Own (Out-of-Boundary)

| Domain | Customer Tool | Our Integration |
|--------|---------------|-----------------|
| **Offer Management** | Customer's ATS/HRIS/manual | Webhook `candidate.qualified` → customer creates offer |
| **Background Checks** | Checkr, Sterling, First Advantage | Webhook `candidate.qualified` → customer triggers check |
| **E-Signature** | DocuSign, HelloSign, Adobe Sign | Out of scope |
| **HRIS/Payroll/Onboarding** | BambooHR, Workday, Rippling, Deel, Keka | Webhook `candidate.hired` → customer provisions employee |
| **Employee Database** | Customer's HRIS | Out of scope — we provide qualified candidate list |
| **Equity/Cap Table** | Carta, Pulley, Ledgy | Out of scope |
| **Benefits/Insurance** | Gusto, Justworks, local providers | Out of scope |
| **Reference Checks** | SkillSurvey, Xref, manual | Customer manages |

---

## 4. Implications by Function

### 4.1 Product
- **Messaging:** "HireLoop = AI Screening + Interview Orchestration. We hand off cleanly to your ATS/HRIS."
- **Pricing:** Per AI interview + per human round scheduled (not per hire)
- **Roadmap Priority:** Webhooks → Calendar Sync → Offer Templates → ATS Connectors

### 4.2 Engineering
- **API Contract Stability:** Webhook payloads versioned (`v1`, `v2`); 12-month deprecation policy
- **Idempotency:** All webhooks include `event_id`; customers must deduplicate
- **Rate Limits:** Documented per tier; retry with exponential backoff
- **Data Export:** Daily/hourly sync jobs to S3/SFTP for customers without webhook infra

### 4.3 Sales/GTM
- **Demo Script:** Show AI interview → Scorecard → Schedule Human → Send Offer → Webhook to Greenhouse
- **OBJECTION:** "But we need background checks" → "We webhook `offer.accepted` to your Checkr integration"
- **OBJECTION:** "We use Workday for offers" → "We export offer data; you import. Or use our offer module for speed."

### 4.4 Customer Success
- **Onboarding Milestone 1:** First AI interview completed
- **Onboarding Milestone 2:** First human round scheduled via HireLoop
- **Onboarding Milestone 3:** First webhook delivered to ATS
- **Health Score:** % of pipeline stages automated vs manual

---

## 5. Implementation Roadmap to Achieve Option B

### Phase 1: Integration Foundation (Weeks 1-6)
| Task | Description | Effort |
|------|-------------|--------|
| Webhook Framework | Register endpoints, HMAC signatures, retry logic, dead-letter queue | M |
| Core Events | `application.created`, `interview.completed`, `score.available`, `stage.changed`, `offer.sent`, `offer.accepted`, `candidate.hired` | S |
| REST API v1 | `/jobs`, `/applications`, `/candidates`, `/scores`, `/stages` — read + webhook management | M |
| API Keys & Scoping | Per-org keys with permissions (read:applications, write:stages, webhook:manage) | S |

### Phase 2: Human Round Polish (Weeks 5-10)
| Task | Description | Effort |
|------|-------------|--------|
| Calendar Sync (Google/Outlook) | Interviewer availability → candidate self-scheduling | L |
| Automated Reminders | 24h, 2h, 15min before (email + calendar) | M |
| Video Link Management | Meeting URL field + "Join" buttons for all attendees | S |
| Offer Templates | Compensation JSON schema, approval chain, PDF generation | M |
| E-Sign Webhook | `offer.sent` → customer creates DocuSign envelope → callback updates status | M |

### Phase 3: Pre-built Connectors (Weeks 10-18)
| Connector | Sync Direction | Key Entities |
|-----------|----------------|--------------|
| Greenhouse | Bidirectional | Jobs, Candidates, Applications, Scorecards, Offers |
| Lever | Bidirectional | Same |
| Workday | Outbound (webhook) | Candidate hired → Worker creation |
| BambooHR | Outbound (webhook) | Candidate hired → Employee onboarding |
| Generic Webhook | Outbound | All events (customer maps fields) |

### Phase 4: Advanced Orchestration (Weeks 18+)
- Multi-round panel scheduling optimization
- Interviewer load balancing
- DEI reporting on human rounds
- Predictive time-to-hire based on historical data

---

## 6. Decision Checklist (Must Resolve Before Commit)

| # | Question | Decision Needed | Owner | Due |
|---|----------|-----------------|-------|-----|
| **D1** | **Confirm Option B as strategy** | Yes/No — if No, choose A or C | Product Lead | Week 1 |
| **D2** | **Webhook auth standard** | HMAC-SHA256 vs JWT vs mTLS | Eng Lead | Week 2 |
| **D3** | **API versioning policy** | URL versioning (`/v1/`) vs Header (`Accept: application/vnd.hireloop.v1+json`) | Eng Lead | Week 2 |
| **D4** | **Offer e-sign: build vs integrate** | Native PDF + DocuSign webhook vs embed DocuSign UI | Product | Week 3 |
| **D5** | **Calendar sync: build vs integrate** | Google/Outlook API direct vs Nylas/Cal.com vs customer provides link | Eng Lead | Week 3 |
| **D6** | **Data retention for webhook payloads** | 30 days? 90 days? Configurable? | Legal/Eng | Week 4 |
| **D7** | **SLA for webhook delivery** | 99.9% delivery within 5s? Retry policy? | Eng Lead | Week 4 |
| **D8** | **Pricing model for human rounds** | Included in tier? Per-schedule fee? | GTM Lead | Week 6 |

---

## 7. Rollback Plan (If Option B Proves Wrong)

| Trigger | Action |
|---------|--------|
| **Low webhook adoption** (<20% of Scale tier after 6 mo) | Pivot to Option A: Double down on AI screening excellence; partner for scheduling |
| **Customers demand full ATS** (>50% enterprise deals blocked) | Evaluate Option C: Acquire/Build ATS module or deep partnership |
| **Engineering burden too high** (webhooks + connectors > 40% capacity) | Freeze connector development; focus on API quality; recommend Zapier/Make for custom |

---

## 8. Sign-off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Lead | | | |
| Engineering Lead | | | |
| GTM/Sales Lead | | | |
| Legal/Compliance | | | |

---

*This decision defines the product boundary for the next 12-18 months. Revisit at Series A or when >$1M ARR.*