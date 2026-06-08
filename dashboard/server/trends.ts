import { XMLParser } from "fast-xml-parser";
import { TRENDS_CACHE_DIR } from "./paths";
import { readState } from "./store";
import { fetchWithCache } from "./ig"; // generic cache helper, reused

export type TrendItem = { title: string; url: string; publishedAt: number; sourceLabel: string };
export type SourceEntry = { url: string; label: string; enabled: boolean };

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
const asArray = <T>(x: T | T[] | undefined): T[] => (x == null ? [] : Array.isArray(x) ? x : [x]);

export function parseFeed(xml: string, sourceLabel: string): TrendItem[] {
  let doc: any;
  try { doc = parser.parse(xml); } catch { return []; }
  const out: TrendItem[] = [];
  for (const it of asArray(doc?.rss?.channel?.item)) {
    out.push({ title: String(it.title ?? ""), url: String(it.link ?? ""),
      publishedAt: Date.parse(it.pubDate ?? "") || 0, sourceLabel });
  }
  for (const e of asArray(doc?.feed?.entry)) {
    const link = asArray(e.link).find((l: any) => l["@_href"]) as any;
    out.push({ title: typeof e.title === "object" ? e.title["#text"] ?? "" : String(e.title ?? ""),
      url: link?.["@_href"] ?? "", publishedAt: Date.parse(e.updated ?? e.published ?? "") || 0, sourceLabel });
  }
  return out.filter((i) => i.title && i.url);
}

export async function getTrends(force = false) {
  const sources = (readState("sources.json") as SourceEntry[]).filter((s) => s.enabled);
  return fetchWithCache("trends", async () => {
    const results = await Promise.allSettled(sources.map(async (s) => {
      const res = await fetch(s.url, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return parseFeed(await res.text(), s.label);
    }));
    const items = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
    const deadSources = sources
      .filter((_, i) => results[i].status === "rejected")
      .map((s) => s.label);
    items.sort((a, b) => b.publishedAt - a.publishedAt);
    return { items, deadSources };
  }, TRENDS_CACHE_DIR, { maxAgeMs: 3_600_000, force }); // trends go stale faster: 1h
}
