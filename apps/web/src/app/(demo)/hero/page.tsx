"use client";

import Link from "next/link";
import Image from "next/image";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";
import { ScrollReveal, StaggerReveal } from "@/components/animations/scroll-reveal";

const trustItems = [
  "SOC 2 ready",
  "GDPR controls",
  "Encryption",
  "Audit logs",
  "Role-based access",
];

export default function HeroDemo() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-background">
      <div className="mx-auto grid max-w-[1440px] items-center gap-12 px-6 py-16 lg:grid-cols-[2fr_3fr] lg:gap-16 lg:py-24 min-h-screen">
        {/* Left content */}
        <ScrollReveal className="flex flex-col justify-center">
          <p className="mb-4 inline-flex text-xs font-semibold uppercase tracking-[0.16em] text-brand">
            Structured hiring workspace
          </p>
          <h1 className="text-5xl font-bold tracking-[-0.035em] sm:text-6xl lg:text-7xl text-foreground">
            Resumes guess. Interviews prove.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-muted-foreground">
            Structured voice interviews that scale. Candidates talk, AI listens, you get a shortlist — not spreadsheets.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/auth/signup"
              className="group inline-flex h-12 items-center justify-center rounded-full bg-brand px-7 text-base font-semibold text-white transition-all duration-250 ease-out hover:bg-[#EA6B2D]"
            >
              Start hiring
              <PhosphorIcon name="ArrowRight" aria-hidden className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="#workflow"
              className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-background px-7 text-base font-medium text-foreground transition-all duration-250 ease-out hover:bg-muted"
            >
              See how it works
            </Link>
          </div>
          <div className="mt-14 flex flex-wrap gap-8 text-sm text-muted-foreground">
            {trustItems.map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <PhosphorIcon name="Check" aria-hidden className="h-3.5 w-3.5 text-emerald-500" />
                {item}
              </span>
            ))}
          </div>
        </ScrollReveal>

        {/* Right: product mockup */}
        <ScrollReveal delay={0.1} className="hidden lg:block">
          <div className="relative overflow-hidden rounded-[24px] border border-border bg-card shadow-[0_12px_40px_rgba(15,15,15,0.08)]">
            <div className="aspect-[4/3] w-full bg-[#FAFAF9] p-6">
              {/* Phone interview mockup */}
              <div className="mx-auto max-w-[280px]">
                <div className="rounded-[2rem] border-4 border-border bg-card p-3 shadow-inner">
                  <div className="overflow-hidden rounded-[1.5rem] bg-background">
                    <div className="flex flex-col gap-4 p-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-brand" />
                        <span className="text-xs font-medium text-foreground">AI Interview</span>
                      </div>
                      <div className="rounded-xl bg-brand/5 p-4">
                        <div className="space-y-2">
                          <div className="h-2 w-3/4 rounded-full bg-muted-foreground/20" />
                          <div className="h-2 w-1/2 rounded-full bg-muted-foreground/15" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-brand/20" />
                          <span className="text-xs font-medium text-brand">Candidate speaking…</span>
                        </div>
                        <div className="flex h-10 items-end gap-1">
                          {[...Array(24)].map((_, i) => (
                            <div
                              key={i}
                              className="w-1 rounded-full bg-brand/40"
                              style={{
                                height: `${20 + Math.sin(i * 0.8 + Date.now()) * 40}%`,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="rounded-xl bg-muted p-3">
                        <p className="text-sm text-muted-foreground">
                          Tell me about a time you led a team through uncertainty.
                        </p>
                        <p className="mt-2 text-xs text-brand">Transcript recording…</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}