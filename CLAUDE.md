# CLAUDE.md — project guide for Claude Code

AI-in-cybersecurity UGC pipeline. **Positioning:** *real threats, real tools, no fake panic.*

## Skills (installed in this repo)
- **ai-cybersecurity-ugc-carousel** — writes the content (hooks, slide scripts — default 8, configurable 3–20 via `slides=N`, captions, QA). Use when drafting post copy/ideas.
- **react-remotion-instagram-renderer** — maps approved content to the renderer JSON schema and produces assets. Use when turning content into files.
- **humanizer** — rewrites caption/narration/slide copy so it reads human (Jon's voice), not AI. Strips the AI tells, keeps the voice (`.claude/skills/humanizer/references/voice-profile.md`). Run it on the final copy of every post.

**Read first:** architecture in `renderer/docs/PROJECT_ARCHITECTURE.md` + `renderer/docs/PIPELINE_ARCHITECTURE.md`; voice in `pipeline/content/VOICE_AND_TONE_GUIDE.md`; the command/pillar cheat-sheet in `pipeline/content/DRAFT_POST_REFERENCE.md`.

## Commands to make posts
- `/draft-post <idea> | <pillar> [| captions=word|highlight]` — one post, end to end.
- `/draft-week idea1::pillar | idea2::pillar::captions=highlight | …` — batch up to 5 with pillar variety + a posting calendar.
Both research sources, write schema-valid `renderer/content/posts/<date>_<slug>.json`, validate, and render carousel PNGs + a reel into `pipeline/renders/`. Headless: `cd renderer && bun run draft -- "<idea>" <pillar>` / `bun run draft-week -- "idea::pillar" …`.
`/draft-post` also takes first-class pipe options, in any order after the pillar: `slides=3-20` (carousel slide count, default 8 — `cover` first, `cta` last, `takeaway` at N−1, middle from named roles then generic `point` slides), `theme=offensive|defensive|hacking|purple-team|ai` (brand colour: red / blue / green / purple-team purple / generic-AI orange), `voice=none|voxcpm2|voxcpm2-0.5b|http`, `captions=…`. **Research is a loop** (landscape scan → triangulate ≥2 independent sources → tier each claim `[Verified]/[Emerging]/[Scenario]` → hard gates: no fabricated URLs, no uncited victims), then the **humanizer** pass rewrites the copy in-voice without touching facts.
Reel **subtitle style** = `video.caption_mode` ∈ `block | word | highlight` (set via `--captions=` / `captions=`).
Reel **audio** = `video.audio` — `voice_mode` ∈ `none|voxcpm2|voxcpm2-0.5b|bark|http|file` (**default `voxcpm2` = 2B; every post narrates unless `--no-voice` / `voice=none`**), `music_mode` ∈ `none|free|licensed|generated|file` (set via `--voice=`/`--music=`). Files in `renderer/public/audio/<prefix>/`; `bun run voice -- <key>` generates narration: **voxcpm2** (local model, uses `renderer/.venv` via uv) or **http** (OpenAI-compatible `/v1/audio/speech`, e.g. Kokoro-FastAPI; `TTS_BASE_URL` env). Missing file ⇒ reel renders silent/voice-only + warns. **LM Studio has no TTS endpoint and Gemma is an LLM — use voxcpm2 or an http TTS server.** Never use F5-TTS base weights commercially (CC-BY-NC).

## Non-negotiable rules (enforced by pipeline/content/QA_CHECKLIST.md)
- **No fabrication** — no invented CVEs, breach details, stats, quotes, or papers. Back every factual claim with a real source (WebSearch/WebFetch) or tag it `[Scenario]`.
- **No offensive how-to** — no payloads, exploit chains, evasion, or credential-theft steps; keep mechanisms high-level.
- Every post needs a concrete **defender takeaway**.
- **Human voice** — copy reads like Jon, not a model: run the `humanizer` skill + the de-AI scan in `VOICE_AND_TONE_GUIDE.md` (kill em-dash overuse / listicle cadence / "delve/leverage" / voice-flat symmetry; keep his specifics and cadence). Voice changes *how* it reads, never *what* it claims.
- **Media rights**: only commercial-licensed models/assets ship (VoxCPM2 ✅ Apache-2.0; F5-TTS base weights ❌ CC-BY-NC). Log in `LICENSES.md`.
- Manual upload + human approval before posting. No auto-publishing.

## Layout
- `pipeline/content/` — workflow, IDEA_BACKLOG, POST_TEMPLATE, CAPTION_BANK, VISUAL_PROMPT_BANK, QA_CHECKLIST, WEEK_1_POSTS, **VOICE_AND_TONE_GUIDE**, **DRAFT_POST_REFERENCE**.
- `pipeline/media/` — tool stack, voiceover/b-roll/music guides, OPEN_SOURCE_EVALUATION_MATRIX.
- `renderer/` — React+Playwright carousels + Remotion reels. Docs in `renderer/docs/`; start with `RUN_IT_YOURSELF.md`, then **`PROJECT_ARCHITECTURE.md`** + **`PIPELINE_ARCHITECTURE.md`** for the design.
- `.claude/skills/` — `ai-cybersecurity-ugc-carousel`, `react-remotion-instagram-renderer`, `humanizer`.
- `pipeline/renders/` — upload-ready output packages (PNGs, reel.mp4, caption/alt/sources/LICENSES, `voice.meta.json` = reusable voice seed).

## Renderer commands (run inside `renderer/`)
**One command (full render):** `bun run pipeline -- <key> [<key> …]` — backgrounds → carousel → package → free GPU → voice → synced captions → **reel with audio auto-embedded**. Auto-skips stages not needed (art if slides already have backgrounds; voice if `voice_mode=none`). Flags: `--flux1` (legacy FLUX.1-schnell; **FLUX.2 klein is the default** art engine), `--voice=voxcpm2|voxcpm2-0.5b|bark|http|none` (override voice for the run; `--vox2`/`--vox0.5` are aliases; **voxcpm2 = 2B is the default**), `--custom-voice path.wav` (clone YOUR authorized voice — zero-shot, see narration line), `--art|--no-art`, `--no-voice`, `--no-reel`, `--seed=N` (locks the speaker; logged to `voice.meta.json`), `--dry-run`. Runs **one model at a time** on 8 GB (calls `free-comfyui` before voice). Accepts multiple keys (batch).
Individual steps: `bun run new -- <date> <slug> <pillar> [--slides=N]` (slide count, 3–20, default 8) · `bun run draft -- "<idea>" <pillar> [--slides=N]` · `bun run validate|export|package|reel -- <key>` · `bun run dev`. **Slide count is set at creation** (`new`/`draft`); `pipeline` renders whatever slides exist in the JSON.
**Slide imagery**: `bun run art -- <key>` drives a **running ComfyUI** (FLUX.2 klein 4B GGUF **by default** — auto-includes the cover; `--flux1` = legacy FLUX.1-schnell Q4 GGUF; add `--compare` for a non-destructive A/B into `_flux2/`; `--only=N` one slide). Without ComfyUI, inner slides are procedural CSS. Legacy in-process diffusers path: `bun run art:diffusers`. `bun run free-comfyui` unloads ComfyUI's models for the image→audio GPU handoff.
Reel **narration**: `bun run voice -- <key>` — `voxcpm2` (2B, default) / `voxcpm2-0.5b` / **`bark`** (Suno, MIT; `uv pip install bark soundfile`; small models forced + weights cached on `E:\ai-ugc` for the 8 GB card) / `http` server. `bun run align -- <key>` = Whisper word-sync. Voice is **reproducible** via `VOXCPM_SEED` (or `--seed=N`) — same seed = same speaker. **Clone your own voice** (VoxCPM2 zero-shot): `--custom-voice path/to/jon.wav` (a clean ~20–40 s, single-speaker, mono-48 kHz clip; timbre comes from the clip so a seed is optional; clone only your OWN authorized voice and label AI audio). All ML steps use `renderer/.venv` (uv; deps in `renderer/pyproject.toml`); none require Docker except the optional `http` voice server.
Format defaults: carousel 1080×1350, reel 1080×1920@30fps. Filenames `YYYY-MM-DD_slug_NN_role.png`.

## Gotchas
- If a render hangs at startup, a stale dev server holds port 4317 — kill it and retry.
- Run `bunx remotion browser ensure` once before the first reel. The reel's `zod version mismatch` warning is harmless.
