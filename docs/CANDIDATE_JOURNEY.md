# Candidate Journey Specification

**Version:** 1.0  
**Status:** Design Specification  
**Scope:** Complete candidate experience from discovery → apply → AI interview → human rounds → offer → hire  
**Based on:** Current codebase in `/apps/web/src/app/candidate/`, `/apps/web/src/app/apply/`, interview components

---

## 1. Journey Overview

```
┌─────────────┐   ┌─────────────┐   ┌──────────────────┐   ┌─────────────────┐   ┌──────────┐   ┌────────┐
│  DISCOVER   │──▶│   APPLY     │──▶│  AI INTERVIEW    │──▶│  HUMAN ROUNDS   │──▶│  OFFER   │──▶│ HIRED  │
│             │   │             │   │                  │   │                 │   │          │   │        │
│ Job board,  │   │ Branded     │   │ Voice + Proctor  │   │ Schedule,       │   │ Draft,   │   │        │
│ referral,   │   │ form,       │   │ TTS/STT,         │   │ Scorecard,      │   │ Approve, │   │        │
│ careers pg  │   │ eligibility,│   │ Scoring,         │   │ Panel,          │   │ Sign,    │   │        │
│ direct link │   │ instant     │   │ Transcript       │   │ Feedback        │   │ Accept   │   │        │
└─────────────┘   └─────────────┘   └──────────────────┘   └─────────────────┘   └──────────┘   └────────┘
     │                │                    │                      │                │
     │                │                    │                      │                │
  Public           Public/              Token-gated            Authenticated     Authenticated
  (no auth)        Candidate            (interview token)      (candidate auth)  (candidate auth)
```

---

## 2. Stage 1: Discover & Apply

### 2.1 Entry Points

| Source | URL Pattern | Tracking |
|--------|-------------|----------|
| Job Board | `/apply/{jobId}?source=linkedin` | `source` param → `candidates.source` |
| Careers Page | `/org/{orgId}/jobs` → `/apply/{jobId}` | Org-branded listing |
| Direct Link | `/apply/{jobId}?ref=employee123` | Referral code |
| Email Campaign | `/apply/{jobId}?utm_campaign=summer2026` | UTM params stored |
| QR Code | Same as direct link | Event/conference tracking |

### 2.2 Public Job Page (`/apply/[jobId]/page.tsx`)
**Current:** `apps/web/src/app/apply/[jobId]/page.tsx` → `ApplyPageClient`

**Components:**
- Hero: Org logo, job title, department, location, type (full-time/internship)
- About: Description, requirements, benefits
- Sidebar: Quick facts (salary range, equity, remote policy, visa sponsorship)
- **Apply CTA** → Opens application form modal or navigates to form page

**Enhancements for PaaS:**
- Department filter on careers page
- "Save Job" for candidates (requires auth)
- Share buttons (LinkedIn, Twitter, Email, Copy Link)
- Schema.org `JobPosting` JSON-LD for SEO

### 2.3 Application Form (`/apply/[jobId]` → Form)

**Current Implementation:** `ApplicationForm` component with dynamic fields from `job.formFields`

| Field Type | Component | Validation | Storage |
|------------|-----------|------------|---------|
| `text` | Input | Required, min/max length | String |
| `email` | Input (type=email) | Required, email format | String |
| `phone` | Input (type=tel) | Optional, phone format | String |
| `number` | Input (type=number) | Required, min/max | Number (for eligibility) |
| `dropdown` | Select | Required, options from config | String |
| `doc` / `file` | File upload (drag-drop) | Required, max 10MB, allowed types | `ApplicationDocument` ref in JSON |

**Eligibility Rules Engine** (`lib/eligibility.ts`):
- Evaluates on submit: `field >= value`, `field <= value`, `field = value`
- Auto-reject if any rule fails → status `auto_rejected`
- Pass → status `interview_sent` + token generated + email sent

**Form Features:**
- Progress indicator (stepper for multi-section forms)
- Auto-save to localStorage (recover on refresh)
- Resume upload → parse for prefill (future)
- Duplicate prevention: one application per candidate per job

### 2.4 Post-Submit Experience

| Outcome | UI | Email | Next Step |
|---------|----|-------|-----------|
| **Auto-rejected** | "Thank you, we'll review" + generic message | Optional rejection email | Candidate portal shows status |
| **Interview sent** | Success screen with interview link + expiry | `interview_invite` template | Candidate clicks link or checks email |
| **Error** | Inline error + retry | — | Fix and resubmit |

---

## 3. Stage 2: AI Interview

### 3.1 Interview Link & Token
**Route:** `/candidate/[token]/page.tsx` → `CandidateInterviewFlow`

**Token Security:**
- 72-hour expiry (configurable per job)
- One-time use (configurable retry policy)
- Reconnect window: 2 hours after disconnect
- Invalid/expired → friendly page with "Request new link" CTA

### 3.2 Interview Flow Steps

```
INTRO → CONSENT → PROCTORING SETUP → MIC CHECK → LIVE INTERVIEW → COMPLETE/FLAGGED
  │         │            │              │              │               │
  ▼         ▼            ▼              ▼              ▼               ▼
Language  Recording   Camera perm,   Audio level   Q1: TTS plays,  Success page
select    consent,    face calib,    test,         candidate       OR
(EN/HI)   proctoring  fullscreen     playback      records,       Flagged page
          policy      enforcement    verify        Next → Q2...    (violation)
```

**Component Map:**
| Step | Component | Key Features |
|------|-----------|--------------|
| Intro | Inline in `candidate-interview-flow.tsx` | Org video (YouTube embed), language toggle |
| Consent | `ConsentScreen` | Checkboxes: recording, proctoring, data processing |
| Proctoring | `ProctoringSetup` | MediaPipe face detection, calibration, fullscreen request |
| Mic Check | `MicCheck` | Real-time audio level visualizer, test recording playback |
| Live | `InterviewStructured` | WebSocket to `/ws/interview`, TTS audio, chunked recording upload |
| Complete | Inline | Thank you, next steps, profile link |
| Flagged | Inline | Violation reason, partial review notice, profile link |

### 3.3 Live Interview Mechanics (`InterviewStructured`)

**Question Delivery:**
- Pre-rendered TTS audio (EN + HI) played via `<audio>` element
- Question text displayed with section badge, time limit
- "Record Answer" button → starts MediaRecorder (WebM/Opus)

**Answer Recording:**
- Chunked upload (5s chunks) to `/interview/answers/chunk` via HTTP (reliable)
- WebSocket `submit_answer` with `chunk_count` for assembly
- Server assembles → STT (Gemini Flash) → transcript stored

**Timer Enforcement (Server-Authoritative):**
- Per-question limit (default 90s, configurable per question)
- Overall limit (default 600s)
- Grace period: 60s after timeout for in-flight upload
- Auto-advance with empty answer if no upload

**Proctoring (Continuous):**
- Client: MediaPipe face detection (30fps) → events: `face_missing`, `multi_face`, `gaze_deviation`, `tab_switch`, `fullscreen_exit`
- Server: Periodic snapshot (10s interval) → Gemini Vision analysis → severity classification
- Auto-flag: 3 critical OR 15 warnings → session flagged, interview ends

**Accessibility:**
- Keyboard navigation for all controls
- Screen reader announcements for question changes, timer warnings
- High contrast mode support
- Captions for TTS audio (future)

### 3.4 Reconnect & Resume
- Token valid for 72h, reconnect window 2h after disconnect
- `/interview/session/state?token=` returns: current question index, transcript, time remaining
- Candidate resumes at exact question, timer continues from server state

### 3.5 Completion & Scoring
- On finish: `session_ended` WebSocket event
- Background: STT completion → LLM scoring (Gemini Flash) → scores saved
- Real-time: `scoring_started` → `scoring_complete` (or `scoring_error`) via WebSocket
- Candidate sees: "Interview complete" page immediately
- Scores visible in candidate portal after processing

---

## 4. Stage 3: Candidate Portal

### 4.1 Authentication
**Routes:** `/candidate/login`, `/candidate/signup`, `/candidate/profile`

**Current:** `CandidateAuthForm`, `OTPAuthForm`, Google OAuth
- Account type: `candidate`
- Links to existing applications via email/profile_id

### 4.2 Profile Page (`/candidate/profile`)
**Current:** `apps/web/src/app/candidate/profile/page.tsx`

**Sections:**
| Section | Content | Actions |
|---------|---------|---------|
| **Profile** | Name, email, phone, resume | Edit, upload new resume |
| **Applications** | Table: Job, Company, Status, Applied Date, Interview Link | View details, retake interview (if allowed) |
| **Interview History** | Completed interviews with scores | View transcript, score breakdown |
| **Settings** | Notifications, data export, delete account | GDPR/DSAR compliance |

**Status Badges:**
```
Applied → Interview Sent → In Progress → Completed → Passed AI → Final Interview → Hired
                  ↓              ↓              ↓
             Expired        Flagged       Rejected
```

### 4.3 Interview Retake Policy
- Configurable per job: `max_attempts` (default 1)
- Cooldown period: `retry_cooldown_hours` (default 24)
- Admin can override: "Regenerate Link" button in candidate detail

---

## 5. Stage 4: Human Interview Rounds

### 5.1 Candidate Experience

| Touchpoint | Channel | Candidate Action |
|------------|---------|------------------|
| **Schedule Invite** | Email + In-app | Click "Schedule Interview" → pick slot |
| **Calendar Invite** | Email (ICS) | Accept → added to calendar |
| **Reminders** | Email (24h, 2h, 15m) | Join meeting |
| **Interview** | Zoom/Meet/Teams/In-person | Attend |
| **Feedback** | In-app (optional) | Rate experience |

### 5.2 Self-Scheduling Flow (Future)
```
Email: "Schedule your final interview" 
  → Link to /candidate/schedule/{scheduleId}
  → Available slots (from interviewer calendars)
  → Select → Confirm → Calendar invites sent to all
  → Reschedule link in confirmation
```

### 5.3 Interview Preparation
- Candidate portal shows: Interviewers (name, role, LinkedIn), format, duration, prep materials
- "Join Meeting" button → opens meeting_url
- Post-interview: "How did it go?" quick survey (optional)

---

## 6. Stage 5: Offer & Onboarding

### 6.1 Offer Experience
**Route:** `/candidate/offer/{offerToken}` (future)

| Step | UI | Action |
|------|----|--------|
| **View Offer** | Offer letter PDF + summary | Review compensation, dates |
| **Accept/Decline** | Buttons: "Accept Offer" / "Decline" | Confirmation modal |
| **E-Signature** | DocuSign/HelloSign embed or canvas | Sign → PDF generated |
| **Accepted** | Celebration screen + next steps | Onboarding portal link |

### 6.2 Offer Details Displayed
- Role, department, reporting manager
- Compensation breakdown: base, bonus, equity, benefits
- Start date, location, work arrangement
- Expiry date (typically 7 days)
- Conditions: background check, references, visa

### 6.3 Post-Accept (HireLoop Boundary)
- Webhook `candidate.hired` → customer ATS/HRIS
- Candidate portal shows: "Welcome! Your onboarding starts on {date}"
- Link to customer's onboarding system (if provided)
- HireLoop role ends — data exported, candidate owns their profile

---

## 7. Communication Timeline (Candidate-Facing)

| Timing | Event | Channel | Template | Trigger |
|--------|-------|---------|----------|---------|
| T+0 | Application received | Email | `application_received` | Application submit |
| T+0 | Interview invite | Email | `interview_invite` | Token generated |
| T+24h | Interview reminder | Email | `interview_reminder_24h` | Cron (token_expires - 24h) |
| T+2h | Interview reminder | Email | `interview_reminder_2h` | Cron (token_expires - 2h) |
| T+0 | Interview started | In-app | — | WebSocket connect |
| T+0 | Interview completed | In-app + Email | `interview_completed` | Session ended |
| T+5m | AI score ready | Email + In-app | `score_available` | Scoring complete |
| T+0 | Interview expired | Email | `interview_expired` | Token expiry |
| T+0 | Stage changed | In-app | `stage_changed` | Admin moves candidate |
| T+0 | Human interview scheduled | Email + Calendar | `interview_scheduled` | Schedule created |
| T+24h/2h/15m | Human interview reminders | Email + Calendar | `interview_reminder_*` | Cron |
| T+0 | Offer sent | Email | `offer_sent` | Offer status → sent |
| T+0 | Offer accepted | Email + In-app | `offer_accepted` | Candidate accepts |
| T+0 | Offer declined | Email | `offer_declined` | Candidate declines |

---

## 8. Candidate Data & Privacy

### 8.1 Data Collected
| Category | Fields | Retention | Legal Basis |
|----------|--------|-----------|-------------|
| **Identity** | Name, email, phone | 3 years post-application | Contract |
| **Application** | Form responses, resume, documents | 3 years | Legitimate interest |
| **Interview** | Audio, video, transcript, proctoring logs | 1 year post-interview | Contract |
| **Scores** | AI scores, human scorecards | 3 years | Legitimate interest |
| **Communications** | Emails, messages, delivery logs | 3 years | Contract |
| **Analytics** | Device, browser, IP, timestamps | 1 year | Legitimate interest |

### 8.2 Candidate Rights (GDPR/DSAR)
- **Access:** `/candidate/profile` → "Export My Data" → ZIP (JSON + PDF + media)
- **Rectification:** Edit profile, request application corrections
- **Erasure:** "Delete Account" → anonymizes (keeps aggregated analytics)
- **Portability:** Export in standard format (JSON)
- **Objection:** Opt-out of marketing, proctoring (may limit interview eligibility)

### 8.3 Data Minimization
- Proctoring snapshots auto-deleted after 30 days unless flagged
- Audio answers deleted after transcript + score verified (configurable)
- Full video never stored — only snapshots + analysis results

---

## 9. Multi-Language Support

| Language | Code | TTS Voice | STT Model | UI Translation |
|----------|------|-----------|-----------|----------------|
| English | `en` | Kore (Gemini) | Gemini Flash | ✅ Complete |
| Hindi | `hi` | Kore (Gemini) | Gemini Flash | 🟡 Partial |
| Spanish | `es` | — | — | ⬜ Planned |
| Bengali | `bn` | — | — | ⬜ Planned |

**Implementation:**
- Candidate selects language at interview start
- `language` stored in `interview_sessions.language`
- All TTS, STT, scoring use selected language
- UI: `next-themes` + `i18n` (future) for portal translation

---

## 10. Error States & Recovery

| Scenario | Candidate Experience | Recovery |
|----------|---------------------|----------|
| **Network disconnect** | "Reconnecting..." toast, auto-reconnect | Resume at same question (2h window) |
| **Camera denied** | Inline error + "Retry Camera" button | Re-request permission |
| **Mic denied** | Inline error at Mic Check step | Re-request permission |
| **Audio upload fails** | "Upload failed, retrying..." (auto-retry 3x) | Chunked HTTP upload resilient |
| **STT fails** | Placeholder "(transcription unavailable)" | Scoring uses available text |
| **Scoring fails** | "We're reviewing your interview manually" | Admin notified, manual review |
| **Token expired** | "Link expired. Request new link." | Admin regenerates from dashboard |
| **Proctoring flag** | Interview ends immediately, "Violation detected" page | Admin reviews, may allow retake |

---

## 11. Accessibility Checklist

- [ ] **WCAG 2.1 AA** compliance for all candidate-facing pages
- [ ] **Keyboard navigation** for entire interview flow
- [ ] **Screen reader** announcements: question change, timer (10s warning), recording state
- [ ] **Color contrast** 4.5:1 minimum, focus indicators visible
- [ ] **Captions** for TTS audio (WebVTT from pre-rendered)
- [ ] **Reduced motion** respected (disable Framer Motion)
- [ ] **Text resize** up to 200% without horizontal scroll
- [ ] **Language declaration** `lang="en"` / `lang="hi"` on interview page
- [ ] **Alternative text** for all images (org logo, video thumbnails)
- [ ] **Error identification** inline with `aria-describedby` linking to error message

---

## 12. Analytics Events (Candidate-Side)

| Event | Properties | Purpose |
|-------|------------|---------|
| `apply_page_viewed` | job_id, source, referrer | Funnel top |
| `apply_form_started` | job_id | Form engagement |
| `apply_form_completed` | job_id, eligibility_passed | Conversion |
| `interview_link_clicked` | token, channel (email/direct) | Link engagement |
| `interview_started` | token, language, device | Interview funnel |
| `consent_accepted` | token | Compliance |
| `proctoring_setup_completed` | token, camera_granted | Technical success |
| `mic_check_completed` | token, audio_level | Technical success |
| `question_answered` | token, question_id, duration_seconds | Engagement |
| `question_timed_out` | token, question_id | Difficulty signal |
| `proctoring_event` | token, event_type, severity | Integrity monitoring |
| `interview_completed` | token, status (completed/flagged/abandoned) | Completion rate |
| `score_viewed` | application_id, score | Transparency |
| `portal_login` | candidate_id, method | Retention |
| `offer_viewed` | offer_id | Offer funnel |
| `offer_accepted` | offer_id, time_to_accept | Hire velocity |

---

## 13. Future Enhancements

| Feature | Value | Effort |
|---------|-------|--------|
| **AI Interview Coach** | Practice questions with feedback | M |
| **Video Introduction** | Candidate records 60s intro | S |
| **Skill Assessments** | Integrated coding/personality tests | L |
| **Referral Portal** | Candidate refers peers, tracks rewards | M |
| **Interview Prep Hub** | Company info, role guide, common questions | S |
| **Accessibility Mode** | Audio-only, text-only, extended time | M |
| **Offline Interview** | Download questions, upload answers later | L |

---

*This journey maps to the INTERVIEW_LIFECYCLE_DECISION.md boundary (HireLoop owns through Offer Accepted). Candidate portal remains accessible post-hire for data portability.*