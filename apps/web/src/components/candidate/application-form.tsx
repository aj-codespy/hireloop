"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useHireLoop } from "@/lib/store/provider";
import { isDocumentFieldType } from "@/lib/form-fields";
import type { JobRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EligibilityPreview } from "@/components/candidate/eligibility-preview";
import {
  CheckCircle2,
  Copy,
  Clock,
  ExternalLink,
  Sparkles,
  ArrowRight,
} from "lucide-react";

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
  const [formValues, setFormValues] = useState<Record<string, string | number | File | null>>({});

  const eligibilityRules = job.eligibilityRules ?? [];

  const handleFieldChange = (fieldKey: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [fieldKey]: value }));
  };

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
        toast.success("Application submitted — you're shortlisted!");
      } else {
        toast.info("Application received.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit application");
    } finally {
      setSubmitting(false);
    }
  }

  // ===== Optimistic Success UI =====
  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {done.eligibilityPassed && (
          /* Celebration sparkles animated via CSS */
          <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
            <div className="absolute inset-0 animate-[confetti-fall_3s_ease-out] opacity-0">
              {Array.from({ length: 20 }).map((_, i) => (
                <span
                  key={i}
                  className="absolute h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: ["#FF6B00", "#FF8C38", "#FFB07C", "#FFD4B0", "#FFFFFF"][i % 5],
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animation: `confetti-fall ${2 + Math.random() * 2}s ease-out ${Math.random() * 0.5}s forwards`,
                    opacity: 0,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <Card className="relative overflow-hidden border-border shadow-card">
          {/* Header gradient */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand via-emerald-400 to-brand" />

          <CardContent className="py-12 text-center">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
            >
              {done.eligibilityPassed ? (
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                  <Sparkles className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
              ) : (
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </motion.div>

            {/* Title */}
            <motion.p
              className="mt-4 text-2xl font-bold text-foreground"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {done.eligibilityPassed ? "Application submitted successfully!" : "Application received"}
            </motion.p>

            <motion.p
              className="mt-2 max-w-md mx-auto text-sm text-muted-foreground"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {done.eligibilityPassed
                ? "You're eligible for the next step. Your interview link is ready."
                : "Your responses have been recorded. The hiring team will be in touch if you progress."}
            </motion.p>

            {/* Eligible: Interview card */}
            {done.eligibilityPassed && done.interviewUrl && (
              <motion.div
                className="mx-auto mt-6 max-w-sm rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/20"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                      Interview link
                    </span>
                  </div>
                  {done.expiresAt && (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                      <Clock className="h-3 w-3" />
                      Expires {new Date(done.expiresAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    className="flex-1 rounded-full bg-brand hover:bg-brand/90"
                    onClick={() => router.push(done.interviewUrl!)}
                  >
                    Start interview
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-10 w-10 rounded-full p-0"
                    onClick={() => {
                      navigator.clipboard.writeText(done.interviewUrl!);
                      toast.success("Link copied");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Not eligible: info */}
            {!done.eligibilityPassed && (
              <motion.div
                className="mx-auto mt-6 max-w-sm rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Unfortunately, you don&apos;t meet the eligibility criteria for this role.
                </p>
              </motion.div>
            )}

            <motion.div
              className="mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                variant="ghost"
                className="rounded-full"
                onClick={() => router.push("/")}
              >
                Back to home
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ===== Application Form =====
  return (
    <Card className="relative border-border shadow-card">
      <CardHeader>
        <CardTitle>Application form</CardTitle>
        <p className="text-sm text-muted-foreground">{job.title}</p>
      </CardHeader>
      <CardContent>
        {/* Eligibility preview — appears when rules exist */}
        {eligibilityRules.length > 0 && (
          <EligibilityPreview
            rules={eligibilityRules}
            formValues={formValues}
            className="mb-6"
          />
        )}

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
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        setFormValues((prev) => ({ ...prev, [field.fieldKey]: file }));
                      }}
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
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    defaultValue=""
                    onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
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
                    onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
                  />
                )}
              </div>
            ))}
          <Button
            type="submit"
            className="w-full rounded-full bg-brand text-brand-foreground hover:bg-brand/90 transition-transform active:scale-[0.98]"
            disabled={submitting}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Submitting…
              </span>
            ) : (
              "Submit application"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}