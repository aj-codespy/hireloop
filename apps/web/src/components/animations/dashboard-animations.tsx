"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";

interface DashboardAnimationsProps {
  enabled?: boolean;
}

export function DashboardAnimations({ enabled = true }: DashboardAnimationsProps) {
  useGSAP(() => {
    if (!enabled) return;

    gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
      // KPI cards stagger in
      gsap.from(".kpi-card", {
        y: 20,
        opacity: 0,
        duration: 0.4,
        stagger: 0.08,
        ease: "power2.out",
        delay: 0.1,
      });

      // Funnel bars animate width from 0
      gsap.from(".funnel-bar-fill", {
        width: 0,
        duration: 0.6,
        stagger: 0.12,
        ease: "power3.out",
        delay: 0.3,
      });

      // Activity items stagger in
      gsap.from(".activity-item", {
        x: -10,
        opacity: 0,
        duration: 0.3,
        stagger: 0.05,
        ease: "power2.out",
        delay: 0.4,
      });

      // Attention items sequential entrance
      gsap.from(".attention-item", {
        y: 10,
        opacity: 0,
        duration: 0.35,
        stagger: 0.07,
        ease: "power2.out",
        delay: 0.2,
      });
    });
  }, []);

  return null;
}

interface ChartTooltipProps {
  enabled?: boolean;
}

export function ChartTooltipAnimations({ enabled = true }: ChartTooltipProps) {
  useGSAP(() => {
    if (!enabled) return;

    gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
      const tooltips = document.querySelectorAll<HTMLElement>(".chart-tooltip");
      tooltips.forEach((tooltip) => {
        let animation: gsap.core.Tween | null = null;

        tooltip.addEventListener("mouseenter", () => {
          animation?.kill();
          animation = gsap.to(tooltip, { scale: 1.05, duration: 0.15, ease: "power2.out" });
        });

        tooltip.addEventListener("mouseleave", () => {
          animation?.kill();
          animation = gsap.to(tooltip, { scale: 1, duration: 0.2, ease: "power2.out" });
        });
      });
    });
  }, []);

  return null;
}

interface SidebarIndicatorProps {
  enabled?: boolean;
}

export function SidebarIndicatorAnimations({ enabled = true }: SidebarIndicatorProps) {
  useGSAP(() => {
    if (!enabled) return;

    gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
      const indicator = document.querySelector<HTMLElement>(".sidebar-active-indicator");
      const activeItem = document.querySelector<HTMLElement>(".sidebar-item.active");
      
      if (indicator && activeItem) {
        gsap.set(indicator, { 
          height: activeItem.offsetHeight,
          top: activeItem.offsetTop 
        });
      }

      // Listen for active item changes (via MutationObserver or event delegation)
      const observer = new MutationObserver(() => {
        const newActive = document.querySelector<HTMLElement>(".sidebar-item.active");
        if (newActive && indicator) {
          gsap.to(indicator, {
            height: newActive.offsetHeight,
            top: newActive.offsetTop,
            duration: 0.3,
            ease: "power2.out",
          });
        }
      });

      observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["class"] });

      return () => observer.disconnect();
    });
  }, []);

  return null;
}