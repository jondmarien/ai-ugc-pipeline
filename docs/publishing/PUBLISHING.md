# Publishing setup guide (YouTube Shorts + TikTok + Meta)

How to wire up and run the gated multi-platform publisher. YouTube, TikTok, and now Facebook Page + Instagram publish via their official APIs, gated on human approval. (Instagram can still be run in `mode: "manual"` for carousels, which have no API adapter here.)

> One-time setup is steps 1–4. After that, publishing is `bun run publish -- <key> --platforms=youtube,tiktok,facebook,instagram`.

---

## 0. How it works (one paragraph)

A post's rendered `reel.mp4` is uploaded to YouTube (as a Short), TikTok (Direct Post), a Facebook Page (resumable video upload), and Instagram (Graph API Reels) by per-platform adapters behind one `publish()` interface. Tokens are minted once via an interactive OAuth flow and stored locally. Publishing is **gated**: only a `generated` post can publish (a post becomes `generated` once it is approved AND rendered, so a reel exists to post; `draft` and unrendered `approved` are rejected), it asks for confirmation (unless `--yes`), records each result in `pipeline/renders/<key>/publish.state.json` (so re-runs skip already-published platforms), and flips the post to `upload_ready` when every requested platform succeeds. Until each platform's API audit passes, uploads are **private** (YouTube) / **SELF_ONLY** (TikTok) / **unpublished draft** (Facebook Page) / **non-public-facing account** (Instagram); going public is a one-value change in `publish.config.json`.

---

## 1. Create the platform apps

### YouTube (Google Cloud)
1. In the [Google Cloud Console](https://console.cloud.google.com), create a project and enable the **YouTube Data API v3**.
2. Configure the OAuth consent screen (External, your own Google account as a test user).
3. Create an **OAuth client ID** of type **Desktop app**.
4. Add the redirect URI **`http://localhost:8788/callback`**.
5. Scopes used: `youtube.upload` (upload) and `youtube.readonly` (confirm uploads; reused by the future analytics dashboard).

### TikTok (TikTok for Developers)
1. In the [TikTok developer portal](https://developer.tiktok.com), create an app.
2. Add products **Login Kit** and **Content Posting API** (Direct Post).
3. Register the redirect URI **`http://localhost:8788/callback`** (Desktop platform, no trailing slash).
4. Request scopes **`video.publish`** and **`user.info.basic`** only (analytics scopes are deferred; see the audit doc).

### Meta (Facebook Page + Instagram)
Meta's app creation flow is now **use-case-driven** (the old "add products individually" flow is gone).
1. At [developers.facebook.com](https://developers.facebook.com), **Create App** → connect the **Business Portfolio** containing your Facebook Page and its linked Instagram professional account.
2. On **"Select a use case,"** pick both of these together (they're compatible — selecting one no longer greys out the other):
   - **"Manage everything on your Page"** → grants `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`.
   - **"Manage messaging & content on Instagram"** → grants `instagram_basic`, `instagram_content_publish`.
   - Do **not** pick "Authenticate and request data from users with Facebook Login" — that's the consumer sign-in use case; it's incompatible with the two above and is what blocks everything else if picked first.
   - **Facebook Login for Business** and **Webhooks** are added automatically once the two use cases above are selected — you don't add them separately.
3. Request only the five scopes named above. Standard Access with yourself as an app admin/tester is enough — no public App Review needed since this only ever publishes to accounts you own (see `META_AUDIT_SUBMISSION.md` if a review is ever requested).
4. One-time: link a **Vercel Blob** store to the `ai-ugc.chron0.tech` Vercel project (Instagram's `video_url` must be publicly fetchable; see §0 architecture in `renderer/docs/PUBLISHING_ARCHITECTURE.md`) and set a `PUBLISH_TEMP_SECRET` value as a Vercel env var on that project.

---

## 2. Set credentials

Copy `renderer/.env.example` to `renderer/.env` and fill in:

```
YOUTUBE_CLIENT_ID=...
YOUTUBE_CLIENT_SECRET=...
TIKTOK_CLIENT_KEY=...
TIKTOK_CLIENT_SECRET=...
META_APP_ID=...
META_APP_SECRET=...
PUBLISH_TEMP_SECRET=...
```

`PUBLISH_TEMP_SECRET` must match the value set on the `ai-ugc.chron0.tech` Vercel project (step 1, Meta). `renderer/.env` and `renderer/.secrets/` are gitignored. Never commit them.

---

## 3. Authorize each account (once)

```bash
cd renderer
bun run publish:auth youtube
bun run publish:auth tiktok
bun run publish:auth meta
```

Each command opens the consent page (and prints the URL for manual paste), runs a loopback server on `http://localhost:8788/callback`, exchanges the code for tokens, and writes `renderer/.secrets/<platform>.json`. TikTok uses PKCE + a CSRF `state` check. `meta` is different from the other two: it doesn't store a `refresh_token` — Facebook Page tokens don't rotate on a timer, so `auth/meta.ts` checks liveness via `GET /debug_token` instead (see `renderer/docs/PUBLISHING_ARCHITECTURE.md`). Confirm with `git status` that nothing under `.secrets/` shows up.

---

## 4. Configure defaults

Edit `publish.config.json` (repo root):

```json
{
  "youtube": { "enabled": true, "privacy": "private", "categoryId": "28" },
  "tiktok":  { "enabled": true, "privacy": "SELF_ONLY", "disableComment": false, "disableDuet": false, "disableStitch": false },
  "facebook": { "enabled": true, "privacy": "draft" },
  "instagram": { "enabled": true, "mode": "manual" }
}
```

Keep `private` / `SELF_ONLY` / `draft` until the audits pass (see step 6). `categoryId` 28 = Science & Technology. Flip `instagram.mode` from `"manual"` to `"api"` once you're ready to publish Reels automatically — `"manual"` is still the default and is the only mode that supports carousels (the API adapter here is Reels-only).

---

## 5. Publish

```bash
# Preview the plan, post nothing:
bun run publish -- <post-key> --platforms=youtube,tiktok,facebook,instagram --dry-run

# Real run (asks to confirm; add --yes to skip the prompt):
bun run publish -- <post-key> --platforms=youtube,tiktok,facebook,instagram
```

Rules:
- The post must be **`generated`** (approved AND rendered, so the reel exists). `--force` re-publishes a platform already marked published; it does **not** bypass the gate.
- Platforms run independently. One failing does not block the other; failures are recorded and the run leaves the status unchanged so you can fix and re-run (published platforms are skipped).
- On full success the post flips to `upload_ready`.

As an opt-in final pipeline stage:

```bash
bun run pipeline -- <post-key> --publish=youtube,tiktok,facebook,instagram        # publishes after the reel
bun run pipeline -- <post-key> --publish=youtube,tiktok,facebook,instagram --dry-run
```

YouTube `videos.insert` costs 1,600 of the default 10,000 quota units/day (about 6 uploads/day) until the audit raises it. Instagram's Graph API allows 100 API-published posts per 24h rolling window (checkable via `GET /<IG_ID>/content_publishing_limit`) — never a real constraint at this pipeline's cadence.

---

## 6. Go public (after audits)

Uploads are private/SELF_ONLY/draft until each platform approves the app:
- **YouTube:** pass the API compliance audit (see `YOUTUBE_AUDIT_APPLICATION.md`), then set `youtube.privacy` to `public` (or `unlisted`).
- **TikTok:** pass the Content Posting audit (see `TIKTOK_AUDIT_SUBMISSION.md` for the paste-ready answers + demo shot list), then set `tiktok.privacy` to an allowed public level.
- **Meta:** no public review is expected for a single-owner app (see `META_AUDIT_SUBMISSION.md`), but keep `facebook.privacy` at `"draft"` and the Instagram account non-public-facing until you've verified the flow end to end, then flip `facebook.privacy` to `"public"`.

No code change is needed to go public — only the `publish.config.json` privacy value.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `No refresh token for "<platform>"` | Run `bun run publish:auth <platform>` first. |
| TikTok `privacy mismatch` / `unaudited_client_can_only_post_to_private_accounts` | Set `tiktok.privacy` to `SELF_ONLY` until the audit passes. |
| TikTok `scope_not_authorized` | Re-run `publish:auth tiktok` and grant `video.publish`. |
| YouTube `quotaExceeded` | Daily cap reached (resets midnight PT); wait or request more quota in the audit. |
| `Reel not found` | Render it first: `bun run pipeline -- <key>`. |
| `No Meta credentials found` | Run `bun run publish:auth meta` first. |
| `Meta Page token is invalid or expired` | Re-run `bun run publish:auth meta`. |
| `PUBLISH_TEMP_SECRET is not set` | Set it in `renderer/.env`, matching the value on the `ai-ugc.chron0.tech` Vercel project. |
| Instagram container stuck at `IN_PROGRESS` past ~5 min | The adapter times out and reports failed; check the video meets Reels specs (duration/aspect ratio) and re-run. |
