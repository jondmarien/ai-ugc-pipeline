# Ingested: "Master Carousel Covers — 5 Rules, No Theory"
**Source:** https://www.instagram.com/p/DaiY7vmkoYJ/ · **Handle:** @adarshxdesign (graphic design / design-education niche) · **Captured:** 2026-07-08 · **Posted:** ~7h before capture · **Engagement:** 364 likes / 144 comments / 10 shares

## Slide map

8 slides. Consistent header furniture (date · handle · category, small tracked caps) over full-bleed cinematic landscape photography, one grade per slide but a shared cool/desaturated look. Every rule slide (3–7) repeats the exact same skeleton: pill badge → bold mixed-weight headline → italic one-line subhead → Before/After split with pill toggle labels → two floating cover mockups with drop shadow → italic caption under each mockup.

| # | Role | Idea (paraphrased) / layout notes |
|---|------|--------------------------------|
| 1 | Cover | "Master Carousel covers. 5 Rules, No theory." Huge black lowercase wordmark for the topic word, misty mountain hero image with a silhouetted figure. Below the headline: 3 tilted, overlapping mini mockups of *other* carousel covers (a visual promise of "here's what's inside/what you'll be able to make"). Bottom strip: a two-clause pain-point line, second clause accent-colored — "your content is great. your cover is **why nobody sees it**." |
| 2 | Concept/context | "Your cover slide is your first impression" (accent italic on the second half) + "it has 2 seconds to stop the scroll and earn the swipe." White horse on black background. First Before/After pair (white pill "Before" / green pill "After"), establishing the recurring device before the numbered rules start. |
| 3 | Rule-1 | Pill badge "Rule-1". "Make your text bold, big & easy to scan" / "If it's small, it'll fail." Before = small centered text, hard to read. After = big bold left-aligned headline. |
| 4 | Rule-2 | "Rule-2". "Use strong visuals that support your message" / "A powerful image > a generic stock." Before = flat white card. After = same layout with a striking photo background. |
| 5 | Rule-3 | "Rule-3". "Make your hook clear & benefit-driven" / "one cover, one message, delete the rest." Before = topic-framed headline ("Best Pinterest Alternative Websites"). After = result-framed headline ("stop using pinterest"). |
| 6 | Rule-4 | "Rule-4". "Use contrast to make your cover pop" / "High contrast = high attention." Before = low-contrast photo blending into background. After = high-contrast version, same photo. |
| 7 | Rule-5 | "Rule-5". "Keep it clean, focused & on-brand" / "Simplicity builds trust." Before = cluttered cover with 3+ colors, icons, extra graphics. After = single accent color, minimal elements. |
| 8 | CTA | "comment 'carousel'" for a "complete Carousel Playbook with 25 viral hook formulas, cover frameworks, and my exact posting checklist." Save-bait icon + line ("save for later"), floating profile card (avatar, handle, follower/post counts, one-line bio), full brand wordmark letter-spaced across the bottom, ocean/sky background.

## Caption anatomy

One-line hook restating the thesis ("Most carousel covers get ignored. These simple design tweaks can change that"), a spacer, a bare "Follow @handle for more" callout, then 5 hashtags (niche + broad mix: #fontstyle #aidesign #typographicdesign #graphicdesigntools #graphicdesigner). No body copy, no restated value — all of the actual teaching happens on-slide, caption is pure hook + follow nudge.

## Claims check

| Claim | Tag | Note |
|---|---|---|
| "It has 2 seconds to stop the scroll and earn the swipe" | [Emerging] | Common design-influencer framing of attention span; not sourced to Meta or independent research in this post. Doesn't enter our copy verbatim regardless. |
| "High contrast = high attention" | [Emerging] | Directionally consistent with general visual-perception principles but stated as an absolute; a design opinion, not a cited claim. |

No cybersecurity- or growth-adjacent factual claims to verify; this is a design-craft post, not a stats post.

## Why it works (and where engagement is inflated)

The post *demonstrates its own advice*: the cover itself uses rule-4's contrast and rule-5's single-accent-color discipline. The Before/After device is the real engine — it turns a design opinion into a visual proof a reader can verify in under a second, and it's identical across all 5 rules, so once the reader learns the pattern on slide 2 they can skim slides 3–7 in a couple seconds each (high completion odds). **Inflation check:** 144 comments against 364 likes is a normal-ish ratio, but skimming them shows a cluster of bare "Carousel" replies (a comment-keyword DM-funnel trigger from the CTA slide) mixed with genuine compliments ("Sooo good", "Taking notes") — some real engagement, some funnel throughput. Treat the comment count as partially inflated, not purely organic.

## Transfer to our niche

**Steal:**
- The **Before/After split with pill-label toggle** — this transfers *better* to cybersecurity than to design tips: "insecure config vs hardened config," "vulnerable code vs patched," "before MFA vs after MFA," "unmonitored vs alerted" are natural defender content and we don't have a slide format for direct comparison today.
- The **two-clause pain-point line under the cover headline** ("your content is great. your cover is *why nobody sees it*.") — names the reader's problem in their own frame, second clause accent-colored for emphasis. Our cover slide has a kicker + headline + subline + swipe-cue pill but no equivalent problem-naming closer.
- **Numbered rule/step pill badges** ("Rule-1" … "Rule-5") as a lightweight per-slide progress marker for structured, numbered content (defensive checklists, hardening steps).

**Skip:**
- The **3-mockup preview collage on the cover** (tilted stack previewing "other carousels inside"). This works for a design-tips account showing genuinely different finished products; we publish single-topic posts with no equivalent library of "other slides" to preview, and stacking extra imagery on our cover would fight our one-message-per-slide discipline (`QA_CHECKLIST.md`, standalone-slide rule from the growithalex ingest). Misfit, not a delta.
- **Comment-keyword CTA gating a lead magnet** — already rejected by policy in the growithalex ingest (`2026-06-07_growithalex_carousel-system.md`, Delta 5); same reasoning applies here (no DM automation, CLAUDE.md requires human-gated manual posting).

**Gap vs our pipeline:** `renderer/src/components/carousel/slides.tsx` has `CoverSlide` (kicker, headline, subline, swipe-cue) and a `point` role for generic body slides, but no comparison layout and no pill-badge kicker variant. `renderer/src/lib/schema.ts`'s `SlideRole` enum has no role for a two-sided comparison.

## Pipeline deltas

### Delta 1 — Before/After comparison slide role
- **Target:** `renderer/src/lib/schema.ts` (`SlideRole` enum, line 16; `ROLE_FILENAME`, line 34), `renderer/src/components/carousel/slides.tsx` (new `CompareSlide` export alongside `CoverSlide`/`TakeawaySlide`), `renderer/docs/CONTENT_SCHEMA.md`, `.claude/skills/ai-cybersecurity-ugc-carousel/SKILL.md` (slide arc)
- **Change:** Add `"compare"` to `SlideRole` and `ROLE_FILENAME` (`compare: "compare"`). Add a `compare` field to the slide schema: `{ before_label: string, before_copy: string, after_label: string, after_copy: string }` (reuses existing `chain[]` precedent of a role-specific structured field). Build `CompareSlide` using the existing `Kicker`/`Headline`/`Subline` primitives plus two side-by-side panels with a small pill label per side (accent-colored "After" pill, muted "Before" pill, matching our existing pill styling in `SwipeCue`). Document the role and give the carousel skill a case where it applies (hardened vs default config, patched vs vulnerable, monitored vs blind spot).
- **Why:** Direct structural lift from slides 2–7; the mechanic transfers more naturally to defensive/hardening content than to the source niche.
- **Risk/misfit:** Only fits posts with a genuine binary state (config, code, control on/off); don't force it onto topics without a clean before/after. Keep it as an option for the `point` role, not a replacement.
- **Effort:** small

### Delta 2 — cover pain-point closer
- **Target:** `renderer/src/components/carousel/slides.tsx` (`CoverSlide`, ~line 120), `pipeline/content/CAPTION_BANK.md` §1 Cover Hook Formulas, `.claude/skills/ai-cybersecurity-ugc-carousel/SKILL.md` (cover slide row)
- **Change:** Add an optional `slide.closer` field (or reuse `subline` if unused on cover) rendered as a small two-clause line at the base of the cover: plain-color setup clause + accent-colored consequence clause, e.g. "your prompts are fine. the injection **isn't in the prompt**." Add 2-3 formula templates to the Cover Hook Formulas section in this shape.
- **Why:** Slide 1's bottom line is the sharpest single element on the cover; it reframes the topic as the reader's problem instead of a neutral headline.
- **Risk/misfit:** Must stay factual/mechanism-grounded, not a growth-guru attention-grab; keep it tied to the post's actual claim so it doesn't read as clickbait.
- **Effort:** trivial

### Delta 3 — numbered step pill badge for checklist-style posts
- **Target:** `renderer/src/components/carousel/CarouselSlide.tsx` (new `RuleBadge`/`StepBadge` export beside `Kicker`, ~line 186), `renderer/src/design/tokens.ts` (pill styling constants if not already present)
- **Change:** Small reusable pill component (rounded, bordered or filled, accent or neutral) rendering `"Step {N}"` / `"Rule {N}"` above the headline on `point` slides for posts that are structured as a numbered list (e.g. hardening checklists), as an alternative to the current text-only `Kicker`.
- **Why:** Slides 3–7's "Rule-N" pill is a stronger progress marker than a plain kicker line for numbered content; cheap to add without touching existing slides that don't use it.
- **Risk/misfit:** Only apply to posts that are genuinely a numbered sequence; forcing it onto non-sequential posts adds visual noise for no reason.
- **Effort:** trivial

### Delta 4 — rejected by policy / misfit: cover preview collage
- **Target:** n/a
- **Change:** none proposed.
- **Why:** The 3-mockup stack previewing "other content inside" doesn't map to our single-topic, single-message-per-slide posts and would conflict with the standalone-slide rule already encoded from the growithalex ingest.
- **Effort:** n/a

### Delta 5 — rejected by policy: comment-keyword CTA funnel
- **Target:** n/a
- **Change:** none proposed.
- **Why:** Already rejected in `2026-06-07_growithalex_carousel-system.md` Delta 5; no DM automation exists, and CLAUDE.md requires human-gated manual posting. Same reasoning applies to this post's "comment 'carousel'" CTA.
- **Effort:** n/a
