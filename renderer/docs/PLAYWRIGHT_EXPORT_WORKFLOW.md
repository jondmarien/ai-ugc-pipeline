# PLAYWRIGHT_EXPORT_WORKFLOW.md

Deterministic carousel export. Implementation: `../scripts/export-carousel.ts` (+ `../scripts/lib.ts`, `../scripts/build-package.ts`).

## What it does

1. Loads + **re-validates** the post JSON (`loadPost` → Zod). Fails loud on bad data.
2. Boots a **Vite dev server** in-process (`createServer`, port 4317) — no separate build step.
3. Launches **Chromium** with `viewport = canvas` and `deviceScaleFactor: 1`.
4. For each slide: navigates to `/?post=<prefix>&slide=<n>`, waits for `html[data-render-ready="1"]` (fonts + images loaded), screenshots the `#slide-root` element.
5. Writes PNGs to `pipeline/renders/<folder>/` using the pipeline filename convention.
6. **Validates** every PNG (parses the PNG IHDR for exact `1080×1350`, asserts non-empty). Any mismatch → non-zero exit.

## Run

```bash
cd renderer
bun install
bunx playwright install chromium     # once
bun run export -- 2026-06-02_ai-phishing-training
bun run package -- 2026-06-02_ai-phishing-training   # caption/alt/sources/licenses/QA
```

## Export settings (and why)

| Setting | Value | Why |
| --- | --- | --- |
| Viewport | `canvas.width × canvas.height` (1080×1350) | element fills viewport; clean screenshot. |
| `deviceScaleFactor` | `1` | exact-pixel output (no 2× upscaling) unless explicitly wanted. |
| Selector | `#slide-root` | screenshot the slide element, not the page. |
| Readiness gate | `html[data-render-ready="1"]` | set after `document.fonts.ready` + all `<img>` loaded — prevents half-rendered captures. |
| Wait | `networkidle` + readiness flag | fonts/images settled. |
| Background | opaque (`#02030a`) | no accidental transparency. |

## Validation / failure behavior (render-side QA)

The script **stops with a non-zero exit** when:
- a PNG is not exactly the canvas size,
- a screenshot is empty/too small (<1KB),
- (warns) the cover's `existing` background asset is missing from `public/`.

`build-package.ts` additionally cross-checks: alt-text count == slide count, ≥1 source present, defense slide present, and emits the manual-review rows.

## Output package

```
pipeline/renders/2026-06-02_ai-phishing-training/
  2026-06-02_ai-phishing-training_01_cover.png … _08_cta.png   (1080×1350 each)
  caption.txt          # caption + hashtags
  alt_text.txt         # one line per slide
  sources.md           # source table + claim tags
  LICENSES.md          # asset/audio rights (QA Gate 7)
  render_qa_checklist.md
  2026-06-02_ai-phishing-training_reel.mp4   # if reel rendered
```

## Notes / gotchas
- The script calls `process.exit(0)` on success because the Vite dev server keeps the event loop alive (a graceful `server.close()` can hang on Windows). If you ever see the run "finish but not return," that's why the explicit exit exists.
- Port 4317 is `strictPort` — if a stale dev server holds it, kill it (`netstat -ano | grep 4317` → `taskkill /PID <pid> /F`) before re-running.
- Reused backgrounds must live under `renderer/public/` (served at `/backgrounds/...`); Vite won't serve files outside the project root.

## Higher-res variant
For a 2× export, pass a higher `deviceScaleFactor` (e.g. 2) — but Instagram only needs 1080px wide, so default `1` is correct for upload. Document any deviation.
