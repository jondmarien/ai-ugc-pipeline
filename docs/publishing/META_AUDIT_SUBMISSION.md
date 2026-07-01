# Meta (Facebook Page + Instagram) — app review answers

Paste-ready answers for Meta's use-case customization / App Review screens. This app only ever publishes the operator's own content to the operator's own Facebook Page and linked Instagram Business account — no other person's account is involved, so **Standard Access with the operator as an app admin/tester is sufficient** and no public App Review submission should be required. Keep this doc ready in case Meta later requires a review pass (e.g. if scope changes).

- **Website URL:** https://ai-ugc.chron0.tech
- **Business Portfolio:** the operator's own, containing the Facebook Page + linked Instagram professional account.
- **Use cases:** "Manage everything on your Page" + "Manage messaging & content on Instagram" (see `docs/publishing/PUBLISHING.md` for the exact app-creation steps — Meta replaced the old per-product flow with these use cases).
- **Redirect URI:** `http://localhost:8788/callback` (registered under Facebook Login for Business, which is auto-added by the two use cases above).

## 1. How each permission is used

**`pages_show_list`** — Lets the app enumerate the Pages the operator administers via `GET /me/accounts`, so it can resolve the one Page (and its linked Instagram Business Account) the pipeline publishes to. Read-only, used once per token-liveness check.

**`pages_read_engagement`** — Required alongside `pages_show_list` to read the Page object needed to resolve the linked `instagram_business_account` field.

**`pages_manage_posts`** — Authorizes the actual Facebook Page video publish: `POST /<PAGE_ID>/videos` (resumable upload: start/transfer/finish), used to post the operator's own rendered reel to their own Page.

**`instagram_basic`** — Read-only access to the linked Instagram Business Account's ID, required to construct the container-publish calls below.

**`instagram_content_publish`** — Authorizes the Instagram Reels publish flow: `POST /<IG_USER_ID>/media` (create a REELS container from a temporarily-hosted public video URL), poll `GET /<CONTAINER_ID>?fields=status_code`, then `POST /<IG_USER_ID>/media_publish`. Only the operator's own original videos are posted, to the operator's own account.

## 2. How OAuth works

1. `bun run publish:auth meta` opens `https://www.facebook.com/<version>/dialog/oauth` (Facebook Login for Business) with the five scopes above.
2. The operator approves; the app receives an authorization code at the local loopback (`http://localhost:8788/callback`).
3. The code is exchanged for a short-lived User access token, then exchanged again for a **long-lived** User access token (`grant_type=fb_exchange_token`, valid ~60 days).
4. `GET /me/accounts` resolves the Page ID, a **Page access token**, and the linked Instagram Business Account ID. The Page access token (not the user token) is what adapters use to publish.
5. Because Page tokens derived this way don't rotate on a timer, liveness is checked via `GET /debug_token` (at most once per 24h) rather than refreshed — an invalid/expired token surfaces a clear "re-run `publish:auth meta`" error instead of failing silently.

## 3. Rate-limit handling

Instagram allows 100 API-published posts per 24h rolling window per IG user (`GET /<IG_ID>/content_publishing_limit`). At an expected cadence of a few posts/day for a single operator, this is never approached; no proactive checking is implemented, matching the scale of the other platform adapters (YouTube/TikTok quota handling is reactive, not preemptive).

## 4. Compliance notes

- **Data retention:** the reel is uploaded to a temporary public blob (Vercel Blob, via `website/api/publish-temp.ts` on `ai-ugc.chron0.tech`) solely so Instagram's servers can fetch it; the blob is deleted immediately after the container reaches `FINISHED` (or on any failure/timeout, via a `finally` block). No third party other than Meta's own fetch of that URL ever sees the file.
- **Credentials:** `META_APP_ID`/`META_APP_SECRET` and the Page/IG tokens are stored only on the operator's machine (`renderer/.env`, `renderer/.secrets/meta.json`), gitignored, never logged, never sent anywhere but the official `graph.facebook.com` endpoints.
- **Single operator, single Page, single IG account** — no multi-tenant use, no data collected from or about other users.
- Facebook Page videos default to `published=false` (unpublished draft, visible only to Page admins) and the Instagram account is kept non-public-facing during testing, mirroring YouTube's "private" and TikTok's "SELF_ONLY" interim defaults — until the operator explicitly flips `publish.config.json`'s privacy values.

## 5. Demo shot list (if a review is ever requested)

1. **Website match:** briefly show `https://ai-ugc.chron0.tech` in a browser.
2. **Auth:** run `bun run publish:auth meta`; show the Facebook Login for Business consent screen, granting the five scopes, and the "Page: <name> / Instagram Business Account: <id>" success message.
3. **Facebook publish:** run `bun run publish -- <approved-key> --platforms=facebook`; show the resumable upload completing and the video appearing as an unpublished draft on the Page.
4. **Instagram publish:** run `bun run publish -- <approved-key> --platforms=instagram` (with `instagram.mode` set to `"api"`); show the temp-hosting upload, the container status poll reaching `FINISHED`, and the Reel appearing on the linked account.
5. **Cleanup:** show (or narrate) the temp-hosted blob being deleted post-publish.

Keep all token values, App Secret, and `PUBLISH_TEMP_SECRET` out of frame.
