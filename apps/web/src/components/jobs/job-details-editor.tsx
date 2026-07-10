"use client";

import { useState } from "react";
import type { JobRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function JobDetailsEditor({
  job,
  onSave,
  onCancel,
}: {
  job: JobRole;
  onSave: (patch: Pick<JobRole, "title" | "description" | "status">) => void;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(job.title);
  const [description, setDescription] = useState(job.description);
  const [status, setStatus] = useState(job.status);

  const [prevJob, setPrevJob] = useState(job);
  if (job !== prevJob) {
    setPrevJob(job);
    setTitle(job.title);
    setDescription(job.description);
    setStatus(job.status);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Job title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={status}
          onValueChange={(v) => {
            if (!v) return;
            setStatus(v as JobRole["status"]);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="live">Live (accepting applications)</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Only <strong>live</strong> jobs accept applications via the share link.
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          className="rounded-full bg-brand hover:bg-brand/90"
          onClick={() => onSave({ title: title.trim(), description: description.trim(), status })}
          disabled={!title.trim()}
        >
          Save details
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" className="rounded-full" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </div>
  );
}
