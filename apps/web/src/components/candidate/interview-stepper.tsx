"use client";

import { motion, useReducedMotion } from "framer-motion";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";
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
  const reduceMotion = useReducedMotion();
  const currentIndex = STEPS.findIndex((s) => s.id === current);

  return (
    <nav aria-label="Interview progress" className="mb-10">
      <ol className="flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
        {STEPS.map((step, index) => {
          const complete = index < currentIndex;
          const active = index === currentIndex;

          return (
            <li key={step.id} className="flex shrink-0 items-center gap-2">
              <motion.div
                className="relative"
                initial={false}
                animate={!reduceMotion && active ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <motion.span
                  className={cn(
                    "flex h-8 min-w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-200",
                    complete && "bg-slate-900 text-white",
                    active &&
                      "bg-orange-50 text-[#F97316] ring-1 ring-[#F97316] ring-offset-2 ring-offset-white",
                    !complete && !active && "bg-stone-100 text-slate-500",
                  )}
                  aria-current={active ? "step" : undefined}
                >
                  {complete ? (
                    <PhosphorIcon name="Check" />
                  ) : (
                    index + 1
                  )}
                </motion.span>

              </motion.div>

              <span
                className={cn(
                  "text-xs",
                  active
                    ? "font-semibold text-foreground"
                    : complete
                      ? "text-muted-foreground"
                      : "text-muted-foreground/60",
                )}
              >
                {step.label}
              </span>

              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-1 hidden h-px w-6 sm:block sm:w-8",
                    complete ? "bg-slate-900" : "bg-stone-200",
                  )}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-stone-100">
        <motion.div
          className="h-full rounded-full bg-[#F97316]"
          initial={{ width: "0%" }}
          animate={{
            width: `${((currentIndex + 1) / STEPS.length) * 100}%`,
          }}
          transition={{ duration: reduceMotion ? 0 : 0.25, ease: "easeOut" }}
        />
      </div>
    </nav>
  );
}