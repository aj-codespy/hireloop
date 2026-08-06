"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";
import { toast } from "sonner";
import {
  useHireLoop,
  type CreateJobInput,
  type QuestionInput,
} from "@/lib/store/provider";
import { slugifyFieldKey, generateId } from "@/lib/id";
import {
  DOCUMENT_FIELD_PRESETS,
  FORM_FIELD_TYPES,
  FORM_FIELD_TYPE_LABELS,
} from "@/lib/form-fields";
import { getJobCloneDataAction } from "@/app/actions/hireloop";
import type { ApplicationFormField, EligibilityRule, FormFieldType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/motion/fade-in";
import { JobQuestionsEditor } from "@/components/jobs/job-questions-editor";

const STEPS = [
  { label: "Job details", description: "Define the role candidates will see." },
  { label: "Application form", description: "Collect the information you need to screen fairly." },
  { label: "Interview questions", description: "Build your question pool. Mandatory questions always run; others are sampled." },
  { label: "Rules & thresholds", description: "Set pass rules and who advances automatically." },
  { label: "Publish", description: "Review and publish. Share the apply link when you're ready." },
];
const FIELD_TYPES = FORM_FIELD_TYPES;

const defaultFields = (): ApplicationFormField[] => [
  { id: generateId("f"), fieldKey: "name", label: "Full name", type: "text", required: true, order: 1 },
  { id: generateId("f"), fieldKey: "email", label: "Email", type: "email", required: true, order: 2 },
];

const emptyQuestion = (): QuestionInput => ({
  section: "technical",
  promptText: "",
  idealAnswerNotes: "",
  timeLimitSeconds: null,
  scoreThreshold: null,
  isActive: true,
  isMandatory: false,
});

export function JobCreationWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cloneJobId = searchParams.get("clone");
  const { createJob, setJobQuestions, getJobApplyUrl } = useHireLoop();
  const [step, setStep] = useState(0);
  const [createdJobId, setCreatedJobId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const [isCloning, setIsCloning] = useState(false);
  const [hasCloned, setHasCloned] = useState(false);

  // Step 1
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Step 2
  const [formFields, setFormFields] = useState<ApplicationFormField[]>(defaultFields);

  // Step 3
  const [rounds, setRounds] = useState<import("@/lib/store/provider").RoundInput[]>([{
    id: generateId("round"),
    title: "Round 1: Technical Screen",
    interviewType: "ai",
    passingScore: 7.0, // Default to some score, or maybe null
    interviewQuestionCount: null,
    questions: [emptyQuestion()]
  }]);
  const [editingRoundIndex, setEditingRoundIndex] = useState<number | null>(null);

  // Step 4
  const [rules, setRules] = useState<EligibilityRule[]>([]);

  const [publishLive, setPublishLive] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const publishingRef = useRef(false);

  function addField() {
    const label = "New field";
    setFormFields((prev) => [
      ...prev,
      {
        id: generateId("f"),
        fieldKey: slugifyFieldKey(label),
        label,
        type: "text",
        required: false,
        order: prev.length + 1,
      },
    ]);
  }

  function addRule() {
    const firstNumeric = formFields.find((f) => f.type === "number");
    setRules((prev) => [
      ...prev,
      {
        fieldKey: firstNumeric?.fieldKey ?? "field",
        label: firstNumeric?.label ?? "Field",
        operator: ">=",
        value: 0,
      },
    ]);
  }

  useEffect(() => {
    if (cloneJobId && !hasCloned) {
      setIsCloning(true);
      getJobCloneDataAction(cloneJobId).then((data) => {
        setIsCloning(false);
        setHasCloned(true);
        if (data && 'ok' in data === false) {
          setTitle(data.title);
          setDescription(data.description || "");
          setFormFields(data.formFields);
          setRules(data.eligibilityRules);
          if (data.rounds && data.rounds.length > 0) {
            setRounds(data.rounds);
          }
          toast.success("Job template loaded");
        } else if (data && 'ok' in data && !data.ok) {
          toast.error(data.error);
        }
      }).catch((err) => {
        setIsCloning(false);
        setHasCloned(true);
        toast.error("Failed to load job template");
      });
    }
  }, [cloneJobId, hasCloned]);

  if (isCloning) {
    return <div className="p-8 text-center text-muted-foreground">Loading template...</div>;
  }

  async function handlePublish() {
    // Guard against double-clicks / repeated submission while audio is generating.
    if (publishingRef.current) return;
    if (!title.trim()) {
      toast.error("Job title is required");
      setStep(0);
      return;
    }

    if (rounds.length === 0) {
      toast.error("Add at least one interview round");
      setStep(2);
      return;
    }
    
    // We will validate all rounds
    for (const round of rounds) {
      const validQuestions = round.questions.filter((q) => q.promptText.trim());
      if (validQuestions.length === 0) {
        toast.error(`Add at least one interview question to ${round.title}`);
        setStep(2);
        return;
      }
    }

    const input: CreateJobInput = {
      title: title.trim(),
      description: description.trim(),
      status: publishLive ? "live" : "draft",
      formFields: formFields.map((f, i) => ({ ...f, order: i + 1 })),
      eligibilityRules: rules,
      passingScore: null,
      rounds: rounds.map(r => ({
        ...r,
        questions: r.questions.filter((q) => q.promptText.trim()),
        passingScore: r.passingScore
      })),
    };

    // Acquire the re-entry lock before any work that creates side effects.
    publishingRef.current = true;
    setIsPublishing(true);
    try {
      let job;
      try {
        job = await createJob(input);
      } catch {
        toast.error("Could not save job");
        return;
      }

      // Pass the rounds via setJobQuestions (we just pass an empty questions array for the legacy arg, or we can pass the first round's questions to avoid breaking old getters temporarily)
      const legacyQuestions = rounds[0]?.questions.filter((q) => q.promptText.trim()) || [];
      const promise = setJobQuestions(job.id, legacyQuestions, null, input.rounds);
      toast.promise(promise, {
        loading: "Generating question audio in the background...",
        success: publishLive ? "Job published" : "Job saved as draft",
        error: (err) => err instanceof Error ? err.message : "Could not save job",
      });

      try {
        await promise;
        setCreatedJobId(job.id);
        setStep(4);
      } catch {
        // Handled by toast.promise
      }
    } finally {
      publishingRef.current = false;
      setIsPublishing(false);
    }
  }

  async function copyLink() {
    if (!createdJobId) return;
    await navigator.clipboard.writeText(getJobApplyUrl(createdJobId));
    setCopied(true);
    toast.success("Application link copied");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s.label}
              type="button"
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus-ring ${
                i === step
                  ? "bg-brand text-brand-foreground"
                  : i < step
                    ? "bg-brand-muted text-brand"
                    : "bg-muted text-muted-foreground"
              }`}
              aria-current={i === step ? "step" : undefined}
            >
              {i < step ? <PhosphorIcon name="Check" /> : <span>{i + 1}</span>}
              {s.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{STEPS[step].description}</p>
      </div>

      <FadeIn key={step}>
        {step === 0 && (
          <Card className="border-border shadow-card">
            <CardHeader>
              <CardTitle>Define the role</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-job-title">Job title *</Label>
                <Input id="new-job-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Graduate Accountant" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-job-description">Description</Label>
                <Textarea
                  id="new-job-description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this role involve?"
                />
              </div>
              <Button className="rounded-full bg-brand hover:bg-brand/90" onClick={() => setStep(1)}>
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <Card className="border-border shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Application form</CardTitle>
              <Button variant="outline" size="sm" className="rounded-full" onClick={addField}>
                <PhosphorIcon name="Plus" className="mr-1 h-4 w-4" />
                Add field
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Candidates fill these on the public apply page. Use number fields for eligibility rules later.
              </p>
              <div className="flex flex-wrap gap-2">
                {DOCUMENT_FIELD_PRESETS.map((preset) => (
                  <Button
                    key={preset.fieldKey}
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setFormFields((prev) => [
                        ...prev,
                        {
                          id: generateId("f"),
                          fieldKey: preset.fieldKey,
                          label: preset.label,
                          type: preset.type,
                          required: true,
                          order: prev.length + 1,
                        },
                      ])
                    }
                  >
                    + {preset.label}
                  </Button>
                ))}
              </div>
              {formFields.map((field, i) => (
                <div key={field.id} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-4">
                  <Input
                    value={field.label}
                    onChange={(e) => {
                      const next = [...formFields];
                      next[i] = {
                        ...field,
                        label: e.target.value,
                        fieldKey: slugifyFieldKey(e.target.value) || field.fieldKey,
                      };
                      setFormFields(next);
                    }}
                    placeholder="Label"
                  />
                  <Input value={field.fieldKey} readOnly className="bg-muted/50 text-muted-foreground" />
                  <Select
                    value={field.type}
                    onValueChange={(v) => {
                      if (!v) return;
                      const next = [...formFields];
                      next[i] = { ...field, type: v as FormFieldType };
                      setFormFields(next);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {FORM_FIELD_TYPE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={field.required}
                        onCheckedChange={(c) => {
                          const next = [...formFields];
                          next[i] = { ...field, required: c };
                          setFormFields(next);
                        }}
                      />
                      <span className="text-xs">Required</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setFormFields((prev) => prev.filter((f) => f.id !== field.id))}
                    >
                      <PhosphorIcon name="Trash2" className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="rounded-full" onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button className="rounded-full bg-brand hover:bg-brand/90" onClick={() => setStep(2)}>
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && editingRoundIndex === null && (
          <Card className="border-border shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Interview rounds</CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full" 
                onClick={() => setRounds([...rounds, { 
                  id: generateId("round"), 
                  title: `Round ${rounds.length + 1}`, 
                  interviewType: "ai", 
                  passingScore: null, 
                  interviewQuestionCount: null, 
                  questions: [emptyQuestion()] 
                }])}
              >
                <PhosphorIcon name="Plus" className="mr-1 h-4 w-4" />
                Add round
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Define the sequence of interview rounds candidates will go through.
              </p>
              <div className="space-y-4">
                {rounds.map((r, i) => (
                  <div key={r.id || i} className="group flex flex-col gap-4 rounded-xl border border-border p-5 transition-colors hover:border-brand/50 bg-card">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Input 
                          value={r.title} 
                          onChange={e => { const next = [...rounds]; next[i].title = e.target.value; setRounds(next); }} 
                          className="max-w-[300px] border-none px-0 text-lg font-semibold shadow-none focus-visible:ring-0 h-auto py-1"
                          placeholder="Round title"
                        />
                        <div className="text-sm text-muted-foreground mt-1">
                          {r.questions.length} question{r.questions.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="secondary" className="rounded-full" onClick={() => setEditingRoundIndex(i)}>
                          Configure questions
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => setRounds(rounds.filter((_, idx) => idx !== i))}
                          disabled={rounds.length === 1}
                        >
                          <PhosphorIcon name="Trash2" className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                      <div className="space-y-2">
                        <Label>Round Type</Label>
                        <Select
                          value={r.interviewType || "ai"}
                          onValueChange={(val: any) => { const next = [...rounds]; next[i].interviewType = val; setRounds(next); }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ai">AI Interview</SelectItem>
                            <SelectItem value="online">Online Assessment</SelectItem>
                            <SelectItem value="offline">Offline / In-person</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Passing Threshold (%)</Label>
                        <Input 
                          type="number"
                          min={0}
                          max={100}
                          placeholder="No threshold"
                          value={r.passingScore ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const next = [...rounds];
                            next[i].passingScore = val ? Number(val) : null;
                            setRounds(next);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="rounded-full" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button className="rounded-full bg-brand hover:bg-brand/90" onClick={() => setStep(3)}>
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && editingRoundIndex !== null && (
          <Card className="border-border shadow-card">
            <CardHeader>
              <CardTitle>Configure: {rounds[editingRoundIndex].title}</CardTitle>
            </CardHeader>
            <CardContent>
              <JobQuestionsEditor
                questions={rounds[editingRoundIndex].questions}
                saveLabel="Done"
                onSave={(qs) => {
                  const next = [...rounds];
                  next[editingRoundIndex].questions = qs.length ? qs : [emptyQuestion()];
                  // We remove interviewQuestionCount completely from logic
                  next[editingRoundIndex].interviewQuestionCount = null;
                  setRounds(next);
                  setEditingRoundIndex(null);
                }}
                onCancel={() => setEditingRoundIndex(null)}
              />
            </CardContent>
          </Card>

        )}

        {step === 3 && (
          <Card className="border-border shadow-card">
            <CardHeader>
              <CardTitle>Rules & thresholds (all optional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border border-dashed border-border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Eligibility rules</p>
                    <p className="text-sm text-muted-foreground">
                      Auto-reject on apply if rules fail. Leave empty to accept all applicants.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-full" onClick={addRule}>
                    Add rule
                  </Button>
                </div>
                {rules.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">No rules. All applicants proceed to review.</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {rules.map((rule, i) => (
                      <div key={i} className="grid gap-2 sm:grid-cols-4">
                        <Select
                          value={rule.fieldKey}
                          onValueChange={(v) => {
                            if (!v) return;
                            const f = formFields.find((x) => x.fieldKey === v);
                            const next = [...rules];
                            next[i] = { ...rule, fieldKey: v, label: f?.label ?? v };
                            setRules(next);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {formFields.map((f) => (
                              <SelectItem key={f.id} value={f.fieldKey}>
                                {f.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={rule.operator}
                          onValueChange={(v) => {
                            if (!v) return;
                            const next = [...rules];
                            next[i] = { ...rule, operator: v as EligibilityRule["operator"] };
                            setRules(next);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="<=">&le;</SelectItem>
                            <SelectItem value=">=">&ge;</SelectItem>
                            <SelectItem value="=">=</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          value={String(rule.value)}
                          onChange={(e) => {
                            const next = [...rules];
                            next[i] = { ...rule, value: e.target.value };
                            setRules(next);
                          }}
                        />
                        <Button variant="ghost" onClick={() => setRules((prev) => prev.filter((_, j) => j !== i))}>
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Switch checked={publishLive} onCheckedChange={setPublishLive} />
                <Label>Publish immediately (candidates can apply via share link)</Label>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="rounded-full" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button className="rounded-full bg-brand hover:bg-brand/90" onClick={handlePublish} disabled={isPublishing}>
                  {isPublishing
                    ? "Creating job…"
                    : publishLive ? "Publish job" : "Save as draft"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && createdJobId && (
          <Card className="border-border shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PhosphorIcon name="Check" className="h-5 w-5 text-emerald-600" />
                Job created
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Share this link with candidates. Submissions appear on your dashboard instantly.
              </p>
              <div className="flex gap-2">
                <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
                  <PhosphorIcon name="Link2" className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{getJobApplyUrl(createdJobId)}</span>
                </div>
                <Button className="rounded-full bg-brand hover:bg-brand/90" onClick={copyLink}>
                  {copied ? <PhosphorIcon name="Check" className="h-4 w-4" /> : <PhosphorIcon name="Copy" className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  className="rounded-full bg-brand hover:bg-brand/90"
                  onClick={() => router.push(`/admin/jobs/${createdJobId}`)}
                >
                  View job
                </Button>
                <Button variant="outline" className="rounded-full" onClick={() => router.push("/admin")}>
                  Go to dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </FadeIn>
    </div>
  );
}
