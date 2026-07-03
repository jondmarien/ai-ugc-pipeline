# Instagram → Discord relay — repo survey (prep)

**Branch:** `feature/instagram-to-discord-relay`  
**Base:** `main` @ `99e3087` (pulled 2026-07-02)  
**Purpose:** Map existing Instagram/Meta, publishing, webhooks, scheduling, and env patterns so new relay code lands in the right place.

---

## Executive summary

| Area | Status in repo |
|------|----------------|
| **Discord** | No first-party integration (no bot, webhook client, or gateway code). |
| **Instagram / Meta** | Mature: Graph API publish adapters, dashboard proxy, token refresh, comments API. |
| **Webhooks (inbound)** | Meta product enables webhooks in the Dev Portal, but **no webhook HTTP handler** exists in this repo yet. |
| **Webhooks (outbound)** | Only **Vercel** `website/api/publish-temp*.ts` (bearer `PUBLISH_TEMP_SECRET`) for temporary public media URLs during IG publish. |
| **Cron / workers** | No in-repo cron daemon. **Bun CLIs** (`publish`, `pipeline`, `scripts/refresh_token.ts`) + optional **OS scheduler** (dashboard spec: Windows Task Scheduler for IG token refresh). **Hermes `cronjob`** on the VPS is a valid host for a long-running relay worker if the feature lives outside this repo. |
| **Config** | Root `publish.config.json` (Zod in `renderer/scripts/publish/config.ts`); per-app `.env` under `renderer/` and `dashboard/`. |

---

## Where new relay code should live

Recommended layout (follows existing publish + dashboard patterns):

1. **`renderer/scripts/relay/`** (or top-level **`scripts/relay/`** if the worker must run without the renderer package)
   - **`discord.ts`** — post to Discord via **webhook URL** (simplest) or Bot token + channel ID.
   - **`instagram-events.ts`** — normalize IG/Meta payloads (comment, mention, messaging) into a small internal event type.
   - **`run.mjs` / `run.ts`** — CLI entry: `bun run relay --` with injectable deps for tests (mirror `publish/run.ts`).

2. **Inbound Meta webhooks** (if relay is push-based, not poll-based):
   - **`dashboard/server/webhooks/meta.ts`** — verify `X-Hub-Signature-256`, route to relay handler; register route in `dashboard/server/index.ts`.
   - **Alternative:** small **Vercel serverless** route under `website/api/meta-webhook.ts` if the public URL must be stable on `aiugc.chron0.tech` (same project as `publish-temp`).

3. **Do not** fold Discord into `renderer/scripts/publish/adapters/` unless the relay is literally “publish render package to Discord.” That directory is for **outbound platform publish** of `pipeline/renders/<key>/` artifacts with `publish.state.json` idempotency.

4. **Docs:** extend this file or add `docs/relay/INSTAGRAM_TO_DISCORD.md` when the design is fixed; link from `docs/publishing/META_INTEGRATION_SPEC.md` if webhooks are shared with publish.

---

## Instagram / Meta — existing touchpoints

| Layer | Path | Role |
|-------|------|------|
| Publish adapters | `renderer/scripts/publish/adapters/instagram.ts`, `facebook.ts` | Graph API Reels/carousel + Page video; uses `temp-hosting.ts` → Vercel Blob |
| Publish auth | `renderer/scripts/publish/auth/meta.ts` | OAuth, Page/IG IDs, `appsecret_proof`, secrets in `renderer/.secrets/meta.json` |
| Publish orchestration | `renderer/scripts/publish/run.ts`, `publish.mjs` | Gated on post status `generated`; adapters map in `ADAPTERS` |
| Temp public URLs | `website/api/publish-temp.ts`, `publish-temp-delete.ts` | Bearer `PUBLISH_TEMP_SECRET`; Vercel `BLOB_READ_WRITE_TOKEN` on deploy |
| Dashboard IG proxy | `dashboard/server/ig.ts` | Server-side Graph calls; token from env, never sent to browser |
| Dashboard Meta UI/API | `dashboard/server/meta.ts`, `meta_auth.ts`, `src/modules/meta/Meta.tsx` | Page/IG account wiring for dashboard |
| Comments | `dashboard/server/comments.ts`, `src/modules/comments/Comments.tsx` | `instagram_manage_comments` scope |
| Token refresh | `scripts/refresh_token.ts` | Rewrites `dashboard/.env` `IG_ACCESS_TOKEN`; logs to `dashboard/token_refresh.log` |
| Specs | `docs/publishing/META_INTEGRATION_SPEC.md`, `META_AUDIT_SUBMISSION.md`, `PUBLISHING.md` | OAuth pitfalls, scopes, temp hosting |

**Polling alternative:** relay could call existing dashboard APIs (`/api/ig/*`, `/api/meta/*`, comments endpoints) on an interval instead of Meta webhooks — reuse `IG_ACCESS_TOKEN` / Page token patterns from `dashboard/.env` and `renderer/.secrets/meta.json` (avoid duplicating auth).

---

## Discord — greenfield

- Add env vars (suggested names, not yet in `.env.example`):
  - `DISCORD_WEBHOOK_URL` — channel webhook (no bot setup), **or**
  - `DISCORD_BOT_TOKEN` + `DISCORD_CHANNEL_ID`
- Optional: `DISCORD_RELAY_ENABLED=true`, `META_WEBHOOK_VERIFY_TOKEN`, `META_APP_SECRET` (for signature verification; may duplicate `META_APP_SECRET` in `renderer/.env`).

No Discord dependencies in root `package.json` / `renderer/package.json` today; prefer `fetch` in Bun or a minimal client.

---

## Credentials / env vars already expected

### `renderer/.env` (see `docs/publishing/PUBLISHING.md`; example file may lag `main`)

| Variable | Used for |
|----------|----------|
| `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET` | YouTube OAuth |
| `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` | TikTok OAuth |
| `META_APP_ID`, `META_APP_SECRET` | Meta OAuth + `appsecret_proof` |
| `PUBLISH_TEMP_SECRET` | Upload/delete temp media on Vercel (`publish-temp` APIs) |
| `XAI_API_KEY` | Optional cloud image/video (adapter docs) |

Tokens on disk: `renderer/.secrets/youtube.json`, `tiktok.json`, `meta.json` (gitignored).

### `dashboard/.env` (see `dashboard/.env.example`)

| Variable | Used for |
|----------|----------|
| `IG_ACCESS_TOKEN`, `IG_USER_ID`, `IG_APP_ID`, `IG_APP_SECRET` | Dashboard IG Graph proxy + refresh script |

### Root `publish.config.json`

Platforms: `youtube`, `tiktok`, `facebook`, `instagram` — enable flags and privacy/postType; **no `discord` key** until product needs publish-style gating.

---

## Scheduling / workers pattern

- **Human-gated publish:** `cd renderer && bun run publish -- <post_key> --platforms=... --yes`
- **Full render + optional publish:** `renderer/scripts/pipeline.mjs` (`--publish=`)
- **IG long-lived token maintenance:** `bun scripts/refresh_token.ts` (from repo root); schedule externally
- **Dashboard dev server:** `dashboard/scripts/dash.ts` — not a production worker

For an **Instagram → Discord relay**, typical ops choices:

1. **Hermes cron** on VPS (matches Jon's agent stack): no-agent script or short agent tick calling `bun run relay`.
2. **systemd timer** on the same host as the repo clone.
3. **Meta webhook** → HTTPS endpoint on Vercel or dashboard behind Tailscale — event-driven, no poll.

---

## Child kanban tasks (downstream)

This branch was opened to unblock sibling cards on board `ai-ugc-pipeline`: implementation, config, and tests should reference paths above and reuse Meta secrets from `renderer/.secrets/meta.json` or dashboard IG env — **do not** invent a third token store without reason.

---

## PR draft note (for reviewers)

> Prep only: synced `main`, created `feature/instagram-to-discord-relay`, added `docs/relay/INSTAGRAM_TO_DISCORD_SURVEY.md`. No runtime behavior change. Next PR should add relay module + env.example entries + optional Meta webhook route and document deployment URL + verify token.