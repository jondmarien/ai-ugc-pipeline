# VISUAL_PROMPT_BANK.md — Cover & Inner-Slide Image Prompts (FLUX.2 [klein])

How to write the **`visual_prompt`** field on every slide of a post JSON. That string is the final input the art engine sees: `renderer/scripts/art-comfyui.mjs` → `buildPrompt()` front-loads `slide.visual_prompt` verbatim, then ComfyUI feeds it to **FLUX.2 [klein] 4B** (Apache-2.0). Get this field right and the art is right; this doc is the authority the draft flow and the skills follow.

**Default canvas:** 1080 × 1350 portrait (4:5). **No rendered text** — type is set in the renderer for spelling/brand control. For b-roll/video prompts see [BROLL_PROMPT_BANK.md](../media/BROLL_PROMPT_BANK.md).

---

## 0. How FLUX.2 [klein] reads a prompt (read this first)

klein has **no prompt upsampler** — *what you write is exactly what the model gets*. So the `visual_prompt` must carry the whole idea, in prose, in priority order. The rules that actually move quality (from the BFL FLUX.2 prompting guides + klein model card):

1. **Prose, not tags.** Describe the scene like a sentence, not a keyword dump. The encoder favours natural language.
2. **Order: `Subject + Action + Style + Context`.** Word order = priority; put the focal subject first. If FLUX keeps pulling too wide, state the subject before the environment.
3. **Lighting is the single highest-impact lever.** Describe it like a DP — *source / quality / direction / temperature / interaction* ("a single hard rim light raking from the left through volumetric haze"). Spend words here before anywhere else.
4. **Specific, not long.** 30–80 words of load-bearing detail. Filler hurts; one or two strong effects and one realism cue, no stacking.
5. **No negatives, no lettering.** Never write "no text" or quoted strings inside `visual_prompt` (klein renders quotes/letters as garbled type). Keep type-free zones the *positive* way: "clean unmarked surfaces, generous negative space in the lower third."
6. **Don't hardcode the accent colour.** The renderer auto-injects the post's **theme** accent glow + hex (see §1) and the house style + mood as a trailing `Style: … Mood:` tag. Describe the subject, its lighting *quality/direction*, and composition — let the pipeline supply the hue. A colour word in `visual_prompt` will fight the theme and is not stripped (only `visual_direction` is).

So a good `visual_prompt` = **focal subject + action + lighting (DP-style) + medium/style + composition with a clean negative-space lower-third.** The renderer appends: `A single {accent} ({hex}) accent glow on a deep navy void #05070d. Style: {house style}. Mood: {theme mood}. {text-safe zone}.`

---

## 1. Theme palette (the accent is theme-driven, not hand-typed)

A post's **`theme`** drives the accent glow + mood the renderer appends (`themes` in `renderer/src/design/tokens.ts`). If a post sets no `theme`, it falls back to the pillar default below. Override per post with `theme=`.

| Theme | Accent (hex) | `Style: … Mood:` flavour the renderer appends |
| --- | --- | --- |
| `offensive` | alert red `#ef4444` | aggressive, high-stakes, intrusion-and-exposure tension |
| `defensive` | electric blue `#3b82f6` | calm, controlled, shielded, secure — blue-team energy |
| `hacking` | neon green `#39ff88` | raw underground hacker energy, glowing circuitry and signal traces |
| `purple-team` | purple `#a855f7` | offence and defence combined, adversary emulation meeting detection |
| `ai` | orange `#f97316` | warm, curious, forward-looking, the human side of the technology |

**Pillar → default theme** (when `theme` is unset): offensive_ai → offensive · model_security → defensive · data_leakage → offensive · defensive_ai → defensive · governance → defensive · myth_busting → hacking.

> You author the **subject + lighting**; the pipeline owns the **colour**. Keep them separate.

---

## 2. Cover `visual_prompt` template

```text
[image type], [focal subject doing something], lit by [DP-style lighting: source, quality,
direction], [medium/style, e.g. cinematic key art / macro photograph], dramatic central
subject with clean unmarked surfaces and generous negative space across the lower third.
```

Example (offensive-theme cover, no colour word — renderer adds the red glow):

```text
A cinematic close-up of a single brass key dissolving into fine particles mid-air, lit by one
hard rim light raking from the left through volumetric haze, premium dark key art, the subject
held in the upper third with clean empty space and soft shadow filling the lower third.
```

## 3. Inner-slide `visual_prompt` template

```text
[image type], [one safe high-level concept metaphor + action], lit by [DP-style lighting],
[medium/style], clear single focal point with a calm uncluttered lower third for the headline.
```

---

## 4. Cover scenes by pillar (drop the subject into the template — no colour words)

| Pillar | Cover subject |
| --- | --- |
| **Offensive AI** | A security analyst silhouetted at a dark workstation, a blurred phishing inbox on the monitor, a faint synthetic face reflected in the glass. |
| **Offensive AI (deepfake)** | A dim video call where one participant is subtly "rendered"/uncanny, a soft audio-waveform glow, blurred silhouettes, no real faces. |
| **Defensive AI** | A SOC analyst lit by dashboards, an AI-assist glow collapsing a wall of alerts into a short prioritized list. |
| **Model security** | A glowing abstract AI agent reading a document, faint shadow-like hidden-instruction patterns behind ordinary content blocks. |
| **Data leakage** | A developer about to paste blurred production logs into an AI chat panel, redacted token shapes, a subtle warning charge in the air. |
| **Governance** | A boardroom-console hybrid: an AI control dashboard with permission gates, audit-log lines, an approval checkpoint. |
| **Myth-busting** | A split frame: a sensational tabloid glow on one side, a calm analyst with evidence on the other. |

---

## 5. Inner-slide subjects by role (reusable across pillars)

| Slide role | Safe visual subject |
| --- | --- |
| Cover (1) | See pillar cover scenes above. |
| Context (2) | An abstract before/after: old red flags fading as a new clean lure emerges; or a timeline/wave motif. |
| Risk (3) | A threat-map metaphor: scattered public-profile fragments converging toward a single inbox/identity. No real names. |
| Mechanism (4) | A safe high-level metaphor — external content passing a scanner; a permission gate; a mask over an input. Keep it conceptual. |
| Failure point (5) | A figure near an "approve" gesture while a verification checklist sits ignored in the background. |
| Defense (6) | A control room: callback/second-channel verification, ticket workflow, approval chain, identity-check and audit-log motifs. |
| **Takeaway (7)** | One strong icon — a lock, a shield, a verified checkmark — over a dark gradient, room for one line of text. Non-obvious + tactical. |
| **CTA (8)** | Brand-consistent dark frame with space for a question + a small handle. Labels the shared feeling. |

---

## 6. Concept-specific subject snippets (high-reuse topics)

| Concept | Subject snippet |
| --- | --- |
| AI phishing | branching personalized message bubbles emanating from an abstract attacker workstation, high contrast, safe abstract visuals only |
| Indirect prompt injection | an AI agent scanner passing over a webpage, email, document and image, faint hidden-instruction shadows behind the document blocks |
| Agent permissions / excessive agency | an abstract AI agent wired to email, files, API, calendar and cloud motifs, each behind a glowing permission gate |
| RAG data exposure | a glowing document vault feeding an AI summarizer, one sensitive doc leaking a faint highlighted line, redacted and unreadable |
| Chatbot data leakage | an enterprise data-boundary diagram with a stream crossing into an unapproved AI tool |
| Deepfake voice / helpdesk | a dark call-center desk, a phone with an audio waveform that subtly doesn't match a human silhouette, identity-verification motifs |
| SOC triage with AI | a towering wall of alert cards collapsing into three prioritized cards, an AI glow assisting a human who makes the final call |
| Shadow AI | a corporate app-inventory board where several glowing "unapproved" AI tools sit outside the sanctioned perimeter |
| Governance / audit | an audit-trail timeline with a "who approved this action?" checkpoint highlighted |
| Permission anxiety | a hand hovering over an "allow calendar access" prompt for an AI agent, subtle tension in the gesture |
| Output-validation gap | a document stamped with a checkmark that is subtly a warning sign — AI output accepted without verification |

---

## 7. Safety reminders for image generation

- No real logos, real credentials, real customer data, or readable private info.
- Synthetic faces only; never imply a real, identifiable person did something they didn't.
- Offensive-theme posts may depict mechanisms more concretely when it's genuinely educational, but never render turnkey real-world exploit instructions; keep depictions conceptual and pair with the defender takeaway.
- Keep the lower-third dark, clean, and text-free so the renderer's headline stays readable on mobile.
