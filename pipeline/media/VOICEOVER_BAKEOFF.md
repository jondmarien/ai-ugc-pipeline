# VOICEOVER_BAKEOFF.md — TTS Test Plan (VoxCPM · F5-TTS · Piper · OpenVoice · SaaS baseline)

Goal: decide which voice engine graduates to Production for AI-cybersecurity narration. Run once, score with the rubric, record results. Feeds [MEDIA_TOOL_STACK.md](MEDIA_TOOL_STACK.md) Layer 2 and [OPEN_SOURCE_EVALUATION_MATRIX.md](OPEN_SOURCE_EVALUATION_MATRIX.md).

> **License gate first (from [QA_CHECKLIST.md](../content/QA_CHECKLIST.md) Gate 7):** a voice may win on quality but still be **disqualified for publishing**. As verified: **VoxCPM2 = Apache-2.0 (commercial OK)**, **OpenVoice = MIT (OK, w/ consent)**, **F5-TTS base weights = CC-BY-NC (NOT commercial)**, **Piper = per-voice license (check each)**. Test all for learning; only ship a license-clear winner.

---

## 1. Contestants

| Engine | Build/route | Commercial status | Why test |
| --- | --- | --- | --- |
| **VoxCPM2** | `pip install voxcpm`, local GPU (~8GB) | ✅ Apache-2.0 | Main ElevenLabs replacement candidate |
| **OpenVoice V2 + MeloTTS** | local GPU (~4–6GB) | ✅ MIT (consent) | Branded synthetic voice |
| **Piper** | `OHF-Voice/piper1-gpl` or `piper-plus`, CPU | ⚠️ per-voice — pick CC0/CC-BY | Fast draft narration |
| **F5-TTS** | local GPU (~3GB) | ❌ base weights CC-BY-NC | Quality reference only (do not publish) |
| **SaaS baseline** | ElevenLabs free tier or CapCut built-in voice | ✅ per ToS | Quality/effort yardstick |

Keep settings comparable: same script, similar speaking rate, neutral-professional tone, 48kHz/44.1kHz WAV out, no post-EQ for the raw round.

### How the renderer actually generates voice (two routes)
The renderer wires two of these in via `video.audio.voice_mode` (run `cd renderer && bun run voice -- <post-key>`):

| voice_mode | What runs | Setup | Notes |
| --- | --- | --- | --- |
| `voxcpm2` | `scripts/voice-voxcpm.py` (local model) | `cd renderer && uv venv && uv pip install voxcpm soundfile torch` — the `bun run voice` dispatcher auto-uses `.venv` (or `uv run`). | VoxCPM2 = **2B, ~5 GB download, 48 kHz**. Smaller variants via `VOXCPM_MODEL=openbmb/VoxCPM1.5` (0.6B) or `openbmb/VoxCPM-0.5B`. |
| `http` | `scripts/voice-http.mjs` → any **OpenAI-compatible `/v1/audio/speech`** server | run a TTS server, then `TTS_BASE_URL=… bun run voice -- <key> --http` | **Kokoro-FastAPI** (Kokoro-82M, Apache-2.0, **~80 MB**) is the easy pick: `docker run -p 8880:8880 ghcr.io/remsky/kokoro-fastapi-gpu`. Env: `TTS_BASE_URL` (default `http://localhost:8880/v1`), `TTS_MODEL`, `TTS_VOICE`, `TTS_FORMAT`. |

> **LM Studio note (researched 2026):** LM Studio's local API serves chat/completions/embeddings only — it does **not** expose `/v1/audio/speech` (open request: lmstudio-bug-tracker #1715). And Gemma is a text LLM, not a TTS model. So you can't make speech with LM Studio + Gemma. Use `voxcpm2` (local model) or `http` (point at Kokoro-FastAPI or any OpenAI-compatible TTS server). If LM Studio ever adds the endpoint, the `http` route works against it by just setting `TTS_BASE_URL=http://localhost:1234/v1`.

---

## 2. The test script (≈30 seconds, ~85 words)

Designed to stress security pronunciation. Read at a steady pace; target 28–32s.

```
Here's the AI security story most teams get wrong.

Attackers don't need new malware. They need scale.
With AI, phishing and social engineering get cheaper to personalize —
and OAuth tokens, EDR gaps, and weak MFA do the rest.

Prompt injection hides in what your agent reads.
Credential stuffing still works. SIEM and SOC queues keep growing.
The fix isn't panic. It's verification, least privilege, and logging.

Follow for AI security, minus the hype.
```

**Pronunciation watch-list** (mark each pass/fail per engine):
`OAuth` (oh-auth) · `EDR` (E-D-R) · `MFA` (M-F-A) · `SIEM` ("sim" or S-I-E-M) · `SOC` ("sock" or S-O-C) · `prompt injection` · `credential stuffing` · `phishing` · `least privilege` · `tokens`.

> Optional acronym-stress add-on (10s): *"Watch the acronyms: SIEM, SOC, EDR, MFA, OAuth, RAG, and CVE."* Use to compare how engines handle dense initialisms.

---

## 3. Scoring rubric (score each engine 1–5)

| Criterion | 1 | 3 | 5 |
| --- | --- | --- | --- |
| **Naturalness** | Robotic | Acceptable | Human, engaging |
| **Clarity** | Mushy | Mostly clear | Crisp at 1× phone playback |
| **Technical pronunciation** | Mangles acronyms | Most correct | All watch-list terms correct |
| **Tone fit** (credible, slightly dramatic) | Off | OK | On-brand |
| **Noise/artifacts** | Audible glitches | Minor | Clean |
| **Generation speed** | Slow/painful | Tolerable | Fast / realtime+ |
| **Editing burden** | Heavy retakes | Some | Near one-take |
| **Repeatability** (same voice next time) | Drifts | Mostly stable | Locked preset |

**Total __/40.** Disqualify (for publishing) any engine failing the **commercial-license** gate regardless of score.

### Score sheet (copy per engine)
```
Engine: ______   Voice/preset: ______   License OK to publish? Y/N
Naturalness _/5  Clarity _/5  Pronunciation _/5  Tone _/5
Noise _/5  Speed _/5  Edit burden _/5  Repeatability _/5   TOTAL _/40
Acronyms correct: OAuth[ ] EDR[ ] MFA[ ] SIEM[ ] SOC[ ] credential stuffing[ ]
Notes: ____________________________________________
```

---

## 4. Procedure

1. **Prep:** save the script as `bakeoff_script.txt`. Pick one target voice/preset per engine (neutral professional). For OpenVoice, prepare a **consented** reference sample (Jon's voice) or use a default synthetic timbre.
2. **Generate:** render the same script on each engine at default-ish settings. Save as `voice_<engine>_v1.wav`.
3. **Blind-ish listen:** play all clips at phone volume; score the rubric without looking at which engine is which where possible.
4. **Pronunciation pass:** specifically re-listen for the watch-list terms; mark pass/fail.
5. **Effort log:** note install pain, GPU/CPU, time-to-first-clip, retakes needed.
6. **Decide:** highest license-clear total wins Production; note a backup. Record in [OPEN_SOURCE_EVALUATION_MATRIX.md](OPEN_SOURCE_EVALUATION_MATRIX.md).

---

## 5. Expectations (from current verification — confirm by ear)

| Engine | Likely outcome to validate |
| --- | --- |
| VoxCPM2 | Strong naturalness + commercial-clear → **front-runner**; verify acronym handling |
| OpenVoice+MeloTTS | Good if you want a consistent branded timbre; more setup |
| Piper | Lower naturalness but instant/free → **draft track** winner |
| F5-TTS | May sound great — but **cannot publish** on base weights; reference only |
| SaaS baseline | Sets the quality bar; keep as paid fallback |

## 6. Guardrails
- No cloning a real person's voice without explicit consent. For this account: **synthetic voice or Jon's own authorized voice only.**
- Apply the **AI-generated-audio disclosure** VoxCPM2's TOS requires (and good practice generally).
- Pronunciation fixes: prefer phonetic spelling in the script (e.g. "ess-eye-em" for SIEM) over shipping a mangled read.
- Keep the winning preset/seed documented so narration stays consistent across posts.
