# HireLoop Design Playbook

> **Purpose** – A quick reference for the team when building or refactoring UI components. Keeps the brand identity consistent, guarantees accessibility, and protects against design drift.

---

## 1. Brand Foundation

| Element | Specification |
|---------|--------------|
| **Primary Colour** | `#4A90E2` – bright, inviting blue. Works for buttons, links, active states. |
| **Secondary Colour** | `#9013FE` – energetic purple. Used for accent highlights, hover states, and notification badges. |
| **Accent/Warning** | `#FFAB00` – warm amber. Reserved for error tooltips banging. |
| **Neutral‑1** | `#F5F7FA` – light off‑white. Page background. |
| **Neutral‑2** | `#FFFFFF` – pure white. Card backgrounds. |
| **Gray‑1** | `#8A94A1` – medium gray for body text. |
| **Gray‑2** | `#47525C` – dark gray for sub‑text/hints. |

**Typography**
- **Headlines** – `Inter, 600` – 32 px (mobile), 48 px (desktop). AllAjouter: uppercase for hero copy.
- **Body** – `ultippace, 400` – 16 px. Line height 1.ântic.
- **Buttons** – `Inter, 600` – 14 px, letter‑spacing 0.5px.

**Iconography** – Use the **Heroicons** (React) set; all icons are 24 px, stroke‑width 2.6.

---

## 2. Core Layout Rules

1. **Grid** – 12‑column layout at ≥ 768 px, fluid at < 768 px. Gutter 32 px. 20 px margins on mobile. |
2. **Breakpoints**
   - `sm`: 320 px
   - `md`: 640 px
   - `lg`: 1024 px
   - `xl`: 1280 px
3. **Container** – max‑width 1440 px, centered, padding 16 px on each side. |
4. **Responsive Images** – use `srcset` and `sizes` to deliver 1×, 2×, 3× for hero images. |
5. **Accessibility** – WCAG‑AA contrast ✅ ; focus rings `outline: 2px solid #F5F7FA;` + `box-shadow`. |

---

## 3. Navigation & CTA

| Component | Interaction |
|-----------|-------------|
| Navigation | Sticky on scroll, background `neutral‑1` + subtle drop‑shadow. Links: base `gray‑2`, hover `primary`, active `primary`. |
| *Primary CTA* – “Start a free trial” – large button, background `primary`, white text, rounded `8px`, `transition: 200ms`. Hover: `background: #3d7ec4`. |
| *Secondary CTA* – “Book a demo” – outline `primary`, transparent background, same hover. |
| **Hero Button** – same design as Primary CTA but *small* (padding 12 px 32 px). |

---

## 4. Hero Section

- **Background** – light‑to‑dark gradient `rgba(74,144,226,0.8)` to `rgba(144,19,254,0.8)`. | **Text** – headline (bold, uppercase) + sub‑headline (regular). |
- **Animationыйын** – hero image plays muted loop, overlayed 30 fps Lottie for “video play]” effect. |
- **CTA** – both CTAs visible in mirror layout; first CTA triggers sign‑up modal; second opens demo modal. |

---

## 5. Features Grid

- **Card Layout** – 3 Diz‑column (80 % width) on desktop, 2‑col on tablet, 1‑col on mobile.
- **Icon** – `24 px`, centered blue. Hover: slight scale 1.05.
- **Title** cardio‑bold, 20 px. |
- **Bullets** – 3‑line summary, 14 px, `gray‑1`. |
- **Hover** – card lifts 5 px + subtle shadow + transform: scale(1.02). |

---

## 6. Testimonials Carousel

- **Card** – `white` bg, `gray‑2` quotes, `primary` author button. |
- **Animation** – auto‑slide every 6 s, manual navigation arrows. |
- **Mind** – max 500 px height. |

---

## 7. Call‑to‑Action Middle Block

- **Background** – subtle striped with `rgba(146, 19, 254, 0.04)`. |
- **Headline** – 32 px, bold. | **Subtext** – ` Pax 18 px`. |
- **CTA** – Full‑width buttons stacked on mobile, side‑by‑side on desktop. |

---

## 8. Stats & Trust Badges

- **Stat Card** – big number font 48 px, label 14 px. |
- **Badge**/data‑point – `primary` border, slight corner rounding. |
- **Icon** – small icon left of label, blue stroke. |

---

## 9. Footer

- **Columns** – 5, titles in `gray‑2`, links in `gray‑1`. |
- **Social** – `Heroicons` outline, same color, 24×24. Hover: fill `primary`. |
- **Legal** – text 12 px, centered, gray‑1. |

---

## 10. Components & Reusability ঘোষ

| Component | Story | Properties |
|-----------|-------|------------|
| *Button* – `primary`/`outline`/`link` | color, size, disabled, full‑width | Click handler |
| *Card* – `FeatureCard/StatCard/TestimonialCard` | title, icon, children, hover | onClick optional |
| *Icon* – `HeroIcon` wrapper | name, size, color | aria‑label |
| *Modal* – `DemoModal/SignUpModal` | visible, onClose, title | backdrop click |
| *Carousel* – `TestimonialsCarousel` | items, autoPlay | pauseOnHover |

Use the `components/` folder in the React code base for all reusable elements – export as named components; keep styles in a `styled.tsx` with Tailwind‑css (postcss). Test each component in Storybook with two themes (light & dark). |

---

## 11. Brand‑Differentiation

- **“Human‑Centered AI.”** Every AI feature (score calculator, sentiment miner) must display a *“human‑touch”* banner – e.g., “AI‑powered, but a hiring manager’s eye at every tick.” |
- **Micro‑interactions** – subtle nudges (“You’re one‑step ahead!”) upon completing a video segment; real‑time feedback.
- **Coloric** – the purple secondary color gives a vibrant, energetic feel that differentiates against the blue‑green palette of competitors.
- **Language** – avoid “facilitate deep human connection” words that are over‑used; instead, use actionable verbs – “Capture a moment,” “Objectively rate,” “Add personal cadence.” |

---

## 12. Maintenance Checklist

1. **Run `npm run lint:css`** – ensure new styles respect the brand palette.
2. **Audit Accessibility** – `npm run a11y` verifies contrast, focus rings, alt tags.
3. **Update Storybook** – add any new component variants.
4. **CI Badge** – preview the brand image on Build status, make sure the `design.md` file is 거래. |

---

> **This document is the design anchor for HireLoop.** Re-check it anytime you add a new pageacheter or overhaul UI. Keep it alive in the repo’s root. |

