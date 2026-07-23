# HireLoop Frontend Design System & Page Inventory

**Version:** 1.0  
**Status:** Current Implementation Snapshot  
**Codebase:** `/Users/aj_builds/Documents/Programs/HireLoop/apps/web`  
**Last Updated:** 2026-07-18

---

## 1. Design System & Foundational Decisions

### 1.1 Technology Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Framework** | Next.js | 16.2.10 (App Router) | React 19, Server Components, Server Actions |
| **Language** | TypeScript | 5.x | Type safety |
| **Styling** | Tailwind CSS | 4.x | Utility-first, CSS-first config |
| **UI Primitives** | Radix UI (via shadcn/ui) | Latest | Accessible, unstyled components |
| **Component Library** | shadcn/ui | Custom | Pre-built component patterns |
| **Icons** | Lucide React | 1.23.0 | Consistent icon system |
| **Animations** | Framer Motion | 12.42.2 | Page transitions, micro-interactions |
| **Charts** | Recharts | 3.9.1 | Dashboard visualizations |
| **Notifications** | Sonner | 2.0.7 | Toast notifications |
| **Dark Mode** | next-themes | 0.4.6 | Class-based dark mode |
| **Forms** | React Hook Form (via shadcn) | Latest | Form handling |
| **State** | React Context + LocalStorage | — | Client-side state, interview flow |

### 1.2 Design Tokens (Tailwind CSS v4 - CSS-first config)

**File:** `apps/web/globals.css` (using `@theme` directive)

```css
@theme {
  /* Colors - Brand */
  --color-brand: #FF6B00;              /* Primary orange */
  --color-brand-foreground: #ffffff;
  --color-brand-muted: #FFF3E8;        /* Light orange bg */
  --color-brand-subtle: #FFE8D6;       /* Subtle orange bg */
  --color-brand-ring: #FF6B00;         /* Focus ring */

  /* Colors - Semantic */
  --color-background: #ffffff;
  --color-foreground: #0f172a;         /* slate-900 */
  --color-muted: #f1f5f9;              /* slate-100 */
  --color-muted-foreground: #64748b;   /* slate-500 */
  --color-border: #e2e8f0;             /* slate-200 */
  --color-ring: #FF6B00;               /* Focus ring */
  --color-destructive: #ef4444;        /* red-500 */
  --color-destructive-foreground: #ffffff;
  --color-success: #22c55e;            /* green-500 */
  --color-warning: #f59e0b;            /* amber-500 */

  /* Colors - Sidebar */
  --color-sidebar: #f8fafc;            /* slate-50 */
  --color-sidebar-foreground: #0f172a;
  --color-sidebar-accent: #f1f5f9;
  --color-sidebar-accent-foreground: #0f172a;
  --color-sidebar-border: #e2e8f0;
  --color-sidebar-ring: #FF6B00;

  /* Typography */
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;

  /* Spacing Scale */
  --spacing-1: 0.25rem;   /* 4px */
  --spacing-2: 0.5rem;    /* 8px */
  --spacing-3: 0.75rem;   /* 12px */
  --spacing-4: 1rem;      /* 16px */
  --spacing-5: 1.25rem;   /* 20px */
  --spacing-6: 1.5rem;    /* 24px */
  --spacing-8: 2rem;      /* 32px */
  --spacing-10: 2.5rem;   /* 40px */
  --spacing-12: 3rem;     /* 48px */
  --spacing-16: 4rem;     /* 64px */

  /* Border Radius */
  --radius-sm: 0.25rem;   /* 4px */
  --radius-md: 0.375rem;  /* 6px */
  --radius-lg: 0.5rem;    /* 8px */
  --radius-xl: 0.75rem;   /* 12px */
  --radius-2xl: 1rem;     /* 16px */
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-card: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);

  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-normal: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 1.3 Typography Scale

| Token | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| `text-display` | 3.5rem / 56px | 1.1 | 700 | Hero headlines |
| `text-title` | 1.5rem / 24px | 1.3 | 600 | Page titles |
| `text-heading` | 1.25rem / 20px | 1.4 | 600 | Section headers |
| `text-subheading` | 1.125rem / 18px | 1.5 | 500 | Subsections |
| `text-body` | 1rem / 16px | 1.6 | 400 | Body text |
| `text-caption` | 0.875rem / 14px | 1.5 | 400 | Secondary text |
| `text-small` | 0.75rem / 12px | 1.5 | 400 | Labels, badges |
| `text-mono` | 0.875rem / 14px | 1.5 | 400 | Code, IDs |

### 1.4 Component Library (shadcn/ui Components)

**Location:** `apps/web/src/components/ui/`

| Component | File | Variants | Key Props |
|-----------|------|----------|-----------|
| Button | `button.tsx` | default, destructive, outline, secondary, ghost, link | `size`, `variant`, `asChild` |
| ButtonLink | `button-link.tsx` | — | Styled link as button |
| Input | `input.tsx` | — | Form text input |
| Textarea | `textarea.tsx` | — | Multi-line input |
| Select | `select.tsx` | — | Dropdown select |
| Checkbox | `checkbox.tsx` | — | Boolean input |
| Switch | `switch.tsx` | — | Toggle control |
| Label | `label.tsx` | — | Form label |
| Card | `card.tsx` | default, bordered, shadow | Content container |
| Badge | `badge.tsx` | default, secondary, destructive, outline | Status labels |
| Avatar | `avatar.tsx` | — | User/candidate images |
| Tabs | `tabs.tsx` | — | Tabbed interfaces |
| Table | `table.tsx` | — | Data tables |
| Dialog | `dialog.tsx` | — | Modals |
| Sheet | `sheet.tsx` | — | Side panels |
| DropdownMenu | `dropdown-menu.tsx` | — | Action menus |
| Tooltip | `tooltip.tsx` | — | Hover hints |
| Progress | `progress.tsx` | — | Progress bars |
| Separator | `separator.tsx` | — | Visual dividers |
| ScrollArea | `scroll-area.tsx` | — | Custom scrollbars |
| Sonner | `sonner.tsx` | — | Toast notifications |

### 1.5 Pattern Components

**Location:** `apps/web/src/components/patterns/`

| Component | Purpose |
|-----------|---------|
| `section-card.tsx` | Consistent card wrapper with title, description, action |
| `metric-card.tsx` | Dashboard KPI cards with icon, value, hint, link |
| `empty-state.tsx` | Empty state with illustration, title, description, action |
| `status-badge.tsx` | Unified status colors for all entity statuses |

### 1.6 Layout Components

**Location:** `apps/web/src/components/layout/`

| Component | Purpose |
|-----------|---------|
| `dashboard-shell.tsx` | Main admin layout: sidebar + header + content |
| `admin-sidebar.tsx` | Left navigation (Dashboard, Jobs, Pipeline, Settings) |
| `app-sidebar.tsx` | Candidate/app layout sidebar |
| `app-header.tsx` | Top bar: search, create job, user menu |
| `admin-page-frame.tsx` | Page wrapper with breadcrumbs + page header |
| `page-header.tsx` | Title + description + optional action |
| `app-breadcrumbs.tsx` | Breadcrumb navigation |

### 1.7 Motion & Interaction Components

**Location:** `apps/web/src/components/motion/`

| Component | Purpose |
|-----------|---------|
| `fade-in.tsx` | Staggered fade-in animations |
| `interactions.tsx` | `HoverLift` (card hover), `PressScale` (button press) |

### 1.8 Brand Assets

**Location:** `apps/web/src/components/brand/`

| Asset | File | Description |
|-------|------|-------------|
| Logo | `logo.tsx` | Full logo with mark + wordmark |
| LogoMark | `logo-mark.tsx` | Icon-only mark (favicon, avatar fallback) |
| Brand Icons | `brand-icons.tsx` | Custom SVG icons for features |

**Logo Design:** Orange circular mark with "H" + "HireLoop" wordmark in slate-900

### 1.9 Icon System

- **Primary:** Lucide React (consistent 24px stroke icons)
- **Brand:** Custom SVG in `brand-icons.tsx`
- **Usage:** Always `aria-hidden` with adjacent text labels

### 1.10 Dark Mode

- **Strategy:** Class-based (`dark` class on `<html>`)
- **Toggle:** `ModeToggle` in header
- **Persistence:** localStorage + cookie (via next-themes)
- **Colors:** All semantic tokens support dark variants

### 1.11 Grid & Layout Patterns

| Pattern | Implementation |
|---------|----------------|
| Page Container | `mx-auto w-full max-w-[1440px] px-6 py-6` |
| Dashboard Grid | `grid gap-4 sm:grid-cols-2 xl:grid-cols-4` |
| Two-Column (Sidebar) | `lg:grid-cols-[280px_1fr]` (sticky sidebar) |
| Card Grid | `grid gap-6` (responsive columns) |
| Form Grid | `grid gap-2 sm:grid-cols-4` (label + input + select + actions) |
| Kanban Columns | `grid min-w-[1100px] grid-cols-8 gap-3` (fixed-width columns) |

### 1.12 Image & Asset Handling

| Type | Handling |
|------|----------|
| Logos/Illustrations | Inline SVG components |
| Candidate Photos | Avatar fallback with initials (no upload yet) |
| Company Branding | URL stored in DB, rendered via `<Image>` |
| Proctoring Snapshots | Signed URLs from Supabase Storage |
| Document Previews | File type icons + download links |
| YouTube Videos | Normalized to `youtube.com/embed/` iframes |

---

## 2. Page Inventory - Public Pages

### 2.1 Landing Page (`/`)

**Route:** `apps/web/src/app/page.tsx` → `HomePageClient`

**Components:**
- Hero section with headline, subheadline, dual CTAs
- Feature highlights (3 cards with icons)
- Stats bar (companies, interviews, hours saved)
- Footer with navigation links

**Current Content:**
```
Hero:
  Headline: "Hire smarter with AI-powered interviews"
  Subheadline: "Screen candidates 10x faster with voice AI, proctoring, and instant scoring"
  Primary CTA: "Start Free Trial" → /auth/signup
  Secondary CTA: "Watch Demo" → #demo

Features:
  1. "AI Voice Interviews" - TTS/STT, bilingual, structured
  2. "Automated Proctoring" - Face detection, browser integrity, AI analysis
  3. "Instant Scoring" - Per-question scores, strengths/concerns, pass/fail

Stats:
  - "500+ Companies"
  - "50,000+ Interviews"
  - "10,000+ Hours Saved"
```

**Interactions:**
- Framer Motion stagger animations on scroll
- Hover effects on feature cards
- CTA button press animation

---

### 2.2 Authentication Pages

#### 2.2.1 Login (`/login`)

**Route:** `apps/web/src/app/login/page.tsx`

**Components:** `AdminAuthForm`, `GoogleSignInButton`, `AuthMethodTabs`

**Form Fields:**
- Email (required, type=email)
- Password (required, type=password)
- Remember me (checkbox)
- Forgot password link
- "Don't have an account? Sign up" → /auth/signup

**Tabs:** Email | Google OAuth

#### 2.2.2 Admin Signup (`/auth/signup`)

**Route:** `apps/web/src/app/auth/signup/page.tsx` (or similar)

**Components:** `AdminAuthForm` with organization details step

---

### 2.3 Candidate Public Pages

#### 2.3.1 Org Careers Page (`/org/[orgId]/jobs`)

**Route:** `apps/web/src/app/org/[orgId]/jobs/page.tsx`

**Components:**
- Org branding (logo, name, primary color)
- Job list cards: title, department, location, type
- Department filter dropdown
- Search by title
- "View Job" → `/apply/[jobId]`

**Current State:** Basic list, needs department filter UI

---

#### 2.3.2 Apply Page (`/apply/[jobId]`)

**Route:** `apps/web/src/app/apply/[jobId]/page.tsx` → `ApplyPageClient`

**Components:**
- **Hero:** Org logo, job title, department, location, type (full-time/internship)
- **About:** Description, requirements, benefits
- **Sidebar:** Quick facts (salary range, equity, remote policy, visa sponsorship)
- **ApplicationForm:** Dynamic fields from `job.formFields`

**Form Fields (Dynamic):**
| Field Type | Component | Validation |
|------------|-----------|------------|
| text | Input | Required, min/max length |
| email | Input (type=email) | Required, email format |
| phone | Input (type=tel) | Optional, phone format |
| number | Input (type=number) | Required for eligibility |
| dropdown | Select | Required, options from config |
| doc/file | File upload (drag-drop) | Max 10MB, allowed types |

**Actions:**
- Submit → `submitApplicationAction`
- Success: Interview link sent + token generated
- Auto-reject: Eligibility failed message

---

#### 2.3.3 Candidate Login (`/candidate/login`)

**Route:** `apps/web/src/app/candidate/login/page.tsx`

**Components:** `CandidateAuthForm`, `OTPAuthForm`, `GoogleSignInButton`

---

#### 2.3.4 Candidate Signup (`/candidate/signup`)

**Route:** `apps/web/src/app/candidate/signup/page.tsx`

**Components:** `CandidateAuthForm` (account_type=candidate)

---

#### 2.3.5 Candidate Profile (`/candidate/profile`)

**Route:** `apps/web/src/app/candidate/profile/page.tsx`

**Tabs/Sections:**
1. **Profile** - Name, email, phone, resume (editable)
2. **Applications** - Table: Job, Company, Status, Applied Date, Interview Link
3. **Interviews** - Completed interviews with scores
4. **Settings** - Notifications, data export, delete account

---

#### 2.3.6 Candidate Interview Flow (`/candidate/[token]`)

**Route:** `apps/web/src/app/candidate/[token]/page.tsx` → `CandidateInterviewFlow`

**State Machine Steps:**
```
INTRO → CONSENT → PROCTORING SETUP → MIC CHECK → LIVE INTERVIEW → COMPLETE/FLAGGED
```

**Step Details:**

| Step | Component | Key Elements |
|------|-----------|--------------|
| **INTRO** | Inline | Org video (YouTube embed), language toggle (EN/HI), "Continue to consent" |
| **CONSENT** | `ConsentScreen` | Recording consent, proctoring consent, data processing, "Accept" |
| **PROCTORING** | `ProctoringSetup` | Camera permission, MediaPipe face detection, calibration, fullscreen request |
| **MIC CHECK** | `MicCheck` | Audio level visualizer, test recording + playback, "Ready" |
| **LIVE** | `InterviewStructured` | WebSocket, TTS audio, question text, record/stop/next, timer, proctoring panel |
| **COMPLETE** | Inline | Thank you, next steps, profile link |
| **FLAGGED** | Inline | Violation reason, partial review notice, profile link |

**Live Interview UI (`InterviewStructured`):**
- **Header:** Progress stepper (`InterviewStepper`), timers (question + overall)
- **Question Card:** Section badge, prompt text, ideal answer notes (hidden), time limit
- **Recording Controls:** Record (red), Stop, Next (disabled until recording)
- **Proctoring Panel:** Live camera feed, status badges (face ✓, multi-face ✗, gaze ✓, fullscreen ✓)
- **Language:** Persisted from INTRO step

**Proctoring Panel (`ProctoringPanel`):**
- Live video feed with face detection overlay
- Real-time status indicators
- Violation toasts (via Sonner)

---

## 3. Page Inventory - Admin Portal (Authenticated)

### 3.1 Layout Shell

**Wrapper:** `DashboardShell` (sidebar + header + content)

**Sidebar (`AdminSidebar`):**
```
Dashboard
Job Roles
Pipeline (Candidates)
Settings
─────────────
Question Banks (hardcoded link)
```

**Header (`AppHeader`):**
- Search (global)
- Create Job button
- User menu (profile, sign out)

**Content Wrapper (`AdminPageFrame`):**
- Breadcrumbs (from `admin-routes.ts`)
- Page header (title + description)
- Content area

---

### 3.2 Dashboard (`/admin`)

**Route:** `apps/web/src/app/admin/(dashboard)/page.tsx` → `AdminDashboard`

**Components:**
- **Header:** Org name, greeting, action buttons (Create Job, View Pipeline, Reports)
- **Action Items:** Cards for items needing attention (expired interviews, pending reviews)
- **Metric Cards (4):**
  - Applications (link → /admin/candidates)
  - Active Jobs (link → /admin/jobs)
  - Interviewed (link → /admin/candidates)
  - Awaiting Decision (link → /admin/candidates)
- **Charts Row 1:** Pipeline Line Chart (lg:col-span-2) + Sources Donut Chart
- **Charts Row 2:** Pipeline Funnel Chart (with conversion %)
- **Recent Applications Table:** Name, Job, Status, Applied Date (top 8, link to candidate detail)

**Loading State:** Skeleton placeholders
**Empty State:** "Welcome to HireLoop" with "Create your first job" CTA

---

### 3.3 Jobs Management

#### 3.3.1 Jobs List (`/admin/jobs`)

**Route:** `apps/web/src/app/admin/(dashboard)/jobs/page.tsx`

**Components:** `JobsTable`, `JobDetailView` (side panel or separate page)

**Table Columns:** Title, Status, Department, Applications, Created, Actions

**Actions per Row:** View Details, Edit, Duplicate, Archive, Delete

**Toolbar:** Filter by status, department, search, "Create Job" button

---

#### 3.3.2 Create Job Wizard (`/admin/jobs/new`)

**Route:** `apps/web/src/app/admin/(dashboard)/jobs/new/page.tsx` → `JobCreationWizard`

**5-Step Wizard:**

| Step | Component | Fields/Actions |
|------|-----------|----------------|
| **1. Job Details** | `JobDetailsEditor` | Title, Description |
| **2. Application Form** | `FormFieldsBuilder` | Dynamic fields: text, email, phone, number, dropdown, file/doc. Presets: Name, Email, Phone, Resume, CGPA, Grad Year |
| **3. Interview Questions** | `JobQuestionsEditor` | Sections (Technical/HR/Situational), mandatory/variable, time limits, score thresholds, total question count config |
| **4. Rules & Thresholds** | `JobRulesEditor` | Eligibility rules (numeric fields + operators), passing score gate, publish toggle |
| **5. Publish** | `ShareJobLink` | Copy apply link, view on careers page |

**Form Fields Builder (`FormFieldsBuilder`):**
- Add/remove fields
- Drag to reorder
- Field presets (Name, Email, Phone, Resume, CGPA, Grad Year, etc.)
- Required toggle
- Type selector

**Question Editor (`JobQuestionsEditor`):**
- Sections sidebar (Technical, Situational, HR) with counts
- Mandatory vs Variable pool tabs
- Per-question: prompt, ideal answer, time limit, score threshold, active toggle
- Question count config: total per interview (mandatory + sampled variable)

---

#### 3.3.3 Job Detail (`/admin/jobs/[id]`)

**Route:** `apps/web/src/app/admin/(dashboard)/jobs/[id]/page.tsx`

**Tabs:**
1. **Details** - `JobDetailView`: Edit title, description, status, form fields, eligibility rules, passing score, question count
2. **Questions** - `JobQuestionsEditor` (same as wizard step 3)
3. **Share** - `ShareJobLink`: Apply link, QR code, embed code

---

#### 3.3.4 Job Questions (`/admin/jobs/[id]/questions`)

**Route:** `apps/web/src/app/admin/(dashboard)/jobs/[id]/questions/page.tsx`

**Component:** `JobQuestionsEditor` (full-page version)

---

### 3.4 Pipeline / Candidates

#### 3.4.1 Candidates Kanban (`/admin/candidates`)

**Route:** `apps/web/src/app/admin/(dashboard)/candidates/page.tsx`

**Component:** `PipelineKanban`

**Columns (Status-based):**
```
Applied → Shortlisted → Interview Sent → Interviewed → Passed AI → Final Interview → Hired
Closed/Expired (auto_rejected, interview_expired, rejected_ai, rejected_final)
```

**Column Features:**
- Header: Label + count badge
- Stale indicator (>3 days): "X waiting 3+ days" (amber)
- Candidate cards: Avatar, name, job title, status badge, AI score (if available)
- Drag-drop between columns (via `transitionApplicationStageAction`)
- Empty state: "No candidates"

---

#### 3.4.2 Candidates Table (`/admin/candidates` - alternative view)

**Route:** `apps/web/src/components/candidates/candidates-table.tsx`

**Features:**
- Sortable columns
- Filterable by status, job, date
- Pagination
- Bulk actions (planned)

---

#### 3.4.3 Candidate Detail (`/admin/candidates/[id]`)

**Route:** `apps/web/src/app/admin/(dashboard)/candidates/[id]/page.tsx` → `CandidateDetailView`

**Tabs (7):**

| Tab | Component | Content |
|-----|-----------|---------|
| **Application Data** | Inline | Form responses (label:value), document download links |
| **Documents** | Inline | Uploaded files gallery with download |
| **Job & Interview** | Inline | Job config, interview link management (regenerate/send) |
| **Proctoring** | `ProctoringLogView` + `ProctoringSnapshotGallery` | Event log, severity badges, snapshot gallery |
| **Transcript** | `TranscriptView` | Full Q&A with speaker labels, timestamps |
| **AI Scores** | `ScoreBreakdown` | Overall score (pass/fail badge), per-question scores, strengths/concerns, red flags, transcript snippets |
| **Scorecard** | Inline | Human review: recommendation (5-point), score (0-10), notes, submit |

**Sidebar (Sticky):**
- Candidate header: Name, email, phone, status badge, job badge
- Action buttons (context-aware):
  - `passed_ai`/`shortlisted`: "Send to Final Interview"
  - `partner_review`: "Mark Hired" / "Reject Final"
  - Always: "Back to List"
- Interview link management (regenerate if expired)

---

### 3.5 Settings (`/admin/settings`)

**Route:** `apps/web/src/app/admin/(dashboard)/settings/page.tsx`

**Sections:**
1. **Profile** - Name, avatar, password
2. **Team** - `InviteTeamMemberForm`: email + role selector (Owner, Admin, Recruiter, Hiring Manager, Interviewer, Coordinator, Reporting Viewer, Final Interviewer)
3. **Organization** - Branding (logo, color, video), website, about

---

### 3.6 Other Admin Pages (Stubs/Partial)

| Page | Route | Component | Status |
|------|-------|-----------|--------|
| Requisitions | `/admin/requisitions` | `RequisitionsPage` | Stub |
| Scheduling | `/admin/scheduling` | `SchedulingPage` | Stub |
| Offers | `/admin/offers` | `OffersPage` | Stub |
| People Search | `/admin/people-search` | `PeopleSearchPage` | Stub |
| Compliance | `/admin/compliance` | `CompliancePage` | Stub |
| Reports | `/admin/reports` | `ReportsPage` | Stub |
| Company | `/admin/company` | `CompanyPage` | Stub |

---

## 4. Key UI Patterns & Data Display

### 4.1 Status Badges (`StatusBadge`)

**Color Mapping:**
| Status | Color | Variant |
|--------|-------|---------|
| applied | blue | default |
| shortlisted | indigo | default |
| interview_sent | purple | default |
| interviewed | cyan | default |
| passed_ai | emerald | default |
| rejected_ai | rose | destructive |
| partner_review | amber | secondary |
| hired | green | success |
| rejected_final | red | destructive |
| auto_rejected | gray | secondary |
| interview_expired | orange | warning |

### 4.2 Candidate Cards (Kanban)

**Structure:**
```
┌─────────────────────────────────────┐
│ 👤 [Avatar]  Candidate Name         │
│        Job Title                    │
├─────────────────────────────────────┤
│ [Status Badge]    Score: 8.2/10    │
└─────────────────────────────────────┘
```
- Hover lift animation (`HoverLift`)
- Click → candidate detail
- Stale indicator on column header

### 4.3 Score Breakdown (`ScoreBreakdown`)

**Components:**
- **Overall Card:** Large score (48px), pass/fail badge, progress bar, threshold
- **Strengths/Concerns:** Side-by-side cards with bullet lists
- **Per-Question Cards:** Prompt, score badge, transcript snippet, rationale, red flags

### 4.4 Proctoring Log (`ProctoringLogView`)

**Structure:**
- Summary card: Flagged? Probability? Warnings/Critical counts
- Event table: Timestamp, Type, Severity (color), Detail, Question Index
- Snapshot gallery: Thumbnails with signed URLs, click to expand

### 4.5 Transcript View (`TranscriptView`)

**Structure:**
- Chronological entries with speaker badges (AI/Candidate)
- Question index badges
- Timestamps
- Copy-to-clipboard

### 4.6 Charts (Dashboard)

| Chart | Component | Data |
|-------|-----------|------|
| Pipeline Line | `PipelineLineChart` | Monthly applications + completed interviews |
| Sources Donut | `SourcesDonutChart` | Application sources breakdown |
| Funnel | `PipelineFunnelChart` | Conversion % per stage |

---

## 5. Forms & Interactive Components

### 5.1 Job Creation Wizard Steps

**Step Indicator:** Horizontal pills with numbers/checkmarks
- Completed: ✓ in brand color
- Current: Highlighted brand
- Future: Muted

### 5.2 Question Editor (`JobQuestionsEditor`)

**Layout:** Two-column (sidebar + editor)
- **Sidebar:** Sections (Technical/HR/Situational) with counts, "Add to Section" buttons
- **Editor:** Collapsible question cards
  - Header: Drag handles, mandatory/variable badge, active badge, prompt preview
  - Expanded: Prompt textarea, ideal answer textarea, mandatory/active toggles, time limit, score threshold

### 5.3 Form Fields Builder (`FormFieldsBuilder`)

**Layout:** Cards per field
- Label input (auto-generates fieldKey)
- fieldKey display (read-only)
- Type select (text/email/phone/number/dropdown/doc/file)
- Required toggle
- Delete button
- Preset buttons: +Name, +Email, +Phone, +Resume, +CGPA, +Grad Year

### 5.4 Eligibility Rules (`JobRulesEditor`)

**Layout:** Dashed border container
- Add rule button → selects numeric field, operator (≤, ≥, =), value
- Rules list with remove

### 5.5 Scorecard Form (Candidate Detail)

**Fields:**
- Recommendation: Select (Strong Yes / Yes / Hold / No / Strong No)
- Reviewer Score: Number input (0-10, step 0.1)
- Notes: Textarea (5 rows)

---

## 6. Client-Side State Management

### 6.1 Interview Flow State (`CandidateInterviewFlow`)

```typescript
type Step = "intro" | "consent" | "proctoring" | "mic" | "live" | "done" | "flagged";
const [step, setStep] = useState<Step>("intro");
const [language, setLanguage] = useState<"en" | "hi">("en");
const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
const [flagReason, setFlagReason] = useState<string | null>(null);
```

### 6.2 Admin Dashboard State (`useHireLoop`)

**Provider:** `apps/web/src/lib/store/provider.tsx`

**State:**
```typescript
interface HireLoopState {
  organization: Organization;
  jobs: JobRole[];
  questions: Question[];
  candidates: Candidate[];
  applications: Application[];
  interviewSessions: InterviewSession[];
}
```

**Actions:** `createJob`, `updateJob`, `setJobQuestions`, `submitApplication`, `sendToFinalInterview`, `markCandidateHired`, `rejectCandidateFinal`, `transitionApplicationStage`, `submitScorecard`, `regenerateAndSendInterviewLink`, `updateOrganization`, `refreshState`

### 6.3 Local Storage Persistence

- Interview flow: language, media stream state
- Org switcher: selected org ID
- Theme: dark/light mode

---

## 7. API Integration Points

### 7.1 Server Actions (`apps/web/src/app/actions/`)

| Action | Purpose |
|--------|---------|
| `hireloop.ts` | Core mutations: jobs, applications, pipeline, scoring, messaging |
| `auth.ts` | Auth helpers: getCurrentProfile, getAdminOrgId |
| `enterprise.ts` | Team invites, org management |

### 7.2 Backend API (`apps/api/main.py`)

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Health check |
| `GET /interview/session/state` | Reconnect session state |
| `POST /interview/answers/chunk` | Chunked audio upload |
| `POST /admin/questions/render-audio` | TTS pre-render (internal secret) |
| `WS /ws/interview` | Live interview WebSocket |

### 7.3 Supabase Direct Access

- Server Actions: `createAdminClient()` (service role)
- Client Components: `createBrowserClient()` (anon key + RLS)
- Storage: Signed URLs for documents, snapshots, audio

---

## 8. Accessibility & Responsive

### 8.1 Accessibility

- Semantic HTML5 elements
- ARIA labels on icon-only buttons
- Focus rings (`focus-ring` utility)
- Keyboard navigation (Tab, Enter, Escape)
- Screen reader announcements for toasts
- Color contrast (WCAG AA)
- Reduced motion support (`prefers-reduced-motion`)

### 8.2 Responsive Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| `sm` | 640px | 2-col grids, form layouts |
| `md` | 768px | Sidebar collapse threshold |
| `lg` | 1024px | 4-col dashboard, 2-col detail views |
| `xl` | 1280px | Max content width |
| `2xl` | 1536px | Full-width kanban |

### 8.3 Mobile Admin

- Collapsible sidebar (hamburger menu)
- Stacked kanban columns (horizontal scroll)
- Bottom navigation for primary actions
- Touch-friendly targets (44px minimum)

---

## 9. Assets & Static Files

**Location:** `apps/web/public/`

| File | Purpose |
|------|---------|
| `favicon.ico` | Browser tab icon |
| `logo.svg` | Logo for sharing |
| `og-image.png` | Open Graph social preview |

**Fonts:** Inter (self-hosted via next/font), JetBrains Mono

---

## 10. Current Gaps for V1 (Per PLAN.md)

| Area | Current | V1 Target |
|------|---------|-----------|
| **Multi-tenant** | Single org assumed | Org switcher, department filter, RBAC UI |
| **Proctoring** | Auto-flags + ends interview | Cheating probability %, never ends, dashboard flags |
| **Scoring** | Gemini only | Hybrid: default + custom rules/weights per job |
| **Webhooks** | None | 14 events, HMAC, retry/DLQ, delivery dashboard |
| **REST API** | None | v1: jobs, apps, candidates, scores, stages, offers |
| **Calendar Sync** | None | Google/Outlook OAuth, slots, self-scheduling |
| **ATS Connectors** | None | Greenhouse, Lever bidirectional |
| **Scheduled Exports** | None | S3/SFTP/Sheets, CSV/JSON/Parquet, field mapping |
| **Qualified List** | Pipeline stage only | Dedicated page + `candidate.qualified` webhook |
| **Custom Scoring UI** | None | Weights, keywords, rubric overrides per job |
| **Department UI** | DB only | CRUD, lead assignment, scoped views |

---

*This document reflects the codebase as of 2026-07-18. Update when design system or pages change.*