import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { LogoMark } from "@/components/brand/logo-mark";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";
import {
  IconCandidates,
  IconCompany,
  IconVoiceInterview,
} from "@/components/icons/brand-icons";

const portals = [
  {
    href: "/admin/login",
    title: "Hiring team",
    description: "Manage jobs, review candidates, and move your pipeline from one dashboard.",
    icon: IconCompany,
    cta: "Open workspace",
  },
  {
    href: "/candidate/login",
    title: "Candidate",
    description: "Track applications, record interviews, and see where you stand.",
    icon: IconCandidates,
    cta: "View applications",
  },
];

export default function LoginPage() {
  return (
    <div className="min-h-dvh bg-[#FAFAF9] text-[#111827]">
      <header className="border-b border-[#ECECEC] bg-white px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Logo href="/" />
          <Link
            href="/"
            className="flex min-h-11 items-center rounded-full px-3 text-sm text-[#6B7280] transition-colors duration-200 hover:bg-[#FAFAF9] hover:text-[#111827] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F97316]"
          >
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-20">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F97316]">
            Choose your portal
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-[-0.035em] sm:text-5xl">
            Sign in to HireLoop
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[#6B7280]">
            Hiring teams run their pipeline here. Candidates track their applications.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {portals.map((portal) => (
            <Link
              key={portal.href}
              href={portal.href}
              className="group flex min-h-64 flex-col rounded-3xl border border-[#ECECEC] bg-white p-7 shadow-[0_1px_3px_rgba(15,15,15,0.05)] transition-[border-color,box-shadow] duration-200 hover:border-[#F97316] hover:shadow-[0_12px_40px_rgba(15,15,15,0.08)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F97316] motion-reduce:transition-none sm:p-8"
            >
              <span className="flex size-12 items-center justify-center rounded-xl bg-[#FAFAF9] text-[#F97316]">
                <portal.icon className="size-6" aria-hidden="true" />
              </span>
              <h2 className="mt-6 text-2xl font-semibold tracking-[-0.02em]">{portal.title}</h2>
              <p className="mt-3 flex-1 text-sm leading-6 text-[#6B7280]">{portal.description}</p>
              <span className="mt-7 flex min-h-11 items-center justify-center rounded-full bg-[#F97316] px-5 text-sm font-semibold tracking-[0.02em] text-white transition-colors duration-200 group-hover:bg-[#EA6B2D]">
                {portal.cta}
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-[#ECECEC] bg-white p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#FAFAF9] text-[#F97316]">
              <IconVoiceInterview className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">Have an interview link?</p>
              <p className="mt-1 text-sm leading-6 text-[#6B7280]">
                Open the secure link from your email. No account needed.
                <Link href="/candidate/demo-token-rahul" className="ml-2 text-[#F97316] underline-offset-4 hover:underline">
                  /candidate/demo-token-rahul
                </Link>
              </p>
            </div>
          </div>
        </div>

        <p className="mt-8 flex items-center gap-2 text-xs text-[#6B7280]">
          <LogoMark size={20} />
          Structured hiring from application to decision
        </p>
      </main>
    </div>
  );
}