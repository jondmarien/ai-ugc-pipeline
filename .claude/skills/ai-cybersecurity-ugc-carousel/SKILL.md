---
name: ai-cybersecurity-ugc-carousel
description: Create AI-in-cybersecurity UGC carousel content for Instagram, LinkedIn, TikTok, or similar social platforms. Use when asked to produce viral-style cybersecurity/AI carousel posts, post concepts, slide scripts, image prompts, captions, hooks, content calendars, or a repeatable UGC workflow based on dramatic AI tech carousel formats.
---

# AI Cybersecurity UGC Carousel Skill

Use this skill to create **viral-style but technically credible** UGC carousel content about AI in cybersecurity. The style is cinematic, high-contrast, hook-driven, and swipeable, but the standard is **practitioner-grade accuracy**. Do not create fake panic, unsupported claims, or fabricated numbers. Altitude is per-post: default to high-level mechanisms, but **offensive-theme posts may go deep/technical** (real tools, techniques, tradecraft) when it is educational and framed for authorized security work; never give turnkey instructions whose only purpose is indiscriminate real-world harm.

## Operating Principle

Package content like a high-performing AI/tech carousel, but judge claims like a cybersecurity practitioner. The output should feel scroll-stopping while remaining defensible to security professionals.

> Viral packaging is allowed. Fake certainty is not.

## Default Deliverables

When the user asks for a post, carousel, content idea, or workflow, produce the relevant subset below. If the user asks for a complete post, include all of them.

| Deliverable | Default format |
| --- | --- |
| Cover hook | One all-caps or punchy headline with a short subline |
| Carousel script | 6–9 slides unless the user requests a longer list post |
| Visual direction | One image prompt per slide or per post, depending on scope |
| Caption | Short narrative caption with a question and follow CTA |
| Topics | A bracketed list of plain-text topics — `[topic1, topic2, …]`, NOT hashtags (no `#`, no 5-tag cap). Stored in the JSON `hashtags` field; the renderer prints them as `[…]` in caption.txt. |
| QA notes | Source/claim warnings, safety notes, and technical accuracy checks |

## Workflow

### 1. Identify the content angle

Choose one narrow cybersecurity angle. Avoid broad “AI is changing cybersecurity” posts unless the user explicitly wants beginner content.

| Pillar | Use for | Example angle |
| --- | --- | --- |
| Offensive AI | AI-assisted attacker workflows | AI lowers the skill barrier for personalized phishing |
| Defensive AI | SOC, detection, triage, IR workflows | AI can compress alert triage but needs human review |
| Model security | Prompt injection, data poisoning, agent abuse | Prompt injection becomes worse when agents can take actions |
| Privacy/data leakage | Chatbot logs, secrets, customer data, source code | Employees paste sensitive logs into AI tools |
| Governance | Policy, compliance, vendor risk, audit trails | Companies adopt AI faster than their controls |
| Myth-busting | Correcting viral misinformation | “AI hacked X” is often a misleading framing |

### 2. Validate the claim before writing

Use current sources when facts matter. Prefer primary sources such as vendor posts, research papers, CVEs, GitHub repos, public incident reports, court filings, or official documentation. If the user provides a source, inspect it before writing. If sources are unavailable, frame the post as a scenario, pattern, or opinion rather than as a verified event.

Do not invent statistics, timelines, company names, breach details, CVEs, tool capabilities, or quotes. If a claim is uncertain, use wording such as “could,” “may,” “reported,” “demoed,” or “the risk is.”

**Research as a loop, not a single lookup.** (1) Landscape scan — a broad search to map the claim space and the strongest counter-arguments. (2) Gather primaries. (3) **Triangulate** — find ≥2 independent reputable sources for any load-bearing factual claim; a single or weak source means you tag the claim down. (4) **Confidence-tier** each claim: `[Verified]` (≥2 independent agree) · `[Emerging]` (one reputable, or weak corroboration) · `[Scenario]` (illustrative, no confirming source — label it in-copy). Hard gates: no fabricated URLs; re-open each link and confirm it still says what you claim; disclose angles that came up empty; never name a real victim without a cited public source.

### 3. Build the carousel narrative

Use this default 8-slide structure unless another structure fits better. The slide count is configurable (`slides=N`, 3–20, default 8): **`cover` is always slide 1 and `cta` is always the last**, with `takeaway` at slide N−1; the middle is filled from the named roles below, then **generic `point` body slides** when a post needs more than the five named middle slides (or trimmed from the end of the named list when N < 8).

| Slide | Purpose | Copy pattern |
| --- | --- | --- |
| 1 | Cover hook | 8 words max, concrete and countable (a number, a named object, a verb). Its only job is stopping the scroll; the subline carries any qualifier. e.g. “AI PHISHING JUST CROSSED A LINE” |
| 2 | What happened | Prove the cover wasn’t bait: state the event/pattern AND the stakes in the reader’s terms. Pass/fail: a skeptic who swiped thinks “worth my time” from this slide alone, or the funnel leaks here. |
| 3 | Why it matters | Explain the security impact, not the hype |
| 4 | How it works | Describe the mechanism at a safe, high level |
| 5 | Where teams fail | Identify the gap in people, process, or tooling |
| 6 | Defensive move | Give practical controls or review steps |
| 7 | Takeaway | The **save-object**: a named checklist, decision rule, query/detection snippet, or fill-in-the-blank framework a defender would screenshot (fallback: one sharp quotable rule — see CAPTION_BANK §3). Compress the lesson into one memorable line. **Accent-mark it:** wrap the affirmative point in `[[…]]` (renders in the theme accent colour) and any negation/"what it's NOT" in `{{…}}` (renders red). e.g. `The win {{isn't 'AI that thinks.'}} [[It's an agent you own and can contain.]]` |
| 8 | CTA | Ask a specific question and invite following/saving |

**Slide-count guidance (2026-06-07, sourced):** plan the content first, then set the count. Industry data (Hootsuite/Later/Socialinsider, 2025–2026) puts peak engagement at 8–10 slides, but completion rate beats slide count: a tight 5 with zero filler outperforms a padded 10, and low completion reads to the ranking system as a broken promise. Never pad to hit a number. **Every slide must pass the standalone test** (one complete idea with zero context) because Instagram re-serves carousels to non-interactors starting from slide 2: any slide can be someone’s first impression.

For **longer list posts** (`slides=N`, N>8), keep cover → context → a run of `point` body slides (one item each) → takeaway → CTA. For **short posts** (N<8), drop the least-essential middle roles (e.g. N=5: cover, context, risk, takeaway, cta). For myth-busting posts, use: viral claim, what is true, what is exaggerated, what actually matters, defender takeaway.

### 4. Write hooks with specificity

Use the formula: **specific actor/object + unexpected AI action + clear consequence**.

| Weak | Better |
| --- | --- |
| “AI is changing cybersecurity” | “AI phishing just made your old awareness training obsolete” |
| “Prompt injection is dangerous” | “The weirdest AI attack is instructions hidden where your agent reads” |
| “Data leakage is a problem” | “Employees are pasting secrets into chatbots and calling it productivity” |

Avoid fake precision. Numbers increase click-through but damage trust if unsupported.

### 5. Design the visual direction

Default social format is **1080 × 1350 px portrait** for Instagram-style carousels. Keep critical text and faces centered because grid previews can crop. Use consistent dimensions across all slides.

| Visual layer | Standard |
| --- | --- |
| Background | Dark cinematic key art, lighting-first (described like a DP), high contrast, generous negative space |
| Text band | Dark lower third or gradient for readability |
| Typography | Bold condensed sans-serif, high-contrast white |
| Accent color | Theme-driven, set by the renderer — `offensive` red `#ef4444` · `defensive` blue `#3b82f6` · `hacking` green `#39ff88` · `purple-team` `#a855f7` · `ai` orange `#f97316`. Do NOT hardcode a colour in the image prompt. |
| CTA | Small “SWIPE FOR MORE,” “SAVE THIS,” or platform-appropriate cue |
| Brand mark | Small handle/logo, unobtrusive |

When generating images, usually ask for **no rendered text** and add exact text in a layout tool unless the user specifically wants text rendered by the image model.

### 6. Use safe image prompts (FLUX.2 [klein])

Each slide's **visual direction becomes the `visual_prompt` field in the post JSON** — the literal string FLUX.2 [klein] receives. klein has no prompt upsampler, so write the whole idea in **prose**, `Subject + Action + Style + Context`, **lighting-first** (the highest-impact lever), 30–80 words, specific not long. No quoted text or lettering words (klein garbles them); keep type-free zones positive ("clean unmarked surfaces, generous negative space in the lower third"). **Don't hardcode an accent colour** — the renderer adds the theme glow. Synthetic faces only, no real logos/credentials; keep mechanisms conceptual (offensive-theme posts may go more concrete when genuinely educational).

Follow `pipeline/content/VISUAL_PROMPT_BANK.md` (the authority) and the templates in `references/prompt-and-caption-templates.md`.

### 7. Write captions in the house style

Use short paragraphs. Start with a restated hook, then explain what happened, why it matters, the defender implication, and a specific comment question. End with a follow/save CTA.

**Then run the copy chain: `humanizer` → `stop-slop` → `professional-proofreader`** (and `pipeline/content/VOICE_AND_TONE_GUIDE.md`). Strip AI tells (**NO em-dashes at all (`—`/`–`), NO sentence fragments**, listicle cadence, "delve/leverage", "not just X but Y", voice-flat symmetry, generic CTA closes) while keeping the house voice: sharp, dry, specific, a visible stance, one voice-signal line that could only be ours, complete sentences with plain punctuation. This changes *how* it reads, never *what* it claims.

| Caption section | Function |
| --- | --- |
| First line | Repeat or sharpen the hook |
| Context | Explain the claim in simple language |
| Impact | Translate the claim into cybersecurity risk |
| Defender angle | Add practical value |
| Question | Ask something specific and easy to answer |
| CTA | Follow/save/share for more AI security breakdowns |

### 8. Run the credibility and safety gate

Before final delivery, check the content against this gate.

| Check | Required standard |
| --- | --- |
| Source support | Claims are sourced, qualified, or framed as scenario/opinion |
| Altitude per post | High-level by default; offensive-theme posts MAY go deep/technical (tools, techniques, tradecraft) when educational + authorized-security-framed. No turnkey instructions whose only purpose is indiscriminate harm. |
| No fake authority | Do not invent paper names, CVEs, benchmarks, or quotes |
| Practitioner value | Include at least one defender takeaway |
| Visual feasibility | Headline is short enough for a mobile cover |
| Brand consistency | Tone, format, CTA, and typography guidance are repeatable |
| Voice de-AI scan | Copy passes the humanizer audit / `VOICE_AND_TONE_GUIDE.md` pre-publish scan; reads human, not machine |

If the content fails, revise before delivering.

## Output Formats

### Complete carousel post

Use this format when the user wants a ready-to-post asset plan.

```markdown
## Cover
Headline: ...
Subline: ...
Visual: ...

## Carousel Script
| Slide | On-slide copy | Visual direction |
| --- | --- | --- |
| 1 | ... | ... |

## Caption
...

## Topics
[topic one, topic two, topic three, …]

## QA Notes
...
```

### Content calendar

Use this format when the user wants multiple post ideas.

```markdown
| Day | Pillar | Cover hook | Angle | Source needed | Format |
| --- | --- | --- | --- | --- | --- |
```

## References

Read `references/prompt-and-caption-templates.md` for reusable prompt templates, caption formulas, hook banks, and example post structures.
