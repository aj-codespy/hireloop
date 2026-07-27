"use client";

import { useState, useRef, useEffect } from "react";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";
import type { QuestionInput } from "@/lib/store/provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

const emptyQuestion = (): QuestionInput => ({
  section: "technical",
  promptText: "",
  idealAnswerNotes: "",
  timeLimitSeconds: null,
  scoreThreshold: null,
  isActive: true,
  isMandatory: true, // Since all are used, they are effectively all mandatory
});

export function JobQuestionsEditor({
  questions: initial,
  onSave,
  onCancel,
  saveLabel = "Save questions",
}: {
  questions: QuestionInput[];
  // Keep signature but pass null for count
  onSave: (questions: QuestionInput[], interviewQuestionCount: number | null) => void;
  onCancel?: () => void;
  saveLabel?: string;
}) {
  const [questions, setQuestions] = useState(initial);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setQuestions(initial);
  }

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
  };

  const handleSave = () => {
    const valid = questions.filter((q) => q.promptText.trim());
    onSave(valid, null);
  };

  const renderQuestionRow = (q: QuestionInput, i: number) => {
    const isOpen = expanded[i] ?? false;
    return (
      <div
        key={q.id ?? i}
        ref={(el) => {
          questionRefs.current[i] = el;
        }}
        className="rounded-xl border border-border bg-card transition-colors"
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
              <PhosphorIcon name="ChevronUp" className="h-4 w-4" />
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
              <PhosphorIcon name="ChevronDown" className="h-4 w-4" />
            </Button>
          </div>
          <button
            type="button"
            className="min-w-0 flex-1 text-left focus-ring rounded-md"
            onClick={() => setExpanded((prev) => ({ ...prev, [i]: !isOpen }))}
            aria-expanded={isOpen}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Question {i + 1}</Badge>
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
            <PhosphorIcon name="Trash2" className="h-4 w-4" />
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
                  checked={q.isActive}
                  onCheckedChange={(checked) => updateQuestion(i, { isActive: checked })}
                  id={`active-${i}`}
                />
                <label htmlFor={`active-${i}`} className="text-sm font-medium cursor-pointer">
                  Active
                </label>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          {questions.map((q, i) => renderQuestionRow(q, i))}
          {questions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              No questions added yet.
            </div>
          ) : null}
        </div>
        
        <Button
          type="button"
          variant="outline"
          className="w-full rounded-full border-dashed"
          onClick={() => {
            const newIndex = questions.length;
            setQuestions((prev) => [...prev, emptyQuestion()]);
            setExpanded((e) => ({ ...e, [newIndex]: true }));
            setNewlyAddedIndex(newIndex);
          }}
        >
          <PhosphorIcon name="Plus" className="mr-2 h-4 w-4" />
          Add Question
        </Button>
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
