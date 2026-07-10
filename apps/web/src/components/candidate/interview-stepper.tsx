import { cn } from "@/lib/utils";

const STEPS = [
  { id: "intro", label: "Welcome" },
  { id: "consent", label: "Consent" },
  { id: "proctoring", label: "Setup" },
  { id: "mic", label: "Mic check" },
  { id: "live", label: "Interview" },
  { id: "done", label: "Done" },
] as const;

export function InterviewStepper({ current }: { current: string }) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);

  return (
    <nav aria-label="Interview progress" className="mb-8">
      <ol className="flex flex-wrap items-center justify-center gap-2">
        {STEPS.map((step, index) => {
          const complete = index < currentIndex;
          const active = index === currentIndex;
          return (
            <li key={step.id} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-7 min-w-7 items-center justify-center rounded-full text-xs font-semibold",
                  complete && "bg-brand text-brand-foreground",
                  active && "bg-brand-muted text-brand ring-2 ring-brand",
                  !complete && !active && "bg-muted text-muted-foreground"
                )}
                aria-current={active ? "step" : undefined}
              >
                {complete ? "✓" : index + 1}
              </span>
              <span
                className={cn(
                  "hidden text-xs sm:inline",
                  active ? "font-medium text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
              {index < STEPS.length - 1 ? (
                <span className="mx-1 hidden h-px w-4 bg-border sm:inline" aria-hidden />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
