"use client";

import Link from "next/link";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";
import { useApplicationRows, useHireLoop } from "@/lib/store/provider";
import { useDashboardInsights } from "@/hooks/use-dashboard-insights";
import { formatDate } from "@/lib/format";
import { FadeIn, FadeInItem, FadeInStagger } from "@/components/motion/fade-in";
import { PipelineLineChart } from "@/components/charts/pipeline-line-chart";
import { PipelineFunnelChart } from "@/components/charts/pipeline-funnel-chart";
import { SourcesDonutChart } from "@/components/charts/sources-donut-chart";
import { AnimatedStat } from "@/components/dashboard/animated-stat";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { GlanceBar } from "@/components/dashboard/glance-bar";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

export function AdminDashboard() {
  const { hydrated, state } = useHireLoop();
  const insights = useDashboardInsights();
  const rows = useApplicationRows().slice(0, 8);

  const statCards = [
    {
      label: "Applications",
      value: insights.metrics.totalApplications,
      hint: insights.hints.applications,
      icon: <PhosphorIcon name="UserPlus" />,
      href: "/admin/candidates",
    },
    {
      label: "Active jobs",
      value: insights.metrics.activeJobs,
      hint: insights.hints.activeJobs,
      icon: <PhosphorIcon name="Briefcase" />,
      href: "/admin/jobs",
    },
    {
      label: "Interviewed",
      value: insights.metrics.interviewed,
      hint: insights.hints.interviewed,
      icon: <PhosphorIcon name="Video" />,
      href: "/admin/candidates",
    },
    {
      label: "Awaiting decision",
      value: insights.metrics.passedAi,
      hint: insights.hints.finalInterview,
      icon: <PhosphorIcon name="Handshake" className="h-5 w-5" aria-hidden />,
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
    <div className="min-w-0 space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-5 border-b border-slate-200 pb-6">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
              {state.organization.name}
            </p>
            <h1>{insights.greeting}</h1>
            <p className="mt-2 text-sm text-slate-600">
              Hiring activity, decisions, and pipeline health.
            </p>
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
      </header>

      <GlanceBar />

      {insights.actionItems.length > 0 ? (
        <SectionCard
          title={`${insights.actionItems.length} item${insights.actionItems.length !== 1 ? "s" : ""} need attention`}
          description="Review these candidates and roles to keep hiring moving."
        >
          <div className="divide-y divide-slate-200 sm:grid sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            {insights.actionItems.map((item) => (
              <HoverLift key={item.id}>
                <Link
                  href={item.href}
                  className="block min-w-0 p-4 focus-ring"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="mt-1 text-caption">{item.description}</p>
                    </div>
                    <PhosphorIcon name="ArrowRight" />
                  </div>
                </Link>
              </HoverLift>
            ))}
          </div>
        </SectionCard>
      ) : null}

      <FadeInStagger className="grid border-y border-slate-200 sm:grid-cols-2 xl:grid-cols-4 xl:divide-x xl:divide-slate-200">
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
                      <HoverCard>
                        <HoverCardTrigger
                          render={
                            <Link
                              href={`/admin/candidates/${candidate.id}`}
                              className="font-medium transition-colors group-hover:text-brand focus-ring rounded-sm"
                            >
                              {candidate.name}
                            </Link>
                          }
                        />
                        <HoverCardContent className="w-72 p-4" side="right" align="start">
                          <div className="space-y-2">
                            <p className="text-sm font-medium">{candidate.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <StatusBadge status={application.status} />
                              <span>{job?.title ?? ""}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Applied {formatDate(application.createdAt)}
                            </p>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    </TableCell>
                    <TableCell className="max-w-[160px] truncate text-muted-foreground">
                                          {job?.title ?? "&mdash;"}
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
