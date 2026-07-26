"use client";

import { useRef } from "react";
import Link from "next/link";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface AnimatedStatProps {
  value: number;
  label: string;
  icon: React.ReactNode;
  href: string;
  hint?: string;
}

export function AnimatedStat({ value, label, icon, href, hint }: AnimatedStatProps) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const numRef = useRef<HTMLParagraphElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!cardRef.current || !numRef.current) return;

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // Entry animation: card glides in + icon bounces
      const ctx = gsap.context(() => {
        gsap.from(cardRef.current, {
          y: 24,
          opacity: 0,
          duration: 0.5,
          ease: "power2.out",
          scrollTrigger: {
            trigger: cardRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });

        // Number counter: GSAP smooth interpolation
        ScrollTrigger.create({
          trigger: cardRef.current,
          start: "top 80%",
          once: true,
          onEnter: () => {
            gsap.to(numRef.current, {
              innerText: value,
              duration: 1.2,
              ease: "power2.out",
              snap: { innerText: 1 },
              onUpdate: () => {
                if (numRef.current) {
                  const raw = parseFloat(numRef.current.innerText.replace(/,/g, ""));
                  numRef.current.innerText = Math.round(raw).toLocaleString();
                }
              },
            });

            // Icon subtle pulse on count start
            gsap.fromTo(
              iconRef.current,
              { scale: 0.8, opacity: 0 },
              { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.7)" }
            );
          },
        });
      });

      return () => ctx.revert();
    });
  }, []);

  return (
    <Link href={href} ref={cardRef} className="group block focus-ring">
      <div className="relative min-h-32 p-5 transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:bg-slate-50 motion-reduce:transition-none">
        <div className="flex items-start justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          <div
            ref={iconRef}
            className="rounded-lg bg-orange-50 p-2 text-brand transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:bg-orange-100 group-hover:scale-105"
          >
            {icon}
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-1.5">
          <p
            ref={numRef}
            className="text-4xl font-semibold tracking-[-0.04em] tabular-nums text-foreground"
          >
            0
          </p>
        </div>

        {hint && (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        )}
      </div>
    </Link>
  );
}