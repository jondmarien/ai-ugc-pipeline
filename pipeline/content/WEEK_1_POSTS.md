# WEEK_1_POSTS.md — First Batch (5 Ready-to-Produce Carousels)

Built from [POST_TEMPLATE.md](POST_TEMPLATE.md), scored in [IDEA_BACKLOG.md](IDEA_BACKLOG.md), gated by [QA_CHECKLIST.md](QA_CHECKLIST.md).
Posts 1–3 **reuse the existing finished assets** in `ai_cybersecurity_carousel_assets_ready_to_post/` (run a spelling/brand pass first). Posts 4–5 are new and use text-free covers + manual typography.

> Dates are placeholders (`2026-06-0X`). All factual claims are tagged and sourced; re-check links before posting. No invented numbers, CVEs, or quotes.

## Current pipeline (what changed since this doc was first written)
The process tightened — treat the per-post specs below as the *brief*, then run them through the current stack:
- **Theme system** drives colour: `offensive` = red, `defensive` = blue, `hacking` = green, `purple` = purple-team (purple), `ai` = generic AI (orange). Each post below now carries a theme.
- **Research is a loop:** landscape scan → ≥2 independent reputable sources → tier each claim `[Verified]/[Emerging]/[Scenario]` → hard gates (no fabricated URLs, no uncited victims). See [DRAFT_POST_REFERENCE.md](DRAFT_POST_REFERENCE.md).
- **Voice:** every post's copy runs through the `humanizer` skill against [VOICE_AND_TONE_GUIDE.md](VOICE_AND_TONE_GUIDE.md) — sharp, specific, no AI tells.
- **Render:** one command — `cd renderer && bun run pipeline -- <key> --flux2 --vox2` — FLUX.2-klein backgrounds → carousel → package → VoxCPM2 voice → Whisper captions → reel. Design: [renderer/docs/PIPELINE_ARCHITECTURE.md](../../renderer/docs/PIPELINE_ARCHITECTURE.md).
- **Backgrounds** are now AI-generated per-post (unique, theme-coloured, text-free), not the reused demo assets.

---

## POST 1 — AI phishing made old training obsolete

**Post ID:** `2026-06-02-ai-phishing-training-001` · **Pillar:** Offensive AI · **Theme:** offensive (red) · **Status:** ✅ Rendered (FLUX.2 + VoxCPM2)
**Audience:** practitioners, leaders · **Core claim:** AI makes phishing cheaper to personalize at scale, weakening "spot the typo" training. · **Claim tag:** [Verified] (capability), [Emerging] (degree)
**Score:** cred 4 · rel 5 · nov 4 · dram 4 · def 5 → **22/25**

### Source Notes
| Source | Link | Supports | Confidence |
| --- | --- | --- | --- |
| NCSC, "The near-term impact of AI on the cyber threat" (2024) | ncsc.gov.uk/report/impact-of-ai-on-cyber-threat | "uplift in reconnaissance and social engineering"; fewer spelling/grammar tells | High |
| NCSC, "Impact of AI on cyber threat 2025–2027" (2025) | ncsc.gov.uk/report/impact-ai-cyber-threat-now-2027 | AI increases frequency/effectiveness of social engineering | High |

### Cover
Headline: **AI PHISHING MADE OLD TRAINING OBSOLETE** · Subline: *The scam is more personal now.* · Accent: cyan
Visual: dark SOC scene, analyst, blurred inbox, faint synthetic face reflection.

### Carousel script
| # | Role | On-slide copy | Visual |
| --- | --- | --- | --- |
| 1 | Cover | AI PHISHING MADE OLD TRAINING OBSOLETE | cover bg 01 |
| 2 | Context | Old red flags — bad grammar, weird phrasing — are fading. | email previews, error marks dissolving |
| 3 | Risk | NCSC: AI gives attackers uplift in recon and social engineering. | profile fragments → inbox |
| 4 | Mechanism | The change isn't magic hacking. It's cheaper personalization at scale. | branching message bubbles |
| 5 | Failure point | We trained people to spot typos, not to verify requests. | employee near approve button, ignored checklist |
| 6 | Defense | Verify by a second channel. Lock down resets and payment changes. | callback + ticket + approval chain |
| 7 | Takeaway | If your defense relies on scams looking fake, the game changed. | analyst silhouette + lock |
| 8 | CTA | Does your awareness training still teach "spot the typo"? | brand/CTA frame |

### Caption
AI phishing made "spot the typo" training obsolete.

The old red flags — bad grammar, clumsy phrasing, obvious urgency — were never the real defense. They were just the easiest tells. The UK's NCSC assessments describe AI giving attackers an *uplift* in reconnaissance and social engineering, which mostly means cheaper, more personalized lures at scale — not magical hacking.

For defenders, that's a process problem, not a vocabulary problem. If your training teaches people to hunt for spelling mistakes, a clean AI-written message walks right past it.

Defender move: verify sensitive requests (password resets, payment changes) over a second channel, and make that verification mandatory — not optional politeness.

Does your awareness training still lean on "spot the typo"?

Follow for AI security breakdowns without the fake panic.

#Cybersecurity #InfoSec #AISecurity #Phishing #SocialEngineering #SecurityAwareness #ThreatIntel

### Alt text (sample)
1. Dark security operations scene; bold headline space at bottom. 6. Diagram of phone callback and approval workflow. *(complete 1–8 before posting)*

### Assets / upload
Reuse `finished_carousels/carousel_01_ai_phishing_slide_01..08.png` **after spelling/brand review**, or rebuild on `cover_bg_01_ai_phishing.png` with manual type. Files → `2026-06-02_ai-phishing-training_01_cover.png …`

---

## POST 2 — The weirdest AI attack hides where your agent reads

**Post ID:** `2026-06-04-prompt-injection-agents-001` · **Pillar:** Model security · **Theme:** defensive (blue) · **Status:** ✅ Rendered (FLUX.2 + VoxCPM2)
**Audience:** developers, practitioners · **Core claim:** Indirect prompt injection — malicious instructions hidden in content an AI agent reads — gets dangerous when the agent can take actions. · **Claim tag:** [Verified] (OWASP-listed risk)
**Score:** cred 5 · rel 5 · nov 4 · dram 5 · def 5 → **24/25**

### Source Notes
| Source | Link | Supports | Confidence |
| --- | --- | --- | --- |
| OWASP Top 10 for LLM Applications (2025) | genai.owasp.org/llm-top-10/ | Prompt Injection, Sensitive Information Disclosure, Excessive Agency are listed risks | High |

### Cover
Headline: **THE WEIRDEST AI ATTACK HIDES WHERE YOUR AGENT READS** · Subline: *Prompt injection isn't always typed by the user.* · Accent: electric blue

### Carousel script
| # | Role | On-slide copy | Visual |
| --- | --- | --- | --- |
| 1 | Cover | THE WEIRDEST AI ATTACK HIDES WHERE YOUR AGENT READS | cover bg 02 |
| 2 | Context | Direct injection: the user manipulates the model. Indirect: the content does. | split panel user vs document |
| 3 | Risk | It can live in web pages, emails, documents, images — anywhere the agent reads. | scanner over content cards |
| 4 | Mechanism | The risk spikes when the AI can act: send email, read files, call APIs. | agent wired to tools behind permission gates |
| 5 | Failure point | OWASP flags the pattern: injection, sensitive disclosure, excessive agency. | abstract risk board (no logos) |
| 6 | Defense | Isolate untrusted content. Limit tools. Log actions. Confirm sensitive steps. | control room + audit log + approval |
| 7 | Takeaway | Treat external content like user input wearing a costume. | document + glowing lock |
| 8 | CTA | Would your agent trust a webpage it was told to summarize? | brand/CTA frame |

### Caption
The weirdest AI attack doesn't get typed into the chat box. It hides in the content your AI agent reads.

That's *indirect* prompt injection: instructions tucked into a web page, email, document, or image that the model treats as commands. OWASP's Top 10 for LLM Applications lists prompt injection, sensitive-information disclosure, and excessive agency as core risks — and the danger spikes the moment your agent can *act* (send mail, read files, call APIs) on what it just read.

Defender move: isolate untrusted content from privileged tools, scope agent permissions to the minimum, log every action, and require human confirmation for sensitive steps.

If your agent summarizes a random webpage, should it also be allowed to email your team? Where would you draw that line?

Follow for AI security breakdowns without the fake panic.

#Cybersecurity #AISecurity #PromptInjection #LLMSecurity #AIagents #AppSec #OWASP

### Assets / upload
Reuse `carousel_02_prompt_injection_slide_01..08.png` after review, or rebuild on `cover_bg_02_prompt_injection.png`. Files → `2026-06-04_prompt-injection-agents_01_cover.png …`

---

## POST 3 — Stop pasting production logs into chatbots

> **Slot update:** the 2026-06-06 Post 3 slot now ships **"AI malware is real — and mostly overhyped"** (pillar `myth_busting`, **theme hacking/green**) to exercise the third theme — produced + rendered at `renderer/content/posts/2026-06-06_ai-malware-hype.json` (sources: Recorded Future, Expel, Forescout, UIUC). The data-leakage idea below is retained as a **backlog alternate**.

**Post ID:** `2026-06-06-chatbot-log-leak-001` · **Pillar:** Data leakage · **Theme:** offensive (red) · **Status:** Backlog alternate
**Audience:** developers, leaders · **Core claim:** Pasting logs/code into unmanaged AI tools moves sensitive data outside controlled systems. · **Claim tag:** [Emerging] (pattern/risk)
**Score:** cred 4 · rel 5 · nov 4 · dram 4 · def 5 → **22/25**

### Source Notes
| Source | Link | Supports | Confidence |
| --- | --- | --- | --- |
| OWASP Top 10 for LLM Applications (2025) — Sensitive Information Disclosure | genai.owasp.org/llm-top-10/ | Sensitive data can be exposed via LLM apps | High |
| (Framed as a risk pattern, not a cited breach.) | — | — | — |

### Cover
Headline: **STOP PASTING PRODUCTION LOGS INTO CHATBOTS** · Subline: *Productivity can become data leakage.* · Accent: neon green

### Carousel script
| # | Role | On-slide copy | Visual |
| --- | --- | --- | --- |
| 1 | Cover | STOP PASTING PRODUCTION LOGS INTO CHATBOTS | cover bg 03 |
| 2 | Context | The problem isn't "AI bad." It's data leaving controlled systems. | data-boundary diagram |
| 3 | Risk | What leaks: internal notes, source code, client data, logs. | redacted snippets (generic) |
| 4 | Mechanism | Copy/paste loses file context — DLP can miss the clipboard. | classification tag → clipboard fragments |
| 5 | Failure point | Logs can carry tokens, customer IDs, stack traces, API paths. | abstract log stream, redacted markers |
| 6 | Defense | Approved tools. Redaction. Logging. Retention controls. A clear "never paste" rule. | policy dashboard |
| 7 | Takeaway | Make the safe path easier than the risky one. | secure workflow glowing green |
| 8 | CTA | Does your team have a sanctioned way to use AI on real data? | brand/CTA frame |

### Caption
"Just paste the logs into the chatbot and ask it what broke" is how sensitive data quietly leaves your controlled systems.

The issue isn't AI — it's *unmanaged* data movement. Logs alone can carry tokens, customer IDs, stack traces, and internal API paths, and OWASP's LLM Top 10 calls out sensitive-information disclosure as a real risk for AI apps. Clipboard copy/paste also strips file context, so classic DLP can miss it.

Defender move: give people an approved AI tool with redaction, logging, and retention controls — and a simple "never paste production data" rule. Banning AI without a safe path just pushes people to personal accounts.

Does your team have a sanctioned way to use AI on real data? What's the rule?

Follow for AI security breakdowns without the fake panic.

#Cybersecurity #InfoSec #DataProtection #DLP #ShadowIT #AISecurity #CISO

### Assets / upload
Reuse `carousel_03_data_leakage_slide_01..08.png` after review (note: validation flagged a generic "confidential" label on slide 4 — replace with a non-domain label like "classified file" if posting publicly). Files → `2026-06-06_chatbot-log-leak_01_cover.png …`

---

## POST 4 — The next password reset might sound exactly like your CFO

**Post ID:** `2026-06-09-deepfake-helpdesk-001` · **Pillar:** Offensive AI (deepfake) · **Theme:** offensive (red) · **Status:** Drafted (new assets needed)
**Audience:** practitioners, leaders, finance · **Core claim:** Deepfake voice/video can impersonate a known executive to authorize transfers or resets. · **Claim tag:** [Verified] (Arup case) + [Emerging] (broader trend)
**Score:** cred 4 · rel 5 · nov 4 · dram 5 · def 5 → **23/25**

### Source Notes
| Source | Link | Supports | Confidence |
| --- | --- | --- | --- |
| Financial Times (2024) | ft.com — "Arup lost $25mn in Hong Kong deepfake video conference scam" | Engineering firm Arup lost ~HK$200M (~US$25M); fraudsters used a digitally cloned CFO + fake staff on a video call | High |
| SCMP / Fortune (2024) | scmp.com; fortune.com | Confirm Arup as victim; employee made 15 transfers after a video conference with cloned execs | High |

> Use only what these sources state. Do **not** invent the employee's name, exact dates beyond "early 2024," or technical details of how the deepfake was made.

### Cover
Headline: **THE NEXT PASSWORD RESET MIGHT SOUND EXACTLY LIKE YOUR CFO** · Subline: *Voice and video can be faked now.* · Accent: cyan/amber

### Carousel script
| # | Role | On-slide copy | Visual |
| --- | --- | --- | --- |
| 1 | Cover | THE NEXT PASSWORD RESET MIGHT SOUND EXACTLY LIKE YOUR CFO | dim video-call, uncanny participant, waveform |
| 2 | Context | In 2024, engineering firm Arup lost ~$25M after a deepfake video call. (FT) | news-style abstract scene, no real faces |
| 3 | Risk | A request can now look and sound like someone your team recognizes. | blurred silhouettes on a call |
| 4 | Mechanism | Voice/video cloning turns "I trust this face" into a weak control. | mask/costume over a video tile |
| 5 | Failure point | Approval flows that rely on recognizing a person, not verifying a process. | employee approving on a call |
| 6 | Defense | Out-of-band verification + callback to known numbers + dual approval for transfers. | callback + dual-approval icons |
| 7 | Takeaway | Trust the process, not the face on the call. | shield + verified check |
| 8 | CTA | Could a convincing video call trigger a wire transfer at your company today? | brand/CTA frame |

### Caption
The next "urgent" request from your CFO might be a deepfake — and it might be on video.

In 2024, the Financial Times reported that engineering firm Arup lost about US$25 million after fraudsters used a digitally cloned version of a senior executive, alongside fake colleagues, in a video conference that convinced an employee to make a series of transfers. That's a verified, public case — not a hypothetical.

The lesson isn't "video calls are dangerous." It's that recognizing a face or voice was never a strong authorization control, and AI just made that obvious.

Defender move: require out-of-band verification for money movement and credential resets — a callback to a known number, plus dual approval — and make it impossible to skip "because the boss was on the call."

Could a convincing video call trigger a wire transfer at your company today?

Follow for AI security breakdowns without the fake panic.

#Cybersecurity #Deepfake #SocialEngineering #InfoSec #AISecurity #FraudPrevention #CISO

### Assets / upload
New visuals. Generate text-free cover via [VISUAL_PROMPT_BANK.md](VISUAL_PROMPT_BANK.md) "deepfake voice / helpdesk" snippet; set type manually. Files → `2026-06-09_deepfake-helpdesk_01_cover.png …`

---

## POST 5 — Shadow AI: the tools your security team never approved

**Post ID:** `2026-06-11-shadow-ai-inventory-001` · **Pillar:** Governance / Data leakage · **Theme:** defensive (blue) · **Status:** Drafted (new assets needed)
**Audience:** leaders, CISOs, practitioners · **Core claim:** Employees adopt unsanctioned AI tools faster than security can inventory them, creating ungoverned data flows. · **Claim tag:** [Emerging] (pattern)
**Score:** cred 4 · rel 5 · nov 4 · dram 4 · def 5 → **22/25**

### Source Notes
| Source | Link | Supports | Confidence |
| --- | --- | --- | --- |
| OWASP Top 10 for LLM Applications (2025) | genai.owasp.org/llm-top-10/ | Sensitive-information disclosure risk in LLM apps | High |
| (Pattern framing; no invented adoption statistics.) | — | — | — |

### Cover
Headline: **SHADOW AI: THE TOOLS YOUR SECURITY TEAM NEVER APPROVED** · Subline: *You can't govern what you can't see.* · Accent: amber

### Carousel script
| # | Role | On-slide copy | Visual |
| --- | --- | --- | --- |
| 1 | Cover | SHADOW AI: THE TOOLS YOUR SECURITY TEAM NEVER APPROVED | app inventory board, unapproved tools outside perimeter |
| 2 | Context | Teams adopt AI tools faster than anyone can inventory them. | sprawl of glowing app icons |
| 3 | Risk | Each unsanctioned tool is an ungoverned path for company data. | data streams leaving the perimeter |
| 4 | Mechanism | No approval = no logging, no retention rules, no data-handling review. | missing audit log / broken chain |
| 5 | Failure point | Security finds out after the data already left. | timeline: usage before discovery |
| 6 | Defense | Inventory AI usage. Offer sanctioned tools. Set data rules. Review vendors. | governance dashboard |
| 7 | Takeaway | Visibility first. You can't govern what you can't see. | eye/shield over app map |
| 8 | CTA | Do you have a current list of AI tools your team actually uses? | brand/CTA frame |

### Caption
Most "AI risk" in companies right now isn't a sci-fi attack. It's shadow AI — the tools employees adopted before anyone reviewed them.

When a tool isn't sanctioned, there's usually no logging, no retention policy, and no data-handling review behind it. So data flows out through paths security can't see, and the team often finds out *after* the fact. OWASP's LLM Top 10 highlights sensitive-information disclosure as a real risk — and unmanaged tools make it more likely.

Defender move: start with visibility, not bans. Inventory which AI tools are actually in use, offer a sanctioned alternative with clear data rules, and run AI tools through the same vendor review as any other SaaS.

Do you have a current list of the AI tools your team actually uses? How would you even build it?

Follow for AI security breakdowns without the fake panic.

#Cybersecurity #AIGovernance #ShadowIT #GRC #DataProtection #CISO #InfoSec

### Assets / upload
New visuals. Cover via [VISUAL_PROMPT_BANK.md](VISUAL_PROMPT_BANK.md) "Shadow AI" snippet, manual type. Files → `2026-06-11_shadow-ai-inventory_01_cover.png …`

---

## Week-1 production checklist

- [ ] Posts 1–3: spelling/brand review of existing AI-rendered slides (or rebuild on text-free covers)
- [ ] Posts 4–5: generate text-free covers + inner slides, set type in Canva/Figma
- [ ] Complete alt text (1–8) for every post
- [ ] Re-open every source link; confirm claims still match
- [ ] Run [QA_CHECKLIST.md](QA_CHECKLIST.md) on all 5
- [ ] Export ordered PNGs into per-post folders; add `caption.txt` + `alt_text.txt` + `sources.md`
- [ ] Schedule/post via Business Suite; log Post IDs + metrics in [IDEA_BACKLOG.md](IDEA_BACKLOG.md)
- [ ] Optional: pick 1–2 for Reel variants via [WEEK_1_VIDEO_EXPERIMENTS.md](../media/WEEK_1_VIDEO_EXPERIMENTS.md)
