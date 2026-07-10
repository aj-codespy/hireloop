"use client";

import { useState } from "react";
import { AlertTriangle, Camera, Monitor, ShieldCheck } from "lucide-react";
import { PROCTORING } from "@/lib/proctoring/constants";
import { useProctoringSetupCheck } from "@/lib/proctoring/use-proctoring";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function ProctoringSetup({
  onReady,
}: {
  onReady: (stream: MediaStream) => void;
}) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deskClear, setDeskClear] = useState(false);
  const [phoneAway, setPhoneAway] = useState(false);
  const [fullscreenOk, setFullscreenOk] = useState(false);
  const { videoRef, faceStreak, ready: faceReady } = useProctoringSetupCheck(stream);

  async function startCamera() {
    setError(null);
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });
      setStream(media);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Camera access denied");
    }
  }

  async function enableFullscreen() {
    try {
      await document.documentElement.requestFullscreen();
      setFullscreenOk(Boolean(document.fullscreenElement));
    } catch {
      setError("Could not enter fullscreen — allow fullscreen when prompted");
    }
  }

  const checksOk = deskClear && phoneAway && fullscreenOk && faceReady;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <ShieldCheck className="h-6 w-6 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-primary">Strict proctoring setup</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Your webcam stays on for the entire interview. AI continuously checks for phones,
          notes, extra people, and tab switching. Violations are logged and may flag your session.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border-2 border-border bg-black">
        {!stream ? (
          <div className="flex aspect-video flex-col items-center justify-center gap-3 text-white/80">
            <Camera className="h-10 w-10" />
            <p className="text-sm">Camera required for proctored interview</p>
            <Button variant="secondary" size="sm" onClick={() => void startCamera()}>
              Enable camera &amp; mic
            </Button>
          </div>
        ) : (
          <div className="relative aspect-video">
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
            <div
              className={cn(
                "absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-medium",
                faceReady ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
              )}
            >
              {faceReady ? "Face verified" : `Center your face (${faceStreak}/${PROCTORING.setupFaceRequired})`}
            </div>
          </div>
        )}
      </div>

      {error ? (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
      ) : null}

      <div className="space-y-3 rounded-xl border border-border bg-card p-5 text-left">
        <div className="flex items-start gap-3">
          <Checkbox id="desk" checked={deskClear} onCheckedChange={(v) => setDeskClear(!!v)} />
          <Label htmlFor="desk" className="leading-relaxed">
            My desk is clear — no notes, books, papers, or cheat sheets visible.
          </Label>
        </div>
        <div className="flex items-start gap-3">
          <Checkbox id="phone" checked={phoneAway} onCheckedChange={(v) => setPhoneAway(!!v)} />
          <Label htmlFor="phone" className="leading-relaxed">
            My phone and any secondary devices are out of reach and not visible to the camera
            (including below the laptop).
          </Label>
        </div>
        <div className="flex items-start gap-3">
          <Monitor className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="flex-1 space-y-2">
            <p className="text-sm leading-relaxed">
              Fullscreen mode is required. Tab switches, copy/paste, and leaving the window are
              monitored.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!stream}
              onClick={() => void enableFullscreen()}
            >
              {fullscreenOk ? "Fullscreen enabled" : "Enter fullscreen"}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Snapshots are analyzed by AI every ~20 seconds for phones, hidden devices, and suspicious
          objects. Repeated violations will flag your interview for manual review.
        </p>
      </div>

      <Button
        className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
        disabled={!stream || !checksOk}
        onClick={() => stream && onReady(stream)}
      >
        Proctoring checks passed — continue
      </Button>
    </div>
  );
}
