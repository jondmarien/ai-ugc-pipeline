# CONTENT_PIPELINE.md — Weekly AI-Cybersecurity Carousel + Video Pipeline

**Positioning:** *AI cybersecurity explained through viral carousels: real threats, real tools, no fake panic.*

> **Voice & tone** (incl. the de-AI ruleset): [VOICE_AND_TONE_GUIDE.md](VOICE_AND_TONE_GUIDE.md). Copy must read human, not machine-made — the `humanizer` skill enforces it.

**Status:** Manual-first (Meta API pending). Structured for later API automation.
**Default canvas:** 1080 × 1350 px portrait (carousel) · 1080 × 1920 px (Reels/video).
**Owner:** Jon (D-Sports). **Cadence:** 3–5 posts/week.

> This file is the spine of the system. Every other file plugs into it:
> [IDEA_BACKLOG.md](IDEA_BACKLOG.md) feeds intake · [POST_TEMPLATE.md](POST_TEMPLATE.md) is the unit of work ·
> [CAPTION_BANK.md](CAPTION_BANK.md) + [VISUAL_PROMPT_BANK.md](VISUAL_PROMPT_BANK.md) feed production ·
> [QA_CHECKLIST.md](QA_CHECKLIST.md) is the gate · [WEEK_1_POSTS.md](WEEK_1_POSTS.md) is the first batch.
> The media/video layer ([MEDIA_TOOL_STACK.md](../media/MEDIA_TOOL_STACK.md), [VIDEO_ASSEMBLY_WORKFLOW.md](../media/VIDEO_ASSEMBLY_WORKFLOW.md))
> attaches at the Production stage for Reel variants.

---

## 1. Operating principle

Package like a high-performing AI/tech carousel; judge claims like a security practitioner.

| We do | We don't |
| --- | --- |
| Dramatic, curiosity-driven covers | Fake panic, invented numbers, fabricated CVEs/quotes |
| Tag every claim **[Verified] / [Emerging] / [Scenario]** | State scenarios as if they were confirmed events |
| Explain mechanisms at a high level | Publish payloads, exploit chains, or evasion steps |
| End every post with a defender takeaway | Leave the audience with hype and no action |
| Cite a primary/reputable source when factual | Name real victims without a source |

> **NEW: Algorithmic Growth Sequence** (Chris Chung @iamchrischung)
> Instagram growth follows a specific order of operations — optimize in sequence, not in parallel:
> ```
> 1. HOOK (Skip Rate)     → 2. VALUE (Shares/Saves)  → 3. RESONANCE (Likes)
> ```
> - **Hook**: Contradict common belief in first 1s
> - **Value**: Non-obvious + highly tactical = saveable
> - **Resonance**: Label a feeling they've had 100× but couldn't name

---

## 2. Pipeline stages (idea → posted)

| Stage | Input | Process | Output | File used |
| --- | --- | --- | --- | --- |
| 1. Intake | News, papers, CVEs, vendor posts, repos, observations | Capture topic + source + claim + angle + pillar | Raw idea row | [IDEA_BACKLOG.md](IDEA_BACKLOG.md) |
| 2. Score | Raw ideas | 8-axis 1–5 rubric, threshold ≥ 24 | Ranked candidates | [IDEA_BACKLOG.md](IDEA_BACKLOG.md) §rubric |
| 3. Frame | Selected idea | One defensible hook + one audience promise + claim tag | Cover headline + thesis | [CAPTION_BANK.md](CAPTION_BANK.md) hook formulas |
| 4. Script | Hook + sources | 8-slide arc (Hook→Value→Resonance) | Slide-by-slide script | [POST_TEMPLATE.md](POST_TEMPLATE.md) |
| 5. Visual | Slide script | Cover + inner prompts, **no rendered text** | Image prompts + layout notes | [VISUAL_PROMPT_BANK.md](VISUAL_PROMPT_BANK.md) |
| 6. Caption | Final thesis | Narrative caption + question + CTA + hashtags + alt text | Caption package | [CAPTION_BANK.md](CAPTION_BANK.md) |
| 7. QA | Full draft | Credibility / safety / source / a11y / brand gates | Approved or revised | [QA_CHECKLIST.md](QA_CHECKLIST.md) |
| 8. Assemble | Approved package | Set type in Canva/Figma; export ordered PNGs (+ Reel if video) | Upload-ready files | [VIDEO_ASSEMBLY_WORKFLOW.md](../media/VIDEO_ASSEMBLY_WORKFLOW.md) |
| 9. Upload | Export package | Manual post via Business Suite / IG | Posted/scheduled | §7 below |
| 10. Feedback | Saves, comments, reach | Log hook performance, replies | Hook learnings | §8 below |

---

## 3. Weekly cadence

| Day | Focus | Target output |
| --- | --- | --- |
| **Mon** | Intake | Add 15–25 raw ideas to backlog |
| **Tue** | Score + select | Lock 5 posts (≥24) for the week |
| **Wed** | Script + caption | 5 slide scripts + 5 caption packages |
| **Thu** | Visuals + assembly | 5 carousels designed & exported (+ any Reel cut) |
| **Fri** | QA + schedule | 5 QA-passed packages posted or queued |
| **Daily (15 min)** | Engage + learn | Reply to comments; log hook saves/reach |

> **Batch rule:** never design before scripting, never script before scoring, never post before QA. The order is the quality control.

---

## 4. Content pillars

| Pillar | Include | Avoid |
| --- | --- | --- |
| **Offensive AI** | Capability shifts (recon, phishing personalization, social engineering at scale) | Payloads, evasion, credential-theft walkthroughs |
| **Defensive AI** | SOC triage, alert summarization, detection support, IR assist | "AI replaces analysts" claims |
| **Model security** | Prompt injection, tool/agent abuse, RAG exposure, model supply chain | Treating every injection as a confirmed breach |
| **Data leakage** | Secrets in prompts/logs, chatbot retention, SaaS sprawl | Naming victims without a source |
| **Governance** | AI policy, vendor review, logging, access control, audit | Compliance theater with no takeaway |
| **Myth-busting** | Correcting viral AI panic and misread demos | Dismissive contrarianism without explanation |

Aim for pillar variety across the week (don't post three Offensive-AI hooks in a row).

---

## 5. Scoring rubric (Stage 2)

Score 1–5 on each axis. **Produce if total ≥ 24.** If **Technical credibility < 3**, do not produce as fact — reframe as **[Scenario]** or **Myth-busting**, or skip.

| Axis | 1 | 3 | 5 |
| --- | --- | --- | --- |
| Technical credibility | Vague rumor | Plausible, some support | Primary/reputable source, clear claim |
| Audience relevance | Too generic | Relevant to some | Immediately relevant to defenders/builders/leaders |
| Novelty | Recycled | Familiar topic, fresh angle | Timely, surprising, under-discussed |
| Visual drama | Hard to visualize | Some metaphor | Strong cinematic cover potential |
| Defender usefulness | No takeaway | General advice | Concrete control, process, or question |
| **Hook strength (Skip Rate)** | Generic fact | Contradicts assumption | Flips common belief in 1s |
| **Value density (Shares/Saves)** | Common knowledge | Useful tip | Non-obvious + tactical framework |
| **Resonance (Likes)** | Generic close | Names a pain point | Labels a 100× unnamed feeling |

---

## 6. Source-validation rules (Stage 1 & 7)

- Prefer **primary or reputable** sources: vendor security blogs, CVE/NVD, OWASP, NIST/NCSC/CISA, peer-reviewed papers, official incident reports, court filings, named-author journalism.
- Record source name + URL + what it supports + confidence (High/Med/Low) in the post's Source table.
- **Never invent** statistics, timelines, company names, breach details, CVE IDs, tool capabilities, or quotes.
- Uncertain? Use hedged verbs: *could, may, reported, demoed, the risk is* — and tag **[Emerging]** or **[Scenario]**.
- A dramatic claim with no source becomes a **myth-bust** or a clearly-labeled scenario, never a stated fact.

**Pre-validated anchor facts** (safe to reference, re-check before each use):
- OWASP Top 10 for LLM Applications (2025) — Prompt Injection, Sensitive Information Disclosure, Excessive Agency are listed entries. → `owasp.org` / `genai.owasp.org/llm-top-10/`
- NCSC assessments on AI and the cyber threat (Jan 2024; 2025–2027 update) — "uplift in reconnaissance and social engineering." → `ncsc.gov.uk`
- Arup Hong Kong deepfake fraud (~US$25M / HK$200M, cloned CFO on video call; reported Feb 2024, confirmed by Arup May 2024). → FT / SCMP / Fortune

---

## 7. Manual upload package + checklist

Each approved post exports as a folder named `YYYY-MM-DD_post-slug/` containing:

```text
YYYY-MM-DD_post-slug_01_cover.png
YYYY-MM-DD_post-slug_02_context.png
YYYY-MM-DD_post-slug_03_risk.png
YYYY-MM-DD_post-slug_04_mechanism.png
YYYY-MM-DD_post-slug_05_failure-point.png
YYYY-MM-DD_post-slug_06_defense.png
YYYY-MM-DD_post-slug_07_takeaway.png
YYYY-MM-DD_post-slug_08_cta.png
caption.txt        # caption + hashtags, ready to paste
alt_text.txt       # per-slide alt text
sources.md         # source table + claim tags
```

**Manual posting checklist (Business Suite / Instagram):**
1. Confirm QA pass in [QA_CHECKLIST.md](QA_CHECKLIST.md).
2. Upload slides **in filename order** (01 → 08).
3. Paste caption from `caption.txt`; confirm first line (hook) is strong before the "more" fold.
4. Add alt text per slide from `alt_text.txt`.
5. Set cover/thumbnail = slide 01.
6. Post now or schedule; log Post ID + date in the backlog status column.

---

## 8. Feedback loop (Stage 10)

Track lightweight metrics per post in the backlog:

| Field | Why |
| --- | --- |
| Saves | Best signal of "useful" content |
| Shares/sends | Reach driver |
| Comments + top question | Future post fuel |
| Reach / non-follower reach | Hook discoverability |
| Hook formula used | Learn which formulas win |
| **Value tag** | Was takeaway non-obvious + tactical? |
| **Resonance tag** | Did CTA label a shared feeling? |

Rule: when a hook formula lands (high saves), reuse the **pattern** on a new topic; when one flops, retire it for that pillar.

---

## 9. Future API path (do **not** build yet)

Kept for when Meta Developer access clears. Human approval gate stays mandatory.

```env
META_APP_ID=
META_APP_SECRET=
META_REDIRECT_URI=
META_LONG_LIVED_ACCESS_TOKEN=
IG_USER_ID=
FACEBOOK_PAGE_ID=
```

```text
/me/accounts → find connected Facebook Page
→ /{page-id}?fields=instagram_business_account → get IG user ID
→ create media container(s) (carousel children)
→ create carousel container → publish AFTER human approval
```

Because the upload package is already structured (ordered filenames + `caption.txt` + `sources.md`), a later script can parse a post folder and create containers without reworking content.

---

## 10. Definition of done (per post)

- [ ] Scored ≥ 24 (or justified myth-bust/scenario)
- [ ] Every factual claim sourced and claim-tagged
- [ ] 8 slides scripted; cover mobile-readable
- [ ] **Slide 7 = Value phase (non-obvious + tactical)**
- [ ] **Slide 8 = Resonance phase (labels shared feeling)**
- [ ] Image prompts produced (no rendered text)
- [ ] Caption + question + CTA + 5–10 hashtags + alt text
- [ ] QA checklist fully passed
- [ ] Files exported in order; folder named by convention
- [ ] Posted/scheduled; status + metrics logged