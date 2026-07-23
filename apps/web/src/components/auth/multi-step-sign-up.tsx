"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { storeCompanyDetailsAction, storeAdminUserDetailsAction, storePlanSelectionAction, completeAdminSignupAction } from "@/app/actions/multi-step-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MultiStepSignUp() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
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
        toast.error(result.error);
        return;
      }
      
      if (result.data?.orgSlug) {
        setCompanyDetails(prev => ({ ...prev, orgSlug: result.data.orgSlug }));
      }
      
      setCurrentStep(2);
    } catch (error) {
      toast.error("Failed to save company details");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Admin User Details
  const handleAdminUserComplete = async () => {
    setIsLoading(true);
    try {
      if (!companyDetails.orgSlug) {
        toast.error("Organization slug is required");
        return;
      }
      
      if (adminUser.password !== adminUser.confirmPassword) {
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
        toast.error(result.error);
        return;
      }
      
      if (result.data) {
        setAdminUser(prev => ({ 
          ...prev, 
          email: result.data.email,
        }));
      }
      
      setCurrentStep(3);
    } catch (error) {
      toast.error("Failed to save admin user details");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Plan Selection
  const handlePlanSelectionComplete = async () => {
    setIsLoading(true);
    try {
      const result = await storePlanSelectionAction(planSelection);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      setCurrentStep(4);
    } catch (error) {
      toast.error("Failed to save plan selection");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 4: Complete Signup
  const handleCompleteSignup = async () => {
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
    } catch (error) {
      toast.error("Failed to complete signup");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <CardHeader>
              <CardTitle>Company Details</CardTitle>
              <CardDescription>Create your organization profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  value={companyDetails.orgName}
                  onChange={(e) => setCompanyDetails(prev => ({ ...prev, orgName: e.target.value }))}
                  placeholder="Acme Corporation"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgSlug">Organization Slug (optional)</Label>
                <Input
                  id="orgSlug"
                  value={companyDetails.orgSlug}
                  onChange={(e) => setCompanyDetails(prev => ({ ...prev, orgSlug: e.target.value }))}
                  placeholder="acme-corp"
                />
              </div>
              <Button 
                onClick={handleCompanyDetailsComplete}
                disabled={isLoading || !companyDetails.orgName}
                className="w-full"
              >
                {isLoading ? "Creating..." : "Continue"}
              </Button>
            </CardContent>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <CardHeader>
              <CardTitle>Admin User Details</CardTitle>
              <CardDescription>Set up your admin account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={adminUser.fullName}
                  onChange={(e) => setAdminUser(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Work Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={adminUser.email}
                  onChange={(e) => setAdminUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="admin@acme.com"
                  required
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
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleAdminUserComplete}
                  disabled={isLoading || !adminUser.email || !adminUser.password || adminUser.password !== adminUser.confirmPassword}
                  className="flex-1"
                >
                  {isLoading ? "Creating..." : "Continue"}
                </Button>
              </div>
            </CardContent>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <CardHeader>
              <CardTitle>Plan Selection</CardTitle>
              <CardDescription>Choose your subscription plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Pro Plan - $29/month</h3>
                <p className="text-sm text-muted-foreground mb-4">Perfect for growing teams</p>
                <ul className="text-sm space-y-1">
                  <li>• Up to 10 team members</li>
                  <li>• Unlimited jobs</li>
                  <li>• Voice interviews</li>
                  <li>• AI-powered screening</li>
                </ul>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  onClick={() => {
                    setPlanSelection({
                      planId: "pro",
                      planName: "Pro Plan",
                      price: 29,
                      billingCycle: "monthly",
                    });
                    handlePlanSelectionComplete();
                  }}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? "Selecting..." : "Continue with Pro Plan"}
                </Button>
              </div>
            </CardContent>
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-6">
            <CardHeader>
              <CardTitle>Almost Done!</CardTitle>
              <CardDescription>Review your information and complete setup</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <div>
                  <span className="font-semibold">Organization:</span> {companyDetails.orgName}
                </div>
                <div>
                  <span className="font-semibold">Admin:</span> {adminUser.fullName} ({adminUser.email})
                </div>
                <div>
                  <span className="font-semibold">Plan:</span> Pro Plan - $29/month
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setCurrentStep(3)}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleCompleteSignup}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? "Creating Organization..." : "Create Organization & Continue"}
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
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-2xl border-border shadow-card-hover">
        {renderStep()}
      </Card>
    </div>
  );
}