"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";
import { updateJobAction } from "@/app/actions/hireloop";
import { isActionError } from "@/lib/action-error";
import { useHireLoop } from "@/lib/store/provider";
import type { JobStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface JobStatusToggleProps {
  jobId: string;
  status: JobStatus;
  className?: string;
}

/**
 * One-click live ↔ closed toggle for a job. Publish makes the apply link
 * active; Close applications takes it down (applicants see "Applications closed").
 */
export function JobStatusToggle({ jobId, status, className }: JobStatusToggleProps) {
  const { refreshState } = useHireLoop();
  const [loading, setLoading] = useState(false);
  const isLive = status === "live";

  async function handleToggle() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await updateJobAction(jobId, { status: isLive ? "closed" : "live" });
      if (isActionError(res)) {
        throw new Error(res.error);
      }
      await refreshState();
      toast.success(isLive ? "Applications closed" : "Job published — link is live");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update job status");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant={isLive ? "outline" : "default"}
      size="sm"
      className={className}
      onClick={handleToggle}
      disabled={loading}
    >
      <PhosphorIcon
        name={loading ? "Loader2" : isLive ? "XCircle" : "Upload"}
        className="mr-1 h-3.5 w-3.5"
      />
      {loading ? "Saving…" : isLive ? "Close applications" : "Publish"}
    </Button>
  );
}
