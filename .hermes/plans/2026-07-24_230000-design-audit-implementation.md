# HireLoop Design Audit & Remediation Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Systematically fix all 11 design errors + anti-patterns identified in the design-taste-frontend audit across the HireLoop admin dashboard, candidate portal, and interviewer flows. Replace Lucide icons with Phosphor, eliminate em-dashes, fix layout repetition, add real imagery, implement purposeful motion, and establish design system coherence.

**Architecture:** Multi-phase remediation starting with foundation (icons, tokens, globals), then component-level fixes, then page-level layout restructuring, then motion/interaction layer, then imagery/illustration system. Each phase is independently verifiable.

**Tech Stack:** Next.js 15 (App Router), Tailwind v4, @base-ui/react primitives, Framer Motion, @phosphor-icons/react, shadcn/ui patterns, Zustand store, Supabase backend.

---

## Phase 0: Foundation & Tooling (Prerequisites)

### Task 0.1: Install Phosphor Icons & Remove Lucide Dependency

**Objective:** Replace all `lucide-react` imports with `@phosphor-icons/react` across the codebase.

**Files:**
- Create: `package.json` (dependency addition)
- Modify: All files importing from `lucide-react` (20+ files)

**Step 1: Add dependency**
```bash
cd /Users/aj_builds/Documents/Programs/HireLoop/apps/web
npm install @phosphor-icons/react
npm uninstall lucide-react
```

**Step 2: Create icon mapping reference**
Create `apps/web/src/components/icons/icon-map.ts`:
```typescript
// Phosphor icon name mappings for all Lucide icons currently used
export const ICON_MAP = {
  // Navigation & UI
  Menu: "List",
  X: "X",
  ChevronRight: "CaretRight",
  ChevronLeft: "CaretLeft",
  ChevronUp: "CaretUp",
  ChevronDown: "CaretDown",
  Plus: "Plus",
  Minus: "Minus",
  Search: "MagnifyingGlass",
  
  // Actions
  Trash2: "Trash",
  Edit: "Pencil",
  Copy: "Copy",
  Download: "Download",
  Upload: "Upload",
  Share: "ShareNetwork",
  Settings: "Gear",
  Refresh: "ArrowClockwise",
  
  // Status
  CheckCircle2: "CheckCircle",
  XCircle: "XCircle",
  AlertCircle: "WarningCircle",
  Info: "Info",
  ShieldAlert: "ShieldWarning",
  
  // Media
  Volume2: "SpeakerHigh",
  Mic: "Microphone",
  Video: "Video",
  Camera: "Camera",
  Image: "Image",
  
  // Layout
  LayoutGrid: "GridFour",
  List: "List,
  Grid: "GridFour",
  
  // User & Auth
  User: "User",
  Users: "Users",
  LogIn: "SignIn",
  LogOut: "SignOut",
  Mail: "Envelope,
  Lock: "Lock",
  Unlock: "LockOpen",
  Eye: "Eye",
  EyeOff: "EyeSlash",
  
  // Time & Calendar
  Calendar: "Calendar",
  Clock: "Clock",
  Timer: "Timer",
  
  // Data
  File: "File",
  FileText: "FileText",
  Folder: "Folder",
  Database: "Database",
  Server: "Server",
  
  // Communication
  MessageSquare: "Chat",
  Send: "Send",
  Bell: "Bell",
  Flag: "Flag",
  
  // Arrows & Navigation
  ArrowRight: "ArrowRight",
  ArrowLeft: "ArrowLeft",
  ArrowUp: "ArrowUp",
  ArrowDown: "ArrowDown",
  ExternalLink: "ArrowSquareOut",
  
  // Misc
  Home: "House",
  Briefcase: "Briefcase",
  Building: "Building",
  Globe: "Globe",
  Link: "Link",
  Tag: "Tag",
  Bookmark: "Bookmark",
  Star: "Star",
  Heart: "Heart",
  Layers: "Layers",
  Zap: "Lightning",
  Target: "Target",
  Filter: "Funnel",
  Sort: "ArrowsUpDown",
} as const;

export type LucideIconName = keyof typeof ICON_MAP;
export type PhosphorIconName = typeof ICON_MAP[LucideIconName];
```

**Step 3: Create Phosphor wrapper component**
Create `apps/web/src/components/icons/phosphor-icon.tsx`:
```tsx
"use client";

import * as PhosphorIcons from "@phosphor-icons/react";
import { ICON_MAP, type LucideIconName } from "./icon-map";
import { cn } from "@/lib/utils";

interface PhosphorIconProps {
  name: LucideIconName;
  className?: string;
  size?: number;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  "aria-hidden"?: boolean;
}

export function PhosphorIcon({ 
  name, 
  className, 
  size = 18, 
  weight = "regular",
  "aria-hidden": ariaHidden = true,
  ...props 
}: PhosphorIconProps) {
  const phosphorName = ICON_MAP[name];
  const IconComponent = PhosphorIcons[phosphorName as keyof typeof PhosphorIcons];
  
  if (!IconComponent) {
    console.warn(`Phosphor icon not found for Lucide name: ${name}, mapped to: ${phosphorName}`);
    return null;
  }
  
  const WeightedIcon = IconComponent[weight as keyof typeof IconComponent] || IconComponent.regular;
  
  return (
    <WeightedIcon
      className={cn("shrink-0", className)}
      size={size}
      strokeWidth={1.5}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}

// Export all icons as named exports for gradual migration
export * from "@phosphor-icons/react";
```

**Step 4: Run codemod to replace imports**
```bash
# Create a script to automate the replacement
cat > /tmp/replace-lucide.js << 'EOF'
const fs = require('fs');
const path = require('path');

const replacements = [
  // Import statements
  [/import\s+\{([^}]+)\}\s+from\s+["']lucide-react["']/g, (match, imports) => {
    const iconNames = imports.split(',').map(s => s.trim());
    const phosphorImports = iconNames.map(name => `PhosphorIcon as ${name}`).join(', ');
    return `import { ${phosphorImports} } from "@/components/icons/phosphor-icon"`;
  }),
  // Usage: <IconName ... /> -> <PhosphorIcon name="IconName" ... />
  [/<(\w+)\s+className=\{([^}]+)\}\s*\/>/g, (match, name, className) => {
    // This needs AST parsing for accuracy - manual review required
    return match;
  }),
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  for (const [regex, replacer] of replacements) {
    const newContent = content.replace(regex, replacer);
    if (newContent !== content) {
      content = newContent;
      changed = true;
    }
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated: ${filePath}`);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      walk(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

walk('/Users/aj_builds/Documents/Programs/HireLoop/apps/web/src');
EOF
node /tmp/replace-lucide.js
```

**Step 5: Manual review & fix remaining usages**
- Search for remaining `lucide-react` imports: `grep -r "lucide-react" apps/web/src --include="*.tsx"`
- Fix each file manually using the `PhosphorIcon` wrapper

**Verification:**
```bash
grep -r "lucide-react" apps/web/src --include="*.tsx" || echo "SUCCESS: No lucide-react imports remain"
npm run build
npm run test
```

**Commit:**
```bash
git add -A
git commit -m "feat: migrate from lucide-react to @phosphor-icons/react across codebase"
```

---

### Task 0.2: Establish Global Stroke Width & Icon System

**Objective:** Standardize `strokeWidth: 1.5` globally and create consistent icon usage patterns.

**Files:**
- Modify: `apps/web/src/components/icons/phosphor-icon.tsx`
- Create: `apps/web/src/components/icons/index.ts` (barrel export)
- Modify: `apps/web/src/lib/design-tokens.ts` (add icon tokens)

**Step 1: Update design tokens with icon system**
```typescript
// In design-tokens.ts, add:
export const iconTokens = {
  strokeWidth: 1.5,
  sizes: {
    xs: 14,
    sm: 16,
    md: 18,
    lg: 22,
    xl: 26,
    "2xl": 32,
  },
  weights: ["thin", "light", "regular", "bold", "fill", "duotone"] as const,
  defaultWeight: "regular" as const,
};
```

**Step 2: Update PhosphorIcon component to use tokens**
```tsx
// In phosphor-icon.tsx
import { iconTokens } from "@/lib/design-tokens";

interface PhosphorIconProps {
  // ... existing
  size?: keyof typeof iconTokens.sizes | number;
  weight?: typeof iconTokens.defaultWeight;
}

// In component:
const iconSize = typeof size === "number" ? size : iconTokens.sizes[size] || iconTokens.sizes.md;
const strokeWidth = iconTokens.strokeWidth;
```

**Verification:**
```bash
npm run build
# Check bundle size didn't regress significantly
```

---

### Task 0.3: Em-Dash / Curly Quote Eradication (Hard Ban)

**Objective:** Remove all em-dashes (—), en-dashes (–), and curly quotes ('') from visible text. Replace with hyphens (-) and straight quotes (').

**Files:** All `.tsx`, `.ts`, `.md` files in `apps/web/src`

**Step 1: Audit current violations**
```bash
# Find all em-dashes
grep -r "—" apps/web/src --include="*.tsx" --include="*.ts" --include="*.md"
# Find all en-dashes
grep -r "–" apps/web/src --include="*.tsx" --include="*.ts" --include="*.md"
# Find curly quotes
grep -r "[\"\"'']" apps/web/src --include="*.tsx" --include="*.ts" --include="*.md" | grep -v "node_modules"
```

**Step 2: Create replacement script**
```bash
cat > /tmp/fix-dashes.js << 'EOF'
const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // Em-dash -> hyphen (but preserve in code comments if needed)
  const newContent = content
    .replace(/—/g, '-')
    .replace(/–/g, '-')
    .replace(/"/g, '"')
    .replace(/"/g, '"')
    .replace(/'/g, "'")
    .replace(/'/g, "'");
  
  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent);
    console.log(`Fixed: ${filePath}`);
    return true;
  }
  return false;
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      walk(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.md')) {
      fixFile(fullPath);
    }
  }
}

walk('/Users/aj_builds/Documents/Programs/HireLoop/apps/web/src');
EOF
node /tmp/fix-dashes.js
```

**Step 3: Add lint rule to prevent regression**
Create `apps/web/.eslintrc.dashes.js`:
```javascript
module.exports = {
  rules: {
    "no-em-dash": "error",
    "no-en-dash": "error",
    "no-curly-quotes": "error",
  },
  // Custom rules would need a plugin - for now add to CI
};
```

Add to `package.json` scripts:
```json
"lint:dashes": "grep -r '—|–|[\"\"\\'\\']' apps/web/src --include=\"*.tsx\" --include=\"*.ts\" && exit 1 || exit 0"
```

**Verification:**
```bash
npm run lint:dashes
# Should exit 0 (no matches)
```

---

## Phase 1: Component-Level Fixes (Design System Primitives)

### Task 1.1: Button Component — Add PressScale & HoverLift Variants

**Objective:** Add tactile feedback (PressScale) and hover lift (HoverLift) to all button variants using Framer Motion, respecting `prefers-reduced-motion`.

**Files:**
- Modify: `apps/web/src/components/ui/button.tsx`
- Test: `apps/web/src/components/ui/__tests__/button.test.tsx`

**Step 1: Write failing test**
```tsx
// button.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

test("Button has PressScale animation on tap", () => {
  render(<Button>Click me</Button>);
  const button = screen.getByRole("button");
  expect(button).toBeInTheDocument();
  // Motion props should be present
  expect(button).toHaveAttribute("whileTap"); // or similar
});

test("Button respects prefers-reduced-motion", () => {
  // Mock matchMedia for reduced motion
  const originalMatchMedia = window.matchMedia;
  window.matchMedia = jest.fn().mockImplementation(query => ({
    matches: query === "(prefers-reduced-motion: reduce)",
    addListener: jest.fn(),
    removeListener: jest.fn(),
  }));
  
  render(<Button>Test</Button>);
  const button = screen.getByRole("button");
  // Should not have animation props when reduced motion
  // Implementation detail check
  
  window.matchMedia = originalMatchMedia;
});
```

**Step 2: Implement PressScale + HoverLift in Button**
```tsx
// button.tsx - wrap with motion.button and add variants
"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import { iconTokens } from "@/lib/design-tokens";

const ease = [0.22, 1, 0.36, 1] as const;

const buttonVariants = {
  initial: { scale: 1 },
  hover: { y: -1 },
  tap: { scale: 0.98 },
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "brand";
  size?: "default" | "sm" | "lg" | "xl" | "icon" | "icon-sm";
  asChild?: boolean;
  loading?: boolean;
  disableAnimation?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, loading, disableAnimation, children, disabled, ...props }, ref) => {
    const reduce = useReducedMotion();
    const shouldAnimate = !reduce && !disableAnimation;
    
    const Comp = asChild ? Slot : "button";
    
    return (
      <motion.button
        ref={ref}
        as={Comp}
        className={cn(buttonVariantsClass[variant], buttonSizeClass[size], className)}
        disabled={disabled || loading}
        aria-busy={loading}
        whileHover={shouldAnimate ? { y: -1, transition: { duration: 0.15, ease } } : undefined}
        whileTap={shouldAnimate ? { scale: 0.98, transition: { duration: 0.08 } } : undefined}
        transition={{ ease }}
        {...props}
      >
        {loading ? (
          <>
            <motion.span
              initial={false}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden="true"
            />
            <span className="sr-only">Loading</span>
          </>
        ) : (
          children
        )}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

// ... existing variant/size classes unchanged
```

**Step 3: Run tests**
```bash
npm test -- apps/web/src/components/ui/__tests__/button.test.tsx
```

---

### Task 1.2: Card Component — Add HoverLift & Consistent Radius System

**Objective:** Add subtle hover lift to interactive cards, enforce single radius system per page (Shape Consistency Lock §4.4).

**Files:**
- Modify: `apps/web/src/components/ui/card.tsx`
- Create: `apps/web/src/components/ui/card-variants.ts` (radius presets)

**Step 1: Create radius preset system**
```typescript
// card-variants.ts
export const cardRadiusPresets = {
  sharp: "rounded-none",
  subtle: "rounded-sm",      // 2px
  default: "rounded-lg",     // 8px (current default)
  soft: "rounded-xl",        // 12px
  pill: "rounded-2xl",       // 16px
  full: "rounded-full",
} as const;

export type CardRadiusPreset = keyof typeof cardRadiusPresets;

// Page-level radius lock - set once per page
export function getCardRadiusClass(preset: CardRadiusPreset = "default") {
  return cardRadiusPresets[preset];
}
```

**Step 2: Update Card component**
```tsx
// card.tsx
"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getCardRadiusClass, type CardRadiusPreset } from "./card-variants";

const ease = [0.22, 1, 0.36, 1] as const;

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  radius?: CardRadiusPreset;
  interactive?: boolean;
  disableAnimation?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, radius = "default", interactive = false, disableAnimation, children, ...props }, ref) => {
    const reduce = useReducedMotion();
    const shouldAnimate = interactive && !reduce && !disableAnimation;
    
    return (
      <motion.div
        ref={ref}
        className={cn(
          "bg-card text-card-foreground shadow-card border border-border",
          getCardRadiusClass(radius),
          className
        )}
        whileHover={shouldAnimate ? { y: -2, boxShadow: "0 12px 40px rgba(0,0,0,0.1)" } : undefined}
        transition={{ duration: 0.2, ease }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = "Card";

// CardHeader, CardTitle, CardDescription, CardContent, CardFooter unchanged
// but add radius prop pass-through if needed
```

**Step 3: Apply consistent radius per page**
- Admin dashboard pages: `radius="default"` (rounded-lg)
- Candidate portal: `radius="soft"` (rounded-xl)
- Interview flow: `radius="pill"` (rounded-2xl) for friendly feel
- Proctoring review: `radius="subtle"` (rounded-sm) for data density

---

### Task 1.3: Badge Component — Semantic Variants & Contrast Audit

**Objective:** Ensure all badge variants pass WCAG AA contrast (4.5:1) in both light/dark modes. Add `success`, `warning`, `info` semantic variants.

**Files:**
- Modify: `apps/web/src/components/ui/badge.tsx`
- Test: `apps/web/src/components/ui/__tests__/badge.test.tsx`

**Step 1: Audit current contrast**
```bash
# Check current badge colors in design-tokens.ts and badge.tsx
# Light mode: bg-slate-100 text-slate-700 = 5.2:1 ✓
# Dark mode: bg-slate-800 text-slate-200 = 4.8:1 ✓ (barely)
# Destructive: bg-red-50 text-red-700 / dark:bg-red-950/50 text-red-300
# Need to verify all combinations
```

**Step 2: Update badge with semantic variants + contrast-safe tokens**
```tsx
// badge.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";

const badgeVariants = {
  default: "bg-brand/10 text-brand border border-brand/20 dark:bg-brand/20 dark:text-brand-foreground",
  secondary: "bg-muted text-muted-foreground border border-border",
  destructive: "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900/30",
  outline: "bg-transparent text-foreground border border-border",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/30",
  warning: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/30",
  info: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/30",
  brand: "bg-brand text-brand-foreground border-transparent",
} as const;

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof badgeVariants;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", size = "md", animate = false, children, ...props }, ref) => {
    const reduce = useReducedMotion();
    
    return (
      <motion.span
        ref={ref}
        className={cn(
          "inline-flex items-center font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          badgeVariants[variant],
          {
            "px-2 py-0.5 text-[10px]": size === "sm",
            "px-2.5 py-0.5 text-xs": size === "md",
            "px-3 py-1 text-sm": size === "lg",
          },
          className
        )}
        initial={animate && !reduce ? { opacity: 0, scale: 0.9 } : false}
        animate={animate && !reduce ? { opacity: 1, scale: 1, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } } : false}
        {...props}
      >
        {children}
      </motion.span>
    );
  }
);

Badge.displayName = "Badge";
export { Badge, badgeVariants };
```

**Step 3: Test contrast with axe-core**
```bash
npm test -- --testPathPattern=badge
# Add accessibility test
```

---

### Task 1.4: Input/Textarea/Select — Form Contrast Audit & Focus Rings

**Objective:** Verify all form inputs pass WCAG AA (4.5:1) for borders, placeholder text, focus rings, error states in both themes.

**Files:**
- Modify: `apps/web/src/components/ui/input.tsx`
- Modify: `apps/web/src/components/ui/textarea.tsx`
- Modify: `apps/web/src/components/ui/select.tsx`
- Test: `apps/web/src/components/ui/__tests__/form-contrast.test.tsx`

**Step 1: Update Input with contrast-safe tokens**
```tsx
// input.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  label?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, helperText, id, "aria-describedby": ariaDescribedBy, ...props }, ref) => {
    const reduce = useReducedMotion();
    const describedBy = [error && `${id}-error`, helperText && `${id}-helper`].filter(Boolean).join(" ") || undefined;
    
    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <motion.input
          ref={ref}
          type={type}
          id={id}
          "aria-describedby"{describedBy}
          "aria-invalid"{error}
          className={cn(
            "flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm",
            "placeholder:text-muted-foreground/60",
            "transition-colors duration-150 ease-out",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "data-[error]:border-destructive data-[error]:focus-visible:ring-destructive/50",
            error && "border-destructive focus-visible:ring-destructive/50",
            className
          )}
          initial={false}
          whileFocus={!reduce ? { borderColor: "hsl(var(--ring))" } : undefined}
          transition={{ duration: 0.15 }}
          {...props}
        />
        {error && (
          <motion.p
            id={`${id}-error`}
            className="text-sm text-destructive"
            role="alert"
            initial={!reduce ? { opacity: 0, y: -4 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            {error}
          </motion.p>
        )}
        {helperText && !error && (
          <p id={`${id}-helper`} className="text-sm text-muted-foreground">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input };
```

**Step 2: Apply same pattern to Textarea & Select**

**Step 3: Write contrast test**
```tsx
// form-contrast.test.tsx
import { render } from "@testing-library/react";
import { Input } from "@/components/ui/input";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

test("Input passes WCAG AA in light mode", async () => {
  const { container } = render(
    <div data-theme="light">
      <Input label="Email" placeholder="you@example.com" />
    </div>
  );
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

test("Input passes WCAG AA in dark mode", async () => {
  const { container } = render(
    <div data-theme="dark" className="dark">
      <Input label="Email" placeholder="you@example.com" />
    </div>
  );
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

test("Input error state has sufficient contrast", async () => {
  const { container } = render(
    <Input label="Email" value="invalid" error="Invalid email format" />
  );
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

### Task 1.5: Table Component — Row Hover, Striped, Reduced Motion

**Objective:** Add subtle row hover, optional striping, and keyboard navigation. Respect reduced motion.

**Files:**
- Modify: `apps/web/src/components/ui/table.tsx`
- Test: `apps/web/src/components/ui/__tests__/table.test.tsx`

**Step 1: Enhanced TableRow with motion**
```tsx
// table.tsx additions
import { motion, useReducedMotion } from "framer-motion";

function TableRow({ className, interactive = false, ...props }: React.HTMLAttributes<HTMLTableRowElement> & { interactive?: boolean }) {
  const reduce = useReducedMotion();
  
  return (
    <motion.tr
      className={cn(
        "border-b transition-colors",
        "hover:bg-muted/50",
        "data-[state=selected]:bg-muted",
        interactive && "cursor-pointer",
        className
      )}
      whileHover={interactive && !reduce ? { backgroundColor: "hsl(var(--muted) / 0.5)" } : undefined}
      transition={{ duration: 0.1 }}
      {...props}
    />
  );
}
```

**Step 2: Add striped variant to Table**
```tsx
function Table({ className, striped = false, ...props }: React.TableHTMLAttributes<HTMLTableElement> & { striped?: boolean }) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table
        data-slot="table"
        className={cn(
          "w-full caption-bottom text-sm",
          striped && "[&_tr:nth-child(even)]:bg-muted/30",
          className
        )}
        {...props}
      />
    </div>
  );
}
```

---

## Phase 2: Layout & Page Structure Fixes

### Task 2.1: AdminPageFrame — Layout Variants (Split, Centered, Full)

**Objective:** Replace forced centered layout with configurable layout variants per page type.

**Files:**
- Modify: `apps/web/src/components/layout/admin-page-frame.tsx`
- Modify: `apps/web/src/app/admin/(dashboard)/layout.tsx`
- Create: `apps/web/src/components/layout/page-layouts.ts`

**Step 1: Create layout variants**
```typescript
// page-layouts.ts
export type PageLayout = "centered" | "split" | "full" | "sidebar-main";

export interface PageLayoutConfig {
  layout: PageLayout;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  sidebarWidth?: number;
  splitRatio?: number; // 0-1 for split layout
}

export const defaultLayouts: Record<string, PageLayoutConfig> = {
  dashboard: { layout: "split", maxWidth: "full", splitRatio: 0.25 },
  jobs: { layout: "centered", maxWidth: "2xl" },
  candidates: { layout: "centered", maxWidth: "full" },
  "job-detail": { layout: "sidebar-main", maxWidth: "full", sidebarWidth: 280 },
  "candidate-detail": { layout: "sidebar-main", maxWidth: "full", sidebarWidth: 320 },
  proctoring: { layout: "full", maxWidth: "full" },
  settings: { layout: "centered", maxWidth: "lg" },
  default: { layout: "centered", maxWidth: "2xl" },
};
```

**Step 2: Update AdminPageFrame**
```tsx
// admin-page-frame.tsx
"use client";

import { usePathname } from "next/navigation";
import { getAdminRouteMeta } from "@/lib/navigation/admin-routes";
import { AppBreadcrumbs } from "@/components/layout/app-breadcrumbs";
import { PageHeader } from "@/components/layout/page-header";
import { PageTransition } from "@/components/motion/interactions";
import { defaultLayouts, type PageLayoutConfig } from "@/components/layout/page-layouts";
import { cn } from "@/lib/utils";

interface AdminPageFrameProps {
  children: React.ReactNode;
  layout?: PageLayoutConfig;
}

export function AdminPageFrame({ children, layout }: AdminPageFrameProps) {
  const pathname = usePathname();
  const meta = getAdminRouteMeta(pathname);
  const config = layout || defaultLayouts[meta?.key || "default"] || defaultLayouts.default;
  
  const layoutClasses = {
    centered: "mx-auto w-full",
    full: "w-full",
    split: "w-full",
    "sidebar-main": "w-full",
  };
  
  const maxWidthClasses = {
    sm: "max-w-3xl",
    md: "max-w-4xl",
    lg: "max-w-5xl",
    xl: "max-w-6xl",
    "2xl": "max-w-7xl",
    full: "max-w-full",
  };

  return (
    <PageTransition className={cn(
      layoutClasses[config.layout],
      maxWidthClasses[config.maxWidth || "2xl"]
    )}>
      {meta?.breadcrumbs ? <AppBreadcrumbs items={meta.breadcrumbs} /> : null}
      {pathname !== "/admin" && meta ? (
        <PageHeader title={meta.title} description={meta.description} />
      ) : null}
      
      {config.layout === "split" && (
        <div className="grid gap-6 lg:grid-cols-4">
          <aside className="lg:col-span-1">
            {/* Sidebar content - injected via context or slot */}
            <Slot name="sidebar" />
          </aside>
          <main className="lg:col-span-3 min-w-0">{children}</main>
        </div>
      )}
      
      {config.layout === "sidebar-main" && (
        <div className="flex gap-6">
          <aside className={cn("flex-shrink-0", `w-[${config.sidebarWidth || 280}px]`)}>
            <Slot name="sidebar" />
          </aside>
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      )}
      
      {(config.layout === "centered" || config.layout === "full") && (
        <main>{children}</main>
      )}
    </PageTransition>
  );
}
```

**Step 3: Update dashboard layout to use split**
```tsx
// apps/web/src/app/admin/(dashboard)/layout.tsx
import { AdminPageFrame } from "@/components/layout/admin-page-frame";
import