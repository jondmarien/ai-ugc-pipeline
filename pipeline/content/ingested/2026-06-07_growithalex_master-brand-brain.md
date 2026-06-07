# Ingested: "The One Page System" (Master Brand Brain, 4 pillars)
**Source:** https://www.instagram.com/p/DX7OwtUkxmr/ · **Handle:** @growithalex · **Captured:** 2026-06-07 · **Posted:** May 4 · **Engagement:** 140 likes / 175 comments / 5 shares

## Slide map

10 slides. Same editorial system as the carousel-system post; this one alternates photo slides (setup/problem/fix) with flat paper-texture "pillar" slides.

| # | Role | Idea (paraphrased) |
|---|------|--------------------|
| 1 | Cover | "The one page system that makes every piece of content on-brand before you even start." Built inside Claude. |
| 2 | Setup | Branding isn't logo/colors/font; it's the foundation that connects content. Without it every piece starts from zero. |
| 3 | Problem | Most creators have one pillar figured out, maybe two; that's why their content feels close but never lands. |
| 4 | Fix | A real brand has four pillars that agree with each other: Positioning, Voice, Visual Identity, Story. |
| 5 | Pillar 1 | Positioning: who it's for, what you stand for, what you're against. Vague positioning ("I help X grow") says nothing; specific outcome-positioning says everything. |
| 6 | Pillar 2 | Voice: the words you use and the words you never use. Test: with your name removed, would readers know a caption is yours? |
| 7 | Pillar 3 | Visual identity: not a palette, a system; a reason each color exists and a rule for when it shows up. |
| 8 | Pillar 4 | Story: the through-line; why you do this, who you were, what you believe. It makes strangers care before consuming anything. |
| 9 | Principle | When the four pillars agree, brand decisions stop being made per-post; every surface pulls from the same brain. |
| 10 | CTA | All four pillars built inside one AI project in an afternoon. "Comment MASTER" for the breakdown. |

## Caption anatomy

Personal-build narrative ("six months ago I built…"), names the asset (Master Brand Brain), reframes branding as "the operating system underneath your content," lists the four pillars, then the comment-keyword CTA and the same branded sign-off. Hashtags: #branding #contentcreator #claude.

## Claims check

Craft framework, not factual claims. Nothing to tag.

## Why it works (and where engagement is inflated)

The four-pillar framework slide and the voice "name-removed test" are the save-objects. **This post underperformed his other one massively** (140 likes vs 5.2K): same system, weaker hook (abstract "one page system" vs concrete "steal my carousel system, 6 rules"). Comments again keyword-flooded ("Master"), so the 175-comment count is funnel throughput. Useful negative example: the system only pays when the cover makes a concrete, countable promise.

## Transfer to our niche

**Steal:** the brand-brain concept itself. Our pipeline already has voice (VOICE_AND_TONE_GUIDE + humanizer voice-profile) and visual identity (renderer themes mapped to pillars), but **positioning and story exist nowhere in the repo**, which means every /draft-post re-derives "who is this for and why does Jon say it" from scratch. Consolidating the four pillars into one canonical doc that /draft-post loads is exactly the "same brain, different surface" mechanic. Also steal the name-removed voice test as a QA gate, and the cover lesson from the engagement gap (concrete + countable beats abstract).

**Skip:** the comment-keyword funnel (same reasoning as the carousel-system ingest, Delta 5 there).

## Pipeline deltas

### Delta 6 — create BRAND_BRAIN.md (four pillars, one file)
- **Target:** new file `pipeline/content/BRAND_BRAIN.md`; referenced from `.claude/commands/draft-post.md` step 1 and `CLAUDE.md` "Read first" line
- **Change:** One canonical doc with four sections. Positioning: who the content is for (defenders, security-curious devs, students), what we stand for (real threats, real tools, no fake panic), what we're against (FUD, hype, fabricated breaches). Voice: pointer to VOICE_AND_TONE_GUIDE.md + humanizer voice-profile (don't duplicate). Visual identity: the theme→color logic that currently lives only in CLAUDE.md/renderer docs, with the *when each color shows up* rule. Story: Jon's through-line (ISSessions, BearHacks, why he covers AI×security), written once, reusable for bios/CTAs/about slides.
- **Why:** Slides 4–9; two of four pillars are currently undocumented, and /draft-post has no single brand context to load.
- **Risk/misfit:** Another doc to keep current; mitigate by making it mostly pointers plus the two missing pillars.
- **Effort:** small

### Delta 7 — name-removed voice test
- **Target:** `pipeline/content/VOICE_AND_TONE_GUIDE.md` §5 Pre-publish voice scan
- **Change:** Add a scan item: "Name-removed test: strip the handle; would a regular reader still attribute this caption to Jon? If it could be any AI-security account, run the humanizer again."
- **Why:** Slide 6; it's a sharper, binary version of the de-AI scan's intent.
- **Risk/misfit:** Subjective; keep it as a judgment prompt, not a hard gate.
- **Effort:** trivial

### Delta 8 — concrete-promise cover heuristic
- **Target:** `pipeline/content/CAPTION_BANK.md` §1 Cover Hook Formulas
- **Change:** Add the A/B evidence as a note: a concrete, countable promise ("steal my X system, 6 rules") outperformed an abstract one ("the one page system") by ~37x likes on the same account in the same month. Prefer numbers, named objects, and verbs over abstractions on the cover.
- **Why:** Direct same-account natural experiment between these two ingested posts.
- **Risk/misfit:** n=2 posts, uncontrolled (timing, topic). Frame as heuristic, not law.
- **Effort:** trivial
