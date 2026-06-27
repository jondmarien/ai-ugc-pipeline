# AI-UGC Pipeline

**AI cybersecurity explained through viral carousels: real threats, real tools, no fake panic.**

A content production system for AI-in-cybersecurity UGC — Instagram-style carousels and short-form Reels — plus an optional React/Remotion rendering layer that turns approved posts into pixel-exact assets, and a gated publisher for YouTube Shorts + TikTok.

> **Publishing:** YouTube Shorts and TikTok publish through a gated `bun run publish` (only a rendered+approved post, with dry-run/confirm). **Instagram stays manual** (Meta API access pending) — the pipeline emits a paste-ready upload checklist. Nothing auto-posts; a human gate is always in front. See [`docs/publishing/PUBLISHING.md`](docs/publishing/PUBLISHING.md).

---

## What's here

| Folder | What it is |
| --- | --- |
| [`pipeline/content/`](pipeline/content/) | The content kit — workflow, scored idea backlog, post template, caption bank, visual prompts, QA gates, Week-1 carousels. |
| [`pipeline/media/`](pipeline/media/) | The media/video kit — modular tool stack, voiceover bake-off, b-roll prompts, music/SFX rules, video assembly, verified open-source tool evaluation. |
| [`renderer/`](renderer/) | Optional React + Tailwind + Playwright (carousels) and Remotion (Reels) rendering layer. Turns approved post JSON into deterministic assets. |
| [`pipeline/renders/`](pipeline/renders/) | Upload-ready output packages (rendered PNGs + reel MP4 + caption/alt/sources/licenses/QA). |
| [`assets/`](assets/) | Project handoffs, skills, and the original demo image assets (3 finished carousels + text-free cover backgrounds). |

## How it fits together

```
idea → score → frame → script → visual → caption → QA → ASSEMBLE → upload → feedback
                                                          │
                          pipeline/content + pipeline/media own everything up to here
                                                          │
                                            renderer/ attaches at "Assemble" (optional)
                                                          ▼
                                   pipeline/renders/<date_slug>/  →  manual upload
```

The 10-stage workflow lives in [`pipeline/content/CONTENT_PIPELINE.md`](pipeline/content/CONTENT_PIPELINE.md). The renderer is an **adapter, not a brain** — delete it and manual Canva/Figma/CapCut assembly of the same approved content still works.

## Content pillars

Offensive AI · Defensive AI · Model Security · Data Leakage · Governance · Myth-busting.
Ideas are scored 1–5 on credibility / relevance / novelty / visual drama / defender usefulness (produce if total ≥ 18) — see [`pipeline/content/IDEA_BACKLOG.md`](pipeline/content/IDEA_BACKLOG.md).

## Quickstart — render a post

```bash
cd renderer
bun install
bunx playwright install chromium      # carousel screenshots
bunx remotion browser ensure          # reel rendering (once)

# one command: backgrounds (local FLUX.2 klein by default) → carousel → package → free GPU → voice → synced captions → reel
bun run pipeline -- 2026-06-02_ai-phishing-training
```

Output lands in `pipeline/renders/2026-06-02_ai-phishing-training/`. The pipeline runs one GPU model at a time (8 GB) and auto-skips stages it doesn't need. Backgrounds are local ComfyUI/FLUX.2 by default; pass `--fal` or `--higgsfield` to generate art (and per-beat reel motion) via a cloud API instead — see [`renderer/docs/IMAGE_MODELS.md`](renderer/docs/IMAGE_MODELS.md). Add `--publish=youtube,tiktok` to publish the reel after rendering (gated; see below). Individual steps (`export`, `package`, `voice`, `align`, `reel`) and flags are in [`renderer/README.md`](renderer/README.md); the design lives in [`renderer/docs/PROJECT_ARCHITECTURE.md`](renderer/docs/PROJECT_ARCHITECTURE.md) and [`renderer/docs/PIPELINE_ARCHITECTURE.md`](renderer/docs/PIPELINE_ARCHITECTURE.md).

### Or automate it with the skills (idea → rendered, no manual JSON)
With the `claude` CLI installed, the repo's skills (`.claude/skills/`) do the content + source research for you (the content/render pair plus the `humanizer` → `stop-slop` → `professional-proofreader` copy chain, and `ig-ingest` for mining reference posts):
```
# interactive, in Claude Code at the repo root:
/draft-post AI agents leaking RAG data | model_security | slides=10 | captions=highlight
/draft-week voice clone fraud::offensive_ai | RAG leaks::model_security | shadow AI::governance
# or headless:
cd renderer && bun run draft -- "AI agents leaking RAG data" model_security --captions=highlight
cd renderer && bun run draft-week -- "idea1::offensive_ai" "idea2::model_security::captions=word" "idea3::governance"
```
`/draft-post` makes one post; `/draft-week` batches up to 5 with pillar variety + a posting calendar. Both research real sources, write schema-valid JSON, validate, and render the carousel + reel. **Slide count** is selectable per post — `slides=N` (3–20, default 8). **Subtitle style** is selectable per post — `block` (paragraph), `word` (karaoke), or `highlight` (active word lit, the default). Carousels can also opt into native **per-slide Instagram captions** (the `--multiple-captions` opt-in), which emit a `slide_captions.txt` + paste-order checklist. See [`renderer/docs/RUN_IT_YOURSELF.md`](renderer/docs/RUN_IT_YOURSELF.md) §2b. (Always review generated sources before posting — the no-fabrication rule still applies.)

## Publish (optional, gated)

After a post renders, publish its reel to YouTube Shorts + TikTok. Instagram stays a manual checklist.

```bash
cd renderer
bun run publish:auth youtube           # one-time OAuth (also: tiktok)
bun run publish -- <post-key> --platforms=youtube,tiktok --dry-run   # preview, post nothing
bun run publish -- <post-key> --platforms=youtube,tiktok             # real run (asks to confirm)
# or as a final pipeline stage:
bun run pipeline -- <post-key> --publish=youtube,tiktok
```

Only a **`generated`** post (approved *and* rendered) can publish; success flips it to `upload_ready`, and re-runs skip platforms already posted. Uploads stay private / `SELF_ONLY` until each platform's API audit passes (a one-value flip in `publish.config.json`). Full setup, audit applications, and the privacy policy live in [`docs/publishing/`](docs/publishing/).

## Non-negotiables (the trust standard)

- **No fabrication** — no invented CVEs, breach details, stats, quotes, or timelines. Claims are tagged **[Verified] / [Emerging] / [Scenario]**.
- **No offensive how-to** — no payloads, exploit chains, or evasion steps. Mechanisms stay high-level.
- **Defender value** — every post ends with a practical takeaway.
- **Human voice** — copy is written sharp and specific, then run through the `humanizer` skill to strip AI tells; see [`pipeline/content/VOICE_AND_TONE_GUIDE.md`](pipeline/content/VOICE_AND_TONE_GUIDE.md).
- **Media rights tracked** — every model/asset that ships is commercial-licensed (e.g. **VoxCPM2 ✅ Apache-2.0**; **F5-TTS base weights ❌ CC-BY-NC**). Logged in `LICENSES.md`.
- **Human approval before posting** — a gate, not a ban. Instagram is manual; YouTube/TikTok publish only through the gated `bun run publish` (a rendered, approved post, with dry-run/confirm). Nothing auto-posts a draft.

## Default formats

Carousel `1080×1350` · Reel `1080×1920` @30fps H.264 · 8-slide arc: cover → context → risk → mechanism → failure point → defense → takeaway → CTA.

## Status

**Production — the full pipeline runs end to end and is in regular use:** idea → researched, sourced, in-voice copy → rendered carousel + narrated reel → gated multi-platform publish. Local-first on an 8 GB GPU, with optional cloud art/video and a human approval gate in front of every post.

**Roadmap (pipeline-level):**
- **Take publishing public** — YouTube and TikTok uploads stay private / `SELF_ONLY` until each platform's API audit passes; going public is then a one-value flip in `publish.config.json`, no code change.
- **Automate Instagram** — wire up Instagram publishing once Meta API access clears; today it's the only platform that's a manual paste (from the generated upload checklist).
- **Analytics dashboard** — repoint the existing dashboard from Instagram metrics to YouTube + TikTok stats (the read scopes are already reserved at auth; tracked as a separate spec).
