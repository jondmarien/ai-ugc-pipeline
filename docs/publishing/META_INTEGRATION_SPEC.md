# Meta (Facebook Page + Instagram) Publishing — Spec

Extends `bun run publish` (see [PUBLISHING.md](PUBLISHING.md) and [renderer/docs/PUBLISHING_ARCHITECTURE.md](../../renderer/docs/PUBLISHING_ARCHITECTURE.md)) with Facebook Page video publishing and Instagram Reels publishing, following the same gated adapter architecture as YouTube/TikTok.

## Why

Jon is Meta-verified with a connected Facebook Page + linked Instagram Business account. Instagram publishing has been `kind: "manual"` (prints an upload checklist) since day one; this work makes it a real Graph API adapter, and adds a new Facebook Page adapter, so both surfaces publish the same way YouTube/TikTok already do.

## Meta's token model (differs from YouTube/TikTok)

A **User access token** (via Facebook Login for Business) is exchanged short-lived → long-lived (`GET /oauth/access_token?grant_type=fb_exchange_token`). `GET /me/accounts?fields=id,name,access_token,instagram_business_account` then returns the Facebook **Page ID + Page access token + linked IG Business Account ID**. Page tokens derived this way don't rotate via `refresh_token` the way `renderer/scripts/publish/auth/oauth.ts` expects for YouTube/TikTok — liveness is checked via `GET /debug_token`, not refreshed on a timer.

## Facebook Page video publish

Resumable upload to `POST /<PAGE_ID>/videos` (`upload_phase=start/transfer/finish`) — same shape as the existing YouTube resumable adapter (`renderer/scripts/publish/adapters/youtube.ts`).

## Carousel support, AI content disclosure, Trial Reels (added post-implementation)

- **Carousels**: the Instagram adapter also supports `instagram.postType: "carousel"` — every slide PNG (`pkg.slides`) is temp-hosted, turned into a child container (`image_url`, `is_carousel_item=true`, `alt_text`), then combined into a parent `media_type=CAROUSEL` container (`children=<ids>`). All temp-hosted images are cleaned up in a `finally`. See [carousel container docs](https://developers.facebook.com/documentation/instagram-platform/content-publishing#create-a-carousel-container).
- **AI content disclosure**: every Instagram container this pipeline creates sets `is_ai_generated=true` — required, not configurable, since all output is AI-generated. For carousels, **only the parent** container may set it; Meta errors if a child container also sets it. Facebook Page videos have no documented equivalent parameter on this endpoint as of Graph API v25.0, so it isn't sent there. See [AI content docs](https://developers.facebook.com/documentation/instagram-platform/content-publishing#ai-content).
- **Trial Reels**: `instagram.trialReels: true` adds `trial_params: {graduation_strategy: "MANUAL"}` to Reels containers, once the account is approved for the feature. See [trial reels docs](https://developers.facebook.com/documentation/instagram-platform/content-publishing#trial-reels-posts).

## Instagram Reels publish — two-step container flow

1. `POST /<IG_USER_ID>/media` — `media_type=REELS`, `video_url` (Meta fetches from a **public URL**, unlike YouTube/TikTok's byte-upload model), `caption` (max 2200 chars / 30 hashtags / 20 @tags), optional `share_to_feed`, `cover_url`, `thumb_offset`, `alt_text` (images only).
2. Poll `GET /<CONTAINER_ID>?fields=status_code` until `FINISHED` (states: `IN_PROGRESS`, `FINISHED`, `ERROR`, `EXPIRED`).
3. `POST /<IG_USER_ID>/media_publish?creation_id=<CONTAINER_ID>`.

Rate limit: 100 API-published posts / 24h rolling window, checkable via `GET /<IG_ID>/content_publishing_limit`.

## Temp hosting decision

Our renderer only produces local files (`pipeline/renders/<key>/reel.mp4`); IG's `video_url` requires a public URL. **Reuse the existing `ai-ugc.chron0.tech` Vercel project (`website/`) via Vercel Blob** rather than standing up S3/R2 or a tunnel:

- `website/api/publish-temp.ts` — POST, bearer-auth (`PUBLISH_TEMP_SECRET`), uploads bytes via `@vercel/blob` `put()`, returns `{url, pathname}`.
- `website/api/publish-temp-delete.ts` — POST, same auth, `del(pathname)` after the IG container reaches `FINISHED` (or on failure/timeout, via `finally`).
- One-time setup: link a Vercel Blob store to the `ai-ugc.chron0.tech` project (auto-injects `BLOB_READ_WRITE_TOKEN`), set `PUBLISH_TEMP_SECRET` as a matching Vercel env var and in `renderer/.env`.
- Rejected: standalone S3/R2 (new infra when a deployed project already exists), ngrok/cloudflared (needs a live local process for the whole container-processing window), reusing a YouTube URL (couples IG to YouTube's run order and "private" YouTube videos aren't public-fetchable anyway).

## Meta Dev Portal setup

Meta's app creation flow is now **use-case-driven** (the old "add products individually" flow is gone). For a single-owner pipeline publishing only to accounts Jon administers:

1. developers.facebook.com → **Create App** → connect the **Business Portfolio** containing the Page + linked IG professional account.
2. On **"Select a use case,"** pick both of these (they're compatible with each other):
   - **"Manage everything on your Page"** → covers `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`.
   - **"Manage messaging & content on Instagram"** → covers `instagram_basic`, `instagram_content_publish`.
   - Do **not** pick "Authenticate and request data from users with Facebook Login" — that's the consumer sign-in use case and is incompatible with the two above (this is what blocks everything else when selected first).
   - **Facebook Login for Business** and **Webhooks** are added automatically once the two use cases above are selected.
3. Request only: `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `instagram_basic`, `instagram_content_publish` (+ `business_management` only if needed). Standard Access with Jon's own account as admin/tester is enough — no public App Review needed.
4. Credentials go in `renderer/.env`: `META_APP_ID`, `META_APP_SECRET`. Page ID + IG Business Account ID are resolved at auth time via `/me/accounts`, not hand-entered.

## `.secrets/meta.json` shape

```json
{
  "user_access_token": "...",
  "user_token_expires_at": 0,
  "page_id": "...",
  "page_access_token": "...",
  "ig_user_id": "...",
  "last_verified_at": 0
}
```

## Error handling

Mirror the friendly-hint style in `youtube.ts`/`tiktok.ts`: Graph API code 190 (expired/invalid token) → `"Meta token invalid — run 'bun run publish:auth meta' to re-authenticate."`; code 100 (bad parameter) → dump a summary of the request; IG container `status_code: ERROR/EXPIRED` → surface the container's `status` error subcode.

## Rollout

Branch `feature/meta-publishing`, one commit per phase:

1. Scaffold — this doc, `config.ts` / `publish.config.json` / `.env.example` additions.
2. `auth/meta.ts`, `cli.mjs` `meta` case (`bun run publish:auth meta`), `.secrets/meta.json` handling.
3. `adapters/facebook.ts` + `run.ts` registration.
4. `website/api/publish-temp.ts` + `publish-temp-delete.ts`, `adapters/lib/temp-hosting.ts`, `adapters/instagram.ts` rewrite (`kind: "manual"` → `"api"`) + registration.
5. Docs: `META_AUDIT_SUBMISSION.md`, updates to `PUBLISHING.md` / `PUBLISHING_ARCHITECTURE.md` / root `CLAUDE.md`.

## Verification

- `bun run publish -- --platforms facebook,instagram --dry-run` on a `generated` test post first.
- One real throwaway post: Facebook Page video as draft/unpublished, Instagram Reel to the account (kept non-public-facing during testing) — confirm `publish.state.json` records real ids and `status: "published"`.
- Confirm the Vercel Blob temp object is deleted post-publish.
- Confirm `publish-temp.ts` rejects requests without the correct bearer secret (401).
- Manually invalidate the stored token and confirm the friendly re-auth error fires.
- Confirm `--force` re-publish works per-platform without re-publishing already-`published` platforms unless forced.
