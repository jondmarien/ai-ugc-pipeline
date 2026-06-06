# Attribution

This `professional-proofreader` skill is adapted for this repo from the concept in
[`sickn33/antigravity-awesome-skills` → `skills/professional-proofreader`](https://github.com/sickn33/antigravity-awesome-skills/tree/main/skills/professional-proofreader)
(marked `risk: safe`, `source: original`; no explicit license stated in the source SKILL.md).

The instructions here were **authored fresh** for the ai-ugc-pipeline (not copied/cloned) and
tuned to this project's needs: it runs as the final caption/narration pass after the `humanizer`,
adds **dash hygiene** (glued hyphenated compounds, no em-dashes in narration, no mid-word line
breaks) and a **substance/reads-aloud** check on top of standard grammar proofreading, and
inherits the non-negotiable rule that sourced facts/claim_tags are never altered for style.

Pairs with: `humanizer` (voice), `ai-cybersecurity-ugc-carousel` (content), and the QA gate in
`pipeline/content/QA_CHECKLIST.md`.
