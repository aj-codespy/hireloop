"use client";

import { useState } from "react";
import { useHireLoop } from "@/lib/store/provider";
import { isSupabaseClientEnabled } from "@/lib/supabase/config";

/**
 * Shows when the admin workspace is configured for Supabase (client env
 * present) but the store could not load/sync from the database. Without this
 * the app silently fell back to an empty state, hiding live-org issues.
 */
export function DbSyncBanner() {
  const { usingSupabase } = useHireLoop();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;
  if (usingSupabase || !isSupabaseClientEnabled()) return null;

  return (
    <div
      role="alert"
      className="flex items-start justify-between gap-4 border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      <p>
        <strong>Database sync failed</strong> — changes may not be saved. Check
        the Supabase connection.
      </p>
      <button
        type="button"
        aria-label="Dismiss database sync warning"
        onClick={() => setDismissed(true)}
        className="shrink-0 font-medium text-amber-700 transition-colors hover:text-amber-900"
      >
        Dismiss
      </button>
    </div>
  );
}
