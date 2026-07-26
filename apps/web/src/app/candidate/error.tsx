"use client";

import { useEffect } from "react";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";

export default function CandidateError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Candidate portal exception:", error);
  }, [error]);

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-stone-50 px-5 py-12">
      <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-6 shadow-[0_12px_40px_rgba(15,15,15,0.06)]">
        <p className="text-sm font-semibold text-red-700">Session interrupted</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Your interview couldn&apos;t load
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          This may be a temporary connection issue. Retry the session before refreshing the page.
        </p>
        {error.message && (
          <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-xs leading-5 text-red-800">
            <strong>Details:</strong> {error.message}
          </div>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => reset()}
            className="min-h-11 flex-1 rounded-full bg-[#F97316] px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#EA6B2D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:ring-offset-2"
          >
            Retry session
          </button>
          <button
            onClick={() => window.location.reload()}
            className="min-h-11 flex-1 rounded-full border border-stone-200 bg-white px-5 text-sm font-semibold text-slate-900 transition-colors duration-200 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:ring-offset-2"
          >
            Refresh page
          </button>
        </div>
      </div>
    </main>
  );
}
