<div align="center">

# 🧠 pipeline/content/

### The editorial kit — the docs the skills read to write every post

**Positioning:** *AI cybersecurity explained through viral carousels: real threats, real tools, no fake panic.*

</div>

---

This folder is the content source of truth: workflow, brand, scoring, hooks, prompts, and QA gates. It's docs, not code — the Claude Code skills (`.claude/skills/`) read these files when drafting, and the renderer consumes what they produce. Default canvas: **1080×1350** (carousel) · **1080×1920 @ 30 fps** (Reels).

## 🚦 Start here

1. **[BRAND_BRAIN.md](BRAND_BRAIN.md)** — who this is, who it's for, and what it refuses to do.
2. **[CONTENT_PIPELINE.md](CONTENT_PIPELINE.md)** — the 10-stage workflow spine everything else hangs off.
3. **[QA_CHECKLIST.md](QA_CHECKLIST.md)** — the gates every post must pass before it ships.

## 🔄 The 10-stage workflow

```
Intake → Score → Frame → Script → Visual → Caption → QA → Assemble → Upload → Feedback
  │        │                                          │       │
  │        └ 8-axis rubric, produce at ≥ 24/40        │       └ Stage 8 is where
  │                                                   │         renderer/ attaches
  └ ideas from IDEA_BACKLOG, trends, /ingest-post     └ QA_CHECKLIST's 7 gates
```

## 📚 The docs

### Content layer

| File | Role |
| --- | --- |
| [BRAND_BRAIN.md](BRAND_BRAIN.md) | Canonical brand doc: positioning, audience, the explicit rejection of FUD/invented breaches/hype, theme→colour identity table, Jon's story. Closing rule: fix the post *or* update the pillar consciously — never both. |
| [CONTENT_PIPELINE.md](CONTENT_PIPELINE.md) | The workflow spine: 10 stages, the 6-pillar table, the current 8-axis scoring rubric (**produce if ≥ 24/40**), source-priority order, upload naming convention. |
| [IDEA_BACKLOG.md](IDEA_BACKLOG.md) | 40 scored ideas (older 5-axis rubric, **≥ 18 to produce**), each tagged `[Verified]/[Emerging]/[Scenario]`. |
| [POST_TEMPLATE.md](POST_TEMPLATE.md) | The per-post authoring block: ID/pillar/claim/score, source-notes table, carousel script, image prompts, caption, alt text, QA notes. |
| [CAPTION_BANK.md](CAPTION_BANK.md) | 9 cover-hook formulas (8-word cap), 4 caption frameworks, the "save-object requirement" (the takeaway slide must *be* a checklist, not describe one), CTA variants, hashtag rules (3–5 max), comment prompts. |
| [VISUAL_PROMPT_BANK.md](VISUAL_PROMPT_BANK.md) | The FLUX.2 image-prompt doctrine: prose not tags, `Subject+Action+Style+Context`, lighting-first, 30–80 words, text-free by default, theme→hex palette, "don't depict / use instead" substitutions, synthetic-faces-only. |
| [VOICE_AND_TONE_GUIDE.md](VOICE_AND_TONE_GUIDE.md) | The de-AI ruleset behind the `humanizer` skill: keep contractions/real numbers/dry confidence; kill em-dashes, "delve/leverage", "it's not just X, it's Y", listicle cadence, generic CTAs. Includes the "name-removed test". |
| [QA_CHECKLIST.md](QA_CHECKLIST.md) | **The most load-bearing doc.** 7 gates: technical credibility (no invented CVEs/stats/quotes), safety, sources, defender value, accessibility (≤ 12 words/slide, no dashes), brand/platform (copy chain + stop-slop ≥ 35/50), media rights. Plus a 13-item fast-triage list. |
| [DRAFT_POST_REFERENCE.md](DRAFT_POST_REFERENCE.md) | The `/draft-post` / `/draft-week` cheat sheet: pillar→theme defaults, flags, the "no UI/text-bearing image subjects" rule, how `draft-context` keeps posts distinct. |
| [WEEK_1_POSTS.md](WEEK_1_POSTS.md) | 5 fully drafted, sourced example carousels (with one documented live substitution, kept for traceability). |
| [ingested/](ingested/) | Analysis docs written by the `ig-ingest` skill + `INDEX.md` — including at least one explicitly **rejected** delta (a DM-automation funnel, declined because this pipeline requires human approval). |

### Media / video layer (`../media/`)

| File | Role |
| --- | --- |
| [MEDIA_TOOL_STACK.md](../media/MEDIA_TOOL_STACK.md) | The 7-layer tool stack (voiceover, b-roll, music/SFX, subtitles, assembly, UGC actor, publishing) on a Production + R&D two-track. |
| [OPEN_SOURCE_EVALUATION_MATRIX.md](../media/OPEN_SOURCE_EVALUATION_MATRIX.md) | **The authoritative license gate**: verified verdicts for 8 OSS tools, quarterly re-verification cadence. |
| [VOICEOVER_BAKEOFF.md](../media/VOICEOVER_BAKEOFF.md) | 8-criterion TTS comparison (/40) — any engine failing the commercial-license gate is disqualified regardless of score. |
| [BROLL_PROMPT_BANK.md](../media/BROLL_PROMPT_BANK.md) · [MUSIC_SFX_GUIDE.md](../media/MUSIC_SFX_GUIDE.md) · [VIDEO_ASSEMBLY_WORKFLOW.md](../media/VIDEO_ASSEMBLY_WORKFLOW.md) · [WEEK_1_VIDEO_EXPERIMENTS.md](../media/WEEK_1_VIDEO_EXPERIMENTS.md) | B-roll prompts · mix levels (~−14 LUFS) · assembly workflow · the first 5 Reel A/B experiments. |

## 🏷️ Claim tags (used everywhere)

Every factual claim carries one of three confidence tiers, enforced redundantly across five-plus docs:

| Tag | Meaning |
| --- | --- |
| `[Verified]` | Triangulated across ≥ 2 independent, real sources. |
| `[Emerging]` | Reported but not yet independently confirmed. |
| `[Scenario]` | Explicitly hypothetical — framed as such on the slide. |

## 🔒 Non-negotiables

- **No fabrication** — no invented CVEs, numbers, quotes, or breach details. Tag or source everything.
- **Calibrated offensive depth** — high-level by default; offensive posts may go technical when educational and framed for authorized work. Never turnkey instructions for indiscriminate harm.
- **Every post ends with a defender takeaway.**
- **Commercial licenses verified** for every model/asset that touches a post (VoxCPM2 ✅ Apache-2.0 · F5-TTS base weights ❌ CC-BY-NC).
- **Synthetic or authorized voice only** — no misleading deepfakes of real people; AI audio is labeled.

## ✅ Verified anchor facts (re-check before each use)

- OWASP Top 10 for LLM Applications (2025) — Prompt Injection, Sensitive Info Disclosure, Excessive Agency.
- NCSC AI-and-cyber-threat assessments (2024; 2025–2027) — "uplift in reconnaissance and social engineering."
- Arup Hong Kong deepfake fraud (~US$25M, cloned CFO on a video call; reported 2024).
