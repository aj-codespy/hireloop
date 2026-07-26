"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { JobCreationWizard } from "@/components/jobs/job-creation-wizard";
import { useOrgPermissions } from "@/hooks/use-org-permissions";

export default function NewJobPage() {
  const router = useRouter();
  const { canManageJobs, loading } = useOrgPermissions();

  useEffect(() => {
    if (!loading && !canManageJobs) {
      router.replace("/admin/jobs");
    }
  }, [loading, canManageJobs, router]);

  if (loading || !canManageJobs) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div>
      <header className="mb-8 border-b border-slate-200 pb-6">
        <h1>Create a job</h1>
        <p className="mt-2 text-sm text-slate-600">
          Configure the role, application form, interview questions, and optional thresholds. Then share the link.
        </p>
      </header>
      <JobCreationWizard />
    </div>
  );
}
