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

Our renderer only produces local files (`pipeline/renders/<key>/reel.mp4`); IG's `video_url` requires a public URL. **Reuse the existing `aiugc.chron0.tech` Vercel project (`website/`) via Vercel Blob** rather than standing up S3/R2 or a tunnel:

- `website/api/publish-temp.ts` — POST, bearer-auth (`PUBLISH_TEMP_SECRET`), uploads bytes via `@vercel/blob` `put()`, returns `{url, pathname}`.
- `website/api/publish-temp-delete.ts` — POST, same auth, `del(pathname)` after the IG container reaches `FINISHED` (or on failure/timeout, via `finally`).
- One-time setup: link a Vercel Blob store to the `aiugc.chron0.tech` project (auto-injects `BLOB_READ_WRITE_TOKEN`), set `PUBLISH_TEMP_SECRET` as a matching Vercel env var and in `renderer/.env`.
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

## OAuth flow — issues hit during real setup, and the fixes (in the order encountered)

Getting `bun run publish:auth meta` to actually complete, against a real Meta app, surfaced five distinct problems beyond what any single doc page covers. Recorded here in full so nobody has to rediscover this.

### 1. "Can't load URL" / App Domains rejects `localhost`

**Symptom:** Meta's App Dashboard → Settings → Basic → App Domains field refuses to accept `localhost` as a domain.

**Cause/fix:** App Domains is for JS-SDK/website domain verification, not for the server-side `/dialog/oauth` redirect-code flow this tool uses. It should be left **empty**. The actual place the redirect URI needs to be registered is **Facebook Login for Business → Settings → Valid OAuth Redirect URIs** — add `http://localhost:8788/callback` there and Save. The "Check URI" tool on the App Domains page was failing because that Valid OAuth Redirect URIs field was still empty, not because localhost is disallowed. The app must also stay in **Development** mode — Live apps require HTTPS redirect URIs.

### 2. "Invalid Scopes: pages_read_engagement, pages_manage_posts, instagram_basic, instagram_content_publish"

**Symptom:** Only `pages_show_list` was accepted; the rest of the requested scopes were rejected outright by the OAuth dialog.

**Cause/fix:** The use-case wizard doesn't always fully attach every permission it implies. Go to **App Dashboard → App Review → Permissions and Features**, find each permission, and confirm it's actually added to the app (Standard Access is enough for testing — no App Review submission needed for a single-owner app). If a permission never shows there, go back into the **Use cases** customization screens ("Manage everything on your Page" / "Manage messaging & content on Instagram") and make sure each is checked and saved. Also confirm the authorizing account has an Admin/Developer role on the app, and that the Page + IG account live in the same Business Portfolio the app is connected to.

(Note: do **not** switch to the `instagram_business_basic`/`instagram_business_content_publish` permission names — those belong to the separate "Instagram API with Instagram Login" product. `instagram_basic`/`instagram_content_publish` are correct for the **Facebook Login** path this tool uses.)

### 3. "API calls from the server require an appsecret_proof argument"

**Symptom:** After scopes were fixed, the OAuth code exchange succeeded but `GET /me/accounts` failed with a 400 and this message.

**Cause:** The app has **"Require app secret"** enabled (Settings → Advanced) — a real security setting, not a misconfiguration to undo. Once enabled, every Graph API call authenticated with a **User or Page** access token must include `appsecret_proof` (`HMAC-SHA256(access_token, app_secret)` as a hex digest). Calls authenticated with an **app** access token (`appId|appSecret`, e.g. `debugToken`) don't need it.

**Fix:** `renderer/scripts/publish/auth/meta.ts` exports `appSecretProof(accessToken, appSecret)`. It's applied to `fetchPageAccounts`, `fetchInstagramAccountForPage`, `fetchPageDetails`, and every Page-token Graph call in `adapters/facebook.ts`/`adapters/instagram.ts` (via each file's local `withProof()` helper).

### 4. "No Facebook Page with a linked Instagram Business account was found" (attempt 1 — asset picker never shown)

**Symptom:** `/me/accounts` succeeded and returned the Page, but `instagram_business_account` was absent even though the Page genuinely has a linked Instagram account.

**Cause/fix:** The authorization URL was missing two parameters Meta's own docs specify for triggering the Instagram asset-picker during consent: `display=page` and `extras={"setup":{"channel":"IG_API_ONBOARDING"}}`. Without them, standard Facebook Login only asks the user to approve Page access — it never surfaces the "select which Instagram account to grant" step, so the field comes back empty regardless of how the Page and IG account are actually connected on Meta's side. Both params were added to the authorization URL built in `cli.mjs`'s `runMeta()`.

### 5. "No Facebook Page with a linked Instagram Business account was found" (attempt 2 — the real root cause)

**Symptom:** After fix #4, the asset-picker *did* show up and the user granted access to both the Page and the Instagram account — but `/me/accounts` still returned **zero Pages** (not "a Page with no IG link" — no Pages at all).

**Diagnosis:** Added instrumentation to `runMeta()` to call `GET /debug_token` on the freshly-minted user token and print its `scopes` and `granular_scopes`. This showed the token legitimately had `pages_show_list`/`pages_manage_posts`/`pages_read_engagement` granted for one specific Page id, and `instagram_basic`/`instagram_content_publish` granted for one specific Instagram user id — the assets **were** granted. The problem was `/me/accounts` itself: that endpoint only enumerates Pages the user **broadly** manages. It does not enumerate Pages/assets granted through the newer **asset-scoped** consent flow that the `IG_API_ONBOARDING` extras param (fix #4) triggers. Asking `/me/accounts` "what do you manage" and asking the token "what were you granted" are different questions, and only the second one has the answer when consent was asset-scoped.

**Fix:** `extractGrantedIds(granularScopes)` (pure, unit-tested in `meta.test.ts`) pulls the granted Page id and Instagram user id straight off `granular_scopes`. `fetchPageDetails(pageId, userAccessToken, appSecret)` fetches that Page's name + access token directly by id — bypassing `/me/accounts` entirely. `runMeta()` tries, in order: (1) `/me/accounts` + `pickPageWithInstagram`, (2) a per-Page direct `instagram_business_account` lookup as a fallback, (3) if both come back empty, extract the granted ids from `granular_scopes` and fetch the Page directly by id. Accounts that enumerate normally via `/me/accounts` are unaffected — this only kicks in when that path comes up empty.

**End state confirmed working:**
```
[publish:auth] Pages returned by /me/accounts: 0
[publish:auth] /me/accounts had no match — using granted asset ids directly: page=<PAGE_ID> ig=<IG_USER_ID>

[publish:auth] Meta authorization complete.
[publish:auth] Page: <name> (<PAGE_ID>)
[publish:auth] Instagram Business Account: <IG_USER_ID>
[publish:auth] Granted scopes: pages_show_list, pages_read_engagement, pages_manage_posts, instagram_basic, instagram_content_publish
[publish:auth] Token written to renderer/.secrets/meta.json
```

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
