# HireLoop - Page-by-Page Design & UX Prompts

**Stack:** Next.js 15 (App Router) + Tailwind v4 + Framer Motion (`motion/react`) + shadcn/ui.
**Tokens already in `globals.css` (use these, do not redefine):** brand `#ff6b00` (dark `#ff7a1a`), `--brand-muted #fff4eb`, `--brand-subtle #fff9f5`, Geist sans/mono via `next/font`, radius `0.75rem` (pill buttons = `rounded-full`, cards = `rounded-2xl`), dark mode via `.dark` class. Fonts: **Geist** + **Geist Mono**. Icons: Phosphor Icons (`@phosphor-icons/react`), one family, `strokeWidth` 1.5, no hand-rolled SVGs.

**Global UX laws (apply to every page):**
- One accent (orange). No AI-purple, no second accent. Shape lock: pill buttons, 16px cards, 8px inputs.
- Zero em-dashes in any copy. One CTA intent per action. WCAG AA contrast (AA 4.5:1 body, AAA target for hero).
- Every page motion gated behind `prefers-reduced-motion` (`useReducedMotion`). No `window.scroll` listeners; use `useScroll` / `IntersectionObserver`.
- Real data states for every surface: loading skeleton, empty state, error state, success state.
- Mobile collapses to single column, `min-h-[100dvh]` for full-height surfaces, no `h-screen`.
- `'use client'` only on motion/interactive leaf components; Server Components for layout.
- Navigation never exceeds 72px; admin uses a left collapsible sidebar (existing shadcn sidebar tokens).

---

# 1. Landing Page (`/`)

> Build a Next.js 15 + Tailwind v4 + Framer Motion (`motion/react`) landing page for HireLoop, an AI voice-interview platform for high-volume hiring. Audience: non-technical HR / talent-acquisition leaders (mid-market to enterprise). Immersive, cinematic, clarity-first.
>
> **Palette:** brand orange `#FF6B00` single accent (no AI-purple), bg `#FAFAFB`, ink `#0F1115`, cards `#FFFFFF`, hairline `#ECECEF`. Dark via `.dark`. Fonts Geist + Geist Mono (`next/font`). Radius lock: buttons `rounded-full`, cards `rounded-2xl`, inputs `rounded-lg`.
>
> **Motion (`MOTION_INTENSITY 7`):** hero entry fade+rise; `whileInView` scroll-reveal stagger per section; a scroll-pinned 5-step workflow (Apply -> AI Interview -> Proctoring -> Scoring -> Qualified Handoff) with a persistent orange "you are here" progress dot; spring/magnetic hover on CTAs. All gated behind `prefers-reduced-motion`.
>
> **Hero (fits viewport, CTA visible without scroll):** asymmetric split. Left: eyebrow "AI interview infrastructure", H1 <=2 lines **"Resumes guess. Interviews prove."**, subtext <=20 words "HireLoop runs voice AI interviews at scale, then hands your team a shortlist of qualified candidates.", primary CTA "Start free" + secondary "Watch a 90s demo". Right: a **live interactive AI-interview visual** = real candidate-interview UI frame with an animated orange voice-waveform, a current question card ("Tell me about a time you resolved a conflict"), a transcript line typing in, and a small "cheating probability 22%" badge. Real component, not a fake screenshot. Below hero: "Trusted by" logo wall, real SVG logos (logo-only).
>
> **Sections (different layout family each, max 1 eyebrow per 3):** (1) Problem band, 3-4 big mono numbers; (2) pinned 5-step workflow; (3) Capabilities alternating splits (voice / proctoring / scoring / orchestration) each ending "So you can..."; (4) System-boundary two-column "HireLoop owns / You own" + `candidate.qualified` webhook line; (5) live ticker "Interviews completed today: 1,240 / Candidates qualified this week: 312"; (6) integrations logo grid; (7) security & fairness (audit trail, proctoring transparency, human override); (8) 2-3 testimonials <=3 lines with headshots; (9) pricing 4 tiers per-interview "no per-seat", one CTA label; (10) final CTA + structured footer.
>
> **Hard rules:** zero em-dashes; no Inter; no 3-equal-card clichés; no fake div dashboards; one CTA intent; real images only; nav single line <=72px frosted on scroll. Output runs with `npm run dev`, fully responsive.

---

# 2. Role Chooser (`/login`)

> A calm, two-path entry screen that splits the product by who you are, reinforcing brand identity immediately. Center or asymmetric split with two large branded cards: "Hiring team" (icon: `UsersThree` / `SquaresFour`) -> `/admin/login`, and "Candidate" (icon: `UserCircle`) -> `/candidate/login`. Each card: icon in an orange-tinted rounded square, title, one-line value ("Manage jobs, review candidates, move your pipeline" / "Track applications, complete interviews, view status"), and a ghost CTA. Sub-copy: "Choose how you're using HireLoop today." Include a subtle orange orbital/glow behind the active card on hover (Framer Motion spring). Add a small "Have an interview link?" deep-link input that routes to `/candidate/[token]`. Keep it to one screen, no scroll. Empty/zero-confusion: clearly state these are two different portals. Use brand tokens; light theme only with dark toggle in nav.

---

# 3. Admin Sign-In (`/admin/login`)

> Trust-first auth screen for the hiring team. Left: a branded panel with the HireLoop mark, a one-line proof point ("Structured hiring from application to decision"), and a quiet product visual (mini workflow strip: Apply -> Interview -> Score). Right: the auth form card (`rounded-2xl`, border `border`, focus ring orange). Fields: work email (label above, helper text below), password (with show/hide toggle icon `Eye`/`EyeSlash`), "Sign in" primary (orange pill, `scale-[0.98]` on active), and "Forgot password?" ghost link. Below: "All sign-in options" with SSO button (icon `MicrosoftLogo` / `GoogleLogo`) if enabled. Real states: loading spinner replaced by skeleton button; inline error text below field (red, AA contrast); success redirects to `/admin`. No version labels, no decorative dots. One CTA intent ("Sign in"). Mobile: stack, brand panel becomes a slim header.

---

# 4. Candidate Sign-In / Sign-Up (`/candidate/login`, `/candidate/signup`)

> Reassuring, low-friction portal entry for applicants. Same split as admin but warmer copy: "Your applications, interviews, and next steps, in one place." Tabbed auth (`signup` default from `/signup`): Sign in (email + password) and Create account (email, password, confirm, with inline strength meter using orange segments). Use `CandidateAuthForm` with tabs. Add a calming micro-copy line under the form: "Your interview link is the fastest way in, no password needed." Success -> `/candidate/profile`. Error/empty states explicit. Icons: `Envelope`, `Lock`, `UserPlus`. Motion: tab slide (Framer Motion layout), 200ms spring. No em-dashes, one CTA per tab.

---

# 5. Public Org Job Board (`/org/[orgId]/jobs`)

> A clean, on-brand public careers page for a single organization. Header: org name + small mark, one line "We're hiring. Apply in minutes." Grid of live jobs (`JobCard`: title, department tag (primary dept emphasized), location/remote, "N application fields" hint, estimated interview length, and an orange "Apply" pill). Filter bar (sticky, `rounded-full` chips): by department, remote/onsite, keyword search (icon `MagnifyingGlass`). Empty state: "No live jobs are accepting applications right now." with a subscribe-to-alerts input. Each card hover: lift `-translate-y-1` + orange border glow (spring). Loading: skeleton cards (same shape). Respect `min-h-[100dvh]`. This page must read as the employer's brand extended by HireLoop, not a generic board. One CTA intent ("Apply").

---

# 6. Job Application (`/apply/[jobId]`)

> A stepwise, calming application flow that feels like a guided conversation, not a form. Progress stepper at top (orange filled segments: "Details -> Questions -> Review"), with clear "Step 2 of 3". Sections: (1) Contact details (name, email, phone) with label-above inputs and inline validation; (2) dynamic `formFields` rendered from job config (text, select, file upload for resume with `Upload` icon and drag-drop zone tinted orange on dragover); (3) eligibility rules shown as plain-language checks ("This role requires you to be based in the EU" with a toggle/confirm). Review step: read-only summary card + "Submit application" (orange pill). On submit: optimistic skeleton -> success state ("Application received. Your interview link is on the way") with next-step CTA "Go to interview" if eligible. Error: inline per-field, never a dead end. Motion: step transition slide (Framer Motion `AnimatePresence`), 250ms. Mobile: single column, stepper becomes a compact bar. Zero em-dashes; clear, no jargon.

---

# 7. Candidate Interview (`/candidate/[token]`)

> The marquee candidate surface. A focused, immersive, full-height interview room (`min-h-[100dvh]`) that makes the applicant feel safe and clear. Layout: centered column, max-width, with a persistent top bar showing job title + a calm timer (icon `Timer`) and "You can pause anytime" reassurance. Core: a large voice-waveform orb (orange, animated with mic level via `useMotionValue`, not `useState`), the current question card (`Question` block: section tag, prompt text, time-limit hint), and a live transcript panel that streams the candidate's words (mono font, fade-in lines). Controls: "Start" / "Pause" / "End" with icon `Microphone`, `Pause`, `PhoneDisconnect`, tactile `scale-[0.98]` on press. States: pre-interview (clear intro: what to expect, ~minutes, mic/cam check with `VideoCamera`/`Microphone` toggles), in-progress (waveform live, progress dots per question), post (thank-you + "You'll hear from the team soon"). Proctoring is invisible to the candidate except a tiny reassurance line ("Your session is being kept fair and secure"). Accessibility: captions toggle, keyboard reachable controls, `prefers-reduced-motion` stops waveform animation (static ring). Real component, no fake screenshot. This is where brand trust is won; make it premium, calm, and unmistakably HireLoop.

---

# 8. Candidate Portal (`/candidate/profile`)

> The applicant's home base: a calm dashboard of "where I am" for every role. Header: "Hi, {name}" + avatar (generated initials in orange circle). Sections: (1) Active applications grid (`ApplicationCard`: role, stage pill color-coded by status, last update, "Resume interview" / "View status" CTA); (2) Completed interviews with a gentle score-summary ("You completed the interview for {role}") and next-step note; (3) Saved/closed. Empty state: "You haven't applied yet" + "Browse open roles" CTA. Use status pills with semantic color (orange = in-progress, green = qualified, zinc = closed), never decorative dots. Motion: cards reveal on scroll (`whileInView`). One CTA intent per card. Mobile: single column. This page must reduce anxiety, not create it: plain language, no recruiter jargon.

---

# 9. Admin Dashboard Overview (`/admin/(dashboard)`)

> The hiring team's command center. Left collapsible sidebar (shadcn tokens, orange active item, icons Phosphor: `SquaresFour` overview, `Briefcase` jobs, `Users` candidates, `Calendar` scheduling, `FileSearch` requisitions, `Target` people-search, `Handshake` offers, `ShieldCheck` compliance, `ChartBar` reports, `Gear` settings). Top bar: org switcher + search + "New job" primary (orange pill) + avatar. Overview content: (1) KPI row (4 stat tiles, mono numbers: open roles, interviews this week, qualified candidates, avg time-to-shortlist); (2) Pipeline funnel (Apply -> Interview -> Scored -> Qualified) as a horizontal stepped bar with orange fill; (3) Recent activity feed (icon + text + relative time, real data); (4) "Needs attention" stack (stalled candidates, flagged proctoring). Motion: KPI count-up on view (`useInView` + `animate`), tiles stagger. Loading: skeleton grid. Empty: friendly "Create your first job" CTA. Dark mode via `.dark`. One CTA intent ("New job").

---

# 10. Jobs List (`/admin/(dashboard)/jobs`)

> A dense-but-breathable table/list of all roles. Toolbar: search (`MagnifyingGlass`), department filter chips, status filter (draft/live/closed), "New job" pill. Rows (or cards on mobile): job title + department tag, status pill, # applicants, # interviewed, # qualified (mono), updated time, row action "Open" (chevron). Hover: row highlight + orange left border. Sortable columns. Empty: "No jobs yet" + CTA. Loading: skeleton rows. Use the existing shadcn `Table`/`Card` tokens; keep one accent. Clicking a row -> `/jobs/[id]`. One CTA intent.

---

# 11. New Job (`/admin/(dashboard)/jobs/new`)

> A guided job builder in steps (not one giant form), matching the application stepper pattern for consistency. Steps: (1) Basics (title, department with primary-tag selector, description, location/remote); (2) Eligibility rules (toggle list with plain-language builder); (3) Interview config (question count slider, passing score, re-attempts toggle, custom-scoring-rules JSON helper with live preview link); (4) Application form fields (add/remove field builder: text/select/file, drag-to-reorder with `ArrowLineUpDown`); (5) Review + Publish. Persist draft per step (no data loss on back). Inline validation, orange primary "Publish job" + ghost "Save draft". Motion: step slide (`AnimatePresence`). Empty/error states explicit. This is where admins spend real time: make it fast, obvious, and branded.

---

# 12. Job Detail (`/admin/(dashboard)/jobs/[id]`)

> A tabbed job workspace: Overview (stats + recent candidates), Questions (links to `/questions`), Candidates (filtered list), Settings. Header: job title + status pill + "Edit" ghost + "View public page" link (-> `/org/[orgId]/jobs` or `/apply/[jobId]`). Overview: KPI tiles (applicants, interviewed, qualified, avg score), a mini pipeline, and a "Top candidates" preview (3 cards). Use `Tabs` (shadcn) with orange active underline. Motion: tab content fade. One primary CTA ("Edit" or "Publish"). Keep it scannable; no wall of text.

---

# 13. Job Questions Editor (`/admin/(dashboard)/jobs/[id]/questions`)

> The interview blueprint editor. List of questions as draggable cards (icon `LinesThree`, drag handle `ArrowLineUpDown`): section tag (behavioral/technical), prompt text, ideal-answer notes, time limit. Add question (orange pill), edit inline, delete with confirm. A right-side "Preview" panel shows the candidate-facing question card live (reuse the interview `Question` component) so admins see exactly what applicants get. "Generate with AI" secondary (icon `Sparkle`) optionally drafts questions from the job description. Motion: card reorder spring (Framer Motion `Reorder`). Empty: "No questions yet, add your first." This screen proves HireLoop's transparency: what we ask = what we score.

---

# 14. Candidates List (`/admin/(dashboard)/candidates`)

> The shortlist workspace. Toolbar: search, job filter, stage filter (applied/interviewed/scored/qualified), sort by score. Grid or table of candidate cards: avatar/initials, name, role, stage pill, overall score (big mono, orange if qualified), "Open" -> detail. A "Qualified only" toggle (orange) surfaces the handoff-ready list prominently. Hover: lift + orange glow. Loading: skeletons. Empty: "No candidates yet for this job." Motion: `whileInView` stagger. One CTA intent ("Open"). This is the payoff surface: make qualified candidates feel like a gift, not a spreadsheet.

---

# 15. Candidate Detail (`/admin/(dashboard)/candidates/[id]`)

> A two-column depth view. Left: candidate header (avatar, name, role, stage pill, overall score ring in orange), and a vertical timeline of the journey (Applied -> Interviewed -> Scored -> Qualified) with orange completed nodes. Right: the scorecard, reused from scoring design: per-question rows (question, 0-10 score bar without background track, strengths/concerns text), proctoring summary ("cheating probability 22%, 3 flags reviewed" with `ShieldCheck`/`Warning`), and transcript link. Actions: "Advance stage" (orange), "Request human review" (ghost), "Export" (`Export` icon), and the `candidate.qualified` webhook status chip ("Sent to your ATS" / "Pending"). Motion: timeline draw on scroll. Empty/error: explicit. This page must make a hiring decision feel informed and defensible.

---

# 16. Scheduling (`/admin/(dashboard)/scheduling`)

> Human-round orchestration. Calendar sync status card (Google/Outlook connected icons `GoogleLogo`/`MicrosoftOutlookLogo`, "Connect" if not). A weekly grid (or list on mobile) of interview slots with self-scheduling links (`Link` icon to copy). "Create slot" opens a small dialog (shadcn `Dialog`): date, time, interviewer, candidate. List of pending invites with status (sent/accepted/declined) using semantic pills, not decorative dots. Motion: dialog spring, list reveal. Empty: "Connect a calendar to start scheduling." One CTA ("Create slot"). Keep it calm; scheduling is where friction lives, so reduce it.

---

# 17. Requisitions (`/admin/(dashboard)/requisitions`)

> Internal hiring-request tracker. List of requisitions: title, dept, requested-by, # positions, status pill (draft/approved/in-progress), linked job. "New requisition" pill. Approval flow shown as a small stepper per row. Empty: "No open requisitions." Use the same table/card tokens as Jobs for consistency. One CTA intent.

---

# 18. People Search (`/admin/(dashboard)/people-search`)

> A talent-pool explorer. Search bar (name, skill, past role) with filter chips (department, status, sourced). Results as candidate mini-cards (reuse Candidate Card) with "Add to job" action (`Plus`). A right "Shortlist" tray (slide-over) holds selected people. Motion: tray slide (`AnimatePresence`), card hover lift. Empty: "No matches, try broadening filters." This is a power feature; keep it fast and obvious, not cluttered.

---

# 19. Offers (`/admin/(dashboard)/offers`)

> The handoff boundary, stated plainly. A banner at top: "HireLoop qualifies candidates. Your ATS owns offers, background checks, and onboarding." List of qualified candidates handed off via `candidate.qualified` webhook: name, role, webhook status (Sent / Failed / Retry), destination (ATS name), timestamp. "Retry" (`ArrowCounterClockwise`) on failed. Empty: "No handoffs yet, qualified candidates will appear here." This page is the proof of our system boundary: make it unambiguous so customers never think we do offers. One CTA ("Retry" only on failure).

---

# 20. Compliance (`/admin/(dashboard)/compliance`)

> Trust and audit surface. Sections: (1) Proctoring transparency: explanation of cheating-probability + a sample flagged session; (2) Audit trail: a filterable log of scoring decisions with "why" (reuse the scorecard reasoning); (3) Bias/ fairness: summary stats (e.g. "Scores reviewed by humans: 100%"); (4) Data residency + security cards (icons `ShieldCheck`, `Lock`). Motion: section reveal. This page answers "is this defensible?" for procurement. Plain language, no fear-mongering.

---

# 21. Reports (`/admin/(dashboard)/reports`)

> Insight, not dashboards-for-show. A small set of focused charts (shadcn `Chart` tokens, orange `#ff6b00` as `chart-1`): time-to-shortlist trend, funnel conversion, score distribution, drop-off by stage. Each chart in a `rounded-2xl` card with a one-line takeaway ("40% of applicants don't start the interview, send a reminder"). Export buttons (`Export` icon) per chart. Empty: "Not enough data yet." Motion: chart draw-in on view. Keep to 4-6 charts max; no cockpit density.

---

# 22. Settings (`/admin/(dashboard)/settings`)

> Tabbed config: Organization (name, logo upload, departments with primary-tag manager), Members (invite, role pills), API Keys (scoped key list with `Plus` to create, eye-to-reveal once, revoke with confirm, copy `Copy` icon), Webhooks (endpoint list, event toggles, "Send test" `PaperPlane`), Integrations (ATS/HRIS/calendar connect cards), Billing (plan, usage, "Manage" ghost). Use `Tabs` with orange underline. Motion: tab fade. Forms: label-above, inline validation, orange primary save. One CTA intent per tab. This is where scoped API keys live (matches backend): show scopes as clear chips (read/write/admin per resource).

---

# 23. Company (`/admin/(dashboard)/company`)

> Organization profile + branding. Edit org name, upload logo (drag-drop zone), set primary brand color is NOT allowed (we keep HireLoop orange) but allow org logo + display name. Departments manager (add tag, mark primary). Locations. Motion: save toast (Framer Motion, top-right, auto-dismiss). Keep minimal; this is config, not marketing.

---

## Cross-Page Consistency Checklist (run before any page ships)
- [ ] Uses `--brand` orange only; no second accent; no AI-purple.
- [ ] Geist + Geist Mono; radius lock (pill/card/input); dark mode tokens correct.
- [ ] Phosphor icons, `strokeWidth 1.5`, one family; no hand-rolled SVG.
- [ ] Zero em-dashes in copy; one CTA intent per action.
- [ ] Loading / empty / error / success states present on every data surface.
- [ ] `prefers-reduced-motion` honored on all motion.
- [ ] Mobile single-column collapse; `min-h-[100dvh]` for full-height surfaces.
- [ ] Nav/sidebar <=72px; active item orange.
- [ ] WCAG AA contrast verified (esp. buttons, forms, pills).
- [ ] System boundary (HireLoop owns interview, you own offer) reinforced on Offers + landing.

*Generated 2026-07-20. Tokens pulled from `apps/web/src/app/globals.css`. Build-ready prompts for design testing.*
