"use client";

import { useState } from "react";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";
import { toast } from "sonner";
import {
  useJob,
  useQuestionsForJob,
  useHireLoop,
  useApplicationRows,
  type QuestionInput,
} from "@/lib/store/provider";
import { ShareJobLink } from "@/components/jobs/share-job-link";
import { useOrgPermissions } from "@/hooks/use-org-permissions";
import { JobDetailsEditor } from "@/components/jobs/job-details-editor";
import { JobFormFieldsEditor } from "@/components/jobs/job-form-fields-editor";
import { JobQuestionsEditor } from "@/components/jobs/job-questions-editor";
import { JobRulesEditor } from "@/components/jobs/job-rules-editor";
import { APPLICATION_STATUS_LABELS, SECTION_LABELS, STATUS_COLORS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { Question } from "@/lib/types";
import { FadeIn } from "@/components/motion/fade-in";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ButtonLink } from "@/components/ui/button-link";

function toQuestionInput(q: Question): QuestionInput {
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

export function JobDetailView({ jobId }: { jobId: string }) {
  const { hydrated, updateJob, setJobQuestions } = useHireLoop();
  const { canManageJobs } = useOrgPermissions();
  const job = useJob(jobId);
  const questions = useQuestionsForJob(jobId);
  const applicants = useApplicationRows().filter((r) => r.application.jobRoleId === jobId);

  const [editingDetails, setEditingDetails] = useState(false);
  const [editingForm, setEditingForm] = useState(false);
  const [editingQuestions, setEditingQuestions] = useState(false);
  const [editingRules, setEditingRules] = useState(false);

  if (!hydrated) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!job) return <p className="text-sm text-muted-foreground">Job not found</p>;

  return (
    <FadeIn className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{job.title}</h1>
            <Badge className={job.status === "live" ? "bg-emerald-50 text-emerald-700" : "bg-muted"}>
              {job.status === "live" ? "Published" : job.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Created {formatDate(job.createdAt)}
            {job.updatedAt !== job.createdAt ? ` · Updated ${formatDate(job.updatedAt)}` : ""}
          </p>
        </div>
        <ButtonLink href="/admin/jobs" variant="outline" className="rounded-full">
          All jobs
        </ButtonLink>
      </div>

      <Card className="border-brand/20 bg-brand-muted/30 shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Share application link</CardTitle>
          <p className="text-sm text-muted-foreground">
            Anyone with this link can submit an application. Set status to <strong>live</strong> to
            enable it.
          </p>
        </CardHeader>
        <CardContent>
          <ShareJobLink jobId={job.id} disabled={job.status !== "live"} />
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList className="h-auto flex-wrap gap-1 bg-transparent p-0">
          {["Overview", "Questions", "Application form", "Rules", "Applicants"].map((t) => (
            <TabsTrigger
              key={t}
              value={t.toLowerCase().replace(" ", "-")}
              className="rounded-full data-[state=active]:shadow-card"
            >
              {t}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-6 space-y-4">
          <Card className="border-border shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Job details</CardTitle>
              {!editingDetails && canManageJobs ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setEditingDetails(true)}
                >
                  <PhosphorIcon name="Pencil" className="mr-1 h-3.5 w-3.5" />
                  Edit
                </Button>
              ) : null}
            </CardHeader>
            <CardContent>
              {editingDetails ? (
                <JobDetailsEditor
                  job={job}
                  onSave={async (patch) => {
                    try {
                      await updateJob(jobId, patch);
                      setEditingDetails(false);
                      toast.success("Job details saved");
                    } catch {
                      toast.error("Could not save job details");
                    }
                  }}
                  onCancel={() => setEditingDetails(false)}
                />
              ) : (
                <>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {job.description || "No description"}
                  </p>
                  <p className="mt-3 text-sm">
                    Status: <span className="font-medium capitalize">{job.status}</span>
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-border shadow-card">
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold">{applicants.length}</p>
                <p className="text-xs text-muted-foreground">Applicants</p>
              </CardContent>
            </Card>
            <Card className="border-border shadow-card">
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold">
                  {job.interviewQuestionCount ?? questions.filter((q) => q.isActive).length}
                </p>
                <p className="text-xs text-muted-foreground">Asked per interview</p>
              </CardContent>
            </Card>
            <Card className="border-border shadow-card">
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold">{questions.length}</p>
                <p className="text-xs text-muted-foreground">In question pool</p>
              </CardContent>
            </Card>
            <Card className="border-border shadow-card">
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold">
                                  {job.passingScore != null ? `${job.passingScore}/10` : "&mdash;"}
                                </p>
                <p className="text-xs text-muted-foreground">Pass threshold</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Questions */}
        <TabsContent value="questions" className="mt-6">
          <Card className="border-border shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Interview questions</CardTitle>
              {!editingQuestions && questions.length > 0 && canManageJobs ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setEditingQuestions(true)}
                >
                  <PhosphorIcon name="Pencil" className="mr-1 h-3.5 w-3.5" />
                  Edit
                </Button>
              ) : null}
            </CardHeader>
            <CardContent>
              {editingQuestions || (questions.length === 0 && canManageJobs) ? (
                <JobQuestionsEditor
                  questions={questions.map(toQuestionInput)}
                  onSave={async (next, interviewQuestionCount) => {
                    const promise = setJobQuestions(jobId, next, interviewQuestionCount);
                    toast.promise(promise, {
                      loading: "Generating question audio in the background...",
                      success: "Questions saved successfully",
                      error: (err) => err instanceof Error ? err.message : "Could not save questions",
                    });
                    try {
                      await promise;
                      setEditingQuestions(false);
                    } catch {
                      // Handled by toast.promise
                    }
                  }}
                  onCancel={() => setEditingQuestions(false)}
                />
              ) : (
                <div className="divide-y divide-border">
                  {questions.map((q, i) => (
                    <div key={q.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>Q{i + 1}</span>
                        <span>· {SECTION_LABELS[q.section]}</span>
                        {q.isMandatory ? (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            Mandatory
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            Variable
                          </Badge>
                        )}
                        {!q.isActive ? <span>· Inactive</span> : null}
                        {q.timeLimitSeconds ? <span>· {q.timeLimitSeconds}s</span> : null}
                        {q.scoreThreshold ? <span>· flag &lt; {q.scoreThreshold}/10</span> : null}
                      </div>
                      <p className="mt-1 font-medium">{q.promptText}</p>
                      {q.idealAnswerNotes ? (
                        <p className="mt-1 text-sm text-muted-foreground">{q.idealAnswerNotes}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Application form */}
        <TabsContent value="application-form" className="mt-6">
          <Card className="border-border shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Application form fields</CardTitle>
              {!editingForm && canManageJobs ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setEditingForm(true)}
                >
                  <PhosphorIcon name="Pencil" className="mr-1 h-3.5 w-3.5" />
                  Edit
                </Button>
              ) : null}
            </CardHeader>
            <CardContent>
              {editingForm ? (
                <JobFormFieldsEditor
                  fields={job.formFields}
                  onSave={async (fields) => {
                    try {
                      await updateJob(jobId, { formFields: fields });
                      setEditingForm(false);
                      toast.success("Application form saved");
                    } catch {
                      toast.error("Could not save application form");
                    }
                  }}
                  onCancel={() => setEditingForm(false)}
                />
              ) : (
                <dl className="divide-y divide-border">
                  {job.formFields
                    .sort((a, b) => a.order - b.order)
                    .map((f) => (
                      <div key={f.id} className="flex justify-between py-3 text-sm">
                        <span className="font-medium">{f.label}</span>
                        <span className="text-muted-foreground">
                          {f.type}
                          {f.required ? " · required" : ""}
                        </span>
                      </div>
                    ))}
                </dl>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rules */}
        <TabsContent value="rules" className="mt-6">
          <Card className="border-border shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Eligibility & scoring thresholds</CardTitle>
              {!editingRules && canManageJobs ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setEditingRules(true)}
                >
                  <PhosphorIcon name="Pencil" className="mr-1 h-3.5 w-3.5" />
                  Edit
                </Button>
              ) : null}
            </CardHeader>
            <CardContent>
              {editingRules ? (
                <JobRulesEditor
                  formFields={job.formFields}
                  eligibilityRules={job.eligibilityRules}
                  passingScore={job.passingScore}
                  onSave={async (rules, passingScore) => {
                    try {
                      await updateJob(jobId, { eligibilityRules: rules, passingScore });
                      setEditingRules(false);
                      toast.success("Rules saved");
                    } catch {
                      toast.error("Could not save rules");
                    }
                  }}
                  onCancel={() => setEditingRules(false)}
                />
              ) : (
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="font-medium">Eligibility rules</p>
                    {job.eligibilityRules.length === 0 ? (
                      <p className="mt-1 text-muted-foreground">None &mdash; all applicants accepted.</p>
                    ) : (
                      <ul className="mt-2 space-y-1">
                        {job.eligibilityRules.map((r, i) => (
                          <li key={i} className="text-muted-foreground">
                            {r.label} {r.operator} {r.value}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">AI pass threshold</p>
                    <p className="mt-1 text-muted-foreground">
                      {job.passingScore != null
                        ? `${job.passingScore}/10 minimum`
                        : "Not configured"}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Applicants */}
        <TabsContent value="applicants" className="mt-6">
          <Card className="border-border shadow-card">
            <CardContent className="p-0">
              {applicants.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">
                                  No applicants yet &mdash; share the link above.
                                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {applicants.map(({ candidate, application }) => (
                    <li
                      key={application.id}
                      className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                    >
                      <ButtonLink
                        href={`/admin/candidates/${candidate?.id}`}
                        variant="link"
                        className="h-auto p-0 font-medium"
                      >
                        {candidate?.name}
                      </ButtonLink>
                      <span className="text-sm text-muted-foreground">{candidate?.email}</span>
                      <Badge className={STATUS_COLORS[application.status]}>
                        {APPLICATION_STATUS_LABELS[application.status]}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </FadeIn>
  );
}
