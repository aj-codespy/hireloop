"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Layout crash:", error);
  }, [error]);

  return (
    <html>
      <body className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <h2 className="mb-2 text-2xl font-bold text-red-600 dark:text-red-400">
            Critical System Failure
          </h2>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            A critical error occurred at the root layout of the application.
          </p>
          {error.message && (
            <div className="mb-4 rounded border border-red-100 bg-red-50 p-3 text-xs text-red-700 dark:border-red-950 dark:bg-red-950/30 dark:text-red-300">
              <strong>Error Details:</strong> {error.message}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => reset()}
              className="w-full rounded bg-blue-600 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full rounded border border-gray-300 bg-transparent py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Reload Page
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
