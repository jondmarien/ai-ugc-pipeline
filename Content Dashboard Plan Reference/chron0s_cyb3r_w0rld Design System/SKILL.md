---
name: chron0s-cyb3r-w0rld-design
description: Use this skill to generate well-branded interfaces and assets for chron0s_cyb3r_w0rld (@chron0s_cyb3r_w0rld.ai), the AI-in-cybersecurity UGC brand — either for production or throwaway prototypes/mocks/carousels/reels. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping. Positioning: real threats, real tools, no fake panic.
user-invocable: true
---

Read the `readme.md` file within this skill, and explore the other available files.

If creating visual artifacts (carousels, reels, mocks, throwaway prototypes, etc), copy assets out
and create static HTML files for the user to view. If working on production code, you can copy
assets and read the rules here to become an expert in designing with this brand.

Key files:
- `readme.md` — the full design guide: sources, content/voice fundamentals, visual foundations, iconography, and an index of everything.
- `styles.css` + `tokens/` — link `styles.css`; everything is CSS custom properties (surfaces, the 5-way theme accents, type scale, spacing, the text-plate/overlay effects).
- `components/` — React primitives (`Kicker`, `Headline`, `Subline`, `Chip`, `ClaimTag`, `BrandMark`, `Pagination`) and the `SlideShell` / `SlideBackground` canvas. Read each component's `.prompt.md` for usage.
- `ui_kits/carousel/` and `ui_kits/reel/` — full interactive recreations of the two products. Lift their structure.
- `guidelines/*.card.html` — foundation specimens you can open to see the system rendered.
- `assets/backgrounds/` — text-free cinematic key art, one folder per theme.

Brand non-negotiables to honor in any copy you write:
- Real threats, real tools, **no fake panic**. No fabricated CVEs/stats/quotes. Tag claims [Verified]/[Emerging]/[Scenario].
- Every post ends with a concrete defender takeaway.
- **No em-dashes and no sentence fragments**, anywhere. Kill AI vocab (delve, leverage, seamless, robust).
- One accent per post (set via a `theme-*` class). Dark cinematic backgrounds, sharp editorial type, 96px safe margins.
- Label AI-generated media on-frame.

If the user invokes this skill without any other guidance, ask them what they want to build or
design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production
code, depending on the need.
