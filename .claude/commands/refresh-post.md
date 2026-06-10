---
description: Re-run an already-generated post against the current rules/pipeline — re-author + re-render only what changed (default: copy + art + reel, no research)
argument-hint: <post-key> [| scope=art|copy|prompts|reel|research|all] [| theme=…] [| captions=…] [| voice=…] [| passes=N] [| q6] [| upscale] [| no-render]   e.g. 2026-06-08_chatbot-log-leak | scope=art | q6 | upscale
allowed-tools: Skill, WebSearch, WebFetch, Read, Write, Edit, Glob, Grep, Bash
---

You are refreshing an **already-generated** post in this repo — re-authoring the parts that are now out of date with the current rules/templates and re-rendering what changed. This is **not** a new draft: preserve the post's identity (its angle, its sourced facts, its distinct visual world) and only touch what the scope covers. Use this after a pipeline or rule change (e.g. the FLUX.2 [klein] prompt-wording update) when a finished post needs to be brought up to current standards. For a brand-new post use `/draft-post`.

## Input
> 📓 Reference: `pipeline/content/DRAFT_POST_REFERENCE.md` (pillars, themes, flags) and `pipeline/content/VISUAL_PROMPT_BANK.md` (the FLUX.2 klein image-prompt doctrine).

`$ARGUMENTS` = `<post-key> [| key=value …]`. The first segment is the **post key** — a `YYYY-MM-DD_slug` or any unique substring that matches exactly one file in `renderer/content/posts/`. Remaining `key=value` segments, in any order:
- `scope=` (default **`copy,art,reel`**): comma list ∈ `art | copy | prompts | reel | research | all`.
  - `art` — rewrite every slide's `visual_prompt` to the current klein rules **and** regenerate backgrounds.
  - `prompts` — rewrite the `visual_prompt` strings only, do **not** render (review before spending GPU). Implies no art render.
  - `copy` — re-run the copy chain (`humanizer` → `stop-slop` → `professional-proofreader`) over caption / narration / on_slide_copy / subline / alt_text.
  - `reel` — re-render the reel (voice → align → reel). Needed whenever narration copy changed.
  - `research` — re-verify sources (re-open links, re-tier claims). **Only runs if explicitly listed** (or `all`).
  - `all` — everything, including research.
  - **Default (no `scope=`)** = `copy,art,reel`: refresh copy + art and re-render the full pipeline, **without** re-doing research (sources stay as-is unless you add `research`).
- `theme=` — re-color the post (`offensive | defensive | hacking | purple-team | ai`).
- `captions=`, `voice=`, `music=` — reel options, passed through to the render.
- `passes=N`, `q6`, `upscale` — opt-in art quality knobs → forwarded to `bun run pipeline` as `--passes=N` / `--q6` / `--upscale` (see `renderer/docs/IMAGE_MODELS.md` → Quality knobs).
- `no-render` — update the JSON only (re-author), skip all rendering.

## Hard rules (non-negotiable)
- **This is a refresh, not a re-argument.** Never change a sourced fact, statistic, quote, `claim_tag`, or `source` unless `research` is in scope (and then only to correct/re-verify, with the link re-opened the same day). The post's core claim and angle stay the same.
- **Preserve the post's distinct visual identity.** Keep its established motif world (improve the wording/lighting, don't swap it for generic locks/keys/envelopes). Run `cd renderer && bun run draft-context` and avoid drifting into the motifs/hooks/angles it flags as overused.
- All project hard rules still apply: no fabrication; **no em-dashes (`—`/`–`) or sentence fragments** on any surface; the concrete defender takeaway stays intact; offensive depth is allowed on offensive-theme posts.
- **Manual approval before posting. No auto-publish.**

## Steps
1. **Resolve + load.** Find the post JSON in `renderer/content/posts/` matching the key (error if 0 or >1 match). Read it; note pillar, theme, slide count, status. Read the rules you're refreshing against: `pipeline/content/VISUAL_PROMPT_BANK.md` (klein image-prompt doctrine), `pipeline/content/VOICE_AND_TONE_GUIDE.md`, `pipeline/content/BRAND_BRAIN.md`. Run `cd renderer && bun run draft-context` for the variety digest.
2. **Parse scope** (default `copy,art,reel`). State plainly what you're refreshing and what you're leaving untouched.
3. **`art` / `prompts` → re-author visual_prompts.** Use the `react-remotion-instagram-renderer` guidance. For EACH slide, rewrite `visual_prompt` to the klein formula in `VISUAL_PROMPT_BANK.md` §0: **prose**, order `Subject + Action + Style + Context` with the focal subject first, **LEAD with DP-style lighting** (source / quality / direction / temperature — klein's highest-impact lever), 30–80 words specific-not-long, **no colour words** (the theme supplies colour), keep type-free zones **positive** ("clean unmarked surfaces, generous negative space in the lower third"), avoid UI/dashboard/panel/label nouns and quoted strings (garbled lettering), no logos/exploit detail. **Keep this post's existing visual world / central objects** — improve the lighting and phrasing, don't replace the concept — unless the variety digest flags a motif as overused, then swap to a fresh object. Edit the JSON in place; leave `background_asset`/`asset_status` as-is (the render regenerates).
4. **`copy` → re-run the copy chain.** Run `humanizer` → `stop-slop` → `professional-proofreader` over `caption`, `video.narration[]`, every `on_slide_copy`, `subline`, and `alt_text[]`. Keep the house voice and the takeaway accent markup (`[[…]]` / `{{…}}`). **Never alter a sourced fact, number, `claim_tag`, or `source`.** No em-dashes, no fragments, complete sentences.
5. **`research` → re-verify.** Re-open each source link the same day, confirm the wording, re-tier each claim (`[Verified]` / `[Emerging]` / `[Scenario]`), fix any drift. Hard gates: no fabricated URLs, no uncited victims.
6. **`theme=` → recolor.** Set the JSON `theme` (and `brand.palette` if the scaffold derives one) to the new theme.
7. **Validate:** `cd renderer && bun run validate -- <key>`. Fix and re-validate until clean.
8. **Render what changed** (unless `no-render`, or `scope=prompts` with no other render-worthy scope): `cd renderer && bun run pipeline -- <key>` with flags derived from scope —
   - `art` in scope → `--art` (force regeneration; overwrites the old backgrounds). Add `--q6` / `--upscale` / `--passes=N` if the user passed them.
   - `art` NOT in scope → `--no-art` (keep existing backgrounds).
   - `copy` or `reel` in scope → let voice + align + reel run (copy changes narration, so the reel must re-render).
   - neither `copy` nor `reel` in scope → `--no-voice --no-reel` (art / export / package only).
   - pass through `--captions=` / `--voice=` / `--music=` if given.
   - Start ComfyUI first for art; the 8 GB pipeline runs one model at a time (calls `free-comfyui` before voice). Stale port 4317 → kill + retry; reel browser error → `bunx remotion browser ensure` once.
9. **Report:** what was refreshed vs left untouched (e.g. "rewrote 8 visual_prompts lighting-first; copy + sources untouched"), the output folder `pipeline/renders/<key>/`, and the QA items needing a human eye (cover legibility, that the art actually improved, source re-check if research ran). Remind: a human approves before posting.

## Notes
- Everyday case: `scope=art` after an image-prompt rule change (rewrite `visual_prompt`s + regenerate backgrounds), or the default `copy,art,reel` after a broader change. Use `scope=prompts` to review the new wording before spending GPU.
- Already-posted packages in `pipeline/renders/` for finished week-N posts should not be regenerated unless the user asks — refresh the source JSON and re-render into the post's own folder.
