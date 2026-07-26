# HireLoop Design Playbook

> **Purpose** – A quick reference for the team when building or refactoring UI components. Keeps the brand identity consistent, guarantees accessibility, and protects against design drift.
> 
> **Full brand guidelines:** See `brand-guidelines.md` and `design-system/hireloop/MASTER.md`

---

## 1. Brand Foundation

| Element | Specification |
|---------|--------------|
| **Primary Colour** | `#F97316` (Rust Orange) – Primary buttons, highlights, active states, charts, icons. Max 10% of page. |
| **Primary Dark** | `#EA6B2D` – Hover/active states |
| **Background** | `#FFFFFF` – Page background |
| **Secondary Background** | `#FAFAF9` – Section backgrounds |
| **Cards** | `#FFFFFF` – Card backgrounds |
| **Dark Sections** | `#0F1115` – Security/Enterprise/Compliance only |
| **Text Primary** | `#111827` – Headlines, body |
| **Text Secondary** | `#6B7280` – Subtext, descriptions |
| **Text Muted** | `#9CA3AF` – Placeholders, captions |
| **Success** | `#16A34A` |
| **Danger** | `#DC2626` |
| **Border** | `#ECECEC` – Very subtle |

**Accent Ratio:** 90% White / 8% Gray / 2% Orange

**Typography**
- **Headings** – Inter or Geist, Weight 700–800
- **Body** – Inter or Geist, Weight 400
- **Buttons** – Inter or Geist, 600, 14px, letter-spacing 0.5px

**Iconography** – Phosphor Icons, 2px stroke, rounded, minimal. One family only.

---

## 2. Core Layout Rules

1. **Grid** – 12-column layout at ≥ 768px, fluid at < 768px. Gutter 32px. 20px margins on mobile.
2. **Breakpoints**
   - `sm`: 320px
   - `md`: 640px
   - `lg`: 1024px
   - `xl`: 1280px
3. **Container** – max-width 1440px, centered, padding 16px on each side.
4. **Responsive Images** – use `srcset` and `sizes` to deliver 1×, 2×, 3× for hero images.
5. **Accessibility** – WCAG-AA contrast ✅; focus rings `outline: 2px solid var(--color-brand);` + `box-shadow`.

---

## 3. Navigation & CTA

| Component | Interaction |
|-----------|-------------|
| Navigation | Sticky on scroll, background `white` + subtle drop-shadow. Links: base `text-secondary`, hover `text-primary`, active `text-primary`. |
| *Primary CTA* – "Start free" | Large pill button, background `brand`, white text, rounded-full, `transition: 250ms`. Hover: `brand-dark`, 2px lift, soft shadow. |
| *Secondary CTA* – "Watch demo" | Outline `brand`, transparent background, same hover. |
| *Subtle CTA* | Text only, `brand` color, hover `rgba(brand, 0.08)` background. |

---

## 4. Hero Section

- **Background** – White. No gradients.
- **Layout** – Asymmetric split. Left: Eyebrow + Headline + Subtext + CTA + Trust strip. Right: Product (live interactive interview widget, real component).
- **Product occupies ~60%** of hero width.
- **CTA** – Primary + Secondary visible without scroll.
- **Trust strip** – Minimal: `SOC2 • GDPR • ISO 27001 • Encryption • Audit Logs • Enterprise Ready`

---

## 5. Features / Capabilities Grid

- **Layout** – Alternating splits (not 3-equal-card cliché). Each ends with "So you can..." human payoff.
- **Card** – Large radius (24px), soft shadow, thin border, generous padding (24px).
- **Hover** – 2px lift + soft shadow + orange border.
- **Content Ratio** – 40% content, 60% whitespace.

---

## 6. Testimonials / Social Proof

- **Card** – White bg, text-secondary quotes, text-primary author, avatar with initials.
- **Max 3** testimonials, each ≤3 lines.
- **Animation** – Fade + slide on scroll (staggered), gated by `prefers-reduced-motion`.

---

## 7. Trust / Security Section

- **Background** – Dark section (`#0F1115`) ONLY here.
- **Content** – Audit trail, proctoring transparency, human override, data residency.
- **Style** – Editorial, calm, no fear-mongering.

---

## 8. Stats & Live Tickers

- **Stat Card** – Big number (40px, weight 700), label (14px, text-secondary), trend (13px).
- **Live Ticker** – "Interviews completed today: 1,240 / Candidates qualified this week: 312" (real data).
- **Style** – Monospace numbers, orange accent only for key metrics.

---

## 9. Pricing

- **4 tiers**, per-interview pricing, no per-seat fees.
- **One CTA label** across all tiers ("Start free" or "Contact sales").
- **Card style** – Consistent with design system, generous spacing.

---

## 10. Footer

- **Columns** – 5, titles in text-secondary, links in text-secondary.
- **Social** – Phosphor icons outline, same color, 24×24. Hover: fill brand.
- **Legal** – text-small, centered, text-muted.
- **Trust strip** – Repeats elegantly.

---

## 11. Components & Reusability

| Component | Variants | Properties |
|-----------|----------|------------|
| *Button* | primary / secondary / subtle / destructive | size, disabled, fullWidth, onClick |
| *Card* | FeatureCard / StatCard / TestimonialCard / CandidateCard / JobCard / ApplicationCard | title, icon, children, hover, onClick |
| *Badge* | default / success / warning / danger / stage | size, dot |
| *Tabs* | default | items, active, onChange, underline |
| *Timeline* | vertical / horizontal | steps, current, color |
| *Stat* | default / trend | value, label, trend, prefix, suffix |
| *Avatar* | initials / photo / status-ring | size, src, name, status |
| *Report / Scorecard* | default | sections, scores, reasoning |
| *Progress* | linear / ring / stepper | value, max, color, steps |
| *Interview* | Waveform / QuestionCard / TranscriptPanel | audioLevel, question, transcript, state |
| *Table* | Data / Candidate / Job | columns, rows, sortable, selectable |

Use the `components/` folder in the React code base for all reusable elements – export as named components; keep styles in a `styled.tsx` with Tailwind CSS. Test each component in Storybook with light & dark themes.

---

## 12. Brand-Differentiation

- **"Human-Centered AI."** Every AI feature (scoring, proctoring, summaries) must display a "human-touch" signal – e.g., "AI-powered, but a hiring manager's eye at every step."
- **Micro-interactions** – subtle nudges ("You're one step ahead") upon completing a segment; real-time feedback.
- **Color** – the orange accent gives a distinctive, warm feel that differentiates against the blue-green palette of competitors.
- **Language** – avoid "facilitate deep human connection" words that are over-used; instead, use actionable verbs – "Capture a moment," "Objectively rate," "Add personal cadence."
- **System Boundary** – "HireLoop owns the interview. You own the offer." Reinforced on Offers page, landing, and handoff surfaces.

---

## 13. Maintenance Checklist

1. **Run `npm run lint:css`** – ensure new styles respect the brand palette.
2. **Audit Accessibility** – `npm run a11y` verifies contrast, focus rings, alt tags.
3. **Update Storybook** – add any new component variants.
4. **CI Badge** – preview the brand image on Build status, make sure the `design.md` file is current.

---

## 14. Anti-Patterns (Do NOT Use)

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
- ❌ Dark mode by default (light mode primary; dark only for Security/Enterprise/Compliance)
- ❌ Layout-shifting hovers
- ❌ Low contrast text (< 4.5:1)
- ❌ Instant state changes (always transition 150–300ms)
- ❌ Invisible focus states

---

> **This document is the design anchor for HireLoop.** Re-check it anytime you add a new page or overhaul UI. Keep it alive in the repo's root.  
> **Full brand guidelines:** `brand-guidelines.md` | **Design system tokens:** `design-system/hireloop/MASTER.md`