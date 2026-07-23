# HireLoop Product Specification — Portal Architecture, Customer Workflows & Customization

**Version:** 1.0  
**Purpose:** Detailed product specification for non-technical stakeholders — portal structure, customer-facing workflows, customization capabilities, end-to-end user journeys  
**Audience:** Product, Design, Customer Success, Sales, Leadership (non-technical)  
**Generated:** 2026-07-19  

---

## 📖 DOCUMENT OVERVIEW

| Attribute | Value |
|-----------|-------|
| **Product** | HireLoop — AI Interview Infrastructure Platform |
| **Document Type** | Product Specification / Portal Architecture |
| **Focus** | Customer portal structure, admin workflows, customization, end-to-end journeys |
| **Not Included** | Pitch decks, pricing, competitor comparisons, marketing fluff |
| **Format** | Structured for presentation generation (Gamma, Canva, Figma Slides, PPT) |

---

## 🎯 PRODUCT POSITIONING STATEMENT

> **HireLoop is an AI Interview Infrastructure Platform that replaces manual first-round screening with voice-based AI interviews, automated proctoring, and hybrid scoring — then orchestrates human interview rounds through to qualified candidate handoff via webhook to the customer's ATS/HRIS.**

**We own:** Apply → AI Interview → Proctoring → Scoring → Human Round Orchestration → Qualified List  
**Customer owns:** Offer → Background Check → E-Sign → HRIS Onboarding → Employee Lifecycle

---

## 🏗️ PORTAL ARCHITECTURE — INFORMATION ARCHITECTURE

### Top-Level Navigation (Persistent Sidebar)

```
┌─────────────────────────────────────────────────────────────┐
│  HireLoop  ◄─── Org Switcher (multi-org users)              │
├─────────────────────────────────────────────────────────────┤
│  DASHBOARD                                                  │
│  ├─ Overview                                                │
│  ├─ Pipeline Health                                         │
│  └─ Action Items                                            │
├─────────────────────────────────────────────────────────────┤
│  JOBS                                                       │
│  ├─ All Jobs (table)                                        │
│  ├─ Create Job (wizard)                                     │
│  ├─ Job Templates                                           │
│  └─ Archived                                                │
├─────────────────────────────────────────────────────────────┤
│  CANDIDATES                                                 │
│  ├─ Kanban Board (pipeline view)                            │
│  ├─ List View (table)                                       │
│  ├─ Qualified List (handoff-ready)                          │
│  └─ Talent Pool (rejected but promising)                    │
├─────────────────────────────────────────────────────────────┤
│  INTERVIEWS                                                 │
│  ├─ AI Interviews (in-progress, completed, flagged)         │
│  ├─ Human Rounds (scheduled, pending scorecards, completed) │
│  ├─ Schedule (calendar view)                                │
│  └─ Scorecards                                              │
├─────────────────────────────────────────────────────────────┤
│  ANALYTICS                                                  │
│  ├─ Funnel Conversion                                       │
│  ├─ Time-to-Hire                                            │
│  ├─ Question Performance                                    │
│  ├─ Proctoring Flags                                        │
│  ├─ Interviewer Calibration                                 │
│  └─ Bias Audit (Phase 2)                                    │
├─────────────────────────────────────────────────────────────┤
│  SETTINGS                                                   │
│  ├─ Organization (branding, domains, pipeline stages)       │
│  ├─ Team & Roles (invite, RBAC, departments)                │
│  ├─ Integrations (ATS, HRIS, Calendar, Webhooks)            │
│  ├─ Interview (defaults, proctoring, scoring)               │
│  ├─ Security (SSO, SCIM, audit logs)                        │
│  └─ Billing & Usage                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 👤 CUSTOMER PERSONAS & THEIR PORTAL VIEWS

| Persona | Primary Dashboard | Key Pages | Permissions |
|---------|------------------|-----------|-------------|
| **TA Leader / HR Director** | Executive Dashboard | All Jobs, Analytics, Settings, Billing | Full org access |
| **Recruiter / TA Specialist** | Recruiter Dashboard | Candidates (Kanban), Jobs, AI Interviews, Qualified List | Assigned jobs/departments |
| **Hiring Manager** | Hiring Manager View | My Jobs, Candidates (read-only), Scorecards, Schedule | Only owned jobs |
| **Interviewer (Human Rounds)** | Interviewer Dashboard | Upcoming Interviews, Scorecards, Prep Materials | Assigned interviews only |
| **Coordinator / Scheduler** | Scheduler View | Calendar, Slots, Reminders, Candidate Comms | Assigned jobs |
| **IT / Procurement** | Settings Only | Integrations, Security, SSO, Audit Logs, Billing | Settings access |

---

## 🔄 END-TO-END CUSTOMER WORKFLOWS

### WORKFLOW 1: JOB CREATION (5-Step Wizard)

```
STEP 1: JOB DETAILS
├─ Title, Department, Employment Type, Location(s)
├─ Hiring Manager (assign), Recruiter (assign)
├─ Pipeline Template: Graduate / Internship / Experienced / Custom
├─ Headcount, Budget Range, Priority
└─ Internal Notes (visible to team only)

STEP 2: APPLICATION FORM (Dynamic Builder)
├─ Section: Personal Info (pre-built: name, email, phone, location, resume)
├─ Section: Eligibility (custom questions: visa, graduation year, availability)
├─ Section: Screening (knockout questions: "Are you authorized to work in X?")
├─ Section: Custom Fields (drag-drop: text, select, multi-select, file upload, date, number)
├─ Conditional Logic: Show field X if answer Y = "Yes"
├─ Required vs Optional per field
└─ Preview & Test Submit

STEP 3: QUESTION BANK (AI Interview Content)
├─ Question Types:
│  ├─ Behavioral ("Tell me about a time...")
│  ├─ Technical ("Explain concept X")
│  ├─ Situational ("How would you handle...")
│  ├─ Coding (auto-graded via test cases — future)
│  └─ Video Response (optional)
├─ Each Question:
│  ├─ Prompt Text (what AI speaks)
│  ├─ Ideal Answer Notes (for AI scoring)
│  ├─ Time Limit (30-300 sec)
│  ├─ Section Tag (Technical / Behavioral / HR / Custom)
│  ├─ Weight (default 1.0, adjustable 0.5-2.0)
│  ├─ Mandatory vs Variable (variable = randomly selected per candidate)
│  └─ Language Variants (EN, HI — pre-rendered TTS)
├─ Question Pool Settings:
│  ├─ Total Questions per Interview (3-10)
│  ├─ Mandatory Questions (always asked)
│  ├─ Variable Pool Size (e.g., 20 questions, pick 5)
│  └─ Randomization Seed (consistent per job)
├─ Reorder via Drag-Drop
├─ Clone from Job Template / Another Job
└─ Preview TTS Audio

STEP 4: RULES & SCORING
├─ Proctoring Thresholds:
│  ├─ Cheating Probability Flag Threshold (default: 50%)
│  ├─ Critical Event Auto-Flag (phone, 2nd person)
│  ├─ Warning Threshold (gaze, tab-switch)
│  └─ Custom per-job override
├─ Passing Score:
│  ├─ Overall Threshold (0-10, default 6.0)
│  ├─ Section Minimums (Technical ≥ 6, HR ≥ 5)
│  └─ Knockout Questions (must pass specific Q)
├─ Hybrid Scoring:
│  ├─ Use Default Gemini Scoring (recommended)
│  ├─ Custom Rules (JSON):
│  │  ├─ Section Weights: {"Technical": 1.3, "HR": 0.8}
│  │  ├─ Required Keywords: ["GAAP", "reconciliation"]
│  │  ├─ Bonus Keywords: ["SOX", "Big 4", "CPA"]
│  │  ├─ Penalty Keywords: ["guess", "not sure"]
│  │  └─ Rubric Overrides: {"Technical": "Score 8+ only if end-to-end process shown"}
│  └─ Scale Tier: Custom Scoring Webhook URL
├─ Re-attempt Policy:
│  ├─ Max Attempts (1-3, default 1)
│  ├─ Cooldown Period (hours/days)
│  └─ Eligibility Reset Conditions
└─ Knockout Logic: Auto-reject if any knockout Q failed

STEP 5: PUBLISH & DISTRIBUTE
├─ Status: Draft → Published → Paused → Archived
├─ Apply Link: hireloop.com/apply/{job-slug} (custom slug)
├─ Career Page Embed: iframe code, branded
├─ QR Code for events/print
├─ Email Template: Invite candidates (merge fields)
├─ Social Share: LinkedIn, Twitter, WhatsApp pre-filled
├─ ATS Push: Auto-create in Greenhouse/Lever/Workday
├─ Internal Sharing: Copy link, share with hiring team
└─ Notification: Alert assigned recruiter/hiring manager
```

**Output:** Live job with apply link, candidate portal, interview engine ready

---

### WORKFLOW 2: CANDIDATE MANAGEMENT (Kanban Pipeline)

```
PIPELINE STAGES (Customizable per Org)
┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│   APPLIED   │  SCREENING  │ AI INTERVIEW│  RECRUITER  │   HUMAN     │   OFFER     │    HIRED    │  REJECTED   │
│  (auto)     │  (manual)   │  (in-prog)  │  REVIEW     │  ROUNDS     │  (manual)   │   (auto)    │  (anytime)  │
├─────────────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│ Auto on     │ Recruiter   │ Auto on     │ Recruiter   │ Scheduled   │ Sent        │ Accepted    │ Reason      │
│ submit      │ reviews     │ interview   │ advances    │ → Scorecards│ → Accepted  │ webhook     │ tagged      │
│ form        │ form/docs   │ completes   │ qualified   │ completed   │ → Hired     │ fires       │             │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘

KANBAN CARD CONTENT:
┌─────────────────────────────────────────────────────────────┐
│ 👤 Jane Doe                    🏷️ Software Engineer Intern   │
│ 📧 jane@email.com  📞 +1-555-0123  📍 San Francisco, CA      │
│                                                             │
│ 📊 AI Score: 8.2/10    🛡️ Proctoring: 12% (clean)           │
│ 📄 Resume ▼  📝 Cover Letter  🎓 Transcript                 │
│                                                             │
│ ⏱️ 3 days in stage    ⚠️ Stale (no action 48h)             │
│                                                             │
│ [View] [Advance ▼] [Reject ▼] [Message] [More ▼]           │
└─────────────────────────────────────────────────────────────┘

BULK ACTIONS (multi-select):
├─ Advance to Next Stage
├─ Reject with Template
├─ Send Email (merge fields)
├─ Assign Recruiter
├─ Add Tags
├─ Export Selected (CSV)
└─ Schedule Interviews
```

**Candidate Detail View (7 Tabs):**

```
┌─ Application ─┬─ Documents ─┬─ Job & Interview ─┬─ Proctoring ─┬─ Transcript ─┬─ AI Scores ─┬─ Scorecards ─┐
│ Form Answers  │ Resume      │ Job Details       │ Timeline     │ Full Q&A    │ Per-Q Score │ Human Cards  │
│ Eligibility   │ Cover Letter│ AI Interview      │ Events       │ Audio       │ Overall     │ Calibration  │
│ Knockouts     │ Transcripts │ Human Rounds      │ Snapshots    │ Timestamps  │ Strengths   │ Comparison   │
│ Custom Fields │ Certs       │ Schedule          │ Cheating %   │ Search      │ Concerns    │ Avg Score    │
│ Timestamp     │ Portfolio   │ Links             │ Flagged      │ Export      │ Red Flags   │ Recommendation
└───────────────┴─────────────┴───────────────────┴──────────────┴─────────────┴─────────────┴──────────────┘
```

---

### WORKFLOW 3: AI INTERVIEW — CUSTOMER VIEW

```
AI INTERVIEW DASHBOARD (Real-Time)
┌─────────────────────────────────────────────────────────────────┐
│ FILTERS: [Job ▼] [Status ▼] [Date Range ▼] [Proctoring ▼]      │
├─────────────────────────────────────────────────────────────────┤
│ □ Jane Doe        │ Software Eng    │ In Progress (Q3/5)  │ 12%  │
│ □ John Smith      │ Data Analyst    │ Completed           │ 3%   │
│ □ Alice Chen      │ Marketing       │ Flagged Review      │ 67%  │ ⚠️
│ □ Bob Wilson      │ Sales           │ Completed           │ 8%   │
│ □ Carol Davis     │ DevOps          │ Paused (Mic Issue)  │ 0%   │
└─────────────────────────────────────────────────────────────────┘

DETAIL VIEW (Click Candidate):
┌─────────────────────────────────────────────────────────────────┐
│ PROCTORING TIMELINE                                              │
│ ┌────┬──────────────────┬───────────┬────────────────────────┐  │
│ │ 🕐  │ 10:03:12         │ Critical  │ Phone detected         │  │
│ │ 🕐  │ 10:07:45         │ Warning   │ Gaze deviation >5s     │  │
│ │ 🕐  │ 10:12:30         │ Warning   │ Tab switch (2x)        │  │
│ │ 📸  │ 10:15:00         │ Snapshot  │ AI: "Candidate alone"  │  │
│ └────┴──────────────────┴───────────┴────────────────────────┘  │
│                                                                  │
│ CHEATING PROBABILITY: 22%  [████░░░░░░░░░░░░░░░░░] 22%          │
│                                                                  │
│ [View Snapshots] [View Full Log] [Mark Reviewed] [Override]     │
└─────────────────────────────────────────────────────────────────┘

SCORING VIEW (Auto-refresh on completion):
┌─────────────────────────────────────────────────────────────────┐
│ OVERALL: 7.8/10  ✅ PASS (threshold 6.0)                        │
│                                                                  │
│ SECTION BREAKDOWN:                                              │
│ ┌─────────────┬───────┬───────┬──────────────────────────────┐  │
│ │ Technical   │ 8.2   │ 1.3×  │ Strong fundamentals          │  │
│ │ Behavioral  │ 7.5   │ 1.0×  │ Good STAR examples           │  │
│ │ HR Fit      │ 7.8   │ 0.8×  │ Culture aligned              │  │
│ └─────────────┴───────┴───────┴──────────────────────────────┘  │
│                                                                  │
│ PER QUESTION:                                                   │
│ Q1 (Technical): 9/10  "Excellent depth on distributed systems"  │
│ Q2 (Behavioral): 7/10  "Good STAR, could quantify impact"      │
│ Q3 (Technical): 8/10  "Solid understanding of caching"         │
│ ...                                                              │
│                                                                  │
│ RED FLAGS: None                                                 │
│ CONCERNS: Q4 answer generic, no specific metrics                │
│                                                                  │
│ [Approve Score] [Request Human Review] [Adjust Weights]         │
└─────────────────────────────────────────────────────────────────┘
```

---

### WORKFLOW 4: HUMAN ROUND ORCHESTRATION

```
SCHEDULING FLOW:
┌─────────────────────────────────────────────────────────────────┐
│ 1. RECRUITER: Select candidates → "Schedule Human Rounds"       │
│                                                                    │
│ 2. CONFIGURE ROUNDS:                                             │
│    ├─ Round 1: Technical Panel (2 interviewers, 45 min)         │
│    ├─ Round 2: Hiring Manager (1 interviewer, 30 min)           │
│    ├─ Round 3: Culture Fit (2 interviewers, 30 min)             │
│    └─ Optional: Take-home / Case Study                           │
│                                                                    │
│ 3. INTERVIEWER AVAILABILITY:                                     │
│    ├─ Auto-fetch from Google/Outlook Calendar                   │
│    ├─ Conflict Detection                                         │
│    ├─ Preferred Time Windows (per interviewer)                  │
│    └─ Buffer Time (15 min default)                               │
│                                                                    │
│ 4. CANDIDATE SELF-SCHEDULING:                                    │
│    ├─ Email with branded scheduling link                        │
│    ├─ Candidate picks from available slots                      │
│    ├─ Auto-confirmation + Calendar invites                      │
│    ├─ Reminders: 24h, 2h, 15min (email + SMS)                  │
│    └─ Reschedule/Cancel with automatic re-offering              │
│                                                                    │
│ 4. COORDINATOR VIEW:                                             │
│    ├─ Calendar Heatmap (availability)                           │
│    ├─ Pending Confirmations                                     │
│    ├─ Conflicts & Reschedules                                   │
│    └─ No-show Tracking                                          │
└─────────────────────────────────────────────────────────────────┘

SCORECARD SUBMISSION:
┌─────────────────────────────────────────────────────────────────┐
│ STRUCTURED SCORECARD (Per Interviewer, Per Round)               │
│                                                                   │
│ CANDIDATE: Jane Doe  │  ROUND: Technical Panel  │  45 min        │
│                                                                   │
│ COMPETENCIES (1-5 each):                                         │
│ ┌─────────────────────────┬─┬─┬─┬─┬─┐                              │
│ │ Technical Depth         │ ●│ ●│ ●│ ○│ ○│  = 3/5                  │
│ │ Problem Solving         │ ●│ ●│ ●│ ●│ ○│  = 4/5                  │
│ │ Communication           │ ●│ ●│ ●│ ●│ ●│  = 5/5                  │
│ │ Culture Alignment       │ ●│ ●│ ●│ ○│ ○│  = 3/5                  │
│ └─────────────────────────┴─┴─┴─┴─┴─┘                              │
│                                                                   │
│ OVERALL RECOMMENDATION:                                           │
│ ( ) Strong Hire   (●) Hire   ( ) No Hire   ( ) Strong No Hire    │
│                                                                   │
│ STRENGTHS: Clear communication, strong problem solving            │
│ CONCERNS:  Limited experience with distributed systems            │
│ NOTES:  Would benefit from mentorship on system design            │
│                                                                   │
│ [Save Draft] [Submit Scorecard]                                   │
└─────────────────────────────────────────────────────────────────┘

CALIBRATION VIEW (Post-Round):
┌─────────────────────────────────────────────────────────────────┐
│ INTERVIEWER CALIBRATION — Technical Panel (3 interviewers)      │
│                                                                   │
│ ┌─────────────┬─────────┬─────────┬─────────┬─────────┐         │
│ │ Candidate   │ Int. A  │ Int. B  │ Int. C  │ Average │         │
│ ├─────────────┼─────────┼─────────┼─────────┼─────────┤         │
│ │ Jane Doe    │ 4.2     │ 3.8     │ 4.0     │ 4.0     │         │
│ │ John Smith  │ 3.5     │ 2.8     │ 3.2     │ 3.2     │         │
│ │ Alice Chen  │ 4.5     │ 4.8     │ 4.2     │ 4.5     │         │
│ └─────────────┴─────────┴─────────┴─────────┴─────────┘         │
│                                                                   │
│ ⚠️  Int. B consistently scores 0.5 lower than panel avg          │
│ → Recommend calibration session                                  │
│                                                                   │
│ [View Details] [Schedule Calibration] [Export]                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### WORKFLOW 5: QUALIFIED CANDIDATE HANDOFF

```
QUALIFIED LIST VIEW:
┌─────────────────────────────────────────────────────────────────┐
│ FILTERS: [Job ▼] [Date ▼] [Score Range ▼] [Department ▼]       │
├─────────────────────────────────────────────────────────────────┤
│ □ Jane Doe        │ Software Eng    │ 8.2  │ 4.0/5.0  │ Handoff │
│ □ John Smith      │ Data Analyst    │ 7.8  │ 3.8/5.0  │ Ready   │
│ □ Alice Chen      │ Marketing       │ 8.5  │ 4.5/5.0  │ Handoff │
│ □ Bob Wilson      │ DevOps          │ 7.2  │ 3.5/5.0  │ Ready   │
└─────────────────────────────────────────────────────────────────┘

HANDOFF ACTIONS (Per Candidate):
├─ [Mark Qualified] → Triggers `candidate.qualified` webhook
├─ [Export Package] → PDF + CSV + Audio + Proctoring Log
├─ [Push to ATS] → Greenhouse/Lever/Workday (if integrated)
├─ [Download Scorecards] → All human + AI scores
├─ [Generate Offer Link] → Pre-filled offer template
└─ [Share with Hiring Manager] → Secure view-only link

WEBHOOK PAYLOAD (candidate.qualified):
{
  "event_id": "evt_abc123",
  "event_type": "candidate.qualified",
  "version": "2026-07-19",
  "timestamp": "2026-07-19T14:30:00Z",
  "data": {
    "application_id": "app_abc123",
    "candidate_id": "cand_xyz789",
    "candidate_name": "Jane Doe",
    "candidate_email": "jane@example.com",
    "job_id": "job_software_eng",
    "job_title": "Software Engineer Intern",
    "department": "Engineering",
    "ai_score": 8.2,
    "human_scorecards": [
      {"reviewer": "Sarah Chen", "round": "Technical", "score": 4.0, "recommendation": "hire"},
      {"reviewer": "Mike Johnson", "round": "Hiring Manager", "score": 4.0, "recommendation": "hire"}
    ],
    "proctoring_flagged": false,
    "cheating_probability": 12,
    "qualified_at": "2026-07-19T14:30:00Z",
    "export_url": "https://hireloop.com/exports/app_abc123.zip"
  }
}
```

---

## ⚙️ CUSTOMIZATION CAPABILITIES — WHAT CUSTOMERS CAN CONFIGURE

### 1. BRANDING & WHITE-LABEL (Scale+ Tiers)

| Element | Customizable? | Details |
|---------|---------------|---------|
| **Logo** | ✅ | SVG/PNG, header + candidate portal |
| **Color Palette** | ✅ | Primary, secondary, accent, background |
| **Custom Domain** | ✅ Scale+ | `careers.yourcompany.com` |
| **Email Templates** | ✅ | HTML/CSS editor, merge fields |
| **Candidate Portal** | ✅ | Hero image, intro video, welcome text |
| **Favicon** | ✅ | Browser tab icon |
| **Login Page** | ✅ | Custom background, copy |
| **PDF Exports** | ✅ | Branded headers/footers |
| **Remove "Powered by HireLoop"** | ✅ Custom tier | Complete white-label |

### 2. PIPELINE & STAGES (Per Organization)

| Setting | Customizable? | Details |
|---------|---------------|---------|
| **Stage Names** | ✅ | Rename, reorder, add/remove |
| **Stage Colors** | ✅ | Kanban card colors |
| **Stage SLA** | ✅ | Auto-alert if candidate stuck > N days |
| **Auto-Advance Rules** | ✅ | e.g., "AI Score ≥ 7 → Recruiter Review" |
| **Required Actions per Stage** | ✅ | Checklist before advance |
| **Stage Entry/Exit Webhooks** | ✅ | Trigger external automations |
| **Department-Specific Pipelines** | ✅ Growth+ | Different flows per dept |

### 3. APPLICATION FORM (Per Job)

| Element | Customizable? | Details |
|---------|---------------|---------|
| **Field Types** | ✅ | Text, textarea, select, multi-select, date, number, file, checkbox, radio, signature |
| **Conditional Logic** | ✅ | Show/hide based on previous answers |
| **Validation Rules** | ✅ | Regex, min/max, required, custom |
| **Knockout Questions** | ✅ | Auto-reject if failed |
| **Section Ordering** | ✅ | Drag-drop |
| **Multi-Language** | ✅ | EN, HI, ES, FR, DE (more coming) |
| **Save & Resume** | ✅ | Candidate can return later |
| **Prefill from LinkedIn** | ✅ | One-click import |

### 4. INTERVIEW ENGINE (Per Job)

| Setting | Customizable? | Details |
|---------|---------------|---------|
| **Question Bank** | ✅ | Build from scratch or clone templates |
| **Question Types** | ✅ | Behavioral, Technical, Situational, Coding*, Video* |
| **Time Limits** | ✅ | Per question (30-300 sec) |
| **Language Variants** | ✅ | EN, HI (more coming) |
| **Mandatory vs Variable** | ✅ | Fixed pool + random selection |
| **Question Weights** | ✅ | 0.5x - 2.0x per question |
| **Section Tags** | ✅ | Technical, Behavioral, HR, Custom |
| **TTS Voice** | ✅ | Multiple voices per language |
| **Re-attempt Policy** | ✅ | Max attempts, cooldown, eligibility reset |

### 5. PROCTORING (Per Job)

| Setting | Customizable? | Details |
|---------|---------------|---------|
| **Cheating Probability Threshold** | ✅ | Flag at 30%/50%/70% |
| **Critical Events** | ✅ | Enable/disable: phone, 2nd person, no face, multiple faces |
| **Warning Events** | ✅ | Enable/disable: gaze, tab-switch, audio, environment |
| **Snapshot Frequency** | ✅ | Every 30s / 60s / 90s / manual |
| **AI Analysis Sensitivity** | ✅ | Strict / Balanced / Lenient |
| **Auto-Flag vs Review** | ✅ | Auto-flag only vs manual review required |
| **Candidate Notification** | ✅ | Show/hide proctoring indicator |

### 6. SCORING (Per Job)

| Setting | Customizable? | Details |
|---------|---------------|---------|
| **Overall Passing Score** | ✅ | 0-10 (default 6.0) |
| **Section Minimums** | ✅ | Technical ≥ 6, HR ≥ 5, etc. |
| **Knockout Questions** | ✅ | Must pass specific questions |
| **Section Weights** | ✅ | Technical 1.3×, HR 0.8×, etc. |
| **Custom Rules (JSON)** | ✅ | Keywords, bonuses, penalties, rubric overrides |
| **Custom Scoring Webhook** | ✅ Scale | Bring your own model |
| **Blind Scoring** | ✅ | Hide candidate name/demographics from AI |

### 6. HUMAN ROUNDS (Per Job/Org)

| Setting | Customizable? | Details |
|---------|---------------|---------|
| **Round Structure** | ✅ | Number, type, duration, interviewers |
| **Scorecard Template** | ✅ | Competencies, scale (1-5/1-10), weights |
| **Competency Library** | ✅ | Org-wide reusable competencies |
| **Calibration Rules** | ✅ | Auto-flag interviewer variance |
| **Scheduling Windows** | ✅ | Per interviewer preferences |
| **Reminder Cadence** | ✅ | 24h, 2h, 15min, custom |
| **Video Provider** | ✅ | Zoom, Teams, Meet, Whereby, custom link |

### 7. NOTIFICATIONS & COMMUNICATIONS

| Channel | Customizable? | Details |
|---------|---------------|---------|
| **Email Templates** | ✅ | Per event, HTML editor, merge fields |
| **SMS Templates** | ✅ | Short codes, opt-in required |
| **In-App Notifications** | ✅ | Per role, per event |
| **Slack/Webhook** | ✅ | Per channel, per event |
| **Frequency** | ✅ | Immediate, digest (daily/weekly) |
| **Language** | ✅ | Per candidate locale |

### 8. ROLE-BASED ACCESS (RBAC)

| Role | Default Permissions | Customizable? |
|------|---------------------|---------------|
| **Owner** | Full org access, billing, delete org | ❌ (fixed) |
| **Admin** | All settings, team, jobs, candidates | ✅ Restrict |
| **Recruiter** | Assigned jobs, candidates, schedule | ✅ Restrict |
| **Hiring Manager** | Owned jobs, candidates, scorecards | ✅ Restrict |
| **Interviewer** | Assigned interviews, scorecards only | ✅ Restrict |
| **Coordinator** | Scheduling, reminders, comms | ✅ Restrict |
| **Viewer** | Read-only assigned data | ✅ Restrict |
| **Custom Roles** | ✅ Growth+ | Create from scratch |

---

## 📱 CANDIDATE PORTAL — END-USER EXPERIENCE

### Apply Flow (Public)

```
LANDING PAGE → ELIGIBILITY CHECK → APPLICATION FORM → CONFIRMATION → INTERVIEW LINK
     │                │                    │                │              │
     ▼                ▼                    ▼                ▼              ▼
Branded           Knockout Qs          Dynamic Form      Email +        Unique Token
Hero/Video        (auto-reject)        Save & Resume     Portal Link    (expires 7d)
```

### Interview Experience (Candidate Side)

```
CONSENT → PROCTORING SETUP → MIC CHECK → QUESTION 1 → ... → QUESTION N → COMPLETE
   │           │               │           │             │           │
   ▼           ▼               ▼           ▼             ▼           ▼
Terms &        Camera +       Audio Test    TTS Prompt   Auto-       Results Page
Privacy         Audio Perm    (visual)      → STT Answer  Advance     (Thank You)
Policy          Face Detect   Calibration   Timer Bar    Timer       Next Steps
```

### Candidate Dashboard (Post-Interview)

```
┌─────────────────────────────────────────────────────────────────┐
│ Welcome back, Jane!                                             │
├─────────────────────────────────────────────────────────────────┤
│ YOUR APPLICATIONS                                               │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Software Engineer Intern  │  Acme Corp  │  AI Interview ✅   │ │
│ │ Status: Human Rounds Scheduled                                │ │
│ │ Next: Technical Panel — Tomorrow 2:00 PM  [Reschedule]       │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Data Analyst Intern         │  Beta Inc   │  AI Interview ✅  │ │
│ │ Status: Qualified — Awaiting Offer                           │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ PROFILE SETTINGS  |  NOTIFICATIONS  |  DELETE ACCOUNT           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔌 INTEGRATION POINTS — CUSTOMER CONFIGURATION

### ATS Integrations (Bidirectional)

| ATS | Sync Directions | Configurable Fields |
|-----|-----------------|---------------------|
| **Greenhouse** | Jobs ↔ Candidates ↔ Scores ↔ Stages | Custom field mapping, stage mapping, custom attributes |
| **Lever** | Jobs ↔ Candidates ↔ Scores ↔ Stages | Custom field mapping, stage mapping, tags |
| **Ashby** | Jobs ↔ Candidates ↔ Scores ↔ Stages | Custom field mapping, stage mapping |
| **Teamtailor** | Jobs → Candidates → Scores → Stages | Field mapping, stage mapping |
| **Workable** | Jobs → Candidates → Scores → Stages | Field mapping, stage mapping |
| **Custom (API)** | ✅ Scale | Full REST API + webhooks |

**Configurable Per Integration:**
- Field mapping UI (drag-drop)
- Stage mapping (HireLoop stage ↔ ATS stage)
- Sync frequency (real-time, hourly, daily)
- Direction per object (push-only, pull-only, bidirectional)
- Conflict resolution (HireLoop wins / ATS wins / manual)
- Test sync with dry-run

### HRIS Integrations (Handoff)

| HRIS | Trigger | Data Sent |
|------|---------|-----------|
| **Workday** | `candidate.qualified` | Worker creation, personal info, job assignment |
| **BambooHR** | `candidate.qualified` | Employee creation, onboarding packet |
| **Rippling** | `candidate.qualified` | Employee creation, app provisioning |
| **Deel** | `candidate.qualified` | Contractor/employee onboarding |
| **Keka** | `candidate.qualified` | Employee creation |
| **Custom (Webhook)** | ✅ Any event | Full payload + export URL |

### Calendar & Video

| Provider | OAuth Scopes | Configurable |
|----------|--------------|--------------|
| **Google Calendar** | `calendar.events`, `calendar.readonly` | ✅ Per user |
| **Outlook/Exchange** | `Calendars.ReadWrite` | ✅ Per user |
| **Calendly** | `scheduling` | ✅ Org-wide |
| **Zoom** | `meeting:write` | ✅ Per user |
| **Teams** | `OnlineMeetings.ReadWrite` | ✅ Per user |
| **Google Meet** | `calendar.events` | ✅ Auto from Calendar |
| **Whereby** | API Key | ✅ Org-wide |

### Webhooks (14 Events, Scale+)

| Event | Trigger | Payload Includes |
|-------|---------|------------------|
| `application.created` | Form submit | Application, candidate, job |
| `application.updated` | Field change | Changed fields |
| `interview.started` | Candidate begins | Session, candidate, job |
| `interview.completed` | All questions done | Session, scores, proctoring |
| `score.available` | AI scoring done | Scores, breakdown, red flags |
| `proctoring.flagged` | Probability > threshold | Events, snapshots, probability |
| `stage.changed` | Kanban move | From, to, actor, timestamp |
| `candidate.qualified` | Mark qualified | Full handoff payload |
| `candidate.hired` | Offer accepted | Offer details, start date |
| `offer.sent` | Offer email sent | Offer details, expiry |
| `offer.accepted` | Candidate signs | Signed document |
| `interview.scheduled` | Calendar event | Event, attendees, link |
| `scorecard.submitted` | Interviewer submits | Scorecard, recommendation |
| `candidate.rejected` | Rejection action | Reason, stage, actor |

**Webhook Config (Per Subscription):**
- URL, Secret (HMAC), Events, Retry Policy, Header Customization

---

## 📊 ANALYTICS & REPORTING — WHAT CUSTOMERS SEE

### Dashboard Tabs

| Tab | Metrics | Visualizations |
|-----|---------|----------------|
| **Overview** | Total applications, active interviews, qualified rate, avg time-to-hire | KPI cards, trend lines |
| **Pipeline** | Stage conversion, stage velocity, drop-off points, stale candidates | Funnel chart, cohort table, aging buckets |
| **Interviews** | Completion rate, avg duration, proctoring flag rate, score distribution | Histograms, heatmaps |
| **Scoring** | AI vs Human correlation, section averages, question difficulty, interviewer variance | Scatter plots, radar charts, calibration matrix |
| **Proctoring** | Flag rate, event types, cheating probability distribution, false positive rate | Stacked bars, trend lines |
| **Diversity** (Phase 2) | Demographic funnel, parity metrics, adverse impact | Funnel by demographic, 4/5ths rule |
| **Team** | Recruiter workload, interviewer calibration, time-to-action | Leaderboards, heatmaps |
| **Custom Reports** | ✅ Scale+ | Drag-drop builder, scheduled exports |

### Export Capabilities

| Format | Destinations | Scheduling |
|--------|--------------|------------|
| **CSV** | Download, Email, S3, SFTP, GCS, Google Sheets | Hourly, Daily, Weekly, Monthly |
| **JSON** | Download, Email, S3, SFTP, GCS | Same |
| **Parquet** | Download, S3, GCS | Same |
| **PDF** | Download, Email | Ad-hoc |
| **Field Mapping** | ✅ UI | Per export job |

---

## 🔐 SECURITY & COMPLIANCE — CUSTOMER CONTROLS

| Control | Configurable? | Details |
|---------|---------------|---------|
| **SSO (SAML/OIDC)** | ✅ Scale+ | Okta, Entra ID, Google, custom IdP |
| **SCIM Provisioning** | ✅ Scale+ | Auto-create/deactivate users |
| **Password Policy** | ✅ | Min length, complexity, rotation, MFA |
| **Session Timeout** | ✅ | 15min - 24h |
| **IP Allowlist** | ✅ Scale+ | CIDR ranges |
| **Data Residency** | ✅ Custom | US (default), EU (Frankfurt), IN (Mumbai) |
| **Encryption Keys** | ✅ Custom | Customer-managed keys (CMK) |
| **Audit Logs** | ✅ | All actions, 7-year retention, exportable |
| **DPA** | ✅ Scale+ | Standard + custom clauses |
| **SOC 2 Report** | ✅ Scale+ | Type II (annual) |
| **Penetration Test** | ✅ Custom | Annual, shared under NDA |

---

## 📋 QUICK REFERENCE — CUSTOMIZATION MATRIX

| Category | Starter | Growth | Scale | Custom |
|----------|---------|--------|-------|--------|
| **Branding (logo, colors)** | ✅ | ✅ | ✅ | ✅ |
| **Custom Domain** | ❌ | ❌ | ✅ | ✅ |
| **White-Label** | ❌ | ❌ | ❌ | ✅ |
| **Pipeline Stages** | 1 template | 3 templates | Unlimited | Unlimited |
| **Department Pipelines** | ❌ | ✅ | ✅ | ✅ |
| **Application Form** | Basic | Advanced | Advanced | Advanced |
| **Question Bank** | ✅ | ✅ | ✅ | ✅ |
| **Custom Scoring Rules** | ❌ | ✅ | ✅ | ✅ |
| **Custom Scoring Webhook** | ❌ | ❌ | ❌ | ✅ |
| **Proctoring Thresholds** | Default | Custom | Custom | Custom |
| **SSO/SAML** | ❌ | ❌ | ✅ | ✅ |
| **SCIM** | ❌ | ❌ | ❌ | ✅ |
| **Custom Data Residency** | ❌ | ❌ | ❌ | ✅ |
| **Customer-Managed Keys** | ❌ | ❌ | ❌ | ✅ |
| **ATS Connectors** | Greenhouse, Lever | + Ashby, Teamtailor | + Workday, Custom | All + Custom |
| **HRIS Connectors** | ❌ | BambooHR, Rippling | + Workday, Deel | All + Custom |
| **Webhooks** | ❌ | 5 events | 14 events | 14 + Custom |
| **API Access** | Read-only | Read/Write | Full | Full |
| **Scheduled Exports** | ❌ | CSV/JSON | + Parquet, Sheets | All + Custom |
| **Dedicated CSM** | ❌ | ❌ | ✅ | ✅ |
| **SLA** | 99.5% | 99.5% | 99.9% | Custom |

---

## 📋 HOW TO USE THIS DOCUMENT FOR PRESENTATION

### Slide Structure for "Product Deep-Dive" Deck

| Slide | Title | Source Section |
|-------|-------|----------------|
| 1 | Title: HireLoop Product Architecture | — |
| 2 | Portal Information Architecture | Portal Architecture |
| 3 | Customer Personas & Views | Personas & Views |
| 4 | Workflow 1: Job Creation Wizard | Workflow 1 |
| 5 | Workflow 2: Candidate Kanban | Workflow 2 |
| 6 | Workflow 3: AI Interview View | Workflow 3 |
| 7 | Workflow 4: Human Round Orchestration | Workflow 4 |
| 8 | Workflow 5: Qualified Handoff | Workflow 5 |
| 9 | Candidate Portal Experience | Candidate Portal |
| 9 | Customization: Branding & White-Label | Customization 1 |
| 10 | Customization: Pipeline & Forms | Customization 2-3 |
| 11 | Customization: Interview & Proctoring | Customization 4-5 |
| 12 | Customization: Scoring & Human Rounds | Customization 6-7 |
| 13 | Customization: Notifications & RBAC | Customization 8 |
| 14 | Integration Ecosystem | Integration Points |
| 15 | Analytics & Reporting | Analytics |
| 16 | Security & Compliance Controls | Security |
| 17 | Tier Comparison Matrix | Quick Reference |
| 18 | Implementation Timeline | — |
| 19 | Q&A / Next Steps | — |

---

**This document contains all product specification details needed to generate a comprehensive "Product Deep-Dive" presentation for non-technical stakeholders. Use the slide structure above with content from each section.**