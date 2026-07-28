"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";
import { interviewWsUrl } from "@/lib/config";
import { formatSeconds } from "@/lib/format";
import {
  retryPendingChunks,
  uploadAnswerChunk,
} from "@/lib/interview/answer-upload";
import {
  isInterviewAudioUnlocked,
  speakQuestionFallback,
  unlockInterviewAudio,
} from "@/lib/interview/unlock-audio";
import { useProctoring } from "@/lib/proctoring/use-proctoring";
import type { ProctoringSeverity, ProctoringWsAlert } from "@/lib/proctoring/types";
import {
  ProctoringLockOverlay,
  ProctoringPanel,
} from "@/components/candidate/proctoring-panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Phase = "idle" | "connecting" | "active" | "submitting" | "done" | "error";

export type InterviewLanguage = "en" | "hi";

interface InterviewEvent {
  type: string;
  prompt?: string;
  section?: string;
  index?: number;
  question_id?: string;
  question_remaining_seconds?: number;
  overall_remaining_seconds?: number;
  message?: string;
  text?: string;
  passed?: boolean;
  total_score?: number;
  session_id?: string;
  resumed?: boolean;
  question_count?: number;
  current_index?: number;
  overall_limit_seconds?: number;
  first_question?: {
    index?: number;
    section?: string;
    prompt?: string;
    question_id?: string;
  };
  audio_base64?: string;
  audio_url?: string;
  mime_type?: string;
  forced?: boolean;
  reason?: string;
  grace_seconds?: number;
  skipped?: boolean;
  paused?: boolean;
  status?: string;
}

export function InterviewStructured({
  interviewToken,
  language = "en",
  mediaStream,
  onComplete,
}: {
  interviewToken: string;
  language?: InterviewLanguage;
  mediaStream: MediaStream;
  onComplete?: (result: { passed?: boolean; totalScore?: number; status?: string; reason?: string }) => void;
}) {
  const socket = useRef<WebSocket | null>(null);
  const uploadPromises = useRef<Promise<boolean>[]>([]);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const ttsAudio = useRef<HTMLAudioElement | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [recording, setRecording] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [questionMeta, setQuestionMeta] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [qTimer, setQTimer] = useState("&mdash;");
  const [oTimer, setOTimer] = useState("&mdash;");
  const [error, setError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [resumed, setResumed] = useState(false);
  const [lockReason, setLockReason] = useState<string | null>(null);
  const [ttsBlocked, setTtsBlocked] = useState(false);
  const [lastTts, setLastTts] = useState<{ base64: string; mime: string } | null>(null);
  const [skipping, setSkipping] = useState(false);
  const [pendingQuestionText, setPendingQuestionText] = useState("");
  const lastPromptRef = useRef("");
  const lastAudioUrlRef = useRef<string | null>(null);
  const lastSpokenQuestionIdRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const chunkIndexRef = useRef(0);
  const sessionEstablishedRef = useRef(false);
  const completedRef = useRef(false);
  const recordingRef = useRef(false);
  const phaseRef = useRef<Phase>("idle");
  const questionIndexRef = useRef(0);
  const recordingIndexRef = useRef(0);
  const transcribeWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Server rejected the session (expired link, already completed, …) —
  // reconnecting would just loop, so surface the error instead.
  const fatalErrorRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const [connectAttempt, setConnectAttempt] = useState(0);
  const [sessionReady, setSessionReady] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [lastSaved, setLastSaved] = useState<{ index: number; text: string } | null>(null);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    recordingRef.current = recording;
  }, [recording]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    questionIndexRef.current = questionIndex;
  }, [questionIndex]);

  const sendWsMessage = useCallback((payload: Record<string, unknown>) => {
    const ws = socket.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify(payload));
  }, []);

  const sendProctoringEvent = useCallback(
    (eventType: string, severity: ProctoringSeverity, detail: string) => {
      sendWsMessage({
        type: "proctoring_event",
        event_type: eventType,
        severity,
        detail,
        question_index: questionIndex,
      });
    },
    [questionIndex, sendWsMessage]
  );

  const sendProctoringSnapshot = useCallback(
    (base64: string) => {
      sendWsMessage({
        type: "proctoring_snapshot",
        image_base64: base64,
        mime_type: "image/jpeg",
        question_index: questionIndex,
      });
    },
    [questionIndex, sendWsMessage]
  );

  const proctoringPreview =
    phase === "connecting" || phase === "active" || phase === "submitting";
  const proctoringActive = phase === "active" || phase === "submitting";

  const {
    videoRef,
    status: proctoringStatus,
    blocked,
    attachStream,
    applyServerCounts,
    canProceed,
  } = useProctoring({
    active: proctoringActive,
    preview: proctoringPreview,
    questionIndex,
    sendEvent: sendProctoringEvent,
    sendSnapshot: sendProctoringSnapshot,
    onFlagged: (reason) => setLockReason(reason),
    // Show the candidate an immediate banner for every locally detected
    // violation — no server round-trip required.
    onViolation: () => {
      // Intentionally suppressed to avoid distracting honest candidates
    },
  });

  useEffect(() => {
    attachStream(mediaStream);
  }, [attachStream, mediaStream]);

  const cleanupMedia = useCallback(() => {
    mediaRecorder.current?.stop();
    mediaRecorder.current = null;
    if (ttsAudio.current) {
      ttsAudio.current.pause();
      ttsAudio.current = null;
    }
  }, []);

  const closeSocket = useCallback(() => {
    socket.current?.close();
    socket.current = null;
  }, []);

  const cleanup = useCallback(() => {
    cleanupMedia();
    closeSocket();
  }, [cleanupMedia, closeSocket]);

  function playTtsUrl(url: string, fallbackText?: string) {
    if (!url) return;
    lastAudioUrlRef.current = url;
    const audio = new Audio(url);
    ttsAudio.current = audio;
    audio.onerror = () => {
      setTtsBlocked(true);
      if (fallbackText) speakQuestionFallback(fallbackText, language);
    };
    void audio
      .play()
      .then(() => setTtsBlocked(false))
      .catch(() => {
        setTtsBlocked(true);
        if (fallbackText) speakQuestionFallback(fallbackText, language);
      });
  }

  function playTts(base64: string, mime: string, fallbackText?: string) {
    if (!base64) return;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: mime });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    setLastTts({ base64, mime });
    ttsAudio.current = audio;
    audio.onended = () => URL.revokeObjectURL(url);
    void audio
      .play()
      .then(() => setTtsBlocked(false))
      .catch(() => {
        setTtsBlocked(true);
        if (fallbackText) speakQuestionFallback(fallbackText, language);
      });
  }

  function replayQuestionAudio() {
    unlockInterviewAudio();
    if (lastAudioUrlRef.current) {
      playTtsUrl(lastAudioUrlRef.current, questionText || pendingQuestionText);
      return;
    }
    if (lastTts) {
      playTts(lastTts.base64, lastTts.mime, questionText || pendingQuestionText);
      return;
    }
    const text = questionText || pendingQuestionText;
    if (text) speakQuestionFallback(text, language);
  }

  function clearSubmitWatchdog() {
    if (transcribeWatchdogRef.current) {
      clearTimeout(transcribeWatchdogRef.current);
      transcribeWatchdogRef.current = null;
    }
  }

  function armSubmitWatchdog() {
    clearSubmitWatchdog();
    // The server acknowledges uploads instantly, so this only protects against
    // a hung connection during the upload itself.
    transcribeWatchdogRef.current = setTimeout(() => {
      setPhase("active");
      setError(
        "Your answer upload did not get a response. Check your connection, then use Skip to continue."
      );
    }, 20000);
  }

  async function startRecording() {
    if (blocked || timeUp) {
      if (blocked) setError("Proctoring check failed. Resolve the issue shown above to continue.");
      return;
    }
    const audioTrack = mediaStream.getAudioTracks()[0];
    if (!audioTrack) {
      setError("Microphone unavailable");
      return;
    }
    const stream = new MediaStream([audioTrack]);
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
    } catch (err) {
      console.warn("Failed to initialize MediaRecorder with audio/webm:", err);
      try {
        recorder = new MediaRecorder(stream);
      } catch (fallbackErr) {
        console.error("Failed to initialize standard MediaRecorder:", fallbackErr);
        setError("Your browser does not support audio recording. Please try a modern browser.");
        return;
      }
    }
    chunks.current = [];
    chunkIndexRef.current = 0;
    uploadPromises.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size === 0) return;
      chunks.current.push(e.data);
      // Best-effort durable upload. Submission always falls back to the local
      // blob over WebSocket if any chunk upload fails (CORS/network/storage).
      const sessionId = sessionIdRef.current;
      if (!sessionId) return;
      const chunkIdx = chunkIndexRef.current++;
      const p = uploadAnswerChunk(
        interviewToken,
        sessionId,
        recordingIndexRef.current,
        chunkIdx,
        e.data
      ).then(
        () => true,
        (err) => {
          console.warn("Chunk upload failed", err);
          return false;
        }
      );
      uploadPromises.current.push(p);
    };
    recorder.start(3000);
    mediaRecorder.current = recorder;
    recordingIndexRef.current = questionIndexRef.current;
    setRecording(true);
    setError(null);
  }

  async function stopRecording() {
    const recorder = mediaRecorder.current;
    if (!recorder || recorder.state === "inactive") return;

    // Instant UI feedback — before any encoding work.
    setRecording(false);
    setPhase("submitting");

    await new Promise<void>((resolve) => {
      recorder.onstop = () => {
        // Allow the final dataavailable event to fire before counting chunks.
        window.setTimeout(resolve, 150);
      };
      recorder.stop();
    });
    mediaRecorder.current = null;

    const uploadResults = await Promise.all(uploadPromises.current);
    uploadPromises.current = [];
    const chunkCount = chunkIndexRef.current;
    const sessionId = sessionIdRef.current;
    const uploadsOk =
      Boolean(sessionId) &&
      chunkCount > 0 &&
      uploadResults.length === chunkCount &&
      uploadResults.every(Boolean);

    armSubmitWatchdog();

    if (uploadsOk) {
      // Chunks landed in storage — tell the server to assemble.
      sendWsMessage({
        type: "submit_answer",
        question_index: recordingIndexRef.current,
        chunk_count: chunkCount,
        mime_type: "audio/webm",
      });
      return;
    }

    // Reliable path: send the local recording over the WebSocket.
    // Used when chunk uploads failed, session id was missing, or no chunks fired.
    const blob = new Blob(chunks.current, { type: "audio/webm" });
    chunks.current = [];
    if (blob.size === 0) {
      setError("No audio was captured. Please record again or skip.");
      setPhase("active");
      return;
    }
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.slice(result.indexOf(",") + 1));
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });

    sendWsMessage({
      type: "submit_answer",
      audio_base64: base64,
      mime_type: "audio/webm",
      question_index: recordingIndexRef.current,
    });
  }

  function sendNextQuestion() {
    if (skipping) return;
    setSkipping(true);
    sendWsMessage({ type: "next_question", question_index: questionIndexRef.current });
  }

  function handleProctoringWs(payload: ProctoringWsAlert) {
    if (payload.type === "proctoring_alert") {
      applyServerCounts(payload.warning_count ?? 0, payload.critical_count ?? 0, payload.detail);
    }
    if (payload.type === "proctoring_flagged") {
      applyServerCounts(payload.warnings ?? 0, payload.critical ?? 0, payload.reason);
      setLockReason(payload.reason ?? "Session flagged for proctoring violations");
    }
  }

  function applyQuestion(payload: {
    index?: number;
    section?: string;
    prompt?: string;
    question_id?: string;
    audio_base64?: string;
    audio_url?: string;
    mime_type?: string;
  }) {
    clearSubmitWatchdog();
    setSkipping(false);
    if (ttsAudio.current) {
      ttsAudio.current.pause();
      ttsAudio.current = null;
    }
    lastAudioUrlRef.current = "";
    setLastTts(null);
    const idx = payload.index ?? 0;
    questionIndexRef.current = idx;
    setQuestionIndex(idx);
    setQuestionMeta(
      `Question ${idx + 1}${payload.section ? ` · ${payload.section}` : ""}`
    );
    setQuestionText(payload.prompt ?? "");
    setPendingQuestionText(payload.prompt ?? "");
    lastPromptRef.current = payload.prompt ?? "";
    setTimeUp(false);
    setError(null);
    setPhase("active");

    const qid = payload.question_id;
    const shouldSpeak = Boolean(qid && lastSpokenQuestionIdRef.current !== qid);
    if (shouldSpeak && qid) {
      lastSpokenQuestionIdRef.current = qid;
      if (payload.audio_url) {
        playTtsUrl(payload.audio_url, payload.prompt);
      } else if (payload.audio_base64 && payload.mime_type) {
        playTts(payload.audio_base64, payload.mime_type, payload.prompt);
      } else if (payload.prompt) {
        speakQuestionFallback(payload.prompt, language);
      }
    }
  }

  async function connect() {
    reconnectAttemptsRef.current = 0;
    fatalErrorRef.current = false;
    setConnectAttempt((attempt) => attempt + 1);
  }

  useEffect(() => {
    let disposed = false;
    sessionEstablishedRef.current = false;
    setSessionReady(false);
    setPhase("connecting");
    setError(null);
    setLockReason(null);
    setQuestionText("");
    setQuestionMeta("");
    setQTimer("&mdash;");
    setOTimer("&mdash;");
    completedRef.current = false;

    if (!isInterviewAudioUnlocked()) unlockInterviewAudio();

    const ws = new WebSocket(interviewWsUrl(interviewToken, language));
    socket.current = ws;
    
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 15000);

    ws.onmessage = (event) => {
      if (disposed) return;
      let payload: InterviewEvent;
      try {
        payload = JSON.parse(event.data) as InterviewEvent;
      } catch (err) {
        console.error("Failed to parse WebSocket message:", event.data, err);
        return;
      }
      switch (payload.type) {
        case "bootstrap":
          setPhase("connecting");
          break;
        case "session_started": {
          const started = payload as InterviewEvent;
          sessionEstablishedRef.current = true;
          reconnectAttemptsRef.current = 0;
          setReconnecting(false);
          setSessionReady(true);
          sessionIdRef.current = started.session_id ?? null;
          void retryPendingChunks(interviewToken);
          setQuestionCount(started.question_count ?? 0);
          questionIndexRef.current = started.current_index ?? 0;
          setQuestionIndex(started.current_index ?? 0);
          setResumed(Boolean(started.resumed));
          if (started.question_remaining_seconds != null) {
            setQTimer(formatSeconds(started.question_remaining_seconds));
          }
          if (started.overall_remaining_seconds != null) {
            setOTimer(formatSeconds(started.overall_remaining_seconds));
          } else if (started.overall_limit_seconds != null) {
            setOTimer(formatSeconds(started.overall_limit_seconds));
          }
          // Question text + audio arrive via question_changed only (prevents double-play).
          break;
        }
        case "question_changed":
          applyQuestion(payload);
          break;
        case "timer":
          // Freeze the display while an answer is in flight — the server has
          // already ended this question, so a ticking clock is just confusing.
          if (phaseRef.current === "submitting") break;
          setQTimer(formatSeconds(payload.question_remaining_seconds ?? 0));
          setOTimer(formatSeconds(payload.overall_remaining_seconds ?? 0));
          break;
        case "question_timeout":
          if (payload.reason === "overall") break;
          setTimeUp(true);
          if (recordingRef.current) {
            // Time's up mid-recording: stop and upload. The server accepts the
            // answer and advances immediately.
            void stopRecording();
          } else {
            // Nothing being recorded — acknowledge immediately so the server
            // advances without burning the grace window. Idempotent by index.
            sendNextQuestion();
          }
          break;
        case "answer_received":
          // Upload acknowledged; the next question follows immediately.
          clearSubmitWatchdog();
          break;
        case "answer_error":
          clearSubmitWatchdog();
          setPhase("active");
          setError(payload.message || "Answer upload failed. Please record again.");
          break;
        case "answer_saved":
          // Background transcription finished (usually for a previous question).
          clearSubmitWatchdog();
          if (payload.skipped) break;
          setLastSaved({
            index: payload.index ?? 0,
            text: payload.text ?? "",
          });
          break;
        case "session_ended":
          // Scoring happens server-side; candidates never see results.
          clearSubmitWatchdog();
          setSessionReady(false);
          setTimeUp(false);
          setPhase("done");
          if (!completedRef.current) {
            completedRef.current = true;
            onCompleteRef.current?.({ status: payload.status });
          }
          cleanup();
          break;
        case "scoring_started":
        case "scoring_complete":
        case "scoring_error":
          // Internal events — results are for the hiring team only.
          break;
        case "proctoring_alert":
        case "proctoring_flagged":
          handleProctoringWs(payload as ProctoringWsAlert);
          break;
        case "error":
          fatalErrorRef.current = true;
          if (payload.message && payload.message.startsWith("This interview was terminated due to a proctoring violation")) {
            clearSubmitWatchdog();
            setSessionReady(false);
            setTimeUp(false);
            setPhase("done");
            
            // Try to extract reason from the message: "This interview was terminated due to a proctoring violation: {reason}"
            let reason = payload.reason;
            if (!reason && payload.message.includes(": ")) {
              reason = payload.message.split(": ", 2)[1];
            }

            if (!completedRef.current) {
              completedRef.current = true;
              onCompleteRef.current?.({ status: "flagged", reason: reason });
            }
          } else {
            setError(payload.message ?? "Connection error");
            setPhase("error");
          }
          cleanup();
          break;
      }
    };

    ws.onerror = () => {
      // onclose always follows onerror; reconnection is handled there.
    };

    ws.onclose = () => {
      if (disposed) return;
      socket.current = null;
      if (completedRef.current) return;

      // A server-side rejection (bad token, session over) is final — show the
      // message; reconnecting would only loop.
      if (fatalErrorRef.current) {
        setSessionReady(false);
        setPhase("error");
        return;
      }

      // Auto-reconnect with backoff — the session is resumable server-side.
      if (reconnectAttemptsRef.current < 5) {
        const attempt = reconnectAttemptsRef.current++;
        const delay = Math.min(500 * 2 ** attempt, 8000);
        setReconnecting(true);
        setSessionReady(false);
        setPhase("connecting");
        reconnectTimerRef.current = setTimeout(() => {
          setConnectAttempt((a) => a + 1);
        }, delay);
        return;
      }

      setSessionReady(false);
      setError(
        sessionEstablishedRef.current
          ? "Connection lost. Tap Retry to reconnect and continue your interview."
          : "Could not reach the interview server. Check that the API is running, then retry."
      );
      setPhase("error");
    };

    return () => {
      disposed = true;
      clearInterval(pingInterval);
      clearSubmitWatchdog();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      ws.close();
      if (socket.current === ws) {
        socket.current = null;
      }
    };
    // connectAttempt triggers manual retries; interviewToken/language trigger fresh sessions.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handlers use refs for latest state
  }, [interviewToken, language, connectAttempt]);

  const isLastQuestion = questionCount > 0 && questionIndex >= questionCount - 1;

  useEffect(() => {
    if (canProceed && lockReason && !blocked) {
      setLockReason(null);
    }
  }, [canProceed, lockReason, blocked]);

  const showLock = blocked || Boolean(lockReason);
  const showLiveUi =
    sessionReady || phase === "active" || phase === "submitting" || phase === "connecting";
  const showControls = sessionReady && (phase === "active" || phase === "submitting");

  return (
    <>
      {showLiveUi ? (
        <ProctoringPanel
          videoRef={videoRef}
          status={proctoringStatus}
          blocked={blocked}
          variant="floating"
        />
      ) : null}

      {showLock ? <ProctoringLockOverlay reason={lockReason!} /> : null}

      <div className="mx-auto max-w-3xl space-y-6">
        {sessionReady ? (
          <>
            <div className="mb-6 flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-xs text-slate-600">
              <PhosphorIcon name="ShieldAlert" className="h-4 w-4 shrink-0" />
              Proctoring active. Face, objects, and screen activity are monitored continuously.
            </div>

            {resumed ? (
              <p className="mb-4 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-slate-700" role="status">
                Welcome back. Continuing from question {new Intl.NumberFormat().format(questionIndex + 1)}.
              </p>
            ) : null}

            <div className="mb-5 grid grid-cols-2 divide-x divide-stone-200 rounded-2xl border border-stone-200 bg-white py-4 text-sm">
              <div className="px-5">
                <p className="text-xs text-slate-500">Question time</p>
                <p className="mt-1 font-mono text-xl font-semibold text-slate-900">{qTimer}</p>
              </div>
              <div className="px-5">
                <p className="text-xs text-slate-500">Overall time</p>
                <p className="mt-1 font-mono text-xl font-semibold text-slate-900">{oTimer}</p>
              </div>
            </div>
          </>
        ) : null}

        {questionText ? (
          <section className="mb-2 rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,15,15,0.06)] sm:p-8" aria-labelledby="current-question">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#F97316]">{questionMeta}</p>
              <PhosphorIcon name="Volume2" />
            </div>
            <p id="current-question" className="mt-4 text-lg leading-8 text-slate-900">{questionText}</p>
          </section>
        ) : null}

        {ttsBlocked || questionText ? (
          <div className="flex items-center justify-center">
            <Button className="h-11 rounded-full px-5" variant="outline" onClick={replayQuestionAudio}>
              <PhosphorIcon name="Volume2" className="mr-2 h-4 w-4" />
              {ttsBlocked ? "Play question audio" : "Replay question"}
            </Button>
          </div>
        ) : null}

        {timeUp && phase !== "done" ? (
          <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
            Time is up for this question. Saving your answer and moving on…
          </p>
        ) : null}

        {lastSaved ? (
          <p className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800" role="status">
            Answer to question {new Intl.NumberFormat().format(lastSaved.index + 1)} saved
          </p>
        ) : null}

        {error ? (
          <p className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</p>
        ) : null}

        <div className="flex flex-col items-center gap-4 pt-2">
          {phase === "connecting" ? (
            <div className="flex w-full flex-col items-center gap-4 rounded-3xl border border-stone-200 bg-white px-6 py-12 shadow-[0_12px_40px_rgba(15,15,15,0.06)]">
              <PhosphorIcon name="Loader2" className="h-8 w-8 animate-spin text-[#F97316] motion-reduce:animate-none" />
              <p className="text-base font-medium text-foreground">
                {reconnecting ? "Reconnecting to your interview…" : "Preparing your interview…"}
              </p>
              <p className="text-sm text-muted-foreground">
                {reconnecting
                  ? "Your progress is saved."
                  : "Setting up your questions and the interviewer's voice."}
              </p>
            </div>
          ) : null}

          {phase === "error" ? (
            <Button className="h-11 rounded-full bg-[#F97316] px-6 text-white hover:bg-[#EA6B2D]" onClick={() => void connect()}>
              Retry connection
            </Button>
          ) : null}

          {phase === "done" ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <PhosphorIcon name="Loader2" className="h-4 w-4 animate-spin motion-reduce:animate-none" />
              Wrapping up your interview…
            </p>
          ) : null}

          {showControls ? (
            <>
              {!recording ? (
                <Button
                  className="h-11 rounded-full bg-[#F97316] px-6 font-semibold text-white hover:bg-[#EA6B2D]"
                  disabled={phase === "submitting" || blocked || timeUp}
                  onClick={() => void startRecording()}
                >
                  <PhosphorIcon name="Mic" className="mr-2 h-4 w-4" />
                  Record answer
                </Button>
              ) : (
                <Button className="h-11 rounded-full px-6" variant="destructive" onClick={() => void stopRecording()}>
                  <PhosphorIcon name="Square" className="mr-2 h-4 w-4" />
                  Stop and submit
                </Button>
              )}

              {phase === "submitting" ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <PhosphorIcon name="Loader2" className="h-4 w-4 animate-spin motion-reduce:animate-none" />
                  Submitting your answer…
                </p>
              ) : null}

              <Button
                className="h-11 rounded-full px-6"
                variant="outline"
                disabled={recording || phase === "submitting" || blocked || skipping}
                onClick={sendNextQuestion}
              >
                {skipping ? (
                  <PhosphorIcon name="Loader2" className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />
                ) : (
                  <PhosphorIcon name="ArrowRight" className="mr-2 h-4 w-4" />
                )}
                {skipping
                  ? "Moving on…"
                  : isLastQuestion
                    ? "Finish interview"
                    : "Skip question"}
              </Button>

              {!canProceed && !blocked ? (
                <p className="text-xs text-amber-700">
                  Camera preview is in the bottom-right. Allow webcam access if you do not see yourself.
                </p>
              ) : null}
            </>
          ) : null}
        </div>

        <div
          className={cn(
            "mx-auto mt-6 h-2 w-32 rounded-full transition-colors",
            recording ? "animate-pulse bg-red-500 motion-reduce:animate-none" : "bg-stone-200"
          )}
        />
      </div>
    </>
  );
}
