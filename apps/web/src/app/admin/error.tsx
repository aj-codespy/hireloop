"use client";

import { useEffect } from "react";

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
    <div className="flex h-[80vh] flex-col items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <h2 className="mb-2 text-2xl font-bold text-red-600 dark:text-red-400">
          Admin Portal Error
        </h2>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          An error occurred while loading this section of the admin dashboard. You might have insufficient permissions, or the database service might be temporarily unavailable.
        </p>
        {error.message && (
          <div className="mb-4 rounded border border-red-100 bg-red-50 p-3 text-xs text-red-700 dark:border-red-950 dark:bg-red-950/30 dark:text-red-300">
            <strong>Error Message:</strong> {error.message}
          </div>
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={() => reset()}
            className="flex-1 rounded bg-blue-600 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = "/admin"}
            className="flex-1 rounded border border-gray-300 bg-transparent py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
