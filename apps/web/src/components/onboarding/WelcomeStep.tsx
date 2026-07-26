import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";
import type { LucideIconName } from "@/components/icons/icon-map";

export interface WelcomeStepProps {
  step: {
    id: string;
    title: string;
    description: string;
    icon?: LucideIconName; // Phosphor icon name (mapped from Lucide)
  };
  isActive: boolean;
  isFirst: boolean;
  isLast: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onComplete: () => void;
  orgId?: string;
}

export function WelcomeStep({
  step,
  isActive,
  isFirst,
  isLast,
  onNext,
  onPrevious,
  onSkip,
  onComplete,
  orgId,
}: WelcomeStepProps) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          data-testid="welcome-tour-container"
          data-tour-step={step.id}
          className="flex h-full min-w-0 flex-col rounded-3xl border border-[#ECECEC] bg-white p-6 shadow-[0_12px_40px_rgba(15,15,15,0.08)] sm:min-w-[320px] sm:p-8"
          initial={reduceMotion ? false : { opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? { opacity: 1 } : { opacity: 0, x: -20 }}
          transition={{ duration: reduceMotion ? 0 : 0.25, ease: "easeOut" }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F97316]">Step {step.id.split('-')[0]}</p>
              <h2 className="mt-3 text-2xl font-bold tracking-[-0.025em] text-[#111827]">{step.title}</h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-[#6B7280]">{step.description}</p>
              {orgId && (
                <div className="mt-5 rounded-xl bg-[#FAFAF9] p-3">
                  <span className="text-xs text-[#6B7280]">Organization: {orgId}</span>
                </div>
              )}
            </div>
            {step.icon && (
              <div className="ml-4 flex size-12 items-center justify-center rounded-xl bg-[#FAFAF9] text-[#F97316]">
                <PhosphorIcon name={step.icon} className="h-6 w-6" />
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              {!isFirst && (
                <Button
                  variant="outline"
                  onClick={onPrevious}
                  className="h-11 rounded-full px-5"
                >
                  <PhosphorIcon name="ArrowLeft" className="mr-2 h-4 w-4" />
                  Previous
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={onSkip}
                className="h-11 rounded-full px-5 text-[#6B7280] hover:text-[#111827]"
              >
                Skip tour
              </Button>
            </div>
            <div className="flex">
              {isLast ? (
                <Button
                  onClick={onComplete}
                  className="h-11 w-full rounded-full bg-[#F97316] px-6 font-semibold text-white hover:bg-[#EA6B2D] sm:w-auto"
                >
                  <PhosphorIcon name="Check" className="mr-2 h-4 w-4" />
                  Complete
                </Button>
              ) : (
                <Button
                  onClick={onNext}
                  className="h-11 w-full rounded-full bg-[#F97316] px-6 font-semibold text-white hover:bg-[#EA6B2D] sm:w-auto"
                >
                  Next
                  <PhosphorIcon name="ArrowRight" className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}