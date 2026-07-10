"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { finalizeOtpSignupAction } from "@/app/actions/auth";
import { AuthDivider, AuthMethodTabs } from "@/components/auth/auth-method-tabs";
import { GoogleSignInButton, setOAuthOrgCookie } from "@/components/auth/google-sign-in-button";
import { OtpAuthForm } from "@/components/auth/otp-auth-form";
import { isNextRedirectError } from "@/lib/auth/errors";
import { browserSignInWithPassword, browserSignUp } from "@/lib/auth/browser-auth";
import { passwordsMatch, validatePassword } from "@/lib/auth/validation";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AdminAuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [signInMethod, setSignInMethod] = useState<"password" | "otp">("password");
  const [signUpMethod, setSignUpMethod] = useState<"password" | "otp">("password");
  const [orgName, setOrgName] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) toast.error(decodeURIComponent(error));
  }, [searchParams]);

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const result = await browserSignInWithPassword(
        String(form.get("email")),
        String(form.get("password")),
        "org_admin"
      );
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
      router.push("/admin");
    } catch {
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
        accountType: "org_admin",
        fullName: String(form.get("fullName")),
        orgName: String(form.get("orgName")),
      });
      if (finalize?.error) {
        toast.error(finalize.error);
        return;
      }
      router.refresh();
      router.push("/admin");
    } catch (err) {
      if (isNextRedirectError(err)) throw err;
      toast.error("Could not create organization.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-border shadow-card-hover">
      <CardHeader className="text-center">
        <div className="mb-4 flex justify-center">
          <Logo href="/" />
        </div>
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>
          Sign in to manage jobs, candidates, and your hiring pipeline
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="signin">
          <TabsList className="mb-4 grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Create org</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4">
            <AuthMethodTabs method={signInMethod} onChange={setSignInMethod} />
            {signInMethod === "password" ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Work email</Label>
                  <Input id="signin-email" name="email" type="email" required className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    required
                    className="h-11"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-full bg-brand text-brand-foreground hover:bg-brand/90"
                >
                  {loading ? "Signing in…" : "Sign in with password"}
                </Button>
              </form>
            ) : (
              <OtpAuthForm mode="signin" accountType="org_admin" />
            )}
            <AuthDivider />
            <GoogleSignInButton portal="admin" intent="signin" disabled={loading} />
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization name</Label>
              <Input
                id="orgName"
                name="orgName"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
                placeholder="Acme Corp"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Your full name</Label>
              <Input
                id="fullName"
                name="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <AuthMethodTabs method={signUpMethod} onChange={setSignUpMethod} />
            {signUpMethod === "password" ? (
              <form onSubmit={handleSignUp} className="space-y-4">
                <input type="hidden" name="orgName" value={orgName} />
                <input type="hidden" name="fullName" value={fullName} />
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Work email</Label>
                  <Input id="signup-email" name="email" type="email" required className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm password</Label>
                  <Input
                    id="signup-confirm"
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={8}
                    className="h-11"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-full bg-brand text-brand-foreground hover:bg-brand/90"
                >
                  {loading ? "Creating…" : "Create organization"}
                </Button>
              </form>
            ) : (
              <OtpAuthForm
                mode="signup"
                accountType="org_admin"
                signupFields={{ fullName, orgName }}
              />
            )}
            <AuthDivider />
            <GoogleSignInButton
              portal="admin"
              intent="signup"
              disabled={loading}
              onBeforeOAuth={() => {
                if (!orgName.trim()) {
                  toast.error("Enter your organization name before continuing with Google.");
                  return false;
                }
                setOAuthOrgCookie(orgName.trim());
                return true;
              }}
            />
          </TabsContent>
        </Tabs>

        <p className="mt-4 text-center text-xs text-muted-foreground">
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
