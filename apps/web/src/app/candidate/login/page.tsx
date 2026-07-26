import { Suspense } from "react";
import { CandidateAuthForm } from "@/components/auth/candidate-auth-form";
import { AuthPortalShell } from "@/components/auth/auth-portal-shell";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";

export default function CandidateLoginPage() {
  return (
    <AuthPortalShell portal="candidate">
      <Suspense
        fallback={
          <div className="flex min-h-44 items-center gap-2 text-sm text-[#6B7280]" role="status">
            <PhosphorIcon name="Loader2" />
            <span>Loading sign in</span>
          </div>
        }
      >
        <CandidateAuthForm />
      </Suspense>
    </AuthPortalShell>
  );
}
