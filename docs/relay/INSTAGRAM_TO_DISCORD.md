# Instagram → Discord relay

Posts a notification to Discord when an Instagram post is published (or when a caller supplies a normalized payload).

**Branch:** `feature/instagram-to-discord-relay`

## CLI

From `renderer/`:

```bash
bun run relay:discord -- --dry-run
bun run relay:discord -- --payload=scripts/relay/fixtures/instagram-discord-payload.json
```

| Flag | Purpose |
|------|---------|
| `--dry-run` | Print the exact `POST` URL, redacted headers, and JSON body; no network call |
| `--payload=` | JSON file with `permalink`, `caption`, optional `mediaPreviewUrl`, `mediaType`, `postId` |

## Environment

Set in `renderer/.env` (see `.env.example`). Never commit tokens.

| Variable | Purpose |
|----------|---------|
| `DISCORD_BOT_TOKEN` | Bot token for `POST /channels/{id}/messages` |
| `DISCORD_CHANNEL_ID` | Channel snowflake (e.g. `1522416855061495848`) |
| `DISCORD_GUILD_ID` | Optional guild/server id for ops docs (e.g. `150356208589602817`) |
| `DISCORD_WEBHOOK_URL` | Alternative to bot API — incoming webhook URL |

## Message shape

- Top-level `content`: Instagram permalink
- Embed: title, truncated caption (≤1500 chars), link, optional preview `image.url` (HTTPS, within Discord CDN limits)

## Code layout

| Path | Role |
|------|------|
| `renderer/scripts/relay/discord.ts` | Discord client + dry-run logging |
| `renderer/scripts/relay/format.ts` | Caption truncation + embed builder |
| `renderer/scripts/relay/config.ts` | Env loading (Zod) |
| `relay/run.ts` | Re-exports watch + Discord CLI helpers |
| `renderer/scripts/relay/discord-cli.ts` | Payload parse + orchestration |
| `renderer/scripts/relay-instagram-discord.mjs` | CLI entry |

## Tests

```bash
cd renderer && bun test scripts/relay
```

## Related

- Survey: `docs/relay/INSTAGRAM_TO_DISCORD_SURVEY.md`
- Inbound Meta webhooks (future): `dashboard/server/webhooks/meta.ts` per survey