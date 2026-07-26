import { loadInterviewByTokenAction } from "@/app/actions/hireloop";
import { isActionError } from "@/lib/action-error";
import { CandidateInterviewFlow } from "@/components/candidate/candidate-interview-flow";
import Link from "next/link";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";

export default async function CandidateInterviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const ctx = await loadInterviewByTokenAction(token);

  if (isActionError(ctx)) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-stone-50 px-5 py-12">
        <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-6 shadow-[0_12px_40px_rgba(15,15,15,0.06)]">
          <p className="text-sm font-semibold text-red-700">Interview unavailable</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            We couldn&apos;t prepare your session
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{ctx.error}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Try again later or contact the hiring team if this continues.
          </p>
        </div>
      </main>
    );
  }

  if (!ctx) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-stone-50 px-5 py-12">
        <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,15,15,0.06)]">
          <p className="text-sm font-semibold text-[#F97316]">Link expired</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            This interview link is no longer valid
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">Contact the hiring team for a new link.</p>
          <Link href="/" className="mt-6 inline-flex min-h-11 items-center rounded-full border border-stone-200 px-5 text-sm font-semibold text-slate-900 transition-colors duration-200 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:ring-offset-2">
          Return home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <CandidateInterviewFlow
      candidateName={ctx.candidate.name}
      jobTitle={ctx.job.title}
      interviewToken={token}
      organizationName={ctx.organization.name}
      introVideoUrl={ctx.organization.introVideoUrl}
    />
  );
}
