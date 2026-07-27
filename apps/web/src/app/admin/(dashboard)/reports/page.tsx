"use client";

import { FadeIn, FadeInItem, FadeInStagger } from "@/components/motion/fade-in";
import { PipelineFunnelChart } from "@/components/charts/pipeline-funnel-chart";
import { SourcesDonutChart } from "@/components/charts/sources-donut-chart";
import { useDashboardMetrics, useHireLoop } from "@/lib/store/provider";

export default function ReportsPage() {
  const { hydrated } = useHireLoop();
  const stats = useDashboardMetrics();

  if (!hydrated) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  const metrics = [
    { label: "Total candidates", value: stats.totalApplications },
    { label: "Shortlisted", value: stats.shortlisted },
    { label: "Interviewed", value: stats.interviewed },
    { label: "Cleared interviews", value: stats.cleared },
  ];

  return (
    <div className="min-w-0 space-y-8">
      <header className="border-b border-slate-200 pb-6">
        <h1>Reports</h1>
        <p className="mt-2 text-sm text-slate-600">
          Pipeline performance and candidate source data.
        </p>
      </header>

      <FadeInStagger className="grid border-y border-slate-200 sm:grid-cols-2 xl:grid-cols-4 xl:divide-x xl:divide-slate-200">
        {metrics.map((m) => (
          <FadeInItem key={m.label}>
            <section className="p-5">
              <h2 className="!text-sm !font-normal !tracking-normal text-slate-600">{m.label}</h2>
              <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] tabular-nums">
                {m.value.toLocaleString()}
              </p>
            </section>
          </FadeInItem>
        ))}
      </FadeInStagger>

      <div className="grid gap-8 lg:grid-cols-2">
        <FadeIn delay={0.1}>
          <section className="min-w-0 border-t border-slate-200 pt-5">
            <h2 className="!text-base">Candidates by source</h2>
            <div className="mt-4 overflow-hidden">
              <SourcesDonutChart />
            </div>
          </section>
        </FadeIn>

        <FadeIn delay={0.15}>
          <section className="min-w-0 border-t border-slate-200 pt-5">
            <h2 className="!text-base">Pipeline funnel</h2>
            <div className="mt-4 overflow-hidden">
              <PipelineFunnelChart />
            </div>
          </section>
        </FadeIn>
      </div>
    </div>
  );
}
