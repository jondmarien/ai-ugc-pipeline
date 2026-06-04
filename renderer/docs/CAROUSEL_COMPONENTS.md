# CAROUSEL_COMPONENTS.md

Role-based React components that turn validated `PostData` into exact-size carousel slides. Implementation: `../src/components/carousel/`. Design values come from `../src/design/tokens.ts` (see `DESIGN_SYSTEM.md`).

> Philosophy: a template engine for premium social assets, not a web app. Strong visual decisions are made by default so a future agent never re-invents typography, safe areas, accents, or slide roles.

## Component tree

```
CarouselSlideByIndex(post, index)      // export harness target — one slide
  └─ <RoleComponent post slide>        // chosen via SLIDE_COMPONENTS[role]
       └─ CarouselSlide(post, slide)   // shared shell
            ├─ SlideBackground         // image (reused asset) OR procedural CSS
            ├─ accent hairline
            ├─ content frame (safe area)  ← Kicker / Headline / Subline / CTA
            ├─ brand mark (handle)
            └─ pagination NN/NN

CarouselDeck(post)                     // stacked half-scale human preview
```

## Role → component registry

`SLIDE_COMPONENTS` in `slides.tsx`:

| Role | Component | Layout |
| --- | --- | --- |
| `cover` | `CoverSlide` | bottom-aligned hero headline (largest), kicker, subline, swipe chip |
| `context` | `StandardSlide` | bottom-aligned kicker + headline + subline |
| `risk` | `StandardSlide` | " |
| `mechanism` | `StandardSlide` | " (abstract mechanism only — no payloads) |
| `failure_point` | `StandardSlide` | " |
| `defense` | `StandardSlide` | " |
| `takeaway` | `TakeawaySlide` | center-aligned, large, minimal copy |
| `cta` | `CtaSlide` | headline + subline + CTA chip + handle |
| `point` | `StandardSlide` | " (generic, repeatable body slide for dynamic slide counts > 8) |

Adding a role = add an enum value in `schema.ts`, a `ROLE_FILENAME` entry, and a registry entry. Everything else (shell, export, naming) follows.

## `CarouselSlide` (shared shell) — contract

| Element | Rule |
| --- | --- |
| Root `#slide-root` | Exact `canvas.width × canvas.height`; `data-role` set. This is the Playwright screenshot target. |
| Safe area | Content inset by `canvas.safe_margin` (default 96px) on all sides. |
| Background | `SlideBackground`: reused image when `asset_status ∈ {existing,generated,stock}`, else procedural CSS (gradient + accent glow + grid + scanlines). Always adds a dark lower-third + top vignette for legibility. |
| Accent hairline | 6px top bar in the pillar accent. |
| Brand mark | Handle, quiet, top-left, mono. |
| Pagination | `NN/NN` top-right in accent. |
| Alignment | `start` / `center` / `end` (most slides `end`; takeaway `center`). |

## Text primitives (`slides.tsx`)
- `Headline` — Archivo 800, balanced wrap, subtle accent text-shadow. Cover ~104px, standard ~76px.
- `Subline` — Inter 500, muted, ≤90% width.
- `Kicker` — mono, uppercase, accent, with a short rule; derived from the slide role (a design label, **not** a factual claim).
- `SwipeCue` / CTA chip — pill in the accent color.

## Safety constraints baked into components
- Backgrounds are **text-free, logo-free, credential-free**; `visual_prompt`/`visual_direction` are guidance only and are **never rendered as on-image text**.
- `MechanismSlide` (StandardSlide for `mechanism`) is intended for **abstract, high-level** visuals — no exploit strings, payloads, or operational steps. This is enforced by content discipline + QA, not by code, so the QA gate must be run.

## Typography discipline (anti-amateur rules)
- 2–3 hierarchy levels per slide max (kicker / headline / subline). No paragraph walls.
- One accent color per post (pillar-driven). The idea is louder than the watermark.
- Headline dominates; subline clarifies; metadata stays quiet.

## Preview
```bash
bun run dev
# full deck (half scale):  http://localhost:4317/?post=ai-phishing-training&mode=deck
# single exact-size slide: http://localhost:4317/?post=ai-phishing-training&slide=1
```
The app sets `html[data-render-ready="1"]` once fonts + images are loaded — the export harness waits on this.
