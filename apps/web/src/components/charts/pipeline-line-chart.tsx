"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";
import { useHireLoop } from "@/lib/store/provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const RANGES = [
  { label: "7d", months: 1, days: 7 },
  { label: "30d", months: 1, days: 30 },
  { label: "90d", months: 3, days: 90 },
] as const;

export function PipelineLineChart() {
  const { state } = useHireLoop();
  const [range, setRange] = useState<(typeof RANGES)[number]["label"]>("30d");
  const config = RANGES.find((r) => r.label === range) ?? RANGES[1];
  const now = new Date();

  const data =
    range === "7d"
      ? Array.from({ length: 7 }, (_, index) => {
          const date = new Date(now);
          date.setDate(date.getDate() - (6 - index));
          const label = date.toLocaleString("en", { weekday: "short" });
          const sameDay = state.applications.filter((app) => {
            const created = new Date(app.createdAt);
            return created.toDateString() === date.toDateString();
          });
          return {
            month: label,
            applications: sameDay.length,
            interviews: sameDay.filter((app) =>
              ["interviewed", "passed_ai", "partner_review", "hired"].includes(app.status)
            ).length,
          };
        })
      : Array.from({ length: config.months === 3 ? 3 : 1 }, (_, index) => {
          const span = config.months === 3 ? 3 : 1;
          const date = new Date(now.getFullYear(), now.getMonth() - (span - 1 - index), 1);
          const month = date.toLocaleString("en", { month: "short" });
          const sameMonth = state.applications.filter((app) => {
            const created = new Date(app.createdAt);
            return created.getFullYear() === date.getFullYear() && created.getMonth() === date.getMonth();
          });
          return {
            month,
            applications: sameMonth.length,
            interviews: sameMonth.filter((app) =>
              ["interviewed", "passed_ai", "partner_review", "hired"].includes(app.status)
            ).length,
          };
        });

  return (
    <div>
      <div className="mb-4 flex justify-end gap-1">
        {RANGES.map((r) => (
          <Button
            key={r.label}
            type="button"
            size="sm"
            variant={range === r.label ? "default" : "ghost"}
            className={cn(
              "h-7 rounded-full px-3 text-xs",
              range === r.label && "bg-brand text-brand-foreground hover:bg-brand/90"
            )}
            onClick={() => setRange(r.label)}
            aria-pressed={range === r.label}
          >
            {r.label}
          </Button>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="h-[260px] w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="orangeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff6b00" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#ff6b00" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)",
              }}
            />
            <Area
              type="monotone"
              dataKey="interviews"
              stroke="#d1d5db"
              strokeWidth={2}
              fill="transparent"
              dot={false}
              name="Interviews"
            />
            <Area
              type="monotone"
              dataKey="applications"
              stroke="#ff6b00"
              strokeWidth={2.5}
              fill="url(#orangeGrad)"
              dot={false}
              name="Applications"
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
