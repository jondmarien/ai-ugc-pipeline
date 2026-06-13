# Multi-platform publishing (YouTube Shorts + TikTok) — design

**Date:** 2026-06-13
**Status:** approved (brainstorming) → implementation plan next
**Author:** Jon (via Claude Code)

## Problem

The pipeline produces upload-ready packages (`pipeline/renders/<key>/`: 8 carousel PNGs + `reel.mp4` 1080×1920 + `caption.txt`, `alt_text.txt`, sources, `voice.meta.json`). Today every platform upload is **manual**. Instagram cannot be automated (the user is locked out of Meta's developer/business API path), so it stays manual forever. The user wants **automated publishing to YouTube Shorts and TikTok** — run the pipeline, then post with one gated command — and eventually to repoint the existing analytics dashboard from Instagram to YouTube + TikTok.

## Scope (this spec)

**In:** the publishing subsystem — reel → YouTube Short + TikTok video, gated and idempotent, with the existing Instagram flow preserved as a manual path.
**Out (separate later spec):** dashboard analytics repoint (YouTube/TikTok stats replacing `dashboard/server/ig.ts`).
**Deferred (phase 2):** TikTok photo carousels (needs PNG→JPEG + verified-domain image hosting).

## Decisions (from brainstorming)

- Publishing now; dashboard analytics repoint is its own later spec.
- Build now, **private-interim**: until each platform's audit passes, posts upload as private (YouTube) / `SELF_ONLY` (TikTok); a config switch flips to public per platform once approved. Audit applications drafted as part of this work.
- **Explicit, gated publish** (honors the CLAUDE.md "a human approves before posting" rule): a dedicated command + an opt-in pipeline flag, only for `approved` posts, with dry-run/confirm. Never silent.
- TikTok **video/reel first**; carousel is phase 2.

## Hard constraints (verified against platform docs, 2026-06-13)

- **YouTube:** a Short is a normal `videos.insert` of a vertical <3 min video (no special endpoint). Uploads from an **unverified** Cloud project go **private** until a compliance audit passes. `videos.insert` costs 1,600 of the default 10,000 quota units/day → ~6 uploads/day (sufficient; more needs the audit). Scope `youtube.upload`; OAuth refresh token for non-interactive use.
- **TikTok:** Direct Post; **unaudited apps post `SELF_ONLY` only**, ≤5 users/24h; public requires passing TikTok's audit (UX-compliance requirements); ~15 posts/day/creator cap even when audited. Must query `/creator_info/query/` before posting, use a returned `privacy_level`, honor comment/duet/stitch. Video via `FILE_UPLOAD` (no hosting). Photos JPEG/WEBP only (PNG rejected), generally `PULL_FROM_URL` from a verified domain — hence carousel deferred. Scopes `video.publish` (+ `video.upload`).
- Both target a **single owned account**, so OAuth is one-time (stored refresh token) and per-user caps are irrelevant.

## Architecture

A pluggable **platform-adapter** layer in `renderer/` (matches `bun run …` ergonomics; the pipeline lives there).

- **Adapter interface:** `publish(renderPkg, metadata, opts) → PublishResult { platform, status, id, url, privacy, error }`. Plus `name`, and a `kind: "api" | "manual"`.
- **Adapters:** `youtube` (api), `tiktok` (api), `instagram` (manual — emits the upload checklist + opens the render folder; no API call, so the IG flow is preserved and uniform in the same UX).
- **Auth/token layer** (`publish/auth/`): one-time interactive OAuth per platform → stored refresh token; non-interactive access-token minting thereafter. Requests **publish + read-analytics scopes together** now (YT `youtube.upload`+`youtube.readonly`; TikTok `video.publish`+`user.info.stats`) so the later dashboard spec reuses tokens with no re-auth.
- **Metadata mapper** (pure): post JSON + render package → per-platform payload (title ≤100 chars, description from `caption.txt`, hashtags, `#Shorts` for YT, TikTok privacy/interaction fields).
- **Publish-state store:** `pipeline/renders/<key>/publish.state.json` records per-platform {status, id, url, privacy, timestamp}; drives idempotency.

### Module layout
```
renderer/scripts/publish.mjs               # CLI entry: bun run publish
renderer/scripts/publish/
  adapters/youtube.ts                       # videos.insert
  adapters/tiktok.ts                        # Direct Post video (creator_info → init → upload → poll)
  adapters/instagram.ts                     # manual checklist adapter
  auth/oauth.ts                             # shared OAuth loopback + token store/refresh
  auth/youtube.ts  auth/tiktok.ts           # per-platform auth config
  metadata.ts                               # pure post→payload mapping (+ tests)
  state.ts                                  # publish.state.json read/write + idempotency (+ tests)
  config.ts                                 # publish.config.json (privacy per platform, account ids)
renderer/.secrets/<platform>.json           # gitignored refresh tokens
renderer/.env                               # gitignored client id/secret
publish.config.json                         # committed: privacy switches default to private/SELF_ONLY
```

## Flow

1. Resolve post by key; **require status `approved`** (else stop with fix-it message; `--force` is NOT a bypass for approval — approval is the human gate).
2. Map metadata; for `--dry-run` or absent `--yes`, print the per-platform plan (title, privacy, file, account) and (real run) confirm before posting.
3. Per requested platform, run its adapter on `<key>_reel.mp4`. Platforms are independent — one failing doesn't block the other.
4. TikTok: query `/creator_info/query/`, pick privacy from returned options, `FILE_UPLOAD`, then poll `/publish/status/fetch/`. YouTube: `videos.insert` (resumable), return id/URL (processing finishes async).
5. Write results to `publish.state.json`; re-runs skip platforms already `published` unless `--force`. On all requested platforms succeeding, flip post status `approved → upload_ready` (the lifecycle's terminal "published").

## CLI / UX

- `bun run publish -- <key> --platforms=youtube,tiktok [--dry-run] [--force] [--yes]`
- `bun run pipeline -- <key> --publish=youtube,tiktok` (opt-in final stage; same approval gate).
- `bun run publish:auth youtube|tiktok` (one-time interactive OAuth).
- Default privacy = private/`SELF_ONLY`; flip in `publish.config.json` after audits.

## Error handling

Per-platform try/catch with partial-result recording. Friendly messages for: quota exceeded (YT, with reset note), token expired (re-auth hint), TikTok `privacy_level` mismatch / `unaudited_client_can_only_post_to_private_accounts`, missing/!approved status, unreadable render package.

## Testing

`bun test` + fixtures (mirrors `dashboard/`): unit tests for the pure `metadata` mapper (post → YT/TikTok payloads), `state` idempotency/skip logic, and token-refresh logic against fixture API responses. Live posting verified manually: `--dry-run` first, then a real **private** post on each platform.

## Audit applications (deliverable)

Draft the **YouTube API compliance audit** and **TikTok Content Posting audit** submissions (use-case, scopes, single-creator usage estimates) so the user can submit and start the public-posting lead time.

## Risks

- Public posting blocked until audits pass (days–weeks) — mitigated by the private-interim config; the build is fully exercised privately meanwhile.
- TikTok compliance UX requirements (creator_info, interaction toggles) — handled in the adapter; documented for the audit.
- TikTok carousel hosting/format — explicitly deferred to phase 2.
- OAuth token storage is local + gitignored — acceptable for a single-operator tool; documented.
