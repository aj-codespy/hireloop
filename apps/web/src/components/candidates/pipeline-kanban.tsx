"use client";

import Link from "next/link";
import { useApplicationRows } from "@/lib/store/provider";
import { APPLICATION_STATUS_LABELS } from "@/lib/constants";
import { StatusBadge } from "@/components/patterns/status-badge";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { HoverLift } from "@/components/motion/interactions";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function daysInStage(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
}

export function PipelineKanban() {
  const rows = useApplicationRows();
  const terminalRows = rows.filter(({ application }) =>
    ["auto_rejected", "interview_expired", "rejected_ai"].includes(application.status)
  );
  const columns = [
    ...(["applied", "shortlisted", "interview_sent", "interviewed", "passed_ai", "cleared_interviews"] as const).map(
      (status) => ({
        status,
        label: APPLICATION_STATUS_LABELS[status],
        rows: rows.filter(({ application }) => application.status === status),
      })
    ),
    {
      status: "closed" as const,
      label: "Closed / expired",
      rows: terminalRows,
    },
  ];

  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid min-w-[1000px] grid-cols-7 gap-3">
        {columns.map((column) => {
          const staleCount = column.rows.filter(
            ({ application }) => daysInStage(application.createdAt) > 3
          ).length;
          return (
            <section
              key={column.status}
              className="rounded-xl border border-border bg-muted/30 p-3"
              aria-label={`${column.label} column`}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-foreground">{column.label}</h2>
                <Badge variant="secondary">{column.rows.length}</Badge>
              </div>
              {staleCount > 0 && column.status !== "closed" ? (
                <p className="mb-2 text-[10px] text-amber-700 dark:text-amber-300">
                  {staleCount} waiting 3+ days
                </p>
              ) : null}
              <div className="space-y-2">
                {column.rows.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border bg-card p-3 text-xs text-muted-foreground">
                    No candidates
                  </p>
                ) : (
                  column.rows.map(({ application, candidate, job, session }) => (
                    <HoverLift key={application.id}>
                      <Link
                        href={`/admin/candidates/${candidate?.id ?? application.candidateId}`}
                        className="interactive-card block rounded-lg border border-border bg-card p-3 focus-ring"
                      >
                        <div className="flex items-start gap-2">
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarFallback className="bg-brand-muted text-[10px] text-brand">
                              {initials(candidate?.name ?? "?")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {candidate?.name ?? "Unknown candidate"}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {job?.title ?? "Unknown job"}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <StatusBadge status={application.status} className="text-[10px]" />
                          {session?.overallScore ? (
                            <span className="text-[10px] text-muted-foreground">
                              Score {session.overallScore.totalScore.toFixed(1)}
                            </span>
                          ) : null}
                        </div>
                      </Link>
                    </HoverLift>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
