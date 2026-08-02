"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";
import { exportCandidatesCsvAction } from "@/app/actions/hireloop";
import { isActionError } from "@/lib/action-error";
import { Button } from "@/components/ui/button";

interface ExportCandidatesButtonProps {
  /** Restrict export to one job. */
  jobId?: string;
  /** Restrict export to candidates who cleared all AI interviews. */
  onlyCleared?: boolean;
  label?: string;
  variant?: "outline" | "default";
  className?: string;
}

function triggerDownload(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function ExportCandidatesButton({
  jobId,
  onlyCleared = false,
  label,
  variant = "outline",
  className,
}: ExportCandidatesButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await exportCandidatesCsvAction({ jobId, onlyCleared });
      if (isActionError(res)) {
        throw new Error(res.error);
      }
      triggerDownload(res.csv, res.filename);
      toast.success(
        onlyCleared ? "Cleared candidates exported" : "Candidates exported"
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant={variant}
      size="sm"
      className={className}
      onClick={handleExport}
      disabled={loading}
    >
      <PhosphorIcon name={loading ? "Loader2" : "Download"} className="mr-1 h-3.5 w-3.5" />
      {label ?? (onlyCleared ? "Export cleared" : "Export CSV")}
    </Button>
  );
}
