# HireLoop Professional Presentation — Complete Content Source Document

**Version:** 1.0  
**Purpose:** Single source of truth for all presentation content — use this to generate PPT in any tool (Gamma, Canva, Figma Slides, Beautiful.ai, PowerPoint, Google Slides)  
**Generated:** 2026-07-18

---

## 🎯 PRESENTATION OVERVIEW

| Attribute | Value |
|-----------|-------|
| **Product** | HireLoop — AI Interview Infrastructure Platform |
| **Tagline** | Screen. Interview. Score. Hire. — All in One Platform. |
| **Audience** | HR/TA Leaders, Recruiters, Hiring Managers, Enterprise IT |
| **Tone** | Professional, credible, product-focused (not salesy) |
| **Visual Theme** | Light, clean, brand orange (#FF6B00) accents, Inter/Calibri font |
| **Structure** | 14 slides, 16:9 (13.333" × 7.5") |
| **Boundary Message** | "We hand off at Qualified Candidate List → candidate.qualified webhook → your ATS/HRIS" |

---

## 📋 SLIDE-BY-SLIDE CONTENT

### SLIDE 1: TITLE SLIDE
```
LOGO: HL (orange circle)
TITLE: HireLoop
SUBTITLE: AI Interview Infrastructure Platform
TAGLINE: Screen. Interview. Score. Hire. — All in One Platform.
ACCENT: Top & bottom orange bars (#FF6B00)
```

---

### SLIDE 2: THE HIRING PROBLEM
**Subtitle:** Why traditional hiring fails at scale

**METRICS (4 cards, equal width):**
| Value | Label | Sub-label |
|-------|-------|-----------|
| 60–80% | Recruiter Time Wasted on Scheduling | First-round interviews |
| 40%+ | Candidate Drop-off | Due to scheduling delays |
| 0% | Consistency | Across human interviewers |
| $50–200 | Cost per Interview | Recruiter time cost |

**BULLETS (6):**
- High-volume hiring (50–500+ roles/year) overwhelms recruiting teams
- Inconsistent evaluation — human bias, fatigue, varying standards
- No audit trail — no record of why candidates were hired/rejected
- Candidate experience suffers: long waits, scheduling ping-pong, no feedback
- Existing ATS/HRIS manage workflow but don't CONDUCT interviews
- Building in-house AI interview infrastructure takes 12–18 months and $500K+

---

### SLIDE 3: SOLUTION OVERVIEW
**Subtitle:** One platform. Voice AI + Proctoring + Scoring + Human Orchestration

**FEATURE CARDS (4 columns):**
| Icon | Title | Description |
|------|-------|-------------|
| 🎙 | Voice AI Interviews | Structured Q&A with TTS/STT, bilingual EN/HI, pre-rendered audio |
| 🛡 | Automated Proctoring | Face detection, gaze tracking, tab-switch, AI snapshot analysis — cheating probability % |
| 📊 | AI Scoring Engine | Per-question scores (0–10), overall weighted score, strengths/concerns, red flags |
| 🤝 | Human Round Orchestration | Calendar sync, self-scheduling, scorecards, panel interviews, offer management |

**KPI CARDS (4 columns):**
| Value | Label | Sub-label |
|-------|-------|-----------|
| <15 min | Time to First Interview | Apply → Interview link |
| >85% | Completion Rate | Start → Complete |
| r ≥ 0.7 | AI ↔ Human Correlation | Score validity |
| $2–5 | Cost per AI Interview | vs $50–200 human |

---

### SLIDE 4: WHO HIRELOOP SERVES
**Subtitle:** Primary personas and their jobs-to-be-done

**PERSONA CARDS (2 rows × 3 columns):**

**Row 1:**
| Icon | Title | Description |
|------|-------|-------------|
| 👔 | HR Leaders / TA Heads | Mid-market to enterprise (50–5,000 employees). Hiring 20–500+ interns/graduates/year. Pain: "We lose 40% candidates to scheduling delays" |
| 🔍 | Recruiters / TA Specialists | Screen 200 applicants in 2 hours, not 2 weeks. Review AI scores + proctoring flags. Focus on top 10% only |
| 👨‍💼 | Hiring Managers | See only top 5 candidates with AI scores + proctoring reports. Conduct final rounds with structured scorecards. "Don't make me reinvent questions" |

**Row 2:**
| Icon | Title | Description |
|------|-------|-------------|
| 📅 | Coordinators | Auto-schedule 50 final rounds. Calendar sync (Google/Outlook). Reminders: 24h, 2h, 15min |
| 📋 | Interviewers (Human Rounds) | Receive calendar invites with prep materials. Submit structured scorecards. Calibration across interviewers |
| 🏢 | Enterprise IT / Procurement | SOC 2 / GDPR ready. SSO (Okta, Entra ID, Google). Webhooks → ATS/HRIS (Greenhouse, Lever, Workday). Data residency (US/EU/IN) |

---

### SLIDE 5: END-TO-END WORKFLOW
**Subtitle:** From job posting to qualified candidate handoff

**NUMBERED STEPS (7):**
1. **ADMIN:** Create job → Define form → Build question bank (mandatory + variable) → Set proctoring thresholds → Publish
2. **CANDIDATE:** Clicks apply link → Branded form → Eligibility check → Interview link sent instantly
3. **AI INTERVIEW:** Consent → Proctoring setup → Mic check → Voice Q&A (TTS questions → STT answers) → Auto-advance with timers
4. **PROCTORING:** Continuous face detection + periodic AI snapshot analysis → Cheating probability % (0–100%) → Flagged but NEVER auto-rejected
5. **AI SCORING:** Per-question scores (0–10) + overall weighted score + strengths/concerns/red flags → Pass/fail vs threshold
6. **PIPELINE:** Auto-advance to Recruiter Review → Human rounds (schedule → scorecards → panel) → Offer → Hired
7. **HANDOFF:** candidate.qualified webhook → ATS/HRIS → Customer manages offer, background check, onboarding

---

### SLIDE 6: PROCTORING v2 — FAIRNESS FIRST
**Subtitle:** Cheating probability scoring — never auto-reject, always human review

**DETECTION METRICS (4 cards):**
| Value | Label | Sub-label |
|-------|-------|-----------|
| Face Detection | MediaPipe Real-time | 30fps client-side |
| Multi-face Detection | Unauthorized Person | Critical severity |
| Gaze Tracking | Looking Away >3s | Warning severity |
| Tab Switching | Fullscreen Enforcement | Warning → Critical |

**DETAIL BULLETS (6):**
- Cheating Probability Score (0–100%): Critical events +25, Warnings +10, AI snapshot critical +15, warning +5
- Time decay: Linear over 24h to 30% weight — recent events matter more
- NEVER auto-ends interview: Flags logged, cheating % shown on dashboard, human reviews
- Explicit critical violations (phone detected, second person) flag immediately but interview continues
- Candidate sees: "Proctoring active" indicator; Admin sees: Probability badge + flagged timeline + snapshots
- Configurable thresholds per job: Default 3 critical OR 15 warnings = flagged (adjustable)

---

### SLIDE 7: HYBRID SCORING ENGINE
**Subtitle:** Default Gemini AI + Per-job custom rules = Best of both worlds

**APPROACH CARDS (3 columns):**
| Icon | Title | Description |
|------|-------|-------------|
| 🤖 | Default AI Scoring | Gemini Flash evaluates transcript vs ideal answers. Per-question score (0–10) + rationale + red flags. Overall weighted score + pass/fail vs threshold |
| ⚙️ | Custom Rules (Per Job) | Section weights: Technical 1.3×, HR 0.8×. Required keywords: "GAAP", "reconciliation". Bonus: "SOX", "Big 4", "CPA". Penalty: "guess", "not sure", "unfamiliar" |
| 📝 | Rubric Overrides | "Score 8+ only if end-to-end process shown". "Penalize generic answers without examples". Applied as prompt augmentation to LLM |

**DETAIL BULLETS (6):**
- Default: Pure Gemini Flash scoring — works out of the box
- Custom rules: Admin adds via Job Questions Editor → stored in job_roles.custom_scoring_rules JSONB
- Scale tier: Webhook for fully custom scoring engine (bring your own model)
- Scoring failure = never silent 0 — raises ScoringError, flags for manual review
- Audit trail: Every score has question_id, prompt_text, rationale, red_flags, timestamp
- Bias mitigation: Structured rubric, blind scoring option, demographic parity dashboard (Phase 2)

---

### SLIDE 8: SYSTEM BOUNDARY — WHERE HIRELOOP ENDS ⭐ CRITICAL
**Subtitle:** Clear separation — we hand off at "Qualified Candidate List"

**TWO-COLUMN LAYOUT:**

**LEFT — HIRELOOP OWNS (In-Boundary):**
```
✅ HireLoop Owns (In-Boundary)

• Branded application forms & eligibility rules
• Voice AI interviews (TTS/STT, bilingual)
• Automated proctoring + cheating probability
• AI scoring (Gemini + custom rules)
• Pipeline stages & Kanban
• Human round scheduling (calendar sync, self-scheduling)
• Structured scorecards
• Qualified candidate list + webhook handoff
• Audit logs, proctoring evidence, transcripts
```

**RIGHT — CUSTOMER OWNS (Out-of-Boundary):**
```
❌ Customer Owns (Out-of-Boundary)

• Offer letter creation & approval
• E-signature (DocuSign, HelloSign)
• Background checks (Checkr, Sterling)
• HRIS/Payroll onboarding (BambooHR, Workday, Rippling)
• Equity/cap table (Carta, Pulley)
• Benefits/insurance enrollment
• Employee onboarding & Day 1 ops
• Visa/immigration processing
```

**HANDOFF DETAILS (BULLETS):**
- Handoff Event: candidate.qualified webhook fires when stage → partner_review / hired
- Payload: application_id, candidate_id, job_id, ai_score, human_scorecards[], proctoring_flagged, cheating_probability, qualified_at
- Customer integrates via webhook → their ATS/HRIS creates offer, triggers background check, provisions HRIS
- HireLoop provides: Qualified candidate list, export (CSV/JSON/Parquet), scheduled exports to S3/SFTP/Sheets
- No lock-in: Data export anytime, webhook replay, API access for custom integrations
- We don't replace your ATS/HRIS — we feed it qualified candidates

---

### SLIDE 9: INTEGRATION ECOSYSTEM
**Subtitle:** Plug into your existing stack — webhooks, APIs, pre-built connectors

**CONNECTOR CARDS (2 rows × 4 columns = 8 total):**

**Row 1:**
| Icon | Title | Description |
|------|-------|-------------|
| 🔗 | ATS Connectors | Greenhouse, Lever, Ashby, Teamtailor, Workable. Bidirectional: Jobs ↔ Candidates ↔ Scores ↔ Stages |
| 🏢 | HRIS Connectors | Workday, BambooHR, Rippling, Deel, Keka. Webhook: candidate.qualified → Worker creation |
| 📅 | Calendar & Video | Google Calendar, Outlook, Calendly. Zoom, Teams, Meet, Whereby links auto-generated |
| ✍️ | E-Sign & Checks | DocuSign, HelloSign, Adobe Sign. Checkr, Sterling, First Advantage via webhook |

**Row 2:**
| Icon | Title | Description |
|------|-------|-------------|
| 🔌 | Webhooks (14 Events) | application.created, interview.completed, score.available, stage.changed, candidate.qualified, offer.sent, offer.accepted, candidate.hired + 6 more |
| 📡 | REST API v1 | Jobs, Applications, Candidates, Scores, Stages, Offers — scoped API keys with granular scopes |
| 📊 | Scheduled Exports | CSV/JSON/Parquet → S3, SFTP, GCS, Email, Google Sheets. Daily/hourly/weekly — field mapping UI |
| 🔐 | SSO & SCIM | SAML/OIDC (Okta, Entra ID, Google). SCIM provisioning for auto-deprovision. Role mapping: Owner/Admin/Recruiter/HiringManager/Interviewer |

---

### SLIDE 10: SECURITY, PRIVACY & COMPLIANCE
**Subtitle:** Enterprise-grade from day one

**COMPLIANCE CARDS (4):**
| Value | Label | Sub-label |
|-------|-------|-----------|
| SOC 2 Type II | In Progress | Target Q4 2026 |
| GDPR Ready | DPA Available | Art. 28 DPA standard |
| Data Residency | US / EU / IN | Supabase multi-region |
| Encryption | AES-256 / TLS 1.3 | At rest + in transit |

**SECURITY MEASURES (8 bullets):**
- Row-Level Security (RLS) on every table — org isolation enforced at DB level
- Service-role key only in backend; anon key for public apply pages
- Proctoring snapshots: private bucket, signed URLs (1hr), path = {session_id}/
- Answer audio: private bucket, service-role only, auto-delete after scoring (configurable)
- PII handling: Email/name/phone flagged; excluded from analytics exports by default
- Right to Erasure: DELETE /v1/candidates/{id} cascades (applications, sessions, scores, docs)
- Data Processing Addendum (DPA) standard for Scale+ tiers
- Penetration testing annually; OWASP Top 10 covered; bug bounty program

---

### SLIDE 11: SIMPLE, TRANSPARENT PRICING
**Subtitle:** Per AI interview completed — no per-seat, no hidden fees

**TIER CARDS (4 columns):**

| Tier | Price | Interviews/mo | Seats | Jobs | Key Features |
|------|-------|---------------|-------|------|--------------|
| 🌱 Starter | $299/mo | 50 | 5 | 3 | Email support, $5/extra interview |
| 📈 Growth | $999/mo | 250 | 15 | 15 | Departments, Webhooks + API, Priority support, $4/extra |
| 🚀 Scale | $2,999/mo | 1,000 | 50 | Unlimited | SSO/SAML, Custom exports, Dedicated CSM, $3/extra |
| 💎 Custom | Volume | Volume | Volume | Unlimited | White-label, Custom domain, On-prem/VPC, Custom SLA, Custom scoring webhook |

**PRICING PRINCIPLES (6 bullets):**
- "AI Interview" = one completed candidate session (regardless of question count)
- Human rounds, scorecards, scheduling, offers — included in all tiers
- No per-seat fees for interviewers/hiring managers
- 14-day free trial (10 AI interviews) — no credit card
- Annual billing: 20% discount | Non-profit/edu: 50% off Growth+
- Usage metering: Real-time dashboard + alerts at 80%/100%

---

### SLIDE 12: GETTING STARTED IN 3 STEPS
**Subtitle:** From zero to first AI interview in under an hour

**STEP CARDS (3 columns):**

| Icon | Title | Details |
|------|-------|---------|
| 1️⃣ | Step 1: Organization Setup | • Sign up → Org created<br>• Invite team (8 roles)<br>• Add departments<br>• Select pipeline template (Graduate / Internship / Custom)<br>• Brand: logo, colors, intro video, email templates |
| 2️⃣ | Step 2: Create Your First Job | • Job wizard (5 steps): Details → Form → Questions → Rules → Publish<br>• Build question bank (mandatory + variable)<br>• Set proctoring thresholds & passing score<br>• Configure custom scoring rules (optional)<br>• Publish → Get apply link |
| 3️⃣ | Step 3: Invite Candidates & Go | • Share apply link (careers page, email, LinkedIn, QR)<br>• Candidates apply → instant eligibility → interview link emailed<br>• Watch dashboard: real-time applications, interviews, scores<br>• Move qualified → human rounds → offers → hired |

**SUPPORT BULLETS (6):**
- Sandbox environment: Full-featured trial org with test candidates
- Migration help: CSV import for existing candidates/questions
- Dedicated onboarding specialist (Growth+ tiers)
- Documentation: docs.hireloop.com | API: api.hireloop.com/docs
- Support: In-app chat, email, Slack connect (Scale+)
- SLA: 99.5% uptime (Scale), 99.9% (Custom)

---

### SLIDE 13: ROADMAP — WHAT'S NEXT
**Subtitle:** Continuous innovation — driven by customer feedback

**ROADMAP CARDS (4 columns):**

| Icon | Horizon | Initiatives |
|------|---------|-------------|
| 🧠 | Q3 2026 | Bias audit dashboard. Demographic parity on scores. Question performance analytics. Predictive time-to-hire |
| 🤖 | Q4 2026 | AI-suggested follow-up questions. Auto-generated scorecard templates. Interviewer calibration reports. Candidate benchmarking (anonymized) |
| 🔌 | 2027 | SSO/SCIM full rollout. Advanced ATS connectors (Workday, SAP). Custom scoring webhook (bring your model). White-label candidate portal |
| 🌍 | Beyond | 10+ languages (ES, FR, DE, JA, ZH, PT). Candidate referral portal. Skill assessments integration. Reference check automation |

---

### SLIDE 14: CLOSING / CALL TO ACTION
**Subtitle:** Join 100+ companies screening smarter, faster, fairer

**OUTCOME METRICS (4 cards):**
| Value | Label | Sub-label |
|-------|-------|-----------|
| 10× | Faster Screening | Apply → Interview in minutes |
| 90%+ | Consistency | Structured every time |
| 85%+ | Completion | Candidate-friendly UX |
| 40%+ | Cost Reduction | vs traditional screening |

**CTA ACTIONS (5 bullets):**
- Start free: hireloop.com → "Start Free Trial" (10 AI interviews, no credit card)
- Book a demo: calendly.com/hireloop/demo — 30 min tailored walkthrough
- Technical deep-dive: api.hireloop.com/docs | docs.hireloop.com
- Email: hello@hireloop.com | Slack: slack.hireloop.com
- We're not just an interview tool — we're your AI hiring infrastructure partner

---

## 🎨 DESIGN TOKENS (for implementation)

```json
{
  "colors": {
    "brand": "#FF6B00",
    "brandSoft": "#FFF0E0",
    "brandDark": "#E65C00",
    "white": "#FFFFFF",
    "bg": "#FAFAFB",
    "cardBg": "#FFFFFF",
    "text1": "#111827",
    "text2": "#374151",
    "text3": "#6B7280",
    "text4": "#9CA3AF",
    "border": "#E5E7EB",
    "divider": "#FF6B00",
    "success": "#059669",
    "successBg": "#ECFDF5"
  },
  "fonts": {
    "primary": "Inter",
    "fallback": "Calibri"
  },
  "typeScale": {
    "h1": 38,
    "h2": 28,
    "h3": 22,
    "h4": 18,
    "body": 15,
    "bodySm": 13,
    "caption": 12,
    "captionSm": 11
  },
  "spacing": {
    "xs": 4,
    "sm": 8,
    "md": 16,
    "lg": 24,
    "xl": 32
  },
  "layout": {
    "slideWidth": 13.333,
    "slideHeight": 7.5,
    "margin": 0.75,
    "gutter": 0.30,
    "contentWidth": 11.833,
    "col4": 2.75
  },
  "card": {
    "padding": 0.24,
    "iconSize": 0.52,
    "minHeight": 1.9,
    "radius": 0.10
  }
}
```

---

## 🛠️ HOW TO USE THIS DOCUMENT

### Option 1: Gamma.app (Fastest)
1. Go to gamma.app → "Create new" → "Paste in text"
2. Copy this entire document → paste
3. Gamma auto-generates 14 slides with professional styling
4. Apply brand colors in theme settings

### Option 2: Canva (Most Control)
1. Create → Presentation (16:9)
2. Search "Business Presentation" template
3. Create 14 slides using this content
3. Apply brand colors: #FF6B00, #FAFAFB, #111827, #374151

### Option 3: Figma Slides (Design System Precision)
1. Create design system with tokens above
3. Build 14 frames using exact layout specs
4. Export as PPTX

### Option 4: Beautiful.ai / Pitch
1. Import outline from this document
2. Auto-applies smart layouts
3. Customize theme colors

### Option 5: PowerPoint / Google Slides (Manual)
1. Create 14 slides
2. Use the slide-by-slide content above
3. Apply design tokens for consistency

---

## ✅ VERIFICATION CHECKLIST

Before finalizing, verify:
- [ ] All 14 slides present
- [ ] Slide 8 (Boundary) has two-column In/Out + webhook
- [ ] All metrics have value + label + sub-label
- [ ] All cards have icon + title + description
- [ ] Slide numbers (1/14 through 14/14)
- [ ] Brand orange (#FF6B00) on dividers, metrics, CTAs
- [ ] Closing slide has 4 outcome metrics + 5 CTAs
- [ ] File exports as valid PPTX

---

**This document contains 100% of the content needed to generate the HireLoop professional presentation in any tool.**