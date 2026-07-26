"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createOfferAction } from "@/app/actions/enterprise";
import { useApplicationRows, useHireLoop } from "@/lib/store/provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function OffersPage() {
  const { hydrated } = useHireLoop();
  const rows = useApplicationRows().filter(({ application }) =>
    ["partner_review", "hired"].includes(application.status)
  );
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const result = await createOfferAction({
      applicationId: String(form.get("applicationId")),
      compensationLabel: String(form.get("compensationLabel")),
      startDate: String(form.get("startDate") || ""),
      expiresAt: String(form.get("expiresAt") || ""),
    });
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Offer draft created");
    e.currentTarget.reset();
  }

  if (!hydrated) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="border-b border-slate-200 pb-6">
        <h1>Offers</h1>
        <p className="mt-2 text-sm text-slate-600">
          HireLoop owns the interview. You own the offer.
        </p>
      </header>
      <Card className="border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Create offer draft</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void submit(e)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="offer-application">Candidate application</Label>
              <select
                id="offer-application"
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
            <div className="space-y-2">
              <Label htmlFor="offer-compensation">Compensation summary</Label>
              <Input id="offer-compensation" name="compensationLabel" required placeholder="₹32L CTC + benefits" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="offer-start-date">Start date</Label>
                <Input id="offer-start-date" name="startDate" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="offer-expires-at">Offer expires</Label>
                <Input id="offer-expires-at" name="expiresAt" type="datetime-local" />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="rounded-full bg-brand hover:bg-brand/90">
              {loading ? "Creating…" : "Create offer draft"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
