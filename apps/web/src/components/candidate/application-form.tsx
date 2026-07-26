"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { useHireLoop } from "@/lib/store/provider";
import { isDocumentFieldType } from "@/lib/form-fields";
import type { JobRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EligibilityPreview } from "@/components/candidate/eligibility-preview";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";

const DOCUMENT_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.webp,.gif,.rtf,.odt,.ods,application/*,image/*,text/*";

type SubmissionResult = {
  eligibilityPassed: boolean;
  interviewUrl?: string;
  expiresAt?: string;
};

export function ApplicationForm({ job }: { job: JobRole }) {
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const { submitApplication } = useHireLoop();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<SubmissionResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string | number | File | null>>({});

  const eligibilityRules = job.eligibilityRules ?? [];

  const handleFieldChange = (fieldKey: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [fieldKey]: value }));
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

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
        toast.success("Application submitted. Your interview is ready.");
      } else {
        toast.info("Application received.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not submit application";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  // ===== Optimistic Success UI =====
  if (done) {
    return (
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,15,15,0.06)] sm:p-8"
      >
        <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
        >
              {done.eligibilityPassed ? (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                  <PhosphorIcon name="CheckCircle2" className="h-6 w-6 text-emerald-700" />
                </div>
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100">
                  <PhosphorIcon name="CheckCircle2" className="h-6 w-6 text-slate-600" />
                </div>
              )}
        </motion.div>

        <motion.p
              className="mt-5 text-2xl font-semibold tracking-tight text-slate-900"
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
        >
              {done.eligibilityPassed ? "Your interview is ready" : "Application received"}
        </motion.p>

        <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
              {done.eligibilityPassed
                ? "You meet the role requirements. Continue when you are ready for the structured interview."
                : "Your responses have been recorded. The hiring team will be in touch if you progress."}
        </p>

        {done.eligibilityPassed && done.interviewUrl && (
              <div className="mt-8 rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PhosphorIcon name="ExternalLink" className="h-4 w-4 text-[#F97316]" />
                    <span className="text-sm font-medium text-slate-900">
                      Interview link
                    </span>
                  </div>
                  {done.expiresAt && (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <PhosphorIcon name="Clock" className="h-3 w-3" />
                      Expires {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(done.expiresAt))}
                    </span>
                  )}
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button
                    className="h-11 flex-1 rounded-full bg-[#F97316] px-5 text-white hover:bg-[#EA6B2D]"
                    onClick={() => router.push(done.interviewUrl!)}
                  >
                    Start interview
                    <PhosphorIcon name="ArrowRight" className="ml-1.5 h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 rounded-full px-4 sm:w-11 sm:p-0"
                    aria-label="Copy interview link"
                    onClick={() => {
                      void navigator.clipboard.writeText(done.interviewUrl!);
                      toast.success("Link copied");
                    }}
                  >
                    <PhosphorIcon name="Copy" className="h-4 w-4" />
                    <span className="sm:sr-only">Copy link</span>
                  </Button>
                </div>
              </div>
        )}

        {!done.eligibilityPassed && (
              <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm leading-6 text-amber-900">
                  Your responses do not currently meet this role&apos;s eligibility requirements.
                </p>
              </div>
        )}

        <div className="mt-6">
              <Button
                variant="ghost"
                className="h-11 rounded-full px-5"
                onClick={() => router.push("/")}
              >
                Back to home
              </Button>
        </div>
      </motion.div>
    );
  }

  // ===== Application Form =====
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,15,15,0.06)] sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">Application</h2>
        <p className="mt-1 text-sm text-slate-600">Complete all required fields for {job.title}.</p>
        {/* Eligibility preview &mdash; appears when rules exist */}
        {eligibilityRules.length > 0 && (
          <EligibilityPreview
            rules={eligibilityRules}
            formValues={formValues}
            className="mt-6"
          />
        )}

        <form onSubmit={handleSubmit} encType="multipart/form-data" className="mt-8 space-y-5">
          {job.formFields
            .toSorted((a, b) => a.order - b.order)
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
                      className="min-h-11 rounded-2xl px-4"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        setFormValues((prev) => ({ ...prev, [field.fieldKey]: file }));
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      PDF, Word, Excel, PowerPoint, images, or text. Maximum 10 MB.
                    </p>
                  </>
                ) : field.type === "dropdown" ? (
                  <select
                    id={field.fieldKey}
                    name={field.fieldKey}
                    required={field.required}
                    className="min-h-11 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm outline-none transition-colors duration-200 focus-visible:border-[#F97316] focus-visible:ring-2 focus-visible:ring-[#F97316]/20"
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
                    className="min-h-11 rounded-2xl px-4"
                    onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
                  />
                )}
              </div>
            ))}
          <Button
            type="submit"
            className="h-11 w-full rounded-full bg-[#F97316] px-6 font-semibold text-white transition-colors duration-200 hover:bg-[#EA6B2D] motion-reduce:transition-none"
            disabled={submitting}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white motion-reduce:animate-none" />
                Submitting…
              </span>
            ) : (
              "Submit application"
            )}
          </Button>
          {submitError ? (
            <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              {submitError}
            </p>
          ) : null}
        </form>
    </div>
  );
}