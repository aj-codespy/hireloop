"use client";

import { Logo } from "@/components/brand/logo";
import { ApplicationForm } from "@/components/candidate/application-form";
import { useHireLoop } from "@/lib/store/provider";
import type { JobRole, Organization } from "@/lib/types";
import Link from "next/link";

export function ApplyPageClient({
  initialJob,
  initialOrganization,
  jobNotFound,
}: {
  initialJob?: JobRole | null;
  initialOrganization?: Organization | null;
  jobNotFound?: boolean;
}) {
  const { state } = useHireLoop();
  // Public apply pages must render ONLY server-provided data. Never fall back
  // to the client store here: local state (seeded from localStorage on
  // non-admin pages) can mask a job that does not exist in the database.
  const job = initialJob ?? null;
  const org = initialOrganization ?? state.organization;

  if (jobNotFound || (!initialJob && !job)) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-stone-50 px-5 py-12">
        <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,15,15,0.06)]">
          <p className="text-sm font-semibold text-[#F97316]">Role unavailable</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            This job link is no longer available
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            The role may have been removed or the link may be incorrect.
          </p>
          <Link href="/" className="mt-6 inline-flex min-h-11 items-center rounded-full border border-stone-200 px-5 text-sm font-semibold text-slate-900 transition-colors duration-200 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:ring-offset-2">
            Return home
          </Link>
        </div>
      </main>
    );
  }

  if (!job || job.status !== "live") {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-stone-50 px-5 py-12">
        <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,15,15,0.06)]">
          <p className="text-sm font-semibold text-[#F97316]">Applications closed</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            This role is not accepting applications
          </h1>
          <Link href="/" className="mt-6 inline-flex min-h-11 items-center rounded-full border border-stone-200 px-5 text-sm font-semibold text-slate-900 transition-colors duration-200 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:ring-offset-2">
            Return home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-stone-50 text-slate-900">
      <header className="border-b border-stone-200 bg-white px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8">
        <div className="mx-auto max-w-5xl">
          <Logo href="/" />
        </div>
      </header>
      <main className="mx-auto grid max-w-5xl gap-10 px-5 pb-[max(4rem,env(safe-area-inset-bottom))] pt-10 sm:px-8 lg:grid-cols-5 lg:gap-16 lg:pt-16">
        <section className="lg:col-span-2" aria-labelledby="job-title">
          <p className="text-sm font-semibold text-[#F97316]">{org.name}</p>
          <h1 id="job-title" className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            {job.title}
          </h1>
          <p className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-600">{job.description}</p>
          {job.eligibilityRules.length > 0 ? (
            <p className="mt-8 border-l-2 border-[#F97316] pl-4 text-xs leading-5 text-slate-600">
              Eligibility is checked when you submit. A hiring manager reviews the resulting
              application and interview evidence.
            </p>
          ) : null}
        </section>
        <section className="lg:col-span-3" aria-label="Application">
          <ApplicationForm job={job} />
        </section>
      </main>
    </div>
  );
}
