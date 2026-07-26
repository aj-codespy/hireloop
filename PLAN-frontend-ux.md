# Frontend UX Overhaul Plan: HireLoop

**Synthesized from:** Web Interface Guidelines (Vercel) + UI/UX Pro Max Design System + GSAP Core/React/ScrollTrigger  
**Date:** 2026-07-24  
**Priority:** Phased — start with highest impact, lowest risk

---

## Phase 0: Audit Existing Code

Run the web interface guidelines against current source files to baseline violations:

```bash
# Fetch latest Vercel Web Interface Guidelines
curl -s https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
```

Key files to audit:
- `src/app/globals.css` — already has good tokens, elevation, glass, reveal, sheen, texture
- `src/app/layout.tsx` — already includes `reveal` IntersectionObserver inline script
- `src/components/**/*` — all components for a11y, forms, focus states

---

## Phase 1: CSS & Theme Alignment (Design System)

### 1.1 Color Tokens — Align to Professional Navy + Orange CTA

The design system recommended a navy-based palette (#0F172A / #0369A1). **But the existing orange (#ff6b00) brand is already strong** and should be retained as the accent/CTA color. The navy recommendation becomes the new secondary/foreground layer for a more polished B2B feel.

**Changes to `globals.css`:**

| Current | Proposed | Rationale |
|---------|----------|-----------|
| `--primary: #ff6b00` | Keep | Strong brand identity |
| `--foreground: #111827` → `#020617` | Darker | Higher contrast (4.5:1+), more professional |
| `--border: #e5e7eb` → `#e2e8f0` | Minimum change | Slightly cooler, pairs with navy |
| `--secondary: #f3f4f6` → `#f1f5f9` | Slate-based | Matches navy undertones |
| `--muted: #f9fafb` → `#f8fafc` | Slate-based | Consistent with navy scheme |
| Add `--color-surface-card` | `#ffffff` | Explicit card token |
| Add `--space-xs` through `--space-3xl` | Per design system | Density control for dashboards |

### 1.2 Typography — Introduce Plus Jakarta Sans (optional swap)

The design system recommends Plus Jakarta Sans for a friendly, modern SaaS feel. Current font is Geist (by Vercel) — also excellent and already loaded. **Defer font swap** unless the app needs a distinct visual identity shift. Geist is already professional and pairs well.

**Decision:** Keep Geist for now. The typography tokens in `globals.css` (`text-display`, `text-title`, `text-body`, `text-caption`) are solid.

### 1.3 Spacing Variables

Add CSS custom properties for consistent spacing:

```css
:root {
  --space-xs: 0.25rem;   /* 4px */
  --space-sm: 0.5rem;    /* 8px */
  --space-md: 1rem;      /* 16px */
  --space-lg: 1.5rem;    /* 24px */
  --space-xl: 2rem;      /* 32px */
  --space-2xl: 3rem;     /* 48px */
  --space-3xl: 4rem;     /* 64px */
}
```

### 1.4 Component Tokens

Derive component-specific tokens from the existing shadcn/ui layer:

| Component | Requires |
|-----------|----------|
| Cards | Already has `.card`, `.elev-1/2/3`, `.interactive-card` |
| Buttons | shadcn's `Button` component with variants (default/orange, secondary/outline, ghost/destructive) |
| Inputs | shadcn's `Input` wrapper — ensure `--input` border, `--ring` focus |
| Modals | Already has `.glass` utility for backdrop blur |

---

## Phase 2: Web Interface Guidelines Compliance

### 2.1 Accessibility (CRITICAL)

| Task | File/Location | Action |
|------|--------------|--------|
| **Icon buttons need `aria-label`** | Search all `Button` with only icon children | Add `aria-label` prop |
| **Form controls need `<label>`** | All form components | Ensure `Label` from shadcn wraps every input |
| **Keyboard handlers** | Custom interactive elements (cards, menu items) | Add `onKeyDown` for Enter/Space |
| **Semantic HTML** | All pages | Use `<main>`, `<nav>`, `<section>`, `<article>` over generic `<div>` |
| **Heading hierarchy** | Audit all pages | No skipping levels; h1→h2→h3 |
| **`aria-live="polite"`** | Toast/sonner already uses it | Verify |
| **Decorative icons → `aria-hidden`** | All `LucideIcon` usage | Add `aria-hidden` where decorative |

### 2.2 Focus States (HIGH)

| Task | Action |
|------|--------|
| All interactive elements | `className="focus-ring"` utility already exists — apply consistently |
| Never `outline: none` without replacement | Search codebase for `outline-none` — ensure paired with `focus-visible:ring-*` |
| `:focus-visible` over `:focus` | Already handled by shadcn/Tailwind defaults |

### 2.3 Forms (MEDIUM)

Already mostly covered by shadcn/ui components. Specific checks:

| Check | Action |
|-------|--------|
| `autocomplete` attributes | Add to signup, login, candidate forms |
| Correct `inputmode` | `type="email"`, `type="tel"`, `inputMode="numeric"` for numbers |
| Never block paste | Search for `onPaste` + `preventDefault` |
| Labels clickable (wrapping or `htmlFor`) | Verify all shadcn `Label` usage |
| Errors inline next to fields | Verify form error handling per form |
| Placeholders end with `…` | Audit placeholder text |
| Submit button stays enabled until request | Add loading states (`loading` prop on Button) |

### 2.4 Animation — `prefers-reduced-motion`

Already partially handled in `globals.css` lines 295-298. Extend to all interactive transitions:

- All `transition-*` utilities in Tailwind → wrap with `motion-safe:` variant or use `@media (prefers-reduced-motion: reduce)` class
- GSAP animations → use `gsap.matchMedia()` with reduce motion condition
- Vanilla scroll reveal → already has `.reveal` with reduced-motion fallback

### 2.5 Typography (Cleanup)

| Task | Action |
|------|--------|
| `…` not `...` | Search for `\.\.\.` → replace with `…` |
| Curly quotes `""` not straight `""` | Search copy text |
| `font-variant-numeric: tabular-nums` | Add to table/number columns |
| `text-wrap: balance` | Add to heading elements |
| Loading states end with `…` | Audit loading text |

### 2.6 Performance

| Task | Action |
|------|--------|
| Large lists → virtualize | Dashboard tables, candidate lists — use `virtua` or `react-virtuoso` |
| No layout reads in render | Check for `getBoundingClientRect`/`offsetHeight` in render path |
| Images with explicit width/height | All `<Image>` from Next.js should have w/h |
| Below-fold images: `loading="lazy"` | Check all non-critical images |

### 2.7 Dark Mode & Theming

Already well-implemented in `globals.css`. Verify:

- `color-scheme: dark` on `<html>` for dark mode
- `<meta name="theme-color">` matches page background
- Safe-area insets on full-bleed layouts

---

## Phase 3: GSAP Animations

### 3.1 Installation

```bash
cd apps/web
npm install gsap @gsap/react
```

### 3.2 Landing Page Scroll Reveals (ScrollTrigger)

Replace the current CSS-only `.reveal` + IntersectionObserver approach with GSAP ScrollTrigger for more control:

```
Current: CSS `reveal` class + inline IntersectionObserver in layout.tsx
Target: GSAP ScrollTrigger with stagger, scrub, and pin where appropriate
```

**Implementation plan:**

1. Create `src/components/animations/scroll-reveal.tsx` — reusable wrapper:
   - `useGSAP()` with ScrollTrigger
   - Stagger children (`.grid-item` pattern)
   - Respect `prefers-reduced-motion` via `gsap.matchMedia()`
   
2. Replace inline `<script>` in `layout.tsx` with clean GSAP setup
3. Add ScrollTrigger to hero section (fade-in + slight y offset)
4. Feature cards stagger on scroll
5. Pricing section pin + reveal

### 3.3 Dashboard Micro-interactions

Lightweight GSAP animations for admin dashboard:

| Element | Animation | GSAP Pattern |
|---------|-----------|-------------|
| KPI cards | Stagger in from below on page load | `gsap.from('.kpi-card', { y: 20, opacity: 0, stagger: 0.08, duration: 0.4, ease: 'power2.out' })` |
| Pipeline funnel bars | Animate width from 0 | `gsap.from('.funnel-bar', { width: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' })` |
| Recent activity list | Stagger items | `gsap.from('.activity-item', { x: -8, opacity: 0, stagger: 0.05, duration: 0.3 })` |
| Attention items | Sequential entrance | Timeline with subtle stagger |
| Chart tooltips | Hover scale transition | `gsap.to(tooltip, { scale: 1.05, duration: 0.2 })` |
| Sidebar navigation | Active indicator slide | Use CSS transitions (simpler) |

### 3.4 Page Transitions

Add enter animations for route changes:

```
Admin pages: fade-in + subtle slide up (300ms, ease: 'power2.out')
Candidate pages: fade-in (200ms, ease: 'sine.out')
Public pages: ScrollTrigger-based reveals (no forced transition)
```

### 3.5 GSAP Implementation Patterns

```tsx
// scroll-reveal.tsx — reusable ScrollTrigger wrapper
'use client';
import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function ScrollReveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const container = useRef<HTMLDivElement>(null);
  
  useGSAP(() => {
    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
      const items = container.current?.children;
      if (!items || items.length === 0) return;
      
      gsap.from(items, {
        opacity: 0,
        y: 24,
        stagger: { each: 0.08, from: 'start' },
        duration: 0.5,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: container.current,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      });
    });
  }, { scope: container });
  
  return <div ref={container} className={className}>{children}</div>;
}
```

```tsx
// dashboard-animations.tsx — client component wrapping dashboard
'use client';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

export function DashboardAnimations() {
  useGSAP(() => {
    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
      // KPI cards stagger
      gsap.from('.kpi-card', {
        y: 16,
        opacity: 0,
        duration: 0.4,
        stagger: 0.08,
        ease: 'power2.out',
        delay: 0.1,
      });
      // Funnel bars
      gsap.from('.funnel-bar-fill', {
        width: 0,
        duration: 0.6,
        stagger: 0.12,
        ease: 'power3.out',
        delay: 0.3,
      });
    });
  });
  
  return null; // logic-only component
}
```

---

## Phase 4: Component-Level Fixes

### 4.1 Button Consistency

| Aspect | Requirement |
|--------|------------|
| Primary CTA | `bg-brand text-white`, 12px 24px padding, rounded-lg, font-semibold |
| Hover | opacity 0.9, translateY(-1px), 200ms ease |
| Focus | `ring-2 ring-brand ring-offset-2` |
| Loading | Show spinner, disable clicks |
| Disabled | `opacity-50 cursor-not-allowed` |

### 4.2 Card Consistency

Already well-defined (`elev-1/2/3`, `interactive-card`, `show-card-hover`). Audit that all card-like elements use these classes.

### 4.3 Empty States

Every data-display component needs an empty state:

| Page | Empty State Message |
|------|--------------------|
| Jobs list | "No jobs yet — create your first posting" |
| Candidates | "No candidates yet — applications will appear here" |
| Reports | "No data yet — pipeline metrics appear after candidates apply" |
| People Search | "Search your talent pool by name, email, job, or stage" |
| Offers | "No offers yet — create an offer draft when you're ready" |

### 4.4 Error States

Every data-fetching component needs error states:

| Scenario | Treatment |
|----------|-----------|
| API 500 | "Something went wrong — try again" + retry button |
| Network offline | "No connection — check your internet" |
| 404 page | Already has custom 404? Verify |
| Form validation | Inline error message + focus first error field |

---

## Phase 5: Pre-Delivery Checklist

From UI/UX Pro Max `pro-rules.md` — verify for every page:

### Visual Quality
- [ ] No emojis used as icons (SVG only)
- [ ] All icons from consistent set (Lucide — already verified)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Text contrast 4.5:1 minimum in light mode
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected

### Interaction
- [ ] All tappable elements provide feedback (hover/active)
- [ ] Touch targets ≥44×44px
- [ ] Micro-interactions 150-300ms with natural easing
- [ ] Disabled states visually clear and non-interactive
- [ ] Screen reader focus order matches visual order

### Layout
- [ ] Safe areas respected for fixed headers (mobile)
- [ ] No content hidden behind sticky bars
- [ ] Tested at 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile
- [ ] Flex children have `min-w-0` for text truncation

---

## Implementation Order

```
Phase 0: Audit (1 session)        → Find all violations
Phase 1: CSS tokens (1 session)   → Fast, safe, 0 risk
Phase 3: GSAP integration (1-2)   → Landing + dashboard reveals
Phase 2: a11y/focus/forms (2-3)   → Web guidelines fixes
Phase 4: components (1-2)         → Empty states, error states, buttons
Phase 5: Checklist (ongoing)      → Verify before delivery
```

**Total:** ~6-9 focused sessions, parallelizable across pages.

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/animations/scroll-reveal.tsx` | Reusable ScrollTrigger reveal wrapper |
| `src/components/animations/dashboard-animations.tsx` | Dashboard micro-interactions client component |
| `src/components/animations/page-transition.tsx` | Optional page enter transition |

## Files to Modify

| File | Changes |
|------|---------|
| `src/app/globals.css` | Spacing tokens, adjust foreground/border/secondary colors, add card token |
| `src/app/layout.tsx` | Remove inline IntersectionObserver script (replaced by GSAP ScrollTrigger) |
| `src/app/admin/(dashboard)/page.tsx` | Add `<DashboardAnimations />`, ensure KPI/card classnames match |
| Various page components | Add `aria-label`, labels, focus rings, error/empty states |
| Various form components | Add `autocomplete`, `inputmode`, inline validation |

---

## Notes

- **GSAP license:** Standard GSAP is free (MIT). ScrollTrigger is included in the core GSAP package (no Club GSAP required).
- **Existing CSS reveals:** The `.reveal` CSS class and inline IntersectionObserver work well — they can coexist with GSAP or be replaced gradually. Start with GSAP on the landing page (highest visual impact), keep CSS reveals for simple sections.
- **Dark mode:** Already well-handled. Focus on ensuring all new components respect `.dark` class variants.
- **shadcn/ui compatibility:** All component recommendations above are compatible with shadcn's Tailwind-based styling. The color token changes in Phase 1 flow through automatically.
