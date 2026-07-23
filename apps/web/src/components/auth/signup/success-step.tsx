"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { completeAdminSignupAction } from "@/app/actions/multi-step-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, ArrowRight, Building, Users, ClipboardList, CreditCard, Clock } from "lucide-react";

export function SuccessStep() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const orgSlug = searchParams.get('orgSlug') || "";
  const email = searchParams.get('email') || "";
  const planName = searchParams.get('planName') || "";
  const planPrice = searchParams.get('planPrice') ? parseFloat(searchParams.get('planPrice')!) : 0;
  const planId = searchParams.get('planId') || "";
  const [signupComplete, setSignupComplete] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    if (!orgSlug) {
      router.push('/auth/signup?step=3');
      return;
    }

    if (signupComplete && orgId) {
      router.push(`/admin/welcome?orgId=${orgId}`);
      return;
    }

    if (!email || !planName) {
      const savedEmail = localStorage.getItem('signup_email');
      const savedPlanName = localStorage.getItem('signup_plan_name');
      
      if (!savedEmail || !savedPlanName) {
        router.push('/auth/signup?step=3');
        return;
      }
    }
  }, [orgSlug, email, planName, signupComplete, orgId, router]);

  const handleCompleteSignup = async () => {
    setIsLoading(true);
    
    try {
      const adminEmail = email || localStorage.getItem('signup_email') || "";
      const fullName = localStorage.getItem('signup_full_name') || "";
      const orgName = localStorage.getItem('signup_org_name') || orgSlug;
      
      const result = await completeAdminSignupAction({
        email: adminEmail,
        password: localStorage.getItem('signup_password') || "",
        fullName: fullName,
        orgName: orgName,
        orgSlug: orgSlug,
        planId: planId,
        planName: planName,
        price: planPrice,
        billingCycle: 'monthly',
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.data?.orgId) {
        setOrgId(result.data.orgId);
        setSignupComplete(true);
        
        localStorage.removeItem('signup_email');
        localStorage.removeItem('signup_full_name');
        localStorage.removeItem('signup_password');
        localStorage.removeItem('signup_org_name');
        localStorage.removeItem('signup_step');
        localStorage.removeItem('signup_company');
        localStorage.removeItem('signup_user');
        localStorage.removeItem('signup_plan');
        
        setTimeout(() => {
          router.push(`/admin/welcome?orgId=${result.data.orgId}`);
        }, 3000);
      }
    } catch (error) {
      toast.error("Failed to complete signup");
    } finally {
      setIsLoading(false);
    }
  };

  if (!orgSlug) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">Organization details not found. Please start over.</p>
            <Button onClick={() => router.push('/auth/signup?step=1')}>
              Start Over
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (signupComplete && orgId) {
    return (
      <div className="space-y-6">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <CardTitle className="text-2xl font-bold">
            🎉 Account Created Successfully!
          </CardTitle>
          
          <CardDescription className="text-base">
            Your organization {orgSlug} has been created and you're ready to start hiring!
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-900 mb-2">What happens next</h4>
            <ul className="space-y-2 text-sm text-green-800">
              <li>• You'll be redirected to your admin dashboard</li>
              <li>• Set up your first job posting</li>
              <li>• Add team members</li>
              <li>• Configure interview settings</li>
            </ul>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Redirecting to dashboard in 3 seconds...
            </p>
            <Button 
              onClick={() => router.push(`/admin/welcome?orgId=${orgId}`)}
              className="w-full"
            >
              Go to Dashboard Now <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CardHeader className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-muted">
            <Clock className="h-8 w-8 text-brand" />
          </div>
        </div>
        
        <CardTitle className="text-2xl font-bold">Almost Done!</CardTitle>
        
        <CardDescription className="text-base">
          Let's create your organization and account with the details you've provided.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-muted text-brand">
              <Building className="h-4 w-4" />
            </div>
            <div>
              <span className="font-semibold">Organization:</span> {orgSlug}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-muted text-brand">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <span className="font-semibold">Admin Email:</span> {email}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-muted text-brand">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <span className="font-semibold">Plan:</span> {planName} (${planPrice}/month)
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-1 rounded-full">
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900">Ready to complete</h4>
              <p className="text-sm text-blue-700 mt-1">
                Click below to finalize your organization setup and get started with hiring.
              </p>
            </div>
          </div>
        </div>
        
        <Button 
          onClick={handleCompleteSignup}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Organization...</>
          ) : (
            <>Create Organization & Continue <ArrowRight className="ml-2 h-4 w-4" /></>
          )}
        </Button>
        
        <p className="text-xs text-muted-foreground text-center">
          This will create your organization and send you to your dashboard.
        </p>
      </CardContent>
    </div>
  );
}