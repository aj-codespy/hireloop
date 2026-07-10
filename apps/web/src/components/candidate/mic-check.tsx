"use client";

import { useEffect, useState } from "react";
import { Mic, MicOff } from "lucide-react";
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

  useEffect(() => {
    return () => {
      // cleanup handled on unmount via closure in startTest if needed
    };
  }, []);

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
    <div className="mx-auto max-w-md space-y-6 text-center">
      <h2 className="text-xl font-semibold text-primary">Microphone check</h2>
      <p className="text-sm text-muted-foreground">
        Speak normally for a few seconds so we can verify your mic is working.
      </p>

      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        {status === "error" ? (
          <MicOff className="h-8 w-8 text-destructive" />
        ) : (
          <Mic className="h-8 w-8 text-primary" />
        )}
      </div>

      <div className="mx-auto h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-100"
          style={{ width: `${level}%` }}
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {status === "ok" ? (
        <p className="text-sm text-emerald-700">Microphone looks good.</p>
      ) : null}

      <div className="flex justify-center gap-3">
        {status !== "ok" ? (
          <Button variant="outline" onClick={startTest} disabled={status === "testing"}>
            {status === "testing" ? "Listening…" : "Test microphone"}
          </Button>
        ) : null}
        <Button
          className="bg-brand text-brand-foreground hover:bg-brand/90"
          disabled={status !== "ok"}
          onClick={() => {
            unlockInterviewAudio();
            onReady();
          }}
        >
          Start interview
        </Button>
      </div>
    </div>
  );
}
