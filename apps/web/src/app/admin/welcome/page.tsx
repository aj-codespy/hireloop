"use client";

import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, Users, ClipboardList, CreditCard, Building, ArrowRight, CheckCircle2, Check, } from "lucide-react";

interface WelcomeTourPageProps {
  searchParams: { orgId?: string };
}

export default function WelcomeTourPage({ searchParams }: WelcomeTourPageProps) {
  const { orgId } = searchParams;

  const handleContinue = () => {
    window.location.href = "/admin";
  };

  const features = [
    {
      icon: ClipboardList,
      title: "Job Postings",
      description: "Create professional job postings that attract top talent",
      highlight: "data-tour='job-post'",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Invite and manage team members for collaborative hiring",
      highlight: "data-tour='team'",
    },
    {
      icon: CreditCard,
      title: "Subscription Management",
      description: "Review and manage your subscription plans and billing",
      highlight: "data-tour='subscription'",
    },
    {
      icon: Building,
      title: "Organization Setup",
      description: "Manage your organization settings and configurations",
      highlight: "data-tour='organization'",
    },
  ];

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 shadow-lg">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">Welcome to HireLoop!</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Your organization has been successfully created. Let&apos;s start your hiring journey with a quick guided tour of the key features.
            </p>
            {orgId && (
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-muted/20 px-4 py-2">
                <span className="text-sm text-muted-foreground">Organization:</span>
                <span className="font-mono text-sm text-brand">{orgId}</span>
              </div>
            )}
          </div>

          <div className="grid w-full gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group rounded-xl border border-border bg-card p-6 shadow-card-hover transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1"
                  data-tour={feature.highlight?.split("='")[1]}
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-muted/20 group-hover:bg-brand-muted/30">
                    <Icon className="h-6 w-6 text-brand" />
                  </div>
                  <h3 className="mb-2 font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>

          <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-8 shadow-card">
            <h2 className="mb-6 text-xl font-semibold text-foreground">Next Steps</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-muted/20">
                  <span className="text-sm font-semibold text-brand">1</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">Create your first job posting</h4>
                  <p className="text-sm text-muted-foreground">Set up an effective job description that showcases your opportunities</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-muted/20">
                  <span className="text-sm font-semibold text-brand">2</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">Setup interview questions</h4>
                  <p className="text-sm text-muted-foreground">Create standardized questions for consistent candidate evaluation</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-muted/20">
                  <span className="text-sm font-semibold text-brand">3</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">Invite team members</h4>
                  <p className="text-sm text-muted-foreground">Collaborate with colleagues on the hiring process</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-muted/20">
                  <span className="text-sm font-semibold text-brand">4</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">Review subscription</h4>
                  <p className="text-sm text-muted-foreground">Choose the right plan for your hiring needs</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex w-full gap-4 max-w-md">
            <Button
              onClick={handleContinue}
              className="flex-1 h-12 rounded-full bg-brand text-brand-foreground font-medium hover:bg-brand/90 transition-colors"
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-12 rounded-full border-border hover:bg-muted transition-colors"
              onClick={() => window.open("https://docs.hireloop.com", "_blank")}
            >
              View Documentation
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground max-w-lg">
            Need help getting started? Our documentation and support team are here to assist you with any questions about using HireLoop effectively.
          </p>
        </div>
      </div>
    </div>
  );
}