"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter,
} from "@dnd-kit/core";
import { Search, SlidersHorizontal } from "lucide-react";
import { useInterviewPipeline } from "@/hooks/useInterviewPipeline";
import { PipelineColumn } from "./pipeline-column";
import { CandidateCard } from "./candidate-card";
import { Input } from "@/components/ui/input";
import { useApplicationRows } from "@/lib/store/provider";

export function InterviewPipeline() {
  const {
    columns,
    searchQuery,
    setSearchQuery,
    selectedJobId,
    setSelectedJobId,
    availableJobs,
    handleDragEnd,
    staleCounts,
    totalCandidates,
    organizationName,
  } = useInterviewPipeline();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [view, setView] = useState<"board" | "table">("board");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const onDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const onDragOver = useCallback((event: DragOverEvent) => {
    setOverId(String(event.over?.id ?? null));
  }, []);

  const onDnDDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      setOverId(null);
      handleDragEnd(String(event.active.id), String(event.over?.id ?? null));
    },
    [handleDragEnd],
  );

  const rows = useApplicationRows();
  const activeCandidate = activeId
    ? columns.flatMap((c) => c.candidates).find((c) => `card:${c.applicationId}` === activeId)
    : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-title">Pipeline</h2>
          <p className="text-caption text-muted-foreground">
            {organizationName} &middot; {totalCandidates} candidate{totalCandidates !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search
              className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidates…"
              className="h-8 w-48 pl-8 text-sm"
            />
          </div>

          {/* Job filter */}
          {availableJobs.length > 0 && (
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              <select
                value={selectedJobId ?? ""}
                onChange={(e) => setSelectedJobId(e.target.value || null)}
                className="h-8 rounded-lg border border-border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="">All jobs</option>
                {availableJobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-1 rounded-lg border border-border p-0.5 w-fit">
        <button
          onClick={() => setView("board")}
          className={`rounded-md px-3 py-1 text-sm transition-colors ${
            view === "board" ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Board
        </button>
        <button
          onClick={() => setView("table")}
          className={`rounded-md px-3 py-1 text-sm transition-colors ${
            view === "table" ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Table
        </button>
      </div>

      {/* Board view */}
      {view === "board" && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDnDDragEnd}
        >
          <div className="flex gap-3 overflow-x-auto pb-4">
            {columns.map((column) => (
              <PipelineColumn
                key={column.status}
                column={column}
                isOver={overId === column.status}
              />
            ))}
          </div>
          <DragOverlay dropAnimation={null}>
            {activeCandidate ? (
              <div className="w-64 rotate-3 scale-105">
                <CandidateCard candidate={activeCandidate} isDragging />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Table view */}
      {view === "table" && (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Candidate</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Job</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Stage</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Score</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Days</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {columns.flatMap((col) =>
                col.candidates.map((c) => (
                  <tr key={c.applicationId} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2 font-medium">{c.candidateName}</td>
                    <td className="px-3 py-2 text-muted-foreground">{c.jobTitle}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs">
                        {col.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {c.score != null ? c.score.toFixed(1) : "—"}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {Math.floor((Date.now() - new Date(c.createdAt).getTime()) / 86400000)}d
                    </td>
                  </tr>
                )),
              )}
              {totalCandidates === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                    No candidates yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Stale warning */}
      {Object.values(staleCounts).some((n) => n > 0) && (
        <p className="text-caption text-muted-foreground">
          {Object.entries(staleCounts)
            .filter(([, n]) => n > 0)
            .map(
              ([status, n]) =>
                `${n} candidate${n !== 1 ? "s" : ""} stalled 3+ days in ${status.replace("_", " ")}`,
            )
            .join(" · ")}
        </p>
      )}
    </div>
  );
}