"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { storePlanSelectionAction } from "@/app/actions/multi-step-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, ArrowLeft, ArrowRight, CreditCard, Clock, Users, FileText } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: number;
  interval?: string;
  features: string[];
}

export function PlanSelectionStep() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  
  const orgSlug = searchParams.get('orgSlug') || "";
  const email = searchParams.get('email') || "";

  const plans: Plan[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      interval: '/month',
      features: [
        'Up to 3 users',
        'Basic job posting',
        'Candidate management',
        'Email support'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 29,
      interval: '/month',
      features: [
        'Up to 10 users',
        'Unlimited job postings',
        'Advanced candidate screening',
        'Voice interviews',
        'Analytics dashboard',
        'Priority support'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 99,
      interval: '/month',
      features: [
        'Unlimited users',
        'All Pro features',
        'Custom integrations',
        'Dedicated support',
        'Advanced compliance',
        'White-label options'
      ]
    }
  ];

  useEffect(() => {
    if (!orgSlug) {
      router.push('/auth/signup?step=2');
    }
  }, [orgSlug, router]);

  const handlePlanSelect = async (plan: Plan) => {
    setIsLoading(true);
    setSelectedPlan(plan);
    
    try {
      const result = await storePlanSelectionAction({
        planId: plan.id,
        planName: plan.name,
        price: plan.price,
        billingCycle,
      });

      if (result.error) {
        toast.error(result.error);
        setSelectedPlan(null);
        return;
      }

      const params = new URLSearchParams(window.location.search);
      params.set('step', '4');
      params.set('orgSlug', orgSlug);
      params.set('email', email);
      params.set('planId', plan.id);
      params.set('planName', plan.name);
      params.set('price', plan.price.toString());
      
      router.push(`/auth/signup?${params.toString()}`);
    } catch (error) {
      toast.error("Failed to save plan selection");
      setSelectedPlan(null);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAnnualPrice = (monthlyPrice: number) => {
    return monthlyPrice * 10;
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

  return (
    <div className="space-y-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Plan Selection
        </CardTitle>
        <CardDescription>
          Choose the plan that best fits your organization's needs.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex justify-center gap-4 mb-6">
          <Button
            variant={billingCycle === 'monthly' ? 'default' : 'outline'}
            onClick={() => setBillingCycle('monthly')}
            disabled={isLoading}
          >
            Monthly
          </Button>
          <Button
            variant={billingCycle === 'yearly' ? 'default' : 'outline'}
            onClick={() => setBillingCycle('yearly')}
            disabled={isLoading}
          >
            Yearly <Badge variant="secondary" className="ml-2">Save 20%</Badge>
          </Button>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative transition-all ${selectedPlan?.id === plan.id ? 'ring-2 ring-brand' : ''}`}
            >
              {plan.id === 'enterprise' && (
                <Badge className="absolute -top-2 -right-2">Most Popular</Badge>
              )}
              
              <CardHeader className="text-center">
                <CardTitle>{plan.name}</CardTitle>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                {billingCycle === 'yearly' && plan.price > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Billed annually: ${calculateAnnualPrice(plan.price)}/year
                  </p>
                )}
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  onClick={() => handlePlanSelect(plan)}
                  disabled={isLoading || selectedPlan?.id === plan.id}
                  className="w-full"
                >
                  {isLoading && selectedPlan?.id === plan.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <>Choose {plan.name}</>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="flex gap-2 mt-8">
          <Button 
            variant="outline"
            onClick={() => router.push('/auth/signup?step=2&orgSlug=' + orgSlug + '&email=' + encodeURIComponent(email))}
            disabled={isLoading}
            className="flex-1"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </CardContent>
    </div>
  );
}