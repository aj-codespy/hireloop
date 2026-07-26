"use client";

import { WelcomeStep } from "@/components/onboarding/WelcomeStep";
import { useWelcomeTour } from "@/hooks/useWelcomeTour";
import { Button } from "@/components/ui/button";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";
import type { LucideIconName } from "@/components/icons/icon-map";

const nextActions: { icon: LucideIconName; label: string }[] = [
  { icon: "Briefcase", label: "Create your first job" },
  { icon: "ClipboardList", label: "Set up interview questions" },
  { icon: "Users", label: "Invite team members" },
  { icon: "CreditCard", label: "Review your subscription" },
];

export interface WelcomeTourProps {
  orgId?: string;
  onComplete?: () => void;
  onSkip?: () => void;
}

export function WelcomeTour({ orgId, onComplete, onSkip }: WelcomeTourProps = {}) {
  const {
    currentStep,
    isTourOpen,
    progress,
    tourSteps,
    totalSteps,
    startTour,
    nextStep,
    prevStep,
    completeTour,
    skipTour,
  } = useWelcomeTour({ orgId, onComplete, onSkip });

  if (!isTourOpen) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#FAFAF9] px-5 py-12">
        <div className="w-full max-w-2xl rounded-3xl border border-[#ECECEC] bg-white p-6 shadow-[0_12px_40px_rgba(15,15,15,0.08)] sm:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F97316]">Workspace ready</p>
            <h1 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-[#111827]">Welcome to HireLoop</h1>
            <p className="mt-4 max-w-xl leading-7 text-[#6B7280]">
              Your organization is ready. Take a quick tour of the tools your team will use first.
            </p>
            
            <div className="mt-8 space-y-4">
              {tourSteps.map((step, index) => (
                <div key={step.id} className="flex gap-4">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#FAFAF9] text-[#F97316]">
                    <span className="text-sm font-semibold">{index + 1}</span>
                  </div>
                  <div className="text-left">
                    <h2 className="font-semibold text-[#111827]">{step.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-[#6B7280]">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl bg-[#FAFAF9] p-5">
              <h2 className="font-medium">First actions</h2>
              <ul className="mt-3 grid gap-3 text-sm text-[#6B7280] sm:grid-cols-2">
                {nextActions.map((action) => (
                  <li key={action.label} className="flex items-center gap-3">
                    <PhosphorIcon name={action.icon} className="size-4 text-[#F97316]" aria-hidden={true} />
                    {action.label}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={startTour}
                className="h-12 rounded-full bg-[#F97316] px-8 font-semibold text-white hover:bg-[#EA6B2D]"
              >
                Start tour
              </Button>
              <Button
                variant="outline"
                onClick={skipTour}
                className="h-12 rounded-full border-[#ECECEC] px-8 font-semibold hover:bg-[#FAFAF9]"
              >
                Skip tour
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentStepData = tourSteps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  return (
    <div className="min-h-dvh bg-[#FAFAF9] px-5 py-10 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {totalSteps}
          </div>
          <button
            onClick={skipTour}
            className="flex min-h-11 items-center rounded-full px-3 text-sm text-[#6B7280] transition-colors duration-200 hover:bg-white hover:text-[#111827] focus-visible:outline-2 focus-visible:outline-[#F97316]"
          >
            Skip tour
          </button>
        </div>

        <div className="mb-6 rounded-2xl border border-[#ECECEC] bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="h-2 rounded-full bg-[#F97316] transition-all duration-200 motion-reduce:transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <WelcomeStep
          step={currentStepData}
          isActive={true}
          isFirst={isFirst}
          isLast={isLast}
          onNext={nextStep}
          onPrevious={prevStep}
          onSkip={skipTour}
          onComplete={completeTour}
          orgId={orgId}
        />
      </div>
    </div>
  );
}