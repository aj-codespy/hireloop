# HireLoop — Free Image Generation Prompts

Run these through any free image generation tool (Bing Image Creator / Copilot AI art,
Leonardo.ai free tier, Stability AI free playground, or local Stable Diffusion).
Output as 16:9 PNG. Every prompt uses HireLoop's brand context: orange #FF6B00, AI voice
interview platform, professional + modern, light/clean, HR talent acquisition feel.

---

## 1. Hero Background (1600x900)

**Prompt:**
> A modern, clean HR office setting, natural daylight, warm tones. A recruiter's desk with
> a laptop showing an AI voice interview interface — a subtle orange waveform on screen.
> Professional, warm lighting, shallow depth of field, no text on screen, uncluttered.
> Shot style: candid corporate photography, natural soft shadows.

**Use on:** landing page hero right side, behind or beside the product-interview widget.
No text needed on the image.

---

## 2. Recruiter at Desk (1200x800)

**Prompt:**
> A modern diverse professional at a desk, reviewing candidate data on screen, relaxed
> expression. Warm natural office lighting, orange accents on the screen UI (interview
> progress dashboard), shallow depth of field. Shot style: lifestyle corporate photography.

**Use on:** "About" / "How it works" sections, or as testimonial context image.

---

## 3. Candidate on Laptop (1200x800)

**Prompt:**
> A diverse professional sitting at home, headphones on, talking to an AI interviewer
> on their laptop. Small orange waveform on screen. Calm, confident expression. Warm
> cozy home-office lighting, modern minimal desk setup. Shot style: authentic remote-
> work candidate photography.

**Use on:** "Candidate journey" section, or as the testimonial visual.

---

## 4. Team Collaboration (1200x800)

**Prompt:**
> A small diverse hiring team gathered around a table, reviewing candidate scorecards
> on a shared tablet with orange accents. Collaborative, focused but relaxed energy.
> Modern office, natural light. Shot style: human-interest corporate team photography,
> editorial quality.

**Use on:** "Human orchestration" section, or Pricing/CTA hero.

---

## 5. Candidate Interview Screen Mockup (1200x800)

**Prompt:**
> A clean product-UI shot of a voice interview interface. A rounded dark card on a
> light background displays: a live orange audio waveform, a question text ("Tell me
> about a time you led a team"), and a timer reading "1:42". Minimal, modern UI design,
> no extra text, clean typography, dark card on off-white background. 16:9.

**Use on:** Hero right-side product visual, "How it works" step illustration, or
the actual `LiveInterviewWidget` component we'll build as a real component (no fake
screenshot needed — but this serves as a placeholder until the live component is ready).

---

## Aspect ratios per placement

| Target | Ratio | Gen size | CSS class |
|--------|-------|----------|-----------|
| Hero background | 16:9 | 1600x900 | `w-full aspect-video object-cover` |
| Section split images | 4:3 | 1200x800 | `w-full md:w-1/2 object-cover` |
| Testimonial headshots | 1:1 | 400x400 | `w-12 h-12 rounded-full` |
| Card/feature images | 16:9 or 4:3 | 1200x675 or 1200x800 | `w-full object-cover rounded-2xl` |

---

## Placeholder fallback (if images not ready)

Until real images are generated, use picsum.photos with descriptive seeds (returns
consistent real stock photography matching the seed name):

- Hero background: `https://picsum.photos/seed/hireloop-recruiter-office/1600/900`
- Recruiter at desk: `https://picsum.photos/seed/talent-team-dashboard/1200/800`
- Candidate on laptop: `https://picsum.photos/seed/candidate-voice-interview-home/1200/800`
- Team review: `https://picsum.photos/seed/hiring-team-scorecard-review/1200/800`

These are real, diverse stock photos from picsum's seed system, free, consistent per-seed,
no gray boxes.

---

*Generated for HireLoop V1 frontend visual upgrade. Run per section as images become
available; fall back to picsum.seeds during development.*