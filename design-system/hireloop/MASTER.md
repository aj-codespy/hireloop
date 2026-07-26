# Design System Master File — HireLoop

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.  
> If that file exists, its rules **override** this Master file.  
> If not, strictly follow the rules below.

---

**Project:** HireLoop  
**Updated:** 2026-07-24  
**Category:** SaaS (B2B Enterprise Hiring Platform)  
**Design Positioning:** "Stripe meets Linear meets Apple" — Enterprise-grade, calm, trustworthy, intelligent. Not an HR dashboard. Not an AI demo. A hiring platform.

---

## Brand Personality

### Trustworthy
Not flashy. Looks like software an enterprise would buy. SOC2, GDPR, ISO 27001, Audit Logs, Encryption, Enterprise Ready — every page subtly reinforces security.

### Calm
Generous whitespace. No visual noise. Nothing screams for attention. **60% spacing, 40% content.**

### Intelligent
UI communicates sophistication without gradients, glows, or effects. Restrained color, great typography, great spacing.

### Human
This isn't an AI company. It's a hiring company powered by AI. Visuals emphasize people making decisions — not robots replacing recruiters. Real screenshots, recruiter reviewing, candidate interview, waveforms, AI summaries, pipelines, real reports.

---

## Brand Pillars

### 1. AI with Human Oversight
Every screen reinforces: **AI assists. Humans decide.**  
Avoid visuals that make AI feel autonomous.

### 2. Enterprise First
SOC2, GDPR, ISO 27001, Encryption, Audit Logs, Private, Secure.  
Every page subtly reinforces security. Trust strip: elegant, minimal, not a badge wall.

### 3. Calm Confidence
**Never use:** bright gradients, neon, glowing effects, huge animations, loud illustrations.  
**Instead:** soft depth, rounded surfaces, high-quality typography, generous spacing.

---

## Visual Language — Reference Targets

**Not:** Marketing website  
**Yes:** Stripe Docs, Linear, Vercel, Mercury, Notion, Apple Business, Rippling

**Hero Principle:** Left = Headline + Supporting copy + CTA + Trust. Right = The Product (not an illustration). Dashboard occupies ~60% of hero. Think Apple, Stripe, Arc Browser, Linear.

---

## Color System

### Primary — Rust Orange
| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#F97316` | `--color-brand` |
| Primary Dark (hover/active) | `#EA6B2D` | `--color-brand-dark` |

**Usage:** Primary buttons, highlights, active states, charts, icons. **Maximum 10% of page.**

### Backgrounds
| Role | Hex | CSS Variable |
|------|-----|--------------|
| Page Background | `#FFFFFF` | `--color-bg` |
| Secondary Background | `#FAFAF9` | `--color-bg-secondary` |
| Cards | `#FFFFFF` | `--color-card` |
| Dark Sections (Security/Enterprise/Compliance only) | `#0F1115` | `--color-bg-dark` |

### Text
| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#111827` | `--color-text-primary` |
| Secondary | `#6B7280` | `--color-text-secondary` |
| Muted | `#9CA3AF` | `--color-text-muted` |

### Semantic
| Role | Hex | CSS Variable |
|------|-----|--------------|
| Success | `#16A34A` | `--color-success` |
| Danger | `#DC2626` | `--color-danger` |
| Border | `#ECECEC` | `--color-border` |

### Accent Ratio (Target)
```
90% White
8%  Gray
2%  Orange
```
Orange is valuable because it's rare.

---

## CSS Variables (Complete)

```css
:root {
  /* Brand */
  --color-brand: #F97316;
  --color-brand-dark: #EA6B2D;
  
  /* Backgrounds */
  --color-bg: #FFFFFF;
  --color-bg-secondary: #FAFAF9;
  --color-card: #FFFFFF;
  --color-bg-dark: #0F1115;
  
  /* Text */
  --color-text-primary: #111827;
  --color-text-secondary: #6B7280;
  --color-text-muted: #9CA3AF;
  
  /* Semantic */
  --color-success: #16A34A;
  --color-danger: #DC2626;
  --color-border: #ECECEC;
  
  /* Shadows */
  --shadow-soft: 0 12px 40px rgba(15, 15, 15, 0.08);
  --shadow-card: 0 1px 3px rgba(15, 15, 15, 0.05), 0 1px 2px rgba(15, 15, 15, 0.03);
  
  /* Radius */
  --radius-card: 24px;
  --radius-button: 999px;
  --radius-input: 16px;
  --radius-dashboard: 20px;
  
  /* Spacing Scale */
  --space-section: 160px;   /* Section to section */
  --space-cards: 40px;       /* Card to card */
  --space-card-inner: 24px;  /* Inside cards */
  --space-icon: 16px;        /* Icon gaps */
  
  /* Motion */
  --duration-fast: 250ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
```

---

## Typography

**Font Family:** `Inter` or `Geist` (system fallback: system-ui, -apple-system, BlinkMacSystemFont)  
**Weights:** 700–800 for headings, 400–500 for body

| Role | Size (Mobile) | Size (Desktop) | Weight | Line Height | CSS Variable |
|------|---------------|----------------|--------|-------------|--------------|
| Hero Headline | 48–56px | 64–72px | 700–800 | 1.1 | `--text-hero` |
| Section Title | 32–40px | 40–48px | 700 | 1.15 | `--text-section` |
| Card Title | 20–24px | 24px | 600 | 1.2 | `--text-card-title` |
| Body | 16–18px | 18px | 400 | 1.6 | `--text-body` |
| Small / Caption | 13–14px | 14px | 400 | 1.5 | `--text-small` |

**Rules:**
- Never center-align paragraphs. Left-aligned, editorial feel.
- Generous line-height for readability.
- Hierarchy through weight + size, not color.

---

## Spacing System

> This is where premium comes from. Never pack things tightly.

| Context | Space | CSS Variable |
|---------|-------|--------------|
| Section → Section | 160px | `--space-section` |
| Card → Card | 40px | `--space-cards` |
| Inside Card | 24px | `--space-card-inner` |
| Icon / Inline | 16px | `--space-icon` |

**Card Content Ratio:** 40% content, 60% whitespace.

---

## Border Radius

| Component | Radius | CSS Variable |
|-----------|--------|--------------|
| Cards | 24px | `--radius-card` |
| Buttons | 999px (pill) | `--radius-button` |
| Inputs | 16px | `--radius-input` |
| Dashboard Cards | 20px | `--radius-dashboard` |

---

## Shadows

**Soft only.** Avoid huge blurred shadows.

```css
/* Card / Surface */
--shadow-card: 0 1px 3px rgba(15, 15, 15, 0.05), 0 1px 2px rgba(15, 15, 15, 0.03);

/* Elevated (hover, modals, hero product shot) */
--shadow-soft: 0 12px 40px rgba(15, 15, 15, 0.08);
```

---

## Component Specifications

### Buttons

```css
/* Primary — Rust Orange, Pill */
.btn-primary {
  background: var(--color-brand);
  color: white;
  padding: 14px 28px;
  border-radius: var(--radius-button);
  font-weight: 600;
  font-size: 16px;
  border: none;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}
.btn-primary:hover {
  background: var(--color-brand-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-soft);
  border-color: var(--color-brand);
}

/* Secondary — Ghost, Dark Border */
.btn-secondary {
  background: transparent;
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  padding: 14px 28px;
  border-radius: var(--radius-button);
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}
.btn-secondary:hover {
  background: var(--color-bg-secondary);
  border-color: var(--color-text-muted);
}

/* Subtle — Text only */
.btn-subtle {
  background: transparent;
  color: var(--color-brand);
  border: none;
  padding: 12px 16px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
}
.btn-subtle:hover {
  background: rgba(249, 115, 22, 0.08);
}
```

### Cards

```css
.card {
  background: var(--color-card);
  border-radius: var(--radius-card);
  padding: var(--space-card-inner);
  box-shadow: var(--shadow-card);
  border: 1px solid var(--color-border);
  transition: all var(--duration-fast) var(--ease-out);
}
.card:hover {
  box-shadow: var(--shadow-soft);
  transform: translateY(-2px);
  border-color: var(--color-brand);
}
```

### Inputs

```css
.input {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-input);
  font-size: 16px;
  font-family: inherit;
  color: var(--color-text-primary);
  background: var(--color-bg);
  transition: border-color var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out);
}
.input:focus {
  outline: none;
  border-color: var(--color-brand);
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.12);
}
.input::placeholder {
  color: var(--color-text-muted);
}
```

### Badges / Pills

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
}
.badge-default { background: var(--color-bg-secondary); color: var(--color-text-secondary); }
.badge-success { background: rgba(22, 163, 74, 0.1); color: var(--color-success); }
.badge-warning { background: rgba(249, 115, 22, 0.1); color: var(--color-brand); }
.badge-danger { background: rgba(220, 38, 38, 0.1); color: var(--color-danger); }
```

### Tabs

```css
.tabs { display: flex; gap: 4px; background: var(--color-bg-secondary); border-radius: var(--radius-button); padding: 4px; }
.tab { padding: 10px 20px; border-radius: calc(var(--radius-button) - 4px); font-weight: 500; font-size: 14px; color: var(--color-text-secondary); background: transparent; border: none; cursor: pointer; transition: all var(--duration-fast) var(--ease-out); }
.tab-active { background: var(--color-card); color: var(--color-text-primary); box-shadow: var(--shadow-card); }
```

### Stats / Metrics Cards

```css
.stat-card {
  background: var(--color-card);
  border-radius: var(--radius-dashboard);
  padding: 24px;
  border: 1px solid var(--color-border);
}
.stat-value { font-size: 40px; font-weight: 700; color: var(--color-text-primary); line-height: 1.1; }
.stat-label { font-size: 14px; color: var(--color-text-secondary); margin-top: 4px; }
.stat-trend { font-size: 13px; font-weight: 500; margin-top: 12px; display: flex; align-items: center; gap: 4px; }
```

---

## Icons

**Family:** Phosphor Icons (or Lucide, Heroicons, Streamline — pick **one** and use consistently)  
**Style:** 2px stroke, rounded, minimal. Never generic fill icons.

---

## Images & Illustrations

**No stock photos. No illustrations. No cartoons. No blobs. No 3D.**

**Use instead:**
- Product screenshots (dashboard, interview screen, pipeline, reports)
- Recruiter reviewing candidate
- Candidate in interview
- Waveforms (voice)
- AI summaries
- Real reports

**Product UI becomes the illustration.** Every section reinforces: structured hiring workflow.

---

## Motion

| Context | Duration | Easing | Behavior |
|---------|----------|--------|----------|
| Global | 250ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Ease out, no bounce |
| Hover (cards, buttons) | 250ms | ease-out | 2px lift, shadow deepen, orange border on cards |
| Button hover | 250ms | ease-out | Arrow slides, tiny scale |
| Card enter | 250ms | ease-out | Fade + slide up 8px |
| Dashboard numbers | 600ms | ease-out | Count up |
| Waveforms / Pipeline | Continuous | ease-in-out | Subtle motion |

**Respect `prefers-reduced-motion`.**

---

## Trust System

**Display:** Single elegant strip (not a badge wall).  
**Content:** `SOC2  •  GDPR  •  ISO 27001  •  Encryption  •  Audit Logs  •  Enterprise Ready`  
**Style:** Minimal, monochrome icons + labels, subtle separator. One line, generous spacing.

---

## Charts & Data Viz

**Palette:** Orange, Gray, Black only. No rainbow.  
**Style:** Minimal, clean axes, subtle gridlines, generous whitespace.

---

## Copy Tone

| Avoid | Use |
|-------|-----|
| "Revolutionary hiring platform" | "Structured AI interviews." |
| "The smartest AI" | "Evidence-backed hiring." |
| "AI replaces recruiters" | "Human review with AI assistance." |

**Voice:** Calm, precise, confident. No hype. Enterprise buyers read this.

---

## Design Philosophy

> If you have to ask: *"Should we add another decoration?"*  
> The answer is **no**.

> Instead ask: *"Can the product itself communicate the value?"*

The strongest HireLoop is one where **the UI becomes the illustration**. Every section reinforces that you're selling a structured hiring workflow — not generic AI. Polished product screens, restrained color, generous spacing, consistent components do the storytelling. This is what gives enterprise software its sense of quality and trust.

---

## Anti-Patterns (Do NOT Use)

- ❌ Bright gradients, neon, glowing effects
- ❌ Huge animations, bounce, spring physics
- ❌ Loud illustrations, cartoons, blobs, 3D
- ❌ Stock photos, exaggerated smiles
- ❌ Center-aligned paragraphs
- ❌ Tight spacing (packing things tightly)
- ❌ Thick borders, heavy separators
- ❌ Rainbow charts
- ❌ Badge walls (trust badges)
- ❌ Emoji as icons
- ❌ Generic fill icons
- ❌ Dark mode by default (light mode primary; dark only for Security/Enterprise/Compliance sections)
- ❌ Layout-shifting hovers
- ❌ Low contrast text (< 4.5:1)
- ❌ Instant state changes (always transition 150–300ms)
- ❌ Invisible focus states

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (SVG only, consistent family)
- [ ] All icons from single consistent icon set
- [ ] `cursor: pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150–300ms)
- [ ] Light mode: text contrast ≥ 4.5:1
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
- [ ] Color usage respects 90/8/2 ratio (white/gray/orange)
- [ ] Orange used only for: primary buttons, highlights, active states, charts, icons (≤10% of page)
- [ ] Dark background (`#0F1115`) used ONLY for Security/Enterprise/Compliance sections
- [ ] Product screenshots used instead of illustrations
- [ ] Copy tone: calm, precise, no hype
- [ ] Spacing follows 160/40/24/16 scale
- [ ] Border radius: cards 24px, buttons 999px, inputs 16px, dashboard 20px
- [ ] Shadows: soft only (0 12px 40px rgba(15,15,15,0.08))
- [ ] Motion: 250ms ease-out, no bounce