"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, Globe, GitBranch } from "lucide-react";
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

  const emailError = email && !email.includes("@") ? "Enter a valid work email" : "";
  const passwordError = password && password.length < 8 ? "Password must be at least 8 characters" : "";

  async function handleSignIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await browserSignInWithPassword(email, password, "org_admin");
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
      router.push("/admin");
    } catch (err) {
      if (isNextRedirectError(err)) throw err;
      toast.error("Sign in failed. Check your connection and try again.");
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
    <Card className="w-full max-w-md rounded-2xl border border-border focus-within:ring-2 focus-within:ring-brand">
      <CardHeader className="text-center pb-2">
        <div className="mb-4 flex justify-center">
          <Logo href="/" />
        </div>
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription className="text-muted-foreground">
          Sign in to manage jobs, review candidates, and move your pipeline
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Auth method toggle */}
        <div className="flex gap-2 bg-muted rounded-lg p-1" role="tablist">
          <button
            role="tab"
            aria-selected={signInMethod === "password"}
            onClick={() => setSignInMethod("password")}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              signInMethod === "password"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Password
          </button>
          <button
            role="tab"
            aria-selected={signInMethod === "otp"}
            onClick={() => setSignInMethod("otp")}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              signInMethod === "otp"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Magic link
          </button>
        </div>

        {signInMethod === "password" ? (
          <form onSubmit={handleSignIn} className="space-y-5" noValidate>
            {/* Email field */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">
                Work email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  disabled={loading}
                  className="h-11 pl-10 pr-4"
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? "email-error" : undefined}
                />
              </div>
              {emailError && (
                <p id="email-error" className="text-sm text-red-600 dark:text-red-400" role="alert">
                  {emailError}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                We&apos;ll send a sign-in link if this email exists
              </p>
            </div>

            {/* Password field */}
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
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  required
                  disabled={loading}
                  className="h-11 pl-10 pr-12"
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? "password-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordError && (
                <p id="password-error" className="text-sm text-red-600 dark:text-red-400" role="alert">
                  {passwordError}
                </p>
              )}
            </div>

            {/* Sign in button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-full bg-brand text-brand-foreground font-semibold hover:bg-brand/90 active:scale-[0.98] transition-transform"
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Enter your work email and we&apos;ll send a magic sign-in link
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
                  disabled={loading}
                  className="h-11"
                />
              </div>
              <Button
                type="submit"
                disabled={loading || !email}
                className="w-full h-11 rounded-full bg-brand text-brand-foreground font-semibold hover:bg-brand/90"
              >
                {loading ? "Sending..." : "Send magic link"}
              </Button>
            </form>
          </div>
        )}

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <span className="relative flex justify-center text-xs text-muted-foreground bg-background px-2">
            All sign-in options
          </span>
        </div>

        {/* SSO Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            className="h-11 gap-2"
            onClick={() => toast.info("Google SSO not configured yet")}
          >
            <Globe className="h-4 w-4" />
            <span>Google</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            className="h-11 gap-2"
            onClick={() => toast.info("GitHub SSO not configured yet")}
          >
            <GitBranch className="h-4 w-4" />
            <span>GitHub</span>
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
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