# HireLoop V1 Implementation Plan

**Version:** 1.0  
**Status:** Ready for execution  
**Based on:** All scope documents + decisions resolved 2026-07-18  
**Scope:** Convert MVP → Production PaaS V1 with multi-tenant, qualified candidate boundary

---

## 1. Executive Summary

### 1.1 Current State (MVP)
- ✅ Single-org AI interview platform (voice + proctoring + Gemini scoring)
- ✅ Admin portal: job creation, pipeline kanban, candidate detail (7 tabs)
- ✅ Candidate flow: apply → interview → score → portal
- ✅ Database: 15+ tables with RLS, but multi-org UI not implemented
- ⚠️ Proctoring auto-flags and ends interview (needs change)
- ⚠️ No org switcher, no department UI, no RBAC enforcement in frontend
- ⚠️ No webhooks, no scheduled exports, no ATS connectors
- ⚠️ Pending Supabase migrations (proctoring RPCs, RLS fixes)

### 1.2 Target State (V1)
- **Multi-tenant PaaS** with org switcher, department-scoped views, full RBAC
- **Proctoring v2**: Never ends interview, cheating probability score (0-100%), dashboard flagging
- **Hybrid Scoring**: Default Gemini + per-job custom rules/parameters augmenting prompt
- **Qualified Candidate Boundary**: System ends at `candidate.qualified` webhook after human scorecards
- **Integration Layer**: Webhooks (14 events), REST API, scheduled exports, Greenhouse/Lever connectors
- **Human Round Orchestration**: Calendar sync, self-scheduling, reminders, panel interviews

---

## 2. Architecture Changes Overview

### 2.1 Database Changes

```sql
-- 1. Deploy pending migrations (CRITICAL - do first)
-- supabase/migrations/20260714193500_proctoring_atomic_rpcs.sql
-- supabase/migrations/20260714193600_add_applications_status_check.sql
-- supabase/migrations/20260714193700_secure_ai_usage_logs_rls.sql
-- supabase/migrations/20260715120000_secure_proctoring_rpcs.sql

-- 2. New columns for proctoring v2
ALTER TABLE interview_sessions ADD COLUMN IF NOT EXISTS cheating_probability INTEGER; -- 0-100
ALTER TABLE interview_sessions ADD COLUMN IF NOT EXISTS proctoring_ended_interview BOOLEAN DEFAULT FALSE;

-- 3. Custom scoring rules per job
ALTER TABLE job_roles ADD COLUMN IF NOT EXISTS custom_scoring_rules JSONB DEFAULT '{}';
-- Structure: { "weights": {"technical": 1.2, "hr": 0.8}, "keywords": {"required": ["GAAP"], "bonus": ["SOX"]}, "rubric_overrides": {...} }

-- 4. Webhook events table
CREATE TABLE webhook_events (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, delivered, failed, dead_letter
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  response_code INTEGER,
  response_body TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Webhook subscriptions
CREATE TABLE webhook_subscriptions (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT[] NOT NULL,
  version TEXT DEFAULT '2026-07-18',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Scheduled exports
CREATE TABLE export_jobs (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- applications, candidates, scores, pipeline, compliance
  schedule JSONB, -- {frequency, timezone, hour, day_of_week}
  format TEXT, -- csv, json, parquet
  destination JSONB, -- {type, bucket, prefix, credentials_ref}
  filters JSONB,
  field_mapping JSONB,
  active BOOLEAN DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  last_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Calendar sync tokens
CREATE TABLE calendar_connections (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- google, outlook
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  expires_at TIMESTAMPTZ,
  calendars JSONB, -- selected calendar IDs
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Interview schedule slots (for self-scheduling)
CREATE TABLE interview_slots (
  id TEXT PRIMARY KEY,
  schedule_id TEXT REFERENCES interview_schedules(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  interviewer_ids UUID[] NOT NULL,
  max_candidates INTEGER DEFAULT 1,
  booked_by UUID REFERENCES profiles(id),
  booked_at TIMESTAMPTZ,
  status TEXT DEFAULT 'available', -- available, booked, blocked
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 RLS Policy Updates

```sql
-- Ensure all new tables have org-scoped RLS
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_webhook_events" ON webhook_events FOR ALL TO AUTHENTICATED
  USING (is_org_member(org_id)) WITH CHECK (is_org_member(org_id, ARRAY['owner','admin']));

ALTER TABLE webhook_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_webhook_subs" ON webhook_subscriptions FOR ALL TO AUTHENTICATED
  USING (is_org_member(org_id, ARRAY['owner','admin'])) WITH CHECK (is_org_member(org_id, ARRAY['owner','admin']));

ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_export_jobs" ON export_jobs FOR ALL TO AUTHENTICATED
  USING (is_org_member(org_id)) WITH CHECK (is_org_member(org_id, ARRAY['owner','admin']));

ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_calendars" ON calendar_connections FOR ALL TO AUTHENTICATED
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE interview_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_interview_slots" ON interview_slots FOR SELECT TO AUTHENTICATED
  USING (EXISTS (SELECT 1 FROM interview_schedules s JOIN applications a ON a.id = s.application_id JOIN job_roles j ON j.id = a.job_role_id WHERE s.id = interview_slots.schedule_id AND is_org_member(j.org_id)));
CREATE POLICY "org_manage_slots" ON interview_slots FOR ALL TO AUTHENTICATED
  USING (EXISTS (SELECT 1 FROM interview_schedules s JOIN applications a ON a.id = s.application_id JOIN job_roles j ON j.id = a.job_role_id WHERE s.id = interview_slots.schedule_id AND is_org_member(j.org_id, ARRAY['owner','admin','recruiter','coordinator']))) WITH CHECK (...);
```

---

## 3. Backend Implementation Plan

### 3.1 Proctoring v2 (Cheating Probability Score)

**Files to modify:**
- `apps/api/interview/proctoring.py` — New `calculate_cheating_probability()` function
- `apps/api/interview/structured_relay.py` — Remove auto-flag logic, add probability calculation
- `apps/api/interview/session.py` — Add `cheating_probability` field

```python
# proctoring.py - New function
def calculate_cheating_probability(events: list[ProctoringEvent], snapshots: list[SnapshotAnalysis]) -> int:
    """
    Returns 0-100 probability score based on:
    - Critical events: +25 per critical event (multi-face, phone detected, unauthorized person)
    - +10 per warning event (gaze deviation, tab switch, face missing)
    - +15 per AI snapshot critical finding
    - +5 per AI snapshot warning
    - Decay: older events weighted less
    - Cap at 100
    """
    score = 0
    now = datetime.now(timezone.utc)
    for e in events:
        age_hours = (now - e.timestamp).total_seconds() / 3600
        weight = max(0.3, 1 - age_hours / 24)  # Decay over 24h
        if e.severity == "critical":
            score += 25 * weight
        elif e.severity == "warning":
            score += 10 * weight
    for s in snapshots:
        age_hours = (now - s.timestamp).total_seconds() / 3600
        weight = max(0.3, 1 - age_hours / 24)
        if s.severity == "critical":
            score += 15 * weight
        elif s.severity == "warning":
            score += 5 * weight
    return min(100, int(score))

# structured_relay.py - Changes in _handle_proctoring_event and _handle_proctoring_snapshot
# REMOVE: auto-flag logic (lines 233-235, 299-300)
# ADD: cheating_probability calculation on each event/snapshot
# UPDATE: proctoring_alert payload to include cheating_probability
# NEVER call _flag_proctoring_session from proctoring events
```

**Frontend changes:**
- `apps/web/src/components/candidates/proctoring-log-view.tsx` — Add probability badge, color coding
- `apps/web/src/components/candidates/proctoring-snapshot-gallery.tsx` — Flag indicator
- `apps/web/src/components/dashboard/admin-dashboard.tsx` — Action item for high-probability candidates

### 3.2 Hybrid Scoring System

**Files to modify:**
- `apps/api/interview/scoring.py` — Modify `_build_prompt()` to accept custom rules
- `apps/api/interview/supabase_store.py` — Load custom_scoring_rules when fetching questions
- `apps/web/src/components/jobs/job-questions-editor.tsx` — Add "Custom Scoring Rules" section

```python
# scoring.py - Updated _build_prompt signature
def _build_prompt(questions: list[Question], entries: list[TranscriptEntry], custom_rules: dict = None) -> str:
    base_prompt = ...  # existing prompt
    
    if custom_rules:
        custom_section = "\n\nCUSTOM SCORING RULES (APPLY THESE IN ADDITION TO BASE RUBRIC):\n"
        if custom_rules.get("weights"):
            custom_section += f"Section Weights: {json.dumps(custom_rules['weights'])}\n"
        if custom_rules.get("keywords"):
            kw = custom_rules["keywords"]
            if kw.get("required"):
                custom_section += f"REQUIRED KEYWORDS (candidate MUST mention): {', '.join(kw['required'])}\n"
            if kw.get("bonus"):
                custom_section += f"BONUS KEYWORDS (adds points): {', '.join(kw['bonus'])}\n"
            if kw.get("penalty"):
                custom_section += f"PENALTY KEYWORDS (deducts points): {', '.join(kw['penalty'])}\n"
        if custom_rules.get("rubric_overrides"):
            custom_section += f"RUBRIC OVERRIDES: {json.dumps(custom_rules['rubric_overrides'])}\n"
        custom_section += "Apply these rules when calculating scores. Note deviations in rationale."
        base_prompt += custom_section
    
    return base_prompt

# score_interview function - add custom_rules parameter
def score_interview(questions, entries, passing_score, custom_rules=None):
    prompt = _build_prompt(questions, entries, custom_rules)
    # ... rest unchanged
```

**Database storage:**
```json
// job_roles.custom_scoring_rules example
{
  "weights": {"technical": 1.3, "hr": 0.7, "situational": 1.0},
  "keywords": {
    "required": ["GAAP", "reconciliation", "audit"],
    "bonus": ["SOX", "Big 4", "CPA"],
    "penalty": ["unfamiliar", "don't know", "never heard"]
  },
  "rubric_overrides": {
    "technical": "Score 8+ only if candidate demonstrates end-to-end process knowledge",
    "hr": "Penalize generic answers without specific examples"
  }
}
```

**Admin UI (Job Questions Editor):**
- New collapsible section: "Custom Scoring Rules"
- Section weights: numeric inputs per section (sum validated to ~3.0)
- Keywords: tag inputs for required/bonus/penalty
- Rubric overrides: textareas per section
- Preview: "Test with sample transcript" button

### 3.3 Webhook Framework

**New files:**
- `apps/api/webhooks/` — New module
  - `models.py` — Pydantic models for events
  - `dispatcher.py` — HMAC signing, retry logic, DLQ
  - `routes.py` — FastAPI routes for subscription management
  - `events.py` — Event definitions + payload builders

```python
# webhooks/events.py
WEBHOOK_EVENTS = {
    "application.created": {"payload_builder": build_application_payload},
    "interview.completed": {"payload_builder": build_interview_payload},
    "score.available": {"payload_builder": build_score_payload},
    "stage.changed": {"payload_builder": build_stage_payload},
    "candidate.qualified": {"payload_builder": build_qualified_payload},  # NEW - boundary event
    "candidate.hired": {"payload_builder": build_hired_payload},
    # ... 8 more
}

# webhooks/dispatcher.py
async def dispatch_event(org_id: str, event_type: str, payload: dict):
    subs = await get_active_subscriptions(org_id, event_type)
    for sub in subs:
        signed_payload = sign_payload(payload, sub.secret)
        await queue_delivery(sub.url, signed_payload, sub.id, event_type)

# Retry: 1m, 5m, 15m, 1h, 6h, 24h (max 72h)
# DLQ after 6 failures: store in webhook_events with status='dead_letter'
```

**Frontend:**
- `apps/web/src/app/admin/(dashboard)/settings/integrations/page.tsx` — Webhook manager UI
- List subscriptions, test delivery, view delivery logs, replay failures

### 3.4 REST API v1

**New files:**
- `apps/api/routes/v1/` — Versioned routes
  - `jobs.py`, `applications.py`, `candidates.py`, `scores.py`, `stages.py`, `offers.py`, `exports.py`, `webhooks.py`

```python
# routes/v1/applications.py
router = APIRouter(prefix="/v1/applications", tags=["applications"])

@router.get("")
async def list_applications(
    job_id: str | None = None,
    status: str | None = None,
    stage_id: str | None = None,
    limit: int = 50,
    cursor: str | None = None,
    org_id: str = Depends(get_org_id)  # From API key
):
    # Org-scoped query with filters
    ...

@router.get("/{id}")
async def get_application(id: str, org_id: str = Depends(get_org_id)):
    # Full detail with scores, stages, documents
    ...

@router.post("/{id}/transition")
async def transition_stage(id: str, body: StageTransitionRequest, org_id: str = Depends(get_org_id)):
    # Validates transition, fires stage.changed webhook
    ...
```

**Authentication:**
- API Key header: `Authorization: Bearer sk_live_...` or `sk_test_...`
- Scopes validated per endpoint
- Rate limiting per tier (starter: 60/min, growth: 300/min, scale: 1000/min)

### 3.5 Calendar Sync & Self-Scheduling

**New files:**
- `apps/api/calendar/` — Google/Outlook OAuth + sync
  - `google.py`, `outlook.py`, `sync.py`, `slots.py`

```python
# calendar/sync.py
async def sync_interviewer_availability(org_id: str, user_id: str):
    # Fetch free/busy from connected calendars
    # Generate interview_slots for next 30 days
    # Respect working hours, existing events, buffer time

# calendar/slots.py
async def generate_slots_for_schedule(schedule_id: str, interviewer_ids: list[str]):
    # Find common availability across all interviewers
    # Create interview_slots records
    # Return available slots for candidate self-scheduling
```

**Frontend:**
- `apps/web/src/app/admin/(dashboard)/scheduling/page.tsx` — Full scheduler UI
- `apps/web/src/app/candidate/schedule/[scheduleId]/page.tsx` — Candidate self-scheduling
- Interviewer calendar connection flow in settings

### 3.6 Scheduled Exports

**New files:**
- `apps/api/exports/` — Export job runner
  - `runner.py`, `formatters.py`, `destinations.py`

```python
# exports/runner.py
async def run_export_job(job_id: str):
    job = await get_export_job(job_id)
    data = await fetch_export_data(job.type, job.filters)
    formatted = format_data(data, job.format, job.field_mapping)
    await deliver_to_destination(formatted, job.destination)
    await update_job_status(job_id, "completed", download_url=...)
```

---

## 4. Frontend Implementation Plan

### 4.1 Multi-Tenant UI Foundation

**New components:**
- `apps/web/src/components/layout/org-switcher.tsx` — Header dropdown
- `apps/web/src/hooks/use-org-context.ts` — Current org state + switcher
- `apps/web/src/components/layout/department-filter.tsx` — Filter bar for all list views

```typescript
// use-org-context.ts
export function useOrgContext() {
  const [orgId, setOrgId] = useState<string>(() => 
    localStorage.getItem("selected_org_id") || ""
  );
  const [orgs, setOrgs] = useState<Organization[]>([]);
  
  useEffect(() => {
    // Fetch user's organizations from organization_members
    fetch("/api/user/orgs").then(setOrgs);
  }, []);
  
  const switchOrg = (newOrgId: string) => {
    setOrgId(newOrgId);
    localStorage.setItem("selected_org_id", newOrgId);
    router.refresh(); // Reload server components with new org
  };
  
  return { orgId, orgs, switchOrg };
}
```

**Server Action updates:**
- All `hireloop.ts` actions: use `getAdminOrgIdAction()` → scope queries to selected org
- `fetchHireLoopState(orgId)` already supports `scopeOrgId` parameter

### 4.2 Department Management UI

**New files:**
- `apps/web/src/app/admin/(dashboard)/departments/page.tsx`
- `apps/web/src/components/admin/department-manager.tsx`
- `apps/web/src/components/admin/department-selector.tsx`

```typescript
// department-manager.tsx
// CRUD: Create, Edit (name, color, lead), Delete
// Assign lead: dropdown of org members with hiring_manager role
// Visual: color-coded badges used throughout app
```

**Integration points:**
- Job creation wizard: Department dropdown (required)
- Pipeline kanban: Swimlanes by department
- Candidate detail: Primary department tag + secondary tags
- Reports: Department breakdown filter

### 4.3 RBAC Enforcement in UI

**Current:** `useOrgPermissions` hook exists but not used consistently

**Updates needed:**
| Component | Permission Check | Action |
|-----------|------------------|--------|
| Job creation | `canManageJobs` | Hide "Create Job" button |
| Candidate actions | `canManagePipeline` | Hide move/scorecard/hire buttons |
| Settings tabs | Role-based | Hide Billing (owner only), Integrations (admin+) |
| Reports export | `canExport` | Disable export buttons |
| Webhook management | `canManageIntegrations` | Hide webhook settings |

**Implementation:**
```typescript
// permissions.ts - Extend with granular checks
export const PERMISSIONS = {
  jobs: { create: ['owner','admin','recruiter'], delete: ['owner','admin'] },
  pipeline: { move: ['owner','admin','recruiter','coordinator'], export: ['owner','admin','recruiter'] },
  candidates: { message: ['owner','admin','recruiter'], bulk: ['owner','admin','recruiter'] },
  settings: { billing: ['owner'], integrations: ['owner','admin'], compliance: ['owner','admin'] },
  webhooks: { manage: ['owner','admin'] },
  exports: { create: ['owner','admin'], view: ['owner','admin','recruiter'] },
};
```

### 4.4 Proctoring Dashboard Updates

**Files to modify:**
- `apps/web/src/components/candidates/proctoring-log-view.tsx`
- `apps/web/src/components/dashboard/admin-dashboard.tsx` — Action items

**Changes:**
```typescript
// ProctoringLogView - Add probability display
const probability = session.cheatingProbability ?? 0;
const color = probability >= 70 ? "destructive" : probability >= 40 ? "warning" : "default";
<Badge variant={color}>Cheating Probability: {probability}%</Badge>

// Admin Dashboard - New action item type
if (session.cheatingProbability >= 70) {
  actionItems.push({
    id: `proctoring-${session.id}`,
    title: "High cheating probability",
    description: `${candidate.name} — ${probability}%`,
    href: `/admin/candidates/${candidate.id}?tab=proctoring`,
    priority: "high"
  });
}
```

### 4.5 Custom Scoring Rules UI

**New section in Job Questions Editor:**
```typescript
// job-questions-editor.tsx - New collapsible section after question count
<SectionCard title="Custom Scoring Rules (Optional)">
  <SectionWeightsEditor />
  <KeywordsEditor />
  <RubricOverridesEditor />
  <TestScoringButton /> // Opens modal with sample transcript preview
</SectionCard>
```

### 4.6 Qualified Candidate List & Boundary

**New page:** `apps/web/src/app/admin/(dashboard)/qualified/page.tsx`

```typescript
// Shows all candidates in 'partner_review' or 'hired' stages
// Columns: Name, Job, AI Score, Human Scorecard Avg, Final Status
// Actions: View Scorecards, Export to CSV, Send to ATS (webhook trigger)
```

**Boundary Webhook Trigger:**
```typescript
// In transitionApplicationStageAction when status → 'hired' or 'partner_review'
// After scorecard submitted for final interview
if (newStatus === 'partner_review' || newStatus === 'hired') {
  await dispatchWebhook(orgId, 'candidate.qualified', {
    application_id: application.id,
    candidate_id: candidate.id,
    job_id: job.id,
    ai_score: session.overallScore?.totalScore,
    human_scorecards: scorecards.map(s => ({
      reviewer: s.reviewer_name,
      recommendation: s.recommendation,
      score: s.overall_score,
      competencies: s.competencies
    })),
    proctoring_flagged: session.proctoringSummary?.flagged,
    cheating_probability: session.cheatingProbability,
    qualified_at: new Date().toISOString()
  });
}
```

### 4.7 Integration Settings Page

**New page:** `apps/web/src/app/admin/(dashboard)/settings/integrations/page.tsx`

```typescript
// Tabs: Webhooks | API Keys | ATS Connectors | Scheduled Exports

// Webhooks Tab:
// - List subscriptions with status
// - "Create Webhook" modal: URL, events[], secret (auto-generated)
// - Test delivery button
// - Delivery logs with retry/replay

// API Keys Tab:
// - Create key: name, scopes[], expiry
// - View key once, then hashed
// - Revoke/rotate

// ATS Connectors Tab:
// - Greenhouse: API key, field mapping UI, test sync
// - Lever: API key, field mapping
// - Webhook URL for inbound (Greenhouse → HireLoop)

// Scheduled Exports Tab:
// - Create export: type, schedule, format, destination (S3/SFTP/Email)
// - Field mapping UI (HireLoop field → CSV column)
// - Run history with download links
```

---

## 5. Data Flow: End-to-End V1

### 5.1 Complete Candidate Journey (V1)

```
┌─────────────┐
│  ORG SETUP  │ ← Multi-tenant onboarding, departments, pipeline template
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  JOB CREATE │ ← Department, requisition, custom scoring rules, proctoring config
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌──────────────────┐
│   APPLY     │────▶│  ELIGIBILITY     │ ← Auto-reject or proceed
│  (Public)   │     │  (Rules Engine)  │
└─────────────┘     └────────┬─────────┘
                             │ PASS
                             ▼
                    ┌─────────────────┐
                    │  AI INTERVIEW   │ ← TTS/STT, Proctoring v2 (probability only)
                    │  (Token-gated)  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  HYBRID SCORING │ ← Gemini + Custom Rules
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
       ┌─────────────┐               ┌─────────────┐
       │ PASS        │               │ FAIL        │
       │ (threshold) │               │ (threshold) │
       └──────┬──────┘               └──────┬──────┘
              │                             │
              ▼                             ▼
       ┌─────────────┐               ┌─────────────┐
       │ HUMAN ROUND │               │  REJECTED   │
       │ SCHEDULING  │               │  (auto)     │
       │ (Cal sync,  │
       │  Self-sched)│
       └──────┬──────┘
              │
              ▼
       ┌─────────────────┐
       │ SCORECARDS      │ ← Structured, competencies, recommendation
       │ (Panel support) │
       └────────┬────────┘
              │
              ▼
       ┌─────────────────┐
       │ QUALIFIED LIST  │ ← System boundary ends here
       │ (candidate.     │
       │  qualified)     │
       └────────┬────────┘
              │
              ▼
       ┌─────────────────┐
       │ WEBHOOK         │ → Customer ATS/HRIS
       │ candidate.      │
       │  qualified      │
       └─────────────────┘
```

### 5.2 Webhook Event Flow

```
Application Created
    │
    ▼
Interview Link Sent
    │
    ▼
Interview Started
    │
    ▼
Interview Completed
    │
    ▼
Score Available ──▶ If PASS: Stage → interview_sent
    │
    ▼
Stage Changed (→ human_interview)
    │
    ▼
Interview Scheduled (Calendar sync, slots created)
    │
    ▼
Scorecards Submitted (All interviewers)
    │
    ▼
Stage Changed (→ partner_review) ──▶ WEBHOOK: candidate.qualified
    │
    ▼
[Customer: Offer, Background Check, E-Sign, HRIS]
    │
    ▼
Stage Changed (→ hired) ──▶ WEBHOOK: candidate.hired
```

---

## 6. Security & Compliance Implementation

### 6.1 Rate Limiting (Backend)

```python
# apps/api/main.py - Add to FastAPI app
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Apply to public endpoints
@app.post("/interview/answers/chunk", rate_limit="100/minute")
@app.post("/admin/questions/render-audio", rate_limit="10/minute")  # Internal only
@app.websocket("/ws/interview")  # Connection limit per IP
```

### 6.2 WebSocket Auth Fix

```python
# apps/api/main.py - interview_websocket endpoint
@app.websocket("/ws/interview")
async def interview_websocket(websocket: WebSocket, token: str | None = Query(None), lang: str = "en"):
    # VALIDATE TOKEN BEFORE ACCEPT
    if not token:
        await websocket.close(code=4001, reason="Token required")
        return
    
    store = get_store()
    if not store:
        await websocket.close(code=5003, reason="Service unavailable")
        return
    
    try:
        ctx = await store.load_application_for_interview(token)
        # Check expiry, reconnect window, status
    except ValueError as e:
        await websocket.close(code=4002, reason=str(e))
        return
    
    await websocket.accept()
    # ... rest of relay
```

### 6.3 CORS Configuration

```python
# apps/api/main.py
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "https://app.hireloop.com,https://staging.hireloop.com").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
```

---

## 7. Testing & Quality Gates

### 7.1 Test Coverage Requirements

| Layer | Target | Tools |
|-------|--------|-------|
| Backend Unit | 80% | pytest + pytest-asyncio |
| Backend Integration | Key flows | pytest + testcontainers (Postgres) |
| Frontend Unit | 70% | Vitest + React Testing Library |
| E2E | Critical paths | Playwright (apply → interview → score → qualified) |
| Load Test | 50 concurrent interviews | k6 / Locust |

### 7.2 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
jobs:
  backend:
    - Lint (ruff)
    - Type check (mypy)
    - Unit tests
    - Integration tests (test DB)
    - Build Docker
  
  frontend:
    - Lint (eslint)
    - Type check (tsc)
    - Unit tests
    - Build (next build)
    - Playwright E2E (staging)
  
  deploy:
    - Run migrations (Supabase CLI)
    - Deploy backend (Railway/Render)
    - Deploy frontend (Vercel)
    - Smoke tests
```

---

## 8. Rollout Plan

### Phase 1: Foundation (Weeks 1-3)
| Week | Deliverable |
|------|-------------|
| 1 | Deploy pending Supabase migrations, fix WebSocket auth, CORS, rate limiting |
| 2 | Multi-tenant UI: org switcher, department manager, RBAC enforcement |
| 3 | Proctoring v2 (cheating probability), remove auto-flag, dashboard updates |

### Phase 2: Core PaaS Features (Weeks 4-7)
| Week | Deliverable |
|------|-------------|
| 4 | Hybrid scoring (custom rules UI + backend), custom_scoring_rules column |
| 5 | Webhook framework (dispatcher, HMAC, retry, DLQ), 14 events, subscriptions API |
| 6 | REST API v1 (jobs, applications, candidates, scores, stages, webhooks) |
| 7 | Scheduled exports (runner, formatters, S3/SFTP/Email destinations) |

### Phase 3: Human Round Orchestration (Weeks 8-11)
| Week | Deliverable |
|------|-------------|
| 8 | Calendar sync (Google/Outlook OAuth), availability fetching |
| 9 | Interview slots + candidate self-scheduling page |
| 10 | Automated reminders (24h/2h/15m), panel interview support |
| 11 | Qualified candidate list page, `candidate.qualified` webhook trigger |

### Phase 4: Integrations & Polish (Weeks 12-15)
| Week | Deliverable |
|------|-------------|
| 12 | Greenhouse connector (bidirectional), field mapping UI |
| 13 | Lever connector, API key management |
| 14 | Integration settings page, delivery logs, replay |
| 15 | Load testing, security review, documentation, beta launch |

---

## 9. Rollback & Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Proctoring probability false positives | Configurable thresholds, human review required, appeal flow |
| Custom scoring rules break LLM output | Strict JSON validation, fallback to base scoring, admin preview |
| Webhook delivery failures | DLQ with replay, customer-facing delivery dashboard |
| Multi-org data leak | Comprehensive RLS test suite, automated regression tests |
| Calendar sync token expiry | Automatic refresh, admin notification on failure |
| Migration failures | Staging deploy first, point-in-time recovery, rollback script |

---

## 10. File Reference Index for Implementation

```
# Backend Core Changes
apps/api/interview/proctoring.py           # Cheating probability calculation
apps/api/interview/structured_relay.py     # Remove auto-flag, add probability
apps/api/interview/scoring.py              # Hybrid scoring with custom_rules
apps/api/interview/supabase_store.py       # Load custom_scoring_rules
apps/api/webhooks/                         # NEW: dispatcher, events, routes
apps/api/routes/v1/                        # NEW: REST API v1
apps/api/calendar/                         # NEW: Google/Outlook sync, slots
apps/api/exports/                          # NEW: Export job runner
apps/api/main.py                           # Rate limiting, CORS, WS auth fix

# Database
supabase/migrations/*.sql                  # Pending + new tables

# Frontend Core
apps/web/src/components/layout/org-switcher.tsx
apps/web/src/hooks/use-org-context.ts
apps/web/src/components/admin/department-manager.tsx
apps/web/src/components/jobs/job-questions-editor.tsx  # Custom scoring section
apps/web/src/components/candidates/proctoring-log-view.tsx  # Probability display
apps/web/src/app/admin/(dashboard)/qualified/page.tsx
apps/web/src/app/admin/(dashboard)/settings/integrations/page.tsx
apps/web/src/app/candidate/schedule/[scheduleId]/page.tsx
apps/web/src/app/admin/(dashboard)/scheduling/page.tsx
apps/web/src/components/layout/department-filter.tsx

# Shared
apps/web/src/lib/types.ts                  # New types for webhooks, exports, calendar
apps/web/src/lib/supabase/queries.ts       # Org-scoped queries with department filter
```

---

## 11. Definition of Done for V1 Launch

- [ ] All pending Supabase migrations deployed & verified
- [ ] Multi-org onboarding works end-to-end (3+ test orgs)
- [ ] Proctoring v2: probability scoring, no auto-end, dashboard flags
- [ ] Hybrid scoring: custom rules per job, validated with test transcripts
- [ ] Webhooks: 14 events, HMAC, retry/DLQ, delivery dashboard
- [ ] REST API v1: all resources, scoped keys, rate limits
- [ ] Calendar sync: Google + Outlook, self-scheduling, reminders
- [ ] Qualified candidate boundary: `candidate.qualified` webhook fires correctly
- [ ] Greenhouse connector: bidirectional sync tested
- [ ] Scheduled exports: S3/SFTP/Email, field mapping
- [ ] Load test: 50 concurrent interviews, <2% error rate
- [ ] Security review: OWASP Top 10, penetration test passed
- [ ] Documentation: API reference, webhook guide, admin guide, integration guide

---

*This plan is the single source of truth for V1 implementation. Update as decisions evolve.*