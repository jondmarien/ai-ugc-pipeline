---
description: Re-run an already-generated post against the current rules/pipeline — re-author + re-render only what changed (default: copy + art + reel, no research). The `copy` scope is the readability retrofit (one-idea-per-slide budgets, detail on the subline, independent reel script); `art`/`prompts` clear visual_prompt lint advisories.
argument-hint: <post-key> [| scope=art|copy|prompts|reel|research|all] [| theme=…] [| captions=…] [| voice=…] [| passes=N] [| q6] [| upscale] [| no-render]   e.g. 2026-06-08_chatbot-log-leak | scope=art | q6 | upscale
allowed-tools: Skill, WebSearch, WebFetch, Read, Write, Edit, Glob, Grep, Bash
---

You are refreshing an **already-generated** post in this repo — re-authoring the parts that are now out of date with the current rules/templates and re-rendering what changed. This is **not** a new draft: preserve the post's identity (its angle, its sourced facts, its distinct visual world) and only touch what the scope covers. Use this after a pipeline or rule change (e.g. the FLUX.2 [klein] prompt-wording update) when a finished post needs to be brought up to current standards. For a brand-new post use `/draft-post`.

## Input
> 📓 Reference: `pipeline/content/DRAFT_POST_REFERENCE.md` (pillars, themes, flags) and `pipeline/content/VISUAL_PROMPT_BANK.md` (the FLUX.2 klein image-prompt doctrine).

`$ARGUMENTS` = `<post-key> [| key=value …]`. The first segment is the **post key** — a `YYYY-MM-DD_slug` or any unique substring that matches exactly one file in `renderer/content/posts/`. Remaining `key=value` segments, in any order:
- `scope=` (default **`copy,art,reel`**): comma list ∈ `art | copy | prompts | reel | research | all`.
  - `art` — rewrite every slide's `visual_prompt` to the current klein rules (**including clearing any `visual_prompt` advisory** `bun run validate` flags: text-summoning nouns / ALL-CAPS runs) **and** regenerate backgrounds.
  - `prompts` — rewrite the `visual_prompt` strings only (same klein rules + clear the lint advisories), do **not** render (review before spending GPU). Implies no art render.
  - `copy` — **the readability retrofit.** Restructure the carousel copy to one plain-language idea per slide within budget, move acronym expansions/detail to the subline, rewrite the reel narration as an independent spoken script, then run the copy chain (`humanizer` → `stop-slop` → `professional-proofreader`) over caption / narration / on_slide_copy / subline / alt_text. See Step 4 for the full procedure. (A finished post that just needs a voice polish is the same scope — Step 4's restructure is a no-op when the copy is already within budget.)
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
3. **`art` / `prompts` → re-author visual_prompts.** Use the `react-remotion-instagram-renderer` guidance. For EACH slide, rewrite `visual_prompt` to the klein formula in `VISUAL_PROMPT_BANK.md` §0: **prose**, order `Subject + Action + Style + Context` with the focal subject first, **LEAD with DP-style lighting** (source / quality / direction / temperature — klein's highest-impact lever), 30–80 words specific-not-long, **no colour words** (the theme supplies colour), keep type-free zones **positive** ("clean unmarked surfaces, generous negative space in the lower third"), avoid UI/dashboard/panel/label nouns and quoted strings (garbled lettering), no logos/exploit detail. Any prompt `bun run validate` flags as a `visual_prompt` advisory (a text-summoning noun like diff/commit/log/terminal/panel/label/logo/map, or an ALL-CAPS run) MUST be rewritten until the advisory clears. **Keep this post's existing visual world / central objects** — improve the lighting and phrasing, don't replace the concept — unless the variety digest flags a motif as overused, then swap to a fresh object. Edit the JSON in place; leave `background_asset`/`asset_status` as-is (the render regenerates).
4. **`copy` → readability retrofit + copy chain.** Two passes, in order:
   **(a) Restructure for readability** so the carousel is one digestible idea per slide, never a wall of acronyms:
   - Rewrite each slide's `on_slide_copy` to ONE short plain-language claim within budget: **cover ≤8 words; body slides ≤14 words / ≤90 chars; takeaway ≤22 words** (keep its `[[…]]`/`{{…}}` accent markers). Expand acronyms in plain words and push the detail to that slide's **`subline` (≤30 words / ≤180 chars)** — e.g. body "The decrypt step wrote into shared pages without cloning them first." subline "Copy-on-write should clone a shared page before writing, but that guard was missing." These budgets are exactly what `bun run validate` checks as advisories.
   - If a slide genuinely carries more than one idea, **split it into another `point` slide** rather than cramming: keep `cover` first / `cta` last / `takeaway` at N−1, renumber `slide` fields, add the new slide's `on_slide_copy`/`subline`/`visual_prompt` (abstract, lint-clean) + `background_asset` path, append a matching `alt_text` entry (the `alt_text[]` length MUST equal the slide count), add it to `upload_package.expected_files`, and add a `beats[]` entry. Tech-heavy posts may run 10–14 slides; for multi-step mechanisms prefer the `chain` role.
   - Rewrite `video.narration[]` as an **independent spoken script**: 4–7 connected complete sentences telling the story in plain English, acronyms spoken naturally. It must NOT equal the `on_slide_copy` lines and must NOT be a concatenation of `beats[].caption` (those stay terse keyword lines). Keep the segment `start`/`end` timings monotonic and within the existing total (replace each segment's `text`, or consolidate segments).
   **(b) Copy chain.** Run `humanizer` → `stop-slop` → `professional-proofreader` over `caption`, `video.narration[]`, every `on_slide_copy`, `subline`, and `alt_text[]`. Keep the house voice and the takeaway accent markup. `alt_text[]` stays faithful to each slide's POINT (it may summarize rather than echo the new on-slide wording verbatim) and its length equals the slide count. **Never alter a sourced fact, number, `claim_tag`, or `source`** — shorten by cutting words, not by changing claims; if a fact won't fit, move it to the subline or split the slide. No em-dashes, no fragments, complete sentences.
5. **`research` → re-verify.** Re-open each source link the same day, confirm the wording, re-tier each claim (`[Verified]` / `[Emerging]` / `[Scenario]`), fix any drift. Hard gates: no fabricated URLs, no uncited victims.
6. **`theme=` → recolor.** Set the JSON `theme` (and `brand.palette` if the scaffold derives one) to the new theme.
7. **Validate:** `cd renderer && bun run validate -- <key>`. Fix and re-validate until clean, **including zero `⚠ content advisories`** — every copy-budget warning and every `visual_prompt` lint warning must be gone (that is the objective gate for the `copy`/`prompts` scopes).
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
- **Readability retrofit (JSON-only):** `scope=copy,prompts | no-render` restructures the copy to the one-idea budgets, clears any `visual_prompt` advisories, rewrites the reel narration as an independent script, and validates to zero advisories — without rendering. This is the recipe for bringing the dense 2026-06-10/06-11/06-12 CVE/LPE posts up to standard; re-render later with a separate `scope=copy,art,reel` (or `bun run pipeline -- <key> --force`) once the GPU is free (a copy change means the reel must re-render via voice → align → reel).
- Already-posted packages in `pipeline/renders/` for finished week-N posts should not be regenerated unless the user asks — refresh the source JSON and re-render into the post's own folder.
