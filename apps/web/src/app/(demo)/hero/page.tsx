"use client";

import Link from "next/link";
import { motion } from "framer-motion";

// Style tokens per your spec
const tokens = {
  primary: "#4A90E2",
  secondary: "#9013FE", 
  accent: "#FFAB00",
  gradient: "linear-gradient(135deg, #4A90E2 0%, #9013FE 70%)",
};

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } } as const,
} as const;

const heroStagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } } as const,
} as const;

export default function HeroDemo() {
  const headline = "Resumes guess. Interviews prove.";
  const subhead = "Structured voice interviews that scale. Candidates talk, AI listens, you get a shortlist — not spreadsheets.";

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent">
      {/* Background gradient layer */}
      <div 
        className="absolute inset-0 -z-10 opacity-90"
        style={{ background: tokens.gradient }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,107,0,0.12),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(255,107,0,0.06),transparent_30%)]" />
      </div>

      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[55%_45%] lg:gap-16">
        {/* Left column: headline + CTAs */}
        <motion.div
          variants={heroStagger}
          initial="hidden"
          animate="visible"
          className="flex flex-col justify-center"
        >
          <motion.div 
            className="mb-6 inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0, duration: 0.6 }}
          >
            Structured hiring workspace
          </motion.div>

          <motion.h1
            className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl"
            variants={fadeInUp}
          >
            {headline}
          </motion.h1>

          <motion.p
            className="mt-6 max-w-lg text-lg text-zinc-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            {subhead}
          </motion.p>

          <motion.div
            className="mt-10 flex flex-wrap items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.6 }}
          >
            <Link
              href="/admin/login"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 font-semibold text-white shadow-lg transition-transform hover:-translate-y-1 hover:shadow-xl"
            >
              Start hiring
            </Link>
            <Link
              href="#workflow"
              className="inline-flex items-center justify-center rounded-lg border-2 border-white/30 bg-transparent px-8 py-3 font-semibold text-white transition-all hover:border-white/50 hover:bg-white/10"
            >
              See how it works
            </Link>
          </motion.div>
        </motion.div>

        {/* Right column: hero illustration / live-interview widget */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
          className="hidden lg:block"
        >
          <div className="relative rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-sm shadow-2xl">
            {/* Phone mockup frame */}
            <div className="relative aspect-[9/19] max-w-[280px] mx-auto rounded-[2.5rem] border-4 border-white/20 bg-zinc-900 p-3 shadow-inner">
              <div className="absolute inset-1 rounded-[2rem] bg-zinc-950 overflow-hidden">
                {/* Interview UI mockup */}
                <div className="flex h-full flex-col p-4">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-brand" />
                      <span className="text-xs font-medium text-white">AI Interview</span>
                    </div>
                    
                    <motion.div
                      className="flex-1 rounded-xl bg-gradient-to-br from-brand/20 to-brand-muted/30 p-4"
                      animate={{ 
                        backgroundColor: ["rgba(74,144,226,0.1)", "rgba(144,19,254,0.1)"],
                      }}
                      transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                    >
                      <div className="space-y-3">
                        <div className="h-2 w-3/4 rounded-full bg-white/20" />
                        <div className="h-2 w-1/2 rounded-full bg-white/15" />
                      </div>
                    </motion.div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-brand/30" />
                        <span className="text-xs font-medium text-brand">Candidate speaking…</span>
                      </div>
                      
                      {/* Waveform visualization */}
                      <div className="flex items-end gap-1 h-10">
                        {[...Array(24)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="w-1 bg-brand rounded-full"
                            animate={{ height: ["20%", "100%", "30%"] }}
                            transition={{ 
                              duration: 1.5, 
                              repeat: Infinity, 
                              delay: i * 0.05,
                              ease: "easeInOut"
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl bg-white/5 p-3">
                      <p className="text-sm text-zinc-300">
                        "Tell me about a time you led a team through uncertainty."
                      </p>
                      <p className="mt-2 text-xs text-brand">Transcript recording…</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Phone button indicator */}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-8 rounded-full bg-white/30" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <svg className="h-6 w-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </motion.div>
    </section>
  );
}