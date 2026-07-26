# HireLoop V1 Missing Admin Features Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Implement the 4 critical missing admin UI features identified in the V1 audit: Question Bank Admin UI, Scorecard UI, Proctoring Review Dashboard, and Calendar Integration for Scheduling.

**Architecture:** Next.js 16 (App Router) + React 19 + Tailwind 4 + shadcn/ui components. All features use existing Supabase-backed API endpoints and Zustand store (`useHireLoop`). Follow existing patterns: Server Components for data fetching, Client Components for interactivity, Server Actions for mutations.

**Tech Stack:**
- Frontend: Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, Lucide icons
- State: Zustand (`lib/store/provider.tsx`) with TanStack Query-style hooks
- API: FastAPI (existing) - no backend changes needed
- Database: Supabase (PostgreSQL) - existing schema supports all features
- Animation: Custom `FadeIn`, `HoverLift`, Framer Motion patterns
- Charts: Recharts (existing `PipelineLineChart`, `PipelineFunnelChart`, `SourcesDonutChart`)

---

## Current State Assessment

### ✅ Already Complete (Core Interview Loop)
- Job CRUD with 5-step wizard (`/admin/jobs/new`)
- Job detail tabs: Overview, Questions, Application Form, Rules, Applicants
- Candidate list with Table/Board views (`/admin/candidates`)
- Candidate detail with Application, Documents, Job, Proctoring, Transcript, AI Scores, Scorecard tabs
- Webhooks & API Keys management (`/admin/webhooks`, `/admin/api-keys`)
- Organization settings pages (`/admin/settings`, `/admin/company`, `/admin/compliance`)

### ❌ Critical Gaps (4 Features)
1. **Question Bank Admin UI** - Admins cannot create/edit questions in UI (only via API/DB)
2. **Scorecard UI** - Human reviewers cannot score candidates (API exists, UI missing)
3. **Proctoring Review Dashboard** - No way to review flagged sessions across org
4. **Calendar Integration** - No Google/Outlook sync for scheduling (schema + API exist)

### ⚠️ Partial Features (Need Completion)
- Offers UI (`/admin/offers` exists, not wired)
- Exports/Reports UI (`/admin/reports` exists, not wired)
- Scheduling page (`/admin/scheduling` exists, calendar integration missing)
- Team invitation flow (`/admin/settings` partial)

---

## Phase 1: Question Bank Admin UI (Highest Impact)

### Task 1: Create Question List Page (`/admin/jobs/[id]/questions`)

**Objective:** Build the question management page accessible from Job Detail → Questions tab "Edit" button.

**Files:**
- Create: `apps/web/src/app/admin/(dashboard)/jobs/[id]/questions/page.tsx`
- Create: `apps/web/src/components/jobs/questions-list.tsx`
- Modify: `apps/web/src/components/jobs/job-questions-editor.tsx` (refactor for reuse)

**Step 1: Write failing test**

```typescript
// apps/web/src/components/jobs/__tests__/questions-list.test.tsx
import { render, screen } from '@testing-library/react';
import { QuestionsList } from '../questions-list';

describe('QuestionsList', () => {
  it('renders empty state when no questions', () => {
    render(<QuestionsList jobId="job-1" questions={[]} onEdit={() => {}} onReorder={() => {}} onDelete={() => {}} interviewQuestionCount={null} onInterviewCountChange={() => {}} />);
    expect(screen.getByText('No questions yet')).toBeInTheDocument();
  });

  it('renders question cards with section badges', () => {
    const questions = [{
      id: 'q-1', section: 'technical', promptText: 'Explain closures',
      idealAnswerNotes: 'Scope chain', timeLimitSeconds: 90, isActive: true, isMandatory: true
    }];
    render(<QuestionsList jobId="job-1" questions={questions} onEdit={() => {}} onReorder={() => {}} onDelete={() => {}} interviewQuestionCount={null} onInterviewCountChange={() => {}} />);
    expect(screen.getByText('Explain closures')).toBeInTheDocument();
    expect(screen.getByText('Mandatory')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify failure**
```bash
cd /Users/aj_builds/Documents/Programs/HireLoop/apps/web
npm test -- --testPathPattern=questions-list.test.tsx
# Expected: FAIL - QuestionsList not defined
```

**Step 3: Create questions list component**

```tsx
// apps/web/src/components/jobs/questions-list.tsx
"use client";

import { Plus, GripVertical, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Question } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface QuestionsListProps {
  jobId: string;
  questions: Question[];
  onEdit: (questions: Question[]) => void;
  onReorder: (questions: Question[]) => void;
  onDelete: (questionId: string) => void;
  interviewQuestionCount: number | null;
  onInterviewCountChange: (count: number | null) => void;
}

export function QuestionsList({
  jobId,
  questions,
  onEdit,
  onReorder,
  onDelete,
  interviewQuestionCount,
  onInterviewCountChange,
}: QuestionsListProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const activeQuestions = questions.filter(q => q.isActive);

  function toggleExpand(id: string) {
    setExpanded(expanded === id ? null : id);
  }

  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    if (!draggingId || draggingId === targetId) return;

    const newQuestions = [...questions];
    const fromIndex = newQuestions.findIndex(q => q.id === draggingId);
    const toIndex = newQuestions.findIndex(q => q.id === targetId);
    const [removed] = newQuestions.splice(fromIndex, 1);
    newQuestions.splice(toIndex, 0, removed);

    newQuestions.forEach((q, i) => { (q as any).order = i + 1; });

    onReorder(newQuestions);
    setDraggingId(null);
  }

  function handleDragEnd() {
    setDraggingId(null);
  }

  return (
    <Card className="border-border shadow-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Interview questions</CardTitle>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium">Ask per interview:</span>
            <select
              value={interviewQuestionCount ?? ""}
              onChange={(e) => onInterviewCountChange(e.target.value ? Number(e.target.value) : null)}
              className="h-8 w-16 rounded-lg border border-input bg-background px-2 text-sm"
            >
              <option value="">All</option>
              {Array.from({ length: Math.max(activeQuestions.length, 10) }, (_, i) => i + 1).map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {questions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No questions configured for this job.</p>
            <p className="text-sm mt-1">Questions are managed in the Job Creation Wizard.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {questions.map((q, i) => (
              <div
                key={q.id}
                draggable
                onDragStart={(e) => handleDragStart(e, q.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, q.id)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "py-4 first:pt-0 last:pb-0 transition-colors",
                  draggingId === q.id && "opacity-50 bg-brand-muted/30"
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                      aria-label="Drag to reorder"
                    >
                      <GripVertical className="h-5 w-5" />
                    </Button>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="font-mono text-brand">Q{i + 1}</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 capitalize">
                        {q.section}
                      </Badge>
                      {q.isMandatory ? (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0">Mandatory</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">Variable</Badge>
                      )}
                      {!q.isActive && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Inactive</Badge>}
                      {q.timeLimitSeconds && <span>· {q.timeLimitSeconds}s</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleExpand(q.id)}
                      aria-expanded={expanded === q.id}
                      aria-controls={`question-details-${q.id}`}
                    >
                      {expanded === q.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(q.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div id={`question-details-${q.id}`} className={cn("mt-3 overflow-hidden transition-all duration-200", expanded === q.id ? "max-h-96 opacity-100" : "max-h-0 opacity-0")}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-sm font-medium">Question</label>
                      <p className="font-medium">{q.promptText || "—"}</p>
                    </div>
                    {q.idealAnswerNotes && (
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-sm font-medium text-muted-foreground">Ideal answer guidance</label>
                        <p className="text-sm text-muted-foreground">{q.idealAnswerNotes}</p>
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground">Section</label>
                      <p className="capitalize">{q.section}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground">Time limit</label>
                      <p>{q.timeLimitSeconds ? `${q.timeLimitSeconds}s` : "No limit"}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground">Score threshold</label>
                      <p>{q.scoreThreshold ? `${q.scoreThreshold}/10` : "None"}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <Badge variant={q.isActive ? "default" : "secondary"}>
                        {q.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Step 4: Run test to verify pass**
```bash
npm test -- --testPathPattern=questions-list.test.tsx
# Expected: PASS
```

**Step 5: Create page component**

```tsx
// apps/web/src/app/admin/(dashboard)/jobs/[id]/questions/page.tsx
import { JobQuestionsPage } from "@/components/jobs/job-questions-page";

export default async function JobQuestionsPageRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <JobQuestionsPage jobId={id} />;
}
```

```tsx
// apps/web/src/components/jobs/job-questions-page.tsx
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useHireLoop, type QuestionInput } from "@/lib/store/provider";
import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { JobQuestionsEditor } from "@/components/jobs/job-questions-editor";
import { QuestionsList } from "@/components/jobs/questions-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrgPermissions } from "@/hooks/use-org-permissions";

export function JobQuestionsPage({ jobId }: { jobId: string }) {
  const router = useRouter();
  const { canManageJobs, loading: permLoading } = useOrgPermissions();
  const { state, hydrated, setJobQuestions } = useHireLoop();
  const job = state.jobs.find(j => j.id === jobId);
  const questions = state.questions.filter(q => q.jobRoleId === jobId);

  const [mode, setMode] = useState<"list" | "edit">("list");
  const [editQuestions, setEditQuestions] = useState<QuestionInput[]>([]);
  const [editInterviewCount, setEditInterviewCount] = useState<number | null>(null);

  useEffect(() => {
    if (!permLoading && !canManageJobs) router.replace(`/admin/jobs/${jobId}`);
  }, [permLoading, canManageJobs, router, jobId]);

  if (!hydrated || permLoading || !canManageJobs) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!job) return <p className="text-sm text-muted-foreground">Job not found</p>;

  function toQuestionInput(q: typeof questions[0]): QuestionInput {
    return {
      id: q.id,
      section: q.section,
      promptText: q.promptText,
      idealAnswerNotes: q.idealAnswerNotes,
      timeLimitSeconds: q.timeLimitSeconds,
      scoreThreshold: q.scoreThreshold,
      isActive: q.isActive,
      isMandatory: q.isMandatory,
    };
  }

  async function handleSave(next: QuestionInput[], count: number | null) {
    const promise = setJobQuestions(jobId, next, count);
    toast.promise(promise, {
      loading: "Generating question audio in the background...",
      success: "Questions saved successfully",
      error: (err) => err instanceof Error ? err.message : "Could not save questions",
    });
    try {
      await promise;
      setMode("list");
    } catch {}
  }

  return (
    <FadeIn className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <ButtonLink href={`/admin/jobs/${jobId}`} variant="outline" className="rounded-full">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to job
          </ButtonLink>
          <h1 className="mt-4 text-2xl font-bold">{job.title} — Questions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the question pool. Mandatory questions always run; variable questions are sampled per interview.
          </p>
        </div>
        {mode === "list" && (
          <Button className="rounded-full bg-brand hover:bg-brand/90" onClick={() => {
            setEditQuestions(questions.map(toQuestionInput).length ? questions.map(toQuestionInput) : [{ section: "technical", promptText: "", idealAnswerNotes: "", timeLimitSeconds: null, scoreThreshold: null, isActive: true, isMandatory: false }]);
            setEditInterviewCount(job.interviewQuestionCount);
            setMode("edit");
          }}>
            <Plus className="mr-1 h-4 w-4" /> Add question
          </Button>
        )}
      </div>

      {mode === "edit" ? (
        <Card className="border-border shadow-card">
          <CardHeader>
            <CardTitle>Edit questions</CardTitle>
          </CardHeader>
          <CardContent>
            <JobQuestionsEditor
              questions={editQuestions}
              interviewQuestionCount={editInterviewCount}
              saveLabel="Save all"
              onSave={(next, count) => {
                setEditQuestions(next);
                setEditInterviewCount(count);
                handleSave(next, count);
              }}
              onCancel={() => setMode("list")}
            />
          </CardContent>
        </Card>
      ) : (
        <QuestionsList
          jobId={jobId}
          questions={questions}
          interviewQuestionCount={job.interviewQuestionCount}
          onEdit={(next) => { setEditQuestions(next); setMode("edit"); }}
          onReorder={(next) => handleSave(next.map(toQuestionInput), job.interviewQuestionCount)}
          onDelete={(id) => {
            const next = questions.filter(q => q.id !== id);
            handleSave(next.map(toQuestionInput), job.interviewQuestionCount);
          }}
          onInterviewCountChange={(count) => handleSave(questions.map(toQuestionInput), count)}
        />
      )}
    </FadeIn>
  );
}
```

**Step 6: Commit**
```bash
git add apps/web/src/app/admin/\(dashboard\)/jobs/\[id\]/questions/page.tsx
git add apps/web/src/components/jobs/questions-list.tsx
git add apps/web/src/components/jobs/job-questions-page.tsx
git add apps/web/src/components/jobs/__tests__/questions-list.test.tsx
git commit -m "feat(admin): add question bank management UI at /admin/jobs/[id]/questions"
```

---

### Task 2: Refactor JobQuestionsEditor for Reuse

**Objective:** Extract the editor from `job-creation-wizard.tsx` into a standalone reusable component.

**Files:**
- Modify: `apps/web/src/components/jobs/job-questions-editor.tsx` (already exists, verify it's reusable)
- Modify: `apps/web/src/components/jobs/job-creation-wizard.tsx` (import from shared component)

**Verification:** Check existing `JobQuestionsEditor` accepts `questions`, `interviewQuestionCount`, `onSave`, `onCancel` props — already matches. No changes needed.

---

### Task 3: Add Question TTS Pre-render Button (Admin)

**Objective:** Wire the existing `POST /admin/questions/render-audio` endpoint to a button in the question editor.

**Files:**
- Modify: `apps/web/src/components/jobs/job-questions-editor.tsx`
- Add: Server action in `apps/web/src/app/actions/hireloop.ts`

**Step 1: Add server action**

```typescript
// apps/web/src/app/actions/hireloop.ts - add to existing file
export async function renderQuestionAudioAction(jobId: string, questionId: string) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/questions/render-audio`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": process.env.INTERVIEW_INTERNAL_SECRET!,
    },
    body: JSON.stringify({ job_id: jobId, question_id: questionId }),
  });

  if (!res.ok) return { error: "Failed to render audio" };
  return { success: true };
}
```

**Step 2: Add button in editor**

```tsx
// In JobQuestionsEditor, add to each question row:
<Button
  variant="outline"
  size="sm"
  onClick={async () => {
    const res = await renderQuestionAudioAction(jobId, q.id || "new");
    toast[res.success ? "success" : "error"](res.success ? "Audio generated" : res.error);
  }}
  disabled={!q.promptText.trim()}
>
  🔊 Generate Audio
</Button>
```

---

## Phase 2: Scorecard UI (Human Review)

### Task 4: Build Scorecard Tab in Candidate Detail

**Objective:** Complete the Scorecard tab in `/admin/candidates/[id]` — currently has form but no save action wired correctly.

**Files:**
- Modify: `apps/web/src/components/candidates/candidate-detail-view.tsx` (Scorecard tab)
- Verify: `apps/web/src/app/actions/hireloop.ts` has `submitScorecardAction` (exists)

**Current State:** Scorecard tab exists (lines 457-517) with recommendation, score, notes inputs and `submitScorecard` function. Need to verify it works end-to-end.

**Step 1: Test existing implementation**
```bash
# Start dev server
cd apps/web && npm run dev
# Navigate to /admin/candidates/[id], click Scorecard tab
# Fill form, click Submit
# Check network tab for POST to /api/actions/hireloop
# Check Supabase: scorecards table has new row
```

**Step 2: Fix any issues found (likely missing applicationId in form)**

**Step 3: Add scorecard list view in candidate detail**
```tsx
// Add to candidate-detail-view.tsx, in Scorecard tab after form:
{application.scorecards?.length > 0 && (
  <div className="mt-6 space-y-4">
    <h3 className="font-medium">Previous scorecards</h3>
    {application.scorecards.map((sc: any) => (
      <Card key={sc.id} className="border-border">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium capitalize">{sc.recommendation.replace("_", " ")}</p>
              <p className="text-sm text-muted-foreground">{sc.notes}</p>
            </div>
            {sc.overallScore != null && (
              <span className="text-2xl font-bold">{sc.overallScore}/10</span>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            By {sc.reviewer?.name || "Unknown"} · {formatDate(sc.createdAt)}
          </p>
        </CardContent>
      </Card>
    ))}
  </div>
)}
```

**Step 4: Verify scorecards appear in application detail**
```bash
# Check GET /v1/applications/{id} returns scorecards array
# If not, add to supabase_store.py get_application() select
```

---

### Task 5: Add Scorecard API to Store (if missing)

**Objective:** Ensure `useHireLoop` fetches scorecards with application.

**Files:**
- Modify: `apps/web/src/lib/store/provider.tsx`

**Step 1: Check current fetch**
```typescript
// In provider.tsx, refreshState() or fetchApplications()
const { data: apps } = await supabase
  .from("applications")
  .select(`
    *,
    candidate:candidates(*),
    job:job_roles(*),
    interview_sessions(*),
    scorecards(*, reviewer:auth.users(name, email))
  `)
  .eq("org_id", orgId);
```

**Step 2: Update TypeScript types**
```typescript
// apps/web/src/lib/types.ts
export interface Scorecard {
  id: string;
  applicationId: string;
  reviewerId: string;
  recommendation: "strong_yes" | "yes" | "hold" | "no" | "strong_no";
  overallScore: number | null;
  notes: string;
  competencies: { name: string; score: number; evidence: string }[];
  createdAt: string;
  reviewer?: { name: string; email: string };
}

export interface Application {
  // ... existing
  scorecards?: Scorecard[];
}
```

---

## Phase 3: Proctoring Review Dashboard

### Task 6: Create Proctoring Dashboard Page (`/admin/proctoring`)

**Objective:** Build org-wide proctoring review dashboard showing flagged sessions with filter, search, and override actions.

**Files:**
- Create: `apps/web/src/app/admin/(dashboard)/proctoring/page.tsx`
- Create: `apps/web/src/components/proctoring/proctoring-dashboard.tsx`
- Create: `apps/web/src/components/proctoring/proctoring-session-card.tsx`

**Step 1: Write failing test**

```typescript
// apps/web/src/components/proctoring/__tests__/proctoring-dashboard.test.tsx
import { render, screen } from '@testing-library/react';
import { ProctoringDashboard } from '../proctoring-dashboard';

describe('ProctoringDashboard', () => {
  it('renders flagged sessions', () => {
    const sessions = [{
      id: 'sess-1', applicationId: 'app-1', status: 'flagged',
      cheatingProbability: 85, proctoringSummary: { flagged: true, reasons: ['Multiple faces', 'Tab switch'] },
      createdAt: new Date().toISOString(), applications: { jobRoleId: 'job-1', status: 'interviewed' }
    }];
    render(<ProctoringDashboard sessions={sessions} onOverride={() => {}} />);
    expect(screen.getByText('Multiple faces')).toBeInTheDocument();
    expect(screen.getByText('Tab switch')).toBeInTheDocument();
  });

  it('shows empty state when no flagged sessions', () => {
    render(<ProctoringDashboard sessions={[]} onOverride={() => {}} />);
    expect(screen.getByText('No flagged sessions')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify failure**

**Step 3: Create proctoring dashboard component**

```tsx
// apps/web/src/components/proctoring/proctoring-dashboard.tsx
"use client";

import { useState, useMemo } from "react";
import { Search, Filter, AlertTriangle, Shield, Eye, Flag } from "lucide-react";
import { FadeIn, FadeInStagger, FadeInItem } from "@/components/motion/fade-in";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { ProctoringSessionCard } from "./proctoring-session-card";
import { EmptyState } from "@/components/patterns/empty-state";
import { cn } from "@/lib/utils";

interface ProctoringDashboardProps {
  sessions: any[];
  onOverride: (sessionId: string, flagged: boolean, note: string) => void;
}

export function ProctoringDashboard({ sessions, onOverride }: ProctoringDashboardProps) {
  const [query, setQuery] = useState("");
  const [jobFilter, setJobFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState<"all" | "critical" | "warning">("all");
  const [sortBy, setSortBy] = useState<"probability" | "date">("probability");

  const jobs = useMemo(() => [...new Set(sessions.map(s => s.applications?.jobRoleId).filter(Boolean))], [sessions]);

  const filtered = useMemo(() => {
    return sessions.filter(s => {
      if (jobFilter !== "all" && s.applications?.jobRoleId !== jobFilter) return false;
      if (severityFilter === "critical" && s.cheatingProbability < 70) return false;
      if (severityFilter === "warning" && s.cheatingProbability >= 70) return false;
      const q = query.trim().toLowerCase();
      if (q && !s.applications?.jobRoleId?.toLowerCase().includes(q) &&
          !s.proctoringSummary?.reasons?.some((r: string) => r.toLowerCase().includes(q))) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === "probability") return b.cheatingProbability - a.cheatingProbability;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [sessions, query, jobFilter, severityFilter, sortBy]);

  const stats = useMemo(() => ({
    total: sessions.length,
    flagged: sessions.filter(s => s.status === "flagged" || s.proctoringSummary?.flagged).length,
    critical: sessions.filter(s => s.cheatingProbability >= 70).length,
    warning: sessions.filter(s => s.cheatingProbability > 0 && s.cheatingProbability < 70).length,
  }), [sessions]);

  return (
    <FadeIn className="space-y-6">
      <header className="border-b border-slate-200 pb-6">
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">Proctoring Review</h1>
        <p className="mt-2 text-sm text-slate-600">
          Review AI-flagged interview sessions. Override decisions are logged for audit.
        </p>
      </header>

      <FadeInStagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FadeInItem><StatCard label="Total sessions" value={stats.total} icon={<Shield className="h-5 w-5" />} /></FadeInItem>
        <FadeInItem><StatCard label="Flagged" value={stats.flagged} icon={<Flag className="h-5 w-5 text-red-600" />} variant="destructive" /></FadeInItem>
        <FadeInItem><StatCard label="Critical" value={stats.critical} icon={<AlertTriangle className="h-5 w-5 text-red-700" />} /></FadeInItem>
        <FadeInItem><StatCard label="Warnings" value={stats.warning} icon={<AlertTriangle className="h-5 w-5 text-amber-600" />} /></FadeInItem>
      </FadeInStagger>

      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sessions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 rounded-full bg-card"
          />
        </div>
        <Select value={jobFilter} onValueChange={v => setJobFilter(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-[180px] rounded-full bg-card">
            <SelectValue placeholder="All jobs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All jobs</SelectItem>
            {jobs.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={v => setSeverityFilter(v as any)}>
          <SelectTrigger className="w-full sm:w-[160px] rounded-full bg-card">
            <SelectValue placeholder="All severities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="critical">Critical (≥70%)</SelectItem>
            <SelectItem value="warning">Warning (<70%)</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={v => setSortBy(v as any)}>
          <SelectTrigger className="w-full sm:w-[180px] rounded-full bg-card">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="probability">Cheating probability (high first)</SelectItem>
            <SelectItem value="date">Most recent first</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <FadeInStagger className="divide-y divide-slate-200 border-y border-slate-200">
        {filtered.length === 0 ? (
          <FadeInItem>
            <EmptyState
              title={query || jobFilter !== "all" ? "No matching sessions" : "No flagged sessions"}
              description={query || jobFilter !== "all"
                ? "Try adjusting your filters or search query."
                : "All interviews passed proctoring checks. Great!"}
            />
          </FadeInItem>
        ) : (
          filtered.map(session => (
            <FadeInItem key={session.id}>
              <ProctoringSessionCard session={session} onOverride={onOverride} />
            </FadeInItem>
          ))
        )}
      </FadeInStagger>
    </FadeIn>
  );
}

function StatCard({ label, value, icon, variant }: { label: string; value: number; icon: React.ReactNode; variant?: "default" | "destructive" }) {
  return (
    <Card className="border-border shadow-card">
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
          </div>
          <div className={cn("p-3 rounded-xl", variant === "destructive" ? "bg-red-50 text-red-600" : "bg-brand-muted text-brand")}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

```tsx
// apps/web/src/components/proctoring/proctoring-session-card.tsx
"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, Flag, X, Check, Eye, Video } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";

interface ProctoringSessionCardProps {
  session: any;
  onOverride: (sessionId: string, flagged: boolean, note: string) => void;
}

export function ProctoringSessionCard({ session, onOverride }: ProctoringSessionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [overrideNote, setOverrideNote] = useState("");
  const [overriding, setOverriding] = useState(false);

  const isFlagged = session.status === "flagged" || session.proctoringSummary?.flagged;
  const prob = session.cheatingProbability ?? 0;
  const severity = prob >= 70 ? "critical" : prob > 0 ? "warning" : "clean";

  const reasons = session.proctoringSummary?.reasons || [];
  const log = session.proctoringLog || [];

  return (
    <div className={cn("transition-colors", isFlagged && "bg-red-50/50")}>
      <div className="flex items-start justify-between gap-4 p-4" onClick={() => setExpanded(!expanded)} style={{ cursor: "pointer" }}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
            severity === "critical" && "bg-red-100 text-red-700",
            severity === "warning" && "bg-amber-100 text-amber-700",
            severity === "clean" && "bg-emerald-100 text-emerald-700"
          )}>
            {severity === "critical" && <Flag className="h-5 w-5" />}
            {severity === "warning" && <AlertTriangle className="h-5 w-5" />}
            {severity === "clean" && <Check className="h-5 w-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-brand text-sm">Session {session.id.slice(-8)}</span>
              <Badge variant={isFlagged ? "destructive" : severity === "warning" ? "secondary" : "default"}>
                {isFlagged ? "Flagged" : severity === "warning" ? "Warning" : "Clean"}
              </Badge>
              <Badge variant="outline">{Math.round(prob)}% probability</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {session.applications?.candidate?.name} · {session.applications?.job?.title} · {formatDate(session.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isFlagged && !overriding && (
            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setOverrideNote(""); setOverriding(true); }}>
              Override
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className={cn("overflow-hidden transition-all duration-200", expanded ? "max-h-96 opacity-100 pb-4" : "max-h-0 opacity-0")}>
        <div className="px-4 border-t divide-y divide-border">
          {/* Override form */}
          {overriding && (
            <div className="p-4 bg-amber-50 border-b border-amber-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-700 mt-0.5 shrink-0" />
                <div className="flex-1 space-y-3">
                  <p className="text-sm font-medium">Override proctoring decision</p>
                  <Textarea
                    value={overrideNote}
                    onChange={(e) => setOverrideNote(e.target.value)}
                    placeholder="Required: Explain why you're overriding the AI flag (audit trail)..."
                    rows={3}
                    className="min-h-[80px]"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={!overrideNote.trim()}
                      onClick={() => {
                        onOverride(session.id, true, overrideNote);
                        setOverriding(false);
                      }}
                    >
                      Keep Flagged
                    </Button>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      disabled={!overrideNote.trim()}
                      onClick={() => {
                        onOverride(session.id, false, overrideNote);
                        setOverriding(false);
                      }}
                    >
                      Clear Flag
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setOverriding(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reasons summary */}
          {reasons.length > 0 && (
            <div className="p-4">
              <p className="text-sm font-medium mb-2">Flag reasons</p>
              <div className="flex flex-wrap gap-2">
                {reasons.map((r: string, i: number) => (
                  <Badge key={i} variant="secondary" className="text-xs">{r}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Proctoring log */}
          {log.length > 0 && (
            <div className="p-4">
              <p className="text-sm font-medium mb-2">Event log</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {log.slice().reverse().map((event: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 text-sm p-2 rounded bg-muted/30">
                    <span className={cn("shrink-0 px-2 py-0.5 rounded text-xs font-mono",
                      event.severity === "critical" && "bg-red-100 text-red-700",
                      event.severity === "warning" && "bg-amber-100 text-amber-700",
                      event.severity === "info" && "bg-blue-100 text-blue-700"
                    )}>
                      {event.severity}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{event.type.replace(/_/g, " ")}</p>
                      <p className="text-muted-foreground">{event.detail}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(event.at)}</p>
                    </div>
                    {event.snapshotPath && (
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Create page with data fetching**

```tsx
// apps/web/src/app/admin/(dashboard)/proctoring/page.tsx
import { ProctoringPage } from "@/components/proctoring/proctoring-page";

export default async function ProctoringPageRoute() {
  return <ProctoringPage />;
}
```

```tsx
// apps/web/src/components/proctoring/proctoring-page.tsx
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useHireLoop } from "@/lib/store/provider";
import { ProctoringDashboard } from "./proctoring-dashboard";
import { FadeIn } from "@/components/motion/fade-in";
import { useOrgPermissions } from "@/hooks/use-org-permissions";

export function ProctoringPage() {
  const { canManageProctoring, loading: permLoading } = useOrgPermissions();
  const { state, hydrated, setProctoringOverride } = useHireLoop();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!permLoading && !canManageProctoring) {
      // redirect or show unauthorized
    }
  }, [permLoading, canManageProctoring]);

  useEffect(() => {
    if (!hydrated) return;
    // Filter sessions with proctoring data
    const proctoringSessions = state.interviewSessions.filter(s =>
      s.proctoringSummary || s.proctoringLog?.length || s.cheatingProbability > 0
    );
    setSessions(proctoringSessions);
    setLoading(false);
  }, [hydrated, state.interviewSessions]);

  if (!hydrated || permLoading || !canManageProctoring) return <p className="text-sm text-muted-foreground">Loading…</p>;

  async function handleOverride(sessionId: string, flagged: boolean, note: string) {
    try {
      await setProctoringOverride(sessionId, flagged, note);
      toast.success(flagged ? "Session kept as flagged" : "Flag cleared");
      // Refresh will happen via store subscription
    } catch {
      toast.error("Failed to override");
    }
  }

  return (
    <FadeIn>
      <ProctoringDashboard sessions={sessions} onOverride={handleOverride} />
    </FadeIn>
  );
}
```

**Step 5: Add setProctoringOverride to store**

```typescript
// apps/web/src/lib/store/provider.tsx - add to useHireLoop actions
setProctoringOverride: async (sessionId: string, flagged: boolean, note: string) => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/proctoring/sessions/${sessionId}/override`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": getApiKey() },
    body: JSON.stringify({ flagged, note }),
  });
  if (!res.ok) throw new Error("Override failed");
  // Refresh state
  get().refreshState();
},
```

**Step 6: Commit**
```bash
git add apps/web/src/app/admin/\(dashboard\)/proctoring/page.tsx
git add apps/web/src/components/proctoring/proctoring-dashboard.tsx
git add apps/web/src/components/proctoring/proctoring-session-card.tsx
git add apps/web/src/components/proctoring/proctoring-page.tsx
git add apps/web/src/components/proctoring/__tests__/proctoring-dashboard.test.tsx
git commit -m "feat(admin): add proctoring review dashboard at /admin/proctoring"
```

---

## Phase 4: Calendar Integration for Scheduling

### Task 7: Implement Google Calendar OAuth Flow

**Objective:** Add Google Calendar connection to `/admin/scheduling` page using existing `calendar_connections` table and API endpoints.

**Files:**
- Modify: `apps/web/src/app/admin/(dashboard)/scheduling/page.tsx`
- Create: `apps/web/src/components/scheduling/calendar-connection.tsx`
- Create: `apps/web/src/app/api/auth/google-calendar/route.ts` (OAuth callback)
- Add: Server actions for calendar sync

**Step 1: Add Google OAuth config to Supabase**
```bash
# In Supabase Dashboard → Authentication → Providers → Google
# Add redirect URI: https://{org-domain}/auth/callback
# Enable "Google Calendar" scope: https://www.googleapis.com/auth/calendar.events
```

**Step 2: Create calendar connection component**

```tsx
// apps/web/src/components/scheduling/calendar-connection.tsx
"use client";

import { useState } from "react";
import { CalendarPlus, CalendarX, RefreshCw, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/motion/fade-in";
import { cn } from "@/lib/utils";

interface CalendarConnection {
  id: string;
  provider: "google" | "outlook";
  calendars: { id: string; name: string; primary?: boolean }[];
  active: boolean;
  expiresAt: string;
  createdAt: string;
}

interface CalendarConnectionProps {
  connections: CalendarConnection[];
  onConnect: (provider: "google" | "outlook") => void;
  onDisconnect: (connId: string) => void;
  onSync: (connId: string) => void;
  loading?: string | null;
}

export function CalendarConnectionList({ connections, onConnect, onDisconnect, onSync, loading }: CalendarConnectionProps) {
  return (
    <FadeIn className="space-y-4">
      <Card className="border-border shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Calendar connections</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onConnect("google")} disabled={!!loading}>
              <CalendarPlus className="mr-1 h-4 w-4" /> Connect Google
            </Button>
            <Button variant="outline" size="sm" onClick={() => onConnect("outlook")} disabled={!!loading}>
              <CalendarPlus className="mr-1 h-4 w-4" /> Connect Outlook
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {connections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No calendars connected.</p>
              <p className="text-sm mt-1">Connect Google or Outlook to sync interview schedules and enable candidate self-booking.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {connections.map(conn => (
                <div key={conn.id} className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg border border-border">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center",
                      conn.provider === "google" && "bg-blue-100 text-blue-700",
                      conn.provider === "outlook" && "bg-blue-900 text-blue-100"
                    )}>
                      <CalendarPlus className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium capitalize">{conn.provider} Calendar</p>
                      <p className="text-sm text-muted-foreground">
                        {conn.calendars.map(c => c.name).join(", ")} · {conn.calendars.length} calendar{conn.calendars.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={conn.active ? "default" : "secondary"}>
                      {conn.active ? "Active" : "Expired"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onSync(conn.id)}
                      disabled={loading === conn.id}
                      title="Sync now"
                    >
                      <RefreshCw className={cn("h-4 w-4", loading === conn.id && "animate-spin")} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDisconnect(conn.id)}
                      className="text-red-600 hover:text-red-700"
                      title="Disconnect"
                    >
                      <CalendarX className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </FadeIn>
  );
}
```

**Step 3: Create OAuth API route**

```typescript
// apps/web/src/app/api/auth/google-calendar/route.ts
import { createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // Contains org_id, user_id, provider

  if (!code || !state) {
    return NextResponse.redirect(new URL("/admin/scheduling?error=invalid_callback", request.url));
  }

  try {
    const { orgId, userId, provider } = JSON.parse(Buffer.from(state, "base64").toString());

    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google-calendar`,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(tokens.error_description || "Token exchange failed");

    // Get calendar list
    const calRes = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const { items: calendars } = await calRes.json();

    // Store encrypted tokens
    const { data: { user } } = await supabase.auth.getUser();
    const encryptedAccess = encrypt(tokens.access_token);
    const encryptedRefresh = encrypt(tokens.refresh_token);

    await supabase.from("calendar_connections").insert({
      org_id: orgId,
      user_id: userId,
      provider: "google",
      access_token_encrypted: encryptedAccess,
      refresh_token_encrypted: encryptedRefresh,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      calendars: calendars?.map((c: any) => ({ id: c.id, name: c.summary, primary: c.primary })) || [],
      active: true,
    });

    return NextResponse.redirect(new URL("/admin/scheduling?connected=google", request.url));
  } catch (err) {
    console.error("Google Calendar OAuth error:", err);
    return NextResponse.redirect(new URL("/admin/scheduling?error=oauth_failed", request.url));
  }
}

function encrypt(text: string): string {
  // Use existing encryption utility or crypto.subtle
  return btoa(text); // Placeholder - use proper encryption
}
```

**Step 4: Add server action for initiating OAuth**

```typescript
// apps/web/src/app/actions/hireloop.ts
export async function initiateCalendarOAuthAction(provider: "google" | "outlook") {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const orgId = getOrgIdFromSession(); // Implement based on auth context

  if (provider === "google") {
    const state = btoa(JSON.stringify({ orgId, userId: user.id, provider }));
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google-calendar`,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly",
      access_type: "offline",
      prompt: "consent",
      state,
    });
    return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` };
  }

  // Outlook implementation similar
  return { error: "Provider not implemented" };
}
```

**Step 5: Update scheduling page**

```tsx
// apps/web/src/app/admin/(dashboard)/scheduling/page.tsx
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useHireLoop } from "@/lib/store/provider";
import { CalendarConnectionList } from "@/components/scheduling/calendar-connection";
import { initiateCalendarOAuthAction } from "@/app/actions/hireloop";
import { FadeIn } from "@/components/motion/fade-in";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SchedulingPage() {
  const { state, hydrated } = useHireLoop();
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated) {
      setConnections(state.calendarConnections || []);
    }
  }, [hydrated, state.calendarConnections]);

  async function handleConnect(provider: "google" | "outlook") {
    const res = await initiateCalendarOAuthAction(provider);
    if (res.url) {
      window.location.href = res.url;
    } else {
      toast.error(res.error || "Failed to initiate connection");
    }
  }

  async function handleDisconnect(connId: string) {
    // Call delete_calendar_connection API
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/calendar/connections/${connId}`, {
      method: "DELETE",
      headers: { "X-API-Key": getApiKey() },
    });
    if (res.ok) {
      setConnections(prev => prev.filter(c => c.id !== connId));
      toast.success("Disconnected");
    } else {
      toast.error("Failed to disconnect");
    }
  }

  async function handleSync(connId: string) {
    setLoading(connId);
    // Call sync API endpoint
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/calendar/connections/${connId}/sync`, {
      method: "POST",
      headers: { "X-API-Key": getApiKey() },
    });
    setLoading(null);
    if (res.ok) {
      toast.success("Synced");
      // Refresh connections
    } else {
      toast.error("Sync failed");
    }
  }

  if (!hydrated) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <FadeIn className="space-y-6 max-w-4xl">
      <header className="border-b border-slate-200 pb-6">
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">Scheduling & Calendar</h1>
        <p className="mt-2 text-sm text-slate-600">
          Connect calendars to sync interview schedules and enable candidate self-booking.
        </p>
      </header>

      <CalendarConnectionList
        connections={connections}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onSync={handleSync}
        loading={loading}
      />

      {/* Interview Slots Management - existing */}
      <Card className="border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Interview slots</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Manage interview time slots for each pipeline stage.</p>
          {/* Slot management UI - connect to existing API endpoints */}
        </CardContent>
      </Card>
    </FadeIn>
  );
}
```

---

## Phase 5: Completion & Polish (Remaining Partial Features)

### Task 8: Wire Offers UI (`/admin/offers`)

**Files:**
- Modify: `apps/web/src/app/admin/(dashboard)/offers/page.tsx`
- API endpoints exist: `GET/POST /v1/applications/{id}/offer`

### Task 9: Wire Exports/Reports UI (`/admin/reports`)

**Files:**
- Modify: `apps/web/src/app/admin/(dashboard)/reports/page.tsx`
- API endpoints exist: `GET/POST /v1/exports`

### Task 10: Complete Team Invitation Flow (`/admin/settings`)

**Files:**
- Modify: `apps/web/src/app/admin/(dashboard)/settings/page.tsx`
- Add: Invite team member action, role assignment

---

## Testing & Validation Checklist

### For Each Feature:
- [ ] Unit tests pass (`npm test`)
- [ ] TypeScript compiles (`npm run type-check`)
- [ ] Lint passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Manual E2E test in dev environment
- [ ] Accessibility check (axe-core or manual)
- [ ] Mobile responsive test
- [ ] Dark mode verification

### Integration Tests:
- [ ] Question bank CRUD → appears in interview
- [ ] Scorecard submit → appears in candidate detail
- [ ] Proctoring override → updates session, logs audit
- [ ] Calendar connect → creates connection, syncs events

---

## Risks & Tradeoffs

| Risk | Mitigation |
|------|------------|
| Calendar OAuth complexity | Start with Google only; Outlook as follow-up |
| Proctoring dashboard performance with many sessions | Add pagination, virtualize list |
| Scorecard competency schema mismatch | Verify API returns `competencies` array |
| Question TTS pre-render async timing | Use toast.promise pattern like job creation |

---

## Estimated Effort

| Phase | Tasks | Est. Days |
|-------|-------|-----------|
| Question Bank UI | 1-3 | 2 |
| Scorecard UI | 4-5 | 1 |
| Proctoring Dashboard | 6 | 2 |
| Calendar Integration | 7 | 3 |
| Polish Remaining | 8-10 | 2 |
| **Total** | **10 tasks** | **~10 days** |

---

## Execution Order

1. **Question Bank UI** (highest user impact, unblocks interview quality)
2. **Scorecard UI** (completes human review loop)
3. **Proctoring Dashboard** (compliance/audit requirement)
4. **Calendar Integration** (differentiator feature)
5. **Polish Remaining** (offers, exports, team invites)

---

**Plan complete and saved. Ready to execute using subagent-driven-development — I'll dispatch a fresh subagent per task with two-stage review (spec compliance then code quality). Shall I proceed?**