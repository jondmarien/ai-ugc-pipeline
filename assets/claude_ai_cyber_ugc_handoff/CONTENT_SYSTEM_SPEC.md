# CONTENT_SYSTEM_SPEC.md — AI Cybersecurity Carousel Production System

## 1. System Objective

This system turns AI cybersecurity topics into credible, visually dramatic Instagram-style carousel posts. It is designed for manual publishing today and API-assisted publishing later. The system should create a consistent queue of content that feels urgent and visually compelling without becoming misleading, unsafe, or technically shallow.

The target audience is a mix of cybersecurity practitioners, technical founders, students, developers, AI builders, and security-curious executives. The tone should be direct, sharp, and practical. The content should feel like a security-literate operator explaining what the AI hype actually means.

## 2. Pipeline Overview

| Stage | Input | Process | Output |
| --- | --- | --- | --- |
| Idea intake | News, papers, demos, vendor posts, GitHub projects, observations | Capture topic, source, claim, and angle | Raw idea log |
| Scoring | Raw ideas | Score for credibility, relevance, novelty, visual drama, defender usefulness | Ranked content candidates |
| Framing | Selected idea | Convert into one defensible hook and one audience promise | Cover headline and thesis |
| Scripting | Hook and sources | Build 6–9 slide carousel arc | Slide-by-slide script |
| Visual direction | Slide script | Generate prompts for cinematic images and layout needs | Cover and slide image prompts |
| Captioning | Final thesis | Write short narrative caption, CTA, hashtags | Manual-post caption package |
| QA | Full draft | Check claims, safety, readability, and brand consistency | Approved or revised post |
| Manual upload | Approved package | Export images and paste caption | Published or scheduled post |
| Feedback loop | Performance and comments | Capture comments, saves, hook performance | Improved future hooks |

## 3. Content Pillars

| Pillar | Include | Avoid |
| --- | --- | --- |
| Offensive AI | High-level attacker capability shifts, social engineering, recon automation, phishing personalization | Payloads, evasion steps, exploit instructions, credential theft walkthroughs |
| Defensive AI | SOC triage, alert summarization, detection engineering support, incident response workflows | Claims that AI replaces analysts entirely |
| Model security | Prompt injection, tool abuse, agent permissions, RAG data exposure, model supply chain | Overstating every prompt injection as a breach |
| Data leakage | Secrets in prompts, logs, chatbot retention, source code exposure, SaaS misconfiguration | Naming real victims without a source |
| Governance | AI policy, vendor review, logging, access control, audit trails | Empty compliance theater with no practical takeaway |
| Myth-busting | Viral claims, misunderstood demos, AI panic narratives | Dismissive contrarianism without useful explanation |

## 4. Idea Scoring Rubric

Score each category from 1 to 5. Prioritize ideas with a total score of **18 or higher**. If credibility is below 3, do not produce the post unless it is reframed as a scenario or myth-bust.

| Category | 1 | 3 | 5 |
| --- | --- | --- | --- |
| Technical credibility | Weak source or vague rumor | Plausible with some support | Primary/reputable source and clear claim |
| Audience relevance | Too generic | Relevant to some security/AI readers | Immediately relevant to defenders, builders, or leaders |
| Novelty | Common recycled point | Familiar topic with fresh angle | Timely, surprising, or under-discussed |
| Visual drama | Hard to visualize | Some visual metaphor | Strong cinematic cover potential |
| Defender usefulness | No takeaway | General advice | Concrete control, process, or question |

## 5. Default Carousel Arc

The preferred carousel structure is **hook, context, mechanism, implication, defense, takeaway**. This keeps the post short enough to finish but useful enough to save.

| Slide | Role | Writing instruction |
| --- | --- | --- |
| 1 | Cover hook | Make one strong claim in simple language. |
| 2 | Context | Explain what changed or what pattern is emerging. |
| 3 | Risk | Explain why it matters for attackers or defenders. |
| 4 | Mechanism | Explain the mechanism safely and at a high level. |
| 5 | Failure point | Show where organizations are weak. |
| 6 | Defensive move | Give a practical response. |
| 7 | Takeaway | Give one sentence worth remembering. |
| 8 | CTA | Ask a specific question or invite saving/following. |

## 6. Manual Upload Package Format

Every finished post should include the following fields.

| Field | Requirement |
| --- | --- |
| Post ID | Short slug like `ai-phishing-awareness-001`. |
| Content pillar | One of the defined pillars. |
| Status | Idea, drafted, visual-ready, QA-ready, approved, posted. |
| Source links | At least one supporting source when factual. |
| Cover headline | Mobile-readable, defensible, no fake precision. |
| Slide table | Slide number, on-slide copy, visual direction. |
| Image prompts | Cover prompt and inner-slide prompt family. |
| Caption | Short narrative caption with question and CTA. |
| Hashtags | 5–10 relevant tags. |
| Alt text | Accessibility-focused image description. |
| QA notes | Source, safety, uncertainty, and technical caveats. |
| Filename plan | Ordered filenames for manual upload. |

## 7. Filename Convention

Use ordered filenames so manual upload is simple and future automation can parse the package.

```text
YYYY-MM-DD_post-slug_01_cover.png
YYYY-MM-DD_post-slug_02_context.png
YYYY-MM-DD_post-slug_03_risk.png
YYYY-MM-DD_post-slug_04_mechanism.png
YYYY-MM-DD_post-slug_05_failure-point.png
YYYY-MM-DD_post-slug_06_defense.png
YYYY-MM-DD_post-slug_07_takeaway.png
YYYY-MM-DD_post-slug_08_cta.png
```

## 8. Voice and Editing Rules

The writing should be punchy but not sloppy. Prefer concrete phrasing over inflated claims. Use active voice. Keep on-slide copy short. Captions can carry nuance; covers should carry curiosity.

| Weak | Better |
| --- | --- |
| AI is changing cybersecurity forever | AI phishing is making old awareness training obsolete |
| Hackers can now destroy companies with one prompt | AI lowers the cost of believable social engineering |
| This new tool is terrifying | This tool shows why agent permissions need review |
| Nobody is talking about this | Most teams are watching the wrong part of the risk |

## 9. Safety Boundary

The content may discuss cybersecurity risks, but it should not become an abuse manual. Keep mechanisms conceptual and mitigation-focused.

Do not provide payloads, exploit code, credential theft workflows, stealth/evasion tactics, malware instructions, instructions to bypass MFA, or detailed phishing execution steps. If a post needs a mechanism slide, describe the mechanism at a high level and immediately pair it with defensive context.

## 10. Current Constraint

Meta Developer access is pending. The system must not depend on live API access. The deliverables should be ready for manual publishing and later convertible into an API pipeline.
