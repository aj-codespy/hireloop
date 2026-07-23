"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { storeCompanyDetailsAction, storeAdminUserDetailsAction, storePlanSelectionAction, completeAdminSignupAction } from "@/app/actions/multi-step-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, ArrowRight, Building, Users, ClipboardList, CreditCard, Upload, X } from "lucide-react";

export function CompanyDetailsStep() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    orgName: "",
    orgSlug: "",
    logoUrl: "",
    defaultDepartment: "",
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  };

  const handleSubmit = async () => {
    if (!formData.orgName) {
      toast.error("Organization name is required");
      return;
    }

    setIsLoading(true);
    try {
      const slug = formData.orgSlug || generateSlug(formData.orgName);
      const updatedData = { ...formData, orgSlug: slug };
      setFormData(updatedData);

      const result = await storeCompanyDetailsAction(updatedData);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      // Navigate to next step
      router.push('/auth/signup?step=2&orgSlug=' + slug);
    } catch (error) {
      toast.error("Failed to save organization details");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Company Details
        </CardTitle>
        <CardDescription>
          Create your organization profile. This will be your workspace.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="orgName">Organization Name *</Label>
          <Input
            id="orgName"
            value={formData.orgName}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, orgName: e.target.value }));
              if (!formData.orgSlug) {
                setFormData(prev => ({ ...prev, orgSlug: generateSlug(e.target.value) }));
              }
            }}
            placeholder="Acme Corporation"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="orgSlug">Organization Slug</Label>
          <div className="flex gap-2">
            <Input
              id="orgSlug"
              value={formData.orgSlug}
              onChange={(e) => setFormData(prev => ({ ...prev, orgSlug: e.target.value }))}
              placeholder="acme-corp"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setFormData(prev => ({ ...prev, orgSlug: generateSlug(prev.orgName) }))}
              disabled={!formData.orgName}
            >
              Auto-generate
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Used for your workspace URL: hireloop.com/org/{formData.orgSlug || '[slug]'}
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="logoUrl">Logo URL (optional)</Label>
          <Input
            id="logoUrl"
            value={formData.logoUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, logoUrl: e.target.value }))}
            placeholder="https://example.com/logo.png"
          />
          {formData.logoUrl && (
            <div className="relative w-20 h-20">
              <img
                src={formData.logoUrl}
                alt="Logo preview"
                className="w-full h-full object-cover rounded-lg border"
                onError={() => toast.error("Failed to load logo")}
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                onClick={() => setFormData(prev => ({ ...prev, logoUrl: "" }))}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="defaultDepartment">Default Department Name</Label>
          <Input
            id="defaultDepartment"
            value={formData.defaultDepartment}
            onChange={(e) => setFormData(prev => ({ ...prev, defaultDepartment: e.target.value }))}
            placeholder="Engineering"
          />
        </div>
        
        <Button 
          onClick={handleSubmit}
          disabled={isLoading || !formData.orgName}
          className="w-full"
        >
          {isLoading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
          ) : (
            <>Continue <ArrowRight className="ml-2 h-4 w-4" /></>
          )}
        </Button>
      </CardContent>
    </div>
  );
}