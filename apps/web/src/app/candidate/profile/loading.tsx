import { Logo } from "@/components/brand/logo";

export default function CandidateProfileLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted/30">
      <Logo href="/" />
      <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
        Loading your profile…
      </p>
    </div>
  );
}
