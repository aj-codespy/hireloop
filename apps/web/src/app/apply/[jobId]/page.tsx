import { loadPublicJobAction } from "@/app/actions/hireloop";
import { ApplyPageClient } from "@/components/candidate/apply-page-client";

export default async function ApplyPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const publicJob = await loadPublicJobAction(jobId);
  return (
    <ApplyPageClient
      jobId={jobId}
      initialJob={publicJob?.job ?? null}
      initialOrganization={publicJob?.organization ?? null}
    />
  );
}
