"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface AnimatedStatProps {
  value: number;
  label: string;
  icon: React.ReactNode;
  href: string;
  hint?: string;
}

export function AnimatedStat({ value, label, icon, href, hint }: AnimatedStatProps) {
  const [display, setDisplay] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const duration = 1200;
    const steps = 40;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current += increment;
      if (step >= steps) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.round(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <Link href={href} className="block group focus-ring rounded-xl">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all duration-200 group-hover:shadow-md group-hover:-translate-y-0.5 dark:group-hover:shadow-brand/10"
      >
        {/* Gradient accent bar */}
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand/60 via-brand to-brand/60 opacity-0 group-hover:opacity-100 transition-opacity dark:from-brand/40 dark:via-brand dark:to-brand/40" />

        <div className="flex items-start justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className="rounded-lg bg-brand-muted p-2 text-brand transition-colors group-hover:bg-brand group-hover:text-brand-foreground">
            {icon}
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-1.5">
          <motion.p
            className="text-4xl font-bold tabular-nums text-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            {display.toLocaleString()}
          </motion.p>
          <motion.span
            className="h-2 w-2 rounded-full bg-brand"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {hint && (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        )}
      </motion.div>
    </Link>
  );
}