"use client";

import { useState, useCallback, useEffect } from "react";

export interface TourStep {
  id: string;
  title: string;
  description: string;
  icon?: React.ElementType;
  target?: string;
}

export interface WelcomeTourProps {
  orgId?: string;
  onComplete?: () => void;
  onSkip?: () => void;
}

export function useWelcomeTour({ orgId, onComplete, onSkip }: WelcomeTourProps = {}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const tourSteps: TourStep[] = [
    {
      id: "step-1",
      title: "Create your first job posting",
      description: "Learn how to create an effective job posting that attracts top talent",
      target: "[data-tour='job-post']",
    },
    {
      id: "step-2",
      title: "Step 2",
      description: "Setup interview questions for better candidate evaluation",
      target: "[data-tour='questions']",
    },
    {
      id: "step-3",
      title: "Step 3",
      description: "Invite team members to collaborate on hiring",
      target: "[data-tour='team']",
    },
  ];

  const totalSteps = tourSteps.length;

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const calculatedProgress = ((currentStep + 1) / totalSteps) * 100;
    setProgress(calculatedProgress);
  }, [currentStep, totalSteps]);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const startTour = useCallback(() => {
    setIsTourOpen(true);
    setCurrentStep(0);
  }, []);

  const completeTour = useCallback(() => {
    setIsTourOpen(false);
    setCurrentStep(0);
    onComplete?.();
  }, [onComplete]);

  const skipTour = useCallback(() => {
    setIsTourOpen(false);
    setCurrentStep(0);
    onSkip?.();
  }, [onSkip]);

  const goToStep = useCallback((stepIndex: number) => {
    setCurrentStep(Math.max(0, Math.min(stepIndex, totalSteps - 1)));
  }, [totalSteps]);

  return {
    currentStep,
    isTourOpen,
    progress,
    isMobile,
    tourSteps,
    totalSteps,
    orgId,
    startTour,
    nextStep,
    prevStep,
    completeTour,
    skipTour,
    goToStep,
  };
}