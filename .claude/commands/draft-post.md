---
description: Idea → researched, sourced, schema-valid post JSON → rendered carousel + reel
argument-hint: <idea> | <pillar>   e.g. "AI agents leaking RAG data" | model_security
allowed-tools: Skill, WebSearch, WebFetch, Read, Write, Edit, Glob, Grep, Bash
---

You are producing one complete AI-in-cybersecurity post for this repo, end to end, using the project's two skills. Treat this as the **Assemble** stage of `pipeline/content/CONTENT_PIPELINE.md`.

## Input
`$ARGUMENTS` is `<idea> | <pillar>`. Split on the `|`.
- idea = the topic/angle (free text).
- pillar ∈ `offensive_ai | model_security | data_leakage | defensive_ai | governance | myth_busting`. If missing or invalid, pick the best-fit pillar and say which you chose.

## Hard rules (non-negotiable — from pipeline/content/QA_CHECKLIST.md)
- **No fabrication.** No invented CVEs, breach details, numbers, quotes, or paper titles. Every factual claim must be backed by a real source you found via WebSearch/WebFetch, or be explicitly framed as a **[Scenario]**.
- **No offensive how-to.** No payloads, exploit chains, evasion, or credential-theft steps. Keep mechanisms high-level.
- Every post must carry a concrete **defender takeaway**.
- If you can't verify a claim, soften it ("could", "reported", "the risk is") and tag it `scenario`.

## Steps
1. **Invoke the content skill** `ai-cybersecurity-ugc-carousel` to design the post: a defensible cover hook, the 8-slide arc (cover, context, risk, mechanism, failure_point, defense, takeaway, cta), caption, hashtags, and a specific comment question — in the house voice (sharp, practical, no fake panic).
2. **Research sources.** Use WebSearch (and WebFetch to confirm) for any factual claim. Prefer primary/reputable sources (OWASP, NCSC/NIST/CISA, vendor security blogs, CVE/NVD, named journalism, court filings). Record each as `{source, link, supports, confidence, claim_tag}`. Re-read the page to confirm the claim matches before using it.
3. **Invoke the renderer skill** `react-remotion-instagram-renderer` to map the content to the JSON schema. Get today's date with `Bash: date +%F`. Choose a short kebab-case `slug` from the idea.
4. **Scaffold then fill:** run `cd renderer && npm run new -- <date> <slug> <pillar>` to create a valid skeleton at `renderer/content/posts/<date>_<slug>.json`, then **Edit that file** to replace every `TODO` with the real content + sources from steps 1–2. Keep the schema rules: 8 slides (slide 1 = cover), `alt_text` length = 8, `score.total` = sum of the five axes, ≥1 real source, reel `beats` captions filled. Set `status` to `approved` only if you're confident; otherwise leave `draft`.
5. **Validate:** `cd renderer && npm run validate -- <date>_<slug>`. Fix any reported field and re-validate until clean.
6. **Render fully:** `cd renderer && npm run export -- <date>_<slug> && npm run package -- <date>_<slug> && npm run reel -- <date>_<slug>`.
   - If a render hangs on startup, a stale dev server holds port 4317 — kill it (`netstat -ano | grep :4317` → `taskkill //PID <pid> //F`) and retry.
   - If the reel errors on browser setup, run `cd renderer && npx remotion browser ensure` once, then retry.
7. **Report:** print the output folder `pipeline/renders/<date>_<slug>/`, the list of files, which claims are `reported_fact` vs `scenario`, and the QA items that still need a human eye (cover legibility, source re-check, cyber-safety). Remind: a human approves before posting; the reel ships without audio (add VoxCPM2 voice + licensed music per renderer/docs/REMOTION_REEL_WORKFLOW.md to narrate).

## Backgrounds
Inner slides render procedurally (no art needed). For a custom cover, tell the user to drop a 1080×1350 text-free PNG at `renderer/public/backgrounds/<date>_<slug>_cover.png` and set slide 1 `asset_status` to `existing` — otherwise the cover renders procedurally, which is fine.
