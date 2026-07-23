import { loadInterviewByTokenAction } from "@/app/actions/hireloop";
import { isActionError } from "@/lib/action-error";
import { CandidateInterviewFlow } from "@/components/candidate/candidate-interview-flow";
import Link from "next/link";

export default async function CandidateInterviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const ctx = await loadInterviewByTokenAction(token);

  if (isActionError(ctx)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-4 text-center">
        <h1 className="text-xl font-semibold text-red-600">System Error</h1>
        <p className="text-sm text-muted-foreground max-w-md">{ctx.error}</p>
        <p className="text-sm text-muted-foreground">Please try again later or contact support if the issue persists.</p>
      </div>
    );
  }

  if (!ctx) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-4 text-center">
        <h1 className="text-xl font-semibold">Invalid or expired interview link</h1>
        <p className="text-sm text-muted-foreground">Contact the hiring team for a new link.</p>
        <Link href="/" className="text-brand hover:underline">
          Return home
        </Link>
      </div>
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
