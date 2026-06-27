import { test, expect } from "bun:test";
import { pickPrivacy, shapeTiktokResult, makeTiktokAdapter } from "./tiktok";
import creatorInfo from "../fixtures/tiktok-creator-info.json";
import initResp from "../fixtures/tiktok-init-200.json";
import statusResp from "../fixtures/tiktok-status-published.json";
import type { RenderPackage } from "../types";

const pkg: RenderPackage = {
  key: "2026-06-11_bluehammer-cve-2026-33825",
  dir: "/d",
  reelPath: "/d/k_reel.mp4",
  post: { post_id: "k", caption: "BlueHammer abused Defender's update flow.\n\nFollow.", hashtags: ["BlueHammer"] },
};

const cfg = { enabled: true, privacy: "SELF_ONLY", disableComment: false, disableDuet: false, disableStitch: false };

test("pickPrivacy returns the configured level when it is in the creator's allowed options", () => {
  expect(pickPrivacy(creatorInfo as any, "SELF_ONLY")).toBe("SELF_ONLY");
});

test("pickPrivacy throws a clear privacy-mismatch error when not allowed", () => {
  expect(() => pickPrivacy(creatorInfo as any, "PUBLIC_TO_EVERYONE")).toThrow(/privacy/i);
});

test("shapeTiktokResult maps a complete status response to a published AdapterResult", () => {
  const r = shapeTiktokResult(statusResp as any, "SELF_ONLY", "v_pub_url~v2.123456789");
  expect(r.platform).toBe("tiktok");
  expect(r.kind).toBe("api");
  expect(r.status).toBe("published");
  expect(r.id).toBe("v_pub_url~v2.123456789");
  expect(r.privacy).toBe("SELF_ONLY");
});

test("shapeTiktokResult marks a non-complete status as failed", () => {
  const r = shapeTiktokResult({ data: { status: "FAILED" } } as any, "SELF_ONLY", "pid");
  expect(r.status).toBe("failed");
  expect(r.error).toBeDefined();
});

test("adapter runs creator_info -> init -> upload -> poll and includes Content-Range + Content-Type on the PUT", async () => {
  let putHeaders: Record<string, string> | null = null;
  const seen: string[] = [];
  const fakeFetch = (async (url: any, init: any) => {
    const u = String(url);
    if (u.includes("/creator_info/query/")) { seen.push("creator_info"); return new Response(JSON.stringify(creatorInfo), { status: 200 }); }
    if (u.includes("/video/init/")) { seen.push("init"); return new Response(JSON.stringify(initResp), { status: 200 }); }
    if (init?.method === "PUT") { seen.push("put"); putHeaders = init.headers as Record<string, string>; return new Response("", { status: 201 }); }
    if (u.includes("/status/fetch/")) { seen.push("status"); return new Response(JSON.stringify(statusResp), { status: 200 }); }
    return new Response("not found", { status: 404 });
  }) as unknown as typeof fetch;

  const adapter = makeTiktokAdapter({
    loadConfig: () => cfg,
    getToken: async () => "fake-token",
    fetchImpl: fakeFetch,
    readFile: () => new Uint8Array(1024),
    pollIntervalMs: 0,
    maxPolls: 3,
  });

  const r = await adapter.publish(pkg, {});
  expect(r.status).toBe("published");
  expect(r.privacy).toBe("SELF_ONLY");
  expect(seen).toEqual(["creator_info", "init", "put", "status"]);
  const cr = putHeaders!["Content-Range"] ?? putHeaders!["content-range"];
  expect(cr).toBe("bytes 0-1023/1024");
  const ct = putHeaders!["Content-Type"] ?? putHeaders!["content-type"];
  expect(ct).toBe("video/mp4");
});

test("adapter returns a failed result (not a throw) when privacy is not permitted", async () => {
  const fakeFetch = (async (url: any) => {
    if (String(url).includes("/creator_info/query/")) return new Response(JSON.stringify(creatorInfo), { status: 200 });
    return new Response("{}", { status: 200 });
  }) as unknown as typeof fetch;

  const adapter = makeTiktokAdapter({
    loadConfig: () => ({ ...cfg, privacy: "PUBLIC_TO_EVERYONE" }),
    getToken: async () => "t",
    fetchImpl: fakeFetch,
    readFile: () => new Uint8Array(10),
    pollIntervalMs: 0,
    maxPolls: 1,
  });
  const r = await adapter.publish(pkg, {});
  expect(r.status).toBe("failed");
  expect(r.error).toMatch(/privacy/i);
});

test("dry-run posts nothing (no token, no fetch)", async () => {
  let touched = false;
  const adapter = makeTiktokAdapter({
    loadConfig: () => cfg,
    getToken: async () => { touched = true; return "t"; },
    fetchImpl: (async () => { touched = true; return new Response("{}"); }) as unknown as typeof fetch,
    readFile: () => { touched = true; return new Uint8Array(1); },
  });
  const r = await adapter.publish(pkg, { dryRun: true });
  expect(r.status).toBe("manual");
  expect(touched).toBe(false);
});
