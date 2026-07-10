"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { signOutAction, updateCandidateProfileAction } from "@/app/actions/auth";
import type { Application, JobRole, Profile } from "@/lib/types";
import { StatusBadge } from "@/components/patterns/status-badge";
import { APPLICATION_STATUS_LABELS } from "@/lib/constants";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_STEPS = [
  "interview_sent",
  "interviewed",
  "passed_ai",
  "partner_review",
  "hired",
] as const;

function currentStepIndex(status: string) {
  if (status === "auto_rejected" || status === "rejected_ai" || status === "rejected_final") return -1;
  if (status === "interview_expired") return 0;
  const idx = STATUS_STEPS.findIndex((s) => s === status);
  return idx >= 0 ? idx : 0;
}

function nextAction(status: string, hasToken: boolean) {
  switch (status) {
    case "interview_sent":
      return hasToken ? "Complete your voice interview before the link expires." : "Wait for your interview link.";
    case "interviewed":
      return "Your interview is being reviewed.";
    case "passed_ai":
      return "You passed the screening interview. The hiring team will decide the next stage.";
    case "partner_review":
      return "Final interview stage. Watch for scheduling details from the hiring team.";
    case "hired":
      return "Congratulations. The team will follow up with offer/onboarding details.";
    case "interview_expired":
      return "Your interview window expired. Contact the hiring team for a new link.";
    case "auto_rejected":
    case "rejected_ai":
    case "rejected_final":
      return "This application is no longer moving forward.";
    default:
      return "Application received. The hiring team will review your details.";
  }
}

export function CandidateProfileView({
  profile,
  applications,
  jobs,
}: {
  profile: Profile;
  applications: Application[];
  jobs: JobRole[];
}) {
  const [fullName, setFullName] = useState(profile.fullName);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [saving, setSaving] = useState(false);

  const myApplications = applications;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const result = await updateCandidateProfileAction({ fullName, phone: phone || undefined });
    setSaving(false);
    if (result.error) toast.error(result.error);
    else toast.success("Profile updated");
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-white px-6 py-5">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Logo href="/" />
          <form action={signOutAction}>
            <Button type="submit" variant="outline" className="rounded-full">
              Sign out
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-6 py-10">
        <div>
          <h1 className="text-2xl font-bold">My profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">{profile.email}</p>
        </div>

        <Card className="border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Profile details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label>Full name</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <Button type="submit" disabled={saving} className="rounded-full bg-brand hover:bg-brand/90">
                {saving ? "Saving…" : "Save profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-base">My applications</CardTitle>
            <p className="text-sm text-muted-foreground">
              All jobs linked to your account ({myApplications.length})
            </p>
          </CardHeader>
          <CardContent>
            {myApplications.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No applications yet.{" "}
                <Link href="/" className="text-brand hover:underline">
                  Browse open roles
                </Link>
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {myApplications.map((app) => {
                  const job = jobs.find((j) => j.id === app.jobRoleId);
                  const activeStep = currentStepIndex(app.status);
                  return (
                    <li key={app.id} className="space-y-3 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{job?.title ?? "Unknown job"}</p>
                          <p className="text-xs text-muted-foreground">
                            Applied {new Date(app.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={app.status} />
                          {app.interviewToken ? (
                            <Link
                              href={`/candidate/${app.interviewToken}`}
                              className="text-sm text-brand hover:underline"
                            >
                              Interview
                            </Link>
                          ) : null}
                        </div>
                      </div>
                      <div className="grid gap-2 rounded-lg bg-muted/50 p-3">
                        <p className="text-sm text-foreground">
                          {nextAction(app.status, Boolean(app.interviewToken))}
                        </p>
                        <div className="grid grid-cols-5 gap-1 text-[11px] text-muted-foreground">
                          {["AI invite", "AI done", "AI pass", "Final", "Hired"].map((label, idx) => (
                            <div key={label} className="space-y-1">
                              <div
                                className={
                                  idx <= activeStep
                                    ? "h-1.5 rounded-full bg-brand"
                                    : "h-1.5 rounded-full bg-border"
                                }
                              />
                              <span>{label}</span>
                            </div>
                          ))}
                        </div>
                        {app.tokenExpiresAt && app.status === "interview_sent" ? (
                          <p className="text-xs text-muted-foreground">
                            Interview link expires {new Date(app.tokenExpiresAt).toLocaleString()}.
                          </p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
