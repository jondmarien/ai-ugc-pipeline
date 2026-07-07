---
name: ai-ugc-pipeline
description: Turn one idea into a sourced, human-approved AI-cybersecurity Instagram carousel plus a narrated vertical reel. The umbrella skill for the whole ai-ugc-pipeline repo — research with tiered claims, write in a calibrated human voice, render cinematic slides with FLUX.2 and Remotion, narrate with a cloned voice, and publish through a gated pipeline. Use when asked to create a cybersecurity/AI social post end to end, set up this pipeline, or orchestrate its sub-skills (carousel writer, humanizer, stop-slop, proofreader, renderer, ig-ingest).
---

# AI UGC Pipeline

One idea in. A publish-ready package out: an 8-slide cinematic carousel (1080×1350 PNGs), a narrated 1080×1920 reel with word-synced captions, a sourced caption, alt text, and a LICENSES file. Positioning: **real threats, real tools, no fake panic.**

This is the entry-point skill for the repo at https://github.com/jondmarien/ai-ugc-pipeline. It works in two modes:

- **Copy-only mode (no setup):** research, hooks, slide scripts, captions, and QA using this file and the sub-skills. Works anywhere.
- **Full pipeline mode (repo cloned):** everything above plus schema-valid post JSON, rendered slides, generated key art, cloned-voice narration, and a cut reel.

## Setup (full pipeline mode)

```bash
git clone https://github.com/jondmarien/ai-ugc-pipeline
cd ai-ugc-pipeline/renderer
bun install
bunx remotion browser ensure   # once, before the first reel
```

Optional (each degrades gracefully when absent):
- **Local art:** a running ComfyUI with FLUX.2 klein 4B GGUF (8 GB VRAM is enough). Without it, inner slides render procedural CSS backgrounds, or use cloud art (`--fal` / `--higgsfield`); `bun run higgsfield:models` lists each model's per-image credit cost, and `--budget=N` caps what a run may spend.
- **Voice:** `renderer/.venv` via uv (deps in `renderer/pyproject.toml`) for VoxCPM2 narration. Without it, the reel renders silent and warns.
- **Publishing:** OAuth once per platform with `bun run publish:auth youtube|tiktok|meta`.

Everything runs with **bun, never npm**.

## The workflow

```
idea → research loop → post JSON → copy chain → validate → render → approve → publish
```

1. **Research is a loop, not a lookup.** Landscape scan, gather primary sources, triangulate at least two independent sources per load-bearing claim, then tier every claim `[Verified]` / `[Emerging]` / `[Scenario]`. Hard gates: no fabricated CVEs, stats, quotes, or URLs; never name a victim without a cited public source.
2. **Write the post** with the `ai-cybersecurity-ugc-carousel` skill: cover hook (≤8 words), slide scripts (default 8, configurable 3–20), an independent reel script, caption, and per-slide FLUX prompts authored lighting-first per `pipeline/content/VISUAL_PROMPT_BANK.md`.
3. **Run the copy chain, in order:** `humanizer` → `stop-slop` → `professional-proofreader`. Voice changes *how* copy reads, never *what* it claims. Hard rules on every surface: no em-dashes, no sentence fragments.
4. **Render** (repo mode): `cd renderer && bun run pipeline -- <key>` — backgrounds → carousel PNGs → package → voice → word-synced captions → reel with audio embedded. Only `approved` posts render.
5. **Human approval is a gate, not a ban.** `bun run publish -- <key> --platforms=...` posts only a `generated` (approved AND rendered) post, and uploads stay private/self-only until each platform's API audit passes.

## Commands (slash commands in the repo)

| Command | Does |
| --- | --- |
| `/draft-post <idea> \| <pillar>` | One post end to end: research → JSON → copy chain → render. Options: `slides=N`, `theme=`, `style_fusion=`, `voice=`, `captions=` |
| `/draft-week idea::pillar \| …` | Batch up to 5 posts with pillar variety and a posting calendar |
| `/ingest-post <url>` | Mine a competitor/inspiration IG post for pipeline improvements (never drafts from it) |
| `/refresh-post`, `/update-status` | Re-run copy passes; move posts through draft → approved → generated → upload_ready |

Headless equivalents: `bun run draft -- "<idea>" <pillar>`, `bun run pipeline -- <key>`, `bun run publish -- <key>`.

## The sub-skills this orchestrates

| Skill | Role |
| --- | --- |
| `ai-cybersecurity-ugc-carousel` | Hooks, slide scripts, captions, QA — the content brain |
| `react-remotion-instagram-renderer` | Maps approved content to the renderer JSON schema and produces assets |
| `humanizer` | Rewrites copy in the calibrated brand voice, strips AI tells |
| `stop-slop` | Scores and strips predictable AI patterns (revise below 35/50) |
| `professional-proofreader` | Final grammar/completeness pass; every line a complete spoken sentence |
| `ig-ingest` | Turns Instagram URLs into reviewable pipeline-improvement deltas |

When the full repo is present, read `pipeline/content/BRAND_BRAIN.md` (voice), `renderer/docs/PROJECT_ARCHITECTURE.md` (design), and `pipeline/content/QA_CHECKLIST.md` (gates) before drafting.

## Non-negotiables

- **No fabrication.** Every factual claim has a real source or a `[Scenario]` tag.
- **Concrete defender takeaway** in every post.
- **Human approval before anything posts.** Never weaken the publish gate.
- **Commercial-licensed media only** (VoxCPM2 Apache-2.0 yes; F5-TTS base weights CC-BY-NC no). Log in `LICENSES.md`.
- Clone only your own authorized voice, and label AI-generated audio. Instagram posts set Meta's `is_ai_generated` disclosure.
