"use client";

import { useState } from "react";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";
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
      setError("Could not enter fullscreen. Allow fullscreen when prompted.");
    }
  }

  const checksOk = deskClear && phoneAway && fullscreenOk && faceReady;

  return (
    <section className="mx-auto max-w-2xl rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,15,15,0.06)] sm:p-8">
      <div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50">
          <PhosphorIcon name="ShieldCheck" className="h-6 w-6 text-[#F97316]" />
        </div>
        <p className="mt-5 text-sm font-semibold text-[#F97316]">Device setup</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Prepare your space</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Your webcam stays on for the entire interview. AI continuously checks for phones,
          notes, extra people, and tab switching. Violations are logged and may flag your session.
        </p>
      </div>

      <div className="mt-7 overflow-hidden rounded-2xl border border-stone-200 bg-black">
        {!stream ? (
          <div className="flex aspect-video flex-col items-center justify-center gap-3 text-white/80">
            <PhosphorIcon name="Camera" className="h-10 w-10" />
            <p className="text-sm">Camera required for proctored interview</p>
            <Button className="h-11 rounded-full px-5" variant="secondary" onClick={() => void startCamera()}>
              Enable camera &amp; mic
            </Button>
          </div>
        ) : (
          <div className="relative aspect-video">
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
            <div
              className={cn(
                "absolute left-3 top-3 rounded-full px-3 py-1.5 text-xs font-medium",
                faceReady ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
              )}
            >
              {faceReady ? "Face verified" : `Center your face (${faceStreak}/${PROCTORING.setupFaceRequired})`}
            </div>
          </div>
        )}
      </div>

      {error ? (
        <p className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</p>
      ) : null}

      <div className="mt-6 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-stone-50 px-5">
        <div className="flex min-h-16 items-start gap-3 py-4">
          <Checkbox id="desk" checked={deskClear} onCheckedChange={(v) => setDeskClear(!!v)} />
          <Label htmlFor="desk" className="leading-relaxed">
            My desk is clear. No notes, books, papers, or cheat sheets are visible.
          </Label>
        </div>
        <div className="flex min-h-16 items-start gap-3 py-4">
          <Checkbox id="phone" checked={phoneAway} onCheckedChange={(v) => setPhoneAway(!!v)} />
          <Label htmlFor="phone" className="leading-relaxed">
            My phone and any secondary devices are out of reach and not visible to the camera
            (including below the laptop).
          </Label>
        </div>
        <div className="flex min-h-16 items-start gap-3 py-4">
          <PhosphorIcon name="Monitor" className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="flex-1 space-y-2">
            <p className="text-sm leading-relaxed">
              Fullscreen mode is required. Tab switches, copy/paste, and leaving the window are
              monitored.
            </p>
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-full px-5"
              disabled={!stream}
              onClick={() => void enableFullscreen()}
            >
              {fullscreenOk ? "Fullscreen enabled" : "Enter fullscreen"}
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
        <PhosphorIcon name="AlertTriangle" className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Snapshots are analyzed by AI every ~20 seconds for phones, hidden devices, and suspicious
          objects. Repeated violations will flag your interview for manual review.
        </p>
      </div>

      <Button
        className="mt-7 h-11 w-full rounded-full bg-[#F97316] px-6 font-semibold text-white hover:bg-[#EA6B2D]"
        disabled={!stream || !checksOk}
        onClick={() => stream && onReady(stream)}
      >
        Continue to microphone check
      </Button>
    </section>
  );
}
