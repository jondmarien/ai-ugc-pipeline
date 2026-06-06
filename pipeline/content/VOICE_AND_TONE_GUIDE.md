# Voice & Tone Guide

The single source of truth for how this account *sounds*. Other docs (CAPTION_BANK, CONTENT_PIPELINE, QA_CHECKLIST, the carousel skill) point here instead of redefining voice. The matching machine-applied version lives in the **`humanizer`** skill (`.claude/skills/humanizer/`), with the calibrated profile at `.claude/skills/humanizer/references/voice-profile.md`.

> **Positioning:** real threats, real tools, **no fake panic**. Viral packaging is allowed; fake certainty is not.

---

## 1. The house voice
Sharp, practical, dry, first-person. We talk to practitioners and builders as peers. Confidence comes from having done the thing, not from adjectives. Curiosity plus a little paranoia, never doom. This is Jon ("chrono"): see `voice-profile.md` for the calibrated cadence (contractions, concrete numbers, varied sentence length, ≤1 emoji). **No em-dashes and no sentence fragments anywhere** (hard rule): complete sentences with plain punctuation.

| We do | We don't |
|---|---|
| Curiosity-driven, specific hooks | Fake panic, invented numbers, fabricated CVEs/quotes |
| Tag every claim `[Verified] / [Emerging] / [Scenario]` | State scenarios as confirmed events |
| Pick altitude per post (high-level by default; offensive posts may go deep/technical when educational) | Give turnkey instructions whose only purpose is indiscriminate real-world harm |
| End every post with a defender takeaway | Leave the audience with hype and no action |
| Cite a primary/reputable source when factual | Name real victims without a cited source |

## 2. Hook formula
`specific actor/object + unexpected AI action + clear consequence`. Reframe the reader's assumption; don't just state a fact.

| Weak | Better |
|---|---|
| "AI is changing cybersecurity" | "AI phishing just made your old awareness training obsolete" |
| "Prompt injection is dangerous" | "The weirdest AI attack hides where your agent reads" |
| "Data leakage is a problem" | "Employees are pasting secrets into chatbots and calling it productivity" |

## 3. Caption structure
First line sharpens the hook → context in plain language → translate to security risk → **defender takeaway** (one concrete control) → a specific, easy-to-answer question → light follow CTA. Nuance lives in the caption, not the headline.

## 4. The de-AI ruleset (keep / kill)
The whole point: kill the patterns that read as machine-made, keep the traits that read as *Jon*. The `humanizer` skill enforces this; the short version:

**Keep:** contractions, real numbers/tool names, dry confidence, a visible stance, varied sentence length, one well-placed emoji max.

**Kill:** **em-dashes entirely** (`—`/`–`, every surface) and **sentence fragments** (complete sentences only); AI vocab (delve, leverage, harness, seamless, robust, comprehensive, tapestry, landscape, realm); "it's not just X, it's Y"; forced rule-of-three; listicle-where-prose-belongs; vague attribution ("experts say"); hedging stacks; sycophancy/chatbot residue ("let's dive in"); generic CTA closes ("the future looks bright"); voice-flat symmetry (vary sentence length).

## 5. Pre-publish voice scan
- Em-dashes: ZERO (`—`/`–` banned, every surface). Fragments: ZERO (complete sentences only).
- AI-vocab: zero from the kill list.
- "not just X, but Y": zero or one.
- Rhythm: visibly uneven sentence/paragraph lengths.
- **Voice signal:** at least one line only Jon would write (a number, a dry aside, a named tool). If you can't point to it, add it.
- Close: a specific question or the strongest line — never a generic CTA.
- Facts intact: every claim still matches its source + claim_tag. Voice never invents or softens a fact.

## 6. What stays templated (don't drift)
The 8-slide arc (`cover → context → risk → mechanism → failure_point → defense → takeaway → cta`); the mandatory defender takeaway; the `[Verified]/[Emerging]/[Scenario]` tagging; the no-fabrication / no-offensive-how-to rules. Voice flexes *within* these; it never overrides them.
