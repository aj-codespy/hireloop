"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { motion, useReducedMotion } from "framer-motion";
import { useHireLoop } from "@/lib/store/provider";

const COLORS = ["#F97316", "#111827", "#6B7280", "#9CA3AF", "#D1D5DB"];

export function SourcesDonutChart({ compact = false }: { compact?: boolean }) {
  const { state } = useHireLoop();
  const reduceMotion = useReducedMotion();
  const counts = state.candidates.reduce<Record<string, number>>((acc, candidate) => {
    const source = candidate.source || "Unknown";
    acc[source] = (acc[source] ?? 0) + 1;
    return acc;
  }, {});
  const data = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length],
    }));

  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No source data yet.</p>;
  }

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className={compact ? "h-[200px]" : "h-[240px]"}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={compact ? 50 : 60}
            outerRadius={compact ? 72 : 88}
            paddingAngle={3}
            dataKey="value"
            animationBegin={200}
            animationDuration={800}
            isAnimationActive={!reduceMotion}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e5e7eb",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} aria-hidden />
            {d.name} ({d.value})
          </div>
        ))}
      </div>
    </motion.div>
  );
}
