"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useHireLoop } from "@/lib/store/provider";
import { isDocumentFieldType } from "@/lib/form-fields";
import type { JobRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DOCUMENT_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.webp,.gif,.rtf,.odt,.ods,application/*,image/*,text/*";

type SubmissionResult = {
  eligibilityPassed: boolean;
  interviewUrl?: string;
  expiresAt?: string;
};

export function ApplicationForm({ job }: { job: JobRole }) {
  const router = useRouter();
  const { submitApplication } = useHireLoop();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<SubmissionResult | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("jobId", job.id);

    try {
      const result = await submitApplication(job.id, formData);
      const interviewUrl = result.application.interviewToken
        ? `${window.location.origin}/candidate/${result.application.interviewToken}`
        : undefined;
      setDone({
        eligibilityPassed: result.eligibilityPassed,
        interviewUrl,
        expiresAt: result.application.tokenExpiresAt,
      });

      if (result.eligibilityPassed) {
        toast.success("Application submitted — you're shortlisted! Your interview link is ready.");
      } else {
        toast.info("Application received. Unfortunately you don't meet the eligibility criteria for this role.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit application");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <Card className="border-border shadow-card">
        <CardContent className="py-10 text-center">
          <p className="text-lg font-semibold text-foreground">Thank you for applying</p>
          {done.eligibilityPassed && done.interviewUrl ? (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                You&apos;re eligible for the next step. Start your voice interview now or return before
                the link expires.
              </p>
              {done.expiresAt ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Interview window expires {new Date(done.expiresAt).toLocaleString()}.
                </p>
              ) : null}
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button className="rounded-full bg-brand hover:bg-brand/90" onClick={() => router.push(done.interviewUrl!)}>
                  Start interview
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => void navigator.clipboard.writeText(done.interviewUrl!)}
                >
                  Copy link
                </Button>
              </div>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Your responses have been recorded. The hiring team will be in touch if you progress.
            </p>
          )}
          <Button variant="ghost" className="mt-4 rounded-full" onClick={() => router.push("/")}>
            Back to home
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border shadow-card">
      <CardHeader>
        <CardTitle>Application form</CardTitle>
        <p className="text-sm text-muted-foreground">{job.title}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-4">
          {job.formFields
            .sort((a, b) => a.order - b.order)
            .map((field) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.fieldKey}>
                  {field.label}
                  {field.required ? " *" : ""}
                </Label>
                {isDocumentFieldType(field.type) ? (
                  <>
                    <Input
                      id={field.fieldKey}
                      name={field.fieldKey}
                      type="file"
                      accept={DOCUMENT_ACCEPT}
                      required={field.required}
                    />
                    <p className="text-xs text-muted-foreground">
                      PDF, Word, Excel, PowerPoint, images, or text — max 10 MB
                    </p>
                  </>
                ) : field.type === "dropdown" ? (
                  <select
                    id={field.fieldKey}
                    name={field.fieldKey}
                    required={field.required}
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select {field.label.toLowerCase()}
                    </option>
                    {(field.options ?? []).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id={field.fieldKey}
                    name={field.fieldKey}
                    type={
                      field.type === "email"
                        ? "email"
                        : field.type === "number"
                          ? "number"
                          : field.type === "phone"
                            ? "tel"
                            : "text"
                    }
                    required={field.required}
                  />
                )}
              </div>
            ))}
          <Button
            type="submit"
            className="w-full rounded-full bg-brand text-brand-foreground hover:bg-brand/90"
            disabled={submitting}
          >
            {submitting ? "Submitting…" : "Submit application"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
