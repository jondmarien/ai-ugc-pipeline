# chron0s_cyb3r_w0rld — Design System

> **Real threats, real tools, no fake panic.**
> Dark cinematic AI-cybersecurity editorial for Instagram carousels and short-form reels.

This is the brand design system for **`@chron0s_cyb3r_w0rld.ai`** — an AI-in-cybersecurity UGC
account run by Jon ("chrono"). The product is a manual-first, API-ready content pipeline that turns
researched, source-checked security ideas into viral-packaged **carousels** (1080×1350) and
**reels** (1080×1920), then renders them to pixel-exact assets with a React + Playwright + Remotion
layer. This system captures the visual + verbal brand those assets share so any agent can produce
on-brand work without re-deriving typography, colour, safe areas, or voice.

The look: dark, high-contrast, cinematic key art with **one accent glow per post**, disciplined
editorial hierarchy, and phone-readable type. Not generic SaaS cards. Not "hacker hoodie" clichés.

---

## Sources

Built from the `ai-ugc-pipeline` codebase and its rendered output. The reader may not have access,
but these are the references:

| Source | Where | What was used |
| --- | --- | --- |
| **GitHub** | [`jondmarien/ai-ugc-pipeline`](https://github.com/jondmarien/ai-ugc-pipeline) | The full pipeline. Explore it to understand the content workflow, the renderer, and the skills end to end. |
| Codebase | `ai-ugc-pipeline/` (mounted) | `renderer/src/design/tokens.ts`, `renderer/remotion/theme.ts`, the carousel + reel React components, `renderer/docs/DESIGN_SYSTEM.md`, `pipeline/content/VOICE_AND_TONE_GUIDE.md`. |
| Rendered assets | `uploads/` + `renderer/public/backgrounds/` | Finished carousels + reels (6 posts) and the text-free FLUX key art backgrounds reused in `assets/backgrounds/`. |

The pipeline's own design tokens (`tokens.ts`) and voice guide are the upstream source of truth;
this system mirrors them in framework-neutral CSS + React so they ship to any consuming project.

---

## Content fundamentals — how the brand sounds

**The house voice.** Sharp, practical, dry, first-person. Talks to practitioners and builders as
peers. Confidence comes from having done the thing, not from adjectives. Curiosity plus a little
paranoia, never doom. Viral packaging is allowed; fake certainty is not.

**Person & address.** First-person singular ("I"), second-person to the reader ("your agent",
"your team"). It's a person talking, not a brand announcing.

**Casing.** Cover and standard-slide headlines are usually **ALL CAPS** (Archivo 800, maximum
impact). Takeaway headlines drop to **sentence case** to feel like a spoken conclusion. Kickers and
all metadata are **UPPERCASE mono** with wide tracking. Captions are sentence case.

**The trust standard (non-negotiable).**
- **No fabrication** — no invented CVEs, breach details, stats, quotes, or papers. Every factual
  claim is sourced or tagged. Claims carry tiers: **[Verified] / [Emerging] / [Scenario]**.
- **Defender value** — every post ends with one concrete, practical takeaway.
- **No turnkey offensive how-to** — mechanisms stay high-level (offensive-theme posts may go deeper
  when genuinely educational and framed for authorized work), never operational payloads.
- **Label AI media** — AI-generated narration is disclosed on-frame.

**The de-AI ruleset.**
- *Keep:* contractions, real numbers + tool names, dry confidence, a visible stance, varied
  sentence length, ≤1 emoji.
- *Kill:* **em-dashes entirely** (`—`/`–`, every surface — use a period, comma, colon, parentheses,
  or "and"/"but"); **sentence fragments** (complete sentences only); AI vocab (*delve, leverage,
  harness, seamless, robust, comprehensive, tapestry, landscape, realm*); "it's not just X, it's Y";
  forced rule-of-three; vague attribution ("experts say"); generic CTA closes.

**Hook formula.** `specific actor/object + unexpected AI action + clear consequence`. Reframe the
reader's assumption; don't just state a fact.
- ✋ "Prompt injection is dangerous" → ✅ "The weirdest AI attack hides where your agent reads"
- ✋ "AI is changing cybersecurity" → ✅ "AI phishing just made your old awareness training obsolete"

**Caption structure.** Sharpen the hook → context in plain language → translate to security risk →
**defender takeaway** (one concrete control) → a specific, easy-to-answer question → light follow CTA.

**Emoji.** Rare. At most one, well-placed. Never decorative rows. Not part of the on-slide design.

---

## Visual foundations

**Palette.** A near-black surface system that never changes — only the accent swaps per post.
`--bg #05070d` canvas, `--bg-deep #02030a` letterbox, `--bg-raise #0a1322` cover wash,
`--panel rgba(2,6,23,.78)`. Text is `--fg #f8fafc` and `--muted #94a3b8`; dividers `--hairline`
(slate / 18%); `--danger #ef4444`.

**Accent system (one per post).** A post's **theme** = its category, and drives both the carousel
accent and the AI-image mood. Five themes: **defensive** blue `#3b82f6`, **offensive** red `#ef4444`,
**hacking** green `#39ff88`, **purple-team** purple `#a855f7`, **ai** orange `#f97316` — each with a
paired secondary for glows. (An older 6-way *pillar* accent map still exists; theme wins when set.)
The accent drives the top hairline, kicker, pagination, chips, background glow, and headline glow.

**Type.** Three families. **Archivo** (700/800) for display headlines — condensed-impact, tight
leading (1.02), slight negative tracking. **Inter** (400–600) for sublines and body — quiet and
muted. **JetBrains Mono** (500) for kickers, the handle, pagination, and claim tags — uppercase,
wide tracking. Scale @1080: cover 104 · takeaway 96 · headline 76 · subline 40 · body 36 · cta 34 ·
kicker 26 · meta 24. Two to three hierarchy levels per slide, max. No paragraph walls.

**Backgrounds.** Full-bleed cinematic **AI key art** (text-free, logo-free FLUX renders) is the
default. The house prompt style is constant — "dark cinematic cybersecurity key art, thin precise
glowing linework, volumetric haze, premium minimal, high contrast, generous negative space" — only
the accent + mood change by category. When there's no art, a **procedural** fallback: a radial
accent wash + a faint masked accent grid (60px) + subtle scanlines. Imagery skews cool and moody;
single light source, deep shadow, lots of negative space in the lower half for the headline.

**Legibility system.** The background stays crisp; legibility is carried by a **content-hugging
text plate** that moves with the copy — a feathered radial dark gradient (peaks ~66% over the text,
fades to transparent at the edges) with a **5px backdrop-blur**, rounded 44px, extending ~40–56px
beyond the text box. Light ambient grounding (top vignette at 24%, a soft bottom gradient) keeps the
frame edges from glaring. Reels use a stronger bottom scrim for burned-in captions.

**Layout & safe area.** Fixed canvas (1080×1350 / 1080×1920) with a **96px safe margin** — all
critical text lives inside it. A **6px accent hairline** caps the top of every slide. The brand mark
sits quiet top-left; pagination `NN/NN` top-right in the accent. Content is bottom-aligned (a lower
third) on most slides; centered on takeaways. Kickers lead with a 48px accent rule. Content blocks
stack with a 24px gap.

**Corners, borders, shadows.** Radii: panels 28px, the text plate 44px, chips/pills 999px. The brand
is mostly **flat and shadow-free** on dark surfaces — borders are 1px hairlines. The only real
shadows are a hard caption drop-shadow over imagery and an occasional soft panel shadow in UI chrome.
Glow is used sparingly: a soft accent text-shadow on the headline, one radial glow on the focal point.

**Animation.** Slow and cinematic. Reels push in `scale 1.04 → 1.12` per beat with a gentle caption
fade/slide. No spin, no shake, no bounce, no infinite decorative loops. Easing is a soft
`cubic-bezier(0.22, 0.61, 0.36, 1)`. Hover states lift to the accent colour; press states scale down
slightly (~0.88). Always respect `prefers-reduced-motion`.

---

## Iconography

The brand is **type-led and image-led, not icon-led**. There is no bespoke icon font, SVG sprite, or
illustration set in the codebase — meaning, drama, and "iconography" are carried by the **cinematic
AI key art** (a robotic head reading a book, an hourglass running out, a steel plate bolted over a
gap). Those photographic renders do the symbolic work; flat UI icons rarely appear on a slide.

- **On-slide:** no icon system. The accent rule, the chip, and the pagination are the only repeated
  graphic marks. Unicode arrows (`→`) appear inside chips ("SWIPE →"). The handle avatar uses a mono
  `>_` terminal glyph, not a logo image.
- **UI chrome (the kits):** the social-preview and reel players use a handful of **generic line
  icons** (heart, comment, share, bookmark, play/pause) drawn as simple 1.7px-stroke inline SVGs.
  These are universal affordances for the mock surface, **not** brand iconography — keep them
  generic and never recreate a specific platform's proprietary icon set.
- **Emoji:** essentially never on-slide; ≤1 in a caption at most.

If a future surface genuinely needs a UI icon set, reach for a thin-stroke open library (e.g.
**Lucide**, 1.5–2px stroke) to match the existing line weight, and flag it as a substitution.

> ⚠️ **Font substitution note:** Archivo, Inter, and JetBrains Mono are all on Google Fonts, so
> `tokens/fonts.css` loads them from there (the pipeline bundles the identical families via
> `@fontsource`). No local binaries ship with this system. If you need fully offline/deterministic
> rendering, drop the `.woff2` files in and swap the `@import` for `@font-face` — and let me know if
> you want that done.

---

## Index — what's in this system

**Foundations**
- `styles.css` — the entry point consumers link. `@import`s only.
- `tokens/` — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `effects.css`.
- `guidelines/*.card.html` — 17 foundation specimen cards (Colors, Type, Spacing, Brand) shown in the Design System tab.

**Components** (`components/`, React — `window.Chron0sCyb3rW0rldDesignSystem_0b1a15`)
- `primitives/` — `Kicker`, `Headline` (with `[[accent]]`/`{{danger}}` markup), `Subline`, `Chip`,
  `ClaimTag`, `BrandMark`, `Pagination`.
- `slide/` — `SlideBackground` (image / procedural) and `SlideShell` (the full canvas shell;
  also a Starting Point).

**UI kits** (`ui_kits/`)
- `carousel/` — the core product: a swipeable 8-slide carousel in a social-preview frame, two real
  posts (defensive + offensive themes). `index.html`, `slides.jsx`, `data.js`.
- `reel/` — the vertical 9:16 reel: live, scrubbable player with push-in scenes, three caption
  modes, and an end card. `index.html`, `ReelPlayer.jsx`, `data.js`.

**Assets**
- `assets/backgrounds/{blue,red,green,orange}/` — text-free FLUX key art per theme (defensive, offensive, hacking, ai). No purple-team sample render exists yet.

**Other**
- `SKILL.md` — makes this system usable as a downloadable Claude Skill.

---

## Using it

Consuming projects link `styles.css` and read components from
`window.Chron0sCyb3rW0rldDesignSystem_0b1a15`. Set a post's accent by wrapping a slide in a
`theme-*` class (`theme-defensive`, `theme-offensive`, `theme-hacking`, `theme-purple-team`,
`theme-ai`). Build a slide by filling a `SlideShell` with `Kicker` / `Headline` / `Subline` / `Chip`.
Keep the trust standard and the de-AI voice rules — they're as much a part of the brand as the colour.
