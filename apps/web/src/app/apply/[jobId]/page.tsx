import { loadPublicJobAction } from "@/app/actions/hireloop";
import { isActionError } from "@/lib/action-error";
import { ApplyPageClient } from "@/components/candidate/apply-page-client";

export default async function ApplyPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const publicJob = await loadPublicJobAction(jobId);

  if (isActionError(publicJob)) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-stone-50 px-5 py-12">
        <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-6 shadow-[0_12px_40px_rgba(15,15,15,0.06)]">
          <p className="text-sm font-semibold text-red-700">Role unavailable</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            We couldn&apos;t load this job
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{publicJob.error}</p>
        </div>
      </main>
    );
  }

  return (
    <ApplyPageClient
      initialJob={publicJob?.job ?? null}
      initialOrganization={publicJob?.organization ?? null}
      jobNotFound={publicJob === null}
    />
  );
}
