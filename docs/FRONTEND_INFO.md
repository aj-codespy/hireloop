# HireLoop Frontend Design & Page Inventory

**Version:** 1.0  
**Status:** Current implementation snapshot  
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
| **Forms** | React Hook Form (via shadcn) | Latest | Form handling |
| **Date/Time** | date-fns (via Recharts) | Latest | Date formatting |
| **State** | React Context + LocalStorage | — | Client-side state, interview flow |
| **Dark Mode** | next-themes | 0.4.6 | Class-based dark mode |

### 1.2 Design Tokens (Tailwind CSS v4)

**Configuration:** `apps/web/globals.css` (CSS-first config)

```css
@theme {
  /* Colors - Brand */
  --color-brand: #FF6B00;           /* Primary orange */
  --color-brand-foreground: #ffffff;
  --color-brand-muted: #FFF3E8;     /* Light orange bg */
  --color-brand-subtle: #FFE8D6;    /* Subtle orange bg */
  
  /* Colors - Semantic */
  --color-background: #ffffff;
  --color-foreground: #0f172a;      /* slate-900 */
  --color-muted: #f1f5f9;           /* slate-100 */
  --color-muted-foreground: #64748b; /* slate-500 */
  --color-border: #e2e8f0;          /* slate-200 */
  --color-ring: #FF6B00;            /* Focus ring */
  
  /* Colors - Status */
  --color-destructive: #ef4444;     /* red-500 */
  --color-destructive-foreground: #ffffff;
  --color-success: #22c55e;         /* green-500 */
  --color-warning: #f59e0b;         /* amber-500 */
  
  /* Colors - Sidebar */
  --color-sidebar: #f8fafc;         /* slate-50 */
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

**Located in:** `apps/web/src/components/ui/`

| Component | File | Variants | Used For |
|-----------|------|----------|----------|
| Button | `button.tsx` | default, destructive, outline, secondary, ghost, link | All actions |
| ButtonLink | `button-link.tsx` | — | Styled links as buttons |
| Input | `input.tsx` | — | Text inputs |
| Textarea | `textarea.tsx` | — | Multi-line inputs |
| Select | `select.tsx` | — | Dropdowns |
| Checkbox | `checkbox.tsx` | — | Boolean inputs |
| Switch | `switch.tsx` | — | Toggle controls |
| Label | `label.tsx` | — | Form labels |
| Card | `card.tsx` | default, bordered, shadow | Content containers |
| Badge | `badge.tsx` | default, secondary, destructive, outline | Status labels |
| Avatar | `avatar.tsx` | — | User/candidate images |
| Tabs | `tabs.tsx` | — | Tabbed interfaces |
| Table | `table.tsx` | — | Data tables |
| Dialog | `dialog.tsx` | — | Modals |
| Sheet | `sheet.tsx` | — | Side panels |
| DropdownMenu | `dropdown-menu.tsx` | — | Action menus |
| Tooltip | `tooltip.tsx` | — | Hover hints |
| Progress | `progress.tsx` | — | Loading, scores |
| Separator | `separator.tsx` | — | Visual dividers |
| ScrollArea | `scroll-area.tsx` | — | Custom scrollbars |
| Sonner | `sonner.tsx` | — | Toast notifications |

### 1.5 Pattern Components

**Located in:** `apps/web/src/components/patterns/`

| Component | Purpose |
|-----------|---------|
| `section-card.tsx` | Consistent card wrapper with title, description, action |
| `metric-card.tsx` | Dashboard KPI cards with icon, value, hint, link |
| `empty-state.tsx` | Empty state with illustration, title, description, action |
| `status-badge.tsx` | Consistent status colors for all entity statuses |
| `interactive-card.tsx` | Hoverable, focusable card for lists |

### 1.6 Layout Components

**Located in:** `apps/web/src/components/layout/`

| Component | Purpose |
|-----------|---------|
| `dashboard-shell.tsx` | Main admin layout: sidebar + header + content |
| `admin-sidebar.tsx` | Left navigation (Dashboard, Jobs, Pipeline, Settings) |
| `app-sidebar.tsx` | Candidate/app layout sidebar |
| `app-header.tsx` | Top bar: search, create job, user menu |
| `admin-page-frame.tsx` | Page wrapper with breadcrumbs + page header |
| `page-header.tsx` | Title + description + optional action |
| `app-breadcrumbs.tsx` | Breadcrumb navigation |
| `admin-page-frame.tsx` | Admin-specific page wrapper |

### 1.7 Motion & Interaction Components

**Located in:** `apps/web/src/components/motion/`

| Component | Purpose |
|-----------|---------|
| `fade-in.tsx` | Staggered fade-in animations |
| `interactions.tsx` | HoverLift (card hover), PressScale (button press) |

### 1.8 Brand Assets

**Located in:** `apps/web/src/components/brand/`

| Asset | File | Description |
|-------|------|-------------|
| Logo | `logo.tsx` | Full logo with mark + wordmark |
| LogoMark | `logo-mark.tsx` | Icon-only mark (used in favicon, avatar fallback) |
| Brand Icons | `brand-icons.tsx` | Custom SVG icons for features |

**Logo Design:** Orange circular mark with "H" + "HireLoop" wordmark in slate-900

### 1.9 Icon System

- **Primary:** Lucide React (consistent 24px stroke icons)
- **Brand:** Custom SVG in `brand-icons.tsx`
- **Usage:** Always `aria-hidden` with adjacent text labels

### 1.10 Image & Asset Handling

| Type | Handling |
|------|----------|
| **Logos/Illustrations** | SVG in components (inline) |
| **Candidate Photos** | Avatar fallback with initials (no upload yet) |
| **Company Branding** | URL stored in DB, rendered via `<Image>` |
| **Proctoring Snapshots** | Signed URLs from Supabase Storage |
| **Document Previews** | File type icons + download links |
| **YouTube Videos** | Embedded iframes (normalized to youtube.com/embed/) |

### 1.11 Grid & Layout Patterns

| Pattern | Implementation |
|---------|----------------|
| **Page Container** | `mx-auto w-full max-w-[1440px] px-6 py-6` |
| **Dashboard Grid** | `grid gap-4 sm:grid-cols-2 xl:grid-cols-4` |
| **Card Grid** | `grid gap-6 lg:grid-cols-[280px_1fr]` (sidebar + content) |
| **Form Grid** | `grid gap-2 sm:grid-cols-4` (label + input + select + actions) |
| **Kanban Columns** | `grid min-w-[1100px] grid-cols-8 gap-3` (fixed width columns) |
| **Two-Column** | `lg:grid-cols-[280px_1fr]` (sticky sidebar + content) |

### 1.12 Dark Mode

- **Strategy:** Class-based (`dark` class on `<html>`)
- **Toggle:** `ModeToggle` component in header
- **Persistence:** localStorage + cookie (synced via next-themes)
- **Colors:** All semantic tokens support dark variants

---

## 2. Page Inventory - Public Pages

### 2.1 Landing Page (`/`)

**Route:** `apps/web/src/app/page.tsx` → `HomePageClient`

**Components:**
- `HomePageClient` (client wrapper for animations)
- Hero section with headline, subheadline, CTA
- Feature highlights (3 cards)
- Stats bar (companies, interviews, hours saved)
- Footer with links

**Current Content:**
```
Hero:
  Headline: "Hire smarter with AI-powered interviews"
  Subheadline: "Screen candidates 10x faster with voice AI, proctoring, and instant scoring"
  Primary CTA: "Start Free Trial" → /auth/signup
  Secondary CTA: "Watch Demo" → #demo

Features (3 cards):
  1. "AI Voice Interviews" - TTS/STT, bilingual, structured
  2. "Automated Proctoring" - Face detection, browser integrity, AI analysis
  3. "Instant Scoring" - Per-question scores, strengths/concerns, pass/fail

Stats:
  - "500+ Companies"
  - "50,000+ Interviews"
  - "10,000+ Hours Saved"

Footer: Product, Company, Resources, Legal links
```

**Interactions:**
- Framer Motion stagger animations on scroll
- Hover effects on feature cards
- CTA button press animation

---

### 2.2 Authentication Pages

#### 2.2.1 Login (`/login`)

**Route:** `apps/web/src/app/login/page.tsx`

**Components:**
- `AdminAuthForm` (email/password)
- `GoogleSignInButton`
- `AuthMethodTabs` (Email | Google)

**Fields:**
- Email (required, email type)
- Password (required, password type)
- Remember me (checkbox)
- Forgot password link
- "Don't have an account? Sign up" → /auth/signup

#### 2.2.2 Signup (`/auth/signup`)

**Route:** `apps/web/src/app/auth/signup/page.tsx` (or similar)

**Components:**
- `AdminAuthForm` (with account type selection)
- Organization details step (multi-step)

#### 2.2.3 Auth Callback (`/auth/callback`)

**Route:** `apps/web/src/app/auth/callback/route.ts`

**Purpose:** Handles Supabase OAuth redirects, sets session cookie

---

### 2.3 Candidate Public Pages

#### 2.3.1 Careers/Org Jobs (`/org/[orgId]/jobs`)

**Route:** `apps/web/src/app/org/[orgId]/jobs/page.tsx`

**Components:**
- Org branding (logo, name, primary color)
- Job list (cards with title, department, location, type)
- Filter by department
- Search by title
- "View Job" → `/apply/[jobId]`

**Current State:** Basic list, needs department filter UI

#### 2.3.2 Apply Page (`/apply/[jobId]`)

**Route:** `apps/web/src/app/apply/[jobId]/page.tsx` → `ApplyPageClient`

**Components:**
- `ApplyPageClient` (client wrapper)
- Hero: Org logo, job title, department, location, type
- About: Description, requirements, benefits
- Sidebar: Quick facts (salary, equity, remote, visa)
- `ApplicationForm` (dynamic fields from job.formFields)

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

#### 2.3.3 Candidate Login (`/candidate/login`)

**Route:** `apps/web/src/app/candidate/login/page.tsx`

**Components:**
- `CandidateAuthForm` (email/password)
- `OTPAuthForm` (magic link)
- `GoogleSignInButton`

#### 2.3.4 Candidate Signup (`/candidate/signup`)

**Route:** `apps/web/src/app/candidate/signup/page.tsx`

**Components:**
- `CandidateAuthForm` (account_type=candidate)

#### 2.3.5 Candidate Profile (`/candidate/profile`)

**Route:** `apps/web/src/app/candidate/profile/page.tsx`

**Components:**
- Profile header: Name, email, phone, resume
- Applications table: Job, Company, Status, Applied Date, Interview Link
- Interview history with scores
- Settings: Notifications, data export, delete account

**Tabs/Sections:**
1. **Profile** - Editable name, phone, resume upload
2. **Applications** - List with status badges
3. **Interviews** - Completed interviews with scores
4. **Settings** - Notification prefs, data export, delete

#### 2.3.6 Candidate Interview (`/candidate/[token]`)

**Route:** `apps/web/src/app/candidate/[token]/page.tsx` → `CandidateInterviewFlow`

**Flow Steps (State Machine):**
```
INTRO → CONSENT → PROCTORING SETUP → MIC CHECK → LIVE INTERVIEW → COMPLETE/FLAGGED
```

**Components per Step:**

| Step | Component | Key Elements |
|------|-----------|--------------|
| **INTRO** | Inline | Org video (YouTube embed), language toggle (EN/HI), "Continue" button |
| **CONSENT** | `ConsentScreen` | Recording consent, proctoring consent, data processing, "Accept" |
| **PROCTORING** | `ProctoringSetup` | Camera permission, MediaPipe face detection, calibration, fullscreen request |
| **MIC CHECK** | `MicCheck` | Audio level visualizer, test recording, playback, "Ready" |
| **LIVE** | `InterviewStructured` | WebSocket, TTS audio, question text, record/stop/next, timer |
| **COMPLETE** | Inline | Thank you, next steps, profile link |
| **FLAGGED** | Inline | Violation reason, partial review notice, profile link |

**Live Interview UI (`InterviewStructured`):**
- Header: Progress stepper (`InterviewStepper`), timer (question + overall)
- Question card: Section badge, prompt text, ideal answer notes (hidden), time limit
- Recording controls: Record (red), Stop, Next (disabled until recording)
- Proctoring panel: Camera feed, status indicators (face detected, fullscreen)
- Language: Persisted from intro selection

**Proctoring Panel (`ProctoringPanel`):**
- Live camera feed (video element)
- Face detection overlay (MediaPipe)
- Status badges: Face detected ✓, Multi-face ✗, Gaze ✓, Fullscreen ✓
- Warning toast on violations

---

## 3. Page Inventory - Admin Portal (Authenticated)

### 3.1 Layout Shell

**Wrapper:** `DashboardShell` (sidebar + header + content)
- **Sidebar:** `AdminSidebar` (Dashboard, Job Roles, Pipeline, Settings)
- **Header:** `AppHeader` (Search, Create Job, User Menu)
- **Content:** `AdminPageFrame` (Breadcrumbs + PageHeader + Content)

### 3.2 Dashboard (`/admin`)

**Route:** `apps/web/src/app/admin/(dashboard)/page.tsx` → `AdminDashboard`

**Components:**
- **Header:** Org name, greeting, action buttons (Create Job, View Pipeline, Reports)
- **Action Items:** Cards for items needing attention (expired interviews, pending reviews)
- **Metric Cards (4):**
  - Applications (total, link to /candidates)
  - Active Jobs (count, link to /jobs)
  - Interviewed (count, link to /candidates)
  - Awaiting Decision (passed AI, link to /candidates)
- **Charts Row 1:**
  - Pipeline Line Chart (lg:col-span-2) - Monthly applications + interviews
  - Sources Donut Chart - Application sources breakdown
- **Charts Row 2:**
  - Pipeline Funnel Chart - Conversion through stages
- **Recent Applications Table:** Top 8 with Name, Job, Status, Applied Date

**Interactions:**
- All metric cards link to relevant pages
- Action items link to candidate detail
- Charts have hover tooltips
- Table rows link to candidate detail

---

### 3.3 Jobs Management

#### 3.3.1 Jobs List (`/admin/jobs`)

**Route:** `apps/web/src/app/admin/(dashboard)/jobs/page.tsx`

**Components:**
- Page header: "Jobs", "Manage open roles, application forms, and interview questions"
- Action button: "Create Job" → /admin/jobs/new
- Job table (or cards) with:
  - Title, Department, Status (Live/Draft/Closed), Applications count
  - Actions: Edit, Questions, Duplicate, Archive, View Apply Link

**Current State:** Basic list, needs department filter, bulk actions

#### 3.3.2 Create Job (`/admin/jobs/new`)

**Route:** `apps/web/src/app/admin/(dashboard)/jobs/new/page.tsx` → `JobCreationWizard`

**5-Step Wizard:**

| Step | Component | Fields/Actions |
|------|-----------|----------------|
| **1. Job Details** | `JobDetailsEditor` | Title, Description |
| **2. Application Form** | `FormFieldsBuilder` | Dynamic fields, presets, drag-drop |
| **3. Interview Questions** | `JobQuestionsEditor` | Sections, mandatory/variable, count |
| **4. Rules & Thresholds** | `JobRulesEditor` | Eligibility rules, passing score, publish toggle |
| **5. Publish** | `ShareJobLink` | Copy apply link, view on careers page |

**Step 2 - Form Fields Builder:**
- Preset buttons: + Name, + Email, + Phone, + Resume, + CGPA, + Grad Year
- Custom field: Label, Type (text/number/email/phone/dropdown/doc/file), Required, Options
- Field list with edit/delete per field

**Step 3 - Questions Editor:**
- Sections: Technical, Situational, HR (sidebar filter)
- Per question: Prompt, Ideal answer, Time limit, Score threshold, Mandatory toggle, Active toggle
- Question count config: Total per interview (mandatory + variable)
- Validation: Must exceed mandatory count, not exceed pool size

**Step 4 - Rules:**
- Eligibility rules: Field, Operator (>=, <=, =), Value (from number fields)
- Passing score: Toggle + numeric input (0-10)
- Publish: Live vs Draft toggle

#### 3.3.3 Job Detail (`/admin/jobs/[id]`)

**Route:** `apps/web/src/app/admin/(dashboard)/jobs/[id]/page.tsx` → `JobDetailView`

**Tabs:**
1. **Details** - `JobDetailsEditor` (edit title, description, status)
2. **Form Fields** - `JobFormFieldsEditor` (edit application form)
3. **Questions** - `JobQuestionsEditor` (edit questions)
4. **Rules** - `JobRulesEditor` (edit eligibility, passing score)
5. **Share** - `ShareJobLink` (copy link, QR code)

#### 3.3.4 Job Questions (`/admin/jobs/[id]/questions`)

**Route:** `apps/web/src/app/admin/(dashboard)/jobs/[id]/questions/page.tsx`

**Component:** `JobQuestionsEditor` (same as wizard step 3, full page)

---

### 3.4 Candidate Pipeline

#### 3.4.1 Candidates Kanban (`/admin/candidates`)

**Route:** `apps/web/src/app/admin/(dashboard)/candidates/page.tsx` → `PipelineKanban` + `CandidatesTable`

**Views:**
- **Kanban (Default):** Columns by status
- **Table:** Sortable, filterable list

**Kanban Columns:**
```
Applied → Shortlisted → Interview Sent → Interviewed → Passed AI → Partner Review → Hired
Closed/Expired (auto_rejected, interview_expired, rejected_ai, rejected_final)
```

**Column Features:**
- Column header: Label + count badge
- Stale indicator: "X waiting 3+ days" (amber)
- Candidate cards: Avatar, Name, Job, Status badge, AI Score (if available)
- Drag-drop between columns (triggers `transitionApplicationStageAction`)

**Candidate Card:**
- Avatar (initials)
- Name (truncated)
- Job title (truncated)
- Status badge
- AI Score (if session exists)

#### 3.4.2 Candidate Detail (`/admin/candidates/[id]`)

**Route:** `apps/web/src/app/admin/(dashboard)/candidates/[id]/page.tsx` → `CandidateDetailView`

**Tabs (7):**

| Tab | Component | Content |
|-----|-----------|---------|
| **Application** | Inline | Form responses (label + value), document links |
| **Documents** | Inline | Uploaded files gallery with download |
| **Job & Interview** | Inline | Job config, questions, interview link management |
| **Proctoring** | `ProctoringLogView` | Event log, snapshot gallery, flag summary |
| **Transcript** | `TranscriptView` | Full Q&A with timestamps |
| **AI Scores** | `ScoreBreakdown` | Overall + per-question scores, strengths/concerns |
| **Scorecard** | Inline | Human review form (recommendation, score, notes) |

**Sidebar (Sticky):**
- Candidate name, email, phone
- Status badge + Job badge
- Applied date
- **Actions (by status):**
  - `passed_ai`/`shortlisted`: "Send to Final Interview"
  - `partner_review`: "Mark Hired", "Reject (Final)"
  - Any: "Regenerate Interview Link" (if expired), "Back to List"

**Proctoring Tab Details:**
- `ProctoringLogView`: Chronological events with severity icons
- `ProctoringSnapshotGallery`: Grid of webcam snapshots with timestamps
- Summary card: Flag status, warning/critical counts, reasons

**AI Scores Tab Details:**
- Overall score card: Score/10, Pass/Fail badge, progress bar
- Strengths/Concerns boxes
- Per-question cards: Prompt, Score, Answer snippet, Rationale, Red flags

**Scorecard Tab:**
- Recommendation dropdown: Strong Yes / Yes / Hold / No / Strong No
- Reviewer score (0-10)
- Notes textarea
- "Submit Scorecard" button

---

### 3.5 Other Admin Pages (Stubs/Partially Implemented)

#### 3.5.1 Requisitions (`/admin/requisitions`)
**Route:** `apps/web/src/app/admin/(dashboard)/requisitions/page.tsx`
**Current:** Placeholder page, table structure exists in DB

#### 3.5.2 Scheduling (`/admin/scheduling`)
**Route:** `apps/web/src/app/admin/(dashboard)/scheduling/page.tsx`
**Current:** Placeholder, `interview_schedules` table exists

#### 3.5.3 Offers (`/admin/offers`)
**Route:** `apps/web/src/app/admin/(dashboard)/offers/page.tsx`
**Current:** Placeholder, `offers` table exists

#### 3.5.4 People Search (`/admin/people-search`)
**Route:** `apps/web/src/app/admin/(dashboard)/people-search/page.tsx`
**Current:** Placeholder

#### 3.5.5 Reports (`/admin/reports`)
**Route:** `apps/web/src/app/admin/(dashboard)/reports/page.tsx`
**Current:** Placeholder

#### 3.5.6 Compliance (`/admin/compliance`)
**Route:** `apps/web/src/app/admin/(dashboard)/compliance/page.tsx`
**Current:** Placeholder

#### 3.5.7 Company Settings (`/admin/company`)
**Route:** `apps/web/src/app/admin/(dashboard)/company/page.tsx`
**Components:** Org branding (logo, color, intro video, website, about)
**Actions:** Save changes → `updateOrganizationAction`

#### 3.5.8 Settings (`/admin/settings`)
**Route:** `apps/web/src/app/admin/(dashboard)/settings/page.tsx`
**Tabs:**
- **Profile:** Name, avatar, password
- **Team:** `InviteTeamMemberForm` (email + role dropdown)
- **Organization:** Links to /admin/company

---

## 4. Component Inventory Summary

### 4.1 By Category

| Category | Count | Key Files |
|----------|-------|-----------|
| **UI Primitives** | 22 | `components/ui/*.tsx` |
| **Patterns** | 5 | `components/patterns/*.tsx` |
| **Layout** | 7 | `components/layout/*.tsx` |
| **Brand** | 3 | `components/brand/*.tsx` |
| **Motion** | 2 | `components/motion/*.tsx` |
| **Charts** | 3 | `components/charts/*.tsx` |
| **Auth** | 5 | `components/auth/*.tsx` |
| **Admin** | 1 | `components/admin/*.tsx` |
| **Candidates** | 7 | `components/candidates/*.tsx` |
| **Candidate (Interview)** | 8 | `components/candidate/*.tsx` |
| **Jobs** | 8 | `components/jobs/*.tsx` |
| **Reports** | 3 | `components/reports/*.tsx` |
| **Questions** | 1 | `components/questions/*.tsx` |
| **Dashboard** | 2 | `components/dashboard/*.tsx` |
| **Icons** | 1 | `components/icons/*.tsx` |
| **Total** | ~86 | — |

### 4.2 Key Reusable Components

| Component | Used In | Props |
|-----------|---------|-------|
| `StatusBadge` | Everywhere | `status`, `className` |
| `MetricCard` | Dashboard | `label`, `value`, `hint`, `icon`, `href` |
| `SectionCard` | Admin pages | `title`, `description`, `action`, `children`, `noPadding` |
| `HoverLift` | Lists, cards | `children` |
| `FadeIn` / `FadeInStagger` | Page transitions | `children`, `delay` |
| `ApplicationDocumentLink` | Candidate detail | `document` |
| `ProctoringSummaryCard` | Candidate detail | `session` |
| `InterviewStepper` | Interview flow | `current` |

---

## 5. Current Gaps & Inconsistencies

### 5.1 Missing Pages (Per V1 Plan)
- [ ] Org Switcher (header dropdown)
- [ ] Department Management (`/admin/departments`)
- [ ] Custom Scoring Rules UI (in Job Questions Editor)
- [ ] Qualified Candidate List (`/admin/qualified`)
- [ ] Integration Settings (`/admin/settings/integrations`)
- [ ] Calendar Sync Settings
- [ ] Candidate Self-Scheduling (`/candidate/schedule/[id]`)
- [ ] Interviewer Dashboard
- [ ] Webhook Manager UI
- [ ] Scheduled Exports UI
- [ ] ATS Connector Config UI

### 5.2 Inconsistent Patterns
| Issue | Locations | Fix |
|-------|-----------|-----|
| **Table vs Card views** | Candidates (both), Jobs (cards only) | Standardize with view toggle |
| **Empty states** | Some pages use `EmptyState`, others inline | Use `EmptyState` everywhere |
| **Loading states** | Skeleton loaders in dashboard, spinners elsewhere | Standardize skeletons |
| **Error boundaries** | Missing on interview pages | Add per-page error boundaries |
| **Department filter** | Only in jobs list, not candidates/reports | Global department context |

### 5.3 Accessibility Gaps
- [ ] Focus management in modals/dialogs
- [ ] Live regions for toast announcements
- [ ] Proper heading hierarchy (h1→h2→h3)
- [ ] ARIA labels on icon-only buttons
- [ ] Color contrast verification

---

## 6. Asset Inventory

### 6.1 Static Assets (`apps/web/public/`)
| Asset | Purpose |
|-------|---------|
| `favicon.ico` | Browser tab icon |
| `og-image.png` | Open Graph social preview |
| `robots.txt` | SEO |
| `manifest.json` | PWA manifest |

### 6.2 Dynamic Assets (Supabase Storage)
| Bucket | Contents | Access |
|--------|----------|--------|
| `question-audio` | Pre-rendered TTS (EN/HI) | Public |
| `interview-answers` | Candidate audio recordings | Private (service role) |
| `proctoring-snapshots` | Webcam snapshots | Private (service role) |
| `application-documents` | Resumes, certificates | Private (service role) |

---

## 7. Environment-Specific Config

### 7.1 Environment Variables (Frontend)
```env
# apps/web/.env.local
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_API_URL=http://localhost:8000
INTERVIEW_INTERNAL_SECRET=...  # Server-only, used in actions
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 7.2 Feature Flags (Runtime)
```typescript
// lib/config.ts
export const FEATURES = {
  multiTenant: false,        // Not yet implemented in UI
  departments: false,        // DB ready, UI missing
  customScoring: false,      // DB ready, UI missing
  webhooks: false,           // Not implemented
  calendarSync: false,       // Not implemented
  atsConnectors: false,      // Not implemented
};
```

---

## 8. Migration Notes for V1

### 8.1 Components to Create (Priority Order)
1. `OrgSwitcher` (header) - Multi-tenant foundation
2. `DepartmentManager` - Department CRUD + lead assignment
3. `DepartmentFilter` (global) - Context provider + filter bar
4. `CustomScoringRulesEditor` - In JobQuestionsEditor
5. `ProctoringProbabilityBadge` - Replace flag indicator
6. `QualifiedCandidateList` - New page with export/webhook actions
7. `WebhookManager` - Subscriptions, test, logs, replay
8. `ScheduledExportsManager` - Config + run history
9. `ATSConnectorConfig` - Greenhouse, Lever field mapping
10. `CalendarSyncSettings` - OAuth + availability preview
11. `CandidateSelfSchedulingPage` - Slot selection + confirmation
12. `InterviewerDashboard` - My interviews, scorecards

### 8.2 Components to Modify
| Component | Change |
|-----------|--------|
| `AdminSidebar` | Add Departments, Qualified, Integrations, Communication |
| `AdminDashboard` | Add department filter, team performance, action items for proctoring |
| `CandidateDetailView` | Add communication timeline tab, department tags |
| `JobQuestionsEditor` | Add Custom Scoring Rules section |
| `ProctoringLogView` | Show cheating probability, remove auto-flag language |
| `ScoreBreakdown` | Show custom rules applied indicator |
| `AppHeader` | Add org switcher, department filter |
| `PipelineKanban` | Add department swimlanes, bulk actions |
| `Settings Page` | Add Integrations, Pipeline, Proctoring, Compliance, Billing tabs |

---

*This document reflects the codebase state as of 2026-07-18. Update as implementation progresses.*