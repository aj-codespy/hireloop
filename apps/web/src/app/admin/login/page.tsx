import Link from "next/link";
import { Suspense } from "react";
import { AdminSignInForm } from "@/components/auth/admin-signin-form";
import { Logo } from "@/components/brand/logo";
import { LogoMark } from "@/components/brand/logo-mark";
import {
  IconPipeline,
  IconScorecard,
  IconVoiceInterview,
} from "@/components/icons/brand-icons";

const highlights = [
  {
    icon: IconPipeline,
    title: "Screen faster",
    desc: "Eligibility rules and automated interview links cut manual follow-up.",
  },
  {
    icon: IconVoiceInterview,
    title: "Interview consistently",
    desc: "Structured voice questions with transcripts for every candidate.",
  },
  {
    icon: IconScorecard,
    title: "Decide with evidence",
    desc: "Scores, documents, and proctoring logs in one workspace.",
  },
];

// Mini workflow strip: Apply → Interview → Score
const workflowSteps = [
  { icon: "📝", label: "Apply", color: "bg-zinc-700" },
  { icon: "🎙️", label: "Interview", color: "bg-brand/50" },
  { icon: "📊", label: "Score", color: "bg-zinc-700" },
];

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen">
      <aside className="relative hidden w-[44%] flex-col justify-between overflow-hidden bg-zinc-950 p-12 text-white lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,107,0,0.35),transparent_50%)]" />
        <div className="relative">
          <Logo href="/" className="[&_span]:text-white [&_span_span]:text-brand" />
        </div>
        <div className="relative space-y-10 reveal">
          <div>
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-gradient">
              Structured hiring from application to decision.
            </h1>
            <p className="mt-4 max-w-md text-zinc-400">
              Set up roles, run voice interviews, and move candidates through your pipeline —
              all in one place.
            </p>
          </div>
          <ul className="space-y-5">
            {highlights.map((item) => (
              <li key={item.title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-muted text-brand shadow-lg">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-sm text-zinc-400">{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
          
          {/* Mini workflow strip */}
          <div className="relative pt-8 border-t border-zinc-800">
            <div className="flex items-center justify-center gap-6 text-sm">
              {workflowSteps.map((step, index) => (
                <div key={step.label} className="flex flex-col items-center gap-2">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${step.color}`}>
                    {step.icon}
                  </div>
                  <span className="font-medium text-zinc-300">{step.label}</span>
                  {index < workflowSteps.length - 1 && (
                    <div className="w-10 h-0.5 bg-zinc-800" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="relative flex items-center gap-3 text-sm text-zinc-500">
          <LogoMark size={24} />
          <span>Trusted by hiring teams</span>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-end gap-4 border-b border-border px-8 py-4 text-sm">
          <Link href="/login" className="text-muted-foreground hover:text-foreground focus-ring rounded-sm">
            All sign-in options
          </Link>
          <Link href="/candidate/login" className="text-muted-foreground hover:text-foreground focus-ring rounded-sm">
            Candidate portal
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center bg-muted/30 px-4 py-12 reveal">
          <Suspense
            fallback={
              <p className="text-sm text-muted-foreground" role="status">
                Loading...
              </p>
            }
          >
            <AdminSignInForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}