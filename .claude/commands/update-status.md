---
description: Set the lifecycle status on one or more posts (draft|approved|generated|upload_ready). No render, no content change.
argument-hint: <status> <post-key|substring> […]   ·   <status> from=<current-status>   e.g. approved 2026-06-10 2026-06-11  ·  upload_ready from=generated
allowed-tools: Bash, Read, Glob
---

You set the lifecycle **`status`** field on existing post JSONs in `renderer/content/posts/`. You do **not** render anything and you do **not** change any other field. Lifecycle: `draft → approved → generated → upload_ready`.

## Input
`$ARGUMENTS` names a target status and which posts. The target status must be one of `draft | approved | generated | upload_ready` (the only valid values — if it's anything else, stop and say so).

Posts may be given as:
- full keys or unique substrings (`redsun-windows-lpe`),
- a **date prefix** (`2026-06-10` selects every post from that day — the setter substring-matches),
- `from=<current-status>` to select every post currently at that status (promote/demote a whole tier),
- or a mix.

## Steps
1. Parse `$ARGUMENTS` into the target status + the post selection. Validate the status.
2. Run the deterministic setter from `renderer/`:
   `cd renderer && bun run status -- <status> <key> [<key> …]` (use `--from=<current>` for a whole tier).
   - If the selection is broad or ambiguous, run it **with `--dry-run` first**, show the user the old → new list, and only re-run without `--dry-run` after they confirm.
3. Report the old → new transition for each post.

## Rules
- Only the `status` field changes. Never touch content, sources, captions, or assets.
- **`upload_ready` is terminal** (the post is published). Moving a post *out* of `upload_ready` (e.g. back to `approved`) means "re-render something already posted" — **confirm with the user before doing that.**
- `generated → approved` is the normal "queue this for a re-render" signal and is fine without confirmation.
- This command does not render. To render the approved batch afterward: `bun run pipeline --status=approved`.
