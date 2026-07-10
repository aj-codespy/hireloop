"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getApplicationDocumentUrlAction } from "@/app/actions/hireloop";
import { formatFileSize } from "@/lib/form-fields";
import type { ApplicationDocument } from "@/lib/types";
import { Button } from "@/components/ui/button";

export function ApplicationDocumentLink({ document }: { document: ApplicationDocument }) {
  const [loading, setLoading] = useState(false);

  async function openDocument() {
    if (!document.storagePath) {
      toast.error("Document not available");
      return;
    }
    setLoading(true);
    try {
      const { url, error } = await getApplicationDocumentUrlAction(document.storagePath);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      else toast.error(error ?? "Could not open document");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-auto max-w-full justify-start gap-2 py-2 text-left"
      onClick={() => void openDocument()}
      disabled={loading || !document.storagePath}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
      ) : (
        <Download className="h-4 w-4 shrink-0" />
      )}
      <span className="min-w-0 truncate">
        {document.originalName}
        <span className="ml-1 text-xs text-muted-foreground">
          ({formatFileSize(document.sizeBytes)})
        </span>
      </span>
    </Button>
  );
}
