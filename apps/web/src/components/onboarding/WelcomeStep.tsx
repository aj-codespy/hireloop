"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Check, ArrowRight, ArrowLeft } from "lucide-react";

export interface WelcomeStepProps {
  step: {
    id: string;
    title: string;
    description: string;
    icon?: React.ElementType;
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
  const Icon = step.icon;

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          data-testid="welcome-tour-container"
          data-tour-step={step.id}
          className="flex h-full min-w-[320px] flex-col rounded-lg gradient elev-3 reveal p-6 shadow-lg"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="mb-2 text-xl font-bold text-foreground">Step {step.id.split('-')[0]}</h2>
              <h3 className="mb-4 text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
              {orgId && (
                <div className="mt-4 rounded-md bg-muted/50 p-3">
                  <span className="text-xs text-muted-foreground">Organization: {orgId}</span>
                </div>
              )}
            </div>
            {Icon && (
              <div className="ml-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-muted text-brand shadow-lg">
                <Icon className="h-6 w-6" />
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-between">
            <div className="flex gap-2">
              {!isFirst && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPrevious}
                  className="h-9 px-4"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkip}
                className="h-9 px-4 text-muted-foreground hover:text-foreground"
              >
                Skip Tour
              </Button>
            </div>
            <div className="flex gap-2">
              {isLast ? (
                <Button
                  onClick={onComplete}
                  className="h-9 px-6 bg-brand text-brand-foreground hover:bg-brand/90"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Complete
                </Button>
              ) : (
                <Button
                  onClick={onNext}
                  className="h-9 px-6 bg-brand text-brand-foreground hover:bg-brand/90"
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}