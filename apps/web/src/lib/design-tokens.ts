// Design tokens for HireLoop - central place for design system values

export const iconTokens = {
  strokeWidth: 1.5,
  sizes: {
    xs: 14,
    sm: 16,
    md: 18,
    lg: 22,
    xl: 26,
    "2xl": 32,
  } as const,
  weights: ["thin", "light", "regular", "bold", "fill", "duotone"] as const,
  defaultWeight: "regular" as const,
};

export const motionTokens = {
  duration: {
    instant: 0,
    fast: 100,
    normal: 200,
    slow: 300,
  },
  easing: {
    standard: [0.22, 1, 0.36, 1] as const,
    accelerate: [0.32, 0, 0.67, 0] as const,
    decelerate: [0, 0, 0.32, 1] as const,
  },
  reducedMotionDuration: 0.01,
} as const;

export const radiusTokens = {
  control: "rounded-lg",     // 8px - buttons, inputs
  card: "rounded-xl",        // 12px - cards
  pill: "rounded-full",      // badges, pills
  sharp: "rounded-none",     // 0px
  subtle: "rounded-sm",      // 2px
  soft: "rounded-2xl",       // 16px
} as const;

export const shadowTokens = {
  card: "shadow-card",
  cardHover: "shadow-card-hover",
  soft: "shadow-soft",
  elev1: "elev-1",
  elev2: "elev-2",
  elev3: "elev-3",
} as const;

export const colorTokens = {
  // Semantic status colors (for badges, indicators)
  status: {
    success: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", darkBg: "dark:bg-emerald-950/30", darkText: "dark:text-emerald-300", darkBorder: "dark:border-emerald-900/30" },
    warning: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", darkBg: "dark:bg-amber-950/30", darkText: "dark:text-amber-300", darkBorder: "dark:border-amber-900/30" },
    info: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", darkBg: "dark:bg-blue-950/30", darkText: "dark:text-blue-300", darkBorder: "dark:border-blue-900/30" },
    destructive: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", darkBg: "dark:bg-red-950/30", darkText: "dark:text-red-300", darkBorder: "dark:border-red-900/30" },
    brand: { bg: "bg-brand/10", text: "text-brand", border: "border-brand/20", darkBg: "dark:bg-brand/20", darkText: "dark:text-brand-foreground", darkBorder: "dark:border-brand/20" },
  },
} as const;