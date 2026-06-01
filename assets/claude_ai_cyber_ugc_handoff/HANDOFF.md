# HANDOFF.md — AI-in-Cybersecurity UGC Content Production Pipeline

**Prepared for:** Jon, CTO @ D-Sports  
**Primary assignee:** Claude or another agent  
**Prepared by:** Manus AI  
**Date:** 2026-06-01

## 1. Situation Summary

Jon wants to build a repeatable content production pipeline for **AI-in-cybersecurity UGC carousel content** inspired by dramatic AI/tech carousel pages. The visual pattern is cinematic, high-contrast, hook-heavy, and optimized for Instagram-style swipe posts. The subject matter should focus specifically on **AI in cybersecurity**, including offensive AI, defensive AI, model security, prompt injection, data leakage, AI governance, SOC automation, deepfakes, social engineering, and myth-busting.

The immediate constraint is that Jon’s Instagram API path is temporarily blocked. Meta Developer access is showing “you don’t have access yet,” and identity verification may take up to two days. Therefore, the next useful step is **not API automation**. The useful step is to build the **manual-first content machine** so Jon can generate, review, design, and post manually through Meta Business Suite or Instagram while the API access is pending.

> Core strategy: build the content pipeline now, wire API publishing later.

## 2. Desired Outcome

Claude should produce a practical, reusable production system that allows Jon to create AI cybersecurity carousel posts consistently. The goal is not just one post. The goal is a **pipeline** that can produce a weekly batch of posts with repeatable idea intake, scoring, scripting, visual prompting, caption writing, QA, and manual upload packaging.

| Priority | Outcome |
| --- | --- |
| 1 | Create a manual-first production pipeline that does not require Instagram API access. |
| 2 | Produce templates for idea collection, scoring, carousel scripts, captions, visual prompts, and QA. |
| 3 | Create an initial backlog of ready-to-produce AI cybersecurity carousel ideas. |
| 4 | Preserve a future path to API automation once Meta Developer access is approved. |
| 5 | Keep the content technically credible and avoid fake-panic cybersecurity slop. |

## 3. Non-Negotiable Content Standard

The account should use viral packaging, but it must maintain security-professional credibility. AI and cybersecurity content can easily become exaggerated, misleading, or unsafe. Claude should treat this as a brand trust problem.

**Positioning line:**

> AI cybersecurity explained through viral carousels: real threats, real tools, no fake panic.

| Rule | Meaning |
| --- | --- |
| Do not invent facts | No fabricated breach details, CVEs, numbers, papers, quotes, or timelines. |
| Do not overclaim | If something is a demo, scenario, or emerging risk, say so. |
| Do not provide exploit instructions | Avoid payloads, evasion steps, credential theft flows, or operational abuse details. |
| Always include defender value | Every post should include at least one mitigation, review step, policy idea, or detection angle. |
| Use strong hooks carefully | The cover can be dramatic, but the claim must survive practitioner scrutiny. |

## 4. Reference Style

The reference style is a grid of dramatic AI/tech carousel posts with these recurring traits:

| Element | Style direction |
| --- | --- |
| Cover image | Cinematic, editorial, high-contrast, dark atmosphere, central subject. |
| Headline | Big, bold, condensed, often all caps, white text. |
| Layout | Dark lower-third or black gradient text band. |
| CTA | Small “SWIPE FOR MORE” or equivalent. |
| Caption | Short paragraphs: hook, context, implication, question, follow CTA. |
| Content arc | One strong idea broken into 6–9 simple slides. |

Claude should not copy the original account, logo, exact branding, or claims. It should adapt the format into Jon’s own **AI cybersecurity analyst** voice.

## 5. Recommended Production Stack

This pipeline should work even before APIs are available. Keep the tools modular.

| Need | Recommended tool options | Notes |
| --- | --- | --- |
| Research intake | Feedly, Google Alerts, GitHub Trending, vendor blogs, arXiv, CVE feeds, Reddit, Hacker News, newsletters | Prefer primary or reputable sources. |
| Drafting | Claude, ChatGPT, Gemini | Use AI for drafts, not final truth. |
| Visual generation | Midjourney, ChatGPT image generation, Ideogram, Leonardo, Recraft | Generate background images without final text. |
| Layout | Canva, Figma, Photoshop, aiCarousels | Add exact text manually for reliability. |
| Scheduling/manual posting | Meta Business Suite, Instagram native posting, Buffer/Later/Metricool | Manual first; API later. |
| Pipeline tracking | Notion, Airtable, Google Sheets, Markdown files | Start simple. |

## 6. Default Carousel Structure

Most posts should be **6–9 slides**. The default Instagram-style working size is **1080 × 1350 px portrait**, with important text centered for mobile readability and grid preview safety.[1] [2]

| Slide | Purpose | Copy target |
| --- | --- | --- |
| 1 | Cover hook | One dramatic but defensible headline. |
| 2 | What happened | Plain-language context. |
| 3 | Why it matters | Security impact, not hype. |
| 4 | How it works | Safe high-level mechanism. |
| 5 | Where teams fail | People/process/tooling gap. |
| 6 | Defensive move | Practical control or behavior. |
| 7 | Takeaway | Memorable lesson. |
| 8 | CTA | Save/follow/comment prompt. |

For list posts, use cover, setup, examples, synthesis, CTA. For myth-busting, use viral claim, what is true, what is exaggerated, what defenders should actually care about.

## 7. Weekly Workflow Claude Should Build

Claude should turn this into a practical pipeline with reusable templates.

| Day | Task | Output |
| --- | --- | --- |
| Monday | Collect raw ideas from sources | 15–25 candidate ideas. |
| Tuesday | Score ideas | 5 best post candidates. |
| Wednesday | Write scripts and captions | 5 carousel drafts. |
| Thursday | Generate visuals and assemble slides | 5 production-ready carousels. |
| Friday | Run QA and schedule/manual-post | Posted or queued content. |
| Daily | Monitor comments and save hook learnings | Feedback loop. |

The scoring model should rate each idea from 1–5 on **technical credibility**, **audience relevance**, **visual drama**, **novelty**, and **defender usefulness**. A dramatic but weakly supported idea should either become a **myth-bust** or be skipped.

## 8. Initial Content Pillars

Claude should organize ideas under these pillars.

| Pillar | Description | Example hook |
| --- | --- | --- |
| Offensive AI | AI-assisted attacker workflows and social engineering. | “AI phishing just made your old awareness training obsolete.” |
| Defensive AI | SOC automation, triage, detection, IR, security copilot workflows. | “A junior analyst with AI can now triage alerts like a small team.” |
| Model security | Prompt injection, agent abuse, data poisoning, model supply chain. | “The weirdest AI attack is instructions hidden where your agent reads.” |
| Privacy/data leakage | Secrets in chatbots, logs, source code, SaaS sprawl. | “Employees are pasting secrets into chatbots and calling it productivity.” |
| Governance | Policy, vendor risk, compliance, auditability. | “Companies adopted AI faster than their controls.” |
| Myth-busting | Correcting viral AI/cybersecurity exaggerations. | “No, AI did not hack the company by itself. Here is what actually happened.” |

## 9. Expected Files Claude Should Produce

Ask Claude to create these files as the initial deliverable.

| File | Purpose |
| --- | --- |
| `CONTENT_PIPELINE.md` | End-to-end production workflow from idea intake to manual upload. |
| `IDEA_BACKLOG.md` | 25–50 AI cybersecurity post ideas, scored and categorized. |
| `POST_TEMPLATE.md` | Reusable template for one carousel post. |
| `CAPTION_BANK.md` | Caption formulas, CTA variations, hashtag groups, comment prompts. |
| `VISUAL_PROMPT_BANK.md` | Cover and inner-slide image prompts grouped by topic. |
| `QA_CHECKLIST.md` | Credibility, safety, source, and brand checks before publishing. |
| `WEEK_1_POSTS.md` | Five ready-to-produce carousel drafts for the first content batch. |

## 10. Future API Path, Not Current Focus

Do not spend too much time on live Instagram API integration until Meta access is approved. However, Claude can keep this future interface in mind.

```env
META_APP_ID=
META_APP_SECRET=
META_REDIRECT_URI=
META_LONG_LIVED_ACCESS_TOKEN=
IG_USER_ID=
FACEBOOK_PAGE_ID=
```

Future publishing flow:

```text
/me/accounts
→ find connected Facebook Page
→ /{page-id}?fields=instagram_business_account
→ get IG user ID
→ create media container
→ publish media after human approval
```

For now, the pipeline should end with a manual upload package: final slide images, caption, hashtags, alt text, source notes, and posting checklist.

## 11. Success Criteria

The handoff is successful when Jon can give Claude a topic like “AI phishing” or “prompt injection in agents” and receive a complete content package that can be manually posted without Meta API access.

| Criterion | Pass condition |
| --- | --- |
| Repeatability | The same process can produce 3–5 posts per week. |
| Credibility | Each post distinguishes verified facts from scenarios or opinions. |
| Visual readiness | Each post has clear image prompts and layout guidance. |
| Manual upload readiness | Captions, hashtags, alt text, filenames, and QA notes are included. |
| Future automation ready | Outputs are structured enough to plug into API publishing later. |

## 12. References

[1]: https://www.overvisual.com/tools/instagram-carousel-size "Overvisual — Instagram Carousel Size & Dimensions"  
[2]: https://buffer.com/resources/instagram-image-size/ "Buffer — Instagram Image Size Guide"  
[3]: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/get-started/ "Meta for Developers — Instagram API with Facebook Login: Getting Started"
