# IDEA_BACKLOG.md — Scored AI-Cybersecurity Carousel Ideas

40 ideas across the 6 pillars from [CONTENT_PIPELINE.md](CONTENT_PIPELINE.md). Scored on the 5-axis rubric (1–5 each; **produce if total ≥ 18**). If **credibility < 3**, produce only as **[Scenario]** or **Myth-bust**.

**Columns:** Cred · Rel(evance) · Nov(elty) · Dram(a) · Def(ender usefulness) → Total.
**Claim tag:** V = Verified anchor exists · E = Emerging/qualified · S = Scenario/illustrative.
**Verify-before-publish** = the specific thing to re-check so you don't ship a fabricated detail.

> Scores are editorial priority estimates, not facts. The **verify** note is mandatory homework before any number, name, or incident enters a slide.

---

## Pillar: Offensive AI

| # | Cover hook (draft) | Tag | Cred | Rel | Nov | Dram | Def | Total | Verify before publish | Format |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| O1 | AI phishing made your old awareness training obsolete | V | 4 | 5 | 4 | 4 | 5 | **22** | NCSC "uplift in social engineering" wording | 8-slide |
| O2 | The next password-reset attack might sound exactly like your coworker | V | 4 | 5 | 4 | 5 | 5 | **23** | Arup deepfake case details ($25M, video call) | 8-slide |
| O3 | AI lowered the cost of believable social engineering — not the skill ceiling | E | 4 | 4 | 4 | 3 | 4 | **19** | Frame as capability-cost shift, not magic | 8-slide |
| O4 | Attackers are using AI for recon before they ever touch you | E | 4 | 4 | 3 | 4 | 4 | **19** | NCSC recon-uplift language only | 8-slide |
| O5 | Why "spot the typo" anti-phishing advice is aging badly | E | 4 | 5 | 3 | 3 | 5 | **20** | Tie to verification-over-vibes control | 8-slide |
| O6 | Deepfake job candidates are showing up in remote interviews | E | 3 | 4 | 4 | 5 | 4 | **20** | Confirm a reputable report before naming as trend | 8-slide |
| O7 | AI doesn't write better malware — it writes more of the boring parts faster | E | 3 | 3 | 4 | 3 | 4 | **17** | Keep high-level; no code; below threshold → reframe | List |
| O8 | The scam isn't the email anymore. It's the follow-up call. | S | 3 | 4 | 4 | 4 | 5 | **20** | Label as scenario unless citing a case | 8-slide |

## Pillar: Defensive AI

| # | Cover hook (draft) | Tag | Cred | Rel | Nov | Dram | Def | Total | Verify before publish | Format |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| D1 | A junior analyst with AI can triage alerts like a small team | E | 3 | 5 | 3 | 3 | 5 | **19** | Keep as "compresses triage," not "replaces" | 8-slide |
| D2 | AI summarizes the alert. A human still owns the decision. | E | 4 | 5 | 3 | 3 | 5 | **20** | Hallucination-risk slide required | 8-slide |
| D3 | The fastest SOC win with AI isn't detection — it's writing the report | E | 3 | 4 | 4 | 3 | 4 | **18** | Frame as toil reduction | 8-slide |
| D4 | Why your AI SOC copilot needs a "show your sources" rule | E | 4 | 4 | 4 | 3 | 5 | **20** | Tie to verifiability/audit | 8-slide |
| D5 | AI can cluster 10,000 alerts. It can't tell you which one ends your weekend. | S | 3 | 4 | 4 | 4 | 4 | **19** | Label as illustrative | 8-slide |
| D6 | Detection engineering is becoming prompt + review, not just rules | E | 3 | 4 | 4 | 3 | 4 | **18** | Avoid implying rules are dead | List |
| D7 | The dangerous SOC pattern: trusting AI triage without a feedback loop | E | 4 | 4 | 4 | 3 | 5 | **20** | Emphasize measurement | 8-slide |

## Pillar: Model Security

| # | Cover hook (draft) | Tag | Cred | Rel | Nov | Dram | Def | Total | Verify before publish | Format |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| M1 | The weirdest AI attack hides where your agent reads | V | 5 | 5 | 4 | 5 | 5 | **24** | OWASP LLM01 Prompt Injection wording | 8-slide |
| M2 | Direct vs indirect prompt injection — and why indirect is worse | V | 5 | 4 | 4 | 4 | 5 | **22** | OWASP definitions; no payloads | 8-slide |
| M3 | Prompt injection gets dangerous the moment your AI can *act* | V | 5 | 5 | 4 | 4 | 5 | **23** | OWASP Excessive Agency entry | 8-slide |
| M4 | Treat external content like user input wearing a costume | E | 4 | 4 | 5 | 4 | 5 | **22** | Conceptual; tie to isolation control | 8-slide |
| M5 | RAG can leak the very documents it was meant to summarize | E | 4 | 4 | 4 | 4 | 4 | **20** | OWASP Sensitive Info Disclosure | 8-slide |
| M6 | Your AI agent's permissions are its attack surface | E | 4 | 5 | 4 | 3 | 5 | **21** | Least-privilege framing | 8-slide |
| M7 | Model supply chain: you didn't train it, so what's in it? | E | 3 | 3 | 4 | 3 | 4 | **17** | Keep general; below threshold → reframe/sharpen | List |
| M8 | "Ignore previous instructions" is the tip of the injection iceberg | E | 4 | 4 | 4 | 4 | 4 | **20** | No working payloads on slide | 8-slide |
| M9 | Why a confused agent is a security problem, not just a UX bug | E | 4 | 4 | 4 | 3 | 5 | **20** | OWASP Excessive Agency | 8-slide |

## Pillar: Data Leakage / Privacy

| # | Cover hook (draft) | Tag | Cred | Rel | Nov | Dram | Def | Total | Verify before publish | Format |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| L1 | Stop pasting production logs into chatbots | E | 4 | 5 | 4 | 4 | 5 | **22** | Frame as data-governance, not "AI bad" | 8-slide |
| L2 | Employees are pasting secrets into chatbots and calling it productivity | E | 4 | 5 | 4 | 4 | 5 | **22** | Avoid invented % of employees | 8-slide |
| L3 | Your logs contain more secrets than your code does | E | 3 | 4 | 4 | 3 | 4 | **18** | Generic examples only | 8-slide |
| L4 | DLP can miss the clipboard | E | 3 | 4 | 4 | 3 | 4 | **18** | Conceptual control gap | 8-slide |
| L5 | The real leak isn't the model — it's the unmanaged copy/paste | E | 4 | 4 | 4 | 3 | 5 | **20** | Tie to approved-tool workflow | 8-slide |
| L6 | Shadow AI: the tools your security team never approved | E | 4 | 5 | 4 | 4 | 5 | **22** | Frame as inventory/visibility problem | 8-slide |
| L7 | Banning AI tools without a safe path just moves the risk | E | 4 | 4 | 4 | 3 | 5 | **20** | Make-the-safe-path-easy takeaway | 8-slide |
| L8 | What chatbot retention settings actually mean for your data | E | 3 | 4 | 3 | 3 | 4 | **17** | Verify provider claims per tool; reframe | List |

## Pillar: Governance

| # | Cover hook (draft) | Tag | Cred | Rel | Nov | Dram | Def | Total | Verify before publish | Format |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| G1 | Companies adopted AI faster than their controls | E | 4 | 4 | 3 | 3 | 5 | **19** | Keep as pattern, not stat | 8-slide |
| G2 | If you can't log it, you can't govern it | E | 4 | 4 | 3 | 3 | 5 | **19** | Tie to audit trails | 8-slide |
| G3 | Vendor AI risk: 5 questions to ask before you turn it on | E | 4 | 5 | 4 | 3 | 5 | **21** | Generic, reusable checklist | List |
| G4 | "Human in the loop" fails when the human just clicks approve | E | 4 | 4 | 4 | 3 | 5 | **20** | Meaningful-review framing | 8-slide |
| G5 | An AI policy nobody reads is not a control | E | 3 | 4 | 3 | 3 | 4 | **17** | Pair with enablement; reframe | List |
| G6 | NIST/OWASP give you a free starting checklist for AI risk | V | 4 | 4 | 3 | 2 | 5 | **18** | Confirm framework names/links live | List |
| G7 | The audit question that catches most AI mistakes: "who approved this action?" | E | 4 | 4 | 4 | 3 | 5 | **20** | Accountability framing | 8-slide |

## Pillar: Myth-busting

| # | Cover hook (draft) | Tag | Cred | Rel | Nov | Dram | Def | Total | Verify before publish | Format |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Y1 | "AI hacked the company by itself" — here's what actually happened | S | 4 | 5 | 4 | 4 | 5 | **22** | Only cite a real, sourced incident if naming one | Myth |
| Y2 | No, prompt injection isn't always a "breach" | E | 4 | 4 | 4 | 3 | 5 | **20** | Distinguish risk vs confirmed impact | Myth |
| Y3 | AI won't replace your SOC. It will replace some of its busywork. | E | 4 | 4 | 3 | 3 | 5 | **19** | Avoid both hype and dismissal | Myth |
| Y4 | The viral "unhackable AI" claim, debunked calmly | E | 3 | 4 | 4 | 4 | 4 | **19** | Cite the specific claim being corrected | Myth |
| Y5 | "Deepfakes broke trust" is half the story — the other half is process | E | 4 | 4 | 4 | 4 | 5 | **21** | Tie to verification controls | Myth |

---

## How to use this backlog

1. **Mon:** add new rows from intake sources; don't over-edit — capture and move on.
2. **Tue:** sort by Total; pick 5 with pillar variety; confirm each pick's **verify** note is doable this week.
3. Promote a pick into a [POST_TEMPLATE.md](POST_TEMPLATE.md) copy and set its Post ID.
4. After posting, append a **status** + **saves/comments** note to the row (feedback loop).

**Ready for Week 1** (see [WEEK_1_POSTS.md](WEEK_1_POSTS.md)): O1, M1, L1 (reuse existing demo assets) + O2 (deepfake helpdesk) + L6 (shadow AI / governance crossover).
