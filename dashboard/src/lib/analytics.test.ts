import { describe, expect, test } from "bun:test";
import { engagementRate, tierFor, summarize, dayOfWeekBuckets, hashtagStats, type MediaItem } from "./analytics";

const reel: MediaItem = {
  id: "m1", media_type: "VIDEO", timestamp: "2026-06-05T14:00:00+0000",
  like_count: 50, comments_count: 6, caption: "hello #AISecurity #InfoSec", permalink: "",
  insights: { views: 1200, reach: 900, saved: 30, shares: 12, total_interactions: 98,
    ig_reels_avg_watch_time: 8200, ig_reels_video_view_total_time: 9840000 },
};
const img: MediaItem = {
  id: "m2", media_type: "CAROUSEL_ALBUM", timestamp: "2026-06-03T09:00:00+0000",
  like_count: 80, comments_count: 12, caption: "post #InfoSec", permalink: "",
  insights: { views: 600, reach: 0, saved: 10, shares: 2, total_interactions: 104 },
};

describe("engagementRate", () => {
  test("(likes+comments+saved+shares)/reach*100", () => {
    expect(engagementRate(reel)).toBeCloseTo(((50 + 6 + 30 + 12) / 900) * 100, 5);
  });
  test("falls back to views when reach is 0", () => {
    expect(engagementRate(img)).toBeCloseTo(((80 + 12 + 10 + 2) / 600) * 100, 5);
  });
  test("0 when both denominators are missing", () => {
    expect(engagementRate({ ...img, insights: {} })).toBe(0);
  });
});

describe("tierFor", () => {
  test(">=5 green, >=2 accent, else muted", () => {
    expect(tierFor(5)).toBe("green");
    expect(tierFor(2)).toBe("accent");
    expect(tierFor(1.9)).toBe("muted");
  });
});

describe("summarize", () => {
  test("averages and totals across posts", () => {
    const s = summarize([reel, img]);
    expect(s.avgLikes).toBe(65);
    expect(s.avgComments).toBe(9);
    expect(s.totalReelViews).toBe(1200); // VIDEO only
    expect(s.savesRate).toBeCloseTo((40 / 1500) * 100, 5); // saved sum / reach-or-views sum
  });
});

describe("dayOfWeekBuckets", () => {
  test("only buckets with >=1 post appear", () => {
    const b = dayOfWeekBuckets([reel, img]);
    expect(Object.keys(b).length).toBe(2);
  });
});

describe("hashtagStats", () => {
  test("only tags used 2+ times, case-insensitive", () => {
    const stats = hashtagStats([reel, img]);
    expect(stats.map((s) => s.tag)).toEqual(["#infosec"]);
    expect(stats[0].count).toBe(2);
  });
});
