"use client";

import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  opacity?: number;
  scale?: number;
  blur?: string;
  duration?: number;
  ease?: string;
  once?: boolean;
  trigger?: Element | string;
}

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  y = 30,
  opacity = 0,
  scale: startScale,
  blur: startBlur,
  duration = 0.7,
  ease = "power2.out",
  once = true,
  trigger,
}: ScrollRevealProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!elementRef.current) return;
    const resolvedTrigger = trigger ?? elementRef.current;

    const ctx = gsap.context(() => {
      const vars: gsap.TweenVars = { opacity: 1, y: 0, filter: "blur(0px)" };
      const fromVars: gsap.TweenVars = { opacity, y };
      if (startScale !== undefined) {
        fromVars.scale = startScale;
        vars.scale = 1;
      }
      if (startBlur !== undefined) {
        fromVars.filter = `blur(${startBlur})`;
      }
      gsap.set(elementRef.current, fromVars);

      ScrollTrigger.create({
        trigger: resolvedTrigger,
        start: "top 85%",
        onEnter: () =>
          gsap.to(elementRef.current, {
            ...vars,
            duration,
            ease,
            delay,
            stagger: 0.1,
            overwrite: true,
          }),
        once,
        markers: false,
      });
    });

    return () => ctx.revert();
  }, [trigger, once, delay, y, opacity, duration, ease, startScale, startBlur]);

  return (
    <div
      ref={elementRef}
      className={className}
    >
      {children}
    </div>
  );
}

export function StaggerReveal({
  children,
  className = "",
  delay = 0,
  stagger = 0.1,
  y = 30,
  opacity = 0,
  duration = 0.6,
  ease = "power2.out",
  once = true,
}: Omit<ScrollRevealProps, "trigger"> & { stagger?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const childrenRefs = useRef<HTMLElement[]>([]);

  useGSAP(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      const children = containerRef.current!.children;
      const elements: HTMLElement[] = Array.from(children) as HTMLElement[];
      
      gsap.set(elements, { opacity, y });

      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top 85%",
        onEnter: () =>
          gsap.to(elements, {
            opacity: 1,
            y: 0,
            duration,
            ease,
            delay,
            stagger,
            overwrite: true,
          }),
        once,
        markers: false,
      });
    });

    return () => ctx.revert();
  }, [once, delay, stagger, y, opacity, duration, ease]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}