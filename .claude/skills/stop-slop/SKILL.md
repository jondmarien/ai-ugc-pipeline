---
name: stop-slop
description: >
  Strip predictable AI writing patterns ("slop") from prose. In this pipeline, run it over the
  post's caption, video.narration[], on_slide_copy, subline, AND alt_text — after the humanizer,
  before the professional-proofreader. Also fires on "remove AI patterns", "this sounds like AI",
  "de-slop this". Adapted (MIT) from hardikpandya/stop-slop — see ATTRIBUTION.md.
---

# Stop Slop

Kill the tells that mark text as machine-made. Then score it. Applies to every surface the
audience reads or hears: the reel **caption** (IG description), the **narration** (which becomes
the burned-in captions), each **on_slide_copy** + **subline**, and the **alt_text**.

## Cut these
- **Throat-clearing openers:** "In today's world…", "It's important to note…", "When it comes to…", "Let's dive in", "At its core". Start on the point.
- **Filler / hedging:** "very", "really", "quite", "in order to", "the fact that", "it is worth noting", "needless to say". Delete.
- **Adverb crutches:** "basically", "essentially", "actually", "literally", "simply", "arguably". Almost always cuttable.
- **Emphasis crutches:** "truly", "incredibly", "game-changing", "revolutionary", "powerful" used as filler.
- **Business/AI jargon:** delve, leverage, harness, unlock, navigate, foster, robust, seamless, holistic, synergy, "in the realm of", "navigate the landscape".
- **Binary-contrast cliché:** "It's not just X, it's Y" / "not only… but also". State Y. (At most once per post, only if it earns it.)
- **Rhetorical setups & structural clichés:** "Here's the thing:", "But here's the kicker", "The result?", "What does this mean?".
- **Vague declarations:** "this changes everything", "the future is here". Be specific — name the thing, the number, the action.

## Sentence rules
- **Active voice, human subject.** No "mistakes were made"; no inanimate objects doing human things ("the data tells us") unless deliberate.
- **Vary rhythm (burstiness):** a short sentence, then a longer one that builds, then a short one. Avoid every sentence the same length. (All complete sentences.)
- **Be concrete:** real numbers, named tools/systems, specific actions over abstractions.
- **Em-dashes — BANNED, no exceptions** (`—` and `–`), on every surface: caption, narration, on_slide_copy, subline, alt_text. Replace with a period, comma, colon, parentheses, or "and"/"but", and restructure if needed.
- **Sentence fragments — BANNED.** Every line is a complete sentence/clause (subject + verb). No telegraphic noun-piles, no one-word "punch" lines.

## Score it (revise if < 35/50)
Rate the copy 1–10 on each, then fix the lowest:
1. **Directness** — gets to the point, no throat-clearing.
2. **Rhythm** — varied sentence length, reads aloud naturally.
3. **Trust** — respects the reader; no over-explaining the obvious.
4. **Authenticity** — sounds like a person (Jon), not a model.
5. **Density** — every line earns its place; no filler.

## Hard rule
De-slopping is **style only**. Never invent, drop, or soften a **sourced fact, number, CVE, quote, claim_tag, or source** to make a line punchier. If a fix would change what the copy *claims*, leave it and flag it.

## Order in the pipeline
write → **humanizer** (Jon's voice) → **stop-slop** (de-slop + score) → **professional-proofreader** (grammar, substance, dash hygiene). Voice and facts both outrank slop rules where they conflict.
