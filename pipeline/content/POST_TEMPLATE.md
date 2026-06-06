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
**Score:** cred __/5 · relevance __/5 · novelty __/5 · drama __/5 · defender __/5 · **hook __/5 · value __/5 · resonance __/5** → **total __/40**

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

### Hook → Value → Resonance Arc

| # | Phase | Role | On-slide copy (≤ ~12 words) | Visual direction | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | **HOOK** | Cover hook | [headline — contradicts common belief in 1s] | [cover image] | **Skip Rate optimizer** |
| 2 | | Context | [what happened / pattern — plain language] | [context image] | Tag: Verified/Emerging/Scenario |
| 3 | | Risk | [why it matters — practical security terms] | [impact image] | Security impact, not hype |
| 4 | | Mechanism | [safe high-level how it works] | [mechanism metaphor] | **NO exploit steps** |
| 5 | | Failure point | [where teams/processes/tools are weak] | [gap image] | People/process/tooling |
| 6 | | Defense | [practical control] | [control image] | Actionable this week |
| 7 | **VALUE** | Takeaway | [non-obvious + tactical — saveable] | [summary image] | **Shares/Saves optimizer** |
| 8 | **RESONANCE** | CTA | [specific question — labels shared feeling] | [brand/CTA image] | **Likes/Comments optimizer** |

## Image Prompts
### Cover (no rendered text)
[paste from VISUAL_PROMPT_BANK.md, customized]

### Inner-slide family (shared style + per-slide subject)
[paste shared style block + slide 2–8 subjects — note: Slide 7 = Value icon, Slide 8 = Resonance frame]

## Caption
[Hook restated in one sentence.]

[What happened / what pattern is emerging — plain language.]

[Why it matters in practical security terms.]

[Defender takeaway: policy, detection, process, training, review, logging, access, or vendor risk.]

[One specific comment question that labels a shared feeling.]

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
| **Hook: flips common belief in 1s** | [Pass/Fail] | |
| **Value: non-obvious + tactical** | [Pass/Fail] | |
| **Resonance: labels shared feeling** | [Pass/Fail] | |

```

---

## Filename convention (reminder)

```text
YYYY-MM-DD_post-slug_01_cover.png … _08_cta.png
```

Use the same date as the planned post date. The slug is short kebab-case (e.g. `ai-phishing-training`, `prompt-injection-agents`, `chatbot-secret-leak`).

---

## Quick Hook Reference (from CAPTION_BANK.md)

**Hook formulas:**
- `"Everyone thinks X. Actually Y."`
- `"Stop doing X. Start doing Y."`
- `"The [common advice] is wrong because [reason]."`
- `"Someone used AI to [action] and [consequence]"`
- `"Most teams missed [hidden risk]"`

**Value templates (Slide 7):**
- `"Before you [action], check [specific control]."`
- `"The control that stops this: [one concrete step]."`
- `"Save this [checklist/framework] for your next [scenario]."`

**Resonance templates (Slide 8):**
- `"You've felt [feeling] when [situation]. That's [label]."`
- `"The 2am thought: [unspoken worry]."`
- `"What nobody says: [hard truth]."`