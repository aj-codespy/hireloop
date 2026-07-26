"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useHireLoop } from "@/lib/store/provider";
import { ConsentScreen } from "@/components/candidate/consent-screen";
import { ProctoringSetup } from "@/components/candidate/proctoring-setup";
import { MicCheck } from "@/components/candidate/mic-check";
import { InterviewStepper } from "@/components/candidate/interview-stepper";
import {
  InterviewStructured,
  type InterviewLanguage,
} from "@/components/candidate/interview-structured";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";

type Step = "intro" | "consent" | "proctoring" | "mic" | "live" | "done" | "flagged";

function normalizeInterviewIntroVideoUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.includes("youtube.com/embed/")) return url;

  try {
    const parsed = new URL(url);
    const shortId = parsed.hostname.includes("youtu.be")
      ? parsed.pathname.split("/").filter(Boolean)[0]
      : null;
    const watchId = parsed.searchParams.get("v");
    const id = shortId ?? watchId;
    if (id) return `https://www.youtube.com/embed/${id}`;
  } catch {
    return url;
  }

  return url;
}

export function CandidateInterviewFlow({
  candidateName,
  jobTitle,
  interviewToken,
  organizationName,
  introVideoUrl,
}: {
  candidateName: string;
  jobTitle: string;
  interviewToken: string;
  organizationName?: string;
  introVideoUrl?: string;
}) {
  const { refreshState } = useHireLoop();
  const [step, setStep] = useState<Step>("intro");
  const [language, setLanguage] = useState<InterviewLanguage>("en");
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [flagReason, setFlagReason] = useState<string | null>(null);
  const normalizedIntroVideoUrl = normalizeInterviewIntroVideoUrl(introVideoUrl);

  return (
    <div className="min-h-[100dvh] bg-stone-50 text-slate-900">
      <header className="border-b border-stone-200 bg-white px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
          <Logo />
          {organizationName ? (
            <p className="text-sm font-medium text-muted-foreground">{organizationName}</p>
          ) : null}
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 pb-[max(4rem,env(safe-area-inset-bottom))] pt-8 sm:px-8 sm:pt-10">
        <InterviewStepper current={step} />

        {step === "intro" ? (
          <section className="mx-auto max-w-2xl rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,15,15,0.06)] sm:p-8">
            <p className="text-sm font-semibold text-[#F97316]">Structured interview</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-900">
              Hi {candidateName.split(" ")[0]}, welcome to your interview
            </h1>
            <p className="mt-3 text-sm text-slate-600">
              Role: <strong className="font-semibold text-slate-900">{jobTitle}</strong>
            </p>
            <p className="mt-6 text-sm leading-7 text-slate-600">
              We record video and audio to ensure a fair process for every candidate. Your webcam
              stays on throughout. You will hear each question read aloud. Select Record, speak,
              then stop and continue.
            </p>

            <div className="mt-6 flex gap-2" role="group" aria-label="Interview language">
              {(["en", "hi"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={
                    language === lang
                      ? "min-h-11 rounded-full bg-slate-900 px-5 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:ring-offset-2"
                      : "min-h-11 rounded-full border border-stone-200 px-5 text-sm text-slate-600 transition-colors duration-200 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:ring-offset-2"
                  }
                  aria-pressed={language === lang}
                >
                  {lang === "en" ? "English" : "हिंदी"}
                </button>
              ))}
            </div>

            {normalizedIntroVideoUrl ? (
              <div className="mt-6 aspect-video overflow-hidden rounded-2xl border border-stone-200 bg-stone-100">
                <iframe
                  src={normalizedIntroVideoUrl}
                  title="Company introduction video"
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            ) : null}
            <Button
              type="button"
              onClick={() => setStep("consent")}
              className="mt-8 h-11 rounded-full bg-[#F97316] px-7 font-semibold text-white hover:bg-[#EA6B2D]"
            >
              Continue to consent
            </Button>
          </section>
        ) : null}

        {step === "consent" ? <ConsentScreen onAccept={() => setStep("proctoring")} /> : null}

        {step === "proctoring" ? (
          <ProctoringSetup
            onReady={(stream) => {
              setMediaStream(stream);
              setStep("mic");
            }}
          />
        ) : null}

        {step === "mic" ? (
          <MicCheck mediaStream={mediaStream} onReady={() => setStep("live")} />
        ) : null}

        {step === "live" && mediaStream ? (
          <InterviewStructured
            interviewToken={interviewToken}
            language={language}
            mediaStream={mediaStream}
            onComplete={async (result) => {
              mediaStream.getTracks().forEach((t) => t.stop());
              if (document.fullscreenElement) {
                void document.exitFullscreen().catch(() => undefined);
              }
              if (result?.status === "flagged") {
                setFlagReason(result.reason ?? null);
                setStep("flagged");
                toast.error("Interview ended due to proctoring violation");
              } else {
                setStep("done");
                toast.success("Interview complete. Your answers have been submitted.");
              }
              await refreshState();
            }}
          />
        ) : null}

        {step === "done" ? (
          <section className="mx-auto max-w-xl rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,15,15,0.06)] sm:p-8">
            <p className="text-sm font-semibold text-emerald-700">Interview submitted</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">Thank you for your time</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Your responses have been submitted securely. We&apos;ll contact you if you are
              selected for the next round.
            </p>
            <div className="mt-6 rounded-2xl bg-stone-50 p-5 text-sm">
              <p className="font-medium">What happens next</p>
              <ol className="mt-3 list-decimal space-y-2 pl-4 text-slate-600">
                <li>The hiring team reviews your interview</li>
                <li>If you&apos;re selected, we&apos;ll reach out with next steps</li>
                <li>Keep an eye on your email for updates</li>
              </ol>
            </div>
            <Link
              href="/candidate/profile"
              className="mt-6 inline-flex min-h-11 items-center rounded-full border border-stone-200 px-5 text-sm font-semibold text-slate-900 transition-colors duration-200 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:ring-offset-2"
            >
              View your application status
            </Link>
          </section>
        ) : null}

        {step === "flagged" ? (
          <section className="mx-auto max-w-xl rounded-3xl border border-red-100 bg-white p-6 shadow-[0_12px_40px_rgba(15,15,15,0.06)] sm:p-8">
            <p className="text-sm font-semibold text-red-700">Session ended</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">Interview ended</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Your interview was automatically terminated due to a proctoring violation.
              {flagReason ? (
                <span className="mt-2 block font-medium text-red-800">
                  Reason: {flagReason}
                </span>
              ) : null}
            </p>
            <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-800">
              <p className="font-medium">What happens next</p>
              <p className="mt-2 text-red-700">
                This incident has been logged and your partial interview will be reviewed by the hiring team.
                If you believe this was an error, please contact the recruiter directly.
              </p>
            </div>
            <Link
              href="/candidate/profile"
              className="mt-6 inline-flex min-h-11 items-center rounded-full border border-stone-200 px-5 text-sm font-semibold text-slate-900 transition-colors duration-200 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:ring-offset-2"
            >
              View your application status
            </Link>
          </section>
        ) : null}
      </main>
    </div>
  );
}
