"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createRequisitionAction } from "@/app/actions/enterprise";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function RequisitionsPage() {
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const result = await createRequisitionAction({
      title: String(form.get("title")),
      departmentName: String(form.get("departmentName") || ""),
      headcount: Number(form.get("headcount") || 1),
      budgetRange: String(form.get("budgetRange") || ""),
    });
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Requisition submitted for approval");
    e.currentTarget.reset();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Create requisition</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void submit(e)} className="space-y-4">
            <div className="space-y-2">
              <Label>Role title</Label>
              <Input name="title" required placeholder="Senior Product Manager" />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input name="departmentName" placeholder="Product" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Headcount</Label>
                <Input name="headcount" type="number" min="1" defaultValue="1" required />
              </div>
              <div className="space-y-2">
                <Label>Budget range</Label>
                <Input name="budgetRange" placeholder="₹25L - ₹35L" />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="rounded-full bg-brand hover:bg-brand/90">
              {loading ? "Submitting…" : "Submit for approval"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
