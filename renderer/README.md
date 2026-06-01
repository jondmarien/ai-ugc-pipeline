# renderer/ — React + Playwright + Remotion rendering layer

**Optional** deterministic asset factory for `ai-ugc-pipeline`. Turns an approved post into pixel-exact carousel PNGs and an optional Reel MP4, packaged for manual Instagram upload. Attaches at **Stage 8 (Assemble)** of `../pipeline/content/CONTENT_PIPELINE.md`. Delete it and manual Canva/Figma/CapCut assembly still works.

## Quick start

```bash
cd renderer
npm install
npx playwright install chromium     # carousel screenshots
npx remotion browser ensure         # reel rendering (once)

npm run draft      -- "AI agents leaking RAG data" model_security   # idea → researched JSON → rendered (skills + claude CLI)
npm run draft-week -- "idea1::offensive_ai" "idea2::model_security::captions=highlight" "idea3::governance"  # batch a week
npm run new        -- 2026-06-13 my-topic model_security --captions=highlight   # scaffold a blank post (manual fill)
npm run validate -- 2026-06-02_ai-phishing-training   # check JSON
npm run export   -- 2026-06-02_ai-phishing-training   # 8 carousel PNGs
npm run package  -- 2026-06-02_ai-phishing-training   # caption/alt/sources/licenses/QA
npm run reel     -- 2026-06-02_ai-phishing-training   # 1080×1920 MP4 (optional)
npm run dev                                            # live preview @ :4317
```

**New to this? Start with [docs/RUN_IT_YOURSELF.md](docs/RUN_IT_YOURSELF.md)** — the full self-serve guide to making new reels/carousels and Week-2 content.

Output → `../pipeline/renders/2026-06-02_ai-phishing-training/`.

## What's proven (PoC)
Week-1 Post 1 renders end-to-end: 8× **1080×1350** PNGs (cover reuses the text-free `cover_bg_01_ai_phishing.png` with the headline rendered on top; inner slides procedural), full upload package, and a **1080×1920 @30fps H.264** reel stub (no audio).

## Docs
| Doc | What |
| --- | --- |
| [docs/RUN_IT_YOURSELF.md](docs/RUN_IT_YOURSELF.md) | **self-serve terminal guide** — new reels/carousels, Week-2 content, troubleshooting |
| [docs/RENDERER_ARCHITECTURE.md](docs/RENDERER_ARCHITECTURE.md) | structure, deps, commands, boundaries |
| [docs/CONTENT_SCHEMA.md](docs/CONTENT_SCHEMA.md) | JSON contract + Markdown→JSON mapping + filenames |
| [docs/CAROUSEL_COMPONENTS.md](docs/CAROUSEL_COMPONENTS.md) | role components + shared shell |
| [docs/PLAYWRIGHT_EXPORT_WORKFLOW.md](docs/PLAYWRIGHT_EXPORT_WORKFLOW.md) | screenshot export + validation |
| [docs/REMOTION_REEL_WORKFLOW.md](docs/REMOTION_REEL_WORKFLOW.md) | reel composition + how to add narration |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | tokens, accents, type scale |
| [docs/WEEK_1_RENDER_TESTS.md](docs/WEEK_1_RENDER_TESTS.md) | render tests + what's next |
| [docs/PIPELINE_INTEGRATION_NOTES.md](docs/PIPELINE_INTEGRATION_NOTES.md) | how this fits the pipeline |

## Guardrails
No fabricated facts; no exploit/payload/evasion content; backgrounds are text-free/logo-free/credential-free; every model/asset that ships must be commercial-licensed (**VoxCPM2 ✅ Apache-2.0; F5-TTS base weights ❌ CC-BY-NC**); manual upload + human approval stay the default — no auto-publishing.

## Note on dependencies
- `node_modules/` is not committed; run `npm install`.
- Reused backgrounds live in `public/backgrounds/`. The PoC copies `cover_bg_01_ai_phishing.png` there from `../assets/...`.
- Harmless warning: Remotion 4 prefers zod v4 while we pin zod v3 for the schema; we don't use Remotion's zod feature, so it's safe to ignore.
