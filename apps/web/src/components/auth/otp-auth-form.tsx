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

  async function sendCode() {
    if (!email.trim()) {
      toast.error("Enter your email address.");
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
    const codeError = validateOtpCode(code);
    if (codeError) {
      toast.error(codeError);
      return;
    }

    setLoading(true);
    try {
      const result = await browserVerifyOtp(email.trim(), code.trim(), accountType);
      if (result.error) {
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
          toast.error(finalize.error);
          return;
        }
      }

      router.refresh();
      router.push(accountType === "org_admin" ? "/admin" : "/candidate/profile");
    } catch (err) {
      if (isNextRedirectError(err)) throw err;
      toast.error("Could not verify the code.");
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
            className="h-11"
          />
        </div>
        <Button
          type="button"
          disabled={loading}
          className="h-11 w-full rounded-full bg-brand text-brand-foreground hover:bg-brand/90"
          onClick={sendCode}
        >
          {loading ? "Sending…" : "Send sign-in code"}
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
          className="text-brand hover:underline"
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
          className="h-11 text-center text-lg tracking-widest"
        />
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="h-11 w-full rounded-full bg-brand text-brand-foreground hover:bg-brand/90"
      >
        {loading ? "Verifying…" : "Verify & continue"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="w-full"
        disabled={loading}
        onClick={sendCode}
      >
        Resend code
      </Button>
    </form>
  );
}
