"use client";

import { Logo } from "@/components/brand/logo";
import { ApplicationForm } from "@/components/candidate/application-form";
import { useHireLoop } from "@/lib/store/provider";
import type { JobRole, Organization } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export function ApplyPageClient({
  jobId,
  initialJob,
  initialOrganization,
}: {
  jobId: string;
  initialJob?: JobRole | null;
  initialOrganization?: Organization | null;
}) {
  const { state, hydrated } = useHireLoop();
  const job = initialJob ?? state.jobs.find((j) => j.id === jobId);
  const org = initialOrganization ?? state.organization;

  if (!initialJob && !hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!job || job.status !== "live") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-xl font-semibold">This job is not accepting applications</h1>
        <Link href="/" className="text-brand hover:underline">
          Return home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-white px-6 py-5">
        <Logo href="/" />
      </header>
      <main className="mx-auto grid max-w-4xl gap-8 px-6 py-10 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Badge className="mb-3 bg-brand-muted text-brand">{org.name}</Badge>
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{job.description}</p>
          {job.eligibilityRules.length > 0 ? (
            <p className="mt-6 text-xs text-muted-foreground">
              Applications are checked against eligibility criteria automatically on submit.
            </p>
          ) : null}
        </div>
        <div className="lg:col-span-3">
          <ApplicationForm job={job} />
        </div>
      </main>
    </div>
  );
}
