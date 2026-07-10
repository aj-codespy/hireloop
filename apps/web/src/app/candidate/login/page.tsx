import { Suspense } from "react";
import { CandidateAuthForm } from "@/components/auth/candidate-auth-form";
import { Logo } from "@/components/brand/logo";
import { LogoMark } from "@/components/brand/logo-mark";
import { IconCandidates, IconVoiceInterview } from "@/components/icons/brand-icons";
import Link from "next/link";

const highlights = [
  {
    icon: IconCandidates,
    title: "Track applications",
    desc: "See where you are in the hiring process for every role you applied to.",
  },
  {
    icon: IconVoiceInterview,
    title: "Complete interviews",
    desc: "Use your secure interview link when you're ready — voice, timed, and structured.",
  },
];

export default function CandidateLoginPage() {
  return (
    <div className="flex min-h-screen">
      <aside className="relative hidden w-[44%] flex-col justify-between overflow-hidden bg-zinc-950 p-12 text-white lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.3),transparent_50%)]" />
        <div className="relative">
          <Logo href="/" className="[&_span]:text-white [&_span_span]:text-brand" />
        </div>
        <div className="relative space-y-10">
          <div>
            <h1 className="text-3xl font-bold leading-tight tracking-tight">
              Your applications, interviews, and next steps — in one place.
            </h1>
            <p className="mt-4 max-w-md text-zinc-400">
              Sign in to check application status, resume an interview, and see updates from the
              hiring team.
            </p>
          </div>
          <ul className="space-y-5">
            {highlights.map((item) => (
              <li key={item.title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-brand">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-sm text-zinc-400">{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative flex items-center gap-3 text-sm text-zinc-500">
          <LogoMark size={24} />
          <span>Candidate portal</span>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-4 lg:px-8">
          <Logo href="/" className="lg:hidden" />
          <div className="ml-auto flex items-center gap-4 text-sm">
            <Link href="/login" className="text-muted-foreground hover:text-foreground focus-ring rounded-sm">
              All sign-in options
            </Link>
            <Link href="/admin/login" className="text-muted-foreground hover:text-foreground focus-ring rounded-sm">
              Hiring team
            </Link>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center bg-muted/30 px-4 py-12">
          <Suspense
            fallback={
              <p className="text-sm text-muted-foreground" role="status">
                Loading…
              </p>
            }
          >
            <CandidateAuthForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
