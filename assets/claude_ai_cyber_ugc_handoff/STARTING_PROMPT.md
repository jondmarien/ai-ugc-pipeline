# STARTING_PROMPT.md

Copy and paste this prompt into Claude after attaching the files in this handoff package.

```text
You are helping me build a manual-first AI-in-cybersecurity UGC carousel content production pipeline for Instagram-style carousel posts.

Context: My Instagram/Meta API setup is temporarily blocked because Meta Developer access is pending identity/access verification. Do not focus on API integration yet. I want to build the content machine first so I can create and manually post strong carousel content through Meta Business Suite or Instagram while API access is pending.

Please read the attached context files first, especially HANDOFF.md, CONTENT_SYSTEM_SPEC.md, and POST_TEMPLATES.md. Then produce a complete production package with the following files:

1. CONTENT_PIPELINE.md — an end-to-end weekly workflow from idea intake to manual upload.
2. IDEA_BACKLOG.md — 25 to 50 AI cybersecurity carousel ideas, categorized and scored.
3. POST_TEMPLATE.md — a reusable one-post template with cover, slide script, caption, hashtags, alt text, source notes, and QA.
4. CAPTION_BANK.md — caption formulas, CTA variations, hashtag sets, and comment prompts.
5. VISUAL_PROMPT_BANK.md — cover and inner-slide image prompts grouped by content pillar.
6. QA_CHECKLIST.md — technical credibility, safety, source, and brand-readiness gates.
7. WEEK_1_POSTS.md — five ready-to-produce carousel drafts for the first content batch.

Important constraints:

- Focus on AI in cybersecurity, not broad AI news.
- Use viral carousel packaging, but keep technical credibility high.
- Do not invent facts, CVEs, breach details, quotes, numbers, or paper claims.
- Distinguish verified events from hypothetical scenarios.
- Do not include step-by-step offensive abuse instructions, payloads, evasion details, or exploit chains.
- Every post should include a useful defender takeaway.
- Use 1080 × 1350 portrait as the default carousel canvas.
- Assume final text is added manually in Canva/Figma; image prompts should usually ask for no rendered text.
- Produce outputs that are manual-upload ready now and structured enough for API automation later.

My desired positioning is:

“AI cybersecurity explained through viral carousels: real threats, real tools, no fake panic.”

Before creating the files, briefly state the content-system architecture you will use. Then create the files in Markdown.
```
