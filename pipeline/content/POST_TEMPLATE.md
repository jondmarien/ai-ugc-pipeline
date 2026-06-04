# POST_TEMPLATE.md — Reusable Single-Post Package

Copy this whole template for every carousel. It is the unit of work in [CONTENT_PIPELINE.md](CONTENT_PIPELINE.md).
Fill every field. Leave nothing as `[...]` before QA. Pull hooks/captions from [CAPTION_BANK.md](CAPTION_BANK.md) and prompts from [VISUAL_PROMPT_BANK.md](VISUAL_PROMPT_BANK.md). Gate with [QA_CHECKLIST.md](QA_CHECKLIST.md).

---

```markdown
# [Post Title]

**Post ID:** [yyyy-mm-dd-topic-slug-001]
**Pillar:** [Offensive AI / Defensive AI / Model Security / Data Leakage / Governance / Myth-busting]
**Status:** [Idea / Drafted / Visual-ready / QA-ready / Approved / Posted]
**Primary audience:** [practitioners / founders / developers / students / executives]
**Core claim:** [One sentence.]
**Claim tag:** [Verified | Emerging | Scenario]
**Score:** cred __/5 · relevance __/5 · novelty __/5 · drama __/5 · defender __/5 → **total __/25**

## Source Notes
| Source | Link | What it supports | Confidence |
| --- | --- | --- | --- |
| [name] | [URL] | [claim] | [High/Med/Low] |

## Cover
- **Headline:** [short, dramatic, defensible — ALL CAPS or punchy]
- **Subline:** [optional 4–8 words]
- **Visual direction:** [cinematic scene]
- **Layout:** 1080×1350, dark lower-third, bold white headline, centered subject, accent color [cyan/green/red/electric-blue], small handle + "SWIPE →".

## Carousel Script (default 8 slides; configurable 3–20 via `slides=N`)
<!-- Slide count is set at creation (`bun run new --slides=N`). Keep `cover` as slide 1 and
     `cta` as the last; `takeaway` sits at N−1. For N>8, repeat generic `point` body slides
     between `defense` and `takeaway`. For N<8, drop the least-essential middle roles. -->

| # | Role | On-slide copy (≤ ~12 words) | Visual direction | Notes |
| --- | --- | --- | --- | --- |
| 1 | Cover hook | [headline] | [cover image] | Hook only |
| 2 | Context | [what happened / pattern] | [context image] | Plain language |
| 3 | Risk | [why it matters] | [impact image] | Security impact, not hype |
| 4 | Mechanism | [safe high-level how] | [mechanism metaphor] | No exploit steps |
| 5 | Failure point | [where teams are weak] | [gap image] | People/process/tooling |
| 6 | Defense | [practical control] | [control image] | Actionable |
| 7 | Takeaway | [one memorable line] | [summary image] | Save-worthy |
| 8 | CTA | [specific question] | [brand/CTA image] | Invite save/follow |

## Image Prompts
### Cover (no rendered text)
[paste from VISUAL_PROMPT_BANK.md, customized]

### Inner-slide family (shared style + per-slide subject)
[paste shared style block + slide 2–8 subjects]

## Caption
[Hook restated in one sentence.]

[What happened / what pattern is emerging — plain language.]

[Why it matters in practical security terms.]

[Defender takeaway: policy, detection, process, training, review, logging, access, or vendor risk.]

[One specific comment question.]

Follow for AI security breakdowns without the fake panic.

#AI #Cybersecurity #InfoSec #AISecurity #[topic tags]

## Alt Text (per slide)
1. [accessible description] … 8. [accessible description]

## Manual Upload Package
| Item | Value |
| --- | --- |
| Filename prefix | [YYYY-MM-DD_post-slug] |
| Slide count | [6–9] |
| Caption ready? | [Yes/No] |
| Sources checked? | [Yes/No] |
| QA approved? | [Yes/No] |
| Reel variant? | [No / link to VIDEO_ASSEMBLY_WORKFLOW.md output] |

## QA Notes
| Check | Result | Notes |
| --- | --- | --- |
| Claim supported & tagged | [Pass/Fail] | |
| No fake precision | [Pass/Fail] | |
| Safe mechanism (no abuse steps) | [Pass/Fail] | |
| Defender value included | [Pass/Fail] | |
| Mobile-readable cover | [Pass/Fail] | |
| Brand/style consistency | [Pass/Fail] | |
```

---

## Filename convention (reminder)

```text
YYYY-MM-DD_post-slug_01_cover.png … _08_cta.png
```

Use the same date as the planned post date. The slug is short kebab-case (e.g. `ai-phishing-training`, `prompt-injection-agents`, `chatbot-secret-leak`).
