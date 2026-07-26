import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";
import {
  IconCandidates,
  IconPipeline,
  IconScorecard,
  IconVoiceInterview,
} from "@/components/icons/brand-icons";

const portalContent = {
  admin: {
    eyebrow: "Hiring team workspace",
    title: "Run consistent interviews. Make defensible decisions.",
    description:
      "Manage your pipeline, review candidate evidence, and move every role forward from one workspace.",
    features: [
      { icon: IconPipeline, label: "Clear pipeline ownership" },
      { icon: IconVoiceInterview, label: "Structured voice interviews" },
      { icon: IconScorecard, label: "Human-reviewed scorecards" },
    ],
    alternateHref: "/candidate/login",
    alternateLabel: "Candidate portal",
  },
  candidate: {
    eyebrow: "Candidate portal",
    title: "Your applications, interviews, and status in one place.",
    description:
      "Track every application, record your interviews, and get updates from hiring teams.",
    features: [
      { icon: IconCandidates, label: "One profile for every application" },
      { icon: IconVoiceInterview, label: "Secure, structured interviews" },
      { icon: IconScorecard, label: "Clear status and next steps" },
    ],
    alternateHref: "/admin/login",
    alternateLabel: "Hiring team sign in",
  },
} as const;

export function AuthPortalShell({
  portal,
  children,
}: {
  portal: keyof typeof portalContent;
  children: ReactNode;
}) {
  const content = portalContent[portal];

  return (
    <div className="min-h-dvh bg-white text-[#111827] lg:grid lg:grid-cols-[minmax(360px,42%)_1fr]">
      <aside className="hidden min-h-dvh flex-col justify-between border-r border-[#ECECEC] bg-[#FAFAF9] p-10 lg:flex xl:p-14">
        <Logo href="/" />

        <div className="max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F97316]">
            {content.eyebrow}
          </p>
          <h1 className="mt-5 text-4xl font-bold leading-[1.12] tracking-[-0.035em]">
            {content.title}
          </h1>
          <p className="mt-5 text-base leading-7 text-[#6B7280]">{content.description}</p>

          <ul className="mt-10 space-y-5">
            {content.features.map((feature) => (
              <li key={feature.label} className="flex items-center gap-4 text-sm font-medium">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-[#ECECEC] bg-white text-[#F97316]">
                  <feature.icon className="size-5" aria-hidden="true" />
                </span>
                {feature.label}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs leading-6 text-[#6B7280]">
          SOC 2 &nbsp;•&nbsp; GDPR &nbsp;•&nbsp; Encryption &nbsp;•&nbsp; Audit logs
        </p>
      </aside>

      <section className="flex min-h-dvh flex-col">
        <header className="flex min-h-16 items-center justify-between border-b border-[#ECECEC] px-5 sm:px-8">
          <Logo href="/" className="lg:hidden" />
          <nav className="ml-auto flex items-center gap-2 text-sm" aria-label="Authentication">
            <Link
              href="/login"
              className="flex min-h-11 items-center rounded-full px-3 text-[#6B7280] transition-colors duration-200 hover:bg-[#FAFAF9] hover:text-[#111827] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F97316]"
            >
              All portals
            </Link>
            <Link
              href={content.alternateHref}
              className="flex min-h-11 items-center rounded-full px-3 text-[#6B7280] transition-colors duration-200 hover:bg-[#FAFAF9] hover:text-[#111827] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F97316]"
            >
              {content.alternateLabel}
            </Link>
          </nav>
        </header>

        <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8 sm:py-14">
          {children}
        </main>
      </section>
    </div>
  );
}
