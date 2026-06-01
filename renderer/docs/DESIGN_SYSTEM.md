# DESIGN_SYSTEM.md

Design tokens derived directly from `../../pipeline/content/VISUAL_PROMPT_BANK.md` and the renderer skill. Implementation: `../src/design/tokens.ts` (carousel) and `../remotion/theme.ts` (reel — kept in sync). **No external design-skill dependency**: the principles are embedded here.

> Target: **cinematic AI-cyber editorial** — dark, high-contrast, one accent glow, disciplined hierarchy, phone-readable. Not generic SaaS cards, not "hacker hoodie" clichés.

## Palette

| Token | Value | Use |
| --- | --- | --- |
| `bg` | `#05070d` | main cyber-black |
| `bgDeep` | `#02030a` | deepest base / letterbox |
| `panel` | `rgba(2,6,23,0.78)` | text panels / lower thirds |
| `fg` | `#f8fafc` | primary text |
| `muted` | `#94a3b8` | metadata, sublines |
| `hairline` | `rgba(148,163,184,0.18)` | dividers |
| `danger` | `#ef4444` | warnings (sparingly) |

## Pillar accents (one per post)

| Pillar | Accent | Hex |
| --- | --- | --- |
| `offensive_ai` | cyan | `#22d3ee` |
| `model_security` | electric blue | `#3b82f6` |
| `data_leakage` | neon green | `#39ff88` |
| `defensive_ai` | cool teal | `#2dd4bf` |
| `governance` | amber | `#f59e0b` |
| `myth_busting` | red→blue split | `#ef4444` + `#3b82f6` |

The accent drives: top hairline, kicker, pagination, swipe/CTA chips, background glow, headline glow. One accent per post keeps the grid coherent.

## Canvas

| Format | Size | Safe margin |
| --- | --- | --- |
| carousel | 1080 × 1350 | 96px |
| reel | 1080 × 1920 | 96px |

All critical text lives inside the safe margin. Covers preserve a dark lower-third (≈62% gradient) so headlines stay legible over any background.

## Type scale (px @ 1080-wide)

| Token | px | Use |
| --- | --- | --- |
| `coverHeadline` | 104 | cover hero |
| `headline` | 76 | standard slide headline |
| `subline` | 40 | clarifier |
| `body` | 36 | body (rare) |
| `cta` | 34 | chips |
| `kicker` | 26 | role label |
| `meta` | 24 | handle / pagination |

Fonts (bundled via `@fontsource`, offline-deterministic):
- **Headline:** Archivo (700/800, condensed-ish, high impact)
- **Body:** Inter (400–600)
- **Mono:** JetBrains Mono (kicker, handle, pagination)

## Texture & motion rules
- Procedural backgrounds = radial accent glow + faint grid (masked) + subtle scanlines. Keep opacity low; never fight the copy.
- Reels: slow push-in (scale 1.04→1.12), gentle caption fade/slide. No spinning, no shake, no illegible animated subtitles.
- Glow used sparingly on focal points only.

## Accessibility
- Strong contrast; body copy survives a phone at arm's length.
- Lower-third + top vignette guarantee text contrast over images.
- Alt text per slide is mandatory (enforced in schema). Reel captions are burned-in, high-contrast, ≤2 lines.

## Extending the system
- New pillar accent → add to `pillarAccent` in **both** `tokens.ts` and `remotion/theme.ts`.
- Keep the two token files in sync (carousel + reel share the same look). A future refactor could import `theme.ts` from `tokens.ts`; they're separate now to keep the Remotion bundle self-contained.
