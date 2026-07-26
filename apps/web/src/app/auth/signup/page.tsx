import { Suspense } from "react";
import { MultiStepSignUp } from "@/components/auth/multi-step-sign-up";
import { AuthPortalShell } from "@/components/auth/auth-portal-shell";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";

export default function AdminSignupPage() {
  return (
    <AuthPortalShell portal="admin">
      <Suspense
        fallback={
          <div className="flex min-h-44 items-center gap-2 text-sm text-[#6B7280]" role="status">
            <PhosphorIcon name="Loader2" />
            <span>Loading organization setup</span>
          </div>
        }
      >
        <MultiStepSignUp />
      </Suspense>
    </AuthPortalShell>
  );
}