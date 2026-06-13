# Multi-platform Publishing (YouTube Shorts + TikTok) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add gated, idempotent automated publishing of a post's `reel.mp4` to YouTube Shorts and TikTok (video), with Instagram preserved as a manual path, runnable as `bun run publish -- <key> --platforms=youtube,tiktok`.

**Architecture:** A pluggable platform-adapter layer under `renderer/scripts/publish/`. Pure modules (metadata mapper, publish-state store) are TDD'd with `bun test`; a shared OAuth/token layer mints non-interactive access tokens from a one-time stored refresh token; per-platform adapters (`youtube` via `googleapis`, `tiktok` via REST `fetch`, `instagram` manual) implement one `publish()` interface. A CLI resolves an `approved` post, dry-runs/confirms, publishes per platform independently, records `publish.state.json`, and flips status to `upload_ready`.

**Tech Stack:** Bun, TypeScript, `bun test`; `googleapis` (YouTube `videos.insert` + OAuth2); raw `fetch` for TikTok Content Posting API; existing `renderer/scripts/lib/post-status.mjs`.

**Spec:** `docs/superpowers/specs/2026-06-13-multi-platform-publishing-design.md`

---

## Conventions & key facts (read once)

- All commands run from `renderer/`. Render packages live at `renderer/../pipeline/renders/<key>/` (repo-root `pipeline/renders/`); resolve with `path.join(RENDERER, "..", "pipeline", "renders", key)` where `RENDERER` = the renderer dir (see existing scripts).
- Status helper: `import { readStatus, setStatus, POSTS, STATUSES } from "./lib/post-status.mjs"` (note: publish lib is one level deeper → `../lib/post-status.mjs`). `readStatus(key)` returns the status string.
- **Approval gate = status is `approved` OR `generated`.** Lifecycle is `draft → approved → generated → upload_ready`, and `bun run pipeline` flips a rendered post `approved → generated`. So a post that has been rendered sits at `generated`. Both `approved` and `generated` mean "human-approved" (you cannot reach `generated` without first being `approved`), so publishing accepts **either**, and flips to `upload_ready` on success: `setStatus(key, "upload_ready", { onlyFrom: ["approved", "generated"] })`. Reject `draft` (not yet approved).
- Secrets: `.gitignore` already ignores `.env`/`.env.*` (keeps `.env.example`). Add `renderer/.secrets/`.
- `videos.insert` = 1600 quota units (~6/day). A Short is just a vertical <3min upload — no special flag; add `#Shorts` to the description.
- TikTok: unaudited → `SELF_ONLY` only; must query `/creator_info/query/` first; video via `FILE_UPLOAD`; poll `/publish/status/fetch/`. Base host `https://open.tiktokapis.com`.
- **Never** bypass the approval gate. `--force` only re-publishes an already-published platform; it does NOT skip the `approved` requirement.

---

## Task 1: Scaffolding, config, deps

**Files:**
- Modify: `renderer/package.json` (scripts + deps)
- Create: `renderer/scripts/publish/config.ts`
- Create: `publish.config.json` (repo root)
- Create: `renderer/.env.example`
- Modify: `.gitignore` (add `renderer/.secrets/`)

- [ ] **Step 1: Add deps + scripts.** In `renderer/package.json` add dependency `"google-auth-library": "^9.0.0"` only. **Do NOT use the full `googleapis` package** — under Bun its resumable-upload path (Node `http`/stream internals) is unreliable. Use `google-auth-library` solely for the OAuth2 client + token refresh, and perform the YouTube upload via the raw **resumable upload REST endpoint** with `fetch` (Task 7). TikTok is raw `fetch` too. Add scripts:
```json
"publish": "bun scripts/publish.mjs",
"publish:auth": "bun scripts/publish/auth/cli.mjs"
```
Run `bun install`.

- [ ] **Step 2: `.gitignore`.** Append `renderer/.secrets/` under the secrets section.

- [ ] **Step 3: `publish.config.json`** (committed; privacy defaults to private until audits pass):
```json
{
  "youtube": { "enabled": true, "privacy": "private", "categoryId": "28" },
  "tiktok":  { "enabled": true, "privacy": "SELF_ONLY", "disableComment": false, "disableDuet": false, "disableStitch": false },
  "instagram": { "enabled": true, "mode": "manual" }
}
```

- [ ] **Step 4: `config.ts`** — load + validate `publish.config.json` (zod), expose `loadPublishConfig()`. Keep tiny.

- [ ] **Step 5: `.env.example`** documenting `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`.

- [ ] **Step 6: Commit** `chore(publish): scaffold publish module config + deps`.

---

## Task 2: Metadata mapper (pure, TDD)

**Files:**
- Create: `renderer/scripts/publish/metadata.ts`
- Test: `renderer/scripts/publish/metadata.test.ts`

Maps a post JSON + render package into per-platform payloads. Pure (takes already-read data, no fs/network).

- [ ] **Step 1: Failing tests** (`bun test`):
```ts
import { test, expect } from "bun:test";
import { youtubeMetadata, tiktokMetadata } from "./metadata";

const post = {
  post_id: "2026-06-11_bluehammer-cve-2026-33825",
  caption: "BlueHammer abused Defender's update flow.\n\nFollow for more.",
  hashtags: ["BlueHammer", "Windows", "Defender"],
} as any;

test("youtube title is <=100 chars and from the first caption line", () => {
  const m = youtubeMetadata(post, { privacy: "private", categoryId: "28" });
  expect(m.snippet.title.length).toBeLessThanOrEqual(100);
  expect(m.status.privacyStatus).toBe("private");
  expect(m.snippet.description).toContain("#Shorts");
  expect(m.snippet.tags).toContain("BlueHammer");
});

test("tiktok payload carries privacy + caption title", () => {
  const m = tiktokMetadata(post, { privacy: "SELF_ONLY", disableComment: false, disableDuet: false, disableStitch: false });
  expect(m.post_info.privacy_level).toBe("SELF_ONLY");
  expect(m.post_info.title.length).toBeGreaterThan(0);
});

test("youtube title truncates an over-long first line on a word boundary", () => {
  const long = { ...post, caption: "x ".repeat(120) };
  const m = youtubeMetadata(long, { privacy: "private", categoryId: "28" });
  expect(m.snippet.title.length).toBeLessThanOrEqual(100);
});
```

- [ ] **Step 2:** `bun test scripts/publish/metadata.test.ts` → FAIL.

- [ ] **Step 3: Implement** `youtubeMetadata(post, cfg)` → `{ snippet: { title, description, tags, categoryId }, status: { privacyStatus, selfDeclaredMadeForKids:false } }` (title = first caption line, word-truncated ≤100; description = caption + `\n\n#Shorts`; tags = hashtags). `tiktokMetadata(post, cfg)` → `{ post_info: { title, privacy_level, disable_comment, disable_duet, disable_stitch }, media_type: "VIDEO" }` (title ≤2200, hashtags appended). Keep pure.

- [ ] **Step 4:** `bun test scripts/publish/metadata.test.ts` → PASS.

- [ ] **Step 5: Commit** `feat(publish): pure metadata mapper + tests`.

---

## Task 3: Publish-state store + idempotency (TDD)

**Files:**
- Create: `renderer/scripts/publish/state.ts`
- Test: `renderer/scripts/publish/state.test.ts`

Reads/writes `pipeline/renders/<key>/publish.state.json` and decides which platforms to skip. Inject the dir path so tests use a temp dir.

- [ ] **Step 1: Failing tests:** `readState(dir)` returns `{}` when absent; `recordResult(dir, result)` persists and round-trips; `shouldSkip(state, platform, force)` returns true only when that platform is `published` and `!force`.
```ts
import { test, expect } from "bun:test";
import { readState, recordResult, shouldSkip } from "./state";
import { mkdtempSync } from "node:fs"; import { tmpdir } from "node:os"; import { join } from "node:path";

test("absent state is empty; record round-trips; skip honors force", () => {
  const dir = mkdtempSync(join(tmpdir(), "pub-"));
  expect(readState(dir)).toEqual({});
  recordResult(dir, { platform: "youtube", status: "published", id: "abc", url: "u", privacy: "private", at: 1 });
  const s = readState(dir);
  expect(s.youtube.status).toBe("published");
  expect(shouldSkip(s, "youtube", false)).toBe(true);
  expect(shouldSkip(s, "youtube", true)).toBe(false);
  expect(shouldSkip(s, "tiktok", false)).toBe(false);
});
```

- [ ] **Step 2:** run → FAIL. **Step 3:** implement (JSON read/write, merge by platform). **Step 4:** run → PASS. **Step 5: Commit** `feat(publish): publish-state store + idempotency + tests`.

---

## Task 4: Shared OAuth + token layer (TDD for refresh logic)

**Files:**
- Create: `renderer/scripts/publish/auth/oauth.ts` (token store read/write + refresh)
- Create: `renderer/scripts/publish/auth/youtube.ts`, `renderer/scripts/publish/auth/tiktok.ts` (per-platform config: scopes, endpoints)
- Test: `renderer/scripts/publish/auth/oauth.test.ts`

Token store = `renderer/.secrets/<platform>.json` (`{ refresh_token, access_token?, expires_at? }`). Scopes requested at auth time include analytics-read for the future dashboard spec (YT `youtube.upload`+`youtube.readonly`; TikTok `video.publish`+`user.info.stats`).

- [ ] **Step 1: Failing test** for `accessTokenIsFresh(token, now)` (true if `expires_at - now > 60s`) and `mergeToken(stored, refreshed)` (keeps `refresh_token` when a refresh response omits it). Pure helpers, no network.

- [ ] **Step 2:** FAIL. **Step 3: Implement** the pure helpers + `getAccessToken(platform)` (reads store; if stale, calls the platform's refresh endpoint via `fetch`; persists; returns access token). Inject `fetch` + store path for testability. **Step 4:** PASS. **Step 5: Commit** `feat(publish): oauth token store + refresh + tests`.

---

## Task 5: One-time auth CLI

**Files:**
- Create: `renderer/scripts/publish/auth/cli.mjs`

- [ ] **Step 1:** Implement `bun run publish:auth <youtube|tiktok>`: starts a localhost loopback server, opens the consent URL (print it for manual paste too), captures the `code`, exchanges it for tokens (YouTube via `google-auth-library`/`googleapis` OAuth2 client; TikTok via `POST /v2/oauth/token/` with PKCE), and writes `renderer/.secrets/<platform>.json`. Print success + which scopes were granted.
- [ ] **Step 2: Manual verification** (documented, not automated): run for each platform once real credentials exist; confirm the secrets file is written and gitignored (`git status` shows nothing).
- [ ] **Step 3: Commit** `feat(publish): one-time interactive auth CLI`.

---

## Task 6: Instagram manual adapter (TDD)

**Files:**
- Create: `renderer/scripts/publish/adapters/instagram.ts`
- Test: `renderer/scripts/publish/adapters/instagram.test.ts`

- [ ] **Step 1: Failing test:** `instagramAdapter.publish(pkg, meta, opts)` returns `{ platform: "instagram", kind: "manual", status: "manual", url: null }` and produces a checklist string listing the reel + caption file paths (no network). 
- [ ] **Step 2:** FAIL. **Step 3:** implement (returns the manual result + prints the upload checklist; `kind: "manual"`). **Step 4:** PASS. **Step 5: Commit** `feat(publish): instagram manual adapter + test`.

---

## Task 7: YouTube adapter (fixture-tested)

**Files:**
- Create: `renderer/scripts/publish/adapters/youtube.ts`
- Test: `renderer/scripts/publish/adapters/youtube.test.ts`
- Create: `renderer/scripts/publish/fixtures/youtube-insert-200.json`

- [ ] **Step 1: Failing test:** the adapter's pure result-shaper `shapeYoutubeResult(apiResponse)` maps a `videos.insert` 200 fixture → `{ platform:"youtube", status:"published", id:"<videoId>", url:"https://youtu.be/<id>", privacy }`. (The network call itself is exercised manually; unit-test the request-building + response-shaping, injecting a fake uploader.)
- [ ] **Step 2:** FAIL. **Step 3: Implement** `youtubeAdapter.publish(pkg, meta, opts)` via the **raw resumable upload REST flow** (no `googleapis`): (a) get an access token from `getAccessToken("youtube")` (uses `google-auth-library` OAuth2 to refresh); (b) `POST https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status` with the JSON `meta` body + `X-Upload-Content-Type: video/*` → capture the `Location` resumable-session URL; (c) `PUT` the reel bytes to that URL (single request is fine for a ~50MB reel; `Content-Type: video/*`); (d) shape the JSON result. Map `quotaExceeded` (note reset is midnight PT) / `uploadLimitExceeded` / 401-auth (→ re-auth hint) to friendly messages. Keep the upload behind an injectable function so the test stubs it with the fixture. **Step 4:** PASS. **Step 5: Commit** `feat(publish): youtube Shorts adapter + fixture test`.

---

## Task 8: TikTok adapter (fixture-tested)

**Files:**
- Create: `renderer/scripts/publish/adapters/tiktok.ts`
- Test: `renderer/scripts/publish/adapters/tiktok.test.ts`
- Create: `renderer/scripts/publish/fixtures/tiktok-creator-info.json`, `tiktok-init-200.json`, `tiktok-status-published.json`

- [ ] **Step 1: Failing tests** (inject a fake `fetch` returning the fixtures in sequence): 
  - `pickPrivacy(creatorInfo, configured)` returns `configured` if in `privacy_level_options`, else throws a clear "privacy_level mismatch" error.
  - `shapeTiktokResult(statusResponse)` maps a published status fixture → `{ platform:"tiktok", status:"published", id:"<publish_id>", url, privacy }`.
- [ ] **Step 2:** FAIL. **Step 3: Implement** `tiktokAdapter.publish(pkg, meta, opts)`: (a) `GET/POST /v2/post/publish/creator_info/query/`; (b) `pickPrivacy`; (c) `POST /v2/post/publish/video/init/` with `source_info: { source:"FILE_UPLOAD", video_size, chunk_size, total_chunk_count }` (for a small single-chunk reel, `chunk_size == video_size` and `total_chunk_count == 1`); (d) `PUT` the reel bytes to the returned `upload_url` — **the `PUT` MUST include `Content-Range: bytes 0-<video_size-1>/<video_size>` and `Content-Type: video/mp4`**, or TikTok rejects the chunk; (e) poll `POST /v2/post/publish/status/fetch/` until `PUBLISH_COMPLETE`/failed; (f) shape result. Add the `Content-Range`/`Content-Type` headers to the upload step covered by the fixture test. Map `unaudited_client_can_only_post_to_private_accounts`, `scope_not_authorized`, and privacy-mismatch to friendly messages. Network behind injectable `fetch`. **Step 4:** PASS. **Step 5: Commit** `feat(publish): tiktok video adapter + fixture tests`.

---

## Task 9: Publish CLI (orchestrator)

**Files:**
- Create: `renderer/scripts/publish.mjs`
- Create: `renderer/scripts/publish/run.ts` (testable orchestration)
- Test: `renderer/scripts/publish/run.test.ts`

- [ ] **Step 1: Failing tests** for `planPublish(key, platforms, { status, state, force })` (pure decision fn): throws a clear "not approved" error if `status` is NOT in `["approved","generated"]` (test both `draft`→throws and `generated`→ok); returns the list of platforms to run (skipping already-`published` unless `force`); returns the dry-run summary lines.
- [ ] **Step 2:** FAIL. **Step 3: Implement** `run.ts`: resolve key → post JSON + render dir; `readStatus`; build adapters from config; `planPublish` (gate accepts `approved` OR `generated`); if `--dry-run` or no `--yes`, print the summary and (real run) prompt to confirm; run each selected adapter (independent try/catch); `recordResult` each; if all requested succeeded, `setStatus(key, "upload_ready", { onlyFrom: ["approved", "generated"] })`. `publish.mjs` = thin argv parser (`--platforms=`, `--dry-run`, `--force`, `--yes`) calling `run.ts`. **Step 4:** PASS. **Step 5: Commit** `feat(publish): gated publish orchestrator CLI + tests`.

- [ ] **Step 6: Manual smoke** (documented): `bun run publish -- <approved-key> --platforms=youtube,tiktok --dry-run` prints the per-platform plan and posts nothing.

---

## Task 10: Pipeline `--publish=` integration

**Files:**
- Modify: `renderer/scripts/pipeline.mjs`

- [ ] **Step 1:** Add a `--publish=youtube,tiktok` flag parsed alongside the others. After the reel stage completes for a post, if `--publish` is set, invoke the same `run.ts` orchestration (require `approved`; respect `--dry-run`). Add it to the pipeline's plan printout and `HELP`.
- [ ] **Step 2: Manual verification:** `bun run pipeline -- <key> --publish=youtube --dry-run` shows publish as a final stage.
- [ ] **Step 3: Commit** `feat(pipeline): optional --publish stage`.

---

## Task 11: Docs + audit applications

**Files:**
- Create: `docs/publishing/YOUTUBE_AUDIT_APPLICATION.md`, `docs/publishing/TIKTOK_AUDIT_APPLICATION.md`
- Create: `docs/publishing/PUBLISHING.md` (setup: create the Google Cloud + TikTok apps, env vars, run `publish:auth`, the private→public flip after audit)
- Modify: `CLAUDE.md` (document the new `bun run publish` / `--publish=` commands + that YT/TikTok auto-publish is gated on `approved`; note IG stays manual)

- [ ] **Step 1:** Draft both audit applications (use-case = single-creator cybersecurity-education content; scopes; ~5 posts/day estimate; compliance notes — TikTok creator_info/interaction handling, YouTube ToS).
- [ ] **Step 2:** Write `PUBLISHING.md` setup guide.
- [ ] **Step 3:** Update `CLAUDE.md` commands section.
- [ ] **Step 4: Commit** `docs(publish): setup guide + audit applications + CLAUDE.md`.

---

## Definition of done

- `bun test` green (metadata, state, oauth, instagram, youtube, tiktok, run).
- `bun run publish -- <approved-key> --platforms=youtube,tiktok --dry-run` prints an accurate plan and posts nothing.
- With real credentials + one-time `publish:auth`, a real **private** post succeeds on each platform and `publish.state.json` + status `upload_ready` are written; re-run skips published platforms.
- Instagram remains a manual checklist; no IG automation attempted.
- Audit applications drafted and ready to submit; flipping `publish.config.json` privacy to public is the only change needed post-approval.

## Notes for the implementer
- Do **not** weaken the `approved`-status gate; it is the human-approval guarantee replacing the old "no auto-publishing" rule.
- Keep network calls behind injectable clients/`fetch` so every adapter is unit-testable without live credentials; live posting is a manual verification step.
- Secrets never get committed (`.env`, `renderer/.secrets/` are gitignored) — verify with `git status` after `publish:auth`.
