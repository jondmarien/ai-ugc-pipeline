# REMOTION_REEL_WORKFLOW.md

Optional Reel rendering, aligned with `../../pipeline/media/VIDEO_ASSEMBLY_WORKFLOW.md`. Implementation: `../remotion/` + `../scripts/render-reel.ts`. The Reel reuses the **same post JSON** as the carousel — no separate content process.

> Build the static carousel first. Remotion is added only after the carousel export passes QA. The PoC reel is a **stub** (no audio); this doc covers how to grow it into a narrated cut.

## Composition tree

```
remotion/index.ts            → registerRoot(RemotionRoot)
remotion/Root.tsx            → <Composition id="reel" 1080×1920 @fps, durationInFrames from video.duration_seconds>
remotion/ReelComposition.tsx → maps video.beats[] → <Sequence> per beat
   ├─ Scene         (background: reused image or procedural; slow push-in)
   ├─ CaptionLayer  (burned-in lower-third subtitle, one per beat)
   └─ EndCard       (beat.purpose === "cta" → question + CTA + handle)
remotion/theme.ts            → palette + pillar accents (sync with src/design/tokens.ts)
```

## Timing model (`video` in the post JSON)

```json
"video": {
  "enabled": true,
  "duration_seconds": 26,
  "fps": 30,
  "export_name": "2026-06-02_ai-phishing-training_reel.mp4",
  "narration": [ { "start": 0, "end": 5, "text": "…" } ],
  "beats": [
    { "start": 0, "end": 5, "slide_ref": 1, "purpose": "hook", "motion": "slow push-in over cover", "caption": "…" }
  ],
  "subtitle_style": "large centered lower-third, high contrast, two lines max",
  "music": null, "sfx": [], "licenses": []
}
```

- Each `beat` → a `<Sequence from={start*fps} durationInFrames={(end-start)*fps}>`.
- `beat.slide_ref` reuses the carousel slide's background/role.
- `beat.purpose === "cta"` renders `EndCard` (uses `comment_prompt`).
- 3–6s beats, 30fps, one caption per beat. Don't force every carousel slide into the video if it hurts pacing.

### Caption animation modes (`video.caption_mode`)
| Mode | Behavior |
| --- | --- |
| `block` (default) | full caption per scene, fades in |
| `word` | one word at a time, karaoke style |
| `highlight` | full line shown; the current word lit in the pillar accent |
Implemented in `remotion/CaptionLayer.tsx`. Word timing is distributed evenly across each beat window (no audio needed); when real narration audio + word timestamps exist, pass `beat.words[]` for exact sync. Set the mode at generation time (`--captions=` / `captions=`), no code edits needed.

### Per-post rendering
`render-reel.ts` writes a temp `{post}` props file and passes `--props` to the Remotion CLI; `remotion/Root.tsx` uses `calculateMetadata` to derive duration/fps from that post. So `npm run reel -- <key>` renders **that** post (not a hardcoded default) — required for batch/`draft-week` output.

## Render

```bash
cd renderer
npx remotion browser ensure     # once — pre-downloads the headless browser
npm run reel -- 2026-06-02_ai-phishing-training
```

`render-reel.ts` runs `remotion render remotion/index.ts reel <out> --codec=h264 --timeout=120000`, writes to `pipeline/renders/<folder>/<export_name>`, then **ffprobe-verifies** width/height/fps/codec.

## Gotchas (learned during the PoC)
- **Pre-ensure the browser.** Without `remotion browser ensure`, the first render hits a 30s "setting up headless browser" timeout. We also pass `--timeout=120000`.
- **zod version warning.** Remotion 4 prefers zod v4; this project pins zod v3 for the carousel schema. We don't use Remotion's zod schema feature, so the warning is harmless — ignore it (or pin zod separately if you adopt Remotion input-prop schemas).
- **Fonts.** `ReelComposition.tsx` imports the `@fontsource` CSS so the headless render has fonts locally (no network dependency).

## Output spec
`1080×1920`, 30fps, H.264 MP4, 20–45s. Verified by ffprobe in the script.

## Audio (narration + music) — built in

Reel audio is driven by `video.audio` (see CONTENT_SCHEMA.md) and played by `remotion/AudioBed.tsx`: narration at full volume over a music bed ducked to `music_gain_db` (default −18 dB). It's **optional and file-driven** — `render-reel.ts` only includes audio whose files exist under `renderer/public/`, otherwise it renders **silent + warns**. So a post can declare `voice_mode: voxcpm2` / `music_mode: free` before the files exist.

**Produce a narrated cut:**
1. **Voice (VoxCPM2 — Apache-2.0, commercial-OK):** `npm run voice -- <post-key>` runs `scripts/voice-voxcpm.py`, which synthesizes the post's `narration[]` into `public/audio/<prefix>/voice.wav`. Requires a local VoxCPM2 install (`python -m pip install voxcpm soundfile`; CUDA torch recommended). Apply the AI-audio disclosure VoxCPM2's TOS requires; clone only a synthetic or **your own authorized** voice. **Do not use F5-TTS base weights — CC-BY-NC, not commercial.**
2. **Music:** drop a commercial-safe track at `public/audio/<prefix>/music.mp3`. Options (set `music_mode`): `free` (Pixabay / YouTube Audio Library / Mixkit), `licensed` (a track you've licensed), `generated` (local MusicGen/Stable Audio Open — verify output license), or `file` (bring your own). See `../../pipeline/media/MUSIC_SFX_GUIDE.md`.
3. `npm run reel -- <post-key>` → the reel now carries an AAC stereo track (narration over ducked music). Verify with ffprobe (an `aac` stream appears).
4. Log every audio asset in `LICENSES.md` (QA Gate 7). `build-package.ts` records the modes; fill in the actual track/source.
5. QA: subtitles inside safe margins, voice intelligible at phone volume, ~−14 LUFS, no exploit detail in narration.

> Word-synced captions: `caption_mode: word|highlight` currently distributes word timing evenly across each beat. With real narration audio you can later add `beat.words[]` timestamps (e.g. from faster-whisper) for exact lip-tight sync.

## QA (reel)
| Check | Pass |
| --- | --- |
| Resolution/fps | 1080×1920 @30fps H.264 (ffprobe) |
| Captions | burned-in, ≤2 lines, inside safe margins, acronyms proofread |
| Timing | beats match narration; hook in first ~2s |
| Audio (when added) | voice dominant; licensed bed; ~−14 LUFS |
| Media rights | every voice/music/b-roll/model in `LICENSES.md` |
| Safety | no exploit walkthrough in narration or visuals |
