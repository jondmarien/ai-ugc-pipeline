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

## Growing the stub into a narrated cut (next slice)
The PoC ships **without audio** to avoid license tracking. To produce a real narrated Reel:
1. Generate narration with **VoxCPM2** (Apache-2.0, commercial-OK; apply the AI-audio disclosure its TOS requires) — see `../../pipeline/media/VOICEOVER_BAKEOFF.md`. Save `voice.wav` in the package.
2. Add a royalty-free instrumental bed (`music.mp3`) per `../../pipeline/media/MUSIC_SFX_GUIDE.md`; keep it under the voice.
3. In `ReelComposition`, add an `<Audio>`/`AudioBed` track; sync `narration[]` spans to captions.
4. Populate `video.licenses[]` and `LICENSES.md` (QA Gate 7) — **F5-TTS base weights are CC-BY-NC, not for commercial use**; prefer VoxCPM2.
5. Re-run QA: subtitles inside safe margins, voice intelligible at phone volume, ~−14 LUFS, no exploit detail in narration.

## QA (reel)
| Check | Pass |
| --- | --- |
| Resolution/fps | 1080×1920 @30fps H.264 (ffprobe) |
| Captions | burned-in, ≤2 lines, inside safe margins, acronyms proofread |
| Timing | beats match narration; hook in first ~2s |
| Audio (when added) | voice dominant; licensed bed; ~−14 LUFS |
| Media rights | every voice/music/b-roll/model in `LICENSES.md` |
| Safety | no exploit walkthrough in narration or visuals |
