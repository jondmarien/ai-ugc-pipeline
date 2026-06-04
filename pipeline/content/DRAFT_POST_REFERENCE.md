# `/draft-post` quick reference

A cheat-sheet for drafting posts. Pair it with `IDEA_BACKLOG.md` (running list of topics) and `QA_CHECKLIST.md` (the non-negotiable rules).

> **Positioning:** *real threats, real tools, no fake panic.* Every post needs a concrete **defender takeaway**. No fabricated CVEs/stats/quotes — back claims with a real source or tag `[Scenario]`. No offensive how-to.

---

## Command syntax

**New post (content → JSON → render, all in one):**
```
/draft-post <idea> | <pillar> [| slides=3-20] [| captions=block|word|highlight]
```
Example: `/draft-post AI agents leaking RAG data through tool calls | model_security | slides=10 | captions=highlight`

**Batch (up to 5, with pillar variety + a posting calendar):**
```
/draft-week idea1::pillar | idea2::pillar::captions=highlight | …
```

**Render only (post JSON already exists / was hand-edited):**
```
cd renderer && bun run pipeline -- <date>_<slug> [--seed=N]
```
(Art auto-skips when backgrounds already exist. Use the **same `--seed=N`** across posts for one consistent voice.)

---

## The 6 pillars

`<pillar>` must be one of these. Each maps to a default **brand theme** (colour), which you can override with `--theme=`.

| Pillar | Default theme | What it covers | Example `<idea>` |
|---|---|---|---|
| `offensive_ai` | 🔴 offensive (red) | How attackers *use* AI: AI-written phishing, deepfake voice/video, automated recon, LLM-aided social engineering | "AI-cloned voice approves a fraudulent wire transfer" |
| `model_security` | 🔵 defensive (blue) | Securing AI systems themselves: prompt injection, jailbreaks, RAG/tool-call abuse, model/agent guardrails | "Indirect prompt injection hidden in a web page an agent reads" |
| `data_leakage` | 🔴 offensive (red) | Sensitive data escaping via AI: training-data leaks, copy-paste into chatbots, RAG exposing private docs, PII in logs | "Employees pasting customer data into public chatbots" |
| `defensive_ai` | 🔵 defensive (blue) | Using AI to *defend*: anomaly detection, AI-assisted triage/SOC, log summarization, automated response | "Using an LLM to triage alerts without it hallucinating severity" |
| `governance` | 🔵 defensive (blue) | Policy, risk, compliance, AI usage rules, shadow AI, vendor/model risk, audit trails | "Writing an acceptable-use policy for AI coding assistants" |
| `myth_busting` | 🟢 hacking (green) | Correcting hype/FUD: "AI will replace all hackers", "AI is unhackable", overblown headlines | "No, AI didn't just make every password useless" |

> Theme override: add `--theme=offensive|defensive|hacking|purple-team|ai` to the scaffold step (or `theme` in the JSON) when the default doesn't fit. Two themes are **cross-cutting** — no pillar defaults to them, so choose explicitly:
> - `purple-team` (purple) — content that's both offence *and* defence: detection-vs-attack, adversary emulation, red+blue collaboration.
> - `ai` = **generic AI** (orange) — AI news / explainers / myth-busting that isn't clearly red or blue (the AI counterpart to the green generic-cyber `hacking` theme).

---

## Writing a good `<idea>`

The `<idea>` is free text — a **specific angle**, not a broad topic. Aim for one concrete mechanism + a defender payoff.

**Good (specific, one mechanism, defensible):**
- "Indirect prompt injection hidden in a calendar invite an AI assistant reads"
- "AI-generated phishing that personalises using scraped LinkedIn data"
- "A coding assistant suggesting a dependency that doesn't exist (slopsquatting)"

**Weak (too broad / vague):**
- "AI security" · "prompt injection" · "deepfakes are scary"

**Checklist for an idea:**
1. **One mechanism** — a single thing that goes wrong, explainable in 8 slides.
2. **Real or `[Scenario]`** — either it's sourced, or framed explicitly as a hypothetical.
3. **Defender takeaway exists** — there's a concrete action a blue-teamer can take.
4. **No how-to** — it illustrates the *risk*, never a working exploit.

---

## Optional flags

| Flag | Values | Meaning |
|---|---|---|
| `slides=` / `--slides=` | integer `3`–`20` | Number of carousel slides (default `8`). Applies at **creation** (`bun run new` / `draft` / `/draft-post`); `bun run pipeline` reads the count from the JSON. Arc: `cover` first, `cta` last, `takeaway` at N−1; middle filled from the named roles then generic `point` slides. |
| `captions=` / `--captions=` | `block` · `word` · `highlight` | Reel subtitle animation (default `block`) |
| `--theme=` | `offensive` · `defensive` · `hacking` · `purple-team` · `ai` | Brand colour/mood — red / blue / green / purple-team-purple / generic-AI-orange (default from pillar; `purple-team`/`ai` are explicit-only) |
| `--voice=` | `none` · `voxcpm2` · `voxcpm2-0.5b` · `http` · `file` | Reel narration — **default `voxcpm2` (2B); use `none` (or `--no-voice`) for a silent reel** |
| `--music=` | `none` · `free` · `licensed` · `generated` · `file` | Music bed (default `none`) |
| `--seed=N` | integer | Voice seed = consistent speaker. **Avoid 777** (hangs). Reuse the same N for a consistent voice across posts. |

---

## Image-prompt rule (so backgrounds don't garble)

When the renderer writes each slide's `visual_prompt`, it must be a **single concrete physical object doing something physical, in a natural sentence** — e.g. *"a cracked magnifying glass revealing one flawless envelope in the dark."* **Never** UI/abstract nouns (*dashboard, node, chat bubble, panel, icon, poster, diagram*) — FLUX.2 renders those as garbled fake text. Colour comes from the **theme**, never the prompt. See `renderer/docs/IMAGE_MODELS.md` for the model settings.
