"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

export function HoverLift({
  children,
  className,
  ...props
}: HTMLMotionProps<"div">) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      whileHover={reduce ? undefined : { y: -2 }}
      transition={{ duration: 0.2, ease }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function PressScale({
  children,
  className,
  ...props
}: HTMLMotionProps<"button"> & { as?: "button" | "div" }) {
  const reduce = useReducedMotion();

  return (
    <motion.button
      type="button"
      whileTap={reduce ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.1 }}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div
      className={className}
      role="status"
      aria-label="Loading"
    >
      <div className="animate-pulse rounded-md bg-muted" />
    </div>
  );
}

export function PageTransition({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
