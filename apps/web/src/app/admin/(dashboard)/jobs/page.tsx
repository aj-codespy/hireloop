"use client";

import Link from "next/link";
import { useState } from "react";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";
import { FadeInItem, FadeInStagger } from "@/components/motion/fade-in";
import { useHireLoop } from "@/lib/store/provider";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/patterns/empty-state";
import { JobStatusToggle } from "@/components/jobs/job-status-toggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const stages = ["Sourced", "Applied", "Interview", "Assessment", "Cleared"] as const;

export default function JobsPage() {
  const { state, hydrated } = useHireLoop();
  const [departmentFilter, setDepartmentFilter] = useState("all");

  // Group jobs by department (tag) for filter
  const departments = [...new Set(state.jobs.map((j) => (j as { departmentId?: string }).departmentId).filter(Boolean))] as string[];
  const filteredJobs = departmentFilter === "all"
    ? state.jobs
    : state.jobs.filter((j) => (j as { departmentId?: string }).departmentId === departmentFilter);

  if (!hydrated) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="min-w-0 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1>Jobs</h1>
          <p className="mt-2 text-sm text-slate-600">
            {state.jobs.length} role{state.jobs.length !== 1 ? "s" : ""} across your workspace.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {departments.length > 0 && (
            <>
            <PhosphorIcon name="Building2" className="h-4 w-4 text-muted-foreground" />
            <Select value={departmentFilter} onValueChange={(v: string | null) => v && setDepartmentFilter(v)}>
              <SelectTrigger className="w-[160px] rounded-full bg-card h-8 text-sm">
                <SelectValue placeholder="All departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            </>
          )}
          <Link
            href="/admin/jobs/new"
            className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-[#EA6B2D] focus-ring"
          >
            Create job
          </Link>
        </div>
      </header>

      <FadeInStagger className="divide-y divide-slate-200 border-y border-slate-200">
        {filteredJobs.length === 0 ? (
          <FadeInItem>
            <EmptyState
              title="No jobs yet"
              description="Publish your first role to start receiving applications and running interviews."
              actionLabel="Create your first job"
              actionHref="/admin/jobs/new"
            />
          </FadeInItem>
        ) : (
          filteredJobs.map((job) => {
            const apps = state.applications.filter((a) => a.jobRoleId === job.id);
            const values = [
              apps.length,
              apps.length,
              apps.filter((a) =>
                ["interview_sent", "interviewed", "passed_ai", "rejected_ai", "cleared_interviews"].includes(
                  a.status
                )
              ).length,
              apps.filter((a) => ["passed_ai", "rejected_ai", "cleared_interviews"].includes(a.status)).length,
              apps.filter((a) => a.status === "cleared_interviews").length,
            ];
            const applicantCount = apps.length;

            return (
              <FadeInItem key={job.id}>
                <div className="flex items-start justify-between gap-3 px-1 py-5 transition-colors hover:bg-slate-50 sm:px-4 motion-reduce:transition-none">
                  <Link
                    href={`/admin/jobs/${job.id}`}
                    className="min-w-0 flex-1"
                  >
                    <div>
                      <h3 className="font-semibold">{job.title}</h3>
                      <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <PhosphorIcon name="MapPin" className="h-3.5 w-3.5" />
                        {applicantCount} applicant{applicantCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-6">
                      {stages.map((stage, i) => (
                        <div key={stage} className="text-center">
                          <p className="text-lg font-semibold tabular-nums">{values[i]}</p>
                          <p className="text-xs text-muted-foreground">{stage}</p>
                        </div>
                      ))}
                    </div>
                  </Link>
                  <div className="flex flex-col items-end gap-2">
                    <Badge
                      className={
                        job.status === "live"
                          ? "bg-green-50 text-green-700"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {job.status === "live" ? "Published" : job.status}
                    </Badge>
                    <JobStatusToggle jobId={job.id} status={job.status} className="rounded-full" />
                  </div>
                </div>
              </FadeInItem>
            );
          })
        )}
      </FadeInStagger>
    </div>
  );
}
