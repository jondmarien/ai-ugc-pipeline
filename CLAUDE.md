# CLAUDE.md — project guide for Claude Code

AI-in-cybersecurity UGC pipeline. **Positioning:** *real threats, real tools, no fake panic.*

## Skills (installed in this repo)
- **ai-cybersecurity-ugc-carousel** — writes the content (hooks, 8-slide scripts, captions, QA). Use when drafting post copy/ideas.
- **react-remotion-instagram-renderer** — maps approved content to the renderer JSON schema and produces assets. Use when turning content into files.

## Commands to make posts
- `/draft-post <idea> | <pillar> [| captions=word|highlight]` — one post, end to end.
- `/draft-week idea1::pillar | idea2::pillar::captions=highlight | …` — batch up to 5 with pillar variety + a posting calendar.
Both research sources, write schema-valid `renderer/content/posts/<date>_<slug>.json`, validate, and render carousel PNGs + a reel into `pipeline/renders/`. Headless: `cd renderer && bun run draft -- "<idea>" <pillar>` / `bun run draft-week -- "idea::pillar" …`.
Reel **subtitle style** = `video.caption_mode` ∈ `block | word | highlight` (set via `--captions=` / `captions=`).
Reel **audio** = `video.audio` — `voice_mode` ∈ `none|voxcpm2|http|file`, `music_mode` ∈ `none|free|licensed|generated|file` (set via `--voice=`/`--music=`). Files in `renderer/public/audio/<prefix>/`; `bun run voice -- <key>` generates narration: **voxcpm2** (local model, uses `renderer/.venv` via uv) or **http** (OpenAI-compatible `/v1/audio/speech`, e.g. Kokoro-FastAPI; `TTS_BASE_URL` env). Missing file ⇒ reel renders silent/voice-only + warns. **LM Studio has no TTS endpoint and Gemma is an LLM — use voxcpm2 or an http TTS server.** Never use F5-TTS base weights commercially (CC-BY-NC).

## Non-negotiable rules (enforced by pipeline/content/QA_CHECKLIST.md)
- **No fabrication** — no invented CVEs, breach details, stats, quotes, or papers. Back every factual claim with a real source (WebSearch/WebFetch) or tag it `[Scenario]`.
- **No offensive how-to** — no payloads, exploit chains, evasion, or credential-theft steps; keep mechanisms high-level.
- Every post needs a concrete **defender takeaway**.
- **Media rights**: only commercial-licensed models/assets ship (VoxCPM2 ✅ Apache-2.0; F5-TTS base weights ❌ CC-BY-NC). Log in `LICENSES.md`.
- Manual upload + human approval before posting. No auto-publishing.

## Layout
- `pipeline/content/` — workflow, IDEA_BACKLOG, POST_TEMPLATE, CAPTION_BANK, VISUAL_PROMPT_BANK, QA_CHECKLIST, WEEK_1_POSTS.
- `pipeline/media/` — tool stack, voiceover/b-roll/music guides, OPEN_SOURCE_EVALUATION_MATRIX.
- `renderer/` — React+Playwright carousels + Remotion reels. Docs in `renderer/docs/`; start with `renderer/docs/RUN_IT_YOURSELF.md`.
- `pipeline/renders/` — upload-ready output packages.

## Renderer commands (run inside `renderer/`)
`bun run new -- <date> <slug> <pillar>` · `bun run draft -- "<idea>" <pillar>` · `bun run validate|export|package|reel -- <key>` · `bun run dev`.
Reel **narration**: `bun run voice -- <key>` (voxcpm2/bark = local, no server; http = OpenAI-compatible server). `bun run align -- <key>` = Whisper word-sync. **Slide imagery**: `bun run art -- <key>` = FLUX.1-schnell (local, Apache-2.0) backgrounds for inner slides; without it inner slides are minimalist procedural CSS. All ML steps use `renderer/.venv` (uv); none require Docker except the optional `http` voice server.
Format defaults: carousel 1080×1350, reel 1080×1920@30fps. Filenames `YYYY-MM-DD_slug_NN_role.png`.

## Gotchas
- If a render hangs at startup, a stale dev server holds port 4317 — kill it and retry.
- Run `bunx remotion browser ensure` once before the first reel. The reel's `zod version mismatch` warning is harmless.
