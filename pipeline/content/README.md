# AI-in-Cybersecurity UGC Production Kit

**Positioning:** *AI cybersecurity explained through viral carousels: real threats, real tools, no fake panic.*

Manual-first (Meta API pending), modular, and structured for later API automation. Default canvas: **1080×1350** (carousel) · **1080×1920** (Reels).

## Start here
1. [CONTENT_PIPELINE.md](CONTENT_PIPELINE.md) — the spine: weekly workflow, scoring, source rules, upload package, future-API path.
2. [WEEK_1_POSTS.md](WEEK_1_POSTS.md) — 5 ready carousels (3 reuse existing demo assets).

## Content layer
| File | Purpose |
| --- | --- |
| [CONTENT_PIPELINE.md](CONTENT_PIPELINE.md) | End-to-end weekly pipeline + cadence + QA gate + API appendix |
| [IDEA_BACKLOG.md](IDEA_BACKLOG.md) | 40 scored ideas across 6 pillars (threshold ≥18) |
| [POST_TEMPLATE.md](POST_TEMPLATE.md) | Reusable single-post package |
| [CAPTION_BANK.md](CAPTION_BANK.md) | Hooks, caption frameworks, CTAs, hashtags, comment prompts |
| [VISUAL_PROMPT_BANK.md](VISUAL_PROMPT_BANK.md) | Cover + inner-slide prompts by pillar (no rendered text) |
| [QA_CHECKLIST.md](QA_CHECKLIST.md) | Credibility / safety / source / a11y / brand / media-rights gates |
| [WEEK_1_POSTS.md](WEEK_1_POSTS.md) | First 5 carousels, fully drafted + sourced |

## Media / video layer
| File | Purpose |
| --- | --- |
| [MEDIA_TOOL_STACK.md](../media/MEDIA_TOOL_STACK.md) | Modular stack by layer; two-track (Production + R&D) |
| [VOICEOVER_BAKEOFF.md](../media/VOICEOVER_BAKEOFF.md) | TTS test plan + 30s technical script |
| [BROLL_PROMPT_BANK.md](../media/BROLL_PROMPT_BANK.md) | Cyber b-roll prompts (stock search + AI gen) |
| [MUSIC_SFX_GUIDE.md](../media/MUSIC_SFX_GUIDE.md) | Music/SFX rules, levels, sources |
| [VIDEO_ASSEMBLY_WORKFLOW.md](../media/VIDEO_ASSEMBLY_WORKFLOW.md) | CapCut/Canva first, optional FFmpeg/OpenShorts |
| [OPEN_SOURCE_EVALUATION_MATRIX.md](../media/OPEN_SOURCE_EVALUATION_MATRIX.md) | Verified comparison of 8 OSS tools (licenses, run-paths) |
| [WEEK_1_VIDEO_EXPERIMENTS.md](../media/WEEK_1_VIDEO_EXPERIMENTS.md) | 5 Reel experiments A/B-testing the stack |

## Existing assets (reused)
`ai_cybersecurity_carousel_assets_ready_to_post/` — 3 text-free cover backgrounds + 3 finished 8-slide demo carousels (phishing, prompt injection, data leakage).

## Non-negotiables
- No fabricated CVEs, numbers, quotes, breach details. Tag claims **[Verified]/[Emerging]/[Scenario]**.
- No exploit steps, payloads, or evasion guidance. Every post ends with a defender takeaway.
- Commercial-license verified for every model/asset that touches a post (e.g. **F5-TTS base weights are non-commercial**; **VoxCPM2 is Apache-2.0**; **Open-AI-UGC deferred**).
- Synthetic or authorized voice only; no misleading deepfakes of real people.

## Verified anchor facts (re-check before each use)
- OWASP Top 10 for LLM Applications (2025) — Prompt Injection, Sensitive Info Disclosure, Excessive Agency.
- NCSC AI-and-cyber-threat assessments (2024; 2025–2027) — "uplift in reconnaissance and social engineering."
- Arup Hong Kong deepfake fraud (~US$25M, cloned CFO on a video call; reported 2024).
