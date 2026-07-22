"use client";

import { FadeIn, FadeInItem, FadeInStagger } from "@/components/motion/fade-in";
import { PipelineFunnelChart } from "@/components/charts/pipeline-funnel-chart";
import { SourcesDonutChart } from "@/components/charts/sources-donut-chart";
import { useDashboardMetrics, useHireLoop } from "@/lib/store/provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    { label: "Final interview", value: stats.offers },
  ];

  return (
    <div className="space-y-6">
      <FadeInStagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => (
          <FadeInItem key={m.label}>
            <Card className="border-border shadow-card">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{m.label}</p>
                <p className="mt-1 text-3xl font-bold text-foreground">{m.value}</p>
              </CardContent>
            </Card>
          </FadeInItem>
        ))}
      </FadeInStagger>

      <div className="grid gap-6 lg:grid-cols-2">
        <FadeIn delay={0.1}>
          <Card className="border-border shadow-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Candidates by source</CardTitle>
            </CardHeader>
            <CardContent>
              <SourcesDonutChart />
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.15}>
          <Card className="border-border shadow-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Pipeline funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <PipelineFunnelChart />
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
