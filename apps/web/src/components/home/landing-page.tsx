"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollReveal, StaggerReveal } from "@/components/animations/scroll-reveal";
import type { LucideIconName } from "@/components/icons/icon-map";

gsap.registerPlugin(ScrollTrigger);

const navItems = [
  { href: "#product", label: "Product" },
  { href: "#workflow", label: "Workflow" },
  { href: "#oversight", label: "Human Oversight" },
  { href: "#security", label: "Security" },
];

const trustItems = ["SOC 2 ready", "GDPR controls", "Encryption", "Audit logs", "Role-based access"];

const workflow = [
  {
    number: "01",
    title: "Define the evidence",
    body: "Create the application, eligibility rules, and structured question bank for each role.",
  },
  {
    number: "02",
    title: "Run a consistent interview",
    body: "Qualified candidates receive a secure link for a timed, bilingual voice interview.",
  },
  {
    number: "03",
    title: "Review the full record",
    body: "Recruiters see answers, transcripts, scores, documents, and interview integrity signals together.",
  },
  {
    number: "04",
    title: "Make the decision",
    body: "Your team advances, rejects, or schedules candidates. HireLoop keeps the evidence organized.",
  },
];

const evidence = [
  "Per-answer transcripts and audio",
  "Structured scorecards with rationale",
  "Reviewable proctoring events",
  "Candidate documents in context",
];

const security: { icon: LucideIconName; title: string; body: string }[] = [
  {
    icon: "Fingerprint",
    title: "Scoped access",
    body: "Organization and role boundaries keep candidate records visible to the right people.",
  },
  {
    icon: "FileCheck2",
    title: "Reviewable history",
    body: "Stage changes, interview events, and decisions leave a clear operational record.",
  },
  {
    icon: "ShieldCheck",
    title: "Private by design",
    body: "Candidate files, snapshots, and interview media stay behind controlled access.",
  },
];

function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p className={`eyebrow ${light ? "text-white/70" : ""}`}>
      {children}
    </p>
  );
}

export function LandingPage({ userEmail, currentYear }: { userEmail: string | null; currentYear: number }) {
  const primaryHref = "/auth/signup";
  const heroRef = useRef<HTMLElement>(null);
  const heroImageRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduceMotion || !heroRef.current || !heroImageRef.current) return;

      const ctx = gsap.context(() => {
        gsap.from("[data-hero-intro]", {
          y: 28,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.1,
          delay: 0.12,
        });
        gsap.to(heroImageRef.current, {
          yPercent: 9,
          scale: 1.06,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 0.65,
          },
        });
      }, heroRef);

      return () => ctx.revert();
    },
    { scope: heroRef },
  );

  return (
    <>
      <main id="main-content" className="relative overflow-x-hidden">
      {/* Hero */}
      <header ref={heroRef} className="landing-hero relative isolate min-h-[100svh] overflow-hidden bg-[#15120f] text-white">
        <div ref={heroImageRef} className="absolute inset-x-0 -top-[5%] h-[112%]">
          <Image
            src="/landing/interview-hero.png"
            alt="Candidate recording a structured interview from a calm workspace"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[68%_center]"
          />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(13,11,10,0.94)_0%,rgba(13,11,10,0.83)_31%,rgba(13,11,10,0.36)_57%,rgba(13,11,10,0.08)_100%)]" />
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-70" />
        <div className="hero-orb pointer-events-none absolute -left-40 top-[38%] h-80 w-80 rounded-full bg-brand/25 blur-[100px]" />

        <nav className="relative z-10 mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 py-4 md:px-8">
          <Logo className="[&>span]:text-white" />
          <div className="hidden gap-6 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group relative text-sm font-medium text-white/65 transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-white"
              >
                {item.label}
                <span className="absolute -bottom-0.5 left-1/2 h-px w-0 -translate-x-1/2 bg-white transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:w-full" />
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm font-medium text-white/75 transition-colors hover:text-white md:block"
            >
              Sign in
            </Link>
            <ButtonLink
              href={primaryHref}
              className="h-10 rounded-full bg-brand-gradient pl-5 pr-1 text-white shadow-[0_4px_16px_rgba(249,115,22,0.2)] text-sm transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] flex items-center gap-0"
            >
              {userEmail ? "Open Workspace" : "Start Hiring"}
            </ButtonLink>
            <Sheet>
              <SheetTrigger
                render={
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white md:hidden" aria-label="Open menu">
                    <PhosphorIcon name="List" aria-hidden />
                  </Button>
                }
              />
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-2 py-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="text-lg font-medium"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <ButtonLink
                    href={primaryHref}
                    className="mt-4 rounded-full bg-brand-gradient px-5 text-white shadow-[0_4px_16px_rgba(249,115,22,0.2)]"
                  >
                    {userEmail ? "Open Workspace" : "Start Hiring"}
                  </ButtonLink>
                </nav>
                <SheetFooter>
                  <div className="flex flex-col gap-4 border-t border-border pt-4">
                    <div className="flex flex-col gap-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Trust
                      </p>
                      {trustItems.map((item) => (
                        <p key={item} className="text-sm text-muted-foreground">
                          {item}
                        </p>
                      ))}
                    </div>
                  </div>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </nav>

        <div className="relative z-10 mx-auto flex min-h-[calc(100svh-4.25rem)] max-w-[1440px] items-center px-5 pb-20 pt-14 md:px-8 lg:pb-28 lg:pt-20">
          <div className="max-w-[46rem]">
            <Eyebrow light><span data-hero-intro>The hiring operating system</span></Eyebrow>
            <h1 data-hero-intro className="mt-6 text-pretty text-5xl font-bold tracking-[-0.055em] sm:text-6xl lg:text-[4.25rem] lg:leading-[0.98] xl:text-[4.75rem]">
              <span className="lg:block">Structured interviews.</span>{" "}
              <span className="lg:block">Reviewable <span className="text-gradient">evidence</span>.</span>{" "}
              <span className="lg:block">Defensible decisions.</span>
            </h1>
            <p data-hero-intro className="mt-7 max-w-xl text-lg leading-8 text-white/72">
              Record structured voice interviews, get AI-generated transcripts and scores, and see every signal in one dashboard. Your team makes the call.
            </p>
            <div data-hero-intro className="mt-10 flex flex-wrap items-center gap-4">
              <ButtonLink
                href={primaryHref}
                className="group h-12 rounded-full bg-brand-gradient px-2 pl-7 text-white text-base shadow-[0_8px_24px_rgba(249,115,22,0.25)] hover:shadow-[0_8px_28px_rgba(249,115,22,0.35)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
              >
                {userEmail ? "Open Workspace" : "Start Hiring"}
                <span className="ml-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:scale-105">
                  <PhosphorIcon name="ArrowRight" className="h-4 w-4 text-white" />
                </span>
              </ButtonLink>
              <ButtonLink
                href="#product"
                variant="outline"
                className="w-full max-w-xs rounded-full border-white/30 bg-white/5 text-white hover:border-white/60 hover:bg-white/10 hover:text-white"
              >
                See how it works
              </ButtonLink>
            </div>
            <div data-hero-intro className="mt-14 flex flex-wrap gap-x-7 gap-y-3 text-sm text-white/60">
              {trustItems.map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <PhosphorIcon name="Check" className="h-3.5 w-3.5 text-brand" />
                  {item}
                </span>
              ))}
            </div>
            <p data-hero-intro className="mt-16 font-mono text-[10px] font-medium uppercase tracking-[0.24em] text-white/40">Built for reviewable hiring decisions</p>
          </div>
        </div>
      </header>

      {/* Product */}
      <section id="product" className="py-28 sm:py-40">
        <div className="mx-auto max-w-[1440px] px-5 md:px-8">
          <ScrollReveal className="max-w-3xl" blur="4px">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mt-6 max-w-3xl text-pretty text-4xl font-bold tracking-[-0.035em] sm:text-5xl">
              One platform. Every signal. Zero handoffs.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Replace forms, calendars, video tools, and spreadsheets with a single workflow.
              AI handles screening consistency. People own every decision.
            </p>
          </ScrollReveal>

          <ScrollReveal className="group relative mt-20 overflow-hidden rounded-[2rem] border border-border bg-[#f7f6f4] p-2 shadow-[0_28px_80px_rgba(15,15,15,0.10)]" scale={0.96}>
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-brand/8 to-transparent" />
            <Image
              src="/landing/product-dashboard.png"
              alt="HireLoop dashboard with candidate pipeline, scores, and hiring actions"
              width={1280}
              height={633}
              sizes="(max-width: 1440px) 100vw, 1376px"
              className="relative w-full rounded-[1.5rem] border border-black/5 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.012]"
            />
          </ScrollReveal>

          <StaggerReveal className="mt-12 grid divide-y divide-border border-y border-border lg:grid-cols-3 lg:divide-x lg:divide-y-0" stagger={0.12}>
            <div className="py-7 lg:px-8 lg:first:pl-0">
              <PhosphorIcon name="ListChecks" className="h-5 w-5 text-brand" />
              <h3 className="mt-5 text-xl font-semibold tracking-tight">Define what matters</h3>
              <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">Set eligibility rules, questions, and scorecard rubrics per role. Every candidate meets the same bar.</p>
            </div>
            <div className="py-7 lg:px-8">
              <PhosphorIcon name="Video" className="h-5 w-5 text-brand" />
              <h3 className="mt-5 text-xl font-semibold tracking-tight">Run consistent interviews</h3>
              <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">Candidates complete timed, proctored voice interviews on their schedule, with bilingual transcription.</p>
            </div>
            <div className="py-7 lg:pl-8">
              <PhosphorIcon name="FileText" className="h-5 w-5 text-brand" />
              <h3 className="mt-5 text-xl font-semibold tracking-tight">Review the full record</h3>
              <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">Scores, answers, documents, and integrity signals arrive in a single reviewable timeline.</p>
            </div>
          </StaggerReveal>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="border-y border-border py-28 sm:py-40 bg-[#FAFAF9] texture-dots">
        <div className="mx-auto max-w-[1440px] px-5 md:px-8">
          <ScrollReveal className="max-w-3xl" blur="4px">
            <Eyebrow>Workflow</Eyebrow>
            <h2 className="mt-6 max-w-3xl text-pretty text-4xl font-bold tracking-[-0.035em] sm:text-5xl">
              From role design to a defensible shortlist.
            </h2>
            <p className="mt-6 max-w-md text-lg leading-8 text-muted-foreground">
              Remove handoffs from the screening layer while keeping every moment where human judgment matters.
            </p>
          </ScrollReveal>

          <div className="border-t border-border">
            {workflow.map((item, index) => (
              <ScrollReveal
                key={item.number}
                delay={index * 0.05}
                className="grid gap-5 border-b border-border py-9 sm:grid-cols-[72px_1fr]"
              >
                <span className="font-mono text-sm text-brand">{item.number}</span>
                <div>
                  <h3 className="text-2xl font-semibold tracking-tight">{item.title}</h3>
                  <p className="mt-3 max-w-xl leading-7 text-muted-foreground">{item.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Human Oversight */}
      <section id="oversight" className="py-28 sm:py-40">
        <div className="mx-auto max-w-[1440px] px-5 md:px-8">
          <div className="grid overflow-hidden rounded-[24px] border border-border bg-[#FAFAF9] lg:grid-cols-2">
            <ScrollReveal className="flex flex-col justify-center p-8 sm:p-12 lg:p-16" blur="4px">
              <Eyebrow>Human oversight</Eyebrow>
              <h2 className="mt-6 text-pretty text-4xl font-bold tracking-[-0.035em] sm:text-5xl">
                AI organizes the record. People own the call.
              </h2>
              <p className="mt-6 max-w-lg text-lg leading-8 text-muted-foreground">
                AI scores and summaries accelerate review. They never hide the underlying candidate evidence or replace a hiring manager&apos;s decision.
              </p>
              <ul className="mt-9 grid gap-3">
                {evidence.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <PhosphorIcon name="Check" />
                    {item}
                  </li>
                ))}
              </ul>
            </ScrollReveal>
            <div className="relative min-h-[420px] lg:min-h-[620px]">
              <div className="absolute inset-0">
                <Image
                  src="/landing/human-review-editorial.png"
                  alt="Hiring team reviewing candidate evidence together"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-center"
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <p className="text-sm font-medium">Live candidate review</p>
                <p className="text-sm text-white/70 mt-1">
                  Scorecard, transcript, and proctoring timeline in one view
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Candidate Experience */}
      <section className="border-y border-border py-28 sm:py-40">
        <div className="mx-auto grid max-w-[1440px] items-center gap-14 px-5 md:px-8 lg:grid-cols-[1.05fr_0.95fr]">
          <ScrollReveal scale={0.9}>
            <div className="relative overflow-hidden rounded-[2rem] bg-black/[0.03] p-1.5 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10">
              <div className="overflow-hidden rounded-[calc(2rem-0.375rem)] border border-border bg-card shadow-[0_12px_40px_rgba(15,15,15,0.08)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.015]">
              <Image
                src="/landing/candidate-prep-editorial.png"
                alt="Candidate preparing calmly for a structured interview"
                width={1536}
                height={1024}
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="h-auto w-full"
              />
            </div>
            <div className="absolute bottom-7 right-7 hidden w-56 rounded-2xl border border-white/70 bg-white/90 p-4 shadow-[0_16px_48px_rgba(15,15,15,0.18)] backdrop-blur-md sm:block">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs font-semibold">Interview slot</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand">Confirmed</span>
              </div>
              <p className="mt-3 text-sm font-medium">Tuesday, 10:30 AM</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Secure interview link · 30 min</p>
              <div className="mt-3 h-1 rounded-full bg-brand/15"><div className="h-full w-2/3 rounded-full bg-brand" /></div>
            </div>
          </div>
          </ScrollReveal>
          <ScrollReveal className="max-w-lg lg:justify-self-end" blur="4px">
            <Eyebrow>Candidate experience</Eyebrow>
            <h2 className="mt-6 text-pretty text-4xl font-bold tracking-[-0.035em] sm:text-5xl">
              Clear for candidates. Controlled for teams.
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Secure links, self-scheduling, and consistent steps keep candidates oriented. Your team keeps the controls.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="relative bg-[#0F1115] py-28 text-white sm:py-40 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-[0.04] animate-pulse-ambient"
   style={{
     backgroundImage: "radial-gradient(ellipse 80% 50% at 50% 0%, #f97316, transparent), radial-gradient(ellipse 50% 60% at 80% 100%, #f97316, transparent)",
   }}
 />
        <div className="mx-auto max-w-[1440px] px-5 md:px-8">
          <ScrollReveal className="grid gap-8 lg:grid-cols-2" blur="4px">
            <div>
              <Eyebrow light>Security and accountability</Eyebrow>
              <h2 className="mt-6 max-w-xl text-pretty text-4xl font-bold tracking-[-0.035em] sm:text-5xl">
                Trust comes from controls you can inspect.
              </h2>
            </div>
            <p className="max-w-xl text-lg leading-8 text-zinc-400 lg:justify-self-end">
              Keep candidate data private. Know who moved each application and when. Keep human authority over every hire.
            </p>
          </ScrollReveal>

          <StaggerReveal className="mt-16 grid gap-px border-y border-white/10 bg-white/10 lg:grid-cols-3" stagger={0.1}>
            {security.map((item) => (
              <div key={item.title} className="bg-[#0F1115] px-1 py-10 lg:px-8">
                <PhosphorIcon name={item.icon} className="h-6 w-6 text-brand" aria-hidden />
                <h3 className="mt-8 text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-400">{item.body}</p>
              </div>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* System Boundary */}
      <section className="py-28 sm:py-40">
        <div className="mx-auto max-w-[1440px] px-5 md:px-8">
          <ScrollReveal className="grid gap-12 border-b border-border pb-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-end" blur="4px">
            <div>
              <Eyebrow>System boundary</Eyebrow>
              <h2 className="mt-6 max-w-3xl text-pretty text-5xl font-bold tracking-[-0.045em] sm:text-6xl">
                HireLoop owns the interview. You own the relationship.
              </h2>
            </div>
            <p className="max-w-lg text-lg leading-8 text-muted-foreground lg:justify-self-end">
              Screening happens here. The relationship stays with your team.
            </p>
          </ScrollReveal>

          <ScrollReveal className="flex flex-col items-start justify-between gap-8 pt-20 lg:flex-row lg:items-end" blur="4px">
            <div>
              <p className="text-sm font-semibold text-brand">Ready when your next role is.</p>
              <h2 className="mt-3 max-w-2xl text-pretty text-4xl font-bold tracking-[-0.035em] sm:text-5xl">
                Build a hiring process your team can explain.
              </h2>
            </div>
            <ButtonLink
              href={primaryHref}
              className="group h-12 shrink-0 rounded-full bg-brand-gradient px-2 pl-7 text-white shadow-[0_8px_24px_rgba(249,115,22,0.25)] hover:shadow-[0_8px_28px_rgba(249,115,22,0.35)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
            >
              {userEmail ? "Open Workspace" : "Start Hiring"}
              <span className="ml-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:scale-105">
                <PhosphorIcon name="ArrowRight" className="h-4 w-4 text-white" />
              </span>
            </ButtonLink>
          </ScrollReveal>
        </div>
      </section>
    </main>

    <footer className="border-t border-border bg-[#FAFAF9]">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-14 md:px-8 lg:grid-cols-[1.5fr_0.75fr_0.75fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-md text-sm leading-6 text-muted-foreground">
            Structured interviews and reviewable evidence for hiring teams that value speed,
            consistency, and human judgment.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Product
          </p>
          <ul className="mt-4 space-y-2">
            <li><Link href="#product" className="text-sm text-muted-foreground hover:text-foreground">Interviews</Link></li>
            <li><Link href="#product" className="text-sm text-muted-foreground hover:text-foreground">Scorecard</Link></li>
            <li><Link href="#product" className="text-sm text-muted-foreground hover:text-foreground">Proctoring</Link></li>
            <li><Link href="#product" className="text-sm text-muted-foreground hover:text-foreground">Question Bank</Link></li>
            <li><Link href="#product" className="text-sm text-muted-foreground hover:text-foreground">API Access</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Company
          </p>
          <ul className="mt-4 space-y-2">
            <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">About</Link></li>
            <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Blog</Link></li>
            <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Careers</Link></li>
            <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Contact</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Legal
          </p>
          <ul className="mt-4 space-y-2">
            <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacy</Link></li>
            <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Terms</Link></li>
            <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Security</Link></li>
            <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Cookies</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border px-5 py-4 text-center text-xs text-muted-foreground">
        &copy; {currentYear} HireLoop. All rights reserved.
      </div>
    </footer>
    </>
  );
}
