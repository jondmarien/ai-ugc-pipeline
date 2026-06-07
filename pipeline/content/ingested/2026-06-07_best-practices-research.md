# Research: IG carousel best practices (validation pass for Deltas 1–8)
**Captured:** 2026-06-07 · Run to validate/extend the @growithalex ingests before applying deltas to the pipeline.

## Findings and tags

| Finding | Tag | Sources |
| --- | --- | --- |
| Top ranking signals: watch time, likes per reach, **sends per reach** (Mosseri, Jan 2025); saves weighted above likes | [Verified] | Sydium analysis citing Mosseri; Meta Transparency Center (IG Feed ranking signals include reshares/sends, saves, dwell time) |
| Carousels are the most-saved format and lead engagement-per-reach; Reels lead raw reach | [Verified] | Socialinsider 15M-post study (Oct 2025–Mar 2026); Socialinsider 35M-post 2026 benchmarks; Buffer 52M-post 2026 report |
| Carousel **re-serve mechanic**: IG can resurface a swiped-past carousel starting from slide 2, so every slide must stand alone | [Verified] | Socialinsider 2026 benchmarks; posteverywhere/getkoro guides (consistent across ≥3 independent writeups) |
| 8–10 slides = engagement sweet spot, but completion rate (target ~55%+) and swipe-through (~65%+) matter more than count; never pad | [Emerging] | Hootsuite + Later analyses as cited by Sydium; exact thresholds are third-party, not Meta-official |
| First slide carries ~80% of carousel engagement | [Emerging] | Mentionlytics (single source; directionally consistent with everything else) |
| Mixed-media carousels (images + 1–3 short video slides) outperform image-only (~2.33% vs ~1.80%) | [Verified] | Socialinsider media-type breakdown, corroborated by CollabKit H1-2026 sample |
| Hashtags don't meaningfully drive reach; 3–5 relevant tags max, categorization only; keyword-rich captions are the search/recommendation lever | [Verified] | Mosseri on record (Build Your Tribe podcast, Apr 2025, via Social Media Today); multiple 2026 guides |
| Adding music to a carousel can surface it in Reels-adjacent recommendation surfaces | [Emerging] | Instagram creators blog (Feb 2025) recommends audio on posts/carousels for distribution; magnitude unquantified |

## What this changed in the deltas

- Deltas 1–4 and 7–8 confirmed; Delta 3 (standalone test) upgraded from taste to **verified mechanism** (re-serve).
- New, from research (applied alongside): hashtag guidance corrected to 3–5 + caption-keyword note (CAPTION_BANK §6), slide-count/completion guidance added to the carousel skill.
- **Backlog, not applied:** mixed-media carousels (a video slide inside the carousel) are a renderer feature (schema + Remotion export per-slide video). Worth a look; ~29% engagement premium is well-sourced. Tracked here, structural effort.

## Sources

- https://www.socialinsider.io/social-media-benchmarks/instagram-engagement-report
- https://www.socialinsider.io/social-media-benchmarks/instagram
- https://sydium.com/blog/instagram-carousel-strategy
- https://www.socialmediatoday.com/news/instagram-chief-answers-creator-questions/744813/
- https://transparency.meta.com/features/explaining-ranking/ig-feed
- https://creators.instagram.com/blog/helping-creators-of-all-sizes-break-through
- https://posteverywhere.ai/blog/instagram-carousel-best-practices
- https://collabkit.me/blog/instagram-reels-vs-carousels-vs-images-data-study-2026
