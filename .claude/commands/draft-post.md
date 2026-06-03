---
description: Idea → researched, sourced, schema-valid post JSON → rendered carousel + reel
argument-hint: <idea> | <pillar> [| captions=word|highlight|block]   e.g. AI agents leaking RAG data | model_security | captions=highlight
allowed-tools: Skill, WebSearch, WebFetch, Read, Write, Edit, Glob, Grep, Bash
---

You are producing one complete AI-in-cybersecurity post for this repo, end to end, using the project's two skills. Treat this as the **Assemble** stage of `pipeline/content/CONTENT_PIPELINE.md`.

## Input
> 📓 Reference for the human: `pipeline/content/DRAFT_POST_REFERENCE.md` lists all pillars (with default themes), idea-writing tips, and every flag.

`$ARGUMENTS` is `<idea> | <pillar> [| captions=<mode>]`. Split on the `|`.
- idea = the topic/angle (free text).
- pillar ∈ `offensive_ai | model_security | data_leakage | defensive_ai | governance | myth_busting`. If missing or invalid, pick the best-fit pillar and say which you chose.
- captions (optional) ∈ `block | word | highlight` — the reel's subtitle animation (default `block`). Pass it to `npm run new -- … --captions=<mode>` and set `video.caption_mode`.

## Hard rules (non-negotiable — from pipeline/content/QA_CHECKLIST.md)
- **No fabrication.** No invented CVEs, breach details, numbers, quotes, or paper titles. Every factual claim must be backed by a real source you found via WebSearch/WebFetch, or be explicitly framed as a **[Scenario]**.
- **No offensive how-to.** No payloads, exploit chains, evasion, or credential-theft steps. Keep mechanisms high-level.
- Every post must carry a concrete **defender takeaway**.
- If you can't verify a claim, soften it ("could", "reported", "the risk is") and tag it `scenario`.

## Steps
1. **Invoke the content skill** `ai-cybersecurity-ugc-carousel` to design the post: a defensible cover hook, the 8-slide arc (cover, context, risk, mechanism, failure_point, defense, takeaway, cta), caption, hashtags, and a specific comment question — in the house voice (sharp, practical, no fake panic).
2. **Research sources.** Use WebSearch (and WebFetch to confirm) for any factual claim. Prefer primary/reputable sources (OWASP, NCSC/NIST/CISA, vendor security blogs, CVE/NVD, named journalism, court filings). Record each as `{source, link, supports, confidence, claim_tag}`. Re-read the page to confirm the claim matches before using it.
3. **Invoke the renderer skill** `react-remotion-instagram-renderer` to map the content to the JSON schema. Write a **specific, distinct, theme-agnostic `visual_prompt` for every slide** — a concrete dark cinematic scene tied to THIS slide's point and THIS post's topic, so no two slides (and no two posts) share a composition. **No colour words** (the post `theme` supplies colour); avoid UI/dashboard/panel/label nouns (they cause garbled text); no rendered text/logos/exploit detail. This is exactly what `bun run art` renders. Also choose the post **`theme`** — `offensive` (red), `defensive` (blue), or `hacking` (green). Get today's date with `Bash: date +%F`. Choose a short kebab-case `slug` from the idea.
4. **Scaffold then fill:** run `cd renderer && bun run new -- <date> <slug> <pillar> --theme=<offensive|defensive|hacking>` to create a valid skeleton at `renderer/content/posts/<date>_<slug>.json`, then **Edit that file** to replace every `TODO` with the real content + sources from steps 1–2. Keep the schema rules: 8 slides (slide 1 = cover), `alt_text` length = 8, `score.total` = sum of the five axes, ≥1 real source, reel `beats` captions filled. Set `status` to `approved` only if you're confident; otherwise leave `draft`.
5. **Validate:** `cd renderer && npm run validate -- <date>_<slug>`. Fix any reported field and re-validate until clean.
6. **Render fully (one command):** `cd renderer && bun run pipeline -- <date>_<slug>` — backgrounds (ComfyUI) → carousel → package → free GPU → voice (VoxCPM2) → synced captions (Whisper) → **reel with audio auto-embedded**. Start ComfyUI first for AI backgrounds (else inner slides fall back to procedural, non-fatal). Stages auto-skip when not needed (art skipped if slides already have backgrounds; voice skipped if `voice_mode=none`). Flags: `--flux2`, `--no-art`, `--no-voice`, `--no-reel`, `--seed=N` (voice).
   - On 8 GB the pipeline runs **one model at a time** (it calls `free-comfyui` before voice).
   - If a render hangs on startup, a stale dev server holds port 4317 — kill it (`netstat -ano | grep :4317` → `taskkill //PID <pid> //F`) and retry.
   - If the reel errors on browser setup, run `cd renderer && bunx remotion browser ensure` once, then retry.
7. **Report:** print the output folder `pipeline/renders/<date>_<slug>/`, the list of files, which claims are `reported_fact` vs `scenario`, and the QA items that still need a human eye (cover legibility, source re-check, cyber-safety). Remind: a human approves before posting. If `video.audio.voice_mode` was set, the reel already has narration; the voice is reproducible via `VOXCPM_SEED` (see renderer/docs/REMOTION_REEL_WORKFLOW.md to cast a different voice or add licensed music).

## Backgrounds
Inner slides render procedurally (no art needed). For AI backgrounds, run `cd renderer && bun run art -- <date>_<slug>` (ComfyUI, FLUX.1 Q4 GGUF; add `--flux2` for FLUX.2 klein into a `_flux2/` compare folder). For a custom cover, drop a 1080×1350 text-free PNG at `renderer/public/backgrounds/<date>_<slug>_cover.png` and set slide 1 `asset_status` to `existing`.

## GPU handoff (8 GB — one big model at a time)
ComfyUI is a persistent server that keeps the diffusion model resident; VoxCPM (voice) and Whisper (align) load their own ~5 GB models in a separate process. They can't coexist on 8 GB. So run **all image gen first** (`bun run art …`), then **`cd renderer && bun run free-comfyui`** (unloads ComfyUI's models + frees VRAM via its `/free` endpoint) **before** any `bun run voice` / `bun run align`. `free-comfyui` is non-fatal if ComfyUI isn't running.
