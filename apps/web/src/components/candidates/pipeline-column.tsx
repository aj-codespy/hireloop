"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { PipelineColumn as PipelineColumnType } from "@/hooks/useInterviewPipeline";
import { CandidateCard } from "./candidate-card";
import { STATUS_COLORS } from "@/lib/constants";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";

interface PipelineColumnProps {
  column: PipelineColumnType;
  isOver?: boolean;
}

const STATUS_ACCENT: Record<string, string> = {
  applied: "border-slate-300 dark:border-slate-600",
  shortlisted: "border-blue-400 dark:border-blue-600",
  interview_sent: "border-indigo-400 dark:border-indigo-600",
  interviewed: "border-amber-400 dark:border-amber-600",
  passed_ai: "border-cyan-400 dark:border-cyan-600",
  partner_review: "border-orange-400 dark:border-orange-600",
  hired: "border-emerald-400 dark:border-emerald-600",
};

export function PipelineColumn({ column, isOver }: PipelineColumnProps) {
  const { status, label, candidates } = column;
  const totalScore =
    candidates.length > 0
      ? candidates.reduce((sum, c) => sum + (c.score ?? 0), 0) / candidates.length
      : null;

  const { setNodeRef } = useDroppable({
    id: status,
    data: { type: "column", status },
  });

  return (
    <div
      className={`flex w-64 shrink-0 flex-col rounded-2xl border-2 bg-card/50 transition-colors ${
        isOver ? "border-brand bg-brand/5" : `border-border ${STATUS_ACCENT[status] ?? "border-border"}`
      }`}
    >
      {/* Column header */}
      <div className="sticky top-0 z-10 border-b border-border bg-card/80 px-3 py-2 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{label}</h3>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[11px] font-medium">
            {candidates.length}
          </span>
        </div>
        {totalScore != null && candidates.length > 0 && (
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            avg score {totalScore.toFixed(1)}
          </p>
        )}
      </div>

      {/* Droppable card list */}
      <div ref={setNodeRef} className="flex flex-1 flex-col gap-2 p-2">
        <SortableContext
          items={candidates.map((c) => `card:${c.applicationId}`)}
          strategy={verticalListSortingStrategy}
        >
          {candidates.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-8 text-center">
              <p className="text-xs text-muted-foreground">Drop candidates here</p>
            </div>
          ) : (
            candidates.map((candidate) => (
              <CandidateCard key={candidate.applicationId} candidate={candidate} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}