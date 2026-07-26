"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function InviteTeamMemberForm() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);

    const result = await inviteTeamMemberByEmail({
      email: String(form.get("email")),
      fullName: String(form.get("fullName")),
      role: String(form.get("role")),
    });

    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Invitation sent! They'll receive an email to set their password.");
    e.currentTarget.reset();
  }

  return (
    <Card className="max-w-xl border-border shadow-card">
      <CardHeader>
        <CardTitle className="text-base">Invite team member</CardTitle>
        <CardDescription>
          They&apos;ll receive an email to set their own password and join your organization.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tm-name">Full name</Label>
            <Input id="tm-name" name="fullName" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tm-email">Work email</Label>
            <Input id="tm-email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tm-role">Role</Label>
            <select
                          id="tm-role"
                          name="role"
                          defaultValue="recruiter"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="admin">Admin &mdash; full access</option>
                          <option value="recruiter">Recruiter &mdash; pipeline & candidates</option>
                          <option value="hiring_manager">Hiring manager &mdash; assigned-stage decisions</option>
                          <option value="interviewer">Interviewer &mdash; scorecards and feedback</option>
                          <option value="coordinator">Coordinator &mdash; scheduling and pipeline logistics</option>
                          <option value="reporting_viewer">Read-only analytics</option>
                        </select>
          </div>
          <Button type="submit" disabled={loading} className="rounded-full bg-brand hover:bg-brand/90">
            {loading ? "Sending invitation…" : "Send invitation"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

async function inviteTeamMemberByEmail(input: {
  email: string;
  fullName: string;
  role: string;
}): Promise<{ error?: string }> {
  try {
    const res = await fetch("/api/team/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Failed to send invitation" };
    return {};
  } catch {
    return { error: "Network error. Please try again." };
  }
}
