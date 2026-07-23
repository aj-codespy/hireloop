"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { storeAdminUserDetailsAction } from "@/app/actions/multi-step-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, ArrowRight, Mail, User, Shield } from "lucide-react";

export function AdminUserStep() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const orgSlug = searchParams.get('orgSlug') || "";

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      toast.error("Full name is required");
      return false;
    }
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return false;
    }
    if (!formData.email.includes('@')) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (!formData.password) {
      toast.error("Password is required");
      return false;
    }
    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await storeAdminUserDetailsAction({
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        fullName: formData.fullName.trim(),
        confirmPassword: formData.confirmPassword,
        orgSlug: orgSlug,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      // Navigate to next step (plan selection)
      router.push(`/auth/signup?step=3&orgSlug=${orgSlug}&email=${encodeURIComponent(formData.email)}`);
    } catch (error) {
      toast.error("Failed to save admin user details");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    router.push('/auth/signup?step=1');
  };

  if (!orgSlug) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">Organization slug not found. Please start over.</p>
            <Button onClick={() => router.push('/auth/signup?step=1')}>
              Start Over
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Admin User Details
        </CardTitle>
        <CardDescription>
          Create the admin account for your organization. This will be your login.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Organization:</strong> {orgSlug}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            This will become the workspace for your team.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
            placeholder="John Doe"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Work Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="admin@company.com"
            required
          />
          <p className="text-xs text-muted-foreground">
            Use your work email for team collaboration.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password *</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            placeholder="••••••••"
            required
          />
          <p className="text-xs text-muted-foreground">
            Minimum 8 characters with uppercase, lowercase, and number.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password *</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            placeholder="••••••••"
            required
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={handlePrevious}
            disabled={isLoading}
            className="flex-1"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isLoading || !formData.fullName || !formData.email || !formData.password}
            className="flex-1"
          >
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
            ) : (
              <>Continue <ArrowRight className="ml-2 h-4 w-4" /></>
            )}
          </Button>
        </div>
      </CardContent>
    </div>
  );
}