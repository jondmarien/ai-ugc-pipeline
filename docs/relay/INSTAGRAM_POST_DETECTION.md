# Instagram new-post detection

Polls the **Instagram Graph API** for new media on the linked business account and emits a structured `instagram.new_post` payload (one JSON line per post on stdout). Cursor state lives in `renderer/.relay/instagram-watch.json` so the same post never notifies twice.

**Target account:** `@chron0s_cyb3r_w0rld.ai` (override with `IG_TARGET_USERNAME`).

## CLI

```bash
cd renderer
bun run relay --              # poll, emit new posts, update cursor
bun run relay -- --bootstrap  # set cursor to newest post without emitting
bun run relay -- --dry-run    # no state write; stderr shows what would emit
```

Schedule via Hermes cron, systemd timer, or manual runs (see `docs/relay/INSTAGRAM_TO_DISCORD_SURVEY.md`).

## Meta app permissions

| Permission | Why |
|------------|-----|
| `instagram_basic` | Read profile + media list (`GET /{ig-user-id}/media`) |
| `pages_show_list` | Resolve Page linked to IG (publish:auth flow) |
| `pages_read_engagement` | Typical companion scope for Page token |

Publishing scopes (`instagram_content_publish`, etc.) are **not** required for read-only detection.

Optional later: `instagram_manage_insights` only if you extend detection with insights metrics (dashboard pattern).

## Environment variables

| Variable | Required | Source |
|----------|----------|--------|
| `IG_ACCESS_TOKEN` | Yes* | `dashboard/.env` long-lived user/page token |
| `IG_USER_ID` | Yes* | Instagram Business account id (numeric) |
| `META_APP_SECRET` or `IG_APP_SECRET` | Recommended | App Dashboard → Settings → Basic; enables `appsecret_proof` |
| `IG_APP_ID` | For token refresh | Same as Meta app id |
| `IG_TARGET_USERNAME` | No | Default `chron0s_cyb3r_w0rld.ai` — verified against Graph `username` |

\*Alternative: run `bun run publish:auth meta` in `renderer/` so `renderer/.secrets/meta.json` holds `page_access_token` and `ig_user_id` (same store as publish adapters).

Do **not** create a third token file; reuse dashboard env or `meta.json`.

## Downstream notification shape

```json
{
  "event": "instagram.new_post",
  "igUserId": "178414…",
  "username": "chron0s_cyb3r_w0rld.ai",
  "mediaId": "1810…",
  "postUrl": "https://www.instagram.com/reel/…/",
  "caption": "…",
  "mediaType": "VIDEO",
  "mediaLinks": ["https://…"],
  "postedAt": "2026-07-02T09:00:00+0000",
  "detectedAt": 1783044000000
}
```

Programmatic hook: import `runInstagramWatch` from `renderer/scripts/relay/watch.ts` and pass `onNewPost`.

## Module layout

| File | Role |
|------|------|
| `renderer/scripts/relay/watch.ts` | Poll orchestration |
| `renderer/scripts/relay/detect.ts` | Cursor diff + normalization |
| `renderer/scripts/relay/graph.ts` | Graph GET + credentials |
| `renderer/scripts/relay/state.ts` | `instagram-watch.json` |
| `renderer/scripts/relay/detect.test.ts` | Stub feed acceptance tests |

## Webhooks (future)

Meta webhooks can replace polling; this repo has no inbound Meta webhook handler yet (`dashboard/server/webhooks/meta.ts` per survey). Detection module stays usable as the normalizer for either poll or push.