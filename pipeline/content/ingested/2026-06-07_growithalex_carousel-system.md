# Ingested: "Steal My Carousel System" (6 rules)
**Source:** https://www.instagram.com/p/DYfVqEmk_to/ · **Handle:** @growithalex (creative strategist, creator-economy niche) · **Captured:** 2026-06-07 · **Posted:** May 18 · **Engagement:** 5.2K likes / 5.6K comments / 120 shares

## Slide map

9 slides. Editorial-print aesthetic: 1 serif display + 1 sans body, full-bleed photography with one floating subject, numbered badge per rule, consistent header furniture (date · handle · title).

| # | Role | Idea (paraphrased) |
|---|------|--------------------|
| 1 | Cover | "Steal my carousel system. 6 rules. Every carousel. No exceptions." Big serif, product-mockup imagery. |
| 2 | Rule 1 | The cover's only job is stopping the scroll, not explaining the topic. Big font, high contrast, a promise or a number. Covers needing more than 8 words lose the reader. |
| 3 | Rule 2 | Slide 2 must confirm the hook immediately (set up the problem, create stakes) or the reader swipes out. The cover gets the swipe; slide 2 earns the rest. |
| 4 | Rule 3 | Every slide must land as a standalone screenshot. Max two fonts, high contrast, one idea per slide. |
| 5 | Rule 4 | Each carousel needs one slide worth saving on its own (a framework, a prompt, a fill-in-the-blank, a quotable line). That slide converts reach into saves. |
| 6 | Rule 5 | He never writes carousel copy from scratch: AI gets topic + angle + brand context and returns a slide-by-slide structure; he edits. "AI handles the architecture, you handle the taste." |
| 7 | Rule 6 | The caption is a second post and the CTA is the engine: restate the idea, add context, include a comment trigger that starts DMs / shares a freebie / grows the list. |
| 8 | Synthesis | Carousels build the brand on your profile, deliver save-worthy value, and feed the rest of the funnel. |
| 9 | CTA | Face-to-camera photo, "comment CAROUSEL" for the Google Doc + the AI prompts he uses. Sign-off: "My name's Alex. Create smarter." |

## Caption anatomy

Opens with a reframe (carousel = swipe funnel, not slideshow), assigns a job to each slide tier, names the failure mode ("the carousel leaks"), then a comment-keyword CTA ("Comment CAROUSEL") gating a lead magnet, then a branded sign-off. The caption restates and extends the carousel rather than summarizing it.

## Claims check

Craft opinions, not factual claims. No tagging needed; nothing here enters post copy as fact.

## Why it works (and where engagement is inflated)

The structure is the product: the post demonstrates its own rules (cover under 8 words, slide 2 stakes, screenshot-standalone slides, slide 5–6 are the save-bait). **Inflation warning:** 5.6K comments exceed 5.2K likes and are nearly all the single word "Carousel" — that's a DM-automation funnel (likely ManyChat-style), not organic discussion. Treat the comment count as funnel throughput, not content quality signal.

## Transfer to our niche

**Steal:** the per-slide job descriptions (cover = stop scroll, slide 2 = prove the hook, every slide = standalone, one slide = save-object), the 8-word cover cap, the two-font discipline (renderer already enforces a design system), "AI handles architecture, you handle taste" (literally our pipeline's philosophy — worth encoding as a review gate rather than a vibe).

**Skip:** comment-keyword DM funnels. We have no DM automation, manual upload only, and growth-hack mechanics undercut a technical-credibility account. A soft version (offer a resource, reply manually) is possible later but is a strategy decision, not a pipeline delta.

## Pipeline deltas

### Delta 1 — 8-word cover gate
- **Target:** `pipeline/content/QA_CHECKLIST.md` (cover readability item, ~line 119) + `pipeline/content/CAPTION_BANK.md` §1 Cover Hook Formulas
- **Change:** Add a hard check: "Cover copy is 8 words or fewer (excluding subline). If it needs more, the hook isn't sharp enough yet." Mirror the cap as a note atop the hook formulas.
- **Why:** Rule 1; our hook formulas have no length budget today.
- **Risk/misfit:** Technical hooks sometimes need a qualifier; allow the subline to carry it.
- **Effort:** trivial

### Delta 2 — slide-2 proof criterion
- **Target:** `.claude/skills/ai-cybersecurity-ugc-carousel/SKILL.md` (Context slide row, ~line 111) + `QA_CHECKLIST.md`
- **Change:** Redefine the context slide's job: "Slide 2 must prove the cover wasn't bait: state the problem and the stakes in the reader's terms. QA: would a skeptic who swiped think 'worth my time' from slide 2 alone?"
- **Why:** Rule 2; our arc has a context slide but no pass/fail criterion for it.
- **Risk/misfit:** None.
- **Effort:** trivial

### Delta 3 — screenshot-standalone test
- **Target:** `pipeline/content/QA_CHECKLIST.md`
- **Change:** Add: "Standalone test: each inner slide, screenshotted alone with no context, still communicates one complete idea (subject + verb + point on-slide)."
- **Why:** Rule 3; complements our existing no-fragments rule, which already forces complete sentences.
- **Risk/misfit:** None.
- **Effort:** trivial

### Delta 4 — designate the takeaway slide as the save-object
- **Target:** `.claude/skills/ai-cybersecurity-ugc-carousel/SKILL.md` (slide arc) + `pipeline/content/CAPTION_BANK.md` §3 Value Phase Templates
- **Change:** Require the takeaway slide (N−1) to be an explicit save-object: a named checklist, decision rule, query/detection snippet, or fill-in-the-blank framework a defender would screenshot. Add 2–3 save-object formats to the Value Phase templates.
- **Why:** Rule 4; saves are the highest-intent signal and our takeaway slide currently asks for a takeaway but not a *saveable* one.
- **Risk/misfit:** Forcing a framework where the topic doesn't have one produces listicle slop; allow "sharp quotable rule" as the fallback format.
- **Effort:** small

### Delta 5 — rejected by policy: comment-keyword DM funnel
- **Target:** n/a
- **Change:** none proposed.
- **Why:** Rules 6/9 drive a gated-freebie DM loop. We post manually, have no automation, and CLAUDE.md requires human approval with no auto-publishing; bolting this on now adds risk with no infrastructure to serve it.
- **Effort:** n/a
