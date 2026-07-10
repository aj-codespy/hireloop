"use client";

import { useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { toast } from "sonner";
import { useHireLoop } from "@/lib/store/provider";
import { Button } from "@/components/ui/button";

export function ShareJobLink({ jobId, disabled }: { jobId: string; disabled?: boolean }) {
  const { getJobApplyUrl } = useHireLoop();
  const [copied, setCopied] = useState(false);
  const url = getJobApplyUrl(jobId);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  if (disabled) {
    return (
      <p className="text-sm text-muted-foreground">
        Publish this job to generate a shareable application link.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
        <Link2 className="h-4 w-4 shrink-0 text-brand" />
        <span className="truncate font-mono text-xs sm:text-sm">{url}</span>
      </div>
      <Button size="sm" className="rounded-full bg-brand hover:bg-brand/90" onClick={copy}>
        {copied ? (
          <>
            <Check className="mr-1 h-4 w-4" />
            Copied
          </>
        ) : (
          <>
            <Copy className="mr-1 h-4 w-4" />
            Copy link
          </>
        )}
      </Button>
    </div>
  );
}
