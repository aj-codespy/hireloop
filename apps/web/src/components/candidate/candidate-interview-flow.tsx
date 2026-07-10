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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
          <Logo />
          {organizationName ? (
            <p className="text-sm font-medium text-muted-foreground">{organizationName}</p>
          ) : null}
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-12">
        <InterviewStepper current={step} />

        {step === "intro" ? (
          <div className="mx-auto max-w-xl space-y-6 text-center">
            <h1 className="text-2xl font-semibold text-foreground">
              Hi {candidateName.split(" ")[0]}, welcome to your interview
            </h1>
            <p className="text-muted-foreground">
              Role: <strong className="text-foreground">{jobTitle}</strong>
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We record video and audio to ensure a fair process for every candidate. Your webcam
              stays on throughout. You will hear each question read aloud — tap Record, speak, then
              Stop and Next.
            </p>

            <div className="flex justify-center gap-2" role="group" aria-label="Interview language">
              {(["en", "hi"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={
                    language === lang
                      ? "rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-foreground focus-ring"
                      : "rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted focus-ring"
                  }
                  aria-pressed={language === lang}
                >
                  {lang === "en" ? "English" : "हिंदी"}
                </button>
              ))}
            </div>

            {normalizedIntroVideoUrl ? (
              <div className="aspect-video overflow-hidden rounded-xl border border-border bg-muted">
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
              className="h-11 rounded-full bg-brand px-8 text-brand-foreground hover:bg-brand/90"
            >
              Continue to consent
            </Button>
          </div>
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
                toast.success("Interview complete — your answers have been submitted");
              }
              await refreshState();
            }}
          />
        ) : null}

        {step === "done" ? (
          <div className="mx-auto max-w-xl space-y-6 text-center">
            <h2 className="text-2xl font-semibold">Thank you for completing your interview</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Your responses have been submitted securely. We&apos;ll contact you if you are
              selected for the next round.
            </p>
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-left text-sm">
              <p className="font-medium">What happens next</p>
              <ol className="mt-2 list-decimal space-y-1 pl-4 text-muted-foreground">
                <li>The hiring team reviews your interview</li>
                <li>If you&apos;re selected, we&apos;ll reach out with next steps</li>
                <li>Keep an eye on your email for updates</li>
              </ol>
            </div>
            <Link
              href="/candidate/profile"
              className="inline-flex text-sm font-medium text-brand hover:underline focus-ring rounded-sm"
            >
              View your application status
            </Link>
          </div>
        ) : null}

        {step === "flagged" ? (
          <div className="mx-auto max-w-xl space-y-6 text-center">
            <h2 className="text-2xl font-semibold text-red-900">Interview Ended</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Your interview was automatically terminated due to a proctoring violation.
              {flagReason ? (
                <span className="block mt-2 font-medium text-red-800">
                  Reason: {flagReason}
                </span>
              ) : null}
            </p>
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-left text-sm text-red-800">
              <p className="font-medium">What happens next</p>
              <p className="mt-2 text-red-700">
                This incident has been logged and your partial interview will be reviewed by the hiring team.
                If you believe this was an error, please contact the recruiter directly.
              </p>
            </div>
            <Link
              href="/candidate/profile"
              className="inline-flex text-sm font-medium text-brand hover:underline focus-ring rounded-sm"
            >
              View your application status
            </Link>
          </div>
        ) : null}
      </main>
    </div>
  );
}
