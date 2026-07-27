"use client";

import { useRef, useId } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { HTMLAttributes } from "react";

gsap.registerPlugin(useGSAP);

export function FadeIn({
  children,
  className,
  delay = 0,
  ...props
}: HTMLAttributes<HTMLDivElement> & { delay?: number }) {
  const el = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    
    gsap.from(el.current, {
      y: 12,
      opacity: 0,
      duration: 0.5,
      delay,
      ease: "power2.out",
      clearProps: "all"
    });
  }, { scope: el });

  return (
    <div ref={el} className={className} {...props}>
      {children}
    </div>
  );
}

export function FadeInStagger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!container.current) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    
    const items = container.current.querySelectorAll(":scope > .gsap-fade-item");
    if (items.length === 0) return;

    gsap.from(items, {
      y: 14,
      opacity: 0,
      duration: 0.45,
      stagger: 0.08,
      ease: "power2.out",
      clearProps: "all"
    });
  }, { scope: container });

  return (
    <div ref={container} className={className}>
      {children}
    </div>
  );
}

export function FadeInItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  // Add a class that FadeInStagger can query
  const combinedClass = className ? `gsap-fade-item ${className}` : "gsap-fade-item";
  return (
    <div className={combinedClass}>
      {children}
    </div>
  );
}

