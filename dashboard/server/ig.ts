import fs from "node:fs";
import path from "node:path";
import { IG_CACHE_DIR } from "./paths";

const GRAPH = "https://graph.facebook.com/v23.0";

export type MediaType = "VIDEO" | "IMAGE" | "CAROUSEL_ALBUM";

// VIDEO (Reels) supports `views` + reel watch-time metrics.
const REEL_METRICS = ["views", "reach", "saved", "shares", "total_interactions",
  "ig_reels_avg_watch_time", "ig_reels_video_view_total_time"];
// IMAGE / CAROUSEL_ALBUM do NOT support `views`: requesting it returns
// HTTP 400 (#100) "does not support the views metric for this media product type"
// (Meta scopes `views` to FEED/STORY/REELS; confirmed by Airbyte source PR #72266
// canary reverts for CAROUSEL_ALBUM and IMAGE). The insights call is all-or-nothing,
// so including `views` here would 400 the whole request and zero out every carousel.
const FEED_METRICS = ["reach", "saved", "shares", "total_interactions"];
// Bedrock metrics supported by every media type; fallback if a richer request 400s.
const SAFE_METRICS = ["reach", "saved"];

export function metricsFor(type: MediaType): string[] {
  return type === "VIDEO" ? [...REEL_METRICS] : [...FEED_METRICS];
}

export function parseInsights(raw: { data?: { name: string; values?: { value: number }[] }[] }): Record<string, number> {
  const out: Record<string, number> = {};
  for (const m of raw.data ?? []) out[m.name] = m.values?.[0]?.value ?? 0;
  return out;
}

type Cached<T> = { data: T | null; error: string | null; fetchedAt: number | null };
export type CacheOpts = { maxAgeMs?: number; force?: boolean };
const DEFAULT_MAX_AGE_MS = 6 * 3_600_000; // IG data: 6h is plenty for a daily-use tool

/**
 * Cache-first (per spec "the UI renders from cache instantly and refreshes on demand"):
 * fresh cache is served WITHOUT touching upstream; `force` (the Refresh button) and
 * staleness trigger a refetch; a failed refetch falls back to stale cache + error.
 */
export async function fetchWithCache<T>(
  key: string, fetcher: () => Promise<T>, dir: string = IG_CACHE_DIR, opts: CacheOpts = {},
): Promise<Cached<T>> {
  const { maxAgeMs = DEFAULT_MAX_AGE_MS, force = false } = opts;
  const file = path.join(dir, `${key}.json`);
  const cached = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
  if (cached && !force && Date.now() - cached.fetchedAt <= maxAgeMs) {
    return { data: cached.data, error: null, fetchedAt: cached.fetchedAt };
  }
  try {
    const data = await fetcher();
    const fetchedAt = Date.now();
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify({ fetchedAt, data }));
    return { data, error: null, fetchedAt };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    if (cached) return { data: cached.data, error, fetchedAt: cached.fetchedAt };
    return { data: null, error, fetchedAt: null };
  }
}

function token(): string {
  const t = process.env.IG_ACCESS_TOKEN;
  if (!t) throw new Error("IG_ACCESS_TOKEN missing. Copy .env.example to dashboard/.env and fill it in.");
  return t;
}

async function graphGet(pathAndQuery: string): Promise<any> {
  const sep = pathAndQuery.includes("?") ? "&" : "?";
  const res = await fetch(`${GRAPH}${pathAndQuery}${sep}access_token=${token()}`);
  const body = await res.json();
  if (!res.ok || body.error) {
    const msg = body?.error?.message ?? `HTTP ${res.status}`;
    if (/expired|invalid/i.test(msg) || body?.error?.code === 190) {
      throw new Error(`IG token expired or invalid. Fix: bun scripts/refresh_token.ts (repo root). [${msg}]`);
    }
    throw new Error(`IG API: ${msg}`);
  }
  return body;
}

export async function getAccount(force = false) {
  const id = process.env.IG_USER_ID;
  return fetchWithCache("account", () =>
    graphGet(`/${id}?fields=id,username,biography,followers_count,media_count,profile_picture_url`),
    undefined, { force });
}

export async function getMedia(force = false) {
  const id = process.env.IG_USER_ID;
  return fetchWithCache("media", async () => {
    const media = await graphGet(
      `/${id}/media?limit=50&fields=id,caption,media_type,timestamp,like_count,comments_count,media_url,thumbnail_url,permalink`);
    const items = [];
    for (const m of media.data ?? []) {
      let insights: Record<string, number> = {};
      try {
        insights = parseInsights(await graphGet(`/${m.id}/insights?metric=${metricsFor(m.media_type).join(",")}`));
      } catch {
        // The insights call is all-or-nothing: one unsupported metric 400s the whole
        // request. Retry once with the bedrock set so a single mismatch (e.g. a legacy
        // feed video) still yields reach/saved rather than zeroing the post out.
        try {
          insights = parseInsights(await graphGet(`/${m.id}/insights?metric=${SAFE_METRICS.join(",")}`));
        } catch { /* very old / insights-unavailable media: keep the post, empty insights */ }
      }
      items.push({ ...m, insights });
    }
    return items;
  }, undefined, { force });
}
