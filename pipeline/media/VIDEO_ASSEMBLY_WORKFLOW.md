# VIDEO_ASSEMBLY_WORKFLOW.md — Manual (CapCut/Canva) → Optional Automation

How a scripted AI-cybersecurity Reel gets built and exported. **Manual first** (ship now); the FFmpeg/OpenShorts path is an **optional R&D track** for when volume justifies it. Plugs into the Assemble/Upload stages of [CONTENT_PIPELINE.md](../content/CONTENT_PIPELINE.md).

**Output spec:** 1080×1920 (9:16), 30 fps, H.264 .mp4, burned-in subtitles, 20–45s, audio ~−14 LUFS.

---

## 1. Inputs checklist (before you open an editor)
- [ ] Script + hook (from [CAPTION_BANK.md](../content/CAPTION_BANK.md)) — QA'd for claims/safety
- [ ] Voiceover WAV (from [VOICEOVER_BAKEOFF.md](VOICEOVER_BAKEOFF.md) winner; license-clear)
- [ ] B-roll clips (from [BROLL_PROMPT_BANK.md](BROLL_PROMPT_BANK.md); stock or generated; licensed)
- [ ] Music bed + SFX (from [MUSIC_SFX_GUIDE.md](MUSIC_SFX_GUIDE.md); logged in `LICENSES.md`)
- [ ] Brand kit: font, accent color (per pillar), handle/logo, CTA frame

---

## 2. Track A — Manual (CapCut or Canva) — **start here**

### Step-by-step (CapCut)
1. **New project**, set canvas **9:16 / 1080×1920**.
2. **Drop the voiceover** on the audio track first — it's the timeline spine. Everything cuts to the VO.
3. **Lay b-roll** behind the VO; trim each clip to 1.5–3s; cut on phrase boundaries. Visual change every 2–4s.
4. **Opening 2s:** strongest visual + animated hook text; place the **riser** to resolve as the hook lands.
5. **Subtitles:** auto-caption → **proofread every word** (tools mangle OAuth/SIEM/EDR). Big, bold, high-contrast, centered, inside safe margins. One short line at a time.
6. **Hook text overlay:** the cover headline as kinetic text in the first 1–2s; keep it readable as a thumbnail.
7. **Music bed:** add, set to −18 to −24 dB under VO, enable ducking. **SFX:** glitch on hard cuts, whoosh on transitions (≤3 total).
8. **Accent + brand:** consistent accent color, small handle, end CTA frame ("SAVE THIS / FOLLOW") with the comment question.
9. **End card:** 1.5–2s — takeaway line + CTA + handle.
10. **Review on a phone** (the real viewing device) at phone volume.
11. **Export:** 1080×1920, 30 fps, high bitrate, .mp4.

### Canva note
Same flow; Canva is stronger for **on-brand text/templates**, weaker for fine audio control. Build a reusable Canva **Reel template per pillar** (accent color, font, caption style, CTA frame) and drop assets in.

### Reusable project templates (build once)
Save a per-pillar template (intro hook style, caption style, accent, end card). Production then = swap VO + b-roll + text.

---

## 3. Track B — Optional automation (FFmpeg + Whisper) — **R&D**

Only build this once you're producing enough Reels that manual editing is the bottleneck. It buys **repeatability**, not better creativity.

### Folder convention (per video)
```
YYYY-MM-DD_slug/
  voice.wav            # license-clear narration
  broll/               # 01.mp4, 02.mp4 ... (licensed)
  music.mp3            # logged in LICENSES.md
  hook.png             # overlay (transparent)
  cta.png              # end card
  subs.srt             # generated, then PROOFREAD
  LICENSES.md
```

### Pipeline stages (each swappable)
1. **Transcribe → subtitles:** `faster-whisper` on `voice.wav` → `subs.srt`. **Proofread acronyms.**
2. **Assemble b-roll:** FFmpeg concat the trimmed clips to match VO length.
3. **Burn subtitles:** FFmpeg `subtitles=subs.srt` with a styled force-style (font, size, outline).
4. **Mix audio:** FFmpeg overlay music under voice with volume/ducking filters; normalize to −14 LUFS (`loudnorm`).
5. **Overlay hook + CTA:** FFmpeg overlay `hook.png` (0–2s) and `cta.png` (end).
6. **Export:** scale/pad to 1080×1920, 30 fps, H.264.

> Keep each stage as a separate command/script so you can swap a tool (e.g. different TTS, different b-roll source) without rewriting the pipeline — this mirrors the modularity rule in [MEDIA_TOOL_STACK.md](MEDIA_TOOL_STACK.md).

### OpenShorts as an orchestration option
`OpenShorts` (self-hosted, Docker) can wrap clipping + subtitles + UGC + publishing **but its AI stages call paid APIs** (Gemini, fal.ai, ElevenLabs, Upload-Post; ~$0.50–1.50/short) and bundles AGPL YOLOv8 ([OPEN_SOURCE_EVALUATION_MATRIX.md](OPEN_SOURCE_EVALUATION_MATRIX.md)). Treat it as a **fork-and-customize** target where you'd swap in VoxCPM2 + local Whisper + local b-roll. **Open-AI-UGC is deferred** (no LICENSE file, mandatory paid MUAPI). Don't let either block the manual track.

---

## 4. Export presets (quick reference)

| Setting | Reel |
| --- | --- |
| Resolution | 1080 × 1920 |
| Frame rate | 30 fps (or match b-roll) |
| Codec | H.264 .mp4 |
| Audio | AAC, ~−14 LUFS, peak ≤ −1 dBTP |
| Length | 20–45s (front-load the hook) |
| Subtitles | Burned-in, proofread |

---

## 5. From edit → upload package
Export the final `.mp4` into the post folder alongside the carousel package:
```
YYYY-MM-DD_slug/
  ...carousel PNGs...
  YYYY-MM-DD_slug_reel.mp4
  caption.txt        # can reuse/trim the carousel caption
  alt_text.txt
  sources.md
  LICENSES.md        # music/footage/voice/model licenses
```
Then run [QA_CHECKLIST.md](../content/QA_CHECKLIST.md) (incl. **Gate 7 media rights**) and upload manually via Business Suite. Reels can reuse the carousel's caption/hashtags.

## 6. Definition of done (video)
- [ ] 1080×1920, 30fps, hook in first 2s
- [ ] Subtitles burned in and **proofread** (acronyms correct)
- [ ] Music ducked under VO; ≤3 SFX; ~−14 LUFS
- [ ] Accent color + handle + end CTA consistent
- [ ] Every asset license logged in `LICENSES.md`; Gate 7 passed
- [ ] Reviewed on a phone before export
