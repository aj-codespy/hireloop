"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { FadeIn, FadeInItem, FadeInStagger } from "@/components/motion/fade-in";
import { useHireLoop } from "@/lib/store/provider";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/patterns/empty-state";

const stages = ["Sourced", "Applied", "Interview", "Assessment", "Offer", "Hired"] as const;

export default function JobsPage() {
  const { state, hydrated } = useHireLoop();

  if (!hydrated) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-5">
      <FadeInStagger className="space-y-4">
        {state.jobs.length === 0 ? (
          <FadeInItem>
            <EmptyState
              title="No jobs yet"
              description="Publish your first role to start receiving applications and running interviews."
              actionLabel="Create your first job"
              actionHref="/admin/jobs/new"
            />
          </FadeInItem>
        ) : (
          state.jobs.map((job) => {
            const apps = state.applications.filter((a) => a.jobRoleId === job.id);
            const values = [
              apps.length,
              apps.length,
              apps.filter((a) =>
                ["interview_sent", "interviewed", "passed_ai", "rejected_ai", "partner_review", "hired"].includes(
                  a.status
                )
              ).length,
              apps.filter((a) => ["passed_ai", "rejected_ai", "partner_review", "hired"].includes(a.status)).length,
              apps.filter((a) => ["partner_review", "hired"].includes(a.status)).length,
              apps.filter((a) => a.status === "hired").length,
            ];
            const applicantCount = apps.length;

            return (
              <FadeInItem key={job.id}>
                <Link
                  href={`/admin/jobs/${job.id}`}
                  className="block rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{job.title}</h3>
                      <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {applicantCount} applicant{applicantCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <Badge
                      className={
                        job.status === "live"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {job.status === "live" ? "Published" : job.status}
                    </Badge>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-6">
                    {stages.map((stage, i) => (
                      <div key={stage} className="text-center">
                        <p className="text-lg font-semibold">{values[i]}</p>
                        <p className="text-xs text-muted-foreground">{stage}</p>
                      </div>
                    ))}
                  </div>
                </Link>
              </FadeInItem>
            );
          })
        )}
      </FadeInStagger>
    </div>
  );
}
