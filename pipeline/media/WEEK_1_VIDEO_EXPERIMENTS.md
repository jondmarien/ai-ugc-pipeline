# WEEK_1_VIDEO_EXPERIMENTS.md — First Reel Experiments (Tool-Stack A/B)

Five short experiments that **produce real posts** while also testing different tool combinations from [MEDIA_TOOL_STACK.md](MEDIA_TOOL_STACK.md). Each reuses a Week-1 carousel topic ([WEEK_1_POSTS.md](../content/WEEK_1_POSTS.md)) so nothing is wasted. Goal: by end of week you know **which stack is fastest and good enough** for Production — and you've shipped content.

**Shared spec:** 1080×1920, 30 fps, 20–35s, hook in first 2s, burned-in proofread subtitles, ~−14 LUFS. Every video clears [QA_CHECKLIST.md](../content/QA_CHECKLIST.md) incl. **Gate 7**.

> Principle: change **one variable at a time** so you can attribute quality/effort to a tool. Don't swap voice *and* b-roll *and* editor in the same test.

---

## EXP-1 — Baseline (all-manual, ship-today)
**Topic:** Post 1 — AI phishing made old training obsolete. **Pillar accent:** cyan.

| Layer | Tool |
| --- | --- |
| Script | Claude (trim caption to ~80-word VO) |
| Voice | **CapCut built-in voice** (commercial-cleared) or ElevenLabs free |
| B-roll | **Pexels/Pixabay** SOC + phishing inbox loops + animate `cover_bg_01` |
| Music/SFX | Pixabay bed + one riser on hook |
| Assembly | **CapCut**, auto-captions (proofread) |

**Purpose:** establish the speed/quality **baseline** and confirm the manual pipeline end-to-end (incl. manual upload). **Measure:** total minutes to publish, edit pain, save/again-watch feel.

---

## EXP-2 — Open-source voice swap (VoxCPM2)
**Topic:** Post 2 — prompt injection hides where your agent reads. **Accent:** electric blue.

| Layer | Tool (Δ vs EXP-1) |
| --- | --- |
| Voice | **VoxCPM2** (Apache-2.0, local) ← the only change |
| B-roll | Pexels agent-terminal + injection scanner loops + animate `cover_bg_02` |
| Everything else | same as EXP-1 (CapCut, Pixabay music) |

**Purpose:** does the **free, commercial-safe** local voice match the SaaS baseline on naturalness + **acronym pronunciation** (OWASP, API, LLM)? Use the [VOICEOVER_BAKEOFF.md](VOICEOVER_BAKEOFF.md) rubric on the rendered VO.
**Gate 7 note:** apply VoxCPM2's **AI-audio disclosure**. **Measure:** VoxCPM total vs CapCut voice; retakes needed.

---

## EXP-3 — Draft-fast voice (Piper) for a list/utility cut
**Topic:** Post 5 — Shadow AI (governance). **Accent:** amber.

| Layer | Tool (Δ) |
| --- | --- |
| Voice | **Piper** (CPU, instant) — pick a **CC0/CC-BY voice** ← change |
| B-roll | Pixabay app-inventory / perimeter loops + governance dashboard |
| Everything else | CapCut + Pixabay music |

**Purpose:** is Piper good enough for **fast/utility narration** (or only internal drafts)? Tests the "draft track" hypothesis. **Watch:** per-voice license must be commercial-safe before publishing; otherwise keep this as a draft-only test and re-voice with VoxCPM2.

---

## EXP-4 — Generated b-roll (Wan2.1 / LTX) — *only if GPU available*
**Topic:** Post 3 — stop pasting logs into chatbots. **Accent:** neon green.

| Layer | Tool (Δ) |
| --- | --- |
| B-roll | **Wan2.1 (1.3B)** or **LTX-Video** via ComfyUI — 3–4 abstract clips (clipboard-leak, data-boundary, log-stream) ← change |
| Voice | EXP-2 winner (likely VoxCPM2) |
| Everything else | CapCut + Pixabay music |

**Purpose:** can locally-generated b-roll become a **branded look** vs stock? **Gates:** Wan2.1 Apache-2.0 ✅; if using **LTX-2 confirm <$10M ARR** + disclosure terms. **Measure:** GPU time per clip, artifact rate, "cyber credibility," whether it beats stock enough to justify the time.
**Fallback:** no GPU → skip; use stock (EXP-1 style). Don't block the week on this.

---

## EXP-5 — Repeatability test (FFmpeg/Whisper template) *(optional, R&D)*
**Topic:** Post 4 — deepfake CFO / helpdesk. **Accent:** cyan/amber.

| Layer | Tool (Δ) |
| --- | --- |
| Assembly | **FFmpeg + faster-whisper** folder pipeline ([VIDEO_ASSEMBLY_WORKFLOW.md](VIDEO_ASSEMBLY_WORKFLOW.md) Track B) ← change |
| Voice | VoxCPM2 |
| B-roll | stock deepfake-call + verification-workflow loops |

**Purpose:** is a scripted assembly **faster/more repeatable** than CapCut once inputs exist? **Sensitivity:** this topic cites the **verified Arup case** — keep claims exactly as sourced; no invented details; no real faces. **Measure:** time-to-render given ready inputs vs manual; subtitle-proofing burden.

---

## Scoreboard (fill in after the week)

| Exp | Stack tested | Time to publish | Quality (1–5) | Edit effort (1–5) | License-clear? | Keep? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Manual baseline | | | | | |
| 2 | VoxCPM2 voice | | | | | |
| 3 | Piper voice | | | | | |
| 4 | Wan2.1/LTX b-roll | | | | | |
| 5 | FFmpeg/Whisper assembly | | | | | |

**Decision rule:** promote a tool to Production only if it's **license-clear** AND (matches baseline quality at lower cost OR clearly faster). Record outcomes in [OPEN_SOURCE_EVALUATION_MATRIX.md](OPEN_SOURCE_EVALUATION_MATRIX.md).

## Likely outcome to validate (from current tool verification)
- EXP-2 (VoxCPM2) becomes the **default voice** (free, local, commercial-safe).
- EXP-3 (Piper) stays a **draft/utility** option pending per-voice license.
- EXP-4 (Wan2.1) graduates only with GPU and clear time savings; otherwise **stock wins** for now.
- EXP-5 (FFmpeg) graduates only when **volume** makes manual editing the bottleneck.

## Guardrails (all experiments)
- Commercial-license verified per asset/model (Gate 7). **F5-TTS base weights excluded** from published videos.
- Synthetic or consented voice only; AI-audio disclosure where required; **no misleading deepfakes** of real people.
- Content stays dramatic-but-defensible: no exploit steps, no fabricated claims.
