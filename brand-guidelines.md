# HireLoop Brand Guidelines

> **Source of truth** for all visual, verbal, and interaction decisions.  
> When in doubt, the answer is: *calmer, quieter, more product-centered.*

---

## Brand Positioning

**"Stripe meets Linear meets Apple"**  
Not an HR dashboard. Not an AI demo. An enterprise hiring platform that feels like premium developer tooling.

| Reference | What We Borrow |
|-----------|----------------|
| Stripe Docs | Editorial restraint, product-as-hero, trust-first |
| Linear | Restraint, one real product shot as hero, editorial typography |
| Apple Business | Product *is* the illustration, calm confidence, premium materials |
| Vercel / Mercury / Notion / Rippling | Clean surfaces, editorial layouts, enterprise credibility |

---

## Brand Personality

### Trustworthy
Not flashy. Looks like software an enterprise would buy. SOC2, GDPR, ISO 27001, Audit Logs, Encryption — every page subtly reinforces security.

### Calm
Generous whitespace. No visual noise. Nothing screams for attention. **60% spacing, 40% content.**

### Intelligent
UI communicates sophistication without gradients, glows, or effects. Restrained color, great typography, great spacing.

### Human
This isn't an AI company. It's a hiring company powered by AI. Visuals always emphasize people making decisions — not robots replacing recruiters. Real screenshots, recruiters reviewing, candidates interviewing, waveforms, AI summaries, pipelines, real reports.

---

## Brand Pillars

### 1. AI with Human Oversight
Every screen reinforces: **AI assists. Humans decide.**  
Avoid visuals that make AI feel autonomous. Show the human in the loop.

### 2. Enterprise First
SOC2, GDPR, ISO 27001, Encryption, Audit Logs, Private, Secure.  
Every page subtly reinforces security. Trust strip: elegant, minimal, not a badge wall.

### 3. Calm Confidence
**Never use:**
- Bright gradients
- Neon
- Glowing effects
- Huge animations
- Loud illustrations

**Instead:**
- Soft depth
- Rounded surfaces
- High-quality typography
- Generous spacing

---

## Visual Language

### Hero Principle
| Left | Right |
|------|-------|
| Headline + Supporting copy + CTA + Trust | **The Product** (not an illustration) |

Dashboard occupies ~60% of hero. Think: Apple, Stripe, Arc Browser, Linear.

### Dashboard Style
- Every card: large radius, soft shadow, thin border, lots of whitespace
- No thick separators
- **40% content, 60% spacing**

### Icons
- One consistent family (Phosphor Icons, 2px stroke, rounded, minimal)
- Never generic icons — always from the same family

### Images
**Avoid:** Stock photos  
**Use:** Product screenshots, interview screenshots, recruiter reviewing, candidate interview, waveforms, AI summaries, pipeline, real reports  
*These become your illustrations.*

### Photography (if used)
Professional, natural, warm lighting, real people, no exaggerated smiles.

---

## Color System

### Primary — Rust Orange
| Role | Hex | Usage |
|------|-----|-------|
| Primary | `#F97316` | Primary buttons, highlights, active states, charts, icons |
| Primary Dark | `#EA6B2D` | Hover/active states |

**Maximum 10% of page.** Orange becomes valuable because it's rare.

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

---

## Typography

### Font Families
- **Headings:** Inter or Geist, Weight 700–800
- **Body:** Inter or Geist, Weight 400
- **Buttons:** Inter or Geist, Weight 600, 14px, letter-spacing 0.5px

### Scale
| Element | Size (Mobile) | Size (Desktop) |
|---------|---------------|----------------|
| Hero Headline | 48–56px | 64–72px |
| Section Titles | 32–40px | 40–48px |
| Card Titles | 20–24px | 24px |
| Body | 16–18px | 18px |
| Small / Caption | 13–14px | 14px |

### Rules
- **Never center-align paragraphs.** Everything feels editorial, left-aligned.
- Headlines: uppercase for hero copy only.
- Line height: 1.5 for body, 1.1–1.2 for headlines.

---

## Spacing System

This is where premium comes from. **Never pack things tightly.**

```
Section           160px
   ↓
Cards             40px
   ↓
Inside Cards      24px
   ↓
Icon / Inline     16px
```

Everything breathes.

---

## Border Radius

| Component | Radius |
|-----------|--------|
| Cards | 24px (`rounded-2xl`) |
| Buttons | 999px (`rounded-full` / pill) |
| Inputs | 16px (`rounded-xl`) |
| Dashboard Components | 20px |

---

## Shadows

**Soft only.**
```
0 12px 40px rgba(15, 15, 15, 0.08)
```

Avoid huge blurred shadows. Subtle lift only.

---

## Motion

### Timing
- **Everything:** 250ms, Ease Out
- **No bounce. Ever.**

### Hover
- 2px lift
- Shadow deepens
- Orange border appears (on cards)

### Cards
- Fade + Slide in (staggered, 60ms per item)

### Buttons
- Tiny movement (scale 0.98 on press)
- Arrow slides on hover (if applicable)

### Dashboard
- Numbers count up on view
- Waveform moves
- Pipeline progresses

### Reduced Motion
All motion gated behind `prefers-reduced-motion`. Respect it fully.

---

## Components (Design System Primitives)

Build **only reusable primitives**:

- Cards (Feature, Stat, Testimonial, Candidate, Job, Application)
- Badges / Pills (Status, Stage, Tag)
- Buttons (Primary, Secondary/Ghost, Link, Destructive)
- Tabs
- Timeline
- Stats / KPI Tiles
- Avatars (Initials, Photo, Status ring)
- Reports / Scorecards
- Progress (Linear, Ring, Stepper)
- Interview Components (Waveform, Question Card, Transcript Panel)
- Tables (Data, Candidate, Job)
- Forms (Input, Select, Textarea, File Upload, Checkbox, Radio)

Everything comes from a design system. No one-off styles.

---

## Illustration Style

**Flat. Simple. No cartoons. No blobs. No 3D.**  
**Use product UI instead.** The product *is* the illustration.

---

## Trust System

Immediately visible, elegantly presented:
```
SOC2  •  GDPR  •  ISO 27001  •  Encryption  •  Audit Logs  •  Enterprise Ready
```

**No giant badge wall.** One elegant strip, typically in footer or enterprise sections.

---

## Charts

- Very subtle
- Colors: Orange, Gray, Black only
- **No rainbow palettes**

---

## Copy Tone

| Don't Say | Do Say |
|-----------|--------|
| "Revolutionary hiring platform" | "Structured AI interviews." |
| "The smartest AI" | "Evidence-backed hiring." |
| "AI replaces recruiters" | "Human review with AI assistance." |
| "Facilitate deep human connection" | "Capture a moment. Objectively rate. Add personal cadence." |

**No hype. No em-dashes. Ever.**  
Editorial, precise, confident. Actionable verbs.

---

## Design Philosophy

> If you have to ask: *"Should we add another decoration?"*  
> The answer is probably **no**.

> Instead ask: *"Can the product itself communicate the value?"*

The strongest version of HireLoop is one where **the UI becomes the illustration**. Every section should reinforce that you're selling a structured hiring workflow — not generic AI. Let polished product screens, restrained color, generous spacing, and consistent components do most of the storytelling. This is what gives enterprise software its sense of quality and trust.

---

## Cross-Page Consistency Checklist

- [ ] Uses `--color-orange` (`#F97316`) only; no second accent; no AI-purple
- [ ] Inter/Geist typography; radius lock (pill/card/input); dark mode tokens correct
- [ ] Phosphor icons, `strokeWidth 1.5`, one family; no hand-rolled SVGs
- [ ] Zero em-dashes in copy; one CTA intent per action
- [ ] Loading / empty / error / success states present on every data surface
- [ ] `prefers-reduced-motion` honored on all motion
- [ ] Mobile single-column collapse; `min-h-[100dvh]` for full-height surfaces
- [ ] Nav/sidebar ≤72px; active item orange
- [ ] WCAG AA contrast verified (esp. buttons, forms, pills)
- [ ] System boundary (HireLoop owns interview, you own offer) reinforced on Offers + landing

---

*Last updated: 2026-07-24*  
*This document is the design anchor for HireLoop. Re-check anytime you add a new page or overhaul UI. Keep it alive in the repo root.*