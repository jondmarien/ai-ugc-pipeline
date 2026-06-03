---
name: humanizer
description: Rewrite AI-generated copy so it reads like a human wrote it — strip the AI tells (em-dash spam, listicle cadence, "delve/leverage", significance inflation, voice-flat symmetry, generic CTA closes) and match this brand's calibrated voice (see references/voice-profile.md). Use when drafting or polishing a post caption, reel narration, or on-slide copy, or whenever text "sounds like AI". For the ai-ugc-pipeline content workflow.
---

# Humanizer

Make AI-assisted copy sound like a person wrote it — specifically like **Jon ("chrono")**, the voice behind this account. Not by running a generic "clean it up" pass that flattens everything to the median, but by killing the patterns that read as machine-made while keeping the traits that read as *him*.

> Pattern catalogue based on [blader/humanizer](https://github.com/blader/humanizer) (MIT) and Wikipedia's [Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing). Tuned for this brand's voice. See `references/voice-profile.md` for the calibrated profile.

## When this runs

In the content pipeline, this is the **humanize pass** after the caption / `narration[]` / `on_slide_copy` are drafted and before validation. It also fires on "rewrite this," "this sounds like AI," or "write this in my voice." Content rules always win over voice: **never invent or soften a sourced fact to sound more natural** — humanizing is about *how* it reads, not *what* it claims.

## The two lists

**KEEP (this is the voice — do not sand these off):**
- First person, direct, dry confidence. A little playful when it earns it.
- Contractions. Fragments for punch. The occasional one-line landing ("It fits.").
- **Em-dashes used sparingly and deliberately** — Jon's real prose uses them. The enemy is *overuse* (two+ in a short paragraph, dash-as-cheap-amplifier), not the mark itself.
- Concrete specifics: real numbers, tools, named systems (e.g. "28.4K requests, 0% error rate", ">90% across 109+ tests"). Specificity is the strongest human signal.
- Security-native vocabulary, practitioner framing, no hype.
- One emoji *maximum*, only where it genuinely fits the line (a wink, not decoration).

**KILL (the AI tells):**
- **Significance inflation** — "marks a pivotal moment", "a testament to", "in today's rapidly evolving landscape". Cut.
- **AI vocabulary** — delve, leverage, harness, unlock, navigate, foster, elevate, embark, robust, seamless, comprehensive, holistic, tapestry, realm. Use the plain word.
- **Negative parallelism** — "It's not just X, it's Y." State Y directly. (At most once per post, only if it's doing real work.)
- **Rule of three / forced tricolons** — "fast, cheap, and secure." Use the natural number of items.
- **Em-dash overuse / punch-up punctuation** — replace surplus dashes with a period, comma, colon, or parenthesis. Keep the few that are deliberate.
- **Listicle brain** — bullets where prose belongs; `**Header:** description` lines in a caption.
- **Vague attribution** — "experts say", "studies show", "industry observers note". Name the source or cut it.
- **Hedging stacks** — "could potentially possibly". Pick one.
- **Sycophancy / chatbot residue** — "Great question!", "I hope this helps!", "Let's dive in", cutoff disclaimers.
- **Generic CTA close** — "The future looks bright", "Stay tuned." End on a specific question or the sharpest line of the argument.
- **Voice-flat symmetry** — every sentence the same length, fluent and forgettable. Vary rhythm (burstiness): short, then a longer one that builds, then a fragment.
- **Boldface/emoji spam, Title Case Headings, curly-quote tells.**

## Workflow (3 passes)

1. **Strip** — remove the KILL patterns above. Swap AI vocab for plain words; thin out em-dashes to the deliberate ones; break any tricolon/negative-parallelism; cut filler and vague attribution.
2. **Re-voice** — apply `references/voice-profile.md`: vary sentence length, add at least **one voice-signal line** that could only be Jon (a specific aside, a dry call, a real number), make the stance visible, end on something specific.
3. **Audit** — read it back cold and ask "would this obviously read as AI?" Run the pre-publish scan below. If anything trips, do one more targeted rewrite.

## Pre-publish scan (fast)

- Em-dash count: only the deliberate ones survive (no 2+ in a short paragraph).
- AI-vocab scan: zero from the KILL list.
- Hook: not a symmetric two-clause "X, but Y" opener; not generic.
- "not just X, but Y": zero or one.
- Rhythm: visibly uneven sentence/paragraph lengths.
- Voice signal: at least one line that's unmistakably Jon (point to it).
- Close: a specific question or the strongest line — never a generic CTA.
- Facts intact: every claim still matches its source and claim_tag. Nothing invented to sound smoother.
