"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { finalizeOtpSignupAction, signInAction } from "@/app/actions/auth";
import { AuthDivider, AuthMethodTabs } from "@/components/auth/auth-method-tabs";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { OtpAuthForm } from "@/components/auth/otp-auth-form";
import { isNextRedirectError } from "@/lib/auth/errors";
import { browserSignUp } from "@/lib/auth/browser-auth";
import { passwordsMatch, validatePassword } from "@/lib/auth/validation";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";

export function CandidateAuthForm({ defaultTab = "signin" }: { defaultTab?: "signin" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [signInMethod, setSignInMethod] = useState<"password" | "otp">("password");
  const [signUpMethod, setSignUpMethod] = useState<"password" | "otp">("password");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) toast.error(decodeURIComponent(error));
  }, [searchParams]);

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const result = await signInAction(
        String(form.get("email")),
        String(form.get("password")),
        "candidate"
      );
      if (result?.error) {
        toast.error(result.error);
        return;
      }
    } catch (err) {
      if (isNextRedirectError(err)) throw err;
      toast.error("Sign in failed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    const confirmPassword = String(form.get("confirmPassword"));
    const passwordError = validatePassword(password);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }
    if (!passwordsMatch(password, confirmPassword)) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const email = String(form.get("email"));
      const signUp = await browserSignUp(email, password);
      if (signUp.error) {
        toast.error(signUp.error);
        return;
      }
      const finalize = await finalizeOtpSignupAction({
        accountType: "candidate",
        fullName: String(form.get("fullName")),
        phone: String(form.get("phone") || "") || undefined,
      });
      if (finalize?.error) {
        toast.error(finalize.error);
        return;
      }
      router.refresh();
      router.push("/candidate/profile");
    } catch (err) {
      if (isNextRedirectError(err)) throw err;
      toast.error("Could not create profile.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md rounded-3xl border border-[#ECECEC] bg-white shadow-[0_12px_40px_rgba(15,15,15,0.08)]">
      <CardHeader>
        <div className="mb-5">
          <Logo href="/" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F97316]">
          Candidate portal
        </p>
        <CardTitle className="mt-2 text-2xl font-bold tracking-[-0.025em]">Your applications, one profile</CardTitle>
        <CardDescription className="text-sm leading-6 text-[#6B7280]">
          Apply to multiple jobs, record interviews, and track your status from one place.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={defaultTab}>
          <TabsList className="mb-5 grid min-h-12 w-full grid-cols-2 rounded-full bg-[#FAFAF9] p-1">
            <TabsTrigger value="signin" className="min-h-10 rounded-full">Sign in</TabsTrigger>
            <TabsTrigger value="signup" className="min-h-10 rounded-full">Create profile</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4">
            <AuthMethodTabs method={signInMethod} onChange={setSignInMethod} />
            {signInMethod === "password" ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    className="h-12 rounded-xl border-[#ECECEC] focus-visible:border-[#F97316] focus-visible:ring-[#F97316]/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    className="h-12 rounded-xl border-[#ECECEC] focus-visible:border-[#F97316] focus-visible:ring-[#F97316]/20"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full rounded-full bg-[#F97316] font-semibold tracking-[0.02em] text-white hover:bg-[#EA6B2D]"
                >
                  {loading ? (
                    <PhosphorIcon name="Loader2" />
                  ) : null}
                  <span>Sign in with password</span>
                </Button>
              </form>
            ) : (
              <OtpAuthForm mode="signin" accountType="candidate" />
            )}
            <AuthDivider />
            <GoogleSignInButton portal="candidate" intent="signin" disabled={loading} />
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                name="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
                className="h-12 rounded-xl border-[#ECECEC] focus-visible:border-[#F97316] focus-visible:ring-[#F97316]/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                inputMode="tel"
                className="h-12 rounded-xl border-[#ECECEC] focus-visible:border-[#F97316] focus-visible:ring-[#F97316]/20"
              />
            </div>

            <AuthMethodTabs method={signUpMethod} onChange={setSignUpMethod} />
            {signUpMethod === "password" ? (
              <form onSubmit={handleSignUp} className="space-y-4">
                <input type="hidden" name="fullName" value={fullName} />
                <input type="hidden" name="phone" value={phone} />
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    className="h-12 rounded-xl border-[#ECECEC] focus-visible:border-[#F97316] focus-visible:ring-[#F97316]/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    aria-describedby="candidate-password-help"
                    className="h-12 rounded-xl border-[#ECECEC] focus-visible:border-[#F97316] focus-visible:ring-[#F97316]/20"
                  />
                  <p id="candidate-password-help" className="text-xs leading-5 text-[#6B7280]">
                    Use at least 8 characters.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm password</Label>
                  <Input
                    id="signup-confirm"
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="h-12 rounded-xl border-[#ECECEC] focus-visible:border-[#F97316] focus-visible:ring-[#F97316]/20"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full rounded-full bg-[#F97316] font-semibold tracking-[0.02em] text-white hover:bg-[#EA6B2D]"
                >
                  {loading ? (
                    <PhosphorIcon name="Loader2" />
                  ) : null}
                  <span>Create profile</span>
                </Button>
              </form>
            ) : (
              <OtpAuthForm
                mode="signup"
                accountType="candidate"
                signupFields={{ fullName, phone: phone || undefined }}
              />
            )}
            <AuthDivider />
            <GoogleSignInButton portal="candidate" intent="signup" disabled={loading} />
          </TabsContent>
        </Tabs>

        <p className="mt-5 text-xs leading-6 text-[#6B7280]">
          Hiring team?{" "}
          <Link href="/admin/login" className="text-brand hover:underline">
            Admin sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
