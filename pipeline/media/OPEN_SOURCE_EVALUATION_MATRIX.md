# OPEN_SOURCE_EVALUATION_MATRIX.md — Practical Tool Comparison

Verified against current repos/docs (checked 2026). Use this to decide what graduates from **R&D → Production**. Feeds [MEDIA_TOOL_STACK.md](MEDIA_TOOL_STACK.md).

> **Licenses change. Re-verify before committing any tool to commercial output** ([QA_CHECKLIST.md](../content/QA_CHECKLIST.md) Gate 7).
> Verdicts: **Production-ready** · **R&D — evaluate** · **Defer — not self-contained**.

---

## 1. Summary matrix

| Tool | Category | License (code / weights) | Commercial? | Runs fully local? | External paid API? | Hardware | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **VoxCPM2** (OpenBMB) | TTS | Apache-2.0 / Apache-2.0 | ✅ Yes | ✅ Yes | None | ~8GB VRAM GPU | **Production-ready** ⭐ |
| **OpenVoice V2** (+MeloTTS) | Voice convert + TTS | MIT / MIT | ✅ Yes | ✅ Yes | None | ~4–6GB VRAM GPU | **Production-ready** (w/ consent) |
| **Piper** | TTS (CPU) | MIT(archived)→GPL-3.0 / **per-voice** | ⚠️ Conditional | ✅ Yes | None | CPU only | **R&D — evaluate** |
| **F5-TTS** | TTS / cloning | MIT / **CC-BY-NC-4.0** | ❌ No (base weights) | ✅ Yes | None | ~3GB VRAM GPU | **R&D — evaluate** |
| **Wan2.1** | Video gen | Apache-2.0 | ✅ Yes | ✅ Yes (GPU) | None* | 8GB(1.3B)/24GB+(14B) | **Production-ready** (model) |
| **LTX-Video / LTX-2** | Video gen | Apache-2.0 / **community (ARR-gated)** | ⚠️ <$10M ARR free | ✅ Yes (GPU) | None | 12–32GB+ VRAM | **R&D — evaluate** |
| **OpenShorts** | UGC orchestration | MIT (+AGPL YOLO dep) | ⚠️ Conditional | ❌ Partial | **Yes** (Gemini, fal.ai, ElevenLabs, Upload-Post) | CPU ok; GPU optional | **R&D — evaluate** |
| **Open-AI-UGC** | UGC studio UI | **No LICENSE file** (README says MIT) | ⚠️ Unclear | ❌ No | **Yes** (MUAPI required) | CPU (UI only) | **Defer** |

\* Wan2.1 has only an *optional* Dashscope prompt-extension API; not required.

---

## 2. Voiceover detail

### VoxCPM2 — ⭐ recommended OSS voice
- **License:** Apache-2.0 for **both code and weights** — "free for commercial use" per repo. Cleanest license of the TTS set.
- **Local:** fully local after one-time weights download; ~8GB VRAM (2B), ~5–6GB (0.5B/1.5B). Faster than real time on RTX 4090 (RTF ~0.30, ~0.13 w/ Nano-vLLM). CPU works but slow.
- **Maturity:** ~24.2k stars; VoxCPM2 (2B, 30 langs, 48kHz) released Apr 2026; `pip install voxcpm`; ComfyUI node exists.
- **Caveat:** TOS adds ethical conditions — **no impersonation/fraud/disinformation** and a **required AI-audio disclosure label**. Open issue (#238) on training-data provenance is unanswered. → Use a synthetic or consented voice; label AI audio.
- **Verdict:** **Production-ready** for self-hosted narration. This is the target ElevenLabs replacement.

### OpenVoice V2 (+ MeloTTS)
- **License:** MIT (code + weights) for V1/V2 — commercial OK. MeloTTS (base speech) also MIT — verify separately.
- **Local:** fully local, ~4–6GB VRAM. It's a **tone-color converter**, not standalone TTS — pipeline = MeloTTS generates speech → OpenVoice applies timbre.
- **Maturity:** ~36.6k stars but stable/frozen (V2 Apr 2024, little change since).
- **Caveat:** two model deps + setup; limited prosody control; cloning carries **consent/likeness risk** → consent required.
- **Verdict:** **Production-ready** for a branded synthetic voice, with consent.

### Piper
- **License:** original `rhasspy/piper` MIT but **archived (read-only) since Oct 2025**; active successor `OHF-Voice/piper1-gpl` is **GPL-3.0** and "seeking maintainers"; MIT fork `ayutaz/piper-plus` exists. **Voice weights are per-voice** (CC0 / CC-BY-4.0 / some research-only like Blizzard/Lessac).
- **Local:** CPU-only, tiny, faster-than-realtime even on Raspberry Pi.
- **Caveat:** "MIT + production-ready" reputation no longer matches the live (GPL) repo; **commercial rights hinge on each voice's MODEL_CARD**. GPL espeak-ng phonemizer raises derivative questions.
- **Verdict:** **R&D — evaluate.** Great for **draft/scratch narration**; pin a fork + a commercial-safe voice (CC0/CC-BY) before shipping.

### F5-TTS
- **License:** **code MIT, base weights CC-BY-NC-4.0 (non-commercial).**
- **Local:** fully local, ~3GB VRAM, faster-than-realtime on GPU.
- **Maturity:** ~14.6k stars, maintained (v1.1.20, Apr 2026), paper-backed.
- **Caveat:** the headline use ("clone a narrator voice") with the **official weights is not commercially licensed** — you'd need a separate agreement or to train your own model on commercial-safe data (heavy). The addendum's "use your own authorized voice" idea still hits the *base-model* license wall.
- **Verdict:** **R&D — evaluate only.** Do not use base weights for published business content.

---

## 3. Video b-roll detail

### Wan2.1
- **License:** Apache-2.0 — commercial OK.
- **Local:** T2V-1.3B on a single consumer GPU (~8.19GB VRAM; ~5s 480p in ~4 min on RTX 4090). 14B = 24GB+/multi-GPU. No TTS/pipeline — wire into ComfyUI/Diffusers yourself.
- **Maturity:** ~16k+ stars; released Feb 2025; now maintenance (superseded by Wan2.2+).
- **Verdict:** **Production-ready** as a model for abstract cyber b-roll, given GPU. Best low-VRAM open option.

### LTX-Video / LTX-2
- **License:** code Apache-2.0; **LTX-2 weights = "Community License," free for commercial use only if org < $10M ARR** (else paid Lightricks license); RAIL-style restrictions (no non-consensual deepfakes, disclose AI, no competing-model training). Older v0.9.x preview weights were research-only.
- **Local:** fully local on NVIDIA GPU. LTX-2 full bf16 ~32GB; 12–16GB via FP8/GGUF; ~6–8GB possible at low res. Distilled LTX-Video far lighter. Native synced audio in LTX-2.
- **Maturity:** LTX-Video ~10.4k stars (active); LTX-2 open-sourced Jan 2026; strong ComfyUI/GGUF ecosystem.
- **Verdict:** **R&D — evaluate**; **Production-ready for <$10M-ARR orgs** once you confirm the ARR gate and accept the disclosure/no-deepfake terms.

---

## 4. UGC orchestration detail

### OpenShorts (`mutonby/openshorts`)
- **License:** MIT app code; bundled **YOLOv8/Ultralytics is AGPL-3.0** (copyleft risk if you host/redistribute commercially); faster-whisper/Whisper MIT.
- **Local:** partial. Local stages = FFmpeg reframing, MediaPipe/YOLO tracking, faster-whisper subtitles. **AI stages call paid clouds.**
- **External paid APIs (required for AI features):** **Google Gemini** (all AI features), **fal.ai** (UGC actor/video/lip-sync, ~$0.50–1.50/short), **ElevenLabs** (voiceover), **Upload-Post** (posting; 10 free/mo). Keys via dashboard, not `.env`. **Uses fal.ai, not MUAPI.**
- **Maturity:** ~1.5–2.3k stars, ~384 forks, active, Docker, docs site.
- **Verdict:** **R&D — evaluate** as a **self-hosted orchestration layer** you could fork to swap in VoxCPM/local Whisper/local b-roll. Budget the paid APIs; resolve AGPL-YOLO before any commercial hosting. **Not** free generation.

### Open-AI-UGC (`Anil-matcha/Open-AI-UGC`) — ⛔ Defer (per your instruction)
Status: **"Evaluate, do not depend on yet."** Findings from current inspection:
- **License:** README claims MIT but **no LICENSE file exists** (raw LICENSE = 404; GitHub reports no SPDX). → legally **unlicensed/all-rights-reserved** until fixed.
- **Backend routes:** `/api/generate`, `/api/upload`, `/api/creations` **do exist** — but `/api/generate` is a **thin proxy to `api.muapi.ai`** and returns HTTP 500 without `UGC_API_KEY`. (Note: the original addendum saw a clone *missing* these routes; the live repo now has them. Either way, they only forward to MUAPI.)
- **External services:** **MUAPI mandatory** (paid, metered — Veo 3.1 / Seedance / Grok Video / Happy Horse); also wants **Postgres + Google OAuth + Stripe** to run as shipped.
- **Local inference:** **none.** Zero local model run; no local TTS. It's a SaaS storefront/UI skeleton.
- **Maturity:** ~94 stars, ~15 forks; Next.js 16 / React 19 / Prisma 7; recently active.
- **Verdict:** **Defer.** Useful only as **UI/UX reference** for a future self-hosted studio. Cannot generate a single video without paid MUAPI; commercial rights also depend on MUAPI + each model vendor's terms; and the missing LICENSE is a real risk.
- **If you still want to test it (one focused session, then stop):** clone → confirm LICENSE status → confirm `/api/*` routes → install deps → run locally with a throwaway MUAPI key → assess whether MUAPI could be swapped for your own chain. If it takes more than one session, drop it and keep the CapCut track moving.

---

## 5. Decision shortcuts

| If you want… | Use |
| --- | --- |
| A free, local, commercial-safe **voice** today | **VoxCPM2** (label AI audio) |
| A **branded synthetic voice** | OpenVoice V2 + MeloTTS (consent) |
| **Draft** narration, zero GPU | Piper (commercial-safe voice) |
| Local **cyber b-roll**, modest GPU | Wan2.1 (1.3B) |
| Higher-end local video, bigger GPU, small org | LTX-2 (confirm <$10M ARR) |
| A **self-hosted UGC dashboard** to fork | OpenShorts (budget paid APIs) |
| To **avoid all generation cost** | None of the UGC studios — they all broker paid APIs; use stock + local models |

## 6. Re-verification cadence
Re-check licenses/run-paths **quarterly** and before onboarding any tool to Production — especially F5-TTS weights, LTX-2 ARR gate, Piper per-voice cards, and the Open-AI-UGC LICENSE file.
