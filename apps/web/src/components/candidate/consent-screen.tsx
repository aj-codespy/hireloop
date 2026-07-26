"use client";

import { useState } from "react";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";
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
    <section className="mx-auto max-w-2xl rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,15,15,0.06)] sm:p-8">
      <div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50">
          <PhosphorIcon name="ShieldAlert" className="h-6 w-6 text-[#F97316]" />
        </div>
        <p className="mt-5 text-sm font-semibold text-[#F97316]">Consent</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Proctored interview</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          This interview uses continuous webcam surveillance and AI vision analysis, not just
          browser checks. Phones, notes, extra people, and suspicious behavior are detected and
          logged.
        </p>
      </div>

      <div className="mt-7 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-stone-50 px-5">
        <div className="flex min-h-16 items-start gap-3 py-4">
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
        <div className="flex min-h-16 items-start gap-3 py-4">
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
        <div className="flex min-h-16 items-start gap-3 py-4">
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
        <div className="flex min-h-16 items-start gap-3 py-4">
          <Checkbox id="honesty" checked={honesty} onCheckedChange={(v) => setHonesty(!!v)} />
          <Label htmlFor="honesty" className="leading-relaxed">
            I confirm I will complete this interview alone without unauthorized assistance.
          </Label>
        </div>
      </div>

      <Button
        className="mt-7 h-11 w-full rounded-full bg-[#F97316] px-6 font-semibold text-white hover:bg-[#EA6B2D]"
        disabled={!ready}
        onClick={onAccept}
      >
        I agree and want to continue
      </Button>
    </section>
  );
}
