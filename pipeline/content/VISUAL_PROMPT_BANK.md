# VISUAL_PROMPT_BANK.md — Cover & Inner-Slide Image Prompts

Reusable cinematic prompts for Stage 5 (Visual) of [CONTENT_PIPELINE.md](CONTENT_PIPELINE.md), grouped by pillar.
**Default canvas:** 1080 × 1350 portrait (4:5). **Default rule: request NO rendered text** — type is set manually in Canva/Figma for spelling/brand control. For b-roll/video prompts see [BROLL_PROMPT_BANK.md](../media/BROLL_PROMPT_BANK.md).

---

## 1. Shared style block (paste into every prompt)

```text
Style: realistic editorial technology photography meets premium social-carousel design.
Mood: cinematic, dark, high-contrast, subtle warning tone, credible (not cartoonish "hacker in a hoodie").
Lighting/palette: dark background with ONE accent glow — cyan, electric blue, neon green, or warning amber.
Composition: portrait 4:5, 1080x1350, strong central subject, clean dark lower-third (bottom ~35%) reserved for headline typography.
Constraints: NO text, NO real company logos, NO readable credentials/emails/secrets, NO operational exploit steps or payloads on screen,
avoid distorted hands and gibberish UI, keep any on-screen UI abstract and blurred.
```

**Accent-color convention** (keeps pillars visually distinct in the grid):
- Offensive AI → **cyan**  ·  Model security → **electric blue**  ·  Data leakage → **neon green**
- Defensive AI → **cool teal**  ·  Governance → **amber/desaturated blue**  ·  Myth-busting → **red-to-blue split**

---

## 2. Cover prompt template

```text
Create a cinematic vertical social-media COVER background for an AI-cybersecurity carousel.
Subject: [SCENE — see pillar tables below].
Composition: portrait 4:5, 1080x1350, dramatic central subject, strong empty dark lower-third for headline text, mobile-first readability.
[+ Shared style block]
Text/content to render: no text.
```

## 3. Inner-slide prompt template

```text
Create a realistic cybersecurity EXPLAINER visual for an Instagram carousel slide.
Subject: [safe high-level concept — see slide-role table].
Composition: portrait 4:5, clear focal point, dark background, clean space top OR bottom for short slide text.
[+ Shared style block]
Text/content to render: no text.
```

---

## 4. Cover scenes by pillar

| Pillar | Cover subject (drop into template) |
| --- | --- |
| **Offensive AI** | A security analyst at a dark workstation; a blurred phishing inbox on the monitor; a faint synthetic human face reflected in the glass. Cyan lighting. |
| **Offensive AI (deepfake)** | A dim video-conference call; one participant subtly "rendered"/uncanny; soft audio-waveform glow; blurred silhouettes, no real faces. Cyan/amber. |
| **Defensive AI** | A SOC analyst lit by multiple dashboards; an AI assistant glow overlaying a wall of alerts collapsing into a short prioritized list. Cool teal. |
| **Model security** | A glowing abstract AI agent reading a webpage/document; faint shadow-like instruction patterns hidden behind normal content blocks. Electric blue. |
| **Data leakage** | A developer about to paste blurred production logs into an AI chat panel; redacted token shapes; a subtle warning glow. Neon green. |
| **Governance** | A boardroom/console hybrid: an AI control dashboard with permission gates, audit-log lines, and an approval checkpoint. Amber/desaturated blue. |
| **Myth-busting** | A split frame: a sensational "AI HACKED EVERYTHING" tabloid glow on one side, a calm analyst with evidence on the other. Red-to-blue split. |

---

## 5. Inner-slide subjects by role (reusable across pillars)

| Slide role | Safe visual subject |
| --- | --- |
| Context | Abstract "before/after" pattern — old red flags fading, a new clean lure emerging; or a timeline/wave motif. |
| Risk | A threat-map metaphor: scattered public-profile fragments connecting toward a single target inbox/identity. No real names. |
| Mechanism | A safe high-level diagram metaphor — e.g. external content passing a scanner; a permission gate; a costume/mask over an input. NO payloads. |
| Failure point | A person near an "approve" button while a verification checklist sits ignored in the background. |
| Defense | A control room: callback/second-channel verification, ticket workflow, approval chain, identity-check and audit-log icons. |
| Takeaway | A single strong icon — a lock, a shield, a verified checkmark — over a dark gradient, room for one line of text. |
| CTA | Brand-consistent dark frame with space for a question + "SAVE THIS / FOLLOW" and a small handle. |

---

## 6. Concept-specific prompt snippets (high-reuse topics)

| Concept | Subject snippet |
| --- | --- |
| AI phishing | "branching personalized message bubbles emanating from an abstract attacker workstation, high contrast, safe abstract visuals only" |
| Indirect prompt injection | "an AI agent scanner passing over a webpage, email, document and image; faint hidden instruction shadows behind the document blocks" |
| Agent permissions / excessive agency | "an abstract AI agent wired to email, files, API, calendar and cloud icons, each behind a glowing permission gate" |
| RAG data exposure | "a glowing document vault feeding an AI summarizer, one sensitive doc leaking a faint highlighted line — redacted, unreadable" |
| Chatbot data leakage | "an enterprise data-boundary diagram with a stream crossing into an unapproved AI tool, neon green warning accent" |
| Deepfake voice / helpdesk | "a dark call-center desk, a phone with an audio waveform that subtly doesn't match a human silhouette, identity-verification icons" |
| SOC triage with AI | "a towering wall of alert cards collapsing into three prioritized cards, an AI glow assisting a human analyst who makes the final call" |
| Shadow AI | "a corporate app inventory board where several glowing 'unapproved' AI tools sit outside the sanctioned perimeter" |
| Governance / audit | "an audit-trail timeline with an 'who approved this action?' checkpoint highlighted, calm amber tone" |

---

## 7. Existing reusable assets (already produced)

The repo already contains 3 finished demo carousels + 3 text-free cover backgrounds at 1080×1350 in
`ai_cybersecurity_carousel_assets_ready_to_post/`:

| Asset | Use for |
| --- | --- |
| `cover_backgrounds/cover_bg_01_ai_phishing.png` | Offensive-AI / phishing covers (text-free → safest) |
| `cover_backgrounds/cover_bg_02_prompt_injection.png` | Model-security covers (text-free) |
| `cover_backgrounds/cover_bg_03_data_leakage.png` | Data-leakage covers (text-free) |
| `finished_carousels/carousel_01_ai_phishing_*` | Week-1 phishing post (review AI-rendered text before publishing) |
| `finished_carousels/carousel_02_prompt_injection_*` | Week-1 prompt-injection post |
| `finished_carousels/carousel_03_data_leakage_*` | Week-1 data-leakage post |

> **Production rule (from the asset README):** prefer the **text-free cover backgrounds** + manual typography. The finished slides carry AI-rendered text — run a spelling/brand pass before publishing (see [QA_CHECKLIST.md](QA_CHECKLIST.md)).

---

## 8. Safety reminders for image generation

- No real logos, real credentials, real customer data, or readable private info.
- No step-by-step exploit visuals; keep mechanisms abstract and pair with defense.
- Synthetic faces only; never imply a real, identifiable person did something.
- Keep the lower-third dark and clean so manual headlines stay readable on mobile.
