# Admin Workflows & UI Design

**Version:** 1.0  
**Status:** Design Specification  
**Scope:** Admin onboarding, job creation, candidate management, messaging, dashboards  
**Based on:** Current codebase in `/apps/web/src/app/admin/(dashboard)/` and components

---

## 1. Admin Onboarding Wizard (First-Time Setup)

### 1.1 Flow Overview
```
Landing → Sign Up → Org Details → Team Invites → Departments → Pipeline Template → Email/Branding → Integrations → Dashboard
```

### 1.2 Step-by-Step Specification

| Step | Route | Components | Key Actions | Validation |
|------|-------|------------|-------------|------------|
| **1. Sign Up** | `/auth/signup` | `AdminAuthForm`, `GoogleSignInButton` | Email/password or Google OAuth → `account_type=org_admin` | Email unique, password 8+ chars |
| **2. Org Details** | `/admin/onboarding/org` | `JobDetailsEditor` (reuse), `Logo` upload | Name, logo, primary color, website, intro video (YouTube URL) | Name required, color hex format |
| **3. Team Invites** | `/admin/onboarding/team` | `InviteTeamMemberForm` (existing) | Add members: email + role (admin/recruiter/hiring_manager/coordinator) | Valid emails, no duplicates |
| **4. Departments** | `/admin/onboarding/departments` | New: `DepartmentManager` | Add departments (Engineering, Sales, etc.), assign leads | At least 1 department |
| **5. Pipeline Template** | `/admin/onboarding/pipeline` | New: `PipelineTemplateSelector` | Select: Graduate (5 stages), Internship (4 stages), Custom | One selected |
| **6. Email & Branding** | `/admin/onboarding/email` | New: `EmailTemplateEditor` | Edit templates: interview_invite, reminder, result, offer | Required merge tags present |
| **7. Integrations** | `/admin/onboarding/integrations` | New: `IntegrationSetup` | Webhook URL, API key, ATS connector (dropdown) | Optional, test button |
| **8. Complete** | `/admin` | `AdminDashboard` | Redirect to dashboard with "Create First Job" CTA | All required steps done |

### 1.3 Onboarding State Persistence
- Store progress in `organizations.onboarding_step` (1-8)
- Allow resume from last completed step
- Skip optional steps (team, integrations) with "Skip for now"

### 1.4 Code References
- `apps/web/src/app/admin/(dashboard)/company/page.tsx` — Org settings (reuse for step 2)
- `apps/web/src/components/admin/invite-team-member-form.tsx` — Step 3
- `apps/web/src/app/actions/enterprise.ts` — Team invite actions
- `apps/web/src/components/jobs/job-details-editor.tsx` — Reusable form patterns

---

## 2. Job Creation Flow (5-Step Wizard)

### 2.1 Current Implementation ✅
**File:** `apps/web/src/components/jobs/job-creation-wizard.tsx`

| Step | Route | Component | Key Features |
|------|-------|-----------|--------------|
| 1. Job Details | `/admin/jobs/new` (step 0) | `Card` + `Input`/`Textarea` | Title, description |
| 2. Application Form | step 1 | `FormFieldsBuilder` | Drag-drop fields, presets (name, email, phone, resume, CGPA, grad year) |
| 3. Interview Questions | step 2 | `JobQuestionsEditor` | Sections (Tech/HR/Situational), mandatory/variable, time limits, score thresholds, total question count |
| 4. Rules & Thresholds | step 3 | Eligibility rules + Passing score + Publish toggle | Numeric rules (>=, <=, =), passing score gate, draft/live |
| 5. Publish | step 4 | `ShareJobLink` + copy button | Apply link, question audio generation toast |

### 2.2 Enhancements Needed for PaaS

| Enhancement | Effort | Description |
|-------------|--------|-------------|
| **Department Selection** | S | Add department dropdown (linked to `job_roles.department_id`) in Step 1 |
| **Requisition Linking** | S | Optional requisition selector (shows approved requisitions for dept) |
| **Pipeline Stage Config** | M | Step 4.5: Select/customize pipeline stages for this job (override org template) |
| **Question Bank Library** | M | "Add from Library" button → modal with org-wide shared questions |
| **Collaborative Editing** | L | Real-time multi-admin editing with presence indicators |
| **Job Templates** | M | "Save as Template" / "Create from Template" |

### 2.3 Job List & Management
**Files:** `apps/web/src/app/admin/(dashboard)/jobs/page.tsx`, `job-detail-view.tsx`

| Feature | Status | Notes |
|---------|--------|-------|
| Job table with status badges | ✅ | `candidates-table.tsx` pattern |
| Filter by department | ⬜ | Add department column + filter dropdown |
| Bulk actions (publish/close/archive) | ⬜ | Checkbox selection + bulk action bar |
| Duplicate job | ⬜ | "Clone" button on job row |
| Archive/restore | ⬜ | Soft delete with `status=archived` |

---

## 3. Candidate Management Workflows

### 3.1 Pipeline Kanban (Primary View)
**File:** `apps/web/src/components/candidates/pipeline-kanban.tsx`

```
Columns: Applied → Shortlisted → Interview Sent → Interviewed → Passed AI → Final Interview → Hired
         Closed/Expired (auto_rejected, interview_expired, rejected_ai, rejected_final)
```

| Feature | Status | Enhancement |
|---------|--------|-------------|
| Drag-drop between columns | ✅ | Uses `application.status` transitions |
| Stale indicator (>3 days) | ✅ | Amber badge on column header |
| Candidate card: name, job, score | ✅ | `HoverLift` + `StatusBadge` |
| Quick actions on card | ⬜ | Add: "Send Message", "Schedule", "View Scorecard" |
| Column WIP limits | ⬜ | Configurable per stage |
| Swimlanes by department | ⬜ | Group cards by candidate's primary department |

### 3.2 Candidate Detail View (Tabbed)
**File:** `apps/web/src/components/candidates/candidate-detail-view.tsx`

| Tab | Component | Key Actions |
|-----|-----------|-------------|
| **Application Data** | Form responses + `ApplicationDocumentLink` | Download docs |
| **Documents** | Uploaded files gallery | Download, preview |
| **Job & Interview** | Questions config, interview link management | Regenerate link, view link |
| **Proctoring** | `ProctoringLogView` + `ProctoringSnapshotGallery` | Review flags, view snapshots |
| **Transcript** | `TranscriptView` | Full Q&A with timestamps |
| **AI Scores** | `ScoreBreakdown` | Per-question + overall, strengths/concerns |
| **Scorecard** | Human review form (recommendation, score, notes) | Submit scorecard |

### 3.3 Candidate Table View (Alternative)
**File:** `apps/web/src/components/candidates/candidates-table.tsx`

| Feature | Status |
|---------|--------|
| Sortable columns | ✅ |
| Filter by status, job, date | ✅ |
| Pagination | ✅ |
| Bulk selection + actions | ⬜ |
| Export visible rows | ⬜ |
| Saved views/filters | ⬜ |

### 3.4 Candidate Actions (From Detail View)

| Action | Trigger | Current Implementation | Missing |
|--------|---------|------------------------|---------|
| **Send to Final Interview** | Status = `passed_ai` | `sendToFinalInterviewAction` → status `partner_review` | Auto-create scheduling workflow |
| **Regenerate Interview Link** | Expired/not started | `regenerateAndSendInterviewLinkAction` | Template selection |
| **Submit Scorecard** | Status = `partner_review` | `submitScorecardAction` | Competency library |
| **Mark Hired** | Status = `partner_review` | `markCandidateHiredAction` | Offer creation flow |
| **Reject Final** | Status = `partner_review` | `rejectCandidateFinalAction` | Rejection reason required |
| **Send Direct Message** | Any status | ⬜ **NEW** | Email + in-app notification |

---

## 4. Messaging & Communication System (NEW)

### 4.1 Design: Unified Communication Hub

```
┌─────────────────────────────────────────────────────────────┐
│  CANDIDATE COMMUNICATION TIMELINE (per candidate)           │
├─────────────────────────────────────────────────────────────┤
│  📧 Interview Invite Sent     → 2026-07-15 10:30 (Auto)     │
│  📧 Interview Reminder        → 2026-07-16 09:00 (Auto)     │
│  💬 Recruiter Note            → 2026-07-16 14:22 (Manual)   │
│  📧 Interview Completed       → 2026-07-16 16:45 (Auto)     │
│  📧 Score Available           → 2026-07-16 17:00 (Auto)     │
│  💬 Hiring Manager Feedback   → 2026-07-17 11:00 (Manual)   │
│  📧 Offer Sent                → 2026-07-18 09:30 (Auto)     │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Data Model Addition

```sql
-- candidate_messages: Unified communication log
CREATE TABLE candidate_messages (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,  -- null = system
  channel TEXT NOT NULL CHECK (channel IN ('email', 'in_app', 'sms', 'webhook')),
  direction TEXT NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  template_id TEXT REFERENCES message_templates(id),  -- if template used
  subject TEXT,
  body TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,  -- merge tags used, delivery status
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- message_templates: Reusable templates with merge tags
CREATE TABLE message_templates (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'in_app', 'sms')),
  subject TEXT,  -- for email
  body TEXT NOT NULL,  -- with {{candidate_name}}, {{job_title}}, {{interview_url}}, etc.
  is_system BOOLEAN DEFAULT FALSE,  -- protected templates
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.3 UI Components Needed

| Component | Location | Description |
|-----------|----------|-------------|
| `MessageComposer` | Candidate detail (floating action / sidebar) | Rich text, template selector, merge tag picker, send test |
| `MessageTimeline` | Candidate detail (new tab or sidebar) | Chronological thread, delivery status icons |
| `BulkMessageComposer` | Candidates table (bulk action) | Multi-select → compose → preview per recipient → send |
| `TemplateManager` | Settings → Communication | CRUD for templates, preview with sample data |

### 4.4 Automated Triggers (System Messages)

| Event | Template | Channel | Timing |
|-------|----------|---------|--------|
| Application submitted | `application_received` | Email | Immediate |
| Interview link generated | `interview_invite` | Email | Immediate |
| Interview reminder (24h) | `interview_reminder_24h` | Email | `token_expires_at - 24h` |
| Interview reminder (2h) | `interview_reminder_2h` | Email | `token_expires_at - 2h` |
| Interview expired | `interview_expired` | Email | On expiry |
| AI score available | `score_available` | Email + In-app | On scoring complete |
| Stage changed | `stage_changed` | In-app | On transition |
| Offer sent | `offer_sent` | Email | On offer send |
| Offer accepted/declined | `offer_responded` | Email | On response |

### 4.5 Merge Tags Reference
```
{{candidate_name}}          {{candidate_email}}
{{job_title}}               {{job_department}}
{{organization_name}}       {{organization_logo_url}}
{{interview_url}}           {{interview_expires_at}}
{{overall_score}}           {{passing_threshold}}
{{stage_name}}              {{stage_type}}
{{offer_compensation}}      {{offer_start_date}}
{{offer_expires_at}}        {{recruiter_name}}
{{recruiter_email}}         {{custom_field_x}}
```

---

## 5. Dashboard Design

### 5.1 Current Dashboard ✅
**File:** `apps/web/src/components/dashboard/admin-dashboard.tsx`

| Section | Component | Data Source |
|---------|-----------|-------------|
| Header | Org name + greeting + action buttons | `useHireLoop` state |
| Action Items | Cards with links (expired interviews, pending reviews) | `useDashboardInsights` |
| Metric Cards | Applications, Active Jobs, Interviewed, Awaiting Decision | `useDashboardInsights` |
| Charts | PipelineLineChart, SourcesDonutChart, PipelineFunnelChart | Recharts |
| Recent Applications | Table (top 8) | `useApplicationRows` |

### 5.2 Enhanced Dashboard for PaaS

| Enhancement | Effort | Description |
|-------------|--------|-------------|
| **Department Filter** | S | Dropdown to filter all metrics by department |
| **Date Range Picker** | S | Last 7/30/90 days, custom range |
| **Team Performance** | M | Recruiter-level metrics: interviews sent, time-to-move, hire rate |
| **DEI Metrics** | M | Gender/ethnicity breakdown (if collected), funnel parity |
| **Question Performance** | M | Which questions correlate with pass/hire |
| **Integration Health** | S | Webhook success rate, last sync status |
| **Custom Widgets** | L | Drag-drop dashboard builder |

### 5.3 Reports Page
**File:** `apps/web/src/app/admin/(dashboard)/reports/page.tsx` (stub)

| Report Type | Status | Specification |
|-------------|--------|---------------|
| Pipeline Funnel | ✅ | Conversion % per stage, time-in-stage |
| Source Effectiveness | ✅ | Applications/hires by source |
| Time to Hire | ⬜ | Median days per stage, overall |
| Interviewer Calibration | ⬜ | Score variance by interviewer |
| DEI Compliance | ⬜ | EEO-1 style reporting |
| Custom Export Builder | ⬜ | Visual query builder → scheduled export |

---

## 6. Settings & Configuration

### 6.1 Current Settings Page
**File:** `apps/web/src/app/admin/(dashboard)/settings/page.tsx`

| Section | Status | Enhancements |
|---------|--------|--------------|
| Profile | ✅ | Name, avatar, password |
| Team | ✅ | Invite, role change, remove |
| Organization | ✅ | Branding, intro video |
| **Communication** | ⬜ | **Email templates, merge tags, test send** |
| **Integrations** | ⬜ | **Webhook URLs, API keys, ATS connectors** |
| **Pipeline** | ⬜ | **Default stages, stage templates** |
| **Proctoring** | ⬜ | **Thresholds, snapshot frequency, AI model** |
| **Compliance** | ⬜ | **Retention, DSAR, data region** |
| **Billing** | ⬜ | **Subscription, usage, invoices** |

### 6.2 Proctoring Configuration (Per Job Override)

```typescript
// In JobQuestionsEditor or separate ProctoringConfig component
interface ProctoringConfig {
  warningThreshold: number;      // default 15
  criticalThreshold: number;     // default 3
  snapshotIntervalSeconds: number; // default 10
  autoFlagEnabled: boolean;      // default true
  clientSideChecks: {
    faceDetection: boolean;
    multiFace: boolean;
    gazeTracking: boolean;
    tabSwitch: boolean;
    fullscreen: boolean;
  };
}
```

---

## 7. Navigation & Information Architecture

### 7.1 Current Sidebar
**File:** `apps/web/src/components/layout/admin-sidebar.tsx`

```
Dashboard
Job Roles
Pipeline (Candidates)
Settings
─────────────
Question Banks (hardcoded link)
```

### 7.2 Proposed PaaS Sidebar

```
┌─ Dashboard
├─ Jobs
│  ├─ All Jobs
│  ├─ Create Job
│  ├─ Question Library
│  └─ Job Templates
├─ Pipeline
│  ├─ Kanban Board
│  ├─ Candidate List
│  ├─ People Search
│  └─ Requisitions
├─ Human Rounds
│  ├─ Scheduling
│  ├─ Scorecards
│  └─ Offers
├─ Communication
│  ├─ Message Center
│  ├─ Templates
│  └─ Bulk Send
├─ Reports
│  ├─ Overview
│  ├─ Pipeline Analytics
│  ├─ Team Performance
│  ├─ DEI & Compliance
│  └─ Custom Reports
├─ Settings
│  ├─ Profile
│  ├─ Team
│  ├─ Organization
│  ├─ Departments
│  ├─ Pipeline Templates
│  ├─ Communication
│  ├─ Integrations
│  ├─ Proctoring
│  ├─ Compliance
│  └─ Billing
└─ Help & Support
```

### 7.3 Breadcrumbs & Context
**File:** `apps/web/src/lib/navigation/admin-routes.ts`

- Dynamic breadcrumbs for all routes
- Department context indicator in header when filtered
- Job context preserved when navigating from job → candidates → candidate detail

---

## 8. Responsive & Accessibility

| Requirement | Implementation |
|-------------|----------------|
| **Mobile Admin** | Collapsible sidebar, stacked Kanban columns, bottom nav |
| **Keyboard Navigation** | Full focus management, skip links, ARIA labels |
| **Screen Readers** | Semantic HTML, live regions for toasts, table headers |
| **Color Contrast** | WCAG AA (4.5:1) for all text, focus indicators |
| **Reduced Motion** | Respect `prefers-reduced-motion` for Framer Motion |

---

## 9. Implementation Priority

| Phase | Workflows | Components to Build |
|-------|-----------|---------------------|
| **P0 (Launch)** | Onboarding wizard, Messaging (compose + timeline), Bulk actions, Department filter | `OnboardingWizard`, `MessageComposer`, `MessageTimeline`, `BulkActionBar`, `DepartmentFilter` |
| **P1 (Month 2)** | Templates library, Pipeline customization, Team performance dashboard | `QuestionLibrary`, `PipelineTemplateEditor`, `TeamPerformanceWidget` |
| **P2 (Month 3+)** | Custom dashboard builder, DEI reports, Advanced scheduling | `DashboardBuilder`, `DEIReport`, `CalendarSync` |

---

*This document should be reviewed alongside FEATURE_SCOPE.md and PAAS_MULTITENANT_DESIGN.md. UI components follow existing shadcn/ui + Tailwind patterns in the codebase.*