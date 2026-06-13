# Readable tech-heavy posts + independent reel scripts — design

**Date:** 2026-06-12
**Status:** approved (brainstorming) → pending spec review
**Author:** Jon (via Claude Code)

## Problem

Tech-heavy CVE/LPE carousel posts render as walls of acronym-dense text that nobody
will read, and on the worst slides the copy visually **clips** off the bottom of the
frame. Reel narration mirrors the on-slide copy instead of being a real spoken script.
Separately, a few AI-generated backgrounds still render garbled text because their
`visual_prompt`s name text-bearing subjects (panels, maps, "blocklist", "page cache").

Concrete evidence (2026-06-10 renders):
- `dirtydecrypt` slide 5 & 6: `on_slide_copy` is a 200+ char paragraph → headline floors
  at 50px, subline fixed at 40px, block is `overflow:hidden` capped at 60% canvas height
  → clipped.
- `dirtydecrypt` slide 2, `fragnesia` slides 6 & 8: backgrounds still show garbled text
  ("modute blcdklick" = "module blocklist", "Page caloce" = "page cache").

## Root causes (verified)

| Symptom | Cause | Location |
| --- | --- | --- |
| Copy clips, no shrink-to-fit | `fitHeadline()` is a char-count heuristic that floors at 50px; subline is fixed 40px; text block is `overflow:hidden` at `textMaxFrac=0.6` | `renderer/src/design/tokens.ts:70`, `renderer/src/components/carousel/CarouselSlide.tsx:63`, `slides.tsx` |
| Wall-of-text copy | Only the cover has a length cap ("8 words max"); body slides 2–6 have no budget | `.claude/skills/ai-cybersecurity-ugc-carousel/SKILL.md:58-65` |
| No enforcement | Schema has no `maxLength` on `on_slide_copy`/`subline`; validator does not check copy length | `renderer/src/lib/schema.ts:82`, `renderer/scripts/validate.ts` |
| Reel = captions | Narration authored in the same pass as slide copy; no rule forcing independence | `.claude/commands/draft-post.md:38-39` |
| Garbled image text | "avoid UI/panel/label nouns" is advisory; nothing lints `visual_prompt` | `.claude/commands/draft-post.md:38`; no lint in `validate.ts` |

## Goals

1. Carousel slides carry **one digestible idea** in short, plain-language copy.
2. Copy **never clips** — measured shrink-to-fit with a legible floor.
3. Reels get an **independent full-sentence spoken script** (not the slide lines).
4. Both baked into the **draft pipeline** for all future posts.
5. **Retrofit 15 tech-heavy posts** on 2026-06-10 / 2026-06-11 / 2026-06-12.
6. Finish the **garbled-background** fixes.

Non-goals: redesigning the brand/visual system; changing TTS engines; retrofitting
non-CVE posts (e.g. `shadow-ai-inventory`, `cohere-north-mini-code`).

## Design

### Decisions (from brainstorming)
- Enforcement: **validator cap + renderer safety net** (belt and suspenders).
- Reel regen: **rewrite scripts now, defer voice/align/reel regen** to a user batch.
- Scope: **tech-heavy CVE/LPE posts only**, plus `rogueplanet`; not `cohere`.
- Slide count: **may increase (10–14)** when a post is genuinely dense.

### A. Renderer no-clip safety net
`renderer/src/components/carousel/` + `tokens.ts`
- Replace the char-count `fitHeadline` with a **measurement-based fit**: a fit routine
  measures the rendered text block (headline + subline together) against the available
  frame height (between `frameTop` and the bottom safe margin) and steps a scale factor
  down (binary search or stepwise) until the block fits, with a legible **floor** for
  headline and subline.
- Export runs in a real browser (Playwright), so measurement is reliable. Add a
  **"fit settled" signal** (e.g. a data attribute / window flag) that `export-carousel`
  waits on, alongside the existing font-ready wait.
- **Concrete floors** (the no-clip guarantee asserts against these): headline floor
  **44px**, subline floor **30px**. The fit routine scales the block down to fit; if the
  block still overflows at the floor, the renderer holds the floor (never clips) and the
  validator copy-budget warning (B) is what prevents copy that dense from shipping.
- If the floor still overflows, that is a **validator failure upstream**, not a silent
  clip. The renderer guarantees: no clipping, ever.
- Keep the cover/takeaway accent behavior intact.

### B. Copy budget in the validator
`renderer/src/lib/schema.ts` (optional soft annotations) + `renderer/scripts/validate.ts`
- Per-role budgets, emitted as **warnings** (old posts still validate; the draft command
  treats warnings as a fix-it gate):
  - cover `on_slide_copy` ≤ **8 words**
  - body (`context|risk|mechanism|failure_point|defense|point`) `on_slide_copy`
    ≤ **14 words / ~90 chars** (one short sentence)
  - `takeaway` `on_slide_copy` ≤ **22 words** (the save-object line; markers stripped)
  - `subline` (all roles) ≤ **30 words / ~180 chars**
- Warnings list the offending slide index, role, and the measured count.

### C. `visual_prompt` text lint
`renderer/scripts/validate.ts`
- For each slide, scan `visual_prompt` for text-summoning signals and **warn**:
  - an ALL-CAPS run (≥2 consecutive capitalized/acronym words, e.g. `ALGIF_AEAD BLOCKED`)
  - a denylist of nouns: `diff, commit, log, terminal, console, dashboard, panel,
    label, labeled, marked, logo, snippet, email, thread, code, script, plaintext,
    version string, map` (word-boundary, case-insensitive)
- Warn with slide index + matched token(s). Advisory (does not hard-fail), but surfaced
  by the draft command before render.

### D. Carousel copy doctrine (future posts)
`.claude/skills/ai-cybersecurity-ugc-carousel/SKILL.md` + `.claude/commands/draft-post.md`
- "One idea per slide, plain language": every body slide states one claim in ≤1 short
  sentence within the budget; **expand each acronym in plain words on first use**
  (e.g. "an AF_ALG socket, the kernel's crypto interface"). **Acronym expansion lives on
  the `subline`** (≤30 words), not the body line, so it never fights the ≤14-word body
  budget — the body line stays a short plain claim, the subline carries the expansion and
  detail. If a slide needs >1 idea, **split into another `point` slide**.
- Tech-heavy posts may run **10–14 slides**; prefer the existing **`chain` role** for
  multi-step mechanisms (renders a clean on-brand step diagram, no AI background).
- Encode the budgets from (B) into the copy-pattern table.

### E. Reel-script doctrine (future posts)
`.claude/commands/draft-post.md` (+ a short reference note)
- Narration is an **independent spoken script**: 4–7 connected complete sentences telling
  the story in plain English, acronyms spoken naturally, explicitly **≠ `on_slide_copy`
  and ≠ `beats[].caption`**. `beats[].caption` remains the short on-screen keyword line;
  `video.narration[].text` is the voiceover prose.
- Strengthen the existing humanizer/proofreader step note into a hard check.

### F. Finish garbled backgrounds
`renderer/content/posts/2026-06-10_dirtydecrypt-linux-lpe.json` (slide 2),
`renderer/content/posts/2026-06-10_fragnesia-linux-lpe.json` (slides 6, 8)
- Rewrite those `visual_prompt`s to fully abstract scenes with **no** panel/map/message/
  "blocklist"/"page cache" nouns. Update matching `alt_text`.
- Regenerated in the user's later batch.

### G. Retrofit 15 posts
06-10 (7): `copy-fail-linux-lpe`, `cve-2026-23111-one-char`, `dirty-frag-linux-lpe`,
`dirtydecrypt-linux-lpe`, `fragnesia-linux-lpe`, `nightmare-eclipse-github-removal`,
`rogueplanet-windows-zero-day`.
06-11 (7): `bluehammer-cve-2026-33825`, `greatxml-bitlocker-bypass`,
`greenplasma-system-lpe`, `miniplasma-patched-lpe`, `redsun-windows-lpe`,
`undefend-defender-dos`, `yellowkey-cve-2026-50507`.
06-12 (1): `fable5-jailbreak-panic` — **copy + reel only** (cover/body copy overlong and
clipping; cover 97c, body slides 212–273c). It has **no** garbled-background issue, so
section F does not apply; its backgrounds are not regenerated unless a slide is split.

Per post:
1. Rewrite `on_slide_copy` to one-idea plain-language lines within budget; split into
   more slides where genuinely dense (update `alt_text` length = slide count,
   `expected_files`, `beats`, per-slide `visual_prompt` + `background_asset`).
2. Rewrite `video.narration[]` as independent connected prose; keep `beats[].caption`
   as short keyword lines.
3. Run the copy chain (humanizer → stop-slop → professional-proofreader) on new copy.
4. `bun run validate` — zero copy/lint warnings.
5. **Defer** voice/align/reel regen; collect the per-post regen command into a batch.

Stale-state note: rewriting `narration[]` without re-aligning leaves `video.captions[]`
aligned to the OLD audio. Captions are regenerated when the user runs `align`. Until the
deferred batch runs, the reel is stale; the carousel (re-exported) is current.

## Data flow / order
1. Code (A, B, C) + doctrine (D, E).
2. Background prompt fixes (F).
3. Retrofit posts (G), one at a time, validating each.
4. Hand user the regen batch (art for changed slides → export → package; then voice →
   align → reel when GPU is free).

## Testing
- **Renderer fit:** export-smoke on the worst offender (`dirtydecrypt` slide 5) asserting
  the text block's rendered height ≤ frame height (no clip), and that the floor is
  respected.
- **Validator copy budget:** an overlong body `on_slide_copy` warns; a within-budget one
  does not.
- **Lint:** `"...labeled ROOT..."` and an ALL-CAPS run trip the lint; clean prose does not.

## Risks
- Increasing slide count touches many coupled fields (`alt_text`, `expected_files`,
  `beats`, narration timing) — mitigate by doing it only where a slide truly has 2+ ideas,
  and validating each post.
- Measured fit must settle before Playwright capture — mitigate with an explicit
  fit-settled wait and a timeout fallback to the floor.
