# Prompt and Caption Templates for AI Cybersecurity UGC Carousels

Use these templates when generating AI-in-cybersecurity carousel content. Keep claims technically defensible.

**The image engine is FLUX.2 [klein].** What you write here becomes each slide's **`visual_prompt`** in the post JSON — the literal string FLUX.2 receives (front-loaded by `art-comfyui.mjs`). klein has no prompt upsampler, so the text carries the whole idea. Author per `pipeline/content/VISUAL_PROMPT_BANK.md` (§0 rules). The short version:

- **Prose, not tags.** Order: `Subject + Action + Style + Context`, focal subject first.
- **Lighting is the #1 quality lever** — describe it like a DP (source / quality / direction / temperature), before anything else.
- **30–80 words, specific not long.** One or two strong effects, not a stack.
- **No quoted text or lettering words** inside the prompt (klein renders them as garbled type). Keep type-free zones positive: "clean unmarked surfaces, generous negative space in the lower third."
- **Do NOT hardcode an accent colour.** The renderer auto-adds the post **theme's** accent glow + hex and a `Style: … Mood:` tag. Describe the subject + lighting *quality/direction* and let the pipeline supply the hue.

## Cover Image Prompt (→ slide 1 `visual_prompt`)

```text
[image type], [focal subject doing something], lit by [DP-style lighting: source, quality, direction],
[medium/style: cinematic key art / macro photograph / editorial still], dramatic central subject with
clean unmarked surfaces and generous negative space across the lower third.
```

Example (offensive theme — note: no colour word; the renderer adds the red glow):

```text
A cinematic close-up of a single brass key dissolving into fine particles mid-air, lit by one hard rim
light raking from the left through volumetric haze, premium dark key art, the subject held in the upper
third with soft shadow and clean empty space filling the lower third.
```

## Inner Slide Image Prompt (→ inner-slide `visual_prompt`)

```text
[image type], [one safe high-level concept metaphor + action], lit by [DP-style lighting], [medium/style],
clear single focal point with a calm uncluttered lower third.
```

Constraints: synthetic faces only, no real logos/credentials/customer data, no turnkey exploit visuals (keep mechanisms conceptual). Offensive-theme posts may depict mechanisms more concretely when genuinely educational.

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

## Topics
[AI security, cybersecurity, topic-specific phrase, another topic, …]  (plain bracketed list — NOT hashtags, no `#`, no count cap)

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

[topic one, topic two, topic three, … — plain bracketed list, no hashtags]
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
