# Publishing setup guide (YouTube Shorts + TikTok)

How to wire up and run the gated multi-platform publisher. **Instagram stays manual** (no Meta API access); YouTube and TikTok publish via their official APIs, gated on human approval.

> One-time setup is steps 1–4. After that, publishing is `bun run publish -- <key> --platforms=youtube,tiktok`.

---

## 0. How it works (one paragraph)

A post's rendered `reel.mp4` is uploaded to YouTube (as a Short) and TikTok (Direct Post) by per-platform adapters behind one `publish()` interface. Tokens are minted once via an interactive OAuth flow and stored locally. Publishing is **gated**: only a post whose status is `approved` or `generated` can publish, it asks for confirmation (unless `--yes`), records each result in `pipeline/renders/<key>/publish.state.json` (so re-runs skip already-published platforms), and flips the post to `upload_ready` when every requested platform succeeds. Until each platform's API audit passes, uploads are **private** (YouTube) / **SELF_ONLY** (TikTok); going public is a one-value change in `publish.config.json`.

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

---

## 2. Set credentials

Copy `renderer/.env.example` to `renderer/.env` and fill in:

```
YOUTUBE_CLIENT_ID=...
YOUTUBE_CLIENT_SECRET=...
TIKTOK_CLIENT_KEY=...
TIKTOK_CLIENT_SECRET=...
```

`renderer/.env` and `renderer/.secrets/` are gitignored. Never commit them.

---

## 3. Authorize each account (once)

```bash
cd renderer
bun run publish:auth youtube
bun run publish:auth tiktok
```

Each command opens the consent page (and prints the URL for manual paste), runs a loopback server on `http://localhost:8788/callback`, exchanges the code for tokens (TikTok uses PKCE + a CSRF `state` check), and writes `renderer/.secrets/<platform>.json`. Confirm with `git status` that nothing under `.secrets/` shows up.

---

## 4. Configure defaults

Edit `publish.config.json` (repo root):

```json
{
  "youtube": { "enabled": true, "privacy": "private", "categoryId": "28" },
  "tiktok":  { "enabled": true, "privacy": "SELF_ONLY", "disableComment": false, "disableDuet": false, "disableStitch": false },
  "instagram": { "enabled": true, "mode": "manual" }
}
```

Keep `private` / `SELF_ONLY` until the audits pass (see step 6). `categoryId` 28 = Science & Technology.

---

## 5. Publish

```bash
# Preview the plan, post nothing:
bun run publish -- <post-key> --platforms=youtube,tiktok --dry-run

# Real run (asks to confirm; add --yes to skip the prompt):
bun run publish -- <post-key> --platforms=youtube,tiktok
```

Rules:
- The post must be **`approved` or `generated`** (the human-approval gate). `--force` re-publishes a platform already marked published; it does **not** bypass approval.
- Platforms run independently. One failing does not block the other; failures are recorded and the run leaves the status unchanged so you can fix and re-run (published platforms are skipped).
- On full success the post flips to `upload_ready`.

As an opt-in final pipeline stage:

```bash
bun run pipeline -- <post-key> --publish=youtube,tiktok        # publishes after the reel
bun run pipeline -- <post-key> --publish=youtube,tiktok --dry-run
```

YouTube `videos.insert` costs 1,600 of the default 10,000 quota units/day (about 6 uploads/day) until the audit raises it.

---

## 6. Go public (after audits)

Uploads are private/SELF_ONLY until each platform approves the app:
- **YouTube:** pass the API compliance audit (see `YOUTUBE_AUDIT_APPLICATION.md`), then set `youtube.privacy` to `public` (or `unlisted`).
- **TikTok:** pass the Content Posting audit (see `TIKTOK_AUDIT_SUBMISSION.md` for the paste-ready answers + demo shot list), then set `tiktok.privacy` to an allowed public level.

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
