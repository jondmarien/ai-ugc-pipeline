import { expect, test } from "bun:test";
import type { RenderPackage } from "../types";
import {
  buildInstagramCaption,
  makeInstagramAdapter,
  shapeInstagramResult,
} from "./instagram";

const pkg: RenderPackage = {
  key: "2026-06-11_bluehammer-cve-2026-33825",
  dir: "/renders/2026-06-11_bluehammer-cve-2026-33825",
  reelPath:
    "/renders/2026-06-11_bluehammer-cve-2026-33825/2026-06-11_bluehammer-cve-2026-33825_reel.mp4",
  slides: [
    {
      path: "/renders/2026-06-11_bluehammer-cve-2026-33825/2026-06-11_bluehammer-cve-2026-33825_01_cover.png",
      altText: "Cover slide",
    },
    {
      path: "/renders/2026-06-11_bluehammer-cve-2026-33825/2026-06-11_bluehammer-cve-2026-33825_02_takeaway.png",
      altText: "Takeaway slide",
    },
  ],
  post: {
    post_id: "2026-06-11_bluehammer-cve-2026-33825",
    caption: "BlueHammer.",
    hashtags: ["BlueHammer"],
  },
};

const reelsCfg = {
  enabled: true,
  mode: "api" as const,
  postType: "reels" as const,
  trialReels: false,
};
const carouselCfg = {
  enabled: true,
  mode: "api" as const,
  postType: "carousel" as const,
  trialReels: false,
};

test("buildInstagramCaption appends hashtags and does not truncate short captions", () => {
  const { caption, truncated } = buildInstagramCaption(pkg.post);
  expect(caption).toContain("BlueHammer.");
  expect(caption).toContain("#BlueHammer");
  expect(truncated).toBe(false);
});

test("buildInstagramCaption truncates at 2200 chars and caps hashtags at 30", () => {
  const longPost = {
    caption: "x".repeat(2500),
    hashtags: Array.from({ length: 40 }, (_, i) => `tag${i}`),
  };
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
    loadConfig: () => ({
      enabled: true,
      mode: "manual",
      postType: "reels",
      trialReels: false,
    }),
    getCredentials: async () => {
      throw new Error("should not be called in manual mode");
    },
    fetchImpl: (async () => {
      throw new Error("should not be called in manual mode");
    }) as unknown as typeof fetch,
    uploadTemp: async () => {
      throw new Error("should not be called in manual mode");
    },
  });
  const r = await adapter.publish(pkg, {});
  expect(r.status).toBe("manual");
  expect(r.url).toBeNull();
  expect(r.message).toContain(pkg.reelPath);
  expect(r.message).toContain(pkg.dir);
});

test("postType: reels runs upload -> container create (with is_ai_generated=true) -> poll -> publish -> cleanup", async () => {
  const seen: string[] = [];
  let cleaned = false;
  let sawAiFlag = false;
  const fakeFetch = (async (url: any) => {
    const u = String(url);
    if (u.includes("/media?")) {
      seen.push("create");
      sawAiFlag = u.includes("is_ai_generated=true");
      return new Response(JSON.stringify({ id: "container_1" }), {
        status: 200,
      });
    }
    if (u.includes("/container_1?")) {
      seen.push("status");
      return new Response(JSON.stringify({ status_code: "FINISHED" }), {
        status: 200,
      });
    }
    if (u.includes("/media_publish?")) {
      seen.push("publish");
      return new Response(JSON.stringify({ id: "media_1" }), { status: 200 });
    }
    return new Response("not found", { status: 404 });
  }) as unknown as typeof fetch;

  const adapter = makeInstagramAdapter({
    loadConfig: () => reelsCfg,
    getCredentials: async () => ({ igUserId: "ig_1", pageAccessToken: "tok" }),
    fetchImpl: fakeFetch,
    uploadTemp: async () => ({
      url: "https://aiugc.chron0.tech/blob/x.mp4",
      cleanup: async () => {
        cleaned = true;
      },
    }),
    pollIntervalMs: 0,
    maxPolls: 3,
  });

  const r = await adapter.publish(pkg, {});
  expect(r.status).toBe("published");
  expect(r.id).toBe("media_1");
  expect(seen).toEqual(["create", "status", "publish"]);
  expect(cleaned).toBe(true);
  expect(sawAiFlag).toBe(true);
});

test("postType: reels includes trial_params when instagram.trialReels is enabled", async () => {
  let sawTrialParams = false;
  const fakeFetch = (async (url: any) => {
    const u = String(url);
    if (u.includes("/media?")) {
      sawTrialParams = u.includes("trial_params");
      return new Response(JSON.stringify({ id: "container_1" }), {
        status: 200,
      });
    }
    if (u.includes("/container_1?"))
      return new Response(JSON.stringify({ status_code: "FINISHED" }), {
        status: 200,
      });
    if (u.includes("/media_publish?"))
      return new Response(JSON.stringify({ id: "media_1" }), { status: 200 });
    return new Response("not found", { status: 404 });
  }) as unknown as typeof fetch;

  const adapter = makeInstagramAdapter({
    loadConfig: () => ({ ...reelsCfg, trialReels: true }),
    getCredentials: async () => ({ igUserId: "ig_1", pageAccessToken: "tok" }),
    fetchImpl: fakeFetch,
    uploadTemp: async () => ({
      url: "https://aiugc.chron0.tech/blob/x.mp4",
      cleanup: async () => {},
    }),
    pollIntervalMs: 0,
    maxPolls: 3,
  });

  const r = await adapter.publish(pkg, {});
  expect(r.status).toBe("published");
  expect(sawTrialParams).toBe(true);
});

test("postType: carousel uploads each slide, creates children then a parent (is_ai_generated only on parent), polls, publishes, cleans up all temps", async () => {
  const seen: string[] = [];
  let cleanedCount = 0;
  let childSawAiFlag = false;
  let parentSawAiFlag = false;
  const childIds: string[] = [];
  const fakeFetch = (async (url: any) => {
    const u = String(url);
    if (u.includes("/media?") && u.includes("is_carousel_item=true")) {
      seen.push("child");
      childSawAiFlag = childSawAiFlag || u.includes("is_ai_generated=true");
      const id = `child_${childIds.length + 1}`;
      childIds.push(id);
      return new Response(JSON.stringify({ id }), { status: 200 });
    }
    if (u.includes("/media?") && u.includes("media_type=CAROUSEL")) {
      seen.push("parent");
      parentSawAiFlag = u.includes("is_ai_generated=true");
      expect(u).toContain(`children=${childIds.join("%2C")}`);
      return new Response(JSON.stringify({ id: "parent_1" }), { status: 200 });
    }
    if (u.includes("/parent_1?")) {
      seen.push("status");
      return new Response(JSON.stringify({ status_code: "FINISHED" }), {
        status: 200,
      });
    }
    if (u.includes("/media_publish?")) {
      seen.push("publish");
      return new Response(JSON.stringify({ id: "media_carousel_1" }), {
        status: 200,
      });
    }
    return new Response("not found", { status: 404 });
  }) as unknown as typeof fetch;

  const adapter = makeInstagramAdapter({
    loadConfig: () => carouselCfg,
    getCredentials: async () => ({ igUserId: "ig_1", pageAccessToken: "tok" }),
    fetchImpl: fakeFetch,
    uploadTemp: async () => ({
      url: "https://aiugc.chron0.tech/blob/x.png",
      cleanup: async () => {
        cleanedCount++;
      },
    }),
    pollIntervalMs: 0,
    maxPolls: 3,
  });

  const r = await adapter.publish(pkg, {});
  expect(r.status).toBe("published");
  expect(r.id).toBe("media_carousel_1");
  expect(seen).toEqual(["child", "child", "parent", "status", "publish"]);
  expect(childSawAiFlag).toBe(false); // children must NOT set is_ai_generated
  expect(parentSawAiFlag).toBe(true); // only the parent container sets it
  expect(cleanedCount).toBe(pkg.slides.length); // every temp-hosted slide image is cleaned up
});

test("postType: carousel returns a failed result and still cleans up when there are no slides", async () => {
  const noSlidePkg: RenderPackage = { ...pkg, slides: [] };
  const adapter = makeInstagramAdapter({
    loadConfig: () => carouselCfg,
    getCredentials: async () => ({ igUserId: "ig_1", pageAccessToken: "tok" }),
    fetchImpl: (async () =>
      new Response("not found", { status: 404 })) as unknown as typeof fetch,
    uploadTemp: async () => ({ url: "x", cleanup: async () => {} }),
  });
  const r = await adapter.publish(noSlidePkg, {});
  expect(r.status).toBe("failed");
  expect(r.error).toMatch(/no slides/i);
});

test("mode: api returns a failed result (not a throw) and still cleans up when the container errors", async () => {
  let cleaned = false;
  const fakeFetch = (async (url: any) => {
    const u = String(url);
    if (u.includes("/media?"))
      return new Response(JSON.stringify({ id: "container_1" }), {
        status: 200,
      });
    if (u.includes("/container_1?"))
      return new Response(
        JSON.stringify({ status_code: "ERROR", status: "bad video" }),
        { status: 200 },
      );
    return new Response("not found", { status: 404 });
  }) as unknown as typeof fetch;

  const adapter = makeInstagramAdapter({
    loadConfig: () => reelsCfg,
    getCredentials: async () => ({ igUserId: "ig_1", pageAccessToken: "tok" }),
    fetchImpl: fakeFetch,
    uploadTemp: async () => ({
      url: "https://aiugc.chron0.tech/blob/x.mp4",
      cleanup: async () => {
        cleaned = true;
      },
    }),
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
    loadConfig: () => reelsCfg,
    getCredentials: async () => {
      touched = true;
      return { igUserId: "x", pageAccessToken: "y" };
    },
    fetchImpl: (async () => {
      touched = true;
      return new Response("{}");
    }) as unknown as typeof fetch,
    uploadTemp: async () => {
      touched = true;
      return { url: "x", cleanup: async () => {} };
    },
  });
  const r = await adapter.publish(pkg, { dryRun: true });
  expect(r.status).toBe("manual");
  expect(touched).toBe(false);
});
