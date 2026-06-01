# RENDERER_ARCHITECTURE.md

The **optional** deterministic rendering layer for `ai-ugc-pipeline`. It turns an approved post into pixel-exact carousel PNGs (React + Tailwind + Playwright) and an optional Reel MP4 (Remotion), packaged for the existing manual-first upload flow.

> **Boundary:** the renderer is an *adapter, not a brain*. It attaches at **Stage 8 (Assemble)** of `../../pipeline/content/CONTENT_PIPELINE.md`, after content has passed QA. It does **not** do research, scripting, captioning, source verification, publishing, or analytics. If the renderer is deleted, manual Canva/Figma/CapCut assembly of the same approved content still works.

## Where it lives

```
ai-ugc-pipeline/
  assets/            # handoffs, skills, demo image assets
  pipeline/
    content/         # the content kit (POST_TEMPLATE, WEEK_1_POSTS, QA_CHECKLIST, …)
    media/           # the media kit (VIDEO_ASSEMBLY_WORKFLOW, OPEN_SOURCE_EVALUATION_MATRIX, …)
    renders/         # OUTPUT — upload-ready packages land here
  renderer/          # THIS layer (top-level, beside pipeline/)
```

## Internal structure

| Path | Purpose |
| --- | --- |
| `content/posts/*.json` | Normalized render data, one file per post (see `CONTENT_SCHEMA.md`). |
| `src/lib/schema.ts` | Zod schema + `validatePost()`. Single source of truth for shape; fails loud on missing fields. |
| `src/lib/posts.ts` | Loads + validates all post JSON for the preview app. |
| `src/design/tokens.ts` | Palette, pillar accents, type scale, safe margins (see `DESIGN_SYSTEM.md`). |
| `src/components/carousel/` | `CarouselSlide` shell, `SlideBackground`, 8 role slides, `CarouselDeck` (see `CAROUSEL_COMPONENTS.md`). |
| `src/App.tsx` + `index.html` | Query-param preview app: `?post=<key>&slide=<n>` renders one exact-size `#slide-root`. |
| `scripts/export-carousel.ts` | Playwright screenshot export (see `PLAYWRIGHT_EXPORT_WORKFLOW.md`). |
| `scripts/build-package.ts` | Writes `caption.txt`, `alt_text.txt`, `sources.md`, `LICENSES.md`, `render_qa_checklist.md`. |
| `scripts/render-reel.ts` | Remotion render wrapper + ffprobe verification (see `REMOTION_REEL_WORKFLOW.md`). |
| `scripts/validate.ts` | Standalone schema validation. |
| `remotion/` | `index.ts`, `Root.tsx`, `ReelComposition.tsx`, `Scene.tsx`, `CaptionLayer.tsx`, `EndCard.tsx`, `theme.ts`. |
| `public/backgrounds/` | Reused text-free pipeline backgrounds served to the browser (e.g. `cover_bg_01_ai_phishing.png`). |

## Dependencies

- **React 19 + Vite 7 + TypeScript** — component-driven, exact-size layout.
- **Tailwind v4** (`@tailwindcss/vite`) — base/reset; exact sizing uses inline styles from tokens for determinism.
- **Zod** — schema validation (no guessed fields).
- **Playwright** (Chromium) — browser-accurate element screenshots at exact pixel size.
- **Remotion 4** (`@remotion/cli`) — React-based 9:16 video composition + H.264 export.
- **@fontsource** (Archivo / Inter / JetBrains Mono) — fonts bundled locally so renders are deterministic offline.

Install once:
```bash
cd renderer
npm install
npx playwright install chromium    # carousel export
# Remotion downloads its own headless browser on first `npm run reel`.
```

## Commands

| Command | Does |
| --- | --- |
| `npm run dev` | Live preview server (`http://localhost:4317/?post=<slug>&mode=deck`). |
| `npm run validate -- <post>` | Validate a post JSON against the schema. |
| `npm run export -- <post>` | Render 8 carousel PNGs → `pipeline/renders/<folder>/`. |
| `npm run package -- <post>` | Write caption/alt/sources/licenses/QA files into the same folder. |
| `npm run reel -- <post>` | Render the Reel MP4 (if `video.enabled`) + ffprobe check. |

`<post>` = slug / post_id / filename_prefix (e.g. `2026-06-02_ai-phishing-training`).

## Data flow

```
POST_TEMPLATE.md / WEEK_1_POSTS.md  (human-authored Markdown)
        │  manual map (no guessing)
        ▼
renderer/content/posts/<post>.json   ──validate (Zod)──► fail loud if incomplete
        │
        ├── React preview ──Playwright──► 8× 1080×1350 PNG
        ├── build-package ─────────────► caption.txt, alt_text.txt, sources.md, LICENSES.md, render_qa_checklist.md
        └── Remotion ──────────────────► <slug>_reel.mp4 (1080×1920@30fps, optional)
        ▼
pipeline/renders/<YYYY-MM-DD_slug>/   ──► manual upload (Business Suite / IG)
```

## Design boundaries (what this layer must NOT become)

- ❌ No auto-publishing to Instagram (manual upload + approval stays default; API is a separate future module).
- ❌ No SaaS dashboard, auth, billing, or job queue.
- ❌ No autonomous research / claim generation — content discipline lives in `pipeline/content/`.
- ❌ No auto-generated exploit visuals; mechanism imagery stays abstract.
- ❌ No dependency on external design skills — design principles are embedded directly in `tokens.ts` + components.

## Status & next slices

**Done (PoC):** schema + validation, design tokens, 8 role components, Playwright export, package builder, Remotion reel stub, Week-1 Post 1 rendered end-to-end.

**Next** (see `WEEK_1_RENDER_TESTS.md`): render Post 4/5 (new text-free visuals) → narrated reel with VoxCPM2 voice + licensed music + populated `LICENSES.md` → batch command for Posts 1–5 → optional `1080×1080` variant. Publishing/API stays out of scope until Meta access clears.
