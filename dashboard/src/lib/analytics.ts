export type MediaItem = {
  id: string; media_type: "VIDEO" | "IMAGE" | "CAROUSEL_ALBUM";
  timestamp: string; like_count: number; comments_count: number;
  caption: string; permalink: string;
  media_url?: string; thumbnail_url?: string;
  insights: Partial<Record<
    "views" | "reach" | "saved" | "shares" | "total_interactions" |
    "ig_reels_avg_watch_time" | "ig_reels_video_view_total_time", number>>;
};

export function denominator(m: MediaItem): number {
  return m.insights.reach || m.insights.views || 0;
}

export function engagementRate(m: MediaItem): number {
  const d = denominator(m);
  if (!d) return 0;
  return ((m.like_count + m.comments_count + (m.insights.saved ?? 0) + (m.insights.shares ?? 0)) / d) * 100;
}

export type Tier = "green" | "accent" | "muted";
export function tierFor(rate: number): Tier {
  return rate >= 5 ? "green" : rate >= 2 ? "accent" : "muted";
}

export function summarize(items: MediaItem[]) {
  const n = items.length || 1;
  const sum = (f: (m: MediaItem) => number) => items.reduce((a, m) => a + f(m), 0);
  const reachSum = sum(denominator);
  return {
    avgLikes: sum((m) => m.like_count) / n,
    avgComments: sum((m) => m.comments_count) / n,
    avgReach: sum((m) => m.insights.reach ?? 0) / n,
    avgSaves: sum((m) => m.insights.saved ?? 0) / n,
    avgEngagement: sum(engagementRate) / n,
    totalReelViews: sum((m) => (m.media_type === "VIDEO" ? m.insights.views ?? 0 : 0)),
    savesRate: reachSum ? (sum((m) => m.insights.saved ?? 0) / reachSum) * 100 : 0,
    sharesRate: reachSum ? (sum((m) => m.insights.shares ?? 0) / reachSum) * 100 : 0,
  };
}

export function reelWatchStats(items: MediaItem[]) {
  const reels = items.filter((m) => m.media_type === "VIDEO" && m.insights.ig_reels_avg_watch_time != null);
  if (!reels.length) return null;
  const best = [...reels].sort((a, b) =>
    (b.insights.ig_reels_avg_watch_time ?? 0) - (a.insights.ig_reels_avg_watch_time ?? 0))[0];
  return {
    avgWatchMs: reels.reduce((a, m) => a + (m.insights.ig_reels_avg_watch_time ?? 0), 0) / reels.length,
    totalWatchMs: reels.reduce((a, m) => a + (m.insights.ig_reels_video_view_total_time ?? 0), 0),
    totalViews: reels.reduce((a, m) => a + (m.insights.views ?? 0), 0),
    best,
  };
}

export function dayOfWeekBuckets(items: MediaItem[]): Record<string, { count: number; avgEngagement: number }> {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const out: Record<string, { count: number; avgEngagement: number }> = {};
  for (const m of items) {
    const d = days[new Date(m.timestamp).getDay()];
    const cur = out[d] ?? { count: 0, avgEngagement: 0 };
    cur.avgEngagement = (cur.avgEngagement * cur.count + engagementRate(m)) / (cur.count + 1);
    cur.count += 1;
    out[d] = cur;
  }
  return out;
}

export function hourBuckets(items: MediaItem[]): Record<string, { count: number; avgEngagement: number }> {
  const label = (h: number) => (h < 6 ? "00-06" : h < 12 ? "06-12" : h < 18 ? "12-18" : "18-24");
  const out: Record<string, { count: number; avgEngagement: number }> = {};
  for (const m of items) {
    const k = label(new Date(m.timestamp).getHours());
    const cur = out[k] ?? { count: 0, avgEngagement: 0 };
    cur.avgEngagement = (cur.avgEngagement * cur.count + engagementRate(m)) / (cur.count + 1);
    cur.count += 1;
    out[k] = cur;
  }
  return out;
}

export function hashtagStats(items: MediaItem[]): { tag: string; count: number; avgEngagement: number }[] {
  const map = new Map<string, { count: number; total: number }>();
  for (const m of items) {
    for (const raw of m.caption?.match(/#[\w]+/g) ?? []) {
      const tag = raw.toLowerCase();
      const cur = map.get(tag) ?? { count: 0, total: 0 };
      cur.count += 1; cur.total += engagementRate(m);
      map.set(tag, cur);
    }
  }
  return [...map.entries()]
    .filter(([, v]) => v.count >= 2)
    .map(([tag, v]) => ({ tag, count: v.count, avgEngagement: v.total / v.count }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement)
    .slice(0, 12);
}
