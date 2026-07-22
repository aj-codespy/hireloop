"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Menu } from "lucide-react";
import { motion } from "framer-motion";
import { Logo } from "@/components/brand/logo";
import {
  IconCandidates,
  IconCompany,
  IconPipeline,
  IconProctoring,
  IconScorecard,
  IconVoiceInterview,
} from "@/components/icons/brand-icons";
import { ButtonLink } from "@/components/ui/button-link";
import { getJobs } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const features = [
  {
    icon: IconPipeline,
    title: "Automated shortlisting",
    desc: "Eligibility rules filter applications and send interview links without recruiter follow-up.",
  },
  {
    icon: IconVoiceInterview,
    title: "Structured voice interviews",
    desc: "Consistent questions, bilingual voice, timers, and per-answer transcript persistence.",
  },
  {
    icon: IconProctoring,
    title: "Interview integrity",
    desc: "Fullscreen checks, webcam snapshots, risk flags, and an audit trail for review.",
  },
  {
    icon: IconScorecard,
    title: "Decision-ready pipeline",
    desc: "Scores, transcripts, documents, and final decisions live in one admin workspace.",
  },
];

const workflow = [
  {
    step: "01",
    title: "Publish a role",
    desc: "Build the application form, eligibility rules, and interview question bank.",
  },
  {
    step: "02",
    title: "Screen automatically",
    desc: "Qualified candidates receive a secure interview link with expiry controls.",
  },
  {
    step: "03",
    title: "Review with context",
    desc: "See scorecards, transcripts, proctoring logs, snapshots, and documents.",
  },
  {
    step: "04",
    title: "Move the pipeline",
    desc: "Send to final interview, hire, reject, or regenerate links for special cases.",
  },
];

const proof = [
  { value: "72h", label: "interview link expiry" },
  { value: "2h", label: "reconnect window" },
  { value: "EN + HI", label: "bilingual interviews" },
  { value: "RLS", label: "org-scoped data" },
];

const security = [
  "Admin and recruiter roles",
  "Token-gated candidate interviews",
  "Private document and snapshot storage",
  "Organization-scoped access controls",
];

const navItems = [
  { href: "#features", label: "Features" },
  { href: "#workflow", label: "How it works" },
  { href: "#security", label: "Security" },
  { href: "#roles", label: "Roles" },
];

const footerGroups: { heading: string; items: { label: string; href?: string }[] }[] = [
  {
    heading: "Product",
    items: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#workflow" },
      { label: "Security", href: "#security" },
    ],
  },
  {
    heading: "Workspace",
    items: [
      { label: "Admin", href: "/admin/login" },
      { label: "Recruiter", href: "/admin/login" },
      { label: "Candidate", href: "/candidate/login" },
    ],
  },
  {
    heading: "Company",
    items: [{ label: "Sign in", href: "/login" }, { label: "Start hiring", href: "/admin/login" }],
  },
];

export function HomePageClient({ userEmail }: { userEmail?: string | null }) {
  const liveJobs = getJobs().filter((j) => j.status === "live").slice(0, 3);

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/82 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex" aria-label="Main">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition-colors hover:text-foreground focus-ring rounded-sm"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <ButtonLink href="/login" variant="ghost" className="rounded-full">
              Sign in
            </ButtonLink>
            <ButtonLink
              href="/candidate/login"
              variant="outline"
              className="rounded-full"
            >
              For candidates
            </ButtonLink>
            <ButtonLink
              href={userEmail ? "/admin" : "/admin/login"}
              className="h-10 rounded-full bg-brand px-5 text-brand-foreground shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-brand/90"
            >
              {userEmail ? "Dashboard" : "Start hiring"}
            </ButtonLink>
          </div>
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="outline" size="icon-lg" className="rounded-full md:hidden" />
              }
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </SheetTrigger>
            <SheetContent className="w-[86vw]">
              <SheetHeader>
                <SheetTitle>HireLoop</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 px-4">
                {navItems.map((item) => (
                  <SheetClose key={item.href}>
                    <Link
                      href={item.href}
                      className="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
              <SheetFooter>
                <ButtonLink href="/login" variant="outline" className="rounded-full">
                  Sign in
                </ButtonLink>
                <ButtonLink href="/candidate/login" variant="outline" className="rounded-full">
                  For candidates
                </ButtonLink>
                <ButtonLink href="/admin/login" className="rounded-full bg-brand text-brand-foreground">
                  Start hiring
                </ButtonLink>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-border">
          {/* Hero background gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,107,0,0.12),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(255,107,0,0.06),transparent_30%)]" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
            {/* Left side content */}
            <motion.div
              initial={{ opacity: 0, x: -48, y: 24 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <Badge className="mb-5 rounded-full bg-brand-muted px-3 py-1 text-brand">
                Structured hiring workspace
              </Badge>
              <h1
                className="text-display max-w-xl font-bold text-gradient"
              >
                Run structured hiring from one workspace.
              </h1>
              <p className="mt-6 max-w-lg text-body text-muted-foreground sm:text-base">
                HireLoop connects applications, voice interviews, proctoring, and pipeline
                decisions — so your team reviews candidates with full context, not scattered notes.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <ButtonLink
                  href={userEmail ? "/admin" : "/admin/login"}
                  className="h-11 rounded-full bg-brand-gradient text-brand-foreground hover:bg-brand/90 transition-colors shadow-lg"
                >
                  {userEmail ? "Open dashboard" : "Start hiring"}
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </ButtonLink>
                <ButtonLink
                  href="#workflow"
                  variant="outline"
                  className="h-11 rounded-full px-6 transition-transform hover:-translate-y-0.5"
                >
                  See how it works
                </ButtonLink>
              </div>
              {/* Placeholder for live interview preview orb */}
              <div className="mt-10">
                <div className="relative mx-auto max-w-[280px] h-[280px] rounded-full border-4 border-primary flex items-center justify-center">
                  {/* Orb fake */}
                  <div className="w-72 h-72 rounded-full bg-gradient-to-r from-orange-200 to-orange-300 opacity-30" />
                </div>
              </div>
            </motion.div>

            {/* Right side card with elev-3 effect */}
            <motion.div
              initial={{ opacity: 0, x: 48, y: 32 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              className="hidden lg:block"
            >
              <div className="rounded-2xl border border-border bg-card p-6 shadow-none elev-3">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">Your hiring pipeline</p>
                    <p className="text-caption">Applications to decisions</p>
                  </div>
                  {liveJobs.length > 0 && (
                    <Badge className="rounded-full bg-brand-muted text-brand">
                      {liveJobs.length} live {liveJobs.length === 1 ? "role" : "roles"}
                    </Badge>
                  )}
                </div>
                {liveJobs.length > 0 ? (
                  <div className="space-y-3">
                    {liveJobs.map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between rounded-xl border border-border bg-background p-4 transition-colors hover:border-brand/30 hover:bg-brand-subtle"
                      >
                        <div>
                          <p className="text-sm font-medium">{job.title}</p>
                          <p className="text-caption capitalize">{job.status}</p>
                        </div>
                        <Badge variant="secondary">Open</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
                    <p className="text-sm font-medium">No live roles yet</p>
                    <p className="mt-2 text-caption">
                      Publish your first role to open applications.
                    </p>
                    <ButtonLink
                      href="/admin/login"
                      className="mt-4 rounded-full bg-brand text-brand-foreground hover:bg-brand/90"
                    >
                      Create your first job
                    </ButtonLink>
                  </div>
                )}
                <Separator className="my-5" />
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    ["Apply", "Custom forms"],
                    ["Interview", "Voice + text"],
                    ["Decide", "Full context"],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-xl bg-brand-muted/50 p-3">
                      <p className="text-sm font-semibold text-brand">{value}</p>
                      <p className="text-[11px] text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="features" className="reveal border-b border-border bg-muted/30 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <Badge variant="secondary" className="rounded-full">
                Features
              </Badge>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                One loop for the entire screening layer.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Replace scattered forms, calls, spreadsheets, and manual follow-ups with a
                controlled hiring workflow.
              </p>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Card className="interactive-card h-full border-border bg-card">
                    <CardContent className="p-6">
                      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-muted text-brand">
                        <f.icon className="h-6 w-6" />
                      </div>
                      <h3 className="font-semibold text-foreground">{f.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{f.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="reveal py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <Badge className="rounded-full bg-brand-muted text-brand">How it works</Badge>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                From application to final decision, without handoffs.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Every step leaves a record: who applied, what they answered, how they scored,
                and what proctoring observed.
              </p>
            </div>
            <div className="relative mt-12">
              <div className="absolute left-4 top-0 hidden h-full w-px bg-border md:left-8 md:block" aria-hidden />
              <div className="space-y-6">
                {workflow.map((item, i) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="relative flex gap-6 md:gap-10"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-brand-foreground md:h-10 md:w-10">
                      {item.step.replace("0", "")}
                    </div>
                    <div className="interactive-card flex-1 rounded-2xl border border-border bg-card p-6">
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="security" className="border-y border-border bg-zinc-950 py-20 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,107,0,0.2),transparent_32%)]" />
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
            <Badge className="rounded-full bg-white/10 text-white">Security</Badge>
            <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              Built for reviewed decisions, not black-box shortcuts.
            </h2>
            <p className="mt-4 max-w-xl text-zinc-300">
              HireLoop keeps interviews structured, evidence-backed, and scoped to the right
              organization and team role.
            </p>
            <ul className="mt-10 grid gap-3 sm:grid-cols-2">
              {security.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-brand" aria-hidden />
                  <span className="text-sm text-zinc-100">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="roles" className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <Badge variant="secondary" className="rounded-full">
                Team roles
              </Badge>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Admins configure. Recruiters move candidates.
              </h2>
              <p className="mt-4 text-muted-foreground">
                The workspace separates setup from daily hiring so teams move quickly without
                exposing organization settings to every user.
              </p>
            </div>
            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {[
                {
                  icon: IconCandidates,
                  title: "Recruiters",
                  desc: "Review candidates, search people, send to final interview, hire, reject, and resend links.",
                },
                {
                  icon: IconCompany,
                  title: "Admins",
                  desc: "Create roles, tune forms, manage question banks, invite teammates, and edit company profile.",
                },
                {
                  icon: IconVoiceInterview,
                  title: "Candidates",
                  desc: "Apply, receive a secure link, complete a timed interview, and reconnect inside the allowed window.",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className="interactive-card rounded-2xl border border-border bg-card p-6"
                >
                  <item.icon className="h-7 w-7 text-brand" />
                  <h3 className="mt-5 text-xl font-semibold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-6xl overflow-hidden rounded-2xl bg-brand p-8 text-brand-foreground sm:p-12"
          >
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Ready to run a cleaner hiring loop?
                </h2>
                <p className="mt-4 max-w-2xl text-brand-foreground/85">
                  Start with one live role, invite your team, and let candidates move through
                  the interview workflow with fewer manual touches.
                </p>
              </div>
              <ButtonLink
                href="/admin/login"
                className="h-11 rounded-full bg-white px-8 text-zinc-950 hover:bg-white/90"
              >
                Start hiring
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </ButtonLink>
            </div>
          </motion.div>
        </section>
      </main>
      {/* Problem band section */}
      <section id="problem" className="py-20 bg-muted/15">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="reveal">
            <h2 className="text-3xl font-bold mb-6">The Problem</h2>
            <p className="text-muted-foreground">Candidates and recruiters lose track of interviews, notes, and outcomes, causing delays.</p>
          </div>
        </div>
      </section>

      {/* System boundary section */}
      <section id="boundary" className="py-20 bg-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="reveal">
            <h2 className="text-3xl font-bold mb-6">System Boundary</h2>
            <p className="text-muted-foreground">All data stays in the tenant and is accessible only to authorized roles.</p>
          </div>
        </div>
      </section>

      {/* Reports ticker section */}
      <section id="reports" className="py-20 bg-muted/10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="reveal">
            <h2 className="text-3xl font-bold mb-6">Reports</h2>
            <p className="text-muted-foreground">See analytics and metrics in real time.</p>
          </div>
        </div>
      </section>

      {/* Testimonials section */}
      <section id="testimonials" className="py-20 bg-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="reveal">
            <h2 className="text-3xl font-bold mb-6">What Teams Say</h2>
            <p className="text-muted-foreground">Positive feedback from real users.</p>
          </div>
        </div>
      </section>

      {/* Pricing tiers section */}
      <section id="pricing" className="py-20 bg-muted/15">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="reveal">
            <h2 className="text-3xl font-bold mb-6">Pricing</h2>
            <p className="text-muted-foreground">Flexible plans to fit your team's needs.</p>
          </div>
        </div>
      </section>

      {/* Final CTA section */}
      <section id="cta" className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="reveal text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to transform hiring?</h2>
            <ButtonLink href="/admin/login" className="inline-flex items-center rounded-full bg-brand px-8 py-3 text-white font-medium hover:bg-brand/90">
              Start hiring
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </ButtonLink>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-muted/30">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
              Structured hiring from application to decision — for teams that need speed,
              consistency, and reviewable evidence.
            </p>
          </div>
          {footerGroups.map(({ heading, items }) => (
            <div key={heading}>
              <p className="font-semibold">{heading}</p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {items.map((item) => (
                  <li key={item.label}>
                    {item.href ? (
                      <Link href={item.href} className="hover:text-foreground focus-ring rounded-sm">
                        {item.label}
                      </Link>
                    ) : (
                      item.label
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mx-auto flex max-w-6xl flex-col gap-3 border-t border-border px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} HireLoop. All rights reserved.</p>
          <p>Structured interviews, proctoring, and pipeline decisions.</p>
        </div>
      </footer>
    </div>
  );
}
