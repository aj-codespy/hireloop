"use client";

import { motion } from "framer-motion";
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
    <nav aria-label="Interview progress" className="mb-8 px-2">
      <ol className="flex items-center justify-center gap-1 sm:gap-2">
        {STEPS.map((step, index) => {
          const complete = index < currentIndex;
          const active = index === currentIndex;

          return (
            <li key={step.id} className="flex items-center gap-1 sm:gap-2">
              <motion.div
                className="relative"
                initial={false}
                animate={active ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <motion.span
                  className={cn(
                    "flex h-8 min-w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors sm:h-9 sm:min-w-9",
                    complete && "bg-brand text-brand-foreground",
                    active &&
                      "bg-brand-muted text-brand ring-2 ring-brand ring-offset-2 ring-offset-background",
                    !complete && !active && "bg-muted text-muted-foreground",
                  )}
                  aria-current={active ? "step" : undefined}
                >
                  {complete ? (
                    <motion.svg
                      key="check"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.3 }}
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <motion.path
                        d="M5 13l4 4L19 7"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    </motion.svg>
                  ) : (
                    index + 1
                  )}
                </motion.span>

                {/* Active pulse ring */}
                {active && (
                  <motion.span
                    className="absolute inset-0 rounded-full border-2 border-brand"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    aria-hidden
                  />
                )}
              </motion.div>

              <motion.span
                className={cn(
                  "hidden text-xs sm:inline",
                  active
                    ? "font-semibold text-foreground"
                    : complete
                      ? "text-muted-foreground"
                      : "text-muted-foreground/60",
                )}
                initial={false}
                animate={active ? { opacity: 1, x: 0 } : { opacity: 0.6, x: 0 }}
              >
                {step.label}
              </motion.span>

              {index < STEPS.length - 1 && (
                <motion.div
                  className={cn(
                    "mx-1 hidden h-px w-6 sm:block sm:w-8",
                    complete ? "bg-brand" : "bg-border",
                  )}
                  initial={false}
                  animate={
                    complete
                      ? { backgroundColor: "var(--brand)" }
                      : { backgroundColor: "var(--border)" }
                  }
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Progress bar */}
      <div className="mx-auto mt-4 h-1 w-full max-w-md overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-brand"
          initial={{ width: "0%" }}
          animate={{
            width: `${((currentIndex + 1) / STEPS.length) * 100}%`,
          }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
    </nav>
  );
}