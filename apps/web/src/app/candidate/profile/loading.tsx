import { Logo } from "@/components/brand/logo";

export default function CandidateProfileLoading() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-5 bg-stone-50 px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
      <Logo href="/" />
      <div className="flex items-center gap-3 text-sm text-muted-foreground" role="status" aria-live="polite">
        <span className="size-4 animate-spin rounded-full border-2 border-stone-200 border-t-[#F97316] motion-reduce:animate-none" aria-hidden />
        Loading your profile…
      </div>
    </div>
  );
}
