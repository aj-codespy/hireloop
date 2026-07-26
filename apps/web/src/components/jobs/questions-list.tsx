"use client";

import { PhosphorIcon } from "@/components/icons/phosphor-icon";
import { useState } from "react";
import { Question } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { renderQuestionAudioAction } from "@/app/actions/hireloop";

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
  const [generatingAudio, setGeneratingAudio] = useState<string | null>(null);

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

  async function handleGenerateAudio(questionId: string, promptText: string) {
    if (!promptText.trim()) return;
    setGeneratingAudio(questionId);
    try {
      const res = await renderQuestionAudioAction(jobId, questionId);
      if (res.success) {
        toast.success("Audio generated");
      } else {
        toast.error(res.error || "Failed to generate audio");
      }
    } catch {
      toast.error("Failed to generate audio");
    } finally {
      setGeneratingAudio(null);
    }
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
                      <PhosphorIcon name="GripVertical" className="h-5 w-5" />
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
                      {expanded === q.id ? <PhosphorIcon name="ChevronUp" className="h-4 w-4" /> : <PhosphorIcon name="ChevronDown" className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleGenerateAudio(q.id, q.promptText)}
                      disabled={generatingAudio === q.id || !q.promptText.trim()}
                      className="text-brand hover:text-brand/80"
                      title="Generate TTS audio"
                    >
                      {generatingAudio === q.id ? (
                        <span className="animate-spin">🔊</span>
                      ) : (
                        <PhosphorIcon name="Volume2" className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(q.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <PhosphorIcon name="Trash2" className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div id={`question-details-${q.id}`} className={cn("mt-3 overflow-hidden transition-all duration-200", expanded === q.id ? "max-h-96 opacity-100" : "max-h-0 opacity-0")}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-sm font-medium">Question</label>
                      <p className="font-medium">{q.promptText || "&mdash;"}</p>
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