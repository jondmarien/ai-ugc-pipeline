import { test, expect } from "bun:test";
import { buildInstagramCaption, shapeInstagramResult, makeInstagramAdapter } from "./instagram";
import type { RenderPackage } from "../types";

const pkg: RenderPackage = {
  key: "2026-06-11_bluehammer-cve-2026-33825",
  dir: "/renders/2026-06-11_bluehammer-cve-2026-33825",
  reelPath: "/renders/2026-06-11_bluehammer-cve-2026-33825/2026-06-11_bluehammer-cve-2026-33825_reel.mp4",
  post: { post_id: "2026-06-11_bluehammer-cve-2026-33825", caption: "BlueHammer.", hashtags: ["BlueHammer"] },
};

test("buildInstagramCaption appends hashtags and does not truncate short captions", () => {
  const { caption, truncated } = buildInstagramCaption(pkg.post);
  expect(caption).toContain("BlueHammer.");
  expect(caption).toContain("#BlueHammer");
  expect(truncated).toBe(false);
});

test("buildInstagramCaption truncates at 2200 chars and caps hashtags at 30", () => {
  const longPost = { caption: "x".repeat(2500), hashtags: Array.from({ length: 40 }, (_, i) => `tag${i}`) };
  const { caption, truncated } = buildInstagramCaption(longPost);
  expect(caption.length).toBe(2200);
  expect(truncated).toBe(true);
});

test("shapeInstagramResult maps a published media id to a reel URL", () => {
  const r = shapeInstagramResult("17999999999999999");
  expect(r.platform).toBe("instagram");
  expect(r.status).toBe("published");
  expect(r.url).toBe("https://www.instagram.com/reel/17999999999999999/");
});

test("mode: manual returns the original checklist and never claims a publish", async () => {
  const adapter = makeInstagramAdapter({
    loadConfig: () => ({ enabled: true, mode: "manual" }),
    getCredentials: async () => { throw new Error("should not be called in manual mode"); },
    fetchImpl: (async () => { throw new Error("should not be called in manual mode"); }) as unknown as typeof fetch,
    uploadTemp: async () => { throw new Error("should not be called in manual mode"); },
  });
  const r = await adapter.publish(pkg, {});
  expect(r.status).toBe("manual");
  expect(r.url).toBeNull();
  expect(r.message).toContain(pkg.reelPath);
  expect(r.message).toContain(pkg.dir);
});

test("mode: api runs upload -> container create -> poll -> publish -> cleanup", async () => {
  const seen: string[] = [];
  let cleaned = false;
  const fakeFetch = (async (url: any) => {
    const u = String(url);
    if (u.includes("/media?")) { seen.push("create"); return new Response(JSON.stringify({ id: "container_1" }), { status: 200 }); }
    if (u.includes("/container_1?")) { seen.push("status"); return new Response(JSON.stringify({ status_code: "FINISHED" }), { status: 200 }); }
    if (u.includes("/media_publish?")) { seen.push("publish"); return new Response(JSON.stringify({ id: "media_1" }), { status: 200 }); }
    return new Response("not found", { status: 404 });
  }) as unknown as typeof fetch;

  const adapter = makeInstagramAdapter({
    loadConfig: () => ({ enabled: true, mode: "api" }),
    getCredentials: async () => ({ igUserId: "ig_1", pageAccessToken: "tok" }),
    fetchImpl: fakeFetch,
    uploadTemp: async () => ({ url: "https://ai-ugc.chron0.tech/blob/x.mp4", cleanup: async () => { cleaned = true; } }),
    pollIntervalMs: 0,
    maxPolls: 3,
  });

  const r = await adapter.publish(pkg, {});
  expect(r.status).toBe("published");
  expect(r.id).toBe("media_1");
  expect(seen).toEqual(["create", "status", "publish"]);
  expect(cleaned).toBe(true);
});

test("mode: api returns a failed result (not a throw) and still cleans up when the container errors", async () => {
  let cleaned = false;
  const fakeFetch = (async (url: any) => {
    const u = String(url);
    if (u.includes("/media?")) return new Response(JSON.stringify({ id: "container_1" }), { status: 200 });
    if (u.includes("/container_1?")) return new Response(JSON.stringify({ status_code: "ERROR", status: "bad video" }), { status: 200 });
    return new Response("not found", { status: 404 });
  }) as unknown as typeof fetch;

  const adapter = makeInstagramAdapter({
    loadConfig: () => ({ enabled: true, mode: "api" }),
    getCredentials: async () => ({ igUserId: "ig_1", pageAccessToken: "tok" }),
    fetchImpl: fakeFetch,
    uploadTemp: async () => ({ url: "https://ai-ugc.chron0.tech/blob/x.mp4", cleanup: async () => { cleaned = true; } }),
    pollIntervalMs: 0,
    maxPolls: 1,
  });

  const r = await adapter.publish(pkg, {});
  expect(r.status).toBe("failed");
  expect(r.error).toMatch(/ERROR|status_code/i);
  expect(cleaned).toBe(true);
});

test("mode: api dry-run touches nothing (no credentials, no fetch, no upload)", async () => {
  let touched = false;
  const adapter = makeInstagramAdapter({
    loadConfig: () => ({ enabled: true, mode: "api" }),
    getCredentials: async () => { touched = true; return { igUserId: "x", pageAccessToken: "y" }; },
    fetchImpl: (async () => { touched = true; return new Response("{}"); }) as unknown as typeof fetch,
    uploadTemp: async () => { touched = true; return { url: "x", cleanup: async () => {} }; },
  });
  const r = await adapter.publish(pkg, { dryRun: true });
  expect(r.status).toBe("manual");
  expect(touched).toBe(false);
});
