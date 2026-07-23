"use client";

import { useEffect, useState } from "react";
import { InterviewPhase, InterviewStep } from "./InterviewPhase";
import { useInterviewFlow } from "@/hooks/useInterviewFlow";
import { cn } from "@/lib/utils";

type InterviewFlowProps = {
  interviewToken: string;
  candidateName: string;
  jobTitle: string;
  organizationName?: string;
  introVideoUrl?: string;
  onComplete?: (result: { passed?: boolean; totalScore?: number; status?: string; reason?: string }) => void;
};

export function InterviewFlow({
  interviewToken,
  candidateName,
  jobTitle,
  organizationName,
  introVideoUrl,
  onComplete,
}: InterviewFlowProps) {
  const {
    currentStep,
    steps,
    phase,
    isLoading,
    error,
    mediaStream,
    language,
    canProceed,
    startInterview,
    resumeInterview,
    pauseInterview,
    skipQuestion,
    nextStep,
    completeInterview,
    saveProgress,
    restoreProgress,
    getProgressSnapshot,
    updateProgress,
    isProgressSaving,
    lastSaved,
    sessionId,
    questionCount,
    currentQuestionIndex,
    timeRemaining,
    overallTimeRemaining,
    isConnected,
    isResuming,
    canResume,
    interviewMetadata,
    proctoringStatus,
    flagged,
    lockReason,
  } = useInterviewFlow(interviewToken);

  const [isInitialized, setIsInitialized] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [skipReason, setSkipReason] = useState("");

  // Initialize interview flow
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsInitialized(false);
        await startInterview();
        setIsInitialized(true);
      } catch (err) {
        console.error("Failed to initialize interview:", err);
      }
    };

    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, startInterview]);

  // Auto-save progress periodically
  useEffect(() => {
    if (!isProgressSaving && currentStep === "live" && isConnected) {
      const interval = setInterval(() => {
        saveProgress();
      }, 30000); // Save every 30 seconds

      return () => clearInterval(interval);
    }
  }, [currentStep, isConnected, isProgressSaving, saveProgress]);

  // Handle resume from saved progress
  useEffect(() => {
    if (canResume && isResuming) {
      const restore = async () => {
        try {
          await resumeInterview();
        } catch (err) {
          console.error("Failed to resume interview:", err);
        }
      };
      restore();
    }
  }, [canResume, isResuming, resumeInterview]);

  const handleSkip = async () => {
    if (!skipReason.trim()) {
      return;
    }
    try {
      await skipQuestion(skipReason);
      setShowSkipConfirm(false);
      setSkipReason("");
    } catch (err) {
      console.error("Failed to skip question:", err);
    }
  };

  const handlePause = async () => {
    try {
      await pauseInterview();
    } catch (err) {
      console.error("Failed to pause interview:", err);
    }
  };

  const handleComplete = async () => {
    try {
      await completeInterview();
      onComplete?.({
        status: "completed",
        totalScore: interviewMetadata?.overallScore,
      });
    } catch (err) {
      console.error("Failed to complete interview:", err);
    }
  };

  // Render different stages
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing interview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Error</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                {candidateName.split(" ")[0]}, interviewing for {jobTitle}
              </h1>
              <p className="text-sm text-muted-foreground">
                Step {currentQuestionIndex + 1} of {questionCount || "?"} • {steps.find((s) => s.id === currentStep)?.label}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Progress indicator */}
              <div className="hidden md:flex items-center gap-2">
                <div className="text-xs text-muted-foreground">Progress:</div>
                <div className="flex gap-1">
                  {steps.map((step, index) => {
                    const isActive = step.id === currentStep;
                    const isCompleted = steps.some((s) => s.status === "completed");
                    return (
                      <div
                        key={step.id}
                        className={cn(
                          "w-8 h-1 rounded-full transition-colors",
                          isActive && "bg-brand",
                          !isActive && isCompleted && "bg-green-500",
                          !isActive && !isCompleted && "bg-muted"
                        )}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Status indicators */}
              <div className="flex items-center gap-2">
                {isProgressSaving && (
                  <div className="flex items-center gap-1 text-xs text-amber-600">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-amber-600"></div>
                    Saving...
                  </div>
                )}
                {lastSaved && (
                  <div className="text-xs text-muted-foreground">
                    Last saved: {new Date(lastSaved.timestamp).toLocaleTimeString()}
                  </div>
                )}
                {isConnected ? (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Connected
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    Disconnected
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Warning banners */}
        {flagged && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <div className="text-red-600">⚠️</div>
              <div>
                <h3 className="font-medium text-red-900">Interview Flagged</h3>
                <p className="text-sm text-red-700 mt-1">{lockReason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Interview phase content */}
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]]">
          <div>
            <InterviewPhase
              step={currentStep}
              interviewToken={interviewToken}
              mediaStream={mediaStream}
              language={language}
              onComplete={handleComplete}
              onSkip={(reason) => {
                setSkipReason(reason);
                setShowSkipConfirm(true);
              }}
              onPause={handlePause}
              timeRemaining={timeRemaining}
              overallTimeRemaining={overallTimeRemaining}
              questionCount={questionCount}
              currentQuestionIndex={currentQuestionIndex}
              proctoringStatus={proctoringStatus}
              sessionId={sessionId}
            />
          </div>

          {/* Sidebar with controls and info */}
          <div className="space-y-6">
            {/* Interview metadata */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-medium text-foreground mb-3">Interview Info</h3>
              <div className="space-y-2 text-sm">
                {organizationName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Organization:</span>
                    <span className="text-foreground">{organizationName}</span>
                  </div>
                )}
                {interviewMetadata?.jobTitle && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Position:</span>
                    <span className="text-foreground">{interviewMetadata.jobTitle}</span>
                  </div>
                )}
                {questionCount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Questions:</span>
                    <span className="text-foreground">{questionCount}</span>
                  </div>
                )}
                {lastSaved && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last saved:</span>
                    <span className="text-foreground">{lastSaved.questionIndex}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick actions */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-medium text-foreground mb-3">Quick Actions</h3>
              <div className="space-y-2">
                {canResume && (
                  <button
                    onClick={() => resumeInterview()}
                    className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                  >
                    Resume from saved progress
                  </button>
                )}
                <button
                  onClick={() => {
                    const snapshot = getProgressSnapshot();
                    if (snapshot) {
                      navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2));
                    }
                  }}
                  className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                >
                  Copy progress
                </button>
                <button
                  onClick={() => saveProgress()}
                  className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                >
                  Save current progress
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Skip confirmation modal */}
      {showSkipConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-foreground mb-2">Skip Question</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please provide a reason for skipping this question. Your reason will be recorded for review.
            </p>
            <textarea
              value={skipReason}
              onChange={(e) => setSkipReason(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm mb-4"
              rows={3}
              placeholder="Reason for skipping..."
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSkipConfirm(false);
                  setSkipReason("");
                }}
                className="flex-1 px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleSkip}
                disabled={!skipReason.trim()}
                className="flex-1 px-4 py-2 text-sm rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Skip Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}