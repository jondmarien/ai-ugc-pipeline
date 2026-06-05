---
description: Idea → researched, sourced, schema-valid post JSON → rendered carousel + reel
argument-hint: <idea> | <pillar> [| slides=3-20] [| captions=…] [| theme=offensive|defensive|hacking|purple-team|ai] [| voice=voxcpm2|voxcpm2-0.5b|http|none]   e.g. logs into chatbots | data_leakage | slides=10 | captions=highlight | theme=hacking | voice=voxcpm2
allowed-tools: Skill, WebSearch, WebFetch, Read, Write, Edit, Glob, Grep, Bash
---

You are producing one complete AI-in-cybersecurity post for this repo, end to end, using the project's two skills. Treat this as the **Assemble** stage of `pipeline/content/CONTENT_PIPELINE.md`.

## Input
> 📓 Reference for the human: `pipeline/content/DRAFT_POST_REFERENCE.md` lists all pillars (with default themes), idea-writing tips, and every flag.

`$ARGUMENTS` is `<idea> | <pillar> [| key=value …]`. Split on the `|`. The first segment is the idea, the second is the pillar; any remaining `key=value` segments are options below, in **any order**.
- idea = the topic/angle (free text).
- pillar ∈ `offensive_ai | model_security | data_leakage | defensive_ai | governance | myth_busting`. If missing or invalid, pick the best-fit pillar and say which you chose.
- `captions=` (optional) ∈ `block | word | highlight` — reel subtitle animation (default `block`) → `--captions=` + `video.caption_mode`.
- `theme=` (optional) ∈ `offensive | defensive | hacking | purple-team | ai` — brand colour (red / blue / green / **purple-team purple** / **generic-AI orange**). `purple-team` and `ai` are cross-cutting (no pillar defaults to them — pick explicitly). If omitted, choose from the pillar (see step 3) → `--theme=`.
- `voice=` (optional) ∈ `none | voxcpm2 | voxcpm2-0.5b | http | file` — reel narration model. **Default is `voxcpm2` (the 2B model) — every post narrates unless the user passes `voice=none`** (or `--no-voice` at render). `voxcpm2-0.5b` = smaller/faster. → `--voice=` + `video.audio.voice_mode`.
- `slides=` (optional) ∈ integer `3`–`20` (default `8`) — number of carousel slides. → `--slides=` on `bun run new`. The arc keeps `cover` first and `cta` last; the middle is filled from the named roles (context, risk, mechanism, failure_point, defense) then generic `point` body slides for longer posts.
- `music=` (optional) ∈ `none | free | licensed | generated | file` — music bed (default `none`) → `--music=`.
- **Honour every key=value the user passes** — pass it through to `bun run new` and set the matching JSON field. Don't silently drop one.

## Hard rules (non-negotiable — from pipeline/content/QA_CHECKLIST.md)
- **No fabrication.** No invented CVEs, breach details, numbers, quotes, or paper titles. Every factual claim must be backed by a real source you found via WebSearch/WebFetch, or be explicitly framed as a **[Scenario]**.
- **No offensive how-to.** No payloads, exploit chains, evasion, or credential-theft steps. Keep mechanisms high-level.
- Every post must carry a concrete **defender takeaway**.
- If you can't verify a claim, soften it ("could", "reported", "the risk is") and tag it `scenario`.

## Steps
1. **Invoke the content skill** `ai-cybersecurity-ugc-carousel` to design the post: a defensible cover hook, the slide arc (default 8: cover, context, risk, mechanism, failure_point, defense, takeaway, cta; with `slides=N`, keep `cover` first + `cta` last + `takeaway` at slide N−1, and fill the N−2 middle slides from the named roles then generic `point` body slides), caption, a bracketed topic list (NOT hashtags — plain topics, stored in the `hashtags` field, rendered as `[topic1, topic2, …]`), and a specific comment question — in the house voice (sharp, practical, no fake panic — see `pipeline/content/VOICE_AND_TONE_GUIDE.md`).
2. **Research sources (deeper — a loop, not one search).**
   1. **Landscape scan** — a broad WebSearch first to map the claim space *and the strongest counter-arguments* before committing to an angle.
   2. **Gather primaries** — WebFetch the best sources; prefer OWASP, NCSC/NIST/CISA, CVE/NVD, vendor security blogs, named journalism, court filings.
   3. **Triangulate** — for any load-bearing factual claim, find **≥2 independent reputable sources**. Single-source or weak corroboration → tag it down.
   4. **Confidence-tier** each claim → `[Verified]` (≥2 independent agree) · `[Emerging]` (one reputable source, or weak corroboration) · `[Scenario]` (illustrative, no confirming source — must be labelled in-copy). Record each as `{source, link, supports, confidence, claim_tag}`.
   - **Hard gates:** no fabricated URLs; re-open every link the same day and confirm it still says what you claim; disclose (don't silently drop) any angle that came up empty; never name a real victim without a cited public source. For a big or uncertain topic, you may invoke the **`deep-research`** skill as a booster.
3. **Invoke the renderer skill** `react-remotion-instagram-renderer` to map the content to the JSON schema. Write a **specific, distinct, theme-agnostic `visual_prompt` for every slide** — a concrete dark cinematic scene tied to THIS slide's point and THIS post's topic, so no two slides (and no two posts) share a composition. **No colour words** (the post `theme` supplies colour); avoid UI/dashboard/panel/label nouns (they cause garbled text); no rendered text/logos/exploit detail. This is exactly what `bun run art` renders. Also choose the post **`theme`** — `offensive` (red), `defensive` (blue), `hacking` (green), `purple-team` (purple — combined offence+defence), or `ai` (generic AI / model-centric, orange). Get today's date with `Bash: date +%F`. Choose a short kebab-case `slug` from the idea.
4. **Scaffold then fill:** run `cd renderer && bun run new -- <date> <slug> <pillar> [--slides=N] --theme=<theme> --captions=<captions> --voice=<voice> --music=<music>` (pass through every option the user gave — including `slides=N` when set; omit a flag to take its default) to create a valid skeleton at `renderer/content/posts/<date>_<slug>.json`, then **Edit that file** to replace every `TODO` with the real content + sources from steps 1–2. Keep the schema rules: N slides (slide 1 = cover, last = cta; N defaults to 8), `alt_text` length = N (one per slide), `score.total` = sum of the five axes, ≥1 real source, reel `beats` captions filled. Confirm `video.audio.voice_mode` matches the requested `voice=`. Then **humanize the copy** — run the **`humanizer`** skill (with `.claude/skills/humanizer/references/voice-profile.md`) over the `caption`, `video.narration[]`, and each slide's `on_slide_copy` so it reads in the house voice (`pipeline/content/VOICE_AND_TONE_GUIDE.md`): strip AI tells, keep Jon's cadence. **Never alter a sourced fact, claim_tag, or source to sound smoother** — humanizing is style, not substance. Set `status` to `approved` only if you're confident; otherwise leave `draft`.
5. **Validate:** `cd renderer && npm run validate -- <date>_<slug>`. Fix any reported field and re-validate until clean.
6. **Render fully (one command):** `cd renderer && bun run pipeline -- <date>_<slug>` — backgrounds (ComfyUI, **FLUX.2 klein is the default engine** and the cover is generated automatically; add `--flux1` only for the legacy FLUX.1-schnell graph) → carousel → package → free GPU → voice (VoxCPM2) → synced captions (Whisper) → **reel with audio auto-embedded**. Start ComfyUI first for AI backgrounds (else inner slides fall back to procedural, non-fatal). Stages auto-skip when not needed (art skipped if slides already have backgrounds; voice skipped if `voice_mode=none`). Flags: `--no-art`, `--no-voice`, `--no-reel`, `--seed=N` (voice; same N = same speaker, and the seed is logged to the render folder's `voice.meta.json`).
   - On 8 GB the pipeline runs **one model at a time** (it calls `free-comfyui` before voice).
   - If a render hangs on startup, a stale dev server holds port 4317 — kill it (`netstat -ano | grep :4317` → `taskkill //PID <pid> //F`) and retry.
   - If the reel errors on browser setup, run `cd renderer && bunx remotion browser ensure` once, then retry.
7. **Report:** print the output folder `pipeline/renders/<date>_<slug>/`, the list of files, which claims are `reported_fact` vs `scenario`, and the QA items that still need a human eye (cover legibility, source re-check, cyber-safety). Remind: a human approves before posting. If `video.audio.voice_mode` was set, the reel already has narration; the voice is reproducible via `VOXCPM_SEED` (see renderer/docs/REMOTION_REEL_WORKFLOW.md to cast a different voice or add licensed music).

## Backgrounds
Inner slides render procedurally (no art needed). For AI backgrounds, run `cd renderer && bun run art -- <date>_<slug>` (ComfyUI, FLUX.1 Q4 GGUF; add `--flux2` for FLUX.2 klein into a `_flux2/` compare folder). For a custom cover, drop a 1080×1350 text-free PNG at `renderer/public/backgrounds/<date>_<slug>_cover.png` and set slide 1 `asset_status` to `existing`.

## GPU handoff (8 GB — one big model at a time)
ComfyUI is a persistent server that keeps the diffusion model resident; VoxCPM (voice) and Whisper (align) load their own ~5 GB models in a separate process. They can't coexist on 8 GB. So run **all image gen first** (`bun run art …`), then **`cd renderer && bun run free-comfyui`** (unloads ComfyUI's models + frees VRAM via its `/free` endpoint) **before** any `bun run voice` / `bun run align`. `free-comfyui` is non-fatal if ComfyUI isn't running.
