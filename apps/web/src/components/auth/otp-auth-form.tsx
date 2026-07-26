"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { finalizeOtpSignupAction } from "@/app/actions/auth";
import { isNextRedirectError } from "@/lib/auth/errors";
import {
  browserSendOtp,
  browserVerifyOtp,
} from "@/lib/auth/browser-auth";
import { validateOtpCode } from "@/lib/auth/validation";
import type { AccountType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";

export function OtpAuthForm({
  mode,
  accountType,
  signupFields,
}: {
  mode: "signin" | "signup";
  accountType: AccountType;
  signupFields?: {
    fullName: string;
    phone?: string;
    orgName?: string;
  };
}) {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendCode() {
    setError("");
    if (!email.trim()) {
      const message = "Enter your email address.";
      setError(message);
      toast.error(message);
      return;
    }
    if (mode === "signup") {
      if (!signupFields?.fullName?.trim()) {
        toast.error("Enter your full name before requesting a code.");
        return;
      }
      if (accountType === "org_admin" && !signupFields.orgName?.trim()) {
        toast.error("Enter your organization name before requesting a code.");
        return;
      }
    }

    setLoading(true);
    try {
      const result = await browserSendOtp(email.trim(), mode);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      setStep("code");
      toast.success("Check your email for a 6-digit sign-in code.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const codeError = validateOtpCode(code);
    if (codeError) {
      setError(codeError);
      toast.error(codeError);
      return;
    }

    setLoading(true);
    try {
      const result = await browserVerifyOtp(email.trim(), code.trim(), accountType);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      if (mode === "signup") {
        const finalize = await finalizeOtpSignupAction({
          accountType,
          fullName: signupFields?.fullName,
          phone: signupFields?.phone,
          orgName: signupFields?.orgName,
        });
        if (finalize?.error) {
          setError(finalize.error);
          toast.error(finalize.error);
          return;
        }
      }

      router.refresh();
      router.push(accountType === "org_admin" ? "/admin" : "/candidate/profile");
    } catch (err) {
      if (isNextRedirectError(err)) throw err;
      const message = "Could not verify the code.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  if (step === "email") {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="otp-email">Email</Label>
          <Input
            id="otp-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "otp-error" : undefined}
            className="h-12 rounded-xl border-[#ECECEC] focus-visible:border-[#F97316] focus-visible:ring-[#F97316]/20"
          />
        </div>
        {error ? <p id="otp-error" className="text-sm text-[#DC2626]" role="alert">{error}</p> : null}
        <Button
          type="button"
          disabled={loading}
          className="h-12 w-full rounded-full bg-[#F97316] font-semibold text-white hover:bg-[#EA6B2D]"
          onClick={sendCode}
        >
          {loading ? <PhosphorIcon name="Loader2" /> : null}
          <span>Send sign-in code</span>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={verifyCode} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        We sent a code to <strong>{email}</strong>.{" "}
        <button
          type="button"
          className="min-h-11 rounded-full px-2 text-[#F97316] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-[#F97316]"
          onClick={() => setStep("email")}
        >
          Change email
        </button>
      </p>
      <div className="space-y-2">
        <Label htmlFor="otp-code">6-digit code</Label>
        <Input
          id="otp-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
          placeholder="123456"
          required
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "otp-code-error" : undefined}
          className="h-12 rounded-xl border-[#ECECEC] text-center text-lg tracking-widest focus-visible:border-[#F97316] focus-visible:ring-[#F97316]/20"
        />
      </div>
      {error ? <p id="otp-code-error" className="text-sm text-[#DC2626]" role="alert">{error}</p> : null}
      <Button
        type="submit"
        disabled={loading}
        className="h-12 w-full rounded-full bg-[#F97316] font-semibold text-white hover:bg-[#EA6B2D]"
      >
        {loading ? <PhosphorIcon name="Loader2" /> : null}
        <span>Verify and continue</span>
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="h-11 w-full rounded-full"
        disabled={loading}
        onClick={sendCode}
      >
        Resend code
      </Button>
    </form>
  );
}
