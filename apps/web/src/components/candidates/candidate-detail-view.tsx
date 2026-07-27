"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";
import {
  regenerateAndSendInterviewLinkAction,
  sendToFinalInterviewAction,
  submitScorecardAction,
} from "@/app/actions/hireloop";
import { isActionError } from "@/lib/action-error";
import { FadeIn } from "@/components/motion/fade-in";
import { ApplicationDocumentLink } from "@/components/candidates/application-document-link";
import {
  ProctoringLogView,
  ProctoringSummaryCard,
} from "@/components/candidates/proctoring-log-view";
import { TranscriptView } from "@/components/reports/transcript-view";
import { ScoreBreakdown } from "@/components/reports/score-breakdown";
import { ScorecardList } from "@/components/candidates/scorecard-list";
import {
  useHireLoop,
  useQuestionsForJob,
  useScorecardsForApplication,
} from "@/lib/store/provider";
import { isApplicationDocument } from "@/lib/form-fields";
import { canRegenerateInterviewLink } from "@/lib/interview-link";
import { SECTION_LABELS } from "@/lib/constants";
import { StatusBadge } from "@/components/patterns/status-badge";
import { formatDate } from "@/lib/format";
import type { ApplicationDocument, FormResponseValue } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ButtonLink } from "@/components/ui/button-link";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";

function renderFormValue(value: FormResponseValue | undefined) {
  if (value === undefined || value === "") return "&mdash;";
  if (isApplicationDocument(value)) {
    if (!value.storagePath) return value.originalName;
    return <ApplicationDocumentLink document={value} />;
  }
  return String(value);
}

export function CandidateDetailView({ candidateId }: { candidateId: string }) {
  const { state, hydrated, refreshState } = useHireLoop();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<
    "strong_yes" | "yes" | "hold" | "no" | "strong_no"
  >("hold");
  const [reviewScore, setReviewScore] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const candidate = state.candidates.find((c) => c.id === candidateId);
  const application = state.applications.find((a) => a.candidateId === candidateId);
  const job = application ? state.jobs.find((j) => j.id === application.jobRoleId) : undefined;
  const session = application
    ? state.interviewSessions.find((s) => s.applicationId === application.id)
    : undefined;
  const questions = useQuestionsForJob(job?.id ?? "");

  // Always refresh state when viewing a candidate to ensure we have the latest AI scorecard
  useEffect(() => {
    void refreshState();
  }, [refreshState]);

  const uploadedDocuments = application
    ? Object.entries(application.formResponse).filter(([, value]) =>
        isApplicationDocument(value)
      )
    : [];

  if (!hydrated) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!candidate || !application || !job) {
    return <p className="text-sm text-muted-foreground">Candidate not found.</p>;
  }

  const interviewed = ["interviewed", "shortlisted", "passed_ai", "rejected_ai", "partner_review", "hired"].includes(
    application.status
  );
  const showResendLink = canRegenerateInterviewLink(application);
  const applicationId = application.id;

  async function runAction(
    key: string,
    fn: () => Promise<unknown>
  ) {
    setActionLoading(key);
    try {
      const res = await fn();
      if (isActionError(res)) {
        throw new Error(res.error);
      }
      await refreshState();
      toast.success("Updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  }

  async function submitScorecard() {
    setActionLoading("scorecard");
    try {
      const result = await submitScorecardAction({
        applicationId,
        recommendation,
        overallScore: reviewScore ? Number(reviewScore) : null,
        notes: reviewNotes,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setReviewNotes("");
      setReviewScore("");
      setRecommendation("hold");
      toast.success("Scorecard submitted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <FadeIn className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <Card className="h-fit border-border shadow-card lg:sticky lg:top-6">
        <CardContent className="space-y-4 p-5">
          <div>
            <h2 className="text-lg font-bold">{candidate.name}</h2>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              <p className="flex items-center gap-1">
                <PhosphorIcon name="Mail" />
                {candidate.email}
              </p>
              {candidate.phone ? (
                <p className="flex items-center gap-1">
                  <PhosphorIcon name="Phone" className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {candidate.phone}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={application.status} />
            <Badge variant="secondary">{job.title}</Badge>
          </div>
          <p className="text-caption">Applied {formatDate(application.createdAt)}</p>
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            {application.status === "passed_ai" || application.status === "shortlisted" ? (
              <Button
                className="w-full rounded-full bg-brand hover:bg-brand/90"
                disabled={actionLoading != null}
                onClick={() =>
                  void runAction("final", () => sendToFinalInterviewAction(application.id))
                }
              >
                Send to final interview
              </Button>
            ) : null}

            <ButtonLink href="/admin/candidates" variant="outline" className="w-full rounded-full">
              Back to list
            </ButtonLink>
          </div>
        </CardContent>
      </Card>

      <div className="min-w-0 space-y-6">
        {interviewed ? (
          <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            Interview completed
          </Badge>
        ) : application.interviewToken ? (
          <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
            Interview link sent
          </Badge>
        ) : null}
        {session?.status === "flagged" || session?.proctoringSummary?.flagged ? (
          <div className="flex flex-col gap-1">
            <Badge className="bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 w-fit">
              Proctoring flagged
            </Badge>
            {session.proctoringSummary?.reasons?.length ? (
              <p className="text-xs text-red-600 dark:text-red-400">
                Issues: {session.proctoringSummary.reasons.join(" • ")}
              </p>
            ) : session.proctoringSummary?.reason ? (
              <p className="text-xs text-red-600 dark:text-red-400">
                Issue: {session.proctoringSummary.reason}
              </p>
            ) : null}
          </div>
        ) : null}

      <Tabs defaultValue="application">
        <TabsList className="bg-transparent p-0">
          <TabsTrigger value="application" className="rounded-full data-[state=active]:shadow-card">
            Application data
          </TabsTrigger>
          <TabsTrigger value="documents" className="rounded-full data-[state=active]:shadow-card">
            Documents{uploadedDocuments.length ? ` (${uploadedDocuments.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="job" className="rounded-full data-[state=active]:shadow-card">
            Job & interview
          </TabsTrigger>
          {session ? (
            <TabsTrigger value="proctoring" className="rounded-full data-[state=active]:shadow-card">
              Proctoring
              {session.proctoringLog?.some((e) => e.severity === "critical") ? " ⚠" : ""}
            </TabsTrigger>
          ) : null}
          {session?.transcript?.length ? (
            <TabsTrigger value="transcript" className="rounded-full data-[state=active]:shadow-card">
              Transcript
            </TabsTrigger>
          ) : null}
          {session?.overallScore ? (
            <TabsTrigger value="scores" className="rounded-full data-[state=active]:shadow-card">
              AI scores
            </TabsTrigger>
          ) : null}
          <TabsTrigger value="scorecard" className="rounded-full data-[state=active]:shadow-card">
            Scorecard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="application" className="mt-6">
          <Card className="border-border shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Form responses</CardTitle>
              <p className="text-sm text-muted-foreground">
                Submitted {formatDate(application.createdAt)}
              </p>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-border">
                {job.formFields
                  .sort((a, b) => a.order - b.order)
                  .map((field) => {
                    const value = application.formResponse[field.fieldKey];
                    return (
                      <div key={field.id} className="grid gap-1 py-3 sm:grid-cols-3">
                        <dt className="text-sm font-medium text-muted-foreground">{field.label}</dt>
                        <dd className="text-sm font-medium text-foreground sm:col-span-2">
                          {renderFormValue(value)}
                        </dd>
                      </div>
                    );
                  })}
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <Card className="border-border shadow-card">
            <Collapsible defaultOpen={false}>
              <CollapsibleTrigger className="flex w-full items-center justify-between p-6 text-left hover:bg-muted/50 [&[data-state=open]>svg]:rotate-180">
                <CardHeader className="p-0">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <PhosphorIcon name="FileText" className="h-4 w-4" />
                    Uploaded documents
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Resumes, marksheets, and other files from the application form.
                  </p>
                </CardHeader>
                <PhosphorIcon
                  name="ChevronDown"
                  className="h-5 w-5 shrink-0 transition-transform duration-200"
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {uploadedDocuments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No documents uploaded.</p>
                  ) : (
                    <ul className="space-y-3">
                      {uploadedDocuments.map(([fieldKey, doc]) => {
                        const field = job.formFields.find((f) => f.fieldKey === fieldKey);
                        const document = doc as ApplicationDocument;
                        return (
                          <li
                            key={fieldKey}
                            className="flex flex-col gap-2 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="text-sm font-medium">{field?.label ?? fieldKey}</p>
                              <p className="text-xs text-muted-foreground">{document.mimeType}</p>
                            </div>
                            <ApplicationDocumentLink document={document} />
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        </TabsContent>

        <TabsContent value="job" className="mt-6 space-y-4">
          {showResendLink ? (
            <Card className="border-border shadow-card">
              <CardHeader>
                <CardTitle className="text-base">Interview link</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {application.status === "interview_expired" ||
                  (application.tokenExpiresAt && new Date(application.tokenExpiresAt) < new Date())
                    ? "The previous interview link has expired."
                    : "No active interview link is available for this candidate."}
                </p>
                {application.tokenExpiresAt ? (
                  <p className="text-xs text-muted-foreground">
                    Last link expired {formatDate(application.tokenExpiresAt)}
                  </p>
                ) : null}
                <Button
                  className="rounded-full bg-brand hover:bg-brand/90"
                  disabled={actionLoading === "resend-link"}
                  onClick={async () => {
                    setActionLoading("resend-link");
                    try {
                      const res = await regenerateAndSendInterviewLinkAction(application.id);
                      if (isActionError(res)) {
                        throw new Error(res.error);
                      }
                      await refreshState();
                      toast.success("Interview link sent to candidate");
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Failed to send link");
                    } finally {
                      setActionLoading(null);
                    }
                  }}
                >
                  {actionLoading === "resend-link" ? "Sending…" : "Regenerate & send link"}
                </Button>
              </CardContent>
            </Card>
          ) : application.interviewToken ? (
            <Card className="border-border shadow-card">
              <CardHeader>
                <CardTitle className="text-base">Interview link</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/candidate/${application.interviewToken}`}
                  className="inline-flex items-center gap-1 text-sm text-brand hover:underline"
                  target="_blank"
                >
                  Open candidate interview
                  <PhosphorIcon name="ExternalLink" className="h-3.5 w-3.5" />
                </Link>
                {application.tokenExpiresAt ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Expires {formatDate(application.tokenExpiresAt)}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          <Card className="border-border shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Interview questions for this role</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {questions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No questions configured.</p>
              ) : (
                questions.map((q, i) => (
                  <div key={q.id} className="rounded-lg border border-border p-3 text-sm">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Q{i + 1}</span>
                      <span>·</span>
                      <span>{SECTION_LABELS[q.section]}</span>
                      {q.timeLimitSeconds ? <span>· {q.timeLimitSeconds}s</span> : null}
                    </div>
                    <p className="mt-1 font-medium">{q.promptText}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {session?.overallScore ? (
            <Card className="border-border shadow-card">
              <CardContent className="py-4">
                <p className="text-sm">
                  AI score: <strong>{session.overallScore.totalScore}/10</strong>
                  {job.passingScore != null && (
                    <span className="text-muted-foreground"> (threshold {job.passingScore})</span>
                  )}
                </p>
              </CardContent>
            </Card>
          ) : null}

          {session ? <ProctoringSummaryCard session={session} /> : null}
        </TabsContent>

        {session ? (
          <TabsContent value="proctoring" className="mt-6">
            <Card className="border-border shadow-card">
              <Collapsible defaultOpen={false}>
                <CollapsibleTrigger className="flex w-full items-center justify-between p-6 text-left hover:bg-muted/50 [&[data-state=open]>svg]:rotate-180">
                  <CardHeader className="p-0">
                    <CardTitle className="text-base">Proctoring audit log</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Continuous webcam monitoring, AI snapshot analysis, and browser integrity events.
                    </p>
                  </CardHeader>
                  <PhosphorIcon
                    name="ChevronDown"
                    className="h-5 w-5 shrink-0 transition-transform duration-200"
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <ProctoringLogView session={session} />
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          </TabsContent>
        ) : null}

        {session?.transcript?.length ? (
          <TabsContent value="transcript" className="mt-6">
            <Card className="border-border shadow-card">
              <Collapsible defaultOpen={false}>
                <CollapsibleTrigger className="flex w-full items-center justify-between p-6 text-left hover:bg-muted/50 [&[data-state=open]>svg]:rotate-180">
                  <CardHeader className="p-0">
                    <CardTitle className="text-base">Interview transcript</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Full text of the candidate&apos;s interview responses.
                    </p>
                  </CardHeader>
                  <PhosphorIcon
                    name="ChevronDown"
                    className="h-5 w-5 shrink-0 transition-transform duration-200"
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <TranscriptView entries={session.transcript} />
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          </TabsContent>
        ) : null}

        {session?.overallScore ? (
          <TabsContent value="scores" className="mt-6">
            <Card className="border-border shadow-card">
              <Collapsible defaultOpen={false}>
                <CollapsibleTrigger className="flex w-full items-center justify-between p-6 text-left hover:bg-muted/50 [&[data-state=open]>svg]:rotate-180">
                  <CardHeader className="p-0">
                    <CardTitle className="text-base">Score breakdown</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      AI evaluation of candidate responses across all questions.
                    </p>
                  </CardHeader>
                  <PhosphorIcon
                    name="ChevronDown"
                    className="h-5 w-5 shrink-0 transition-transform duration-200"
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <ScoreBreakdown
                      overall={session.overallScore}
                      questionScores={session.questionScores}
                      passingScore={job.passingScore}
                      transcript={session.transcript}
                    />
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          </TabsContent>
        ) : null}

        <TabsContent value="scorecard" className="mt-6 space-y-6">
          <ScorecardList applicationId={applicationId} />
          <Card className="border-border shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Human review scorecard</CardTitle>
              <p className="text-sm text-muted-foreground">
                Capture interviewer or hiring-manager feedback separately from the AI score.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Recommendation</label>
                  <select
                    value={recommendation}
                    onChange={(e) => setRecommendation(e.target.value as typeof recommendation)}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="strong_yes">Strong yes</option>
                    <option value="yes">Yes</option>
                    <option value="hold">Hold</option>
                    <option value="no">No</option>
                    <option value="strong_no">Strong no</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reviewer score (0-10)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={reviewScore}
                    onChange={(e) => setReviewScore(e.target.value)}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={5}
                  placeholder="Strengths, concerns, role fit, and follow-up areas."
                />
              </div>
              <Button
                onClick={() => void submitScorecard()}
                disabled={actionLoading === "scorecard"}
                className="rounded-full bg-brand hover:bg-brand/90"
              >
                {actionLoading === "scorecard" ? "Submitting…" : "Submit scorecard"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </FadeIn>
  );
}
