# Prompt and Caption Templates for AI Cybersecurity UGC Carousels

Use these templates when generating AI-in-cybersecurity carousel content. Keep claims technically defensible and avoid step-by-step abuse instructions.

## Cover Image Prompt

```text
Create a cinematic vertical social media cover image for an AI cybersecurity carousel.
Subject: [specific scene: security analyst, AI agent, phishing inbox, SOC room, cloud dashboard, exposed API, deepfake call center].
Composition: portrait 4:5, dramatic central subject, strong empty dark lower-third area for headline text, high contrast, mobile-first readability.
Style: realistic editorial technology photography, cyberpunk blue/green lighting, premium magazine cover feel, sharp details, dark atmosphere.
Text/content to render: no text.
Constraints: leave bottom 35% clean and dark for typography, no real company logos unless requested, no readable secrets, no illegal instructions, avoid distorted hands and gibberish UI.
```

## Inner Slide Image Prompt

```text
Create a realistic cybersecurity explainer visual for an Instagram carousel.
Subject: [safe high-level concept: AI-generated phishing pretext, prompt injection in a document, chatbot data leakage, SOC alert triage, identity verification failure].
Composition: portrait 4:5, clear focal point, dark background, space at top or bottom for short slide text.
Style: cinematic, realistic, high-contrast, blue/green cybersecurity palette, subtle warning tone.
Text/content to render: no text.
Constraints: do not show operational exploit steps, real credentials, real company data, or readable private information.
```

## Complete Carousel Output Template

```markdown
## Cover
Headline: [ALL-CAPS OR PUNCHY HOOK]
Subline: [optional: 5–8 words]
Visual: [cinematic visual direction]

## Carousel Script
| Slide | On-slide copy | Visual direction |
| --- | --- | --- |
| 1 | [cover headline] | [cover visual] |
| 2 | [what happened] | [context visual] |
| 3 | [why it matters] | [impact visual] |
| 4 | [safe high-level mechanism] | [mechanism visual] |
| 5 | [where teams fail] | [gap visual] |
| 6 | [defensive move] | [control visual] |
| 7 | [memorable takeaway] | [takeaway visual] |
| 8 | [CTA/question] | [brand/CTA visual] |

## Caption
[Short narrative caption]

## Hashtags
#AI #Cybersecurity #InfoSec #AIsecurity #[topic-specific tags]

## QA Notes
[Source support, uncertainty, safety, and technical caveats]
```

## Caption Formula

```text
[Hook restated in one sentence.]

[Explain what happened or what pattern is emerging in plain language.]

[Explain why it matters for attackers, defenders, developers, or executives.]

[Add a practical defender takeaway: policy, detection, process, training, review, logging, access control, or vendor risk.]

[Ask one specific comment question.]

Follow for AI security breakdowns without the fake panic.

#[5–10 relevant hashtags]
```

## Hook Bank

| Pattern | Example |
| --- | --- |
| Someone used AI to... | Someone used AI to clone a helpdesk voice and reset an employee password |
| The scary part is not... | The scary part is not malware. It is AI-written trust. |
| Stop doing... | Stop pasting production logs into chatbots without a redaction layer |
| Most teams missed... | Most teams missed the real risk in AI browser agents |
| X examples... | 9 ways AI agents can leak company data without getting hacked |
| This changes... | This changes how phishing simulations need to be built |
| The weirdest attack... | The weirdest AI attack is instructions hidden where your agent reads |

## Ready-to-Use Concepts

| Pillar | Cover hook | Slide arc |
| --- | --- | --- |
| AI phishing | AI PHISHING JUST CROSSED A LINE MOST TEAMS ARE NOT READY FOR | Hook → personalization → attack flow → weak training → defenses → takeaway |
| Prompt injection | THE WEIRDEST AI ATTACK IS INSTRUCTIONS HIDDEN IN PLAIN SIGHT | Hook → definition → example → agent risk → mitigations → takeaway |
| Data leakage | EMPLOYEES ARE PASTING SECRETS INTO CHATBOTS AND CALLING IT PRODUCTIVITY | Hook → what leaks → why logs matter → policy gap → controls → takeaway |
| AI SOC | A JUNIOR ANALYST WITH AI CAN NOW TRIAGE ALERTS LIKE A SMALL TEAM | Hook → workflow → benefits → hallucination risk → human review → takeaway |
| Deepfake helpdesk | THE NEXT PASSWORD RESET ATTACK MIGHT SOUND EXACTLY LIKE YOUR COWORKER | Hook → voice cloning → helpdesk weakness → verification process → controls |

## QA Gate

Before final output, answer these internally and revise if any answer is weak.

| Question | Pass condition |
| --- | --- |
| Is this a verified claim or a scenario? | The wording makes that distinction clear |
| Could this help someone execute abuse? | No operational steps, payloads, evasion, or exploit chain details |
| Would a security practitioner call this misleading? | No exaggerated certainty or fake numbers |
| Does it help defenders? | At least one control, behavior, or process improvement is included |
| Is the cover mobile-readable? | Short enough for a bold 1080 × 1350 cover |
