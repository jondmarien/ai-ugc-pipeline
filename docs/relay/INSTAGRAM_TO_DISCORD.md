# Instagram → Discord relay

Posts a notification to Discord when an Instagram post is published (poll-based detection or manual payload).

**Branch:** `feature/instagram-to-discord-relay`

## End-to-end (recommended)

From `renderer/`:

```bash
# One-shot: poll IG → post each new item to Discord → advance cursor
bun run relay -- --discord

# First deploy: set cursor to newest post without notifying
bun run relay -- --bootstrap --discord

# Verify wiring without network or state writes
bun run relay -- --dry-run --discord
```

**Polling:** There is no in-repo daemon. Schedule `bun run relay -- --discord` on an interval (e.g. Hermes `cronjob`, systemd timer, **5–15 minutes**). Shorter intervals increase Graph API usage; longer intervals delay Discord notifications.

**Failure / retry:**

- Instagram Graph errors fail the run; cursor is **not** advanced.
- Discord POST uses **3 attempts** with exponential backoff (1s, 2s) between tries.
- If Discord still fails, the run exits non-zero and the IG cursor is **not** updated (the post will retry on the next poll).
- Rate limits (HTTP 429) surface as Discord API errors in stderr.

## Standalone Discord CLI

```bash
bun run relay:discord -- --dry-run
bun run relay:discord -- --payload=scripts/relay/fixtures/instagram-discord-payload.json
```

| Flag | Purpose |
|------|---------|
| `--dry-run` | Print the exact `POST` URL, redacted headers, and JSON body; no network call |
| `--payload=` | JSON file with `permalink`, `caption`, optional `mediaPreviewUrl`, `mediaType`, `postId` |

## Environment

Copy `renderer/.env.example` → `renderer/.env`. Never commit tokens.

### Instagram (poll)

| Variable | Purpose |
|----------|---------|
| `IG_ACCESS_TOKEN` | Long-lived Page/user token |
| `IG_USER_ID` | Instagram Business account id |
| `META_APP_SECRET` or `IG_APP_SECRET` | `appsecret_proof` (recommended) |
| `IG_TARGET_USERNAME` | Default `chron0s_cyb3r_w0rld.ai` |

Alternative: `bun run publish:auth meta` → `renderer/.secrets/meta.json`.

### Discord

| Variable | Purpose |
|----------|---------|
| `DISCORD_BOT_TOKEN` | Bot token for `POST /channels/{id}/messages` |
| `DISCORD_CHANNEL_ID` | Channel snowflake — **1522416855061495848** |
| `DISCORD_GUILD_ID` | Server id for ops docs — **150356208589602817** |
| `DISCORD_WEBHOOK_URL` | Alternative to bot API |

Bot needs **Send Messages** and **Embed Links** in that channel.

## Message shape

- Top-level `content`: Instagram permalink
- Embed: title, truncated caption (≤1500 chars), link, optional preview `image.url` (HTTPS)

## Code layout

| Path | Role |
|------|------|
| `renderer/scripts/relay/pipeline.ts` | IG poll + Discord notify + retries |
| `renderer/scripts/relay/watch.ts` | Poll orchestration |
| `renderer/scripts/relay/discord.ts` | Discord client + dry-run logging |
| `renderer/scripts/relay/format.ts` | Caption truncation + embed builder |
| `renderer/scripts/relay/config.ts` | Env loading (Zod) |
| `renderer/scripts/relay.mjs` | CLI (`--discord` end-to-end) |
| `renderer/scripts/relay-instagram-discord.mjs` | Payload-only Discord CLI |

## Tests

```bash
cd renderer && bun test scripts/relay
```

## Manual verification checklist

1. Set `IG_*` and `DISCORD_*` in `renderer/.env`.
2. `bun run relay -- --bootstrap --discord` (once).
3. `bun run relay -- --dry-run --discord` — confirm stderr shows 0 new posts or a dry-run POST log.
4. Publish a test post on IG (or use stub in tests); run `bun run relay -- --discord` and confirm message in channel **1522416855061495848**.
5. Re-run relay — same post must **not** notify twice (cursor in `renderer/.relay/instagram-watch.json`).

## Related

- Detection: `docs/relay/INSTAGRAM_POST_DETECTION.md`
- Survey: `docs/relay/INSTAGRAM_TO_DISCORD_SURVEY.md`