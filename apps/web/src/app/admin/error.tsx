"use client";

import { useEffect } from "react";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin dashboard exception:", error);
  }, [error]);

  return (
    <main className="flex min-h-[80dvh] items-center bg-white px-5 py-12 font-sans text-slate-950">
      <section className="mx-auto w-full max-w-lg border-y border-slate-200 py-8" aria-labelledby="admin-error-title">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-red-700">Unable to load</p>
        <h1 id="admin-error-title" className="text-2xl font-semibold tracking-[-0.02em]">
          Admin workspace error
        </h1>
        <p className="my-4 text-sm leading-6 text-slate-600">
          This section could not be loaded. Check your permissions or try again in a moment.
        </p>
        {error.message && (
          <div className="mb-5 overflow-x-auto rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-800">
            <strong>Error message:</strong> {error.message}
          </div>
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={() => reset()}
            className="flex-1 rounded-full bg-brand py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#EA6B2D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.href = "/admin"}
            className="flex-1 rounded-full border border-slate-200 bg-transparent py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none"
          >
            Return to dashboard
          </button>
        </div>
      </section>
    </main>
  );
}
