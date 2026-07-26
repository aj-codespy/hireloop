import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useHireLoop } from "@/lib/store/provider";
import type { Application, JobRole, Candidate } from "@/lib/types";
import { generateId } from "@/lib/id";
import { logger } from "@/lib/logger";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";

interface InterviewStep {
  id: string;
  label: string;
  status: "pending" | "active" | "completed" | "skipped" | "paused";
  order: number;
  metadata?: Record<string, unknown>;
}

interface InterviewSocketPayload {
  type: string;
  session_id?: string;
  question_count?: number;
  current_index?: number;
  index?: number;
  question_remaining_seconds?: number;
  overall_remaining_seconds?: number;
  overall_limit_seconds?: number;
  overall_score?: number;
  proctoring_flagged?: boolean;
  cheating_probability?: number;
  reason?: string;
  message?: string;
}

interface InterviewProgress {
  currentStep: string;
  steps: InterviewStep[];
  phase: "idle" | "connecting" | "active" | "submitting" | "done" | "error";
  isLoading: boolean;
  error: string | null;
  mediaStream: MediaStream | null;
  language: "en" | "hi";
  canProceed: boolean;
  sessionId: string | null;
  questionCount: number;
  currentQuestionIndex: number;
  timeRemaining?: number;
  overallTimeRemaining?: number;
  isConnected: boolean;
  isResuming: boolean;
  canResume: boolean;
  interviewMetadata: {
    jobTitle?: string;
    organizationName?: string;
    overallScore?: number;
    proctoringFlagged?: boolean;
    cheatingProbability?: number;
  } | null;
  proctoringStatus: string;
  flagged: boolean;
  lockReason: string | null;
  lastSaved: {
    questionIndex: number;
    timestamp: string;
    data: InterviewProgress;
  } | null;
  isProgressSaving: boolean;
}

interface UseInterviewFlowReturn extends InterviewProgress {
  // Actions
  startInterview: () => Promise<void>;
  resumeInterview: () => Promise<void>;
  pauseInterview: () => Promise<void>;
  skipQuestion: (reason: string) => Promise<void>;
  nextStep: () => Promise<void>;
  completeInterview: () => Promise<void>;
  saveProgress: () => Promise<void>;
  restoreProgress: () => Promise<void>;
  getProgressSnapshot: () => InterviewProgress;
  updateProgress: (updates: Partial<InterviewProgress>) => void;
  
  // Utilities
  resetInterview: () => void;
  setLanguage: (lang: "en" | "hi") => void;
}

function createInitialSteps(): InterviewStep[] {
  return [
    { id: "intro", label: "Introduction", status: "pending", order: 1 },
    { id: "consent", label: "Consent", status: "pending", order: 2 },
    { id: "proctoring", label: "Proctoring Setup", status: "pending", order: 3 },
    { id: "mic", label: "Microphone Check", status: "pending", order: 4 },
    { id: "live", label: "Live Interview", status: "pending", order: 5 },
    { id: "done", label: "Completion", status: "pending", order: 6 },
  ];
}

function createDefaultProgress(): InterviewProgress {
  return {
    currentStep: "intro",
    steps: createInitialSteps(),
    phase: "idle",
    isLoading: false,
    error: null,
    mediaStream: null,
    language: "en",
    canProceed: false,
    sessionId: null,
    questionCount: 0,
    currentQuestionIndex: 0,
    timeRemaining: undefined,
    overallTimeRemaining: undefined,
    isConnected: false,
    isResuming: false,
    canResume: false,
    interviewMetadata: null,
    proctoringStatus: "inactive",
    flagged: false,
    lockReason: null,
    lastSaved: null,
    isProgressSaving: false,
  };
}

export function useInterviewFlow(interviewToken: string): UseInterviewFlowReturn {
  const { refreshState, state: hireLoopState } = useHireLoop();
  const [progress, setProgress] = useState<InterviewProgress>(createDefaultProgress());
  const progressRef = useRef<InterviewProgress>(progress);
  const wsRef = useRef<WebSocket | null>(null);
  const progressSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update progress ref when progress changes
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080'}/interview/${interviewToken}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setProgress(prev => ({ ...prev, isConnected: true }));
      ws.send(JSON.stringify({ type: "bootstrap" }));
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        handleWebSocketMessage(payload);
      } catch (err) {
        logger.error("Failed to parse WebSocket message:", err);
      }
    };

    ws.onerror = () => {
      setProgress(prev => ({ ...prev, error: "Connection error", isConnected: false }));
    };

    ws.onclose = () => {
      setProgress(prev => ({ ...prev, isConnected: false }));
      wsRef.current = null;
      
      // Attempt reconnection if not in done phase
      if (progressRef.current.phase !== "done") {
        setTimeout(() => {
          if (progressRef.current.phase !== "done") {
            connectWebSocket();
          }
        }, 3000);
      }
    };
  }, [interviewToken]);

  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setProgress(prev => ({ ...prev, isConnected: false }));
    }
  }, []);

  const sendWebSocketMessage = useCallback((message: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const handleWebSocketMessage = useCallback((payload: InterviewSocketPayload) => {
    switch (payload.type) {
      case "bootstrap":
        setProgress(prev => ({ ...prev, phase: "connecting" }));
        break;
      case "session_started":
        setProgress(prev => ({
          ...prev,
          sessionId: payload.session_id ?? prev.sessionId,
          questionCount: payload.question_count || 0,
          currentQuestionIndex: payload.current_index || 0,
          timeRemaining: payload.question_remaining_seconds,
          overallTimeRemaining: payload.overall_remaining_seconds || payload.overall_limit_seconds,
          phase: "active",
        }));
        break;
      case "question_changed":
        setProgress(prev => ({
          ...prev,
          currentQuestionIndex: payload.index || 0,
          timeRemaining: payload.question_remaining_seconds,
          overallTimeRemaining: payload.overall_remaining_seconds || payload.overall_limit_seconds,
        }));
        break;
      case "question_skipped":
        setProgress(prev => {
          const updatedSteps = prev.steps.map(step => 
            step.id === `question-${payload.index}` 
              ? { ...step, status: "skipped" as const }
              : step
          );
          return { ...prev, steps: updatedSteps };
        });
        break;
      case "interview_paused":
        setProgress(prev => ({ ...prev, phase: "idle" }));
        break;
      case "interview_resumed":
        setProgress(prev => ({ ...prev, phase: "active", isResuming: true }));
        break;
      case "interview_completed":
        setProgress(prev => ({
          ...prev,
          phase: "done",
          interviewMetadata: {
            ...prev.interviewMetadata,
            overallScore: payload.overall_score,
            proctoringFlagged: payload.proctoring_flagged,
            cheatingProbability: payload.cheating_probability,
          },
        }));
        break;
      case "proctoring_alert":
        setProgress(prev => ({
          ...prev,
          proctoringStatus: "warning",
          flagged: false,
        }));
        break;
      case "proctoring_flagged":
        setProgress(prev => ({
          ...prev,
          proctoringStatus: "flagged",
          flagged: true,
          lockReason: payload.reason ?? null,
        }));
        break;
      case "timer":
        setProgress(prev => ({
          ...prev,
          timeRemaining: payload.question_remaining_seconds,
          overallTimeRemaining: payload.overall_remaining_seconds,
        }));
        break;
      case "error":
        setProgress(prev => ({
          ...prev,
          error: payload.message || "Unknown error",
          phase: "error",
        }));
        break;
      case "session_ended":
        setProgress(prev => ({
          ...prev,
          phase: "done",
          isConnected: false,
        }));
        break;
    }
  }, []);

  // Progress persistence
  const saveProgressToStorage = useCallback(async () => {
    if (progressSaveTimeoutRef.current) {
      clearTimeout(progressSaveTimeoutRef.current);
    }

    setProgress(prev => ({ ...prev, isProgressSaving: true }));
    
    try {
      const snapshot = {
        ...progressRef.current,
        lastSaved: {
          questionIndex: progressRef.current.currentQuestionIndex,
          timestamp: new Date().toISOString(),
          data: progressRef.current,
        },
      };

      // Save to localStorage
      localStorage.setItem(`interview-progress-${interviewToken}`, JSON.stringify(snapshot));
      
      setProgress(prev => ({
        ...prev,
        lastSaved: {
          questionIndex: prev.currentQuestionIndex,
          timestamp: new Date().toISOString(),
          data: prev,
        },
        isProgressSaving: false,
      }));

      logger.info("Interview progress saved successfully");
    } catch (err) {
      logger.error("Failed to save progress:", err);
      setProgress(prev => ({ ...prev, isProgressSaving: false }));
    }
  }, [interviewToken]);

  const loadProgressFromStorage = useCallback((): InterviewProgress | null => {
    try {
      const saved = localStorage.getItem(`interview-progress-${interviewToken}`);
      if (saved) {
        const parsed = JSON.parse(saved) as InterviewProgress;
        setProgress(parsed);
        return parsed;
      }
    } catch (err) {
      logger.error("Failed to load progress from storage:", err);
    }
    return null;
  }, [interviewToken]);

  const clearProgressStorage = useCallback(() => {
    localStorage.removeItem(`interview-progress-${interviewToken}`);
  }, [interviewToken]);

  // Actions
  const resumeInterview = useCallback(async () => {
    setProgress(prev => ({
      ...prev,
      isLoading: true,
      canProceed: true,
    }));
    
    try {
      // Restore progress and reconnect
      loadProgressFromStorage();
      connectWebSocket();
      setProgress(prev => ({ ...prev, isResuming: true }));
      
      sendWebSocketMessage({ type: "resume_interview", session_id: progressRef.current.sessionId });
      
      setProgress(prev => ({
        ...prev,
        isLoading: false,
        phase: "active",
      }));
    } catch (err) {
      logger.error("Failed to resume interview:", err);
      setProgress(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : "Failed to resume interview",
        isLoading: false,
      }));
    }
  }, [connectWebSocket, loadProgressFromStorage, sendWebSocketMessage]);

  const startInterview = useCallback(async () => {
    setProgress(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Check for saved progress
      const saved = loadProgressFromStorage();
      const canRestore = saved && saved.phase === "idle" && 
        saved.steps.some((step) => step.status === "completed") &&
        !saved.interviewMetadata?.proctoringFlagged;

      if (canRestore) {
        setProgress(prev => ({ ...prev, isResuming: true }));
        await resumeInterview();
      } else {
        // Start fresh interview
        connectWebSocket();
        setProgress(prev => ({
          ...prev,
          phase: "active",
          isLoading: false,
          currentStep: "live",
          canProceed: true,
        }));

        // Update steps
        setProgress(prev => ({
          ...prev,
          steps: prev.steps.map((step, index) => 
            index === 0 
              ? { ...step, status: "completed" as const }
              : { ...step, status: "pending" as const }
          ),
        }));
      }
    } catch (err) {
      logger.error("Failed to start interview:", err);
      setProgress(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : "Failed to start interview",
        isLoading: false,
      }));
    }
  }, [connectWebSocket, loadProgressFromStorage, resumeInterview]);

  const pauseInterview = useCallback(async () => {
    try {
      setProgress(prev => ({ ...prev, phase: "idle" }));
      sendWebSocketMessage({ type: "pause_interview", session_id: progressRef.current.sessionId });
      await saveProgressToStorage();
      
      logger.info("Interview paused and progress saved");
    } catch (err) {
      logger.error("Failed to pause interview:", err);
      setProgress(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : "Failed to pause interview",
      }));
    }
  }, [saveProgressToStorage, sendWebSocketMessage]);

  const skipQuestion = useCallback(async (reason: string) => {
    if (!reason.trim()) {
      throw new Error("Skip reason is required");
    }
    
    setProgress(prev => ({ ...prev, isLoading: true }));
    
    try {
      sendWebSocketMessage({
        type: "skip_question",
        reason,
        question_index: progressRef.current.currentQuestionIndex,
        session_id: progressRef.current.sessionId,
      });
      
      setProgress(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        isLoading: false,
      }));
      
      await saveProgressToStorage();
      
      toast.success("Question skipped successfully");
    } catch (err) {
      logger.error("Failed to skip question:", err);
      setProgress(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : "Failed to skip question",
        isLoading: false,
      }));
      throw err;
    }
  }, [saveProgressToStorage, sendWebSocketMessage]);

  const nextStep = useCallback(async () => {
    const currentStepIndex = progressRef.current.steps.findIndex(s => s.id === progressRef.current.currentStep);
    const nextStepIndex = currentStepIndex + 1;
    
    if (nextStepIndex < progressRef.current.steps.length) {
      const nextStep = progressRef.current.steps[nextStepIndex];
      setProgress(prev => ({
        ...prev,
        currentStep: nextStep.id,
        steps: prev.steps.map((step, index) => 
          index === nextStepIndex 
            ? { ...step, status: "active" as const }
            : index < nextStepIndex
            ? { ...step, status: "completed" as const }
            : { ...step, status: "pending" as const }
        ),
      }));
    }
  }, []);

  const completeInterview = useCallback(async () => {
    setProgress(prev => ({ ...prev, isLoading: true }));
    
    try {
      sendWebSocketMessage({
        type: "complete_interview",
        session_id: progressRef.current.sessionId,
      });
      
      setProgress(prev => ({
        ...prev,
        phase: "done",
        steps: prev.steps.map(step => 
          step.id === "live" 
            ? { ...step, status: "completed" as const }
            : step
        ),
        isLoading: false,
      }));
      
      await saveProgressToStorage();
      clearProgressStorage();
      
      toast.success("Interview completed successfully");
    } catch (err) {
      logger.error("Failed to complete interview:", err);
      setProgress(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : "Failed to complete interview",
        isLoading: false,
      }));
      throw err;
    }
  }, [saveProgressToStorage, sendWebSocketMessage, clearProgressStorage]);

  const saveProgress = useCallback(async () => {
    await saveProgressToStorage();
  }, [saveProgressToStorage]);

  const restoreProgress = useCallback(async () => {
    const saved = loadProgressFromStorage();
    if (saved) {
      setProgress(saved);
      setProgress(prev => ({ ...prev, canResume: true }));
      toast.success("Progress restored successfully");
    }
  }, [loadProgressFromStorage]);

  const getProgressSnapshot = useCallback(() => {
    return {
      ...progressRef.current,
      lastSaved: progressRef.current.lastSaved,
    };
  }, []);

  const updateProgress = useCallback((updates: Partial<InterviewProgress>) => {
    setProgress(prev => ({ ...prev, ...updates }));
  }, []);

  const resetInterview = useCallback(() => {
    setProgress(createDefaultProgress());
    disconnectWebSocket();
    clearProgressStorage();
    toast.info("Interview reset");
  }, [disconnectWebSocket, clearProgressStorage]);

  const setLanguage = useCallback((lang: "en" | "hi") => {
    setProgress(prev => ({ ...prev, language: lang }));
    // Send language change to server if connected
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      sendWebSocketMessage({ type: "set_language", language: lang });
    }
  }, [sendWebSocketMessage]);

  // Effects
  useEffect(() => {
    // Initial progress load
    if (!progressRef.current.sessionId) {
      loadProgressFromStorage();
    }

    return () => {
      disconnectWebSocket();
      if (progressSaveTimeoutRef.current) {
        clearTimeout(progressSaveTimeoutRef.current);
      }
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [disconnectWebSocket, loadProgressFromStorage]);

  // Auto-save effect
  useEffect(() => {
    if (progressRef.current.isConnected && progressRef.current.phase === "active") {
      autoSaveIntervalRef.current = setInterval(() => {
        saveProgressToStorage();
      }, 30000); // Save every 30 seconds
    }

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [saveProgressToStorage]);

  // Compute derived state
  const canResume = useCallback(() => {
    const saved = loadProgressFromStorage();
    return Boolean(
      saved &&
        saved.phase === "idle" &&
        saved.steps.some((step) => step.status === "completed") &&
        !saved.interviewMetadata?.proctoringFlagged,
    );
  }, [loadProgressFromStorage]);

  const steps = progress.steps;
  const currentStep = progress.currentStep;
  const phase = progress.phase;
  const isLoading = progress.isLoading;
  const error = progress.error;
  const mediaStream = progress.mediaStream;
  const language = progress.language;
  const canProceed = progress.canProceed;
  const sessionId = progress.sessionId;
  const questionCount = progress.questionCount;
  const currentQuestionIndex = progress.currentQuestionIndex;
  const timeRemaining = progress.timeRemaining;
  const overallTimeRemaining = progress.overallTimeRemaining;
  const isConnected = progress.isConnected;
  const isResuming = progress.isResuming;
  const interviewMetadata = progress.interviewMetadata;
  const proctoringStatus = progress.proctoringStatus;
  const flagged = progress.flagged;
  const lockReason = progress.lockReason;
  const lastSaved = progress.lastSaved;
  const isProgressSaving = progress.isProgressSaving;

  return {
    // State
    currentStep,
    steps,
    phase,
    isLoading,
    error,
    mediaStream,
    language,
    canProceed,
    sessionId,
    questionCount,
    currentQuestionIndex,
    timeRemaining,
    overallTimeRemaining,
    isConnected,
    isResuming,
    canResume: canResume(),
    interviewMetadata,
    proctoringStatus,
    flagged,
    lockReason,
    lastSaved,
    isProgressSaving,

    // Actions
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

    // Utilities
    resetInterview,
    setLanguage,
  };
}