---
description: Ingest Instagram post URL(s) into pipeline-improvement intel (analysis doc + proposed repo deltas — never a draft post)
argument-hint: <url> [| <url2> …] [| focus=hooks|cta|visuals|structure|all] [| apply=yes]   e.g. https://www.instagram.com/p/XXXX/ | focus=cta
allowed-tools: Skill, Read, Write, Edit, Glob, Grep, Bash, WebSearch, WebFetch
---

You are mining competitor/inspiration posts for pipeline improvements. **Invoke the `ig-ingest` skill and follow it exactly.**

## Input
`$ARGUMENTS` is one or more Instagram URLs separated by `|`, plus optional `key=value` segments:
- `focus=` (optional) — narrow the analysis (`hooks`, `cta`, `visuals`, `structure`); default `all`.
- `apply=yes` (optional) — after writing the ingest doc(s), apply the proposed deltas to the repo immediately instead of waiting for approval. Without it, deltas are proposals only.

## Steps
1. Invoke `ig-ingest`. Capture each URL via Claude in Chrome (caption + every slide; reels via the `watch` skill).
2. Produce one ingest doc per URL in `pipeline/content/ingested/`, update `INDEX.md`.
3. Deduplicate deltas across URLs in the same run (same lesson from two posts = one delta, two citations).
4. Finish with a per-post verdict and the consolidated delta list. If `apply=yes`, apply each delta and show a summary of edits; otherwise stop and ask which deltas to apply.

## Reminders
- Read-only on Instagram. No likes/comments/follows/DMs, ever.
- Paraphrase; no wholesale slide-text copies.
- Never propose deltas that violate CLAUDE.md non-negotiables (no fabrication, no em-dashes, no auto-publishing, human approval before posting).
