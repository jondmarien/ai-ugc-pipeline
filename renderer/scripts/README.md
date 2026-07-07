# 🔧 renderer/scripts/ — CLI entrypoints

Every command in `renderer/package.json` maps to a script here, invoked as `bun run <script> -- <args>`. Entry scripts stay thin orchestrators; repeated logic lives in [`lib/`](lib/README.md) (`.mjs` scripts) and [`lib.ts`](lib.ts) (TS scripts, Zod-backed). Most scripts support `--help` / `-h`.

## Typical order

```
draft (or hand-edit content/posts/*.json)
   │
status → approved            ← human gate
   │
pipeline                      art → export → package → free-comfyui → voice → align → reel
   │
publish (optional, gated)     youtube · tiktok · facebook · instagram
```

## Script map

### Authoring & lifecycle

| bun script | File | Role |
| --- | --- | --- |
| `new` | `new-post.ts` | Scaffold a blank post JSON (`--slides=N`, theme, captions mode). |
| `draft` / `draft-week` | `draft.mjs` / `draft-week.mjs` | Idea → researched JSON → render via the `claude` CLI (one post / batch of 5). |
| `draft-context` | `draft-reference.mjs` | Variety digest of recent posts (anti-repetition). |
| `validate` | `validate.ts` | Zod schema + content lint. |
| `status` | `set-status.mjs` | Lifecycle status setter (`draft → approved → generated → upload_ready`). |

### Art

| bun script | File | Role |
| --- | --- | --- |
| `art` | `art-comfyui.mjs` | Local ComfyUI FLUX.2 klein backgrounds (default engine; `--flux1` legacy). |
| `art:fal` / `art:higgsfield` | `art-fal.mjs` / `art-higgsfield.mjs` | Cloud backgrounds (FAL.ai / Higgsfield via `higgsfield-client.mjs` + `higgsfield-mcp.mjs`). |
| `art:diffusers` | `art.mjs` → `art-flux.py` | Legacy in-process diffusers path. |
| `higgsfield:models` | `higgsfield-models.mjs` | List cloud models + per-image credit cost. |
| `upscale` | `upscale-comfyui.mjs` | Standalone GAN upscale pass on existing backgrounds. |
| `import-bg` | `import-bg.mjs` | Adopt an external PNG folder as a post's backgrounds. |
| `slide-video` | `slide-video.mjs` | Turn a real GIF/video clip into a carousel **video slide**: canvas-fit MP4 + letterboxed poster PNG, sets `media_type: "video"` so packaging and the Instagram adapter publish the clip itself. |
| `free-comfyui` | `free-comfyui.mjs` | Unload ComfyUI models — the art → voice 8 GB GPU handoff. |

### Assets & reel

| bun script | File | Role |
| --- | --- | --- |
| `export` | `export-carousel.ts` (tsx) | Playwright carousel PNGs, 1080×1350 per slide. |
| `package` | `build-package.ts` | Upload bundle: caption/alt/sources/LICENSES/QA/IG checklist. |
| `voice` | `voice.mjs` → `voice-voxcpm.py` / `voice-bark.py` / `voice-http.mjs` | Narration WAVs (seeded, clone-capable). |
| `align` | `align.mjs` → `align-whisper.py` | Word-level caption timings. |
| `reel` | `render-reel.ts` | Remotion MP4, audio embedded. |
| `reel:fal` / `reel:higgsfield` | `reel-fal.mjs` / `reel-segments-higgsfield.mjs` | Per-beat cloud image-to-video motion clips. |

### Orchestration & publishing

| bun script | File | Role |
| --- | --- | --- |
| `pipeline` | `pipeline.mjs` | Full orchestrator: stage sequencing, multi-post selection, `--status=` batching, `--publish=` handoff. |
| `publish` | `publish.mjs` + `publish/` | Gated multi-platform publisher; adapters in `publish/adapters/` (youtube, tiktok, facebook, instagram). |
| `publish:auth` | `publish/auth/cli.mjs` | One-time loopback OAuth per platform (`youtube` / `tiktok` / `meta`). |
| `test:smoke` | `fit-smoke.mjs` → `fit-smoke-playwright.ts` | Fit-to-frame smoke test against the live app. |

Tests (`*.test.ts`) sit next to what they cover: art prompt families, the FAL/Higgsfield clients (HTTP, CLI, video), post scaffolding, and everything under `publish/`.
