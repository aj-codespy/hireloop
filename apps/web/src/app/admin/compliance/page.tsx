"use client";

import { useState } from "react";
import { toast } from "sonner";
import { eraseCandidateDataAction, exportCandidateDataAction } from "@/app/actions/enterprise";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function CompliancePage() {
  const [email, setEmail] = useState("");
  const [exported, setExported] = useState<unknown>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function exportData() {
    setLoading("export");
    const result = await exportCandidateDataAction(email);
    setLoading(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setExported(result.data);
    toast.success("Candidate data exported");
  }

  async function eraseData() {
    if (!window.confirm("Erase this candidate's data for your organization? This cannot be undone.")) return;
    setLoading("erase");
    const result = await eraseCandidateDataAction(email);
    setLoading(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setExported(null);
    toast.success("Candidate data erased");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card className="border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Candidate data request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Candidate email</Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="candidate@example.com"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => void exportData()}
              disabled={!email || loading === "export"}
              className="rounded-full bg-brand hover:bg-brand/90"
            >
              {loading === "export" ? "Exporting…" : "Export data"}
            </Button>
            <Button
              onClick={() => void eraseData()}
              disabled={!email || loading === "erase"}
              variant="destructive"
              className="rounded-full"
            >
              {loading === "erase" ? "Erasing…" : "Erase data"}
            </Button>
          </div>
          {exported ? (
            <pre className="max-h-80 overflow-auto rounded-lg bg-muted p-4 text-xs">
              {JSON.stringify(exported, null, 2)}
            </pre>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Retention</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Add a retention policy before launch: expired interviews, rejected applications, proctoring
            snapshots, and resumes should each have explicit deletion windows.
          </CardContent>
        </Card>
        <Card className="border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Audit trail</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            The enterprise migration adds `activity_log` and stage history tables so admins can show who
            moved a candidate, when, and why.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
