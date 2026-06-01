# POST_TEMPLATES.md — Reusable AI Cybersecurity Carousel Templates

## 1. Complete Post Template

Use this template for every carousel draft.

```markdown
# [Post Title]

**Post ID:** [yyyy-mm-dd-topic-slug-001]  
**Pillar:** [Offensive AI / Defensive AI / Model Security / Data Leakage / Governance / Myth-busting]  
**Status:** [Idea / Drafted / Visual-ready / QA-ready / Approved / Posted]  
**Primary audience:** [Security practitioners / founders / developers / students / executives]  
**Core claim:** [One sentence. Is this verified, emerging, or hypothetical?]

## Source Notes

| Source | Link | What it supports | Confidence |
| --- | --- | --- | --- |
| [Source name] | [URL] | [Claim supported] | [High/Medium/Low] |

## Cover

**Headline:** [Short, dramatic, defensible headline]  
**Subline:** [Optional 4–8 word subline]  
**Visual direction:** [Cinematic scene description]  
**Layout note:** 1080 × 1350 portrait, dark lower-third, bold white headline, centered subject.

## Carousel Script

| Slide | On-slide copy | Visual direction | Notes |
| --- | --- | --- | --- |
| 1 | [Cover headline] | [Cover image] | Hook only. |
| 2 | [What happened / setup] | [Context image] | Keep simple. |
| 3 | [Why it matters] | [Risk image] | Make it relevant. |
| 4 | [Safe mechanism] | [Mechanism metaphor] | No exploit steps. |
| 5 | [Where teams fail] | [Failure-point image] | Show process gap. |
| 6 | [Defensive move] | [Control/process image] | Practical takeaway. |
| 7 | [Memorable takeaway] | [Summary image] | One-line lesson. |
| 8 | [CTA/question] | [Brand/CTA image] | Ask specific question. |

## Image Prompts

### Cover Prompt

[Paste cover prompt here. Ask for no rendered text.]

### Inner Slide Prompt Family

[Paste shared style prompt plus slide-specific subject variations.]

## Caption

[Hook restated in one sentence.]

[Explain what happened or what pattern is emerging in plain language.]

[Explain why it matters for attackers, defenders, developers, or executives.]

[Add a practical defender takeaway: policy, detection, process, training, review, logging, access control, or vendor risk.]

[Ask one specific comment question.]

Follow for AI security breakdowns without the fake panic.

#[5–10 relevant hashtags]

## Alt Text

[Describe the carousel visuals in accessible plain language.]

## Manual Upload Package

| Item | Value |
| --- | --- |
| Filename prefix | [YYYY-MM-DD_post-slug] |
| Slide count | [6–9] |
| Caption ready? | [Yes/No] |
| Sources checked? | [Yes/No] |
| QA approved? | [Yes/No] |

## QA Notes

| Check | Result | Notes |
| --- | --- | --- |
| Claim supported | [Pass/Fail] | [Notes] |
| No fake precision | [Pass/Fail] | [Notes] |
| Safe mechanism | [Pass/Fail] | [Notes] |
| Defender value included | [Pass/Fail] | [Notes] |
| Mobile-readable cover | [Pass/Fail] | [Notes] |
| Brand/style consistency | [Pass/Fail] | [Notes] |
```

## 2. Cover Hook Formulas

| Formula | Cybersecurity example |
| --- | --- |
| `Someone used AI to [action] and [consequence]` | Someone used AI to clone a helpdesk voice and reset an employee password |
| `The scary part is not [obvious risk]. It is [real risk].` | The scary part is not malware. It is AI-written trust. |
| `Stop [common behavior] before [consequence]` | Stop pasting production logs into chatbots before you know where they are stored |
| `Most teams missed [hidden risk]` | Most teams missed the real risk in AI browser agents |
| `[Number] ways [AI system] can [security failure]` | 9 ways AI agents can leak company data without getting hacked |
| `This changes how [security process] works` | This changes how phishing simulations need to be built |
| `The weirdest AI attack is [unexpected vector]` | The weirdest AI attack is instructions hidden where your agent reads |

## 3. Visual Prompt Templates

### Cover Image Prompt

```text
Create a cinematic vertical social media cover image for an AI cybersecurity carousel.
Subject: [specific scene: security analyst, AI agent, phishing inbox, SOC room, cloud dashboard, exposed API, deepfake call center].
Composition: portrait 4:5, dramatic central subject, strong empty dark lower-third area for headline text, high contrast, mobile-first readability.
Style: realistic editorial technology photography, cyberpunk blue/green lighting, premium magazine cover feel, sharp details, dark atmosphere.
Text/content to render: no text.
Constraints: leave bottom 35% clean and dark for typography, no real company logos unless explicitly approved, no readable secrets, no illegal instructions, avoid distorted hands and gibberish UI.
```

### Inner Slide Image Prompt

```text
Create a realistic cybersecurity explainer visual for an Instagram carousel.
Subject: [safe high-level concept: AI-generated phishing pretext, prompt injection in a document, chatbot data leakage, SOC alert triage, identity verification failure].
Composition: portrait 4:5, clear focal point, dark background, space at top or bottom for short slide text.
Style: cinematic, realistic, high-contrast, blue/green cybersecurity palette, subtle warning tone.
Text/content to render: no text.
Constraints: do not show operational exploit steps, real credentials, real company data, or readable private information.
```

## 4. Caption Formulas

### Standard Caption

```text
[Hook restated in one sentence.]

[What happened or what pattern is emerging.]

[Why it matters in practical security terms.]

[Defender takeaway: policy, process, detection, review, or training.]

[Specific question for comments.]

Follow for AI security breakdowns without the fake panic.

#AI #Cybersecurity #InfoSec #AISecurity #[topic-specific tags]
```

### Myth-Busting Caption

```text
The viral version of this story is missing the important part.

[Explain the claim people are repeating.]

[Clarify what is actually supported by evidence.]

[Explain the real security lesson.]

The takeaway is not “[panic version].” The takeaway is “[practical lesson].”

Would this change how your team evaluates AI risk?

Follow for AI security breakdowns without the fake panic.
```

### Practitioner-Focused Caption

```text
This is not an AI magic trick. It is a workflow problem.

[Describe the workflow or security process being affected.]

[Explain what AI speeds up, lowers the cost of, or makes easier to scale.]

[Explain the control that needs to change.]

If you work in security, the question is not “can AI do this?” It is “where would this bypass our current process?”

What control would you test first?

Follow for practical AI security breakdowns.
```

## 5. QA Gate

Before approving a post, answer these questions and revise if any answer is weak.

| Question | Pass condition |
| --- | --- |
| Is this a verified claim or a scenario? | The wording makes that distinction clear. |
| Could this help someone execute abuse? | No operational payloads, evasion, or exploit-chain details. |
| Would a security practitioner call this misleading? | No exaggerated certainty or fake numbers. |
| Does it help defenders? | At least one control, process, or behavior improvement is included. |
| Is the cover mobile-readable? | Short enough for bold 1080 × 1350 layout. |
| Is the visual safe? | No real secrets, private data, unauthorized logos, or misleading screenshots. |
