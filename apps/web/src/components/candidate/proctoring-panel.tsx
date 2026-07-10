"use client";

import { AlertTriangle, Eye, Maximize, ShieldAlert, Video } from "lucide-react";
import type { ProctoringStatus } from "@/lib/proctoring/types";
import { cn } from "@/lib/utils";

export function ProctoringPanel({
  videoRef,
  status,
  blocked,
  variant = "floating",
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: ProctoringStatus;
  blocked: boolean;
  variant?: "floating" | "inline";
}) {
  const borderColor = blocked
    ? "border-red-500"
    : status.criticalCount > 0
      ? "border-red-400"
      : status.warningCount > 0
        ? "border-amber-400"
        : status.facePresent
          ? "border-emerald-500"
          : status.cameraLive
            ? "border-emerald-500"
            : "border-amber-400";

  const statusPanel = (
    <div className="rounded-lg border border-border bg-card/95 p-2 text-[10px] shadow-md backdrop-blur">
      <div className="mb-1 flex items-center gap-1 font-medium text-foreground">
        <Eye className="h-3 w-3" />
        Proctoring active
      </div>
      <div className="grid grid-cols-2 gap-1 text-muted-foreground">
        <span className={status.tabVisible ? "text-emerald-600" : "text-red-600"}>
          Tab {status.tabVisible ? "visible" : "HIDDEN"}
        </span>
        <span className={status.fullscreen ? "text-emerald-600" : "text-amber-600"}>
          <Maximize className="mr-0.5 inline h-2.5 w-2.5" />
          {status.fullscreen ? "Fullscreen" : "Windowed"}
        </span>
        <span className={status.cameraLive ? "text-emerald-600" : "text-red-600"}>
          Camera {status.cameraLive ? "live" : "off"}
        </span>
        <span className={status.facePresent ? "text-emerald-600" : "text-amber-600"}>
          Face {status.facePresent ? "OK" : "checking…"}
        </span>
      </div>
      {status.lastAlert ? (
        <p className="mt-1 line-clamp-2 text-amber-700">{status.lastAlert}</p>
      ) : null}
    </div>
  );

  const videoBlock = (
    <div
      className={cn(
        "overflow-hidden rounded-xl border-2 bg-black shadow-lg",
        borderColor,
        variant === "inline" ? "w-full" : ""
      )}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={variant === "inline" ? "aspect-video w-full object-cover" : "h-36 w-full object-cover"}
      />
      <div className="flex items-center justify-between bg-black/80 px-3 py-1.5 text-xs text-white">
        <span className="flex items-center gap-1">
          <Video className="h-3.5 w-3.5" />
          LIVE preview
        </span>
        <span className={status.facePresent || status.cameraLive ? "text-emerald-400" : "text-red-400"}>
          {status.facePresent ? "Face OK" : status.cameraLive ? "Camera on" : "No signal"}
        </span>
      </div>
    </div>
  );

  if (variant === "inline") {
    return (
      <div className="mb-8 space-y-3">
        <p className="text-sm font-medium text-foreground">Your camera preview</p>
        <div className="mx-auto grid max-w-2xl gap-3">
          {videoBlock}
          {statusPanel}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-64 flex-col gap-2">
      {videoBlock}
      {statusPanel}

      {blocked ? (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-900">
          <div className="mb-1 flex items-center gap-1 font-semibold">
            <ShieldAlert className="h-3.5 w-3.5" />
            Session flagged
          </div>
          <p>Too many proctoring violations. Your interview is flagged for review.</p>
        </div>
      ) : status.criticalCount > 0 ? (
        <div className="flex items-start gap-1 rounded-lg border border-amber-300 bg-amber-50 p-2 text-[10px] text-amber-900">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
          <span>Critical violation detected — stay visible and remove any devices from view.</span>
        </div>
      ) : null}
    </div>
  );
}

export function ProctoringLockOverlay({ reason }: { reason: string }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-6">
      <div className="max-w-md rounded-xl bg-white p-6 text-center shadow-xl">
        <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-red-600" />
        <h3 className="text-lg font-semibold text-red-900">Interview paused — proctoring violation</h3>
        <p className="mt-2 text-sm text-muted-foreground">{reason}</p>
        <p className="mt-4 text-xs text-muted-foreground">
          Return to fullscreen, show your face clearly, and remove any phones or notes from view.
          This incident has been logged.
        </p>
      </div>
    </div>
  );
}
