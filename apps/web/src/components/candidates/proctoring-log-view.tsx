"use client";

import { ShieldAlert } from "lucide-react";
import { ProctoringSnapshotGallery } from "@/components/candidates/proctoring-snapshot-gallery";
import { ProctoringSnapshotThumb } from "@/components/candidates/proctoring-snapshot-gallery";
import type { InterviewSession, ProctoringLogEntry } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SEVERITY_COLORS = {
  info: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  warning: "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  critical: "bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-300",
} as const;

export function ProctoringLogView({ session }: { session: InterviewSession }) {
  const log = session.proctoringLog ?? [];
  const summary = session.proctoringSummary;
  const flagged = session.status === "flagged" || summary?.flagged;
  const snapshots = log.filter((e) => e.snapshotPath);

  if (log.length === 0 && !flagged) {
    return (
      <p className="text-sm text-muted-foreground">No proctoring events recorded.</p>
    );
  }

  return (
    <div className="space-y-6">
      {flagged ? (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Session flagged for proctoring violations</p>
            {summary?.reason ? <p className="mt-1">{summary.reason}</p> : null}
            <p className="mt-1 text-xs text-red-700 dark:text-red-300">
              {summary?.warnings ?? 0} warnings · {summary?.critical ?? 0} critical
            </p>
          </div>
        </div>
      ) : null}

      {snapshots.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Webcam snapshots ({snapshots.length})</h3>
          <ProctoringSnapshotGallery sessionId={session.id} log={log} />
        </div>
      ) : null}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Event log</h3>
        <ul className="max-h-96 space-y-2 overflow-y-auto">
          {[...log].reverse().map((entry: ProctoringLogEntry, i) => (
            <li
              key={`${entry.at}-${i}`}
              className="rounded-lg border border-border p-3 text-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={SEVERITY_COLORS[entry.severity]}>{entry.severity}</Badge>
                <span className="text-xs text-muted-foreground">{formatDate(entry.at)}</span>
                {entry.questionIndex != null ? (
                  <span className="text-xs text-muted-foreground">Q{entry.questionIndex + 1}</span>
                ) : null}
              </div>
              <p className="mt-1 font-medium capitalize">{entry.type.replace(/_/g, " ")}</p>
              <p className="text-muted-foreground">{entry.detail}</p>
              {entry.snapshotPath ? (
                <div className="mt-3 max-w-xs">
                  <ProctoringSnapshotThumb
                    sessionId={session.id}
                    entry={entry}
                    onOpen={(url) => window.open(url, "_blank", "noopener,noreferrer")}
                  />
                </div>
              ) : null}
              {entry.analysis && typeof entry.analysis === "object" ? (
                <div className="mt-2 rounded bg-muted/50 p-2 text-xs">
                  {(entry.analysis as Record<string, boolean>).phoneVisible ? (
                    <p className="text-red-700 dark:text-red-300">Phone detected</p>
                  ) : null}
                  {(entry.analysis as Record<string, boolean>).secondaryDeviceVisible ? (
                    <p className="text-red-700 dark:text-red-300">Secondary device detected</p>
                  ) : null}
                  {(entry.analysis as Record<string, boolean>).notesVisible ? (
                    <p className="text-red-700 dark:text-red-300">Notes visible</p>
                  ) : null}
                  {(entry.analysis as Record<string, boolean>).secondPersonVisible ? (
                    <p className="text-red-700 dark:text-red-300">Second person detected</p>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function ProctoringSummaryCard({ session }: { session: InterviewSession }) {
  const log = session.proctoringLog ?? [];
  const critical = log.filter((e) => e.severity === "critical").length;
  const warnings = log.filter((e) => e.severity === "warning").length;
  const snapshots = log.filter((e) => e.snapshotPath).length;
  const flagged = session.status === "flagged" || session.proctoringSummary?.flagged;

  return (
    <Card className={flagged ? "border-red-200 dark:border-red-900" : "border-border"}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldAlert className="h-4 w-4" />
          Proctoring
          {flagged ? (
            <Badge className="bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300">
              Flagged
            </Badge>
          ) : critical === 0 && warnings === 0 ? (
            <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              Clean
            </Badge>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        <p className="text-muted-foreground">
          {log.length} events · {warnings} warnings · {critical} critical · {snapshots} snapshots
        </p>
      </CardContent>
    </Card>
  );
}
