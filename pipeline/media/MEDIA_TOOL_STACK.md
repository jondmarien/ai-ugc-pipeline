# MEDIA_TOOL_STACK.md — Modular Media Stack by Production Layer

Attaches to the **Production/Assemble stage** of [CONTENT_PIPELINE.md](../content/CONTENT_PIPELINE.md) for Reel/video variants. Built on a **two-track** model so you can publish now and replace SaaS pieces over time. Every layer is **swappable** — nothing is hard-wired to ElevenLabs, Higgsfield, HeyGen, or any one vendor.

> Tool facts below were verified against current repos/docs (2026). Full evidence + sources: [OPEN_SOURCE_EVALUATION_MATRIX.md](OPEN_SOURCE_EVALUATION_MATRIX.md). **Re-check licenses before commercial use.**

---

## 1. The two tracks

| Track | Goal | Use it for |
| --- | --- | --- |
| **Production** | Ship reliable content now | CapCut/Canva assembly, stock footage, simple/cheap or already-cleared TTS, manual upload |
| **R&D** | Cut cost / reduce SaaS dependence | VoxCPM voice bake-off, Wan2.1 / LTX b-roll tests, OpenShorts architecture review |

**Rule:** R&D never blocks publishing. A tool only graduates from R&D → Production after it passes a real bake-off ([VOICEOVER_BAKEOFF.md](VOICEOVER_BAKEOFF.md)) **and** clears the commercial-license + safety checks in [QA_CHECKLIST.md](../content/QA_CHECKLIST.md) Gate 7.

---

## 2. Stack by layer

Legend — **▶ Start here (Production)** · **🧪 R&D candidate** · **💳 Paid fallback**

### Layer 1 — Script & research
| Option | Role |
| --- | --- |
| ▶ Claude / ChatGPT / Gemini | Hooks, narration, captions — drafts only, never final truth |
| Source validation | Manual; primary/reputable sources per [CONTENT_PIPELINE.md](../content/CONTENT_PIPELINE.md) §6 |

### Layer 2 — Voiceover
| Option | Status | Notes |
| --- | --- | --- |
| ▶ **VoxCPM2** (OpenBMB) | 🧪→▶ best OSS pick | **Apache-2.0 (code + weights), commercial OK.** ~8GB VRAM, fully local. Must apply the AI-audio disclosure its TOS requires; no impersonation. |
| OpenVoice V2 (+MeloTTS) | 🧪→▶ | **MIT, commercial OK**, fully local. Timbre *converter* — needs MeloTTS for base speech + a **consented** voice. |
| Piper | 🧪 | Free, CPU, fast — good for **draft scratch tracks**. Original repo archived; use `OHF-Voice/piper1-gpl` (GPL-3.0) and **check each voice's license**. |
| F5-TTS | 🧪 (blocked for prod) | Code MIT but **base weights CC-BY-NC-4.0 → not for commercial posts** without a separate license. Evaluate only. |
| 💳 ElevenLabs / CapCut built-in voices / browser TTS | fallback | Use when you need a polished read fast; ElevenLabs only as a *fallback*, not the spine. |

**Default now:** CapCut/cleared TTS for speed → migrate to **VoxCPM2** once the bake-off passes.

### Layer 3 — Background / b-roll
| Option | Status | Notes |
| --- | --- | --- |
| ▶ Pexels / Pixabay / Mixkit | Production | Free, commercial-clear stock cyber loops. Fastest path. Log license per clip. |
| ▶ Canva / CapCut motion + your carousel art | Production | Animate existing covers; Ken Burns / overlays. |
| **Wan2.1** | 🧪 | **Apache-2.0, commercial OK.** T2V-1.3B ~8GB VRAM; 14B needs 24GB+. Great for abstract cyber b-roll. Superseded by Wan2.2 — fine to use, check newer. |
| **LTX-Video / LTX-2** | 🧪 | Code Apache-2.0; **LTX-2 weights free commercially only if org < $10M ARR**, else paid license. Local on GPU. Confirm the ARR gate. |
| ComfyUI | 🧪 | The orchestration layer for Wan/LTX workflows. |
| 💳 Runway / Kling / etc. | fallback | When you need consistent cinematic output fast and have budget. |

**Default now:** stock + motion effects → generated b-roll becomes a *brand-style* track later if GPU is available.

### Layer 4 — Music & SFX
| Option | Status | Notes |
| --- | --- | --- |
| ▶ YouTube Audio Library / Pixabay Music / Mixkit / Free Music Archive | Production | Royalty-free beds; safest for commercial social. |
| ▶ Pixabay SFX / Freesound / Mixkit SFX | Production | Risers, glitch hits, transitions. Check per-asset license (Freesound varies). |
| MusicGen / Stable Audio Open | 🧪 | Local generative beds — **verify model + output license** before commercial use. |
| 💳 Beatoven / Mubert / Canva audio | fallback | Fast loops with clearer commercial licensing. |

Details + rules: [MUSIC_SFX_GUIDE.md](MUSIC_SFX_GUIDE.md).

### Layer 5 — Subtitles & assembly
| Option | Status | Notes |
| --- | --- | --- |
| ▶ CapCut / Canva | Production | Auto-captions, templates, vertical export. Start here. |
| faster-whisper / Whisper | 🧪 | Local transcription for burned-in subtitles in an FFmpeg path. |
| FFmpeg | 🧪 | Scriptable assembly/export for repeatability. |
| 💳 Descript / VEED | fallback | Fast captioning + editing if speed > control. |

Workflow: [VIDEO_ASSEMBLY_WORKFLOW.md](VIDEO_ASSEMBLY_WORKFLOW.md).

### Layer 6 — UGC actor / talking-head (optional, lower priority)
| Option | Status | Notes |
| --- | --- | --- |
| **OpenShorts** | 🧪 reference/orchestration | MIT code, **but requires paid Gemini + fal.ai + ElevenLabs** for AI features (~$0.50–1.50/short); YOLOv8 dep is AGPL. Self-hosted orchestration layer, *not* free generation. |
| **Open-AI-UGC** | ⛔ **Defer** | **No LICENSE file (effectively unlicensed); hard-requires paid MUAPI** + Postgres + Stripe + Google OAuth. No local inference. Treat as UI/UX reference only. |
| 💳 HeyGen / Creatify / Arcads / MakeUGC | fallback | When you genuinely need realistic human delivery. |

> For an AI-cybersecurity account, talking-head avatars are **optional**. Hook text + b-roll + voiceover + subtitles is enough for strong Reels. Don't block on Layer 6.

### Layer 7 — Publishing
| Option | Status |
| --- | --- |
| ▶ Manual via Meta Business Suite / Instagram | Production (now) |
| Instagram Graph API + human approval gate | Later — see [CONTENT_PIPELINE.md](../content/CONTENT_PIPELINE.md) §9 |

---

## 3. Recommended starting stack (this week)

```
Script:    Claude  →  Voice: CapCut/cleared TTS (VoxCPM2 in parallel R&D)
B-roll:    Pexels/Pixabay + carousel art + CapCut motion
Music:     YouTube Audio Library / Pixabay (low-volume bed)
SFX:       Mixkit/Pixabay riser + glitch on hook reveal
Assembly:  CapCut → 1080×1920, 30fps, burned-in subtitles
QA:        QA_CHECKLIST.md (incl. Gate 7 media rights)
Publish:   Manual via Business Suite
```

## 4. Migration order (replace SaaS one piece at a time)

1. **Voice** (easiest, biggest cost cut): cleared TTS → **VoxCPM2** after bake-off.
2. **B-roll**: stock → **Wan2.1 / LTX** if/when GPU is available.
3. **Assembly**: CapCut → **FFmpeg/Whisper** template for repeatability.
4. **Orchestration**: only if volume justifies it — evaluate **OpenShorts** as a layer (budget its paid APIs); keep **Open-AI-UGC** as reference, deferred.
5. **Publishing**: add API last, behind a human gate.

## 5. Hard guardrails (non-negotiable)

- **Commercial license verified** for every model/asset that touches a published post (Gate 7). F5-TTS base weights and some Piper voices are **not** commercial-safe.
- **Voice:** synthetic-licensed or **Jon's own authorized** voice only. No cloning a real person without consent. Apply AI-audio disclosure where the tool requires it (VoxCPM2).
- **No misleading deepfakes** of real, identifiable people.
- **Content safety unchanged:** no exploit tutorials, no fabricated claims, dramatic-but-defensible only.
