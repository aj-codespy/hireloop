import { loadPublicJobAction } from "@/app/actions/hireloop";
import { isActionError } from "@/lib/action-error";
import { ApplyPageClient } from "@/components/candidate/apply-page-client";

export default async function ApplyPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const publicJob = await loadPublicJobAction(jobId);

  if (isActionError(publicJob)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-4 text-center">
        <h1 className="text-xl font-semibold text-red-600">Failed to load job details</h1>
        <p className="text-sm text-muted-foreground">{publicJob.error}</p>
      </div>
    );
  }

  return (
    <ApplyPageClient
      jobId={jobId}
      initialJob={publicJob?.job ?? null}
      initialOrganization={publicJob?.organization ?? null}
    />
  );
}
