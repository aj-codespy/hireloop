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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Create a new job</h1>
        <p className="text-sm text-muted-foreground">
          Configure the role, application form, interview questions, and optional thresholds — then share the link.
        </p>
      </div>
      <JobCreationWizard />
    </div>
  );
}
