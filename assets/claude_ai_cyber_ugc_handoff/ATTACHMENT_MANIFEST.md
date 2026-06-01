# ATTACHMENT_MANIFEST.md — What to Attach for Claude

Attach these files to Claude in the order below. The order matters because the first files define the project goal and the later files provide reusable templates.

| Order | File | Purpose |
| --- | --- | --- |
| 1 | `HANDOFF.md` | Main project brief, strategy, constraints, and expected outputs. |
| 2 | `STARTING_PROMPT.md` | Copy-paste prompt to start Claude’s work. |
| 3 | `CONTENT_SYSTEM_SPEC.md` | Detailed architecture for the manual-first production system. |
| 4 | `POST_TEMPLATES.md` | Reusable post, caption, visual prompt, and QA templates. |
| 5 | `ai_cybersecurity_ugc_carousel_guide.md` | Original full guide with strategic background and references. |

## Recommended Claude Setup

Start a new Claude chat or project, attach the files, then paste the prompt from `STARTING_PROMPT.md`. If Claude asks whether to build API integration immediately, instruct it to **defer API integration** and focus on the manual production package.

## What Claude Should Return

Claude should return a Markdown-based content production kit with these files:

| Expected file | Description |
| --- | --- |
| `CONTENT_PIPELINE.md` | Weekly workflow from idea capture to manual upload. |
| `IDEA_BACKLOG.md` | 25–50 scored ideas across AI cybersecurity pillars. |
| `POST_TEMPLATE.md` | Reusable single-post package structure. |
| `CAPTION_BANK.md` | Caption formulas, CTAs, hashtags, and comment prompts. |
| `VISUAL_PROMPT_BANK.md` | Reusable cinematic prompt sets for AI cybersecurity visuals. |
| `QA_CHECKLIST.md` | Credibility, safety, and brand checks. |
| `WEEK_1_POSTS.md` | Five ready-to-produce carousel drafts. |

## Follow-Up Prompt If Claude Produces Something Too Generic

```text
This is too generic. Make it specific to AI in cybersecurity and the stics-style carousel format. I need hook-heavy Instagram carousel posts with technical credibility, slide-by-slide scripts, visual prompts, captions, hashtags, alt text, QA notes, and manual-upload filenames. Rework the output using the content pillars and QA rules from the attached handoff files.
```

## Follow-Up Prompt If Claude Becomes Too Hype-Driven

```text
The hooks are too exaggerated. Keep the viral packaging, but make the claims practitioner-defensible. Distinguish verified facts from scenarios, remove fake precision, and add a practical defender takeaway to each post.
```

## Follow-Up Prompt If Claude Includes Unsafe Offensive Detail

```text
Remove operational abuse instructions. Keep the mechanism high-level and mitigation-focused. Do not include payloads, exploit steps, evasion guidance, credential theft workflows, or instructions that would help someone execute an attack.
```
