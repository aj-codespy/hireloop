"use client";

import { useEffect, useState } from "react";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";
import { getProctoringSnapshotUrlAction } from "@/app/actions/hireloop";
import type { ProctoringLogEntry } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const SEVERITY_COLORS = {
  info: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  warning: "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  critical: "bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-300",
} as const;

export function ProctoringSnapshotThumb({
  sessionId,
  entry,
  signedUrl,
  onOpen,
}: {
  sessionId: string;
  entry: ProctoringLogEntry;
  signedUrl?: string;
  onOpen: (url: string) => void;
}) {
  const [url, setUrl] = useState(signedUrl);
  const [loading, setLoading] = useState(!signedUrl);

  useEffect(() => {
    if (signedUrl || !entry.snapshotPath) return;
    let cancelled = false;
    setLoading(true);
    void getProctoringSnapshotUrlAction(sessionId, entry.snapshotPath).then((res) => {
      if (cancelled) return;
      if (res.url) setUrl(res.url);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [sessionId, entry.snapshotPath, signedUrl]);

  if (!entry.snapshotPath) return null;

  return (
    <button
      type="button"
      className="group relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted"
      onClick={() => url && onOpen(url)}
      disabled={!url && loading}
    >
      {loading ? (
        <div className="flex h-full items-center justify-center">
          <PhosphorIcon name="Loader2" className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : url ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Proctoring snapshot" className="h-full w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
            <PhosphorIcon name="ZoomIn" className="h-6 w-6 text-white opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        </>
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
          Unavailable
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-left">
        <Badge className={`${SEVERITY_COLORS[entry.severity]} text-[10px]`}>{entry.severity}</Badge>
        <p className="mt-1 truncate text-[10px] text-white">{formatDate(entry.at)}</p>
      </div>
    </button>
  );
}

export function ProctoringSnapshotGallery({
  sessionId,
  log,
}: {
  sessionId: string;
  log: ProctoringLogEntry[];
}) {
  const snapshots = log.filter((e) => e.snapshotPath);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  if (snapshots.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No webcam snapshots captured for this session.</p>
    );
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {snapshots.map((entry, i) => (
          <ProctoringSnapshotThumb
            key={`${entry.snapshotPath}-${i}`}
            sessionId={sessionId}
            entry={entry}
            onOpen={setLightboxUrl}
          />
        ))}
      </div>

      {lightboxUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxUrl(null)}
          onKeyDown={(e) => e.key === "Escape" && setLightboxUrl(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-h-[90vh] max-w-5xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxUrl}
              alt="Proctoring snapshot full size"
              className="max-h-[85vh] rounded-lg object-contain"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="absolute right-2 top-2"
              onClick={() => setLightboxUrl(null)}
            >
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
