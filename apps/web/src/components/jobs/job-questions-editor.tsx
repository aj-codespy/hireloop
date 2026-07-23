"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import type { QuestionInput } from "@/lib/store/provider";
import type { QuestionSection } from "@/lib/types";
import { SECTION_LABELS } from "@/lib/constants";
import {
  countMandatoryQuestions,
  countActiveQuestions,
  validateInterviewQuestionCount,
  INTERVIEW_CONFIG_ERRORS,
} from "@/lib/interview-questions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const SECTIONS: QuestionSection[] = ["technical", "situational", "hr"];

const emptyQuestion = (section: QuestionSection = "technical"): QuestionInput => ({
  section,
  promptText: "",
  idealAnswerNotes: "",
  timeLimitSeconds: null,
  scoreThreshold: null,
  isActive: true,
  isMandatory: false,
});

function ValidationPill({ valid }: { valid: boolean }) {
  return (
    <Badge
      className={cn(
        "rounded-full",
        valid ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
      )}
    >
      {valid ? "Configuration valid" : "Check interview count"}
    </Badge>
  );
}

export function JobQuestionsEditor({
  questions: initial,
  interviewQuestionCount: initialCount,
  onSave,
  onCancel,
  saveLabel = "Save questions",
}: {
  questions: QuestionInput[];
  interviewQuestionCount?: number | null;
  onSave: (questions: QuestionInput[], interviewQuestionCount: number | null) => void;
  onCancel?: () => void;
  saveLabel?: string;
}) {
  const [questions, setQuestions] = useState(initial);
  const [interviewCount, setInterviewCount] = useState(
    initialCount != null ? String(initialCount) : ""
  );
  const [configError, setConfigError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<QuestionSection>("technical");
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setQuestions(initial);
  }

  const [prevInitialCount, setPrevInitialCount] = useState(initialCount);
  if (initialCount !== prevInitialCount) {
    setPrevInitialCount(initialCount);
    setInterviewCount(initialCount != null ? String(initialCount) : "");
  }

  // Refs for smooth scrolling
  const questionContainerRef = useRef<HTMLDivElement>(null);
  const questionRowRefs = useRef<Record<number, HTMLDivElement>>({});
  
  // Track the index of the newly added question to scroll to it
  const [scrollToIndex, setScrollToIndex] = useState<number | null>(null);

  // Refs for scroll-to-view functionality
  const questionRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [newlyAddedIndex, setNewlyAddedIndex] = useState<number | null>(null);

  // Scroll to newly added question when it expands
  useEffect(() => {
    if (newlyAddedIndex !== null) {
      const element = questionRefs.current[newlyAddedIndex];
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      setNewlyAddedIndex(null);
    }
  }, [newlyAddedIndex]);

  const mandatoryCount = useMemo(() => countMandatoryQuestions(questions), [questions]);
  const activeCount = useMemo(() => countActiveQuestions(questions), [questions]);
  const variableCount = Math.max(0, activeCount - mandatoryCount);

  const parsedCount = interviewCount.trim() ? Number(interviewCount) : null;
  const validationError = useMemo(
    () => validateInterviewQuestionCount(parsedCount, questions.filter((q) => q.promptText.trim())),
    [parsedCount, questions]
  );
  const isValid = !validationError;

  const sectionCounts = useMemo(() => {
    const counts: Record<QuestionSection, number> = {
      technical: 0,
      situational: 0,
      hr: 0,
    };
    for (const q of questions) {
      if (q.promptText.trim() && q.isActive) counts[q.section]++;
    }
    return counts;
  }, [questions]);

  const filteredIndices = useMemo(
    () =>
      questions
        .map((q, i) => ({ q, i }))
        .filter(({ q }) => q.section === activeSection),
    [questions, activeSection]
  );

  const mandatoryInSection = filteredIndices.filter(({ q }) => q.isMandatory);
  const variableInSection = filteredIndices.filter(({ q }) => !q.isMandatory);

  const moveQuestion = (index: number, direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0 || next >= questions.length) return;
    const copy = [...questions];
    [copy[index], copy[next]] = [copy[next], copy[index]];
    setQuestions(copy);
  };

  const updateQuestion = (index: number, patch: Partial<QuestionInput>) => {
    const next = [...questions];
    next[index] = { ...next[index], ...patch };
    setQuestions(next);
    setConfigError(null);
  };

  const handleSave = () => {
    const valid = questions.filter((q) => q.promptText.trim());
    const error = validateInterviewQuestionCount(parsedCount, valid);
    if (error) {
      setConfigError(INTERVIEW_CONFIG_ERRORS[error]);
      return;
    }
    setConfigError(null);
    onSave(valid, parsedCount);
  };

  const renderQuestionRow = (q: QuestionInput, i: number) => {
    const isOpen = expanded[i] ?? false;
    return (
      <div
        key={q.id ?? i}
        ref={(el) => {
          questionRefs.current[i] = el;
        }}
        className={cn(
          "rounded-xl border border-border bg-card transition-colors",
          q.isMandatory && "border-brand/20 bg-brand-subtle/30"
        )}
      >
        <div className="flex items-start gap-2 p-3">
          <div className="flex flex-col gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => moveQuestion(i, -1)}
              disabled={i === 0}
              aria-label="Move question up"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => moveQuestion(i, 1)}
              disabled={i === questions.length - 1}
              aria-label="Move question down"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
          <button
            type="button"
            className="min-w-0 flex-1 text-left focus-ring rounded-md"
            onClick={() => setExpanded((prev) => ({ ...prev, [i]: !isOpen }))}
            aria-expanded={isOpen}
          >
            <div className="flex flex-wrap items-center gap-2">
              {q.isMandatory ? (
                <Badge className="bg-brand-muted text-brand">Mandatory</Badge>
              ) : (
                <Badge variant="secondary">Variable</Badge>
              )}
              {!q.isActive ? <Badge variant="outline">Inactive</Badge> : null}
            </div>
            <p className="mt-1 line-clamp-2 text-sm font-medium">
              {q.promptText.trim() || "Untitled question"}
            </p>
          </button>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => setQuestions((prev) => prev.filter((_, j) => j !== i))}
            aria-label="Delete question"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        {isOpen ? (
          <div className="space-y-3 border-t border-border p-4">
            <Textarea
              placeholder="Question prompt"
              rows={2}
              value={q.promptText}
              onChange={(e) => updateQuestion(i, { promptText: e.target.value })}
              aria-label="Question prompt"
            />
            <Textarea
              placeholder="Ideal answer notes (for scoring reference)"
              rows={2}
              value={q.idealAnswerNotes}
              onChange={(e) => updateQuestion(i, { idealAnswerNotes: e.target.value })}
              aria-label="Ideal answer notes"
            />
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={q.isMandatory}
                  onCheckedChange={(checked) => updateQuestion(i, { isMandatory: checked })}
                  id={`mandatory-${i}`}
                />
                <Label htmlFor={`mandatory-${i}`} className="text-xs">
                  Mandatory
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={q.isActive}
                  onCheckedChange={(checked) => updateQuestion(i, { isActive: checked })}
                  id={`active-${i}`}
                />
                <Label htmlFor={`active-${i}`} className="text-xs">
                  Active
                </Label>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Time limit (seconds)</Label>
                <Input
                  type="number"
                  placeholder="Platform default"
                  value={q.timeLimitSeconds ?? ""}
                  onChange={(e) =>
                    updateQuestion(i, {
                      timeLimitSeconds: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Score flag threshold /10</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="None"
                  value={q.scoreThreshold ?? ""}
                  onChange={(e) =>
                    updateQuestion(i, {
                      scoreThreshold: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-brand-subtle/40 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-medium">Interview setup</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Mandatory questions run for every candidate. Variable questions are sampled from the
              pool each interview.
            </p>
          </div>
          <ValidationPill valid={isValid} />
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <span>
            <strong>{activeCount}</strong> active
          </span>
          <span>
            <strong>{mandatoryCount}</strong> mandatory
          </span>
          <span>
            <strong>{variableCount}</strong> variable
          </span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Questions asked per interview</Label>
            <Input
              type="number"
              min={1}
              placeholder={`All active (${activeCount})`}
              value={interviewCount}
              onChange={(e) => {
                setInterviewCount(e.target.value);
                setConfigError(null);
              }}
            />
          </div>
          <p className="self-end text-xs text-muted-foreground pb-2">
            Leave blank to ask every active question. Must exceed mandatory count ({mandatoryCount})
            and not exceed pool size ({activeCount}).
          </p>
        </div>
        {configError ? <p className="mt-2 text-sm text-destructive">{configError}</p> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-2">
          <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Sections
          </p>
          {SECTIONS.map((section) => (
            <button
              key={section}
              type="button"
              onClick={() => setActiveSection(section)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-ring",
                activeSection === section
                  ? "bg-brand-muted text-brand"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              aria-current={activeSection === section ? "true" : undefined}
            >
              {SECTION_LABELS[section]}
              <Badge variant="secondary">{sectionCounts[section]}</Badge>
            </button>
          ))}
          <Button
            type="button"
            variant="outline"
            className="mt-2 w-full rounded-full"
            onClick={() => {
              const newIndex = questions.length;
              setQuestions((prev) => [...prev, emptyQuestion(activeSection)]);
              setExpanded((e) => ({ ...e, [newIndex]: true }));
              setNewlyAddedIndex(newIndex);
            }}
          >
            <Plus className="mr-1 h-4 w-4" aria-hidden />
            Add to {SECTION_LABELS[activeSection]}
          </Button>
        </aside>

        <div className="space-y-4">
          {mandatoryInSection.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Mandatory
              </p>
              {mandatoryInSection.map(({ q, i }) => renderQuestionRow(q, i))}
            </div>
          ) : null}
          {variableInSection.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Variable pool
              </p>
              {variableInSection.map(({ q, i }) => renderQuestionRow(q, i))}
            </div>
          ) : null}
          {filteredIndices.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              No questions in {SECTION_LABELS[activeSection]} yet.
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="button" className="rounded-full bg-brand hover:bg-brand/90" onClick={handleSave}>
          {saveLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" className="rounded-full" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </div>
  );
}
