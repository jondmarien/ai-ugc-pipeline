# AI-UGC Pipeline

**AI cybersecurity explained through viral carousels: real threats, real tools, no fake panic.**

A manual-first, API-ready content production system for AI-in-cybersecurity UGC — Instagram-style carousels and short-form Reels — plus an optional React/Remotion rendering layer that turns approved posts into pixel-exact assets.

> Built while Instagram/Meta API access is pending verification. Everything is designed to **publish manually now** (Meta Business Suite / Instagram) and **plug into API automation later** behind a human approval gate.

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
npm install
npx playwright install chromium      # carousel screenshots
npx remotion browser ensure          # reel rendering (once)

npm run export  -- 2026-06-02_ai-phishing-training   # 8× 1080×1350 carousel PNGs
npm run package -- 2026-06-02_ai-phishing-training   # caption/alt/sources/licenses/QA
npm run reel    -- 2026-06-02_ai-phishing-training   # 1080×1920 @30fps MP4 (optional)
```

Output lands in `pipeline/renders/2026-06-02_ai-phishing-training/`. Full docs: [`renderer/README.md`](renderer/README.md) and [`renderer/docs/`](renderer/docs/).

### Or automate it with the skills (idea → rendered, no manual JSON)
With the `claude` CLI installed, the repo's two skills (`.claude/skills/`) do the content + source research for you:
```
# interactive, in Claude Code at the repo root:
/draft-post AI agents leaking RAG data | model_security | captions=highlight
/draft-week voice clone fraud::offensive_ai | RAG leaks::model_security | shadow AI::governance
# or headless:
cd renderer && npm run draft -- "AI agents leaking RAG data" model_security --captions=highlight
cd renderer && npm run draft-week -- "idea1::offensive_ai" "idea2::model_security::captions=word" "idea3::governance"
```
`/draft-post` makes one post; `/draft-week` batches up to 5 with pillar variety + a posting calendar. Both research real sources, write schema-valid JSON, validate, and render the carousel + reel. **Subtitle style** is selectable per post — `block` (paragraph), `word` (karaoke), or `highlight` (active word lit). See [`renderer/docs/RUN_IT_YOURSELF.md`](renderer/docs/RUN_IT_YOURSELF.md) §2b. (Always review generated sources before posting — the no-fabrication rule still applies.)

## Non-negotiables (the trust standard)

- **No fabrication** — no invented CVEs, breach details, stats, quotes, or timelines. Claims are tagged **[Verified] / [Emerging] / [Scenario]**.
- **No offensive how-to** — no payloads, exploit chains, or evasion steps. Mechanisms stay high-level.
- **Defender value** — every post ends with a practical takeaway.
- **Media rights tracked** — every model/asset that ships is commercial-licensed (e.g. **VoxCPM2 ✅ Apache-2.0**; **F5-TTS base weights ❌ CC-BY-NC**). Logged in `LICENSES.md`.
- **Human approval before posting** — no auto-publishing.

## Default formats

Carousel `1080×1350` · Reel `1080×1920` @30fps H.264 · 8-slide arc: cover → context → risk → mechanism → failure point → defense → takeaway → CTA.

## Status

- Content + media kits: complete.
- Renderer: working proof-of-concept — Week-1 Post 1 rendered end-to-end (8 carousel PNGs + a reel) and committed under `pipeline/renders/`.
- Next: render Posts 4–5 (new visuals), add a narrated reel (VoxCPM2 voice + licensed music), batch command, then API publishing once Meta access clears.
