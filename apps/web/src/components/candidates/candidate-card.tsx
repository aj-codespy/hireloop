"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { Clock, FileText, GripVertical } from "lucide-react";
import { PipelineCandidate } from "@/hooks/useInterviewPipeline";
import { StatusBadge } from "@/components/patterns/status-badge";
import { HoverLift } from "@/components/motion/interactions";

function daysInStage(createdAt: string): number {
  return Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24),
  );
}

interface CandidateCardProps {
  candidate: PipelineCandidate;
  isDragging?: boolean;
}

function daysLabel(createdAt: string) {
  const d = daysInStage(createdAt);
  if (d === 0) return "Today";
  if (d === 1) return "1d";
  return `${d}d`;
}

export function CandidateCard({ candidate, isDragging }: CandidateCardProps) {
  const { candidateName, candidateInitials, jobTitle, applicationId, createdAt, score, hasResume } =
    candidate;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: `card:${applicationId}`,
    data: { type: "card", applicationId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  };

  return (
    <HoverLift>
      <div
        ref={setNodeRef}
        style={style}
        className={`group relative rounded-xl border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md ${
          isDragging ? "rotate-2 shadow-lg ring-2 ring-brand" : ""
        }`}
      >
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="absolute left-0 top-0 flex h-full w-6 cursor-grab items-center justify-center rounded-l-xl text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="pl-4">
          {/* Header: avatar + name */}
          <div className="flex items-start gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-muted text-xs font-semibold text-brand">
              {candidateInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium leading-tight">{candidateName}</p>
              <p className="truncate text-xs text-muted-foreground">{jobTitle}</p>
            </div>
          </div>

          {/* Badges row */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <StatusBadge status={candidate.status} className="text-[10px]" />
            {score != null && (
              <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {score.toFixed(1)}
              </span>
            )}
            {hasResume && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <FileText className="h-3 w-3" aria-hidden />
                CV
              </span>
            )}
          </div>

          {/* Footer: time in stage */}
          <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" aria-hidden />
            <span>{daysLabel(createdAt)} in stage</span>
          </div>
        </div>
      </div>
    </HoverLift>
  );
}