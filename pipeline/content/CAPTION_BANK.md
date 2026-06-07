# CAPTION_BANK.md — Hooks, Captions, CTAs, Hashtags, Comment Prompts

Plug-and-play copy for Stage 3 (Frame) and Stage 6 (Caption) of [CONTENT_PIPELINE.md](CONTENT_PIPELINE.md).
House voice: direct, sharp, practical — a security-literate operator explaining what the AI hype actually means. Curiosity on the cover, nuance in the caption.

> Full voice spec + the de-AI ruleset: **[VOICE_AND_TONE_GUIDE.md](VOICE_AND_TONE_GUIDE.md)** (this file is the quick hook/caption/CTA bank). Final copy runs through the `humanizer` skill.

---

## 1. Cover Hook Formulas

Formula = **specific actor/object + unexpected AI action + clear consequence.** Avoid fake precision.

| Formula | Cybersecurity example |
| --- | --- |
| `Someone used AI to [action] and [consequence]` | Someone used AI to clone a CFO's voice on a video call — and an employee wired the money |
| `The scary part isn't [obvious]. It's [real risk].` | The scary part isn't the malware. It's the AI-written trust. |
| `Stop [behavior] before [consequence]` | Stop pasting production logs into chatbots before you know where they're stored |
| `Most teams missed [hidden risk]` | Most teams missed the real risk in AI browser agents |
| `[N] ways [system] can [failure]` | 9 ways AI agents can leak company data without getting "hacked" |
| `This changes how [process] works` | This changes how phishing simulations need to be built |
| `The weirdest AI attack is [vector]` | The weirdest AI attack hides where your agent reads |
| `No, [viral claim]. Here's what actually happened.` | No, the AI didn't hack the company by itself. Here's what actually happened. |
| `Your [thing] is its own attack surface` | Your AI agent's permissions are its attack surface |

> **NEW: Algorithmic Growth Hook Principles** (Chris Chung @iamchrischung)
> - **Contradict common belief** in the first second
> - State a widely-held assumption → immediately flip it
> - `"Everyone thinks X. Actually Y."` — "Everyone thinks you need 10k followers. Actually you need 100 true fans."
> - `"Stop doing X. Start doing Y."` — "Stop posting 3×/day. Start posting 1× with a system."
> - `"The [common advice] is wrong because [reason]."` — "Posting at 9am is wrong because your audience is at work."

**Hook hygiene:** if a number isn't sourced, drop it. "Most," "many," "a lot of" beat an invented "73%."

> **Cover budget + concrete-promise heuristic** (2026-06-07, `pipeline/content/ingested/`)
> - **8 words max on the cover** (excluding subline). The cover's only job is stopping the scroll; qualifiers move to the subline. Industry data puts ~80% of carousel engagement on slide 1.
> - **Concrete and countable beats abstract.** Same-account natural experiment: "steal my X system, 6 rules" pulled ~37x the likes of "the one page system" (@growithalex, May 2026; n=2, uncontrolled — treat as a heuristic, not a law). Prefer numbers, named objects, and verbs over concepts.

---

## 2. Caption Frameworks

### A. Standard (default 8-slide post — Hook → Value → Resonance)

```
[Hook restated in one sharp sentence.]

[What happened / what pattern is emerging — plain language. Tag it: this is verified / emerging / a scenario.]

[Why it matters in practical security terms — for attackers, defenders, builders, or leaders.]

[Defender takeaway: ONE concrete control — verification, detection, policy, logging, access, training, or vendor review.]

[One specific comment question that labels a shared feeling.]

Follow for AI security breakdowns without the fake panic.

#AI #Cybersecurity #InfoSec #AISecurity #[topic tags]
```

### B. Myth-busting

```
The viral version of this story is missing the important part.

[The claim people are repeating.]

[What's actually supported by evidence — and what isn't.]

[The real security lesson.]

The takeaway isn't "[panic version]." It's "[practical lesson]."

Would this change how your team evaluates AI risk?

Follow for AI security breakdowns without the fake panic.
```

### C. Practitioner-focused

```
This isn't an AI magic trick. It's a workflow problem.

[The security workflow/process being affected.]

[What AI speeds up, lowers the cost of, or scales.]

[The control that needs to change.]

If you work in security, the question isn't "can AI do this?" It's "where would this bypass our current process?"

What control would you test first?

Follow for practical AI security breakdowns.
```

### D. List post (e.g. "5 questions / 9 ways")

```
[Hook as a promise of a usable list.]

Save this for your next [review / vendor call / policy update].

[1–2 line framing of why the list matters.]

The full list is in the carousel 👉 which one would you add?

Follow for AI security breakdowns without the fake panic.
```

---

## 3. Value Phase Templates (Slide 7 / Takeaway — for Shares/Saves)

> **Principle:** Non-obvious + highly tactical = saveable

| Template | Example |
| --- | --- |
| `"Before you [action], check [specific control]."` | "Before you deploy an AI agent, check its permission scope — calendar? email? files?" |
| `"The control that stops this: [one concrete step]."` | "The control that stops prompt injection: a second-channel verification before any agent action." |
| `"Save this [checklist/framework] for your next [scenario]."` | "Save this 3-question vendor eval for your next AI tool purchase." |
| `"Most teams skip [step]. Don't."` | "Most teams skip output validation on agent tool calls. Don't." |

> **Save-object requirement** (2026-06-07): the takeaway slide must BE the saveable artifact, not just describe one. Pick a format: **named checklist** ("The 3-question agent-permission check"), **decision rule** ("If the agent can write AND reach the internet, it needs a human gate"), **query/detection snippet** (one real KQL/Sigma/SPL line), or **fill-in-the-blank framework** ("Before our agent touches ___, it must ___"). Fallback when the topic resists a framework: one sharp quotable rule. Carousels are the most-saved format on Instagram and saves/sends are the highest-weighted ranking signals; this slide is where reach converts.

---

## 4. Resonance Phase Templates (Slide 8 / CTA — for Likes/Comments)

> **Principle:** Label a feeling they've had 100× but couldn't name

| Template | Example |
| --- | --- |
| `"You've felt [feeling] when [situation]. That's [label]."` | "You've felt that knot when an agent asks for calendar access. That's permission anxiety." |
| `"The 2am thought: [unspoken worry]."` | "The 2am thought: 'Did my agent just email the board?'" |
| `"What nobody says: [hard truth]."` | "What nobody says: your agent's permissions ARE the attack surface." |
| `"[Identity] don't [behavior]. We [better behavior]."` | "Security teams don't hope agents behave. We scope permissions." |

---

## 5. CTA Variations

Rotate so the account doesn't sound robotic. One CTA per post.

| Goal | CTA line |
| --- | --- |
| Saves | "Save this before your next AI tool rollout." |
| Saves | "Bookmark this for your next vendor review." |
| Comments | "What would you add? Drop it below." |
| Comments | "Which one bites your team hardest?" |
| Shares | "Send this to whoever owns AI policy." |
| Shares | "Tag the person who keeps pasting logs into chatbots." |
| Follow | "Follow for AI security breakdowns without the fake panic." |
| Follow | "Follow if you want the real version, not the hype." |
| Discussion | "Verified, emerging, or overblown? Tell me where I'm wrong." |

---

## 6. Hashtag Sets (3–5 tags, categorization only)

> **Updated 2026-06-07 — hashtags are categorization, not reach.** Mosseri (on record, 2025): "Hashtags are no longer a primary way to increase your reach on Instagram. They don't significantly increase your reach." Current platform guidance is **3–5 highly relevant tags max**; more can read as spam. The reach lever moved to **keyword-rich captions**: Instagram indexes caption text for search and recommendations (and is pushing IG content into Google), so write the topic's natural keywords into the caption body ("prompt injection", "SOC triage", "AI agent permissions") instead of stuffing tags. Pick 3–5 from one pillar row below; treat the old 5–10 guidance as deprecated.

Mix 1–2 broad + 2–3 niche. Drop any that look spammy.

| Pillar | Set |
| --- | --- |
| **Core (always-eligible)** | `#Cybersecurity #InfoSec #AISecurity #AI #CyberSecurityAwareness` |
| **Offensive AI** | `#Phishing #SocialEngineering #ThreatIntel #Deepfake #SecurityAwareness` |
| **Defensive AI** | `#SOC #BlueTeam #DetectionEngineering #SecOps #IncidentResponse` |
| **Model security** | `#PromptInjection #LLMSecurity #AIagents #AppSec #OWASP` |
| **Data leakage** | `#DataProtection #DLP #ShadowIT #DataPrivacy #CISO` |
| **Governance** | `#GRC #AIGovernance #RiskManagement #Compliance #CISO` |
| **Myth-busting** | `#CyberMyths #SecurityCulture #ThreatIntel #AIhype #InfoSec` |

> Keep a do-not-use list of banned/flagged or overly generic tags; review monthly.

---

## 7. Comment-Prompt Bank (seed the conversation)

Pin one as the first comment to drive replies:

- "Quick gut check: is this **verified**, **emerging**, or **overblown** in your view?"
- "What's the first control you'd test against this?"
- "Defenders: where does this slip past your current process?"
- "Founders/leaders: would this survive your next board risk review?"
- "What did I get wrong? I'd rather be corrected than confident."
- "Drop your team's 'safe AI usage' rule — best one gets pinned."
- "What's the 2am AI-security thought keeping you up?"

---

## 8. Voice Rules (quick reference)

| Weak | Better |
| --- | --- |
| AI is changing cybersecurity forever | AI phishing is making old awareness training obsolete |
| Hackers can destroy companies with one prompt | AI lowers the cost of believable social engineering |
| This new tool is terrifying | This tool shows why agent permissions need review |
| Nobody is talking about this | Most teams are watching the wrong part of the risk |

Active voice. Short on-slide copy. Nuance lives in the caption. Never imply certainty you can't source.

---

## 9. Posting Schedule Reference (from @_techy.boy carousel "When to Post for MAX REACH")

> **Source:** Ingested carousel, OCR'd 2026-06-06 — see `INGESTED_CAROUSEL_POSTING_SCHEDULE.md`
> **Use:** Inform `/draft-week` calendar weights, manual upload timing, or adapt as cybersecurity carousel

### Daily Optimal Windows

| Day | Time(s) | Rationale |
|-----|---------|-----------|
| **Monday** | 15:00, 17:00, 19:00 | Peak engagement after work hours |
| **Tuesday** | Consistent daily slot | Consistency builds stronger reach |
| **Wednesday** | Consistent daily slot | Mid-week scroll time is real |
| **Thursday** | 14:00, 16:00 | Pre-weekend energy kicks in |
| **Friday** | Before 17:00 | Post before weekend wind-down |
| **Saturday** | 10:00, 14:00 | Morning browsers & lunch scrollers |
| **Sunday** | Morning + Evening | Lazy morning + evening wind-down |

### Cybersecurity Adaptation (Content-Specific)

| Day | AI-Security Rationale | Suggested Pillar |
|-----|----------------------|------------------|
| **Monday** | CISOs planning week, reading threat intel | Governance / Defensive |
| **Tuesday** | Practitioners deep in detection work | Defensive AI / Model Security |
| **Wednesday** | Mid-week vendor evals, tool reviews | Governance / Data Leakage |
| **Thursday** | Pre-weekend threat drops, weekend prep | Offensive AI / Myth-busting |
| **Friday** | Before log-off, quick saves for Monday | Any (high-save CTA) |
| **Saturday** | Founders/leaders catching up on reading | Long-form / List post |
| **Sunday** | CISO newsletter reads, strategic planning | Governance / Myth-busting |

### Integration with `/draft-week`

When generating a weekly calendar, weight slots:
- **Mon/Tue/Wed/Thu**: 2× weight (higher engagement)
- **Fri**: 1.5× (save-heavy)
- **Sat/Sun**: 1× (niche audience, but high-save potential)