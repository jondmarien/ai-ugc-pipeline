# renderer/ — React + Playwright + Remotion rendering layer

**Optional** deterministic asset factory for `ai-ugc-pipeline`. Turns an approved post into pixel-exact carousel PNGs and an optional Reel MP4, packaged for manual Instagram upload. Attaches at **Stage 8 (Assemble)** of `../pipeline/content/CONTENT_PIPELINE.md`. Delete it and manual Canva/Figma/CapCut assembly still works.

## Quick start

```bash
cd renderer
bun install
bunx playwright install chromium     # carousel screenshots
bunx remotion browser ensure         # reel rendering (once)

# ONE command — art → carousel → package → free GPU → voice → synced captions → reel:
bun run pipeline   -- 2026-06-02_ai-phishing-training                 # local FLUX.2 + VoxCPM2-2B default; add --flux1, --fal/--higgsfield (cloud art+motion), --publish=youtube,tiktok, --vox0.5, --seed=N, --no-voice/--no-reel

# idea → researched + humanized JSON → rendered (skills + claude CLI):
bun run draft      -- "AI agents leaking RAG data" model_security --theme=defensive --voice=voxcpm2
bun run draft-week -- "idea1::offensive_ai" "idea2::model_security::captions=highlight" "idea3::governance"

# individual steps:
bun run new        -- 2026-06-13 my-topic model_security --slides=8 --theme=defensive --captions=highlight   # scaffold a blank post (--slides=N: 3–20, default 8; themes: offensive/defensive/hacking/purple-team/ai)
bun run validate -- 2026-06-02_ai-phishing-training   # check JSON against the schema
bun run art      -- 2026-06-02_ai-phishing-training   # FLUX.2-klein backgrounds by default, cover included (needs ComfyUI; --flux1 = legacy)
bun run export   -- 2026-06-02_ai-phishing-training   # one 1080×1350 PNG per slide (N slides, default 8)
bun run package  -- 2026-06-02_ai-phishing-training   # caption/alt/sources/licenses/QA
bun run voice    -- 2026-06-02_ai-phishing-training --vox2 --seed=12345   # narration (VoxCPM2); seed logged
# voice options: --voice=bark (Suno; uv pip install bark soundfile; small models + E:\ai-ugc cache) ·
#                --custom-voice path/to/jon.wav (clone your OWN voice, VoxCPM2 zero-shot; seed optional)
bun run align    -- 2026-06-02_ai-phishing-training   # Whisper word-sync captions
bun run reel     -- 2026-06-02_ai-phishing-training --fit-voice   # 1080×1920 @30fps MP4, audio embedded
bun run publish  -- 2026-06-02_ai-phishing-training --platforms=youtube,tiktok --dry-run   # gated YT/TikTok publish (authorize once: bun run publish:auth youtube|tiktok)
bun run dev                                            # live preview @ :4317
```

**Cloud art/video (optional):** `--fal` (FAL.ai, needs `FAL_KEY`) or `--higgsfield` (needs `HIGGSFIELD_API_URL` + credentials) swap local ComfyUI for a cloud API across both backgrounds and per-beat reel motion. Standalone: `bun run art:fal|art:higgsfield`, `bun run reel:fal|reel:higgsfield`. See [docs/IMAGE_MODELS.md](docs/IMAGE_MODELS.md).

**New to this? Start with [docs/RUN_IT_YOURSELF.md](docs/RUN_IT_YOURSELF.md)** — the full self-serve guide to making new reels/carousels.

Output → `../pipeline/renders/2026-06-02_ai-phishing-training/`.

## What's working
Posts render end to end: N× **1080×1350** PNGs over **unique per-post FLUX.2-klein backgrounds** (theme-coloured, text-free; or cloud art via `--fal`/`--higgsfield`), full upload package (incl. an Instagram upload checklist and optional per-slide `slide_captions.txt`), and a **1080×1920 @30fps H.264** reel with **VoxCPM2 narration** auto-embedded (optional voice clone) and **Whisper word-synced captions**. The voice seed is logged to `voice.meta.json` so a voice you like is reproducible. Gated publishing to **YouTube Shorts + TikTok** ships via `bun run publish` (Instagram stays a manual checklist). ComfyUI optional — without it, inner slides fall back to procedural CSS.

## Docs
| Doc | What |
| --- | --- |
| [docs/RUN_IT_YOURSELF.md](docs/RUN_IT_YOURSELF.md) | **self-serve terminal guide** — new reels/carousels, Week-2 content, troubleshooting |
| [docs/PROJECT_ARCHITECTURE.md](docs/PROJECT_ARCHITECTURE.md) | whole-system view — layers, post-JSON model, GPU boundaries (Mermaid) |
| [docs/PIPELINE_ARCHITECTURE.md](docs/PIPELINE_ARCHITECTURE.md) | content→render flow — research, the 7 steps, sequence diagrams (Mermaid) |
| [docs/IMAGE_MODELS.md](docs/IMAGE_MODELS.md) | slide background generation — local FLUX.1-schnell / FLUX.2-klein-4B / SDXL matrix + the cloud `--fal` / `--higgsfield` art+motion path |
| [../docs/publishing/PUBLISHING.md](../docs/publishing/PUBLISHING.md) | gated YouTube/TikTok publishing — setup, auth, the publish command, audits |
| [docs/RENDERER_ARCHITECTURE.md](docs/RENDERER_ARCHITECTURE.md) | structure, deps, commands, boundaries |
| [docs/CONTENT_SCHEMA.md](docs/CONTENT_SCHEMA.md) | JSON contract + Markdown→JSON mapping + filenames |
| [docs/CAROUSEL_COMPONENTS.md](docs/CAROUSEL_COMPONENTS.md) | role components + shared shell |
| [docs/PLAYWRIGHT_EXPORT_WORKFLOW.md](docs/PLAYWRIGHT_EXPORT_WORKFLOW.md) | screenshot export + validation |
| [docs/REMOTION_REEL_WORKFLOW.md](docs/REMOTION_REEL_WORKFLOW.md) | reel composition + how to add narration |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | tokens, accents, type scale |
| [docs/WEEK_1_RENDER_TESTS.md](docs/WEEK_1_RENDER_TESTS.md) | render tests + what's next |
| [docs/PIPELINE_INTEGRATION_NOTES.md](docs/PIPELINE_INTEGRATION_NOTES.md) | how this fits the pipeline |

## Guardrails
No fabricated facts (claims triangulated + tagged `[Verified]/[Emerging]/[Scenario]`); no exploit/payload/evasion content; copy reads human, not AI (the `humanizer` skill + [`../pipeline/content/VOICE_AND_TONE_GUIDE.md`](../pipeline/content/VOICE_AND_TONE_GUIDE.md)); backgrounds are text-free/logo-free/credential-free; every model/asset that ships must be commercial-licensed (**VoxCPM2 ✅ Apache-2.0; F5-TTS base weights ❌ CC-BY-NC**); a human approval gate stays in front of every post — Instagram is manual, and YouTube/TikTok publish only through the gated `bun run publish` (a rendered, approved post). Nothing auto-posts a draft.

## Note on dependencies
- `node_modules/` is not committed; run `bun install`.
- Reused backgrounds live in `public/backgrounds/`. The PoC copies `cover_bg_01_ai_phishing.png` there from `../assets/...`.
- Harmless warning: Remotion 4 prefers zod v4 while we pin zod v3 for the schema; we don't use Remotion's zod feature, so it's safe to ignore.
