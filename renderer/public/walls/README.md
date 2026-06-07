# Chrono walls — themed animated/still backgrounds

Five brand "walls", one per theme, as an alternative to the static dark / procedural background. Each theme has a **still** (`.png`) and an **animated loop** (`.webm`, VP9). All are **1080×1920 (9:16)** — sized for reels and Instagram stories. See `walls.json` for the machine-readable manifest.

| Theme | Accent | Still | Loop | Loop length |
|---|---|---|---|---|
| defensive | blue | `01-defensive-aegis.png` | `01-defensive-aegis.webm` | 5.9s |
| offensive | red | `02-offensive-breach.png` | `02-offensive-breach.webm` | 7.7s |
| hacking | green | `03-hacking-datastream.png` | `03-hacking-datastream.webm` | 7.6s |
| purple-team | purple | `04-purple-team-convergence.png` | `04-purple-team-convergence.webm` | 8.9s |
| ai | orange | `05-ai-latent-mesh.png` | `05-ai-latent-mesh.webm` | 4.8s |

Origin: generated with Claude's design tooling for this brand (chrono / @chron0s_cyb3r_w0rld.ai). Owned by Jon; cleared for this account's own posts. When a wall ships in a post, log it in that post's package `LICENSES.md` (written by `bun run package`).

## How to use each

**1. Carousel slide background (works today, no code change).**
The carousel and reel `Scene` already render `background_asset` as an image when `asset_status` is `existing` / `generated` / `stock`. Point a slide at a wall still and skip art generation:
```json
{ "background_asset": "/walls/05-ai-latent-mesh.png", "asset_status": "existing" }
```
Note the walls are 9:16 while carousels are 4:5 (1080×1350), so the still is cropped top/bottom by `object-fit: cover`. Best on the cover or a full-bleed slide.

**2. Instagram story background (manual, no pipeline).**
Stories are 1080×1920, the walls' native size. Upload the `.png` (static) or the `.webm` (animated) directly as the story background when you post. No render step needed.

**3. Animated reel background (needs a small renderer change).**
The reel `Scene` currently only draws an `<Img>`. To play a wall `.webm` behind a reel scene, add an optional `video_asset` to `Beat` (schema) and a Remotion `<OffthreadVideo loop>` branch in `renderer/remotion/Scene.tsx` (a ~6-line change, scoped in `PROJECT_ARCHITECTURE.md` notes). Ask and it can be wired so a post selects its theme wall automatically.

## Picking by theme
A post's `theme` (`offensive|defensive|hacking|purple-team|ai`) maps 1:1 to a wall above, so a wall can be chosen automatically from the post's theme. The colour/mood matches `src/design/tokens.ts`.
