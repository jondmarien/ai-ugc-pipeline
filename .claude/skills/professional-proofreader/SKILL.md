---
name: professional-proofreader
description: >
  Proofread copy for correct English — grammar, spelling, punctuation, syntax, and accuracy —
  AND for substance (does each line read as a real, complete spoken sentence, not a telegraphic
  fragment?). In this pipeline it runs as the final pass over a post's caption, video.narration[],
  on_slide_copy, and subline, AFTER the humanizer and BEFORE validation. Also fires on
  "proofread", "fix grammar", "check this reads right", or "make the script make sense".
---

# Professional Proofreader

Make the copy **correct** and **make sense when read out loud**. Two jobs, in this order:

## 1. Correctness (grammar / spelling / punctuation / syntax / accuracy)
- Fix typos, agreement, tense, articles, run-ons, comma splices, dangling modifiers, doubled words.
- Fix punctuation, including the dash rules below.
- **Never alter a sourced fact, number, name, CVE, quote, or `claim_tag`** to make a sentence smoother. Correctness of language only — substance of claims is fixed upstream and is sacred.
- Don't expand or pad. Don't change meaning. Keep the author's voice (this runs after the humanizer — preserve its cadence).

## 2. Substance — it must read like a real sentence, not "just words"
A reel/caption line must be a **complete thought a human could say aloud and understand on its own**, with enough context. Kill telegraphic fragments and abrupt, unexplained jumps.
- Read every `on_slide_copy`, `subline`, and `video.narration[].text` **out loud**. If it lands as a disconnected noun-pile or a half-thought ("AI assisting old tradecraft." with no verb/why), rewrite it into a clear sentence with a subject, a verb, and the point.
- Narration especially must **flow as connected spoken prose** across the reel — each line should make sense after the previous one, not read as five unrelated bullet fragments.
- Prefer concrete, plain phrasing. Explain the *why*, not just the *what*. (Still tight — this is short-form, not an essay.)

## Dash hygiene (this pipeline burns captions into video — dashes must be clean)
- **Hyphenated compounds are glued with no surrounding spaces:** `first-ever`, `AI-assisting`, `force-multiplier` — never `first -ever`, `word- space`, or `word - space`.
- **Avoid the em-dash (—) in `video.narration[]`.** Spoken text + Whisper captions handle it badly (it becomes a lone "—" or an awkward pause). Replace narration em-dashes with a comma, period, or "and"/"but" so it reads as clean speech. (Em-dashes are fine in the written `caption`, used sparingly.)
- A word must **never** be split across two lines (`wor-‑ds`). The renderer enforces this with non-breaking hyphens + `hyphens:none`; your job is to not introduce stray spaced dashes in the first place.

## Workflow
1. Read the field (caption / each narration line / each on_slide_copy / subline).
2. Apply pass 1 (correctness) then pass 2 (substance), plus dash hygiene.
3. Output the corrected text **and a short bullet list of the changes** (so the human can eyeball that no fact moved).
4. Re-read aloud once more: if any line still reads as a fragment or a sudden thought with no explanation, rewrite it.

## Hard line
Language and clarity only. If fixing a sentence would require changing what it *claims*, stop and flag it for a human — never invent or soften a sourced fact to make the prose nicer.
