import { Suspense } from "react";
import { CandidateAuthForm } from "@/components/auth/candidate-auth-form";

export default function CandidateSignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <CandidateAuthForm defaultTab="signup" />
      </Suspense>
    </div>
  );
}
