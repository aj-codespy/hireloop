"use client";

import { useState } from "react";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";
import { unlockInterviewAudio } from "@/lib/interview/unlock-audio";
import { Button } from "@/components/ui/button";

export function MicCheck({
  onReady,
  mediaStream,
}: {
  onReady: () => void;
  mediaStream?: MediaStream | null;
}) {
  const [level, setLevel] = useState(0);
  const [status, setStatus] = useState<"idle" | "testing" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function startTest() {
    setStatus("testing");
    setError(null);
    try {
      const stream =
        mediaStream ?? (await navigator.mediaDevices.getUserMedia({ audio: true }));
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setLevel(Math.min(100, (avg / 128) * 100));
      };

      const interval = setInterval(tick, 100);
      setTimeout(() => {
        clearInterval(interval);
        if (!mediaStream) {
          stream.getTracks().forEach((t) => t.stop());
        }
        ctx.close();
        setStatus("ok");
      }, 3000);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Microphone unavailable");
    }
  }

  return (
    <section className="mx-auto max-w-xl rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,15,15,0.06)] sm:p-8">
      <p className="text-sm font-semibold text-[#F97316]">Audio setup</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Microphone check</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Speak normally for a few seconds so we can verify your mic is working.
      </p>

      <div className="mt-7 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
        {status === "error" ? (
          <PhosphorIcon name="MicOff" className="h-8 w-8 text-destructive" />
        ) : (
          <PhosphorIcon name="Mic" className="h-8 w-8 text-slate-700" />
        )}
      </div>

      <div
        className="mt-6 h-2 w-full overflow-hidden rounded-full bg-stone-100"
        role="progressbar"
        aria-label="Microphone level"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(level)}
      >
        <div
          className="h-full bg-[#F97316] transition-[width] duration-100 motion-reduce:transition-none"
          style={{ width: `${level}%` }}
        />
      </div>

      {error ? <p className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</p> : null}
      {status === "ok" ? (
        <p className="mt-5 text-sm font-medium text-emerald-700" role="status">Microphone looks good.</p>
      ) : null}

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        {status !== "ok" ? (
          <Button className="h-11 rounded-full px-5" variant="outline" onClick={startTest} disabled={status === "testing"}>
            {status === "testing" ? "Listening…" : "Test microphone"}
          </Button>
        ) : null}
        <Button
          className="h-11 rounded-full bg-[#F97316] px-6 font-semibold text-white hover:bg-[#EA6B2D]"
          disabled={status !== "ok"}
          onClick={() => {
            unlockInterviewAudio();
            onReady();
          }}
        >
          Start interview
        </Button>
      </div>
    </section>
  );
}
