# Roadmap — local Gemma 4 + a cloned "Jon" voice

A living planning doc. **Nothing here is built yet** — it's the plan for two future initiatives that make the pipeline more local, cheaper, and more *you*. Status tags: 🔲 not started · 🟡 in progress · ✅ done.

Hard constraints that shape everything below: **8 GB VRAM** (RTX 3070 Ti), **one big model resident at a time** (free ComfyUI before any other GPU model), **commercial-license-only** assets, and **manual approval before posting**. Sources for the model facts: Google's Gemma 4 launch blog + developer guide, `ai.google.dev` model card, the Hugging Face `gemma4` blog, and Unsloth's run/fine-tune docs (verified 2026-06-03).

---

## Initiative 1 — Local Gemma 4 (via Unsloth), trained on my writing

**Goal:** a local, offline, Apache-2.0 model for (a) drafting + humanizing copy in *my* voice, and (b) a vision-QA gate that catches garbled text/logos in generated backgrounds and drafts alt-text. **Not** image or voice generation — Gemma is multimodal *in*, **text out**, so FLUX.2 and VoxCPM stay exactly where they are.

### The 8 GB fit (the real limiter)
| Variant | 4-bit footprint | On our 8 GB card | Modalities |
|---|---|---|---|
| **Gemma 4 E4B** | ~5.5–6 GB | ✅ comfortable (room for context) | text + image + audio |
| **Gemma 4 12B Unified** | ~7–8 GB | ⚠️ tight — partial offload likely; vision `mmproj` pushes it over | text + image + audio |
- **Plan: start on E4B**, treat 12B (IQ4/UD-Q4_K_XL) as an experimental stretch. Both do the vision jobs.
- Runs in its own GPU window: `free-comfyui` first (same handoff as voice).
- ⚠️ Unsloth warns: **don't run Gemma 4 GGUF on the CUDA 13.2 runtime** (degraded output).

### Phases
- **P1 — Stand it up** 🔲 — Unsloth GGUF (`unsloth/gemma-4-E4B-it-GGUF`) served via an **OpenAI-compatible** endpoint: Ollama (`ollama run hf.co/unsloth/gemma-4-E4B-it-GGUF:…`), LM Studio server, llama.cpp `llama-server`, or Unsloth Studio. Smoke-test chat + vision (`--mmproj`).
- **P2 — Vision-QA gate + auto alt-text** 🔲 — *highest value, lowest risk, read-only.* Send each FLUX background to Gemma: "any garbled text, fake letters, or logos here?" → flag before export (kills the failure mode we kept hitting manually). Same call drafts per-slide `alt_text`. Mirrors the existing `http` voice-mode integration pattern.
- **P3 — Local drafter/humanizer (`--llm=local`)** 🔲 — optional offline mode: the draft/humanize steps hit the local endpoint instead of the `claude` CLI. Accept the quality trade-off (a local E4B/12B < Claude on sourced, no-fabrication copy) for a free/offline path.
- **P4 — Fine-tune a "chrono-voice" Gemma** 🔲 — the ambitious Unsloth payoff (see below).

### Training it on my writing (P4 detail)
- **Data:** my ISSessions writeups + portfolio prose + approved Week-1 captions + `.claude/skills/humanizer/references/voice-profile.md`. Curate a small **instruction dataset** of `prompt → in-my-voice output` pairs (start ~50–200 examples; quality over volume).
- **Method:** **Unsloth LoRA** (their headline: ~2× faster, ~70% less VRAM). LoRA on **E4B** is plausible to *train* on 8 GB; **12B training likely needs a cloud/Colab GPU** for the train step, then export GGUF and **run locally**. (Unsloth ships a free Colab for exactly this.)
- **Output:** export to GGUF → serve locally via the P1 endpoint → drop-in for the P3 drafter/humanizer.
- **Eval gate:** must pass the `humanizer` de-AI scan + the voice-signal check, and A/B favorably vs the current Claude output before it becomes default.

### Open questions / risks
- 8 GB *training* feasibility for 12B (lean E4B, or train in cloud / run local).
- Quality vs Claude for the sourced, fact-tagged content — likely a "draft assist / offline mode," not a full replacement.
- Vision memory (`mmproj`) on 8 GB; may need E4B for vision tasks specifically.

---

## Initiative 2 — Clone *my* voice for the reels (VoxCPM2)

**Goal:** lock a single, consistent **"Jon" narration voice** for every reel — no more random-seed speakers.

### Mechanism (important nuance)
VoxCPM2 does this via **zero-shot voice cloning from an authorized reference recording**, not heavy fine-tuning. The plumbing is *already half-there*: `voice-voxcpm.py` accepts `--voice-ref <wav>` (its comment even says "AUTHORIZED reference WAV for voice cloning"), and seeds are reproducible via `--seed=N` / `voice.meta.json`. So locking my voice = supply a clean reference + a fixed seed.

### Phases
- **P1 — Record a clean reference** 🔲 — a quiet-room, single-take read (~30–60 s+), good mic, mono, ideally 48 kHz to match VoxCPM2. Store under `renderer/public/audio/_voiceref/jon.wav` (gitignored or LFS — decide at build time).
- **P2 — Wire a "jon" voice** 🔲 — a default `--voice-ref` + locked seed exposed as a named voice (e.g. `voice=voxcpm2 --voice-ref=jon --seed=<locked>`); render one post, A/B against the current random speaker.
- **P3 — Make it the default narration** 🔲 — once it sounds right, set it as the standing reel voice; log the exact ref + seed in `voice.meta.json` so it's reproducible forever.

### Ethics / license (non-negotiable)
- Clone **only my own authorized voice** — never a real third party (VoxCPM terms; matches our media-rights rule).
- **Label AI-generated audio** per VoxCPM's terms.
- VoxCPM2 is Apache-2.0 → commercial-OK. ✅

### Quality tips
- Clean, consistent-tone reference; enough duration; no background noise/music.
- Iterate `--seed` + `VOXCPM_TIMESTEPS` until the timbre + cadence feel like me; then freeze.

---

## Suggested sequencing
1. **Voice clone (Initiative 2)** — quickest win; the `--voice-ref` path already exists, so it's mostly "record + lock a seed."
2. **Gemma vision-QA + alt-text (1·P2)** — high value, read-only, no quality risk.
3. **Local drafter (1·P3)** — offline mode.
4. **Fine-tuned chrono-voice Gemma (1·P4)** — the big one; do it once the dataset is curated.

## Explicitly out of scope
- Gemma will **not** replace FLUX.2 (images) or VoxCPM2 (TTS) — different modalities.
- No auto-publish; a human still approves every post.
