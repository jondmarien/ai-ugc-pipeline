import { describe, expect, test, beforeEach } from "bun:test";
import path from "node:path";
import fs from "node:fs";
import { metricsFor, parseInsights, fetchWithCache } from "./ig";

const fx = path.join(import.meta.dir, "fixtures", "ig");
const tmpCache = path.join(import.meta.dir, "fixtures", "tmp-ig-cache");
beforeEach(() => fs.rmSync(tmpCache, { recursive: true, force: true }));

describe("metricsFor", () => {
  test("VIDEO gets reel metrics, never impressions/plays", () => {
    const m = metricsFor("VIDEO");
    expect(m).toContain("ig_reels_avg_watch_time");
    expect(m).toContain("views");
    expect(m).not.toContain("impressions");
    expect(m).not.toContain("plays");
  });
  test("IMAGE and CAROUSEL_ALBUM get feed metrics WITHOUT views (unsupported, 400s)", () => {
    for (const t of ["IMAGE", "CAROUSEL_ALBUM"] as const) {
      const m = metricsFor(t);
      expect(m).toEqual(["reach", "saved", "shares", "total_interactions"]);
      expect(m).not.toContain("views");
    }
  });
});

describe("parseInsights", () => {
  test("flattens Graph insights array to a record", () => {
    const raw = JSON.parse(fs.readFileSync(path.join(fx, "insights-video.json"), "utf8"));
    const r = parseInsights(raw);
    expect(r.views).toBe(1200);
    expect(r.ig_reels_avg_watch_time).toBe(8200);
  });
});

describe("fetchWithCache", () => {
  test("serves fresh cache WITHOUT calling upstream (cache-first)", async () => {
    let calls = 0;
    const fetcher = async () => { calls++; return { ok: calls }; };
    const a = await fetchWithCache("k", fetcher, tmpCache);
    const b = await fetchWithCache("k", fetcher, tmpCache);
    expect(calls).toBe(1);
    expect(b.data).toEqual({ ok: 1 });
    expect(b.fetchedAt).toBe(a.fetchedAt);
  });
  test("force bypasses fresh cache", async () => {
    let calls = 0;
    const fetcher = async () => { calls++; return { ok: calls }; };
    await fetchWithCache("k2", fetcher, tmpCache);
    const b = await fetchWithCache("k2", fetcher, tmpCache, { force: true });
    expect(calls).toBe(2);
    expect(b.data).toEqual({ ok: 2 });
  });
  test("stale cache triggers refetch", async () => {
    let calls = 0;
    const fetcher = async () => { calls++; return { ok: calls }; };
    await fetchWithCache("k3", fetcher, tmpCache, { maxAgeMs: -1 });
    await fetchWithCache("k3", fetcher, tmpCache, { maxAgeMs: -1 });
    expect(calls).toBe(2);
  });
  test("serves stale cache with error when upstream fails", async () => {
    let calls = 0;
    const fetcher = async () => { calls++; if (calls > 1) throw new Error("down"); return { ok: 1 }; };
    const a = await fetchWithCache("k4", fetcher, tmpCache);
    const b = await fetchWithCache("k4", fetcher, tmpCache, { force: true });
    expect(b.data).toEqual({ ok: 1 });
    expect(b.error).toContain("down");
    expect(b.fetchedAt).toBe(a.fetchedAt);
  });
  test("failure with no cache returns null data + error", async () => {
    const r = await fetchWithCache("missing", async () => { throw new Error("nope"); }, tmpCache);
    expect(r.data).toBeNull();
    expect(r.error).toContain("nope");
  });
});
