"use client";

import { useState } from "react";
import { toast } from "sonner";
import { inviteTeamMemberAction } from "@/app/actions/auth";
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
    const result = await inviteTeamMemberAction({
      email: String(form.get("email")),
      password: String(form.get("password")),
      fullName: String(form.get("fullName")),
      role: String(form.get("role")) as Parameters<typeof inviteTeamMemberAction>[0]["role"],
    });
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Team member account created");
    e.currentTarget.reset();
  }

  return (
    <Card className="max-w-xl border-border shadow-card">
      <CardHeader>
        <CardTitle className="text-base">Team members</CardTitle>
        <CardDescription>
          Add admin accounts for colleagues who can manage jobs, review candidates, run final
          interviews, and update hiring decisions — all from the same admin portal.
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
            <Label htmlFor="tm-password">Temporary password</Label>
            <Input id="tm-password" name="password" type="password" minLength={8} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tm-role">Role</Label>
            <select
              id="tm-role"
              name="role"
              defaultValue="recruiter"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="admin">Admin — full access</option>
              <option value="recruiter">Recruiter — pipeline & candidates</option>
              <option value="hiring_manager">Hiring manager — assigned-stage decisions</option>
              <option value="interviewer">Interviewer — scorecards and feedback</option>
              <option value="coordinator">Coordinator — scheduling and pipeline logistics</option>
              <option value="reporting_viewer">Reporting viewer — read-only analytics</option>
              <option value="final_interviewer">Final interviewer — legacy review role</option>
            </select>
          </div>
          <Button type="submit" disabled={loading} className="rounded-full bg-brand hover:bg-brand/90">
            {loading ? "Creating…" : "Add team member"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
