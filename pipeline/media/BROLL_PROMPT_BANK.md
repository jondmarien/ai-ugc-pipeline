# BROLL_PROMPT_BANK.md — AI-Cybersecurity B-Roll & Background Prompts

For the **Background/b-roll** layer of [MEDIA_TOOL_STACK.md](MEDIA_TOOL_STACK.md). Two uses for every entry:
1. **Stock search** — paste the keyword string into Pexels/Pixabay/Mixkit.
2. **AI generation** — paste the generation prompt into Wan2.1 / LTX-Video (via ComfyUI) or an image-to-video flow.

**Defaults:** 1080×1920 (9:16) for Reels · 3–6s loopable clips · slow/subtle motion (UGC cuts are fast, so each clip is short) · dark, high-contrast, one accent glow · **no rendered text, no real logos, no readable secrets**.

> Verified-tool note: **Wan2.1 (Apache-2.0)** and **LTX-Video/LTX-2** are the local generators. LTX-2 weights are commercial-free only **under $10M ARR** — confirm before commercial use ([OPEN_SOURCE_EVALUATION_MATRIX.md](OPEN_SOURCE_EVALUATION_MATRIX.md)).

---

## 1. Shared generation style block (append to every AI prompt)

```text
Style: cinematic, realistic editorial cybersecurity footage; dark environment, high contrast,
one accent glow (cyan / electric blue / neon green / warning amber). Subtle, slow camera motion
(slow push-in, gentle parallax, or slow pan). Shallow depth of field. Loopable, seamless.
Constraints: NO text, NO real company logos, NO readable code/credentials/emails/secrets,
NO step-by-step exploit content; keep UI abstract and blurred; avoid distorted hands and gibberish UI.
Aspect: 9:16 vertical, 1080x1920. Duration: ~4s.
```

## 2. Accent-color convention (matches the carousels)
Offensive AI → cyan · Model security → electric blue · Data leakage → neon green · Defensive AI → cool teal · Governance → amber.

---

## 3. Core scenes (the six you asked for + extensions)

### A. SOC dashboard
- **Stock keywords:** `security operations center, dashboard, data analytics screen, network monitoring, dark control room, server room blue light`
- **Gen prompt:** `A dark security operations center: a wall of abstract dashboards with shifting graphs and a stream of alert cards collapsing into a short prioritized list; an analyst silhouette in cool teal light, slow push-in. [+ style block]`

### B. Malware sandbox / analysis lab
- **Stock keywords:** `code on screen abstract, data stream, isolated lab, virtual machine, glitch, quarantine`
- **Gen prompt:** `An abstract malware analysis sandbox: a suspicious file icon isolated inside a glowing containment box, faint scanning lines passing over it, amber warning accent, dark lab, slow orbit. No readable code. [+ style block]`
- **Safety:** abstract only — no real malware, no command output, no build/deploy depiction.

### C. AI agent terminal
- **Stock keywords:** `terminal interface abstract, AI assistant glow, automation, network nodes, futuristic console`
- **Gen prompt:** `A glowing abstract AI agent interface wired to small icons for email, files, API and cloud, each behind a luminous permission gate; data pulses travel along the links; electric blue, slow parallax. [+ style block]`

### D. Phishing inbox
- **Stock keywords:** `email inbox blurred, notification, message bubbles, hook, fishing line metaphor, dark UI`
- **Gen prompt:** `An abstract email inbox at night, blurred message rows, several personalized message bubbles branching from an off-screen source, a faint hook/lure motif, cyan accent, slow drift. No readable text. [+ style block]`

### E. Cloud breach map
- **Stock keywords:** `world map data connections, network attack map, global threat map, glowing nodes, cloud infrastructure`
- **Gen prompt:** `A dark global network map: glowing nodes and arcs connecting regions, a few nodes pulsing red then settling, abstract cloud icons floating above, neon green + amber accents, slow zoom. Not tied to any real org. [+ style block]`

### F. Firmware / hardware security lab
- **Stock keywords:** `circuit board macro, chip close up, hardware lab, soldering, electronics macro blue`
- **Gen prompt:** `A macro shot of a circuit board / chip with faint glowing traces, a probe hovering over it in a dark hardware lab, electric blue light, slow dolly across the board. Abstract, no readable markings. [+ style block]`

---

## 4. Extra scenes by pillar (high reuse)

| Pillar | Scene | Gen prompt seed |
| --- | --- | --- |
| Offensive AI | Deepfake call | `A dim video-conference grid at night; one tile subtly uncanny/over-rendered; an audio waveform that doesn't quite match a human silhouette; cyan/amber; slow push-in. No real faces.` |
| Offensive AI | Recon | `Abstract profile fragments and public data cards drifting and connecting toward a single target node; cyan; slow parallax.` |
| Model security | Indirect injection | `An AI scanner beam passing over a webpage, document and image; faint shadow-like instruction patterns hidden behind normal content blocks; electric blue; slow pan.` |
| Model security | Excessive agency | `An AI agent reaching toward action icons (send, delete, pay) behind glowing gates, one gate opening cautiously; electric blue; slow push-in.` |
| Data leakage | Clipboard leak | `A data-classification tag breaking into clipboard fragments crossing an enterprise boundary into an unapproved app; neon green; slow drift.` |
| Data leakage | Shadow AI | `A corporate app-inventory board where several glowing 'unapproved' AI tool icons sit outside a sanctioned perimeter ring; amber; slow zoom-out.` |
| Defensive AI | Alert triage | `A towering stack of alert cards collapsing into three prioritized cards with an AI glow assisting a human silhouette; cool teal; slow push-in.` |
| Governance | Audit trail | `An audit-trail timeline with a highlighted 'who approved this?' checkpoint and an approval-chain motif; amber; slow pan.` |
| Myth-busting | Hype vs evidence | `A split screen: sensational red tabloid glow vs a calm analyst with a clean evidence panel; red-to-blue split; slow crossfade.` |

---

## 5. B-roll usage rules (editing)

- **Length:** cut each clip to 1.5–3s in the edit; motion stays subtle so fast cuts read clean.
- **Pacing:** aim for a visual change every 2–4s to hold attention; sync hard cuts to a glitch SFX or beat ([MUSIC_SFX_GUIDE.md](MUSIC_SFX_GUIDE.md)).
- **Consistency:** keep one accent color per video (per pillar) so a Reel feels designed, not stock-soup.
- **Layering:** generated/stock b-roll sits *behind* hook text and subtitles; keep the lower third clean.
- **Hybrid:** animate an existing carousel cover (Ken Burns / image-to-video) as the opening 2s, then cut to b-roll.

## 6. Safety & licensing checklist (per clip)
- [ ] Stock clip license allows commercial social use (Pexels/Pixabay/Mixkit = yes; log it).
- [ ] Generated clip's model permits commercial output (Wan2.1 ✅; LTX-2 only <$10M ARR).
- [ ] No real logos, faces of real people, readable secrets, or exploit steps.
- [ ] No synthetic media implying a real, identifiable person did something.
- [ ] Source/license noted in the post's `sources.md`.
