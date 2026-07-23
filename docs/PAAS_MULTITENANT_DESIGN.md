# HireLoop PaaS Multi-Tenant Design

**Version:** 1.0  
**Status:** Design specification for review  
**Scope:** Data model, RBAC, isolation, onboarding, department architecture

---

## 1. Multi-Tenant Architecture Principles

### 1.1 Tenant Boundary = Organization
- **Hard isolation:** Every data row belongs to exactly one `organization_id`
- **No cross-tenant queries:** RLS enforces `is_org_member(org_id)` on all reads/writes
- **Service role bypasses RLS** — only trusted server actions/backend API use it
- **Tenant identifier:** `org_id` (text, UUID-style) — propagated through all tables

### 1.2 Hierarchy
```
Organization (Tenant)
├── Departments (Logical grouping)
│   └── Requisitions (Headcount approvals)
├── Job Roles (Linked to dept + requisition)
│   ├── Questions
│   ├── Pipeline Stages
│   └── Applications
│       ├── Candidates (Global identity, linked via email/profile_id)
│       ├── Interview Sessions
│       ├── Scorecards
│       ├── Interview Schedules
│       └── Offers
├── Organization Members (Users with roles)
└── Settings (Branding, email templates, integrations, webhooks)
```

---

## 2. Organization & Membership Model

### 2.1 Core Tables
```sql
-- organizations: One per tenant
CREATE TABLE organizations (
  id TEXT PRIMARY KEY,                    -- Tenant ID
  name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#FF6B00',
  intro_video_url TEXT,
  website TEXT,
  about TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- PaaS extensions (future)
  billing_email TEXT,
  subscription_tier TEXT,                 -- starter, growth, scale, custom
  subscription_status TEXT,               -- active, past_due, cancelled, trial
  stripe_customer_id TEXT,
  custom_domain TEXT,                     -- White-label domain
  data_region TEXT DEFAULT 'us-east-1',   -- Data residency
  retention_days INTEGER DEFAULT 365,     -- Data retention policy
  settings JSONB DEFAULT '{}'::jsonb      -- Feature flags, config
);

-- organization_members: User ↔ Org with role
CREATE TABLE organization_members (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN (
    'owner', 'admin', 'recruiter', 'hiring_manager',
    'interviewer', 'coordinator', 'reporting_viewer', 'final_interviewer'
  )),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (org_id, user_id)
);

-- profiles: Global user identity (1:1 with auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  account_type TEXT NOT NULL CHECK (account_type IN ('candidate', 'org_admin', 'partner')),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT DEFAULT '',
  phone TEXT,
  resume_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 Role Definitions & Permissions Matrix

| Capability | Owner | Admin | Recruiter | Hiring Manager | Interviewer | Coordinator | Reporting Viewer | Final Interviewer |
|------------|-------|-------|-----------|----------------|-------------|-------------|------------------|-------------------|
| **Organization** |||||||||
| Manage org settings (branding, domain) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage billing/subscription | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Team Management** |||||||||
| Invite/remove members | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Change member roles | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Departments** |||||||||
| Create/edit/delete departments | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Requisitions** |||||||||
| Create requisitions | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Approve/reject requisitions | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Jobs** |||||||||
| Create/edit jobs | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Publish/close jobs | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage question banks | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Pipeline** |||||||||
| View all candidates | ✅ | ✅ | ✅ | ✅* | ❌ | ✅ | ✅ | ❌ |
| Move candidates between stages | ✅ | ✅ | ✅ | ✅* | ❌ | ✅ | ❌ | ❌ |
| Send interview links | ✅ | ✅ | ✅ | ✅* | ❌ | ✅ | ❌ | ❌ |
| **Human Interviews** |||||||||
| Schedule interviews | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Manage interviewer calendars | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Evaluation** |||||||||
| View AI scores/proctoring | ✅ | ✅ | ✅ | ✅* | ✅** | ❌ | ✅ | ✅** |
| Submit scorecards | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| View all scorecards | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Offers** |||||||||
| Create/edit offers | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Approve offers | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Send offers | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Reporting** |||||||||
| View dashboard/reports | ✅ | ✅ | ✅ | ✅* | ❌ | ✅ | ✅ | ❌ |
| Export data (CSV, API) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Compliance** |||||||||
| View audit logs | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Manage retention/DSAR | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Integrations** |||||||||
| Manage webhooks/API keys | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Configure ATS connectors | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

* Hiring Manager: Only for jobs in their department (via `requisitions.hiring_manager_id` → `departments`)
** Interviewer/Final Interviewer: Only for scheduled interviews they're assigned to (`interview_schedules.attendee_ids`)

### 2.3 RLS Implementation Pattern
```sql
-- Helper function (already exists)
CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id TEXT, p_roles TEXT[] DEFAULT NULL)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET SEARCH_PATH = PUBLIC AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.user_id = auth.uid()
      AND om.org_id = p_org_id
      AND (p_roles IS NULL OR om.role = ANY(p_roles))
  );
$$;

-- Job roles: org-scoped
CREATE POLICY "org_members_read_job_roles" ON public.job_roles FOR SELECT TO AUTHENTICATED
  USING (public.is_org_member(org_id));

CREATE POLICY "org_managers_manage_job_roles" ON public.job_roles FOR ALL TO AUTHENTICATED
  USING (public.is_org_member(org_id, ARRAY['owner','admin']))
  WITH CHECK (public.is_org_member(org_id, ARRAY['owner','admin']));

-- Applications: org-scoped via job_roles
CREATE POLICY "org_members_read_applications" ON public.applications FOR SELECT TO AUTHENTICATED
  USING (public.is_org_member(public.job_org_id(job_role_id)));

-- Pipeline stages: org-scoped
CREATE POLICY "org_members_read_pipeline_stages" ON public.pipeline_stages FOR SELECT TO AUTHENTICATED
  USING (public.is_org_member(org_id));
```

---

## 3. Department Architecture

### 3.1 Design Decision: Tags over Hierarchy
**Decision:** Departments are **tags with a primary department**, not a strict tree.

```sql
-- departments: Simple flat list per org
CREATE TABLE departments (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,                         -- UI color coding
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (org_id, name)
);

-- Job roles link to ONE primary department (for reporting/approvals)
ALTER TABLE job_roles ADD COLUMN department_id TEXT REFERENCES departments(id) ON DELETE SET NULL;

-- Requisitions link to ONE department (headcount owned by dept)
-- requisitions.department_id already exists

-- Candidates can have MULTIPLE department tags (for matrix orgs)
CREATE TABLE candidate_department_tags (
  candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES profiles(id),
  PRIMARY KEY (candidate_id, department_id)
);
```

### 3.2 Department-Scoped Views & Permissions

| UI Element | Department Filtering |
|------------|---------------------|
| Jobs List | Group by department; filter dropdown |
| Candidates Kanban | Filter by candidate's primary department tag |
| Pipeline Reports | Breakdown by department |
| Requisitions | Naturally department-scoped |
| Team Members | Show department assignment (future) |

### 3.3 Department Admin (Owner/Admin only)
- Create/edit/delete departments
- Assign department leads (hiring managers)
- Set department-specific pipeline templates
- Department-level reporting dashboard

---

## 4. Candidate Identity Model (Cross-Job)

### 4.1 Global Candidate Identity
```sql
-- candidates: Global (not org-scoped)
CREATE TABLE candidates (
  id TEXT PRIMARY KEY,
  org_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,  -- Legacy, nullable
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,   -- Auth link
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  resume_url TEXT,
  source TEXT DEFAULT 'website',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Department tags (many-to-many)
  -- via candidate_department_tags table
);

-- Unique index on email (case-insensitive)
CREATE UNIQUE INDEX candidates_email_unique_idx ON candidates (LOWER(email));
```

### 4.2 Identity Resolution Flow
```
1. Candidate applies to Job A (Org 1)
   → Creates candidate record with org_id=Org1, profile_id=null
   
2. Candidate later signs up (email/password or Google)
   → auth.users created → profiles.created (account_type=candidate)
   → handle_new_user() trigger links profile_id to candidate by email
   
3. Candidate applies to Job B (Org 2)
   → Finds existing candidate by email → links application to same candidate
   → candidate.org_id remains Org1 (first org) but profile_id now set
   → New application has job_role_id in Org2
   
4. Candidate views profile at /candidate/profile
   → Sees ALL applications across ALL orgs (via profile_id)
```

### 4.3 Data Access for Admins
- **Org 1 Admin** sees candidate's application to Job A (via `applications → job_roles → org_id`)
- **Org 2 Admin** sees candidate's application to Job B (same path)
- **Neither sees** the other org's applications
- **Candidate** sees all their applications in portal

---

## 5. Onboarding Flow (Multi-Org PaaS)

### 5.1 Self-Serve Signup
```
1. User visits hireloop.com → "Start Free Trial"
2. Email/password or Google OAuth → Supabase Auth
3. Account type = "org_admin" (set in app_metadata)
4. Onboarding Wizard (multi-step):
   
   Step 1: Organization Details
   - Company name, logo, primary color, website
   - Intro video URL (YouTube embed)
   
   Step 2: Team Invitations
   - Add team members (email + role)
   - Bulk invite via CSV (future)
   - Invites sent via Resend with magic link
   
   Step 3: Department Setup
   - Add departments (Engineering, Sales, Finance, etc.)
   - Assign department leads (hiring managers)
   
   Step 4: Pipeline Configuration
   - Select template: Graduate / Internship / Custom
   - Customize stage names, order, required/optional
   
   Step 5: Email & Branding
   - Configure email templates (interview invite, reminder, result)
   - Preview candidate-facing pages
   
   Step 6: Integrations (Optional)
   - Webhook URL + secret
   - API key generation
   - ATS connector selection
   
5. Complete → Landing on Dashboard with "Create First Job" CTA
```

### 5.2 Invited Team Member Flow
```
1. Receives email: "You've been invited to HireLoop by {Org Name}"
2. Clicks link → /auth/invite/{token}
3. If new user: Sign up (email/password/Google) → profile created with account_type=org_admin
4. If existing user: Login → added to organization_members
5. Redirected to /admin → sees org in switcher (if multi-org user)
```

### 5.3 Org Switcher (Multi-Org Users)
```
Header dropdown: [Current Org Name] ▼
  ├── Organization A (Owner)
  ├── Organization B (Admin)
  ├── Organization C (Recruiter)
  └── + Join another organization
```
- Persisted in localStorage + cookie
- All queries scoped to selected `org_id`
- URL pattern: `/admin?org=org_123` (optional deep link)

---

## 6. Data Isolation Guarantees

### 6.1 Database Level (RLS)
- Every table with `org_id` or FK to org-scoped table has RLS
- Policies use `is_org_member()` — **no bypass possible from client**
- Service role only used in:
  - Next.js Server Actions (`createAdminClient()`)
  - Backend API (FastAPI `get_store()`)
  - Background jobs (cron)

### 6.2 Storage Level
| Bucket | Access Pattern | Isolation |
|--------|----------------|-----------|
| `question-audio` | Public read | Org-scoped via job_roles in path metadata |
| `interview-answers` | Private (service role) | Path: `{org_id}/{session_id}/...` |
| `proctoring-snapshots` | Private (service role) | Path: `{session_id}/...` verified via session→application→job→org |
| `application-documents` | Private (service role) | Path: `{org_id}/{job_id}/{application_id}/...` |

### 6.3 API Level
- **Frontend Server Actions:** `requireOrgRole(roles)` → gets `org_id` from session → all queries scoped
- **Backend API:** Token validation → `store.load_application_for_interview(token)` → verifies org membership before returning data
- **Webhooks:** Payload includes `org_id`; signature verification uses per-org secret

### 6.4 Audit Trail
```sql
-- activity_log captures ALL mutations with org context
CREATE TABLE activity_log (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,      -- 'application', 'job_role', 'candidate', etc.
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,           -- 'created', 'updated', 'status_changed', 'deleted'
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- RLS: org members can read; org members can insert (for their actions)
```

---

## 7. Billing & Usage Metering (Future)

### 7.1 Metered Resources
| Resource | Unit | Tracking |
|----------|------|----------|
| AI Interviews Completed | Count | `interview_sessions` with status=completed |
| Interview Minutes | Seconds | `interview_sessions.total_duration_seconds` |
| Proctoring Snapshots | Count | `interview_sessions.proctoring_log` array length |
| AI Scoring Calls | Count | `ai_usage_logs` where operation='scoring' |
| TTS Characters | Characters | `ai_usage_logs` where operation='tts' |
| Storage Used | GB | Supabase Storage bucket sizes per org |
| Team Seats | Count | `organization_members` count |

### 7.2 Usage Aggregation (Daily Cron)
```sql
-- Materialized view for billing
CREATE MATERIALIZED VIEW org_daily_usage AS
SELECT 
  o.id AS org_id,
  DATE_TRUNC('day', s.created_at) AS usage_date,
  COUNT(*) FILTER (WHERE s.status = 'completed') AS interviews_completed,
  SUM(s.total_duration_seconds) FILTER (WHERE s.status = 'completed') AS interview_seconds,
  SUM(jsonb_array_length(s.proctoring_log)) AS proctoring_snapshots,
  COUNT(DISTINCT s.id) AS sessions_started
FROM organizations o
JOIN job_roles j ON j.org_id = o.id
JOIN applications a ON a.job_role_id = j.id
JOIN interview_sessions s ON s.application_id = a.id
GROUP BY o.id, DATE_TRUNC('day', s.created_at);
```

---

## 8. Migration Strategy for Existing Single-Org Data

### 8.1 Current State
- Codebase assumes single organization (hardcoded in some queries)
- `fetchHireLoopState(scopeOrgId?)` accepts optional param but UI doesn't use it
- Admin sidebar shows single org

### 8.2 Migration Steps
1. **Deploy RLS migrations** (already written: `20260706170000_rls_org_scope.sql`, etc.)
2. **Add org switcher to header** — read `organization_members` for current user
3. **Update all Server Actions** to use `getAdminOrgIdAction()` → scope queries
4. **Update Dashboard** to fetch state for selected org
5. **Add Department UI** — create departments page, link to jobs/requisitions
6. **Test with 2+ orgs** in staging

---

## 9. Open Questions for Decision

| # | Question | Options | Recommendation |
|---|----------|---------|----------------|
| **MQ1** | Can a user be **Owner** of multiple orgs? | A) Yes (serial entrepreneur)<br>B) No (one owner per org) | **A** — Allow, but billing per org |
| **MQ2** | Department **hierarchy** needed? | A) Flat tags (current design)<br>B) Parent/child (Engineering → Backend) | **A** — Flat tags sufficient; hierarchy adds complexity |
| **MQ3** | Candidate **department tags** — who assigns? | A) Auto from job's department<br>B) Recruiter assigns manually<br>C) Both | **C** — Auto-assign primary from job; recruiter can add secondary |
| **MQ4** | **Data residency** per org? | A) Single region (US)<br>B) Org selects region (US/EU/IN)<br>C) Per-department region | **B** — Org-level region; Supabase multi-region + routing |
| **MQ5** | **Trial/onboarding** — sandbox org? | A) Real org with limits<br>B) Separate sandbox environment<br>C) Demo mode with mock data | **A** — Real org, 14-day trial, 10 interview limit |

---

*This design should be reviewed by Engineering + Product before implementation. Key dependencies: RLS migrations deployed, org switcher UI, department management UI.*