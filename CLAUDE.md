# CLAUDE.md — project guide for Claude Code

AI-in-cybersecurity UGC pipeline. **Positioning:** *real threats, real tools, no fake panic.*

## Skills (installed in this repo)
- **ai-cybersecurity-ugc-carousel** — writes the content (hooks, 8-slide scripts, captions, QA). Use when drafting post copy/ideas.
- **react-remotion-instagram-renderer** — maps approved content to the renderer JSON schema and produces assets. Use when turning content into files.

## The one command to make a post
Use the `/draft-post` slash command: `/draft-post <idea> | <pillar>`
It researches sources, writes a schema-valid `renderer/content/posts/<date>_<slug>.json`, validates, and renders carousel PNGs + a reel into `pipeline/renders/`. Headless equivalent: `cd renderer && npm run draft -- "<idea>" <pillar>`.

## Non-negotiable rules (enforced by pipeline/content/QA_CHECKLIST.md)
- **No fabrication** — no invented CVEs, breach details, stats, quotes, or papers. Back every factual claim with a real source (WebSearch/WebFetch) or tag it `[Scenario]`.
- **No offensive how-to** — no payloads, exploit chains, evasion, or credential-theft steps; keep mechanisms high-level.
- Every post needs a concrete **defender takeaway**.
- **Media rights**: only commercial-licensed models/assets ship (VoxCPM2 ✅ Apache-2.0; F5-TTS base weights ❌ CC-BY-NC). Log in `LICENSES.md`.
- Manual upload + human approval before posting. No auto-publishing.

## Layout
- `pipeline/content/` — workflow, IDEA_BACKLOG, POST_TEMPLATE, CAPTION_BANK, VISUAL_PROMPT_BANK, QA_CHECKLIST, WEEK_1_POSTS.
- `pipeline/media/` — tool stack, voiceover/b-roll/music guides, OPEN_SOURCE_EVALUATION_MATRIX.
- `renderer/` — React+Playwright carousels + Remotion reels. Docs in `renderer/docs/`; start with `renderer/docs/RUN_IT_YOURSELF.md`.
- `pipeline/renders/` — upload-ready output packages.

## Renderer commands (run inside `renderer/`)
`npm run new -- <date> <slug> <pillar>` · `npm run draft -- "<idea>" <pillar>` · `npm run validate|export|package|reel -- <key>` · `npm run dev`.
Format defaults: carousel 1080×1350, reel 1080×1920@30fps. Filenames `YYYY-MM-DD_slug_NN_role.png`.

## Gotchas
- If a render hangs at startup, a stale dev server holds port 4317 — kill it and retry.
- Run `npx remotion browser ensure` once before the first reel. The reel's `zod version mismatch` warning is harmless.
