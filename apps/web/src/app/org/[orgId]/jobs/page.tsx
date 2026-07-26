import Link from "next/link";
import { notFound } from "next/navigation";
import { loadPublicOrgJobsAction } from "@/app/actions/hireloop";
import { isActionError } from "@/lib/action-error";
import { Logo } from "@/components/brand/logo";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";

export default async function OrgJobsPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const res = await loadPublicOrgJobsAction(orgId);

  if (isActionError(res)) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-stone-50 px-5 py-12">
        <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-6 shadow-[0_12px_40px_rgba(15,15,15,0.06)]">
          <p className="text-sm font-semibold text-red-700">Careers page unavailable</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            We couldn&apos;t load these roles
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{res.error}</p>
        </div>
      </main>
    );
  }

  const data = res;
  if (!data) notFound();

  return (
    <div className="min-h-[100dvh] bg-stone-50 text-slate-900">
      <header className="border-b border-stone-200 bg-white px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Logo href="/" />
          <p className="truncate text-sm font-medium text-slate-600">{data.organization.name}</p>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 pb-[max(4rem,env(safe-area-inset-bottom))] pt-12 sm:px-8 sm:pt-16">
        <div className="mb-12 max-w-2xl">
          <p className="text-sm font-semibold text-[#F97316]">Careers at {data.organization.name}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-5xl">
            Open roles
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-600">
            Review current opportunities and apply through a clear, structured process. AI assists
            with interview evidence. The hiring team makes every decision.
          </p>
        </div>

        {data.jobs.length === 0 ? (
          <div className="rounded-3xl border border-stone-200 bg-white px-6 py-12">
            <PhosphorIcon name="BriefcaseBusiness" />
            <h2 className="mt-5 text-lg font-semibold">No open roles right now</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Check back soon for new opportunities.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-200 border-y border-stone-200">
            {data.jobs.map((job) => (
              <Link
                key={job.id}
                href={`/apply/${job.id}`}
                className="group flex min-h-32 items-start justify-between gap-6 py-7 transition-colors duration-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:ring-offset-4 motion-reduce:transition-none sm:px-5"
              >
                <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-slate-900">{job.title}</h2>
                    <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-6 text-slate-600">
                      {job.description}
                    </p>
                    <p className="mt-3 text-xs text-slate-500">
                      {new Intl.NumberFormat("en").format(job.formFields.length)} application fields
                    </p>
                </div>
                <span className="mt-1 flex size-11 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-slate-700 transition-colors duration-200 group-hover:border-[#F97316] group-hover:text-[#F97316]">
                  <PhosphorIcon name="ArrowUpRight" />
                  <span className="sr-only">Apply for {job.title}</span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
