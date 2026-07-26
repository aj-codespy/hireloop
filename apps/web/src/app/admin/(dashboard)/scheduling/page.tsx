"use client";

import { useState } from "react";
import { toast } from "sonner";
import { scheduleHumanInterviewAction } from "@/app/actions/enterprise";
import { useApplicationRows, useHireLoop } from "@/lib/store/provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SchedulingPage() {
  const { hydrated } = useHireLoop();
  const rows = useApplicationRows();
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const result = await scheduleHumanInterviewAction({
      applicationId: String(form.get("applicationId")),
      startsAt: String(form.get("startsAt")),
      endsAt: String(form.get("endsAt")),
      meetingUrl: String(form.get("meetingUrl") || ""),
      location: String(form.get("location") || ""),
    });
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Interview scheduled");
    e.currentTarget.reset();
  }

  if (!hydrated) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="border-b border-slate-200 pb-6">
        <h1>Scheduling</h1>
        <p className="mt-2 text-sm text-slate-600">
          Coordinate the human review stage of the interview process.
        </p>
      </header>
      <Card className="border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Schedule human interview</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void submit(e)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="schedule-application">Candidate application</Label>
              <select
                id="schedule-application"
                name="applicationId"
                required
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">Select candidate</option>
                {rows.map(({ application, candidate, job }) => (
                  <option key={application.id} value={application.id}>
                    {candidate?.name ?? "Unknown"} · {job?.title ?? "Unknown role"}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="schedule-starts-at">Starts</Label>
                <Input id="schedule-starts-at" name="startsAt" type="datetime-local" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-ends-at">Ends</Label>
                <Input id="schedule-ends-at" name="endsAt" type="datetime-local" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule-meeting-url">Meeting URL</Label>
              <Input id="schedule-meeting-url" name="meetingUrl" placeholder="https://meet.google.com/..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule-location">Location</Label>
              <Input id="schedule-location" name="location" placeholder="Office / video call / phone" />
            </div>
            <Button type="submit" disabled={loading} className="rounded-full bg-brand hover:bg-brand/90">
              {loading ? "Scheduling…" : "Schedule interview"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
