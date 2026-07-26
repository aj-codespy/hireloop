"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { storeCompanyDetailsAction, storeAdminUserDetailsAction, storePlanSelectionAction, completeAdminSignupAction } from "@/app/actions/multi-step-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";

export function MultiStepSignUp() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Form states
  const [companyDetails, setCompanyDetails] = useState({
    orgName: "",
    orgSlug: "",
    logoUrl: "",
    defaultDepartment: "",
  });
  
  const [adminUser, setAdminUser] = useState({
    email: "",
    password: "",
    fullName: "",
    confirmPassword: "",
  });
  
  const [planSelection, setPlanSelection] = useState({
    planId: "",
    planName: "",
    price: 0,
    billingCycle: "monthly" as const,
  });

  // Step 1: Company Details
  const handleCompanyDetailsComplete = async () => {
    setError("");
    setIsLoading(true);
    try {
      // Generate slug if not provided
      const orgSlug = companyDetails.orgSlug || 
        companyDetails.orgName
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50);
      
      const details = { ...companyDetails, orgSlug };
      setCompanyDetails(details);
      
      const result = await storeCompanyDetailsAction(details);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      
      if (result.data?.orgSlug) {
        const { orgSlug } = result.data;
        setCompanyDetails(prev => ({ ...prev, orgSlug }));
      }
      
      setCurrentStep(2);
    } catch {
      const message = "Failed to save company details";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Admin User Details
  const handleAdminUserComplete = async () => {
    setError("");
    setIsLoading(true);
    try {
      if (!companyDetails.orgSlug) {
        setError("Organization slug is required");
        toast.error("Organization slug is required");
        return;
      }
      
      if (adminUser.password !== adminUser.confirmPassword) {
        setError("Passwords do not match");
        toast.error("Passwords do not match");
        return;
      }
      
      const result = await storeAdminUserDetailsAction({
        email: adminUser.email.toLowerCase().trim(),
        password: adminUser.password,
        fullName: adminUser.fullName.trim(),
        confirmPassword: adminUser.confirmPassword,
        orgSlug: companyDetails.orgSlug,
      });
      
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      
      if (result.data) {
        const { email } = result.data;
        setAdminUser(prev => ({ 
          ...prev, 
          email,
        }));
      }
      
      setCurrentStep(3);
    } catch {
      const message = "Failed to save admin user details";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Plan Selection
  const handlePlanSelectionComplete = async () => {
    setError("");
    setIsLoading(true);
    const selectedPlan = {
      planId: "pro",
      planName: "Pro Plan",
      price: 29,
      billingCycle: "monthly" as const,
    };
    setPlanSelection(selectedPlan);
    try {
      const result = await storePlanSelectionAction(selectedPlan);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      
      setCurrentStep(4);
    } catch {
      const message = "Failed to save plan selection";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 4: Complete Signup
  const handleCompleteSignup = async () => {
    setError("");
    setIsLoading(true);
    try {
      const result = await completeAdminSignupAction({
        email: adminUser.email,
        password: adminUser.password,
        fullName: adminUser.fullName,
        orgName: companyDetails.orgName,
        orgSlug: companyDetails.orgSlug,
        planId: planSelection.planId,
        planName: planSelection.planName,
        price: planSelection.price,
        billingCycle: planSelection.billingCycle,
      });
      
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      
      // Clear saved state
      localStorage.removeItem("signup_company");
      localStorage.removeItem("signup_user");
      localStorage.removeItem("signup_plan");
      localStorage.removeItem("signup_step");
      
      // Redirect to welcome page with org ID
      if (result.data?.orgId) {
        router.push(`/admin/welcome?orgId=${result.data.orgId}`);
      }
    } catch {
      const message = "Failed to complete signup";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <CardHeader className="pb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F97316]">Step 1 of 4</p>
              <CardTitle className="text-2xl font-bold tracking-[-0.025em]">Company details</CardTitle>
              <CardDescription className="leading-6">Create the workspace your hiring team will use.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization name</Label>
                <Input
                  id="orgName"
                  value={companyDetails.orgName}
                  onChange={(e) => setCompanyDetails(prev => ({ ...prev, orgName: e.target.value }))}
                  placeholder="Acme Corporation"
                  required
                  name="organization"
                  autoComplete="organization"
                  className="h-12 rounded-xl border-[#ECECEC] focus-visible:border-[#F97316] focus-visible:ring-[#F97316]/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgSlug">Workspace URL (optional)</Label>
                <Input
                  id="orgSlug"
                  value={companyDetails.orgSlug}
                  onChange={(e) => setCompanyDetails(prev => ({ ...prev, orgSlug: e.target.value }))}
                  placeholder="acme-corp"
                  autoCapitalize="none"
                  spellCheck={false}
                  className="h-12 rounded-xl border-[#ECECEC] focus-visible:border-[#F97316] focus-visible:ring-[#F97316]/20"
                />
                <p className="text-xs leading-5 text-[#6B7280]">Used to create your team&apos;s workspace address.</p>
              </div>
              {error ? <p className="text-sm text-[#DC2626]" role="alert">{error}</p> : null}
              <Button 
                onClick={handleCompanyDetailsComplete}
                disabled={isLoading || !companyDetails.orgName}
                className="h-12 w-full rounded-full bg-[#F97316] font-semibold text-white hover:bg-[#EA6B2D]"
              >
                {isLoading ? <PhosphorIcon name="Loader2" /> : null}
                <span>Continue</span>
              </Button>
            </CardContent>
          </div>
        );
      
      case 2:
        return (
          <div>
            <CardHeader className="pb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F97316]">Step 2 of 4</p>
              <CardTitle className="text-2xl font-bold tracking-[-0.025em]">Admin account</CardTitle>
              <CardDescription className="leading-6">Set up the first administrator for this workspace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={adminUser.fullName}
                  onChange={(e) => setAdminUser(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="John Doe"
                  required
                  name="name"
                  autoComplete="name"
                  className="h-12 rounded-xl border-[#ECECEC] focus-visible:border-[#F97316] focus-visible:ring-[#F97316]/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Work email</Label>
                <Input
                  id="email"
                  type="email"
                  value={adminUser.email}
                  onChange={(e) => setAdminUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="admin@acme.com"
                  required
                  name="email"
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
                  type="password"
                  value={adminUser.password}
                  onChange={(e) => setAdminUser(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="h-12 rounded-xl border-[#ECECEC] focus-visible:border-[#F97316] focus-visible:ring-[#F97316]/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={adminUser.confirmPassword}
                  onChange={(e) => setAdminUser(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="h-12 rounded-xl border-[#ECECEC] focus-visible:border-[#F97316] focus-visible:ring-[#F97316]/20"
                />
              </div>
              {error ? <p className="text-sm text-[#DC2626]" role="alert">{error}</p> : null}
              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  disabled={isLoading}
                  className="h-11 flex-1 rounded-full"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleAdminUserComplete}
                  disabled={isLoading || !adminUser.email || !adminUser.password || adminUser.password !== adminUser.confirmPassword}
                  className="h-11 flex-1 rounded-full bg-[#F97316] font-semibold text-white hover:bg-[#EA6B2D]"
                >
                  {isLoading ? <PhosphorIcon name="Loader2" /> : null}
                  <span>Continue</span>
                </Button>
              </div>
            </CardContent>
          </div>
        );
      
      case 3:
        return (
          <div>
            <CardHeader className="pb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F97316]">Step 3 of 4</p>
              <CardTitle className="text-2xl font-bold tracking-[-0.025em]">Plan selection</CardTitle>
              <CardDescription className="leading-6">Review the plan for your workspace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-[#ECECEC] bg-[#FAFAF9] p-5">
                <h3 className="font-semibold">Pro plan <span className="font-normal text-[#6B7280]">$29/month</span></h3>
                <p className="mt-2 text-sm leading-6 text-[#6B7280]">For growing hiring teams.</p>
                <ul className="mt-4 space-y-2 text-sm">
                  {["Up to 10 team members", "Unlimited jobs", "Voice interviews", "AI assistance with human review"].map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <PhosphorIcon name="Check" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              {error ? <p className="text-sm text-[#DC2626]" role="alert">{error}</p> : null}
              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  disabled={isLoading}
                  className="h-11 flex-1 rounded-full"
                >
                  Back
                </Button>
                <Button 
                  onClick={() => {
                    handlePlanSelectionComplete();
                  }}
                  disabled={isLoading}
                  className="h-11 flex-1 rounded-full bg-[#F97316] font-semibold text-white hover:bg-[#EA6B2D]"
                >
                  {isLoading ? <PhosphorIcon name="Loader2" /> : null}
                  <span>Continue with Pro plan</span>
                </Button>
              </div>
            </CardContent>
          </div>
        );
      
      case 4:
        return (
          <div>
            <CardHeader className="pb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F97316]">Step 4 of 4</p>
              <CardTitle className="text-2xl font-bold tracking-[-0.025em]">Review setup</CardTitle>
              <CardDescription className="leading-6">Confirm the workspace details before continuing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="space-y-4 rounded-2xl border border-[#ECECEC] bg-[#FAFAF9] p-5 text-sm">
                <div>
                  <dt className="text-[#6B7280]">Organization</dt>
                  <dd className="mt-1 font-medium">{companyDetails.orgName}</dd>
                </div>
                <div>
                  <dt className="text-[#6B7280]">Administrator</dt>
                  <dd className="mt-1 font-medium">{adminUser.fullName} ({adminUser.email})</dd>
                </div>
                <div>
                  <dt className="text-[#6B7280]">Plan</dt>
                  <dd className="mt-1 font-medium">Pro plan, $29/month</dd>
                </div>
              </dl>
              {error ? <p className="text-sm text-[#DC2626]" role="alert">{error}</p> : null}
              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setCurrentStep(3)}
                  disabled={isLoading}
                  className="h-11 flex-1 rounded-full"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleCompleteSignup}
                  disabled={isLoading}
                  className="h-11 flex-1 rounded-full bg-[#F97316] font-semibold text-white hover:bg-[#EA6B2D]"
                >
                  {isLoading ? <PhosphorIcon name="Loader2" /> : null}
                  <span>Create organization</span>
                </Button>
              </div>
            </CardContent>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <Card className="w-full rounded-3xl border border-[#ECECEC] bg-white shadow-[0_12px_40px_rgba(15,15,15,0.08)]">
        {renderStep()}
      </Card>
    </div>
  );
}