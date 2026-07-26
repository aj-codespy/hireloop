# HireLoop Demo Script

> **Duration:** ~20 minutes  
> **Goal:** Prospect leaves understanding HireLoop replaces their screening stack.  
> **Setup:** Open the app at a seeded org with 2-3 jobs, a few candidates, and some interview data. Sign in to the admin account.

---

## Part 1: The Hook — Landing Page (2 min)

**URL:** `/`

Start here to set the context.

```
Structured interviews. Reviewable evidence. Defensible decisions.
```

**Narrate:**
> "Most hiring teams spend 70% of their time on screening — scheduling calls, reviewing resumes, coordinating interviewers. HireLoop handles the entire screening layer so your team only sees qualified, interview-verified candidates."

**Point to:**
- The headline — "Structured interviews. Reviewable evidence. Defensible decisions."
- The tagline — "HireLoop runs consistent, proctored voice interviews..."
- The dashboard preview image below the fold
- Trust strip: SOC 2 ready, GDPR controls, Encryption, Audit logs, Role-based access

**Click "Start Hiring"** → `/auth/signup`

---

## Part 2: Auth & First Log-in (1 min)

**URL:** `/auth/signup`

> "Sign up takes 30 seconds. Your org is created automatically."

**OR** if pre-seeded, navigate to `/admin/login` and sign in.

After log-in → redirected to `/admin`

---

## Part 3: The Admin Dashboard (3 min)

**URL:** `/admin`

Your dashboard home — show the overview:

1. **Org name** in the sidebar header
2. **Greeting + stat cards** — Applications, Active jobs, Interviewed, Awaiting decision
3. **Action items** — candidates needing attention (if any)
4. **Charts row:**
   - Applications over time (line chart)
   - Sources (donut)
   - Activity feed
5. **Pipeline funnel** — conversion through each stage
6. **Recent applications table** — latest candidates

**Narrate:**
> "Everything a recruiter needs in one view — how many candidates are flowing through, where they're stuck, and what needs attention. No context switching."

---

## Part 4: Creating a Job (3 min)

**URL:** `/admin/jobs` → Click "Create job" → `/admin/jobs/new`

Walk through job creation:

1. **Title** — "e.g. Senior Software Engineer"
2. **Eligibility rules** — toggle on, add screening criteria (e.g. "5+ years Python")
3. **Questions** — click "Add from question bank" → pick 3-5 questions
4. **Scorecard** — show the scoring rubric with pass threshold
5. **Save / Publish**

> "Define what matters once. Every candidate gets the same questions, same rubric, same bar."

---

## Part 5: Candidate Side — Application & Interview (4 min)

### Apply Page
**URL (mock):** `/apply/[job-id]`

> "Candidates hit a branded apply page. No account needed."

- Show the application form (name, email, phone, resume upload, custom fields)
- Submit → candidate receives a secure interview link

### Interview Portal
**URL:** `/candidate/[token]`

This is the make-or-break screen.

- **Left panel:** The AI asks questions one at a time
- **Recording UI:** Waveform visualization, timer
- **Transcript:** Shows what the candidate said in real-time
- **Proctoring:** Integrity signals running in the background

**Narrate:**
> "Candidates complete the interview on their schedule — phone, tablet, desktop. The AI asks each question, records the answer, transcribes it, and scores it against your rubric. Proctoring detects tab-switching, background noise, or unusual activity."

**Key sell:**
> "Every answer has: full transcript, original audio, AI score with written rationale, and proctoring context. Nothing is hidden."

---

## Part 6: Recruiter Review — Candidate Detail (4 min)

**URL:** `/admin/candidates/[id]`

This is where the value compound interest shows.

1. **Candidate header** — name, email, phone, status badge
2. **Scorecard** — per-question scores with AI rationale
3. **Transcript panel** — full interview transcript with timestamps
4. **Audio playback** — listen to any answer
5. **Proctoring timeline** — integrity events (tab switches, audio anomalies)
6. **Documents** — resume, cover letter, any uploads
7. **Stage changer** — advance, reject, or schedule a human interview

**Narrate:**
> "Instead of scheduling a phone screen for every candidate, you review the evidence here. AI handled the screening consistency. You own the judgment. If it's a pass, you advance them. If you need more, schedule a human interview with one click."

**Click "Schedule interview"** → `/admin/scheduling`

---

## Part 7: The System Boundary — Webhooks (2 min)

**URL:** `/admin/webhooks`

> "HireLoop plugs into your existing stack."

Show the webhook manager:
- `candidate.qualified` — fires when a candidate passes AI + human review
- `candidate.rejected` — fires on rejection
- `interview.completed` — fires when interview is done

> "HireLoop owns the interview. You own the offer. When a candidate qualifies, we ping your ATS or HRIS via webhook with the full record. Your team handles compensation, negotiation, and the final relationship."

---

## Part 8: Pricing & Close (1 min)

**URL:** `/admin/settings` → show billing / plan info (or state verbally)

> **Pricing:**
> - $299/month — 50 interviews
> - $999/month — 250 interviews  
> - $2999/month — 1000 interviews
>
> No per-seat fees. No setup costs. Cancel anytime.

**Close:**
> "Want to get your team running on HireLoop? I can set up a trial org with your first role in 15 minutes."

---

## URL Reference Cheatsheet

| Purpose | URL |
|---------|-----|
| Landing page | `/` |
| Demo hero (standalone) | `/hero` |
| Admin login | `/admin/login` |
| Sign up | `/auth/signup` |
| Dashboard | `/admin` |
| Jobs list | `/admin/jobs` |
| Create job | `/admin/jobs/new` |
| Candidates list | `/admin/candidates` |
| Candidate detail (replace [id]) | `/admin/candidates/[id]` |
| Scheduling | `/admin/scheduling` |
| Reports | `/admin/reports` |
| Webhooks | `/admin/webhooks` |
| API Keys | `/admin/api-keys` |
| Company settings | `/admin/company` |
| Settings | `/admin/settings` |
| Candidate signup | `/candidate/signup` |
| Candidate login | `/candidate/login` |
| Candidate interview (replace [token]) | `/candidate/[token]` |
| Apply page (replace [jobId]) | `/apply/[jobId]` |
| Schedule page (replace [token]) | `/schedule/[token]` |

---

## Pro Tips

**If the prospect is a hiring manager:**
- Focus on Parts 3, 4, 6 — the recruiter UI
- Skip Part 7 (webhooks) unless they ask about integrations

**If the prospect is an engineer/CTO:**
- Focus on Parts 5, 6, 7 — the architecture, proctoring, webhooks, API
- Mention the stack: Next.js 16, TypeScript, Supabase, Gemini AI, GSAP animations
- Show `/admin/api-keys`

**If the prospect is a founder/CEO:**
- Focus on Parts 1, 3, 5, 8 — the vision, dashboard, candidate experience, pricing
- Emphasize: "You own the offer" — HireLoop is a tool, not a replacement for their hiring process

**Handling the "empty org" problem:**
Before the demo, seed the org with:
- 3 jobs (Senior Engineer, Accountant, Product Manager)
- 15-20 candidates in various stages
- 5 completed interviews with AI scores
- 2 action items needing attention

**Objection handling:**
- *"We already use [Tool]."* → "HireLoop replaces 4 tools: scheduling, video interview, scorecard, and spreadsheet tracking. One platform, one record, one workflow."
- *"We need human interviews."* → "HireLoop handles the screening layer. Your best interviewers only see qualified, pre-scored candidates. It's force multiplication, not replacement."
- *"Can we white-label it?"* → "Enterprise plan includes custom domain and branding. Let's start with the standard and upgrade when you're ready."
