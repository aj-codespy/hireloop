import { useMemo } from "react";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";
import { MiniSparkline } from "./mini-sparkline";

interface GlanceMetric {
  label: string;
  value: string;
  trend: "up" | "down" | "neutral";
  change: string;
  sparklineData: number[];
  icon: React.ReactNode;
}

// Sample data — replace with real metrics from API
const MOCK_METRICS: GlanceMetric[] = [
  {
    label: "Pipeline velocity",
    value: "4.2d",
    trend: "up",
    change: "12% faster",
    sparklineData: [5.8, 5.5, 5.1, 4.9, 4.7, 4.4, 4.2],
    icon: <PhosphorIcon name="Zap" className="h-4 w-4" />,
  },
  {
    label: "Avg score",
    value: "7.8",
    trend: "up",
    change: "+0.3 pts",
    sparklineData: [7.1, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8],
    icon: <PhosphorIcon name="Target" className="h-4 w-4" />,
  },
  {
    label: "Active candidates",
    value: "24",
    trend: "neutral",
    change: "Stable",
    sparklineData: [22, 24, 23, 25, 24, 24, 24],
    icon: <PhosphorIcon name="Users" className="h-4 w-4" />,
  },
  {
    label: "Time-to-interview",
    value: "1.8d",
    trend: "down",
    change: "8% slower",
    sparklineData: [1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8],
    icon: <PhosphorIcon name="Clock" className="h-4 w-4" />,
  },
];

const TREND_COLORS = {
  up: { text: "text-emerald-600 dark:text-emerald-400", line: "#10b981" },
  down: { text: "text-red-600 dark:text-red-400", line: "#ef4444" },
  neutral: { text: "text-muted-foreground", line: "#6b7280" },
} as const;

export function GlanceBar() {
  const metrics = useMemo(() => {
    // In production, fetch from API here
    return MOCK_METRICS;
  }, []);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {metrics.map((m) => {
        const colors = TREND_COLORS[m.trend];
        const TrendIcon = m.trend === "up" ? () => <PhosphorIcon name="ArrowUpRight" className="h-3 w-3" /> : m.trend === "down" ? () => <PhosphorIcon name="ArrowDownRight" className="h-3 w-3" /> : () => null;

        return (
          <div
            key={m.label}
            className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted/30 dark:hover:bg-muted/10"
          >
            {/* Top row: icon + value */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {m.icon}
                <span>{m.label}</span>
              </div>
              <span className="text-lg font-bold tabular-nums">{m.value}</span>
            </div>

            {/* Sparkline */}
            <MiniSparkline data={m.sparklineData} color={colors.line} width={120} height={24} />

            {/* Trend */}
            <div className={`flex items-center gap-1 text-[10px] ${colors.text}`}>
              <TrendIcon />
              <span>{m.change}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}