---
description: Batch-draft a full week (up to 5 ideas) into content/posts/, with pillar variety + a posting calendar
argument-hint: idea1 | idea2 | idea3 | idea4 | idea5    (optional ::pillar and ::captions=word|highlight per idea)
allowed-tools: Skill, WebSearch, WebFetch, Read, Write, Edit, Glob, Grep, Bash
---

Produce a full week of AI-in-cybersecurity posts — one per idea (up to 5) — using the repo's two skills. This is `/draft-post` run as a batch, with editorial coordination across the week.

## Input
`$ARGUMENTS` = ideas separated by `|` (up to 5). Each idea may optionally carry:
- `:: <pillar>` to force a pillar (else you assign one),
- `:: captions=word|highlight|block` to set the reel caption animation (default `block`).

Example: `phishing voice clones :: offensive_ai | RAG leaks :: model_security :: captions=highlight | shadow AI :: governance`

If fewer than 5 ideas are given, just do that many. If more than 5, take the first 5 and note the rest were skipped.

## Week-level rules
- **Pillar variety:** spread posts across different pillars (offensive_ai, model_security, data_leakage, defensive_ai, governance, myth_busting). If the user forced pillars, respect them; otherwise diversify.
- **Dates:** assign sequential weekday dates. Get the start with `Bash: date +%F`, then space posts Mon–Fri (or simply +0, +1, +2… business days from today). Use each as the post's `date`/slug prefix.
- **No duplicate angles:** if two ideas overlap, sharpen them so the week doesn't repeat itself.

## Per-idea steps (same as /draft-post)
For each idea, in turn:
1. Use `ai-cybersecurity-ugc-carousel` to write the 8-slide post + caption + hashtags + question (house voice).
2. **Research real sources (a loop, not one search):** landscape scan (broad WebSearch + counter-arguments) → gather primaries (OWASP/NCSC/NIST/CISA/CVE/named journalism) → **triangulate ≥2 independent sources** for load-bearing claims → confidence-tier each (`[Verified]`/`[Emerging]`/`[Scenario]`) and record `{source, link, supports, confidence, claim_tag}`. Hard gates: no fabricated URLs; re-open links; disclose empty angles; no real victim without a cited source. No payloads/exploit/evasion. Include a defender takeaway.
3. Use `react-remotion-instagram-renderer` to map to the schema. Pick a kebab slug.
4. `cd renderer && npm run new -- <date> <slug> <pillar> --captions=<mode>`, then Edit the JSON to replace every TODO with real, sourced content. Keep schema rules (8 slides, slide1=cover, alt_text length 8, score.total = sum, ≥1 source, reel beats filled, `video.caption_mode` = requested mode). Then **humanize** the caption/narration/on_slide_copy with the `humanizer` skill (+ `voice-profile.md`) → house voice per `pipeline/content/VOICE_AND_TONE_GUIDE.md`; never alter a sourced fact.
5. `cd renderer && npm run validate -- <date>_<slug>` → fix until clean.
6. Render: `cd renderer && npm run export -- <date>_<slug> && npm run package -- <date>_<slug> && npm run reel -- <date>_<slug>`. (If a reel hangs: free port 4317 / `npx remotion browser ensure`.)

## Finish
Print a **week table**: date | slug | pillar | caption_mode | claim tags (fact vs scenario) | output folder. Then list the human-review items (source re-check, cover legibility, cyber-safety) and remind that a human approves before posting; reels are **narrated by default** (VoxCPM2 2B — pass `--no-voice` for a silent reel), and licensed music can be layered on. Suggest a Mon→Fri posting order with pillar variety in mind.

> Tip: this is token-intensive (5 researched posts + 5 renders). If you want to review copy before rendering, tell me and I'll stop after step 5 for all five.
