"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";
import { cn } from "@/lib/utils";
import { interviewWsUrl } from "@/lib/config";
import { formatSeconds } from "@/lib/format";

export type InterviewStep = 
  | "intro" 
  | "consent" 
  | "proctoring" 
  | "mic" 
  | "live" 
  | "done" 
  | "flagged";

interface InterviewPhaseProps {
  step: string;
  interviewToken: string;
  mediaStream?: MediaStream | null;
  language?: "en" | "hi";
  onComplete?: (result: { passed?: boolean; totalScore?: number; status?: string; reason?: string }) => void;
  onSkip?: (reason: string) => void;
  onPause?: () => void;
  timeRemaining?: number;
  overallTimeRemaining?: number;
  questionCount?: number;
  currentQuestionIndex?: number;
  proctoringStatus?: string;
  sessionId?: string | null;
}

interface InterviewSocketEvent {
  type: string;
  status?: string;
  prompt?: string;
  index?: number;
  message?: string;
}

export function InterviewPhase({
  step,
  interviewToken,
  mediaStream,
  language = "en",
  onComplete,
  onSkip,
  onPause,
  timeRemaining,
  overallTimeRemaining,
  questionCount,
  currentQuestionIndex,
  proctoringStatus,
  sessionId,
}: InterviewPhaseProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [, setPhase] = useState<"idle" | "connecting" | "active" | "submitting" | "done" | "error">("idle");
  const [questionText, setQuestionText] = useState("");
  const [questionMeta, setQuestionMeta] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [skipping, setSkipping] = useState(false);
  const [skipReason, setSkipReason] = useState("");
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<WebSocket | null>(null);

  // Initialize video stream
  useEffect(() => {
    if (mediaStream && videoRef.current) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  const handleMessage = useCallback((payload: InterviewSocketEvent) => {
    switch (payload.type) {
      case "session_started":
        setPhase("active");
        setQuestionText(payload.prompt || "");
        break;
      case "question_changed":
        setQuestionText(payload.prompt || "");
        setQuestionMeta(`Question ${(payload.index ?? 0) + 1}`);
        break;
      case "timer":
        break;
      case "session_ended":
        setPhase("done");
        onComplete?.({ status: payload.status });
        break;
      case "error":
        setError(payload.message || "Unknown error");
        setPhase("error");
        break;
    }
  }, [onComplete]);

  // WebSocket connection
  useEffect(() => {
    const ws = new WebSocket(interviewWsUrl(interviewToken, language));
    socketRef.current = ws;

    ws.onopen = () => {
      setPhase("connecting");
      ws.send(JSON.stringify({ type: "bootstrap" }));
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as InterviewSocketEvent;
        handleMessage(payload);
      } catch (err) {
        console.error("Failed to parse message:", err);
      }
    };

    ws.onerror = () => {
      setError("Connection error");
    };

    ws.onclose = () => {
      socketRef.current = null;
      setPhase((current) => current === "done" ? current : "error");
    };

    return () => {
      ws.close();
    };
  }, [handleMessage, interviewToken, language]);

  const sendMessage = (message: Record<string, unknown>) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    }
  };

  const handleStartRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      // Start recording logic would go here
    }
  };

  const handleStopRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      // Stop recording logic would go here
      sendMessage({ type: "submit_answer", question_index: currentQuestionIndex || 0 });
    }
  };

  const handleSkip = () => {
    if (skipReason.trim()) {
      setSkipping(true);
      onSkip?.(skipReason);
      sendMessage({ type: "skip_question", reason: skipReason, question_index: currentQuestionIndex || 0 });
      setSkipping(false);
      setSkipReason("");
    }
  };

  const handlePause = () => {
    onPause?.();
    sendMessage({ type: "pause_interview" });
  };

  // Render different step views
  switch (step) {
    case "intro":
      return (
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Interview Introduction</h2>
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="space-y-4">
                {mediaStream ? (
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white">
                      <PhosphorIcon name="Video" className="h-4 w-4" />
                      <span className="text-sm">Webcam active</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center aspect-video rounded-lg bg-muted/50">
                    <PhosphorIcon name="VideoOff" className="h-12 w-12 text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Camera not available</span>
                  </div>
                )}
                <div className="space-y-2">
                  <h3 className="font-medium text-foreground">Interview Setup</h3>
                  <p className="text-sm text-muted-foreground">
                    Your interview will be conducted remotely with proctoring. <br/>
                    Make sure you have a quiet environment and that your camera is working.
                  </p>
                </div>
              </div>
            </div>

            {timeRemaining !== undefined && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <PhosphorIcon name="Clock" className="h-4 w-4" />
                <span>Time remaining: {formatSeconds(timeRemaining)}</span>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-2 text-red-600">
                  <PhosphorIcon name="AlertTriangle" className="h-4 w-4 shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      );

    case "mic":
      return (
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Microphone Check</h2>
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="space-y-6">
                {mediaStream ? (
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center aspect-video rounded-lg bg-muted/50">
                    <PhosphorIcon name="VideoOff" className="h-12 w-12 text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Camera not available</span>
                  </div>
                )}

                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setIsRecording(!isRecording)}
                    className={cn(
                      "flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors",
                      isRecording
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-brand text-brand-foreground hover:bg-brand/90"
                    )}
                  >
                    {isRecording ? (
                      <>
                        <PhosphorIcon name="MicOff" className="h-4 w-4" />
                        <span>Stop Recording</span>
                      </>
                    ) : (
                      <>
                        <PhosphorIcon name="Mic" className="h-4 w-4" />
                        <span>Start Recording</span>
                      </>
                    )}
                  </button>
                </div>

                {isRecording && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                    <div className="flex items-center gap-2 text-red-600">
                      <div className="animate-pulse h-3 w-3 bg-red-600 rounded-full"></div>
                      <span className="text-sm font-medium">Recording…</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );

    case "live":
      return (
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Video and Question Area */}
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">Current Question</h2>
                
                {mediaStream && (
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-black mb-4">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white">
                      <PhosphorIcon name="User" className="h-4 w-4" />
                      <span className="text-sm">Candidate View</span>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Question {currentQuestionIndex ? currentQuestionIndex + 1 : 1}</span>
                    <span>•</span>
                    <span>{questionMeta}</span>
                    {timeRemaining !== undefined && (
                      <>
                        <span>•</span>
                        <PhosphorIcon name="Clock" className="h-4 w-4" />
                        <span>{formatSeconds(timeRemaining)}</span>
                      </>
                    )}
                    {overallTimeRemaining !== undefined && (
                      <>
                        <span>•</span>
                        <span>Overall: {formatSeconds(overallTimeRemaining)}</span>
                      </>
                    )}
                  </div>

                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-foreground whitespace-pre-wrap">
                      {questionText || "Loading question…"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {questionCount ? `Question ${currentQuestionIndex ? currentQuestionIndex + 1 : 1} of ${questionCount}` : "Preparing question…"}
                    </div>
                    {sessionId && (
                      <div className="text-xs text-muted-foreground">
                        Session: {sessionId.slice(0, 8)}…
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Controls and Info */}
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-medium text-foreground mb-4">Recording Controls</h3>
                <div className="space-y-4">
                  <button
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors",
                      isRecording
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-brand text-brand-foreground hover:bg-brand/90"
                    )}
                  >
                    {isRecording ? (
                      <>
                        <PhosphorIcon name="MicOff" className="h-4 w-4" />
                        <span>Stop Recording</span>
                      </>
                    ) : (
                      <>
                        <PhosphorIcon name="Mic" className="h-4 w-4" />
                        <span>Start Recording</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handlePause}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-border hover:bg-muted transition-colors"
                  >
                    <PhosphorIcon name="Pause" />
                    <span>Pause Interview</span>
                  </button>

                  <button
                    onClick={() => setShowSkipConfirm(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                  >
                    <PhosphorIcon name="AlertTriangle" className="h-4 w-4" />
                    <span>Skip Question</span>
                  </button>
                </div>
              </div>

              {proctoringStatus && (
                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="font-medium text-foreground mb-3">Proctoring Status</h3>
                  <div className={cn(
                    "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium",
                    proctoringStatus === "active" && "bg-green-100 text-green-700",
                    proctoringStatus === "warning" && "bg-amber-100 text-amber-700",
                    proctoringStatus === "flagged" && "bg-red-100 text-red-700"
                  )}>
                    {proctoringStatus === "active" && "Proctoring active"}
                    {proctoringStatus === "warning" && "Proctoring warning"}
                    {proctoringStatus === "flagged" && "Proctoring flagged"}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Skip Confirmation Modal */}
          {showSkipConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5" role="dialog" aria-modal="true" aria-labelledby="phase-skip-title">
              <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-[0_12px_40px_rgba(15,15,15,0.16)]">
                <h2 id="phase-skip-title" className="mb-2 text-lg font-semibold text-foreground">Skip question</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Please provide a reason for skipping this question. Your reason will be recorded for review.
                </p>
                <textarea
                  aria-label="Reason for skipping"
                  value={skipReason}
                  onChange={(e) => setSkipReason(e.target.value)}
                  className="mb-4 w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none focus-visible:border-[#F97316] focus-visible:ring-2 focus-visible:ring-[#F97316]/20"
                  rows={3}
                  placeholder="Reason for skipping…"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowSkipConfirm(false);
                      setSkipReason("");
                    }}
                    className="min-h-11 flex-1 rounded-full border border-stone-200 px-4 text-sm font-semibold hover:bg-stone-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSkip}
                    disabled={!skipReason.trim() || skipping}
                    className="min-h-11 flex-1 rounded-full bg-[#F97316] px-4 text-sm font-semibold text-white hover:bg-[#EA6B2D] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {skipping ? "Skipping…" : "Skip question"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-2 text-red-600">
                <PhosphorIcon name="AlertTriangle" className="h-4 w-4 shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}
        </div>
      );

    case "consent":
      return (
        <div className="mx-auto max-w-2xl space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">Consent & Agreement</h2>
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              By proceeding, you agree to participate in this interview with strict proctoring.
              Your webcam and microphone will be recorded for the duration of the interview.
              The interview will be monitored for compliance with our testing policies.
            </p>
          </div>
        </div>
      );

    case "proctoring":
      return (
        <div className="mx-auto max-w-2xl space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">Proctoring Setup</h2>
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Setting up proctoring measures to ensure a fair and secure interview environment.
            </p>
          </div>
        </div>
      );

    case "done":
      return (
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <PhosphorIcon name="CheckCircle2" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground">Interview Complete</h2>
            <div className="rounded-xl border border-border bg-card p-6">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your interview has been completed successfully. Thank you for participating!
              </p>
            </div>
          </div>
        </div>
      );

    case "flagged":
      return (
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <PhosphorIcon name="AlertTriangle" className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-semibold text-red-900">Interview Terminated</h2>
            <div className="rounded-xl border border-red-200 bg-red-50 p-6">
              <p className="text-sm text-red-700 leading-relaxed">
                Your interview was terminated due to a proctoring violation. Please contact support if you believe this is an error.
              </p>
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto"></div>
            <p className="text-muted-foreground">Loading interview phase…</p>
          </div>
        </div>
      );
  }
}