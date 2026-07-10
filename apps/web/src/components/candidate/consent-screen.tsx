"use client";

import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function ConsentScreen({ onAccept }: { onAccept: () => void }) {
  const [continuousWebcam, setContinuousWebcam] = useState(false);
  const [aiSurveillance, setAiSurveillance] = useState(false);
  const [environment, setEnvironment] = useState(false);
  const [honesty, setHonesty] = useState(false);

  const ready = continuousWebcam && aiSurveillance && environment && honesty;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <ShieldAlert className="h-6 w-6 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-primary">Strict proctored interview</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          This interview uses continuous webcam surveillance and AI vision analysis — not just
          browser checks. Phones, notes, extra people, and suspicious behavior are detected and
          logged.
        </p>
      </div>

      <div className="space-y-4 rounded-xl border border-red-200 bg-red-50/30 p-5 text-left">
        <div className="flex items-start gap-3">
          <Checkbox
            id="webcam"
            checked={continuousWebcam}
            onCheckedChange={(v) => setContinuousWebcam(!!v)}
          />
          <Label htmlFor="webcam" className="leading-relaxed">
            I consent to <strong>continuous webcam monitoring</strong> for the entire interview.
            My video feed is analyzed in real time and periodic AI snapshots are taken.
          </Label>
        </div>
        <div className="flex items-start gap-3">
          <Checkbox
            id="ai"
            checked={aiSurveillance}
            onCheckedChange={(v) => setAiSurveillance(!!v)}
          />
          <Label htmlFor="ai" className="leading-relaxed">
            I understand AI checks each snapshot for phones, secondary devices, notes, multiple
            people, and looking away. Violations are recorded and may flag my session.
          </Label>
        </div>
        <div className="flex items-start gap-3">
          <Checkbox
            id="environment"
            checked={environment}
            onCheckedChange={(v) => setEnvironment(!!v)}
          />
          <Label htmlFor="environment" className="leading-relaxed">
            I will stay in <strong>fullscreen</strong>, keep my face visible, and maintain a clear
            desk with no phones or unauthorized materials in view (including below the laptop).
          </Label>
        </div>
        <div className="flex items-start gap-3">
          <Checkbox id="honesty" checked={honesty} onCheckedChange={(v) => setHonesty(!!v)} />
          <Label htmlFor="honesty" className="leading-relaxed">
            I confirm I will complete this interview alone without unauthorized assistance.
          </Label>
        </div>
      </div>

      <Button
        className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
        disabled={!ready}
        onClick={onAccept}
      >
        I agree — continue to proctoring setup
      </Button>
    </div>
  );
}
