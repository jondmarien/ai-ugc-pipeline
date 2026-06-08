# Carousel — UI kit

The brand's core product: an Instagram **carousel** (1080×1350, 4:5), 8 slides following the
fixed narrative arc `cover → context → risk → mechanism → failure_point → defense → takeaway → cta`.

`index.html` recreates how a finished carousel actually appears in feed — a neutral social-preview
card with a swipeable deck, dots, like/save affordances, and the caption. Two real approved posts are
included: **prompt-injection-agents** (defensive / blue) and **hexstrike-ai-v6** (offensive / red).
Use ← / → , the arrows, the dots, or swipe.

## Files
| File | Role |
| --- | --- |
| `index.html` | Interactive social-preview viewer + post switcher (mounts everything). |
| `slides.jsx` | `CarouselSlide` — maps a slide `role` to a layout built from the DS primitives. |
| `data.js` | `window.CAROUSEL_POSTS` — two posts of real content + background paths. |

## How it composes the system
Every slide is a `SlideShell` (background + accent hairline + brand mark + pagination + feathered
text plate) filled with `Kicker` / `Headline` / `Subline` / `Chip`. The theme accent comes from a
`theme-*` class on the card wrapper — swapping it recolours the whole deck. Nothing here re-implements
a primitive; it only arranges them, exactly like the pipeline's `SLIDE_COMPONENTS` registry.

## Slide roles
- **cover** — bottom-aligned hero headline (104px), kicker, subline, `Swipe →` chip.
- **context / risk / mechanism / failure_point / defense / point** — standard body: kicker + 76px headline + subline.
- **takeaway** — centered, 96px headline with `[[accent]]` / `{{danger}}` emphasis markup, minimal copy.
- **cta** — headline + subline + `Comment + Save` chip.
