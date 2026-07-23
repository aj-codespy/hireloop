"use client";

import { WelcomeStep } from "@/components/onboarding/WelcomeStep";
import { useWelcomeTour } from "@/hooks/useWelcomeTour";

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
    isMobile,
    startTour,
    nextStep,
    prevStep,
    completeTour,
    skipTour,
  } = useWelcomeTour({ orgId, onComplete, onSkip });

  if (!isTourOpen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
        <div className="w-full max-w-2xl rounded-lg gradient elev-3 reveal p-8 shadow-lg">
          <div className="text-center">
            <h1 className="mb-4 text-3xl font-bold text-foreground">Welcome to HireLoop!</h1>
            <p className="mb-8 text-muted-foreground">
              Your organization has been created successfully. Let&apos;s get you started with a quick guided tour of the key features.
            </p>
            
            <div className="mb-8 space-y-4">
              {tourSteps.map((step, index) => (
                <div key={step.id} className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-muted text-brand shadow-lg">
                    <span className="text-sm font-semibold">{index + 1}</span>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-foreground">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-6 rounded-lg bg-muted/50 p-4">
              <h4 className="font-medium mb-2">What&apos;s next?</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  📝 Create your first job posting
                </li>
                <li className="flex items-center gap-2">
                  🎯 Setup interview questions
                </li>
                <li className="flex items-center gap-2">
                  👥 Invite team members to your organization
                </li>
                <li className="flex items-center gap-2">
                  💳 Review your subscription plan
                </li>
              </ul>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={startTour}
                className="px-8 py-3 rounded-full bg-brand text-brand-foreground font-medium hover:bg-brand/90 transition-colors"
              >
                Start Tour
              </button>
              <button
                onClick={skipTour}
                className="px-8 py-3 rounded-full border border-border text-foreground font-medium hover:bg-muted transition-colors"
              >
                Skip Tour
              </button>
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
    <div className="min-h-screen bg-muted/30 px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {totalSteps}
          </div>
          <button
            onClick={skipTour}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip Tour
          </button>
        </div>

        <div className="mb-6 rounded-lg bg-card p-4 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-brand h-2 rounded-full transition-all duration-300"
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

        {isMobile && (
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">Mobile view enabled</p>
          </div>
        )}
      </div>
    </div>
  );
}