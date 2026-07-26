"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PROCTORING } from "@/lib/proctoring/constants";
import {
  detectFaceCount,
  detectProhibitedObjects,
  warmUpFaceDetector,
} from "@/lib/proctoring/face-detector";
import type { ProctoringSeverity, ProctoringStatus } from "@/lib/proctoring/types";

type FaceDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ boundingBox: DOMRectReadOnly }>>;
};

declare global {
  interface Window {
    FaceDetector?: new (options?: { maxDetectedFaces?: number }) => FaceDetectorLike;
  }
}

export function captureVideoFrame(
  video: HTMLVideoElement,
  quality = PROCTORING.snapshotQuality
): string | null {
  if (video.videoWidth === 0 || video.videoHeight === 0) return null;
  const scale = Math.min(1, PROCTORING.snapshotMaxWidth / video.videoWidth);
  const w = Math.round(video.videoWidth * scale);
  const h = Math.round(video.videoHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, w, h);
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  return dataUrl.split(",")[1] ?? null;
}

async function detectFaces(
  video: HTMLVideoElement,
  detector: FaceDetectorLike | null
): Promise<number> {
  // Primary: MediaPipe BlazeFace — accurate, works in all modern browsers.
  const mpCount = await detectFaceCount(video);
  if (mpCount !== null) return mpCount;

  // Secondary: native FaceDetector API (Chrome behind a flag).
  if (detector) {
    try {
      const faces = await detector.detect(video);
      return faces.length;
    } catch {
      return estimateFacePresence(video);
    }
  }
  // Last resort: brightness heuristic (camera covered / off).
  return estimateFacePresence(video);
}

/** Brightness heuristic when FaceDetector API is unavailable */
function estimateFacePresence(video: HTMLVideoElement): number {
  if (video.videoWidth === 0) return 0;
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 120;
  const ctx = canvas.getContext("2d");
  if (!ctx) return 0;
  ctx.drawImage(video, 0, 0, 160, 120);
  const data = ctx.getImageData(40, 20, 80, 80).data;
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    sum += data[i] + data[i + 1] + data[i + 2];
  }
  const avg = sum / (data.length / 4) / 3;
  if (avg < 25) return 0;
  return 1;
}

interface UseProctoringOptions {
  active: boolean;
  /** Attach camera preview without starting violation monitoring / WS events */
  preview?: boolean;
  questionIndex: number;
  sendEvent: (
    eventType: string,
    severity: ProctoringSeverity,
    detail: string
  ) => void;
  sendSnapshot: (base64: string) => void;
  onFlagged?: (reason: string) => void;
  /** Fires for every locally detected violation (instant, no server round-trip) */
  onViolation?: (severity: ProctoringSeverity, detail: string) => void;
}

export function useProctoring({
  active,
  preview = false,
  questionIndex,
  sendEvent,
  sendSnapshot,
  onFlagged,
  onViolation,
}: UseProctoringOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceDetectorRef = useRef<FaceDetectorLike | null>(null);
  const noFaceSinceRef = useRef<number | null>(null);
  /** 0 = none reported this episode, 1 = warning sent, 2 = critical sent */
  const noFaceEscalationRef = useRef(0);
  const multiFaceLastReportRef = useRef(0);
  const cameraLostLastReportRef = useRef(0);
  const objectSightingsRef = useRef<Record<string, number>>({});
  const objectLastReportRef = useRef<Record<string, number>>({});
  const tabHiddenSinceRef = useRef<number | null>(null);

  const [status, setStatus] = useState<ProctoringStatus>({
    facePresent: false,
    faceCount: 0,
    fullscreen: false,
    tabVisible: true,
    cameraLive: false,
    warningCount: 0,
    criticalCount: 0,
    flagged: false,
    lastAlert: null,
  });
  const [blocked, setBlocked] = useState(false);

  const attachStream = useCallback((stream: MediaStream) => {
    streamRef.current = stream;
    const video = videoRef.current;
    if (video) {
      video.srcObject = stream;
      void video.play().catch(() => undefined);
    }
  }, []);

  // Re-attach when the preview panel mounts (often after the stream is first set).
  useEffect(() => {
    if ((!active && !preview) || !streamRef.current) return;
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = streamRef.current;
    void video.play().catch(() => undefined);
  }, [active, preview]);

  // Mark camera live during preview before full monitoring starts.
  useEffect(() => {
    if (!preview || active) return;
    const stream = streamRef.current;
    const track = stream?.getVideoTracks()[0];
    if (track?.readyState === "live") {
      setStatus((s) => ({ ...s, cameraLive: true }));
    }
    const onUnmute = () => setStatus((s) => ({ ...s, cameraLive: true }));
    track?.addEventListener("unmute", onUnmute);
    return () => track?.removeEventListener("unmute", onUnmute);
  }, [preview, active]);

  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      /* user gesture may be required */
    }
  }, []);

  const reportViolation = useCallback(
    (eventType: string, severity: ProctoringSeverity, detail: string) => {
      sendEvent(eventType, severity, detail);
      onViolation?.(severity, detail);
      setStatus((prev) => {
        const next = {
          ...prev,
          lastAlert: detail,
          warningCount:
            severity === "warning" ? prev.warningCount + 1 : prev.warningCount,
          criticalCount:
            severity === "critical" ? prev.criticalCount + 1 : prev.criticalCount,
        };
        if (
          next.criticalCount >= PROCTORING.maxCritical ||
          next.warningCount >= PROCTORING.maxWarnings
        ) {
          next.flagged = true;
          setBlocked(true);
          onFlagged?.(detail);
        }
        return next;
      });
    },
    [sendEvent, onFlagged, onViolation]
  );

  const applyServerCounts = useCallback(
    (warnings: number, critical: number, detail?: string) => {
      setStatus((prev) => ({
        ...prev,
        warningCount: Math.max(prev.warningCount, warnings),
        criticalCount: Math.max(prev.criticalCount, critical),
        lastAlert: detail ?? prev.lastAlert,
        flagged: critical >= PROCTORING.maxCritical || warnings >= PROCTORING.maxWarnings,
      }));
      if (critical >= PROCTORING.maxCritical || warnings >= PROCTORING.maxWarnings) {
        setBlocked(true);
        onFlagged?.(detail ?? "Proctoring violations detected");
      }
    },
    [onFlagged]
  );

  useEffect(() => {
    warmUpFaceDetector();
    if (typeof window !== "undefined" && window.FaceDetector) {
      try {
        faceDetectorRef.current = new window.FaceDetector({ maxDetectedFaces: 3 });
      } catch {
        faceDetectorRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    if (!active) return;

    void enterFullscreen();
    sendEvent("session_start", "info", "Proctoring session started");

    const screenExt = (window.screen as Screen & { isExtended?: boolean }).isExtended;
    if (screenExt) {
      reportViolation(
        "extended_display",
        "info",
        "Multiple monitors detected"
      );
    }

    const onVisibility = () => {
      const hidden = document.hidden;
      setStatus((s) => ({ ...s, tabVisible: !hidden }));
      if (hidden) {
        tabHiddenSinceRef.current = Date.now();
      } else if (tabHiddenSinceRef.current) {
        const duration = Date.now() - tabHiddenSinceRef.current;
        tabHiddenSinceRef.current = null;
        if (duration >= PROCTORING.tabHiddenGraceMs) {
          reportViolation(
            "tab_hidden",
            "warning",
            `Tab was hidden for ${Math.round(duration / 1000)}s`
          );
        }
      }
    };

    const onBlur = () => {
      reportViolation("window_blur", "warning", "Interview window lost focus");
    };

    const onFullscreen = () => {
      const fs = Boolean(document.fullscreenElement);
      setStatus((s) => ({ ...s, fullscreen: fs }));
      if (!fs) {
        reportViolation(
          "fullscreen_exit",
          "critical",
          "Exited fullscreen mode during interview"
        );
      }
    };

    const blockClipboard = (e: ClipboardEvent) => {
      e.preventDefault();
      reportViolation("clipboard_attempt", "warning", "Copy/paste blocked during interview");
    };

    const blockKeys = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        const k = e.key.toLowerCase();
        if (["c", "v", "x", "a", "p", "s", "t", "w", "n"].includes(k)) {
          e.preventDefault();
          reportViolation("clipboard_attempt", "warning", `Blocked shortcut Ctrl/Cmd+${k.toUpperCase()}`);
        }
      }
      if (e.key === "F12" || (e.ctrlKey && e.shiftKey && e.key === "I")) {
        e.preventDefault();
      }
    };

    const blockContext = (e: MouseEvent) => e.preventDefault();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFullscreen);
    document.addEventListener("copy", blockClipboard);
    document.addEventListener("cut", blockClipboard);
    document.addEventListener("paste", blockClipboard);
    document.addEventListener("keydown", blockKeys);
    document.addEventListener("contextmenu", blockContext);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFullscreen);
      document.removeEventListener("copy", blockClipboard);
      document.removeEventListener("cut", blockClipboard);
      document.removeEventListener("paste", blockClipboard);
      document.removeEventListener("keydown", blockKeys);
      document.removeEventListener("contextmenu", blockContext);
    };
  }, [active, enterFullscreen, reportViolation, sendEvent]);

  useEffect(() => {
    if (!active) return;
    const video = videoRef.current;
    if (!video) return;

    const faceInterval = setInterval(async () => {
      const stream = streamRef.current;
      const track = stream?.getVideoTracks()[0];
      if (!track || track.readyState !== "live") {
        setStatus((s) => ({ ...s, cameraLive: false, facePresent: false }));
        if (Date.now() - cameraLostLastReportRef.current > 15_000) {
          cameraLostLastReportRef.current = Date.now();
          reportViolation("camera_lost", "critical", "Webcam disconnected or blocked");
        }
        return;
      }

      setStatus((s) => ({ ...s, cameraLive: true, fullscreen: Boolean(document.fullscreenElement) }));

      const faceCount = await detectFaces(video, faceDetectorRef.current);
      const present = faceCount === 1;
      setStatus((s) => ({ ...s, facePresent: present, faceCount: Math.max(faceCount, 0) }));

      if (faceCount > 1) {
        noFaceSinceRef.current = null;
        noFaceEscalationRef.current = 0;
        // Report once per 15s while multiple faces stay in view &mdash; not every tick.
                if (Date.now() - multiFaceLastReportRef.current > 15_000) {
                  multiFaceLastReportRef.current = Date.now();
                  reportViolation(
                    "multiple_faces",
                    "critical",
                    `${faceCount} faces detected &mdash; only you should be visible`
                  );
                }
        return;
      }

      if (!present) {
        if (noFaceSinceRef.current === null) {
          noFaceSinceRef.current = Date.now();
        }
        const hiddenFor = Date.now() - noFaceSinceRef.current;
        // Escalate once per episode: warning after the grace period, then a
        // critical violation (flagged server-side) if the face stays hidden.
        if (hiddenFor >= PROCTORING.noFaceGraceMs && noFaceEscalationRef.current === 0) {
          noFaceEscalationRef.current = 1;
          reportViolation(
                      "no_face",
                      "warning",
                      "Face not visible &mdash; stay centered in front of the camera"
                    );
        }
      } else {
        if (noFaceSinceRef.current !== null && noFaceEscalationRef.current > 0) {
          sendEvent("face_returned", "info", "Face visible again");
        }
        noFaceSinceRef.current = null;
        noFaceEscalationRef.current = 0;
      }

      // Prohibited-object scan (phones, notes). Requires 2 consecutive
      // sightings to avoid one-frame false positives, then reports with a
      // per-object 20s cooldown.
      const objects = await detectProhibitedObjects(video);
      if (objects !== null) {
        const seen = new Set(objects);
        for (const name of Object.keys(objectSightingsRef.current)) {
          if (!seen.has(name)) delete objectSightingsRef.current[name];
        }
        for (const name of seen) {
          const count = (objectSightingsRef.current[name] ?? 0) + 1;
          objectSightingsRef.current[name] = count;
          const last = objectLastReportRef.current[name] ?? 0;
          if (count >= 1 && Date.now() - last > 20_000) {
            objectLastReportRef.current[name] = Date.now();
            const isPhone = name === "cell phone";
            reportViolation(
              isPhone ? "phone_detected" : "prohibited_object",
              isPhone ? "critical" : "warning",
              isPhone
                              ? "Mobile phone detected in view &mdash; put it away immediately"
                              : `Prohibited item in view: ${name} &mdash; remove it from your desk`
            );
          }
        }
      }
    }, PROCTORING.faceCheckIntervalMs);

    // Take an immediate snapshot, then schedule periodically
    const initialFrame = captureVideoFrame(videoRef.current!);
    if (initialFrame) sendSnapshot(initialFrame);

    const snapshotInterval = setInterval(() => {
      const frame = captureVideoFrame(videoRef.current!);
      if (frame) sendSnapshot(frame);
    }, PROCTORING.snapshotIntervalMs);

    return () => {
      clearInterval(faceInterval);
      clearInterval(snapshotInterval);
    };
  }, [active, questionIndex, reportViolation, sendEvent, sendSnapshot]);

  return {
    videoRef,
    status,
    blocked,
    attachStream,
    enterFullscreen,
    applyServerCounts,
    canProceed: status.cameraLive && !blocked,
  };
}

/** Setup-only face verification before interview starts */
export function useProctoringSetupCheck(stream: MediaStream | null) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [faceStreak, setFaceStreak] = useState(0);
  const [ready, setReady] = useState(false);
  const detectorRef = useRef<FaceDetectorLike | null>(null);

  useEffect(() => {
    warmUpFaceDetector();
    if (typeof window !== "undefined" && window.FaceDetector) {
      try {
        detectorRef.current = new window.FaceDetector({ maxDetectedFaces: 2 });
      } catch {
        detectorRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;
    video.srcObject = stream;
    void video.play().catch(() => undefined);
  }, [stream]);

  useEffect(() => {
    if (!stream) return;
    const interval = setInterval(async () => {
      const video = videoRef.current;
      if (!video) return;
      const count = await detectFaces(video, detectorRef.current);
      if (count === 1) {
        setFaceStreak((s) => {
          const next = s + 1;
          if (next >= PROCTORING.setupFaceRequired) setReady(true);
          return next;
        });
      } else {
        setFaceStreak(0);
        setReady(false);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [stream]);

  return { videoRef, faceStreak, ready };
}
