# HANDOFF — multi-platform publishing build

**Branch:** `feature/multi-platform-publishing` (NOT merged to `main`; do not merge until the build is complete and Jon approves).
**Date of handoff:** 2026-06-14
**Method:** superpowers **subagent-driven-development** — one implementer subagent per task, then a spec-compliance + code-quality review, then commit. Resume the same way.

**Spec:** `docs/superpowers/specs/2026-06-13-multi-platform-publishing-design.md`
**Plan (authoritative task text):** `docs/superpowers/plans/2026-06-13-multi-platform-publishing.md`

---

## Goal (one line)
Automate publishing a post's rendered `reel.mp4` to **YouTube Shorts** and **TikTok** with a gated, idempotent command. **Instagram stays manual** (Jon is locked out of Meta's dev API). Dashboard analytics repoint is a **separate later spec** (out of scope here).

## Status: 11 of 11 tasks DONE ✅ (committed, `bun test` = 37 pass / 0 fail)

> Build complete. Tasks 8–11 were finished after the original handoff: TikTok adapter,
> the gated `publish` orchestrator (`publish.mjs` + `run.ts`), the pipeline `--publish=`
> stage, and the docs (`docs/publishing/PUBLISHING.md`, `YOUTUBE_AUDIT_APPLICATION.md`,
> CLAUDE.md). The two tracked tweaks below are applied (TikTok scopes trimmed to
> `video.publish`+`user.info.basic`; privacy stays private/SELF_ONLY). Live OAuth + a real
> private post on each platform remain the manual verification step.
>
> **Gate update (per Jon, post-build):** publishing now requires status **`generated`** only,
> NOT `approved` as well. `generated` already means approved-and-rendered, so it is the status
> that actually has a reel to post; an unrendered `approved` post is rejected. The notes below
> that say `["approved","generated"]` predate this change — the code/docs are `generated`-only.

| # | Task | State |
|---|------|-------|
| 1 | Scaffold (deps, scripts, `publish.config.json`, gitignore `.secrets/`) | ✅ committed |
| 2 | Metadata mapper (`metadata.ts`, pure) | ✅ |
| 3 | Publish-state + idempotency (`state.ts`) | ✅ |
| 4 | OAuth/token layer (`auth/oauth.ts`, `auth/youtube.ts`, `auth/tiktok.ts`) | ✅ |
| 5 | One-time `publish:auth` CLI (`auth/cli.mjs`) | ✅ (live OAuth = manual, deferred) |
| 6 | Shared adapter contract (`types.ts`) + Instagram **manual** adapter | ✅ |
| 7 | YouTube adapter (`adapters/youtube.ts`, resumable REST + DI) | ✅ committed `b0af5c7` — **NOTE: its code-quality review was interrupted; tests pass + implementer self-reviewed. Re-run the review or accept.** |
| 8 | **TikTok adapter** (`adapters/tiktok.ts` + fixtures) | ✅ committed `5a1c281` |
| 9 | Gated `publish` CLI orchestrator (`publish.mjs` + `run.ts`) | ✅ committed `88023b0` |
| 10 | Pipeline `--publish=` flag | ✅ committed `9a807cf` |
| 11 | Docs + audit drafts | ✅ committed `68056cf` |

## The shared contract (read `renderer/scripts/publish/types.ts`)
- `RenderPackage { key, dir, reelPath, post:{post_id,caption,hashtags,...} }`
- `AdapterResult { platform, kind:"api"|"manual", status:"published"|"manual"|"failed", id?, url?, privacy?, message?, error? }`
- `PlatformAdapter { name, kind, publish(pkg, opts:{dryRun?}): Promise<AdapterResult> }`
- Adapters are built via DI factories (`makeYoutubeAdapter(deps)`) so they're fixture-testable with no live creds. Follow the same pattern for TikTok.

---

## Remaining tasks (full text is in the plan; summary here)

### Task 8 — TikTok adapter (`adapters/tiktok.ts` + tests + fixtures)
Direct Post of the reel video. Plan has the exact flow. Key points:
- `pickPrivacy(creatorInfo, configured)` — return `configured` if in `privacy_level_options`, else throw a clear mismatch error.
- `shapeTiktokResult(statusResponse)` — pure → `AdapterResult`.
- Flow: `POST /v2/post/publish/creator_info/query/` → pick privacy → `POST /v2/post/publish/video/init/` (`source_info:{source:"FILE_UPLOAD", video_size, chunk_size, total_chunk_count}`; single chunk: chunk_size==video_size, total==1) → `PUT` the bytes to the returned `upload_url` **with `Content-Range: bytes 0-<size-1>/<size>` and `Content-Type: video/mp4`** (required, or TikTok rejects) → poll `POST /v2/post/publish/status/fetch/` until complete.
- Host: `https://open.tiktokapis.com`. DI like YouTube (loadConfig/getToken/fetch). Friendly errors for `unaudited_client_can_only_post_to_private_accounts`, `scope_not_authorized`, privacy mismatch.

### Task 9 — gated publish CLI (`publish.mjs` thin argv + `run.ts` testable core)
- `planPublish(key, platforms, {status, state, force})` PURE: **throw unless status ∈ ["approved","generated"]** (the human-approval gate — `bun run pipeline` flips a rendered post to `generated`, so BOTH count as approved); skip platforms already `published` in state unless `--force`; return dry-run summary lines.
- `run.ts`: resolve key → post JSON + render dir (`pipeline/renders/<key>/`, reel `<key>_reel.mp4`); `readStatus`; build adapters from `loadPublishConfig()`; `planPublish`; if `--dry-run` or no `--yes`, print the per-platform plan and confirm; run each adapter (independent try/catch); `recordResult` each to `publish.state.json`; if all requested succeeded, `setStatus(key,"upload_ready",{onlyFrom:["approved","generated"]})`.
- CLI flags: `--platforms=youtube,tiktok --dry-run --force --yes`.
- Status helper: `import { readStatus, setStatus } from "../lib/post-status.mjs"` (from publish/ it's `../lib/...`).

### Task 10 — pipeline `--publish=` flag (`renderer/scripts/pipeline.mjs`)
Parse `--publish=youtube,tiktok`; after the reel stage, invoke `run.ts` (same `approved`/`generated` gate, respect `--dry-run`). Add to the pipeline plan printout + HELP.

### Task 11 — docs + audits (PARTLY DONE)
- **Already written:** `docs/publishing/legal/terms.md`, `docs/publishing/legal/privacy.md`, `docs/publishing/TIKTOK_AUDIT_SUBMISSION.md` (product/scope explanations + demo shot list).
- **Still to write:** `docs/publishing/PUBLISHING.md` (setup guide: create the apps, env vars, run `publish:auth`, the private→public config flip after audit); `docs/publishing/YOUTUBE_AUDIT_APPLICATION.md`; update `CLAUDE.md` commands section with `bun run publish` / `--publish=` (and that IG stays manual, YT/TikTok gated on `approved`/`generated`).

---

## ⚠️ Tracked tweaks to apply (do these as part of Task 8 / before live use)
1. **Trim TikTok scopes.** `auth/tiktok.ts` currently requests `video.publish, video.upload, user.info.basic, user.info.stats`. Jon **trimmed the actual TikTok app to Login Kit + Content Posting API, scopes `video.publish` + `user.info.basic`** (analytics scopes deferred to the future dashboard revision — TikTok makes you demo every requested scope in the audit video). Update `auth/tiktok.ts` scopes to `["video.publish","user.info.basic"]` so the consent request matches the app.
2. **Privacy stays private/SELF_ONLY** in `publish.config.json` until each platform's audit passes; flipping to public is a one-value change per platform (no code).

## External setup state (Jon has done this)
- **YouTube:** Google Cloud project + OAuth **Desktop** client; scopes `youtube.upload`+`youtube.readonly`; `YOUTUBE_CLIENT_ID/SECRET` in `renderer/.env`. Uploads land **private** until the YouTube API compliance audit passes.
- **TikTok:** app created; products Login Kit + Content Posting API (Direct Post); redirect URI registered **`http://localhost:8788/callback`** (Desktop platform, no trailing slash — our CLI matches); `TIKTOK_CLIENT_KEY/SECRET` in `renderer/.env`; website **https://aiugc.chron0.tech** is LIVE (on Vercel from `main`); legal at `/terms` + `/privacy`. Unaudited ⇒ `SELF_ONLY` only + needs the demo video (shot list in the audit doc) to go public.

## How to run / conventions
- **bun only, never npm.** All commands from `renderer/`.
- Tests: `cd renderer && bun test scripts/publish` (currently 12 pass). TDD per task.
- The `bun:test` typecheck errors in `*.test.ts` are **pre-existing/expected** (no bun types in tsconfig) — not real failures.
- **Never weaken the `approved`/`generated` publish gate** (it replaces the old "no auto-publishing" rule with a human gate).
- Keep all network behind injectable deps so adapters unit-test without creds; **live posting is a manual verification step** (`--dry-run` first, then a real private post).
- Once all 11 tasks are done + reviewed: final whole-implementation review, then ask Jon before merging to `main`.

## Gotchas
- `googleapis` package is unreliable under Bun → YouTube uses raw resumable REST + `google-auth-library` only.
- TikTok chunk `PUT` **must** include `Content-Range`.
- Secrets: `renderer/.env` and `renderer/.secrets/` are gitignored — verify with `git status` after `publish:auth`; never commit tokens.
- A few `renderer/content/posts/*.json` show as modified in the working tree — those are **pre-existing stale render artifacts (Whisper caption re-aligns), unrelated to this build. Do not commit them.**
