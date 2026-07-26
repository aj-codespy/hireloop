"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";
import { browserSignInWithPassword, browserSendOtp } from "@/lib/auth/browser-auth";
import { isNextRedirectError } from "@/lib/auth/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/brand/logo";

export function AdminSignInForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [signInMethod, setSignInMethod] = useState<"password" | "otp">("password");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");

  const emailError = email && !email.includes("@") ? "Enter a valid work email" : "";
  const passwordError = password && password.length < 8 ? "Password must be at least 8 characters" : "";

  async function handleSignIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    setLoading(true);
    try {
      const result = await browserSignInWithPassword(email, password, "org_admin");
      if (result.error) {
        setFormError(result.error);
        toast.error(result.error);
        return;
      }
      router.refresh();
      router.push("/admin");
    } catch (err) {
      if (isNextRedirectError(err)) throw err;
      const message = "Sign in failed. Check your connection and try again.";
      setFormError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendMagicLink(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await browserSendOtp(email.trim(), "signin");
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Check your email for a 6-digit sign-in code.");
      setSignInMethod("otp");
    } catch {
      toast.error("Could not send magic link. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md rounded-3xl border border-[#ECECEC] bg-white shadow-[0_12px_40px_rgba(15,15,15,0.08)]">
      <CardHeader className="pb-3">
        <div className="mb-5">
          <Logo href="/" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F97316]">
          Hiring team
        </p>
        <CardTitle className="mt-2 text-2xl font-bold tracking-[-0.025em]">Continue your work</CardTitle>
        <CardDescription className="text-sm leading-6 text-[#6B7280]">
          Manage your pipeline, review candidates, and move roles forward.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex gap-1 rounded-full bg-[#FAFAF9] p-1" role="tablist" aria-label="Sign-in method">
          <button
            role="tab"
            aria-selected={signInMethod === "password"}
            onClick={() => setSignInMethod("password")}
            className={`min-h-11 flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F97316] ${
              signInMethod === "password"
                ? "bg-white text-[#111827] shadow-sm"
                : "text-[#6B7280] hover:text-[#111827]"
            }`}
          >
            Password
          </button>
          <button
            role="tab"
            aria-selected={signInMethod === "otp"}
            onClick={() => setSignInMethod("otp")}
            className={`min-h-11 flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F97316] ${
              signInMethod === "otp"
                ? "bg-white text-[#111827] shadow-sm"
                : "text-[#6B7280] hover:text-[#111827]"
            }`}
          >
            Email code
          </button>
        </div>

        {signInMethod === "password" ? (
          <form onSubmit={handleSignIn} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">
                Work email
              </Label>
              <div className="relative">
                <PhosphorIcon name="Mail" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  disabled={loading}
                  className="h-12 rounded-xl border-[#ECECEC] pl-10 pr-4 focus-visible:border-[#F97316] focus-visible:ring-[#F97316]/20"
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? "email-error" : undefined}
                />
              </div>
              {emailError && (
                <p id="email-error" className="text-sm text-red-600 dark:text-red-400" role="alert">
                  {emailError}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-brand hover:underline focus-ring rounded-sm"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <PhosphorIcon name="Lock" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  required
                  autoComplete="current-password"
                  disabled={loading}
                  className="h-12 rounded-xl border-[#ECECEC] pl-10 pr-12 focus-visible:border-[#F97316] focus-visible:ring-[#F97316]/20"
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? "password-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-[#6B7280] hover:text-[#111827] focus-visible:outline-2 focus-visible:outline-[#F97316]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <PhosphorIcon name="EyeOff" className="h-4 w-4" /> : <PhosphorIcon name="Eye" className="h-4 w-4" />}
                </button>
              </div>
              {passwordError && (
                <p id="password-error" className="text-sm text-red-600 dark:text-red-400" role="alert">
                  {passwordError}
                </p>
              )}
            </div>

            {formError ? (
              <p className="text-sm text-[#DC2626]" role="alert">
                {formError}
              </p>
            ) : null}
            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-full bg-[#F97316] font-semibold tracking-[0.02em] text-white hover:bg-[#EA6B2D] focus-visible:ring-[#F97316]/30 motion-reduce:transform-none"
            >
              {loading ? (
                <PhosphorIcon name="Loader2" />
              ) : null}
              <span>Sign in</span>
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-[#6B7280]">
              Enter your work email and we&apos;ll send a six-digit sign-in code.
            </p>
            <form onSubmit={handleSendMagicLink} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="otp-email" className="text-sm font-medium">
                  Work email
                </Label>
                <Input
                  id="otp-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  disabled={loading}
                  className="h-12 rounded-xl border-[#ECECEC] focus-visible:border-[#F97316] focus-visible:ring-[#F97316]/20"
                />
              </div>
              <Button
                type="submit"
                disabled={loading || !email}
                className="h-12 w-full rounded-full bg-[#F97316] font-semibold tracking-[0.02em] text-white hover:bg-[#EA6B2D]"
              >
                {loading ? (
                  <PhosphorIcon name="Loader2" />
                ) : null}
                <span>Send sign-in code</span>
              </Button>
            </form>
          </div>
        )}

        <p className="text-xs leading-6 text-[#6B7280]">
          Candidate?{" "}
          <Link href="/candidate/login" className="text-brand hover:underline focus-ring rounded-sm">
            Sign in here
          </Link>
          {" · "}
          <Link href="/login" className="text-brand hover:underline focus-ring rounded-sm">
            All portals
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}