# Content Dashboard — Design Spec

**Date:** 2026-06-07
**Status:** Approved by Jon (sections 1–4 approved interactively)
**Repo:** `ai-ugc-pipeline`

## Purpose

A real, daily-use local dashboard for running the `@chron0s_cyb3r_w0rld.ai` Instagram content
operation. It is a working tool first; it may later be the subject of a carousel post, but nothing
in this design is screenshot-driven. Inspired by the @tenfoldmarc "content dashboard" reference
carousel (8 JPGs in `Content Dashboard Plan Reference/`) and the companion walkthrough at
`go.tenfoldmarketing.com/contentdashboardwalkthrough`, adapted to this repo's stack, data, and
brand rules.

## Deliberate deviations from the reference

These are decisions, not omissions:

1. **No auto-posting.** The reference's Scheduler one-click-posts via Zernio MCP. This repo's
   non-negotiable is manual upload + human approval. Our Scheduler is a planning queue with a
   manual "mark posted" action. Nothing in the dashboard publishes to any platform.
2. **No competitor scraping.** Scheduled scraping of other accounts breaks IG ToS. The Competitor
   Tracker is a watchlist over the existing `/ingest-post` flow (Claude in Chrome, user-triggered);
   the dashboard reads the analysis docs that flow already writes to `pipeline/content/ingested/`.
3. **Not Next.js + shadcn, not the guide's single static HTML.** The repo is Bun + Vite + React and
   the chron0s design system primitives are React components. The dashboard is a Bun + Vite + React
   app inside the repo so the design system drops in unmodified.
4. **Token refresh is Bun + Windows Task Scheduler**, not the guide's Python + macOS cron.
5. **Dark chron0s brand**, not the reference's light terracotta or the guide's gold-on-navy
   palette.

## Prerequisites (user-owned)

- `@chron0s_cyb3r_w0rld.ai` is (or will be switched to) an IG Creator/Business account.
- Jon performs the Meta developer app setup per the walkthrough Step 1: create app, add
  Instagram product, add self as Instagram Tester, generate short-lived token, exchange for a
  60-day long-lived token, record `IG_ACCESS_TOKEN`, `IG_USER_ID`, `IG_APP_ID`, `IG_APP_SECRET`.
- Analytics is built and verified against recorded fixture data first, so this is not a blocker
  for any other module.

## Architecture

```
dashboard/
  server/          Bun HTTP server (port 4400)
    ig.ts          IG Graph API proxy. Token from .env, never sent to the browser.
    repo.ts        Read-only access to repo data: renderer/content/posts/*.json,
                   pipeline/renders/, pipeline/content/ingested/, CAPTION_BANK.md.
    trends.ts      RSS/Atom fetcher driven by an editable sources.json.
    store.ts       Local JSON state (reads/writes dashboard/data/ only).
  src/             Vite + React app
    design/        chron0s tokens + primitives, copied from the design system folder
                   ("chron0s_cyb3r_w0rld Design System" is the single upstream source).
    modules/       overview/ hooks/ analytics/ competitors/ scheduler/ calendar/ trending/
  data/            schedule.json, hooks-meta.json, sources.json,
                   ig-cache/, trends-cache/   (private caches gitignored)
  .env             IG credentials (gitignored)
scripts/
  refresh_token.ts  Token refresh; logs to token_refresh.log; scheduled via
                    Windows Task Scheduler every 58 days.
```

**Data flow is one-way.** Repo files and the IG API are read-only inputs. The dashboard writes
only to `dashboard/data/`. It never edits posts JSON, never touches `pipeline/`, never posts to
Instagram.

**Caching.** Every upstream response (IG, RSS) is cached to disk with a fetched-at timestamp.
The UI renders from cache instantly and refreshes on demand (sidebar Refresh button + per-module
refresh). The app is fully usable offline on cached data.

**IG proxy endpoints** (shape per the walkthrough, adjusted as the live API requires):

- `GET /api/ig/account` → id, username, biography, followers_count, media_count,
  profile_picture_url.
- `GET /api/ig/media` → last 50 posts with id, caption, media_type, timestamp, like_count,
  comments_count, media_url, thumbnail_url, permalink, plus per-post insights. Metrics are split
  by type because the API rejects mismatches: VIDEO uses reach, saved, views, shares,
  total_interactions, ig_reels_avg_watch_time, ig_reels_video_view_total_time; IMAGE and
  CAROUSEL_ALBUM use impressions, reach, saved, shares, total_interactions.
- `GET /api/repo/posts`, `/api/repo/renders`, `/api/repo/ingested`, `/api/trends`,
  `GET/PUT /api/state/<file>` for local state.

The walkthrough's exact field/metric names are treated as a starting point and verified against
the live API during implementation; the metric-splitting rule itself is a hard constraint.

**Run:** `bun run dash` from repo root starts server + Vite dev. Port 4400 avoids the renderer's
4317.

## Modules

**Overview.** Greeting bar (handle, follower count from IG cache), three stat cards (IG views 7d,
follower delta, posts rendered this week), four module summary cards (Hook Vault count + new this
week; Competitor watchlist + last ingest; Calendar next slots; Trending hook-worthy count).
Layout mirrors the reference overview slide.

**Hook Vault.** Aggregates hooks from three sources: cover-slide copy in posts JSON, ingested
analyses in `pipeline/content/ingested/`, and CAPTION_BANK entries. Row = hook text, source,
type tag (swap / build / claim / list / contrarian), times-used count. Search + filter by type
and source. "Use this" copies a prefilled `/draft-post <hook> | <pillar>` command to the
clipboard (the real pipeline entry point; replaces the reference's `/script`). User tags persist
in `hooks-meta.json`.

**Analytics.** The walkthrough's full feature set restyled to chron0s: profile bar; six summary
stat cards (avg likes, comments, reach, saves, engagement rate, total reel views); reel watch
time cards (avg watch time ms→s, total watch time ms→min, total views, best watch-time reel),
shown only when reel watch-time data exists; algorithm signals (saves rate = saves/reach,
shares rate = shares/reach, with the 2% / 1% benchmark notes); top 3 / bottom 3 performers;
engagement-over-time bars (last 20 posts, likes+comments); best day-of-week and time-bucket
charts (only buckets with ≥1 post); hashtag performance (only tags used 2+, max 12, sorted by
avg engagement); all-posts grid with sort pills (likes, comments, reach, engagement, saves,
views, recent), type badges, metric chips, engagement-tier pill, permalink out. Engagement
rate = (likes + comments + saves + shares) / reach × 100, reach for VIDEO with impressions
fallback for IMAGE/CAROUSEL. Tiers: ≥5% green, ≥2% accent, below muted. All computed
client-side from the cached payload.

**Competitor Tracker.** Watchlist of handles in local state. Per creator: ingested posts found in
`pipeline/content/ingested/` (parsed by handle), new-since-last-visit count, last-ingest date.
"Queue ingest" copies `/ingest-post <url>` to the clipboard. No scheduled scraping.

**Scheduler (posting queue).** Lists rendered packages from `pipeline/renders/` with their
caption files. Assign date, time, platforms (labels only). Statuses: queued → posted (manual
"mark posted") with skipped as an exit. State in `schedule.json`. Explicitly does not publish.

**Content Calendar.** Month grid from `schedule.json` plus posted packages (dates parsed from
`YYYY-MM-DD_slug` folder names). Slot click opens a side panel: full caption, sources file,
slide thumbnails from the render folder. Platform-colored slot chips like the reference.

**What's Trending.** Items from RSS/Atom sources in editable `sources.json`, cached with
recency sort. Manual tag per item: hook / explainer / skip (persisted). "Hook this" copies a
`/draft-post <headline> | <pillar>` command. Auto-tagging is explicitly deferred past v1.

## Visual design

The chron0s system is built for 1080px slides; the dashboard adapts it rather than copying it.

- **Surfaces:** `--bg #05070d` main, `--bg-deep` page, panels `rgba(2,6,23,.78)` with 1px
  `--hairline` borders, 28px panel radii, 999px chips. Flat, shadow-free; glow only on focal
  numbers.
- **Type:** Archivo 700/800 for page titles and large stat numbers; Inter 400–600 body;
  JetBrains Mono 500 uppercase wide-tracked for kickers, nav, metadata, chips.
- **Layout:** fixed left sidebar (BrandMark top, mono-caps nav with accent active state,
  Refresh + data-age + token-age at bottom), scrollable main pane. Stat cards carry the accent
  hairline top edge like slides.
- **Accents: per-module theme scopes** (approved): Overview + Analytics `theme-defensive` blue,
  Competitor Tracker `theme-offensive` red, Hook Vault `theme-hacking` green, What's Trending
  `theme-ai` orange, Scheduler + Calendar `theme-purple-team`. Sidebar nav items preview their
  module's accent.
- **Charts:** custom minimal bars/sparklines in the module accent on transparent backgrounds.
  No chart-library default styling.
- **Motion:** slow cinematic only; hover lifts to accent, soft `cubic-bezier(0.22,0.61,0.36,1)`,
  no bounce/spin.
- **Copy rules apply to UI chrome:** no em-dashes, no sentence fragments where a sentence is
  expected, no AI vocabulary, mono-caps for metadata.
- Build-time design passes: `impeccable` + `design-taste-frontend` for hierarchy and interaction
  polish, `huashu-design` for hi-fi iteration and an expert review. The design system is the
  override authority when guidance conflicts.

## Error handling

- Every module renders fully from cache when its upstream fails, with a mono-caps staleness
  banner (e.g. `IG DATA · CACHED 14H AGO`).
- Expired token → one-line fix instruction (run `scripts/refresh_token.ts`), not a stack trace.
  Sidebar shows token age continuously.
- IG metric-mismatch errors are prevented structurally by type-splitting in the proxy.
- Missing repo data (no renders, empty ingested folder, no posts) → designed empty states.
- Dead RSS sources are skipped and flagged in the source list, never fatal.
- The server returns `{ data: <cache>, error: <string> }` on upstream failure; it does not crash.

## Ops

- Secrets in `dashboard/.env`, gitignored. Private caches gitignored.
- `scripts/refresh_token.ts` refreshes the long-lived token, rewrites `.env`, appends to
  `token_refresh.log`; registered in Windows Task Scheduler at a 58-day interval.
- `bun run dash` is the single entry point.

## Testing

- `bun test` unit tests on pure logic: engagement formula, metric splitting, hook aggregation,
  schedule state transitions, RSS parsing.
- IG proxy tested against recorded fixture responses; no live calls in tests.
- Playwright screenshot pass per module against fixture data (doubles as future carousel
  screenshot material).
- Final gate: verification-before-completion with the dev server running.

## Out of scope (v1)

Auto-posting of any kind; scheduled competitor scraping; trending auto-tagging; YouTube/TikTok
tabs; Slack/notification digests; multi-user anything.
