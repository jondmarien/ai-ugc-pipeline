# Chrono walls — themed animated/still backgrounds

Five brand "walls", one per theme, as an alternative to the static dark / procedural background. Each theme has a **still** (`.png`) and an **animated loop** (`.webm`, VP9). All are **1080×1920 (9:16)** and **text-free** (no overlay). See `walls.json` for the machine-readable manifest.

| Theme | Accent | Still | Loop | Loop length |
|---|---|---|---|---|
| defensive | blue | `01-defensive-aegis.png` | `01-defensive-aegis.webm` | 15.8s |
| offensive | red | `02-offensive-breach.png` | `02-offensive-breach.webm` | 11.2s |
| hacking | green | `03-hacking-datastream.png` | `03-hacking-datastream.webm` | 11.1s |
| purple-team | purple | `04-purple-team-convergence.png` | `04-purple-team-convergence.webm` | 18.9s |
| ai | orange | `05-ai-latent-mesh.png` | `05-ai-latent-mesh.webm` | 8.2s |

Origin: generated with Claude's design tooling for this brand (chrono / @chron0s_cyb3r_w0rld.ai). Owned by Jon; cleared for this account's own posts. When a wall ships in a post, log it in that post's package `LICENSES.md` (written by `bun run package`).

## How to use

**Recommended: set `wall` on the post (theme-derived, no per-slide wiring).**
```json
"wall": { "enabled": true, "art_opacity": 0.55 }
```
The post's `theme` picks its wall automatically. Then:
- **Carousel** layers the wall **still** as the base, composites each slide's art on top at `art_opacity`, then the text — so the wall shows through. (9:16 wall is center-cropped to the 4:5 carousel by `object-fit: cover`.)
- **Reel** plays the wall **`.webm`** continuously behind every scene (Remotion `Loop` + `OffthreadVideo`), with each scene's art semi-transparent so the moving wall shows through.

Implemented in `src/components/carousel/SlideBackground.tsx`, `remotion/Scene.tsx`, and `remotion/ReelComposition.tsx`; theme→wall map in `src/design/tokens.ts` and `remotion/theme.ts` (`themeWall` / `wallFor`).

**Single-slide background (manual).** Point one slide at a wall still and skip art generation:
```json
{ "background_asset": "/walls/05-ai-latent-mesh.png", "asset_status": "existing" }
```

**Instagram story (manual, no pipeline).** Stories are 1080×1920, the walls' native size. Upload the `.png` (static) or `.webm` (animated) directly when you post.

## Picking by theme
`theme` (`offensive|defensive|hacking|purple-team|ai`) maps 1:1 to a wall above. Colour/mood matches `src/design/tokens.ts`.
