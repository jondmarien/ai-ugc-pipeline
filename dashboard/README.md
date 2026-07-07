<div align="center">

# 📊 dashboard/

### The ops console: analytics, comment moderation, scheduling, and content intel for the pipeline

React 19 · Vite · TanStack Query · Recharts · a single **`Bun.serve()`** backend (port 4400, no framework)

[Quick start](#-quick-start) · [Screens](#-screens) · [Architecture](#-architecture) · [API](#-api-routes) · [Credentials](#-credentials) · [Tests](#-tests)

</div>

---

A standalone app (its own `bun install`, separate from `renderer/`) for working with posts and Instagram/Meta data day to day. It reads and writes the pipeline's **output** — rendered packages, publish state, cached Graph API data — and it **never drafts, renders, or publishes content itself**. The Scheduler tab is planning-only by design.

## ⚡ Quick start

```bash
cd dashboard
bun install

bun run dev        # Vite dev server (frontend only)
bun run server     # Bun API server on :4400

# or, from the repo root — both at once, killed together on Ctrl+C:
bun run dash
```

## 🖥️ Screens

One module per folder under `src/modules/`:

| Tab | Module | What you do there |
| --- | --- | --- |
| **Overview** | `overview/` | Landing view: 7-day IG views, avg engagement, posts rendered this week, hook-vault size, watchlist size, queued slots, hook-worthy trend count. |
| **Analytics** | `analytics/` | Deep IG performance: engagement rate, reel watch time, saves/shares benchmarks, best day/time charts, hashtag stats, top/bottom posts, sortable full grid. |
| **Hook Vault** | `hooks/` | Searchable hook library aggregated from posts + ingested analyses + the caption bank; tag hook types, copy a ready-to-run `/draft-post` command. |
| **Competitors** | `competitors/` | Watchlist of creator handles + grouped `ig-ingest` analyses (from `pipeline/content/ingested/`); one-click copy of `/ingest-post <url>`. |
| **Scheduler** | `scheduler/` | **Planning-only** posting queue: pick a rendered package, set date/time/platforms, mark posted/skipped. Writes `data/schedule.json`, publishes nothing. |
| **Calendar** | `calendar/` | Month grid merging scheduled items with rendered-but-unscheduled packages, colour-coded by platform; click a slot to load caption/sources/thumbnails. |
| **What's Trending** | `trending/` | RSS/Atom feed reader (sources in `data/sources.json`); tag items hook/explainer/skip, copy a `/draft-post` command. |
| **Comments** | `comments/` | Instagram comment moderation: list, hide/unhide, delete, reply, **like/unlike**. |
| **Meta** | `meta/` | Published-post analytics across Facebook + Instagram — joins `publish.state.json` with live Graph API insights (reach chart, per-post cards with AI-disclosure badges). |

## 🏗️ Architecture

```
┌─ Browser ────────────────────────────────────────────────┐
│  React 19 + Vite · TanStack Query · Recharts             │
│  src/modules/<tab>/  — one component per screen          │
└───────────────────────────┬──────────────────────────────┘
                            │ /api/*  ({data, error, fetchedAt};  ?refresh=1 busts cache)
┌─ server/ (Bun.serve, :4400, manual URL routing) ─────────┐
│  index.ts     route table                                 │
│  ig.ts        IG Graph API client + fetchWithCache (6 h)  │
│  meta.ts      publish.state.json ⋈ live Graph insights    │
│  meta_auth.ts token accessor + appsecret_proof HMAC       │
│  comments.ts  moderation (hide/delete/reply/like)         │
│  hooks.ts     pure hook aggregation (no network)          │
│  repo.ts      reads posts + render packages off disk      │
│  trends.ts    parallel RSS/Atom fetch (1 h cache)         │
│  store.ts     allowlisted JSON k/v (3 files)              │
│  paths.ts     every external path, in one place           │
└──────┬─────────────────────┬─────────────────────┬────────┘
       ▼                     ▼                     ▼
 renderer/.secrets/    renderer/content/posts/   dashboard/data/
 meta.json (shared     pipeline/renders/         schedule.json ·
 Meta OAuth token)     pipeline/content/ingested/ sources.json ·
                                                  *-cache/ (gitignored)
```

The dashboard lives in its own folder but reads the renderer/pipeline's world directly off disk — `server/paths.ts` is the single source of truth for every path it touches.

## 🔌 API routes

All wrapped `{ data, error, fetchedAt }`; append `?refresh=1` to bypass the disk cache.

| Route | What |
| --- | --- |
| `GET /api/health` | Liveness. |
| `GET /api/ig/account` · `/api/ig/media` · `/api/ig/token-age` | Instagram account, media list, and token freshness via the Graph API (6 h disk cache). |
| `GET /api/repo/posts` · `/renders` · `/ingested` · `/hooks` | Post JSON, render packages, ingested analyses, and the aggregated hook list, read off disk. Package file reads (caption/sources/slide PNGs) are path-traversal-guarded. |
| `GET /api/meta/published` · `/api/meta/insights` | Published FB/IG posts from `publish.state.json`, joined with live insight metrics. |
| `GET /api/trends` | Parsed RSS/Atom items from every source (parallel, 10 s timeout, dead-source reporting). |
| `GET/POST/DELETE /api/comments/*` | List, hide/unhide, delete, reply, like/unlike (`POST`/`DELETE /api/comments/:id/like`). |
| `GET/PUT /api/state/:name` | Generic JSON state, gated by an allowlist (`schedule.json`, `hooks-meta.json`, `sources.json`). |

## 🔑 Credentials

**Shared with the renderer — this is not a second app registration.** Absent an explicit `IG_ACCESS_TOKEN`/`IG_USER_ID` override, the dashboard reads the same `renderer/.secrets/meta.json` that `bun run publish:auth meta` writes. `META_APP_SECRET` is required for the `appsecret_proof` HMAC on every Graph call.

The comment like/unlike feature needed **no new OAuth flow**: `/{ig-user-id}/likes` is part of the same classic Instagram Graph API and only required adding the `instagram_manage_engagement` scope to the existing shared Meta token. Token liveness is checked via `/debug_token` (Page tokens don't rotate like YouTube/TikTok refresh tokens); `scripts/refresh_token.ts` at the repo root re-exchanges it every 58 days on a schedule.

## 💾 Data

Only two files in `data/` are hand-edited source of truth and checked in: `schedule.json` (the scheduler queue) and `sources.json` (trend feeds). `ig-cache/`, `trends-cache/`, and `meta-cache/` are runtime-generated, gitignored disk caches.

## 🧪 Tests

```bash
bun run test   # bun test server src — unit tests; most server modules have a paired .test.ts
bun run e2e    # Playwright: meta.spec.ts (stubbed insights + the "META NOT CONNECTED YET"
               # empty state) and screenshots.spec.ts (clicks every tab, screenshots to e2e/shots/)
bun run lint   # Biome
```
