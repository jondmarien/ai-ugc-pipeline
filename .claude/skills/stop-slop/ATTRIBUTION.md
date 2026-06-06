# Attribution

Adapted from **[hardikpandya/stop-slop](https://github.com/hardikpandya/stop-slop)** by
Hardik Pandya (https://hvpandya.com), **MIT License** — freely usable and shareable.

This repo's `SKILL.md` was authored fresh (not copied) to fit the ai-ugc-pipeline: it applies to
this project's specific surfaces (caption, narration, on_slide_copy, subline, alt_text), keeps the
source's banned-pattern lists + the 5-dimension score (directness / rhythm / trust / authenticity
/ density, revise if < 35/50), and adds two project rules — (1) the calibrated **voice-profile**
(`humanizer`) wins on Jon's *deliberate* em-dashes/fragments so we don't sand him to median, and
(2) sourced facts/claim_tags are never altered for style.

Pipeline order: `humanizer` → `stop-slop` → `professional-proofreader`.
