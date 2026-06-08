import fs from "node:fs";
import path from "node:path";
import { IG_CACHE_DIR } from "./paths";

const GRAPH = "https://graph.facebook.com/v23.0";

export type MediaType = "VIDEO" | "IMAGE" | "CAROUSEL_ALBUM";

const REEL_METRICS = ["views", "reach", "saved", "shares", "total_interactions",
  "ig_reels_avg_watch_time", "ig_reels_video_view_total_time"];
const FEED_METRICS = ["views", "reach", "saved", "shares", "total_interactions"];

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
      } catch { /* per-post insights can fail (e.g. very old media); keep the post */ }
      items.push({ ...m, insights });
    }
    return items;
  }, undefined, { force });
}
