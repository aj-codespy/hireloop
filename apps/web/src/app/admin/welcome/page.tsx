"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";
import type { LucideIconName } from "@/components/icons/icon-map";

interface WelcomeTourPageProps {
  searchParams: Promise<{ orgId?: string }>;
}

export default function WelcomeTourPage({ searchParams }: WelcomeTourPageProps) {
  const { orgId } = React.use(searchParams);

  const handleContinue = () => {
    window.location.href = "/admin";
  };

  const features: { icon: LucideIconName; title: string; description: string; highlight: string }[] = [
    {
      icon: "ClipboardList",
      title: "Job Postings",
      description: "Create professional job postings that attract top talent",
      highlight: "data-tour='job-post'",
    },
    {
      icon: "Users",
      title: "Team Collaboration",
      description: "Invite and manage team members for collaborative hiring",
      highlight: "data-tour='team'",
    },
    {
      icon: "CreditCard",
      title: "Subscription Management",
      description: "Review and manage your subscription plans and billing",
      highlight: "data-tour='subscription'",
    },
    {
      icon: "Building",
      title: "Organization Setup",
      description: "Manage your organization settings and configurations",
      highlight: "data-tour='organization'",
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-white px-5 py-12 font-sans text-slate-950 sm:px-8">
      <main className="mx-auto max-w-5xl">
        <div className="space-y-12">
          <header className="max-w-2xl border-b border-slate-200 pb-8">
            <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
              <PhosphorIcon name="CheckCircle2" className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.03em] md:text-4xl">Workspace ready</h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Your organization is set up. Complete these steps to start a structured hiring process.
            </p>
            {orgId && (
              <div className="mt-5 inline-flex max-w-full items-center gap-2 rounded-full bg-slate-100 px-4 py-2">
                <span className="text-sm text-slate-600">Organization</span>
                <span className="truncate font-mono text-sm tabular-nums text-slate-950">{orgId}</span>
              </div>
            )}
          </header>

          <section aria-labelledby="workspace-capabilities">
            <h2 id="workspace-capabilities" className="text-lg font-semibold">Workspace capabilities</h2>
            <div className="mt-5 grid border-y border-slate-200 md:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-slate-200">
              {features.map((feature) => {
                return (
                  <div
                    key={feature.title}
                    className="border-b border-slate-200 py-6 md:px-5 lg:border-b-0"
                    data-tour={feature.highlight?.split("='")[1]}
                  >
                    <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50">
                      <PhosphorIcon name={feature.icon} className="h-4 w-4 text-brand" aria-hidden />
                    </div>
                    <h3 className="mb-2 font-semibold">{feature.title}</h3>
                    <p className="text-sm leading-6 text-slate-600">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="max-w-2xl" aria-labelledby="next-steps">
            <h2 id="next-steps" className="mb-6 text-xl font-semibold">Next steps</h2>
            <div className="divide-y divide-slate-200 border-y border-slate-200">
              {[
                ["Create your first job posting", "Set up a clear role and candidate requirements."],
                ["Set interview questions", "Use consistent questions for fair evaluation."],
                ["Invite team members", "Bring hiring managers into the review process."],
                ["Review subscription", "Choose the right plan for your hiring volume."],
              ].map(([title, description], index) => (
                <div key={title} className="flex items-start gap-4 py-5">
                  <span className="font-mono text-sm tabular-nums text-brand">0{index + 1}</span>
                  <div>
                    <h3 className="font-medium">{title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="flex max-w-md flex-col gap-3 sm:flex-row">
            <Button
              onClick={handleContinue}
              className="flex-1 h-12 rounded-full bg-brand text-brand-foreground font-medium hover:bg-brand/90 transition-colors"
            >
              Go to dashboard
              <PhosphorIcon name="ArrowRight" className="ml-2 h-4 w-4" aria-hidden />
            </Button>
            <Button
              variant="outline"
              className="h-12 rounded-full border-border hover:bg-muted transition-colors"
              onClick={() => window.open("https://docs.hireloop.com", "_blank")}
            >
              View documentation
            </Button>
          </div>

          <p className="max-w-lg text-sm text-slate-500">
            Need help getting started? Review the documentation or contact support.
          </p>
        </div>
      </main>
    </div>
  );
}