# Reel — UI kit

The brand's short-form **reel** (1080×1920, 9:16, 30fps). `index.html` is a live, scrubbable
recreation of the Remotion composition: each beat shows a slide background with a slow cinematic
push-in (scale 1.04 → 1.12), a strong bottom scrim, and burned-in lower-third captions, ending on a
CTA end card. The sample is the **prompt-injection-agents** reel (26s, narrated).

## Files
| File | Role |
| --- | --- |
| `index.html` | Mounts the player + transport + caption-mode control. |
| `ReelPlayer.jsx` | `ReelPlayer` — timeline (rAF), `Scene` push-in, `Captions` (3 modes), `EndCard`. |
| `data.js` | `window.REEL` — beats, backgrounds, word timings. |

## Caption modes (toggle live)
- **block** — a rolling 2–3 word window.
- **word** — one word at a time, karaoke.
- **highlight** — the full line shown, the spoken word lit in the accent (the brand default).

## Brand rules honored
- Slow push-in only — no spin, no shake, no illegible animated subtitles.
- Captions are high-contrast, ≤2 lines, with a hard drop shadow over the scrim.
- AI-generated narration is **labelled** on-frame (`● AI Voiceover`) — the brand discloses AI audio.
- Playback position persists to `localStorage` so a refresh keeps your place.
