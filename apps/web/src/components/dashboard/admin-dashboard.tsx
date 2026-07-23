"use client";

import Link from "next/link";
import { ArrowRight, Briefcase, Handshake, UserPlus, Video } from "lucide-react";
import { useApplicationRows, useHireLoop } from "@/lib/store/provider";
import { useDashboardInsights } from "@/hooks/use-dashboard-insights";
import { formatDate } from "@/lib/format";
import { FadeIn, FadeInItem, FadeInStagger } from "@/components/motion/fade-in";
import { PipelineLineChart } from "@/components/charts/pipeline-line-chart";
import { PipelineFunnelChart } from "@/components/charts/pipeline-funnel-chart";
import { SourcesDonutChart } from "@/components/charts/sources-donut-chart";
import { AnimatedStat } from "@/components/dashboard/animated-stat";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { SectionCard } from "@/components/patterns/section-card";
import { EmptyState } from "@/components/patterns/empty-state";
import { StatusBadge } from "@/components/patterns/status-badge";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HoverLift } from "@/components/motion/interactions";

export function AdminDashboard() {
  const { hydrated, state } = useHireLoop();
  const insights = useDashboardInsights();
  const rows = useApplicationRows().slice(0, 8);

  const statCards = [
    {
      label: "Applications",
      value: insights.metrics.totalApplications,
      hint: insights.hints.applications,
      icon: <UserPlus className="h-5 w-5" aria-hidden />,
      href: "/admin/candidates",
    },
    {
      label: "Active jobs",
      value: insights.metrics.activeJobs,
      hint: insights.hints.activeJobs,
      icon: <Briefcase className="h-5 w-5" aria-hidden />,
      href: "/admin/jobs",
    },
    {
      label: "Interviewed",
      value: insights.metrics.interviewed,
      hint: insights.hints.interviewed,
      icon: <Video className="h-5 w-5" aria-hidden />,
      href: "/admin/candidates",
    },
    {
      label: "Awaiting decision",
      value: insights.metrics.passedAi,
      hint: insights.hints.finalInterview,
      icon: <Handshake className="h-5 w-5" aria-hidden />,
      href: "/admin/candidates",
    },
  ];

  if (!hydrated) {
    return (
      <div className="space-y-4" role="status" aria-label="Loading dashboard">
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (insights.isEmptyOrg) {
    return (
      <EmptyState
        title="Welcome to HireLoop"
        description="Set up your company profile, publish your first role, and share the apply link with candidates."
        actionLabel="Create your first job"
        actionHref="/admin/jobs/new"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand/10 via-brand-muted/20 to-background p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,107,0,0.08),transparent_50%)]" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-caption">{state.organization.name}</p>
            <h2 className="text-title">{insights.greeting}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/admin/jobs/new" variant="outline" className="rounded-full">
              Create job
            </ButtonLink>
            <ButtonLink href="/admin/candidates" variant="outline" className="rounded-full">
              View pipeline
            </ButtonLink>
            <ButtonLink href="/admin/reports" className="rounded-full bg-brand text-brand-foreground hover:bg-brand/90">
              Reports
            </ButtonLink>
          </div>
        </div>
      </div>

      {insights.actionItems.length > 0 ? (
        <SectionCard
          title={`${insights.actionItems.length} item${insights.actionItems.length !== 1 ? "s" : ""} need attention`}
          description="Review these candidates and roles to keep hiring moving."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {insights.actionItems.map((item) => (
              <HoverLift key={item.id}>
                <Link
                  href={item.href}
                  className="interactive-card block rounded-xl border border-border bg-card p-4 focus-ring"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="mt-1 text-caption">{item.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                  </div>
                </Link>
              </HoverLift>
            ))}
          </div>
        </SectionCard>
      ) : null}

      <FadeInStagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((s) => (
          <FadeInItem key={s.label}>
            <AnimatedStat
              label={s.label}
              value={s.value}
              hint={s.hint}
              icon={s.icon}
              href={s.href}
            />
          </FadeInItem>
        ))}
      </FadeInStagger>

      <div className="grid gap-6 lg:grid-cols-4">
        <FadeIn className="lg:col-span-2">
          <SectionCard title="Applications over time" description="Monthly applications and completed interviews">
            <PipelineLineChart />
          </SectionCard>
        </FadeIn>
        <FadeIn delay={0.1} className="lg:col-span-1">
          <SectionCard title="Sources" description="Where applicants are coming from">
            <SourcesDonutChart compact />
          </SectionCard>
        </FadeIn>
        <FadeIn delay={0.15} className="lg:col-span-1">
          <ActivityFeed />
        </FadeIn>
      </div>

      <FadeIn delay={0.15}>
        <SectionCard title="Pipeline funnel" description="Conversion through each hiring stage">
          <PipelineFunnelChart showConversion />
        </SectionCard>
      </FadeIn>

      <SectionCard
        title="Recent applications"
        description="Latest candidates across all roles"
        action={
          <Link href="/admin/candidates" className="text-sm font-medium text-brand hover:underline focus-ring rounded-sm">
            View all
          </Link>
        }
        noPadding
      >
        {rows.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">
            No applications yet. Create a job and share the apply link.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ application, candidate, job }) => {
                if (!candidate) return null;
                return (
                  <TableRow key={application.id} className="group">
                    <TableCell>
                      <Link
                        href={`/admin/candidates/${candidate.id}`}
                        className="font-medium transition-colors group-hover:text-brand focus-ring rounded-sm"
                      >
                        {candidate.name}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[160px] truncate text-muted-foreground">
                      {job?.title ?? "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={application.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(application.createdAt)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </SectionCard>
    </div>
  );
}
