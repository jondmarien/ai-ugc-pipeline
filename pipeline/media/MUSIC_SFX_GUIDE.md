# MUSIC_SFX_GUIDE.md — Music, Risers, Glitch Hits & Cyber Ambience

Audio rules for AI-cybersecurity Reels in [VIDEO_ASSEMBLY_WORKFLOW.md](VIDEO_ASSEMBLY_WORKFLOW.md). Principle: **audio supports the hook and narration — it never competes with them.** Licensing is part of QA ([QA_CHECKLIST.md](../content/QA_CHECKLIST.md) Gate 7).

---

## 1. The one rule that matters
Narration is the lead. Music is a **bed**: low, instrumental, non-distracting. SFX are **punctuation**: a riser into the hook, a glitch on a hard cut, a soft whoosh on transitions. If you notice the music, it's too loud.

---

## 2. Mix levels (starting point)

| Element | Level (relative) | Notes |
| --- | --- | --- |
| Voiceover | **0 dB (lead)** | Always intelligible at phone volume |
| Music bed | **−18 to −24 dB** under voice | Duck further during dense narration |
| Riser (hook) | −10 to −14 dB peak | Resolves right as the hook lands |
| Glitch/transition hits | −10 to −16 dB | Short, on the cut |
| Ambience | −24 to −30 dB | Texture only |

- **Ducking:** sidechain/auto-duck music under the voice (CapCut: lower music clip volume during VO; or use its auto-feature).
- **No lyrics** under narration — words fight words.
- **Loudness:** master around −14 LUFS integrated, true-peak ≤ −1 dBTP (safe for social playback). Avoid clipping.
- **Hook timing:** first 1–2 seconds carry the strongest visual + a riser resolve; don't bury the opening line.

---

## 3. Mood by pillar

| Pillar | Music mood | Bed type |
| --- | --- | --- |
| Offensive AI | tense, driving, slight unease | dark pulsing synth, low arp |
| Model security | curious, cerebral | minimal ticking/sparse pads |
| Data leakage | cautionary, dripping tension | low drone + subtle ticks |
| Defensive AI | controlled, confident | steady mid-tempo pulse |
| Governance | serious, neutral, corporate-clean | restrained ambient pad |
| Myth-busting | playful-then-grounded | light tension that "settles" on the takeaway |

Keep one track per video; don't switch beds mid-Reel.

---

## 4. SFX palette (cyber)

| Cue | When | Source idea |
| --- | --- | --- |
| **Riser / uplifter** | building into the hook reveal (0–2s) | `riser`, `uplifter`, `tension rise` |
| **Glitch hit / digital stab** | hard cuts between b-roll | `glitch`, `digital stab`, `data corrupt` |
| **Whoosh / transition** | slide/scene transitions | `whoosh`, `swish`, `transition` |
| **UI blip / type** | revealing a key word or stat | `ui beep`, `notification`, `keyboard` |
| **Low boom / impact** | the "risk" beat or takeaway | `impact`, `cinematic boom` |
| **Ambience** | under the whole clip | `cyber ambience`, `server room hum`, `dark drone` |

Use 1–3 SFX per video max. Over-SFX'd cyber edits feel cheap.

---

## 5. Sources (commercial-clear first)

| Tier | Source | Use | License note |
| --- | --- | --- | --- |
| ▶ Royalty-free | **YouTube Audio Library** | beds + SFX | Check per-track attribution flag |
| ▶ Royalty-free | **Pixabay Music / Pixabay SFX** | beds, risers, glitches | Pixabay license, commercial OK |
| ▶ Royalty-free | **Mixkit** (music + SFX) | beds, transitions | Mixkit license, commercial OK |
| ▶ Royalty-free | **Free Music Archive** | beds | **Per-track license varies — check each** |
| SFX | **Freesound** | one-shots, ambience | **Per-sound license (CC0 vs CC-BY) — verify each** |
| 💳 Cheap SaaS | Beatoven / Mubert / Canva audio | fast custom loops | Clearer commercial terms; read plan |
| 🧪 Local gen | MusicGen / Stable Audio Open | experimental beds | **Verify model + output license before commercial use** |

> CapCut's built-in "commercial" music library: only use tracks marked **commercially usable**; some CapCut music is flagged non-commercial and can cause takedowns. When unsure, bring your own cleared track.

---

## 6. Build a reusable audio kit (do this once)
Save a per-pillar kit so production is fast:
```
/audio_kit/offensive_ai/   bed.mp3  riser.wav  glitch.wav  ambience.wav  + LICENSES.md
/audio_kit/model_security/ ...
/audio_kit/data_leakage/   ...
/audio_kit/defensive_ai/   ...
/audio_kit/governance/     ...
```
`LICENSES.md` records source + license + URL + date for every file. This is what QA Gate 7.1 checks against.

## 7. QA hooks (audio)
- [ ] Voice intelligible at phone volume with music playing
- [ ] No lyrics under narration
- [ ] Every music/SFX file logged with a commercial-safe license in `LICENSES.md`
- [ ] No copyrighted/trending songs used without a license
- [ ] Loudness ~ −14 LUFS, no clipping
