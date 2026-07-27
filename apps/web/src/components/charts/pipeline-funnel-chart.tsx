"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useHireLoop } from "@/lib/store/provider";

export function PipelineFunnelChart({ showConversion = false }: { showConversion?: boolean }) {
  const { state } = useHireLoop();
  const reduceMotion = useReducedMotion();
  const total = state.applications.length;
  const count = (statuses: string[]) =>
    state.applications.filter((app) => statuses.includes(app.status)).length;
  const stages = [
    { label: "Applied", value: total },
    {
      label: "Interview invited",
      value: count(["interview_sent", "interviewed", "passed_ai", "cleared_interviews"]),
    },
    { label: "Interviewed", value: count(["interviewed", "passed_ai", "cleared_interviews"]) },
    { label: "Cleared interviews", value: count(["cleared_interviews"]) },
  ].map((stage, index, arr) => ({
    ...stage,
    pct: total === 0 ? 0 : Math.round((stage.value / total) * 100),
    conversion:
      showConversion && index > 0 && arr[index - 1].value > 0
        ? Math.round((stage.value / arr[index - 1].value) * 100)
        : null,
  }));

  return (
    <div className="space-y-4">
      {stages.map((stage, i) => (
        <div key={stage.label} className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">{stage.label}</span>
            <span className="text-muted-foreground">
              {stage.value}{" "}
              <span className="text-xs">({stage.pct}%)</span>
              {stage.conversion != null ? (
                <span className="ml-1 text-xs text-brand">· {stage.conversion}% from prev</span>
              ) : null}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={reduceMotion ? false : { width: 0 }}
              animate={{ width: `${stage.pct}%` }}
              transition={{ duration: 0.25, delay: reduceMotion ? 0 : i * 0.06, ease: "easeOut" }}
              className="h-full rounded-full bg-brand"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
