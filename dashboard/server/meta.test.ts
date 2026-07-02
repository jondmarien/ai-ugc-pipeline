import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import type { PublishedMetaPost } from "../shared/types";
import { attachMetaInsights, listPublishedMeta } from "./meta";

const tmpRoot = path.join(import.meta.dir, "fixtures", "tmp-meta");
const rendersDir = path.join(tmpRoot, "renders");
const postsDir = path.join(tmpRoot, "posts");

function writeRenderDir(
  dirName: string,
  state: Record<string, unknown> | null,
) {
  const dir = path.join(rendersDir, dirName);
  fs.mkdirSync(dir, { recursive: true });
  if (state) {
    fs.writeFileSync(
      path.join(dir, "publish.state.json"),
      JSON.stringify(state),
    );
  }
}

function writePost(slug: string, data: Record<string, unknown>) {
  fs.mkdirSync(postsDir, { recursive: true });
  fs.writeFileSync(path.join(postsDir, `${slug}.json`), JSON.stringify(data));
}

describe("listPublishedMeta", () => {
  beforeEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
    fs.mkdirSync(tmpRoot, { recursive: true });
  });
  afterEach(() => fs.rmSync(tmpRoot, { recursive: true, force: true }));

  test("returns empty when the renders dir doesn't exist", () => {
    expect(
      listPublishedMeta({ rendersDir: path.join(tmpRoot, "nope"), postsDir }),
    ).toEqual([]);
  });

  test("skips render dirs with no publish.state.json", () => {
    writeRenderDir("2026-06-11_no-state", null);
    expect(listPublishedMeta({ rendersDir, postsDir })).toEqual([]);
  });

  test("skips platforms that failed or aren't facebook/instagram", () => {
    writeRenderDir("2026-06-11_mixed", {
      youtube: { platform: "youtube", status: "published", id: "yt1", at: 100 },
      facebook: {
        platform: "facebook",
        status: "failed",
        error: "boom",
        at: 100,
      },
    });
    expect(listPublishedMeta({ rendersDir, postsDir })).toEqual([]);
  });

  test("joins a published facebook entry with the post's caption/hashtags", () => {
    writeRenderDir("2026-06-11_bluehammer", {
      facebook: {
        platform: "facebook",
        status: "published",
        id: "fb1",
        url: "https://facebook.com/watch/?v=fb1",
        privacy: "draft",
        at: 200,
      },
    });
    writePost("bluehammer", {
      caption: "BlueHammer.",
      hashtags: ["BlueHammer"],
    });

    const result = listPublishedMeta({ rendersDir, postsDir });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      renderDir: "2026-06-11_bluehammer",
      slug: "bluehammer",
      date: "2026-06-11",
      platform: "facebook",
      postType: "fb_video",
      mediaId: "fb1",
      privacy: "draft",
      isAiGenerated: true,
      caption: "BlueHammer.",
      hashtags: ["BlueHammer"],
      publishedAt: 200,
    });
  });

  test("labels instagram postType from the passed-in config value", () => {
    writeRenderDir("2026-06-12_carousel-post", {
      instagram: {
        platform: "instagram",
        status: "published",
        id: "ig1",
        at: 300,
      },
    });
    writePost("carousel-post", { caption: "Carousel.", hashtags: [] });

    const reels = listPublishedMeta({
      rendersDir,
      postsDir,
      instagramPostType: "reels",
    });
    expect(reels[0].postType).toBe("reel");

    const carousels = listPublishedMeta({
      rendersDir,
      postsDir,
      instagramPostType: "carousel",
    });
    expect(carousels[0].postType).toBe("carousel");
  });

  test("returns both facebook and instagram entries for the same render, sorted newest first", () => {
    writeRenderDir("2026-06-10_older", {
      facebook: {
        platform: "facebook",
        status: "published",
        id: "old",
        at: 100,
      },
    });
    writeRenderDir("2026-06-13_newer", {
      instagram: {
        platform: "instagram",
        status: "published",
        id: "new",
        at: 500,
      },
    });
    const result = listPublishedMeta({ rendersDir, postsDir });
    expect(result.map((r) => r.mediaId)).toEqual(["new", "old"]);
  });

  test("falls back to empty caption/hashtags when the post JSON is missing", () => {
    writeRenderDir("2026-06-14_no-post", {
      facebook: {
        platform: "facebook",
        status: "published",
        id: "f2",
        at: 400,
      },
    });
    const result = listPublishedMeta({ rendersDir, postsDir });
    expect(result[0].caption).toBe("");
    expect(result[0].hashtags).toEqual([]);
  });
});

describe("attachMetaInsights", () => {
  const cacheDir = path.join(tmpRoot, "meta-cache");
  const secretsPath = path.join(tmpRoot, "meta-secrets.json");
  const noCredsPath = path.join(tmpRoot, "no-such-secrets.json");

  beforeEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
    fs.mkdirSync(tmpRoot, { recursive: true });
    fs.writeFileSync(
      secretsPath,
      JSON.stringify({
        page_id: "p1",
        page_access_token: "tok",
        ig_user_id: "ig1",
      }),
    );
  });
  afterEach(() => fs.rmSync(tmpRoot, { recursive: true, force: true }));

  const igPost: PublishedMetaPost = {
    renderDir: "d",
    slug: "s",
    date: null,
    platform: "instagram",
    postType: "reel",
    mediaId: "media1",
    url: null,
    privacy: null,
    isAiGenerated: true,
    caption: "",
    hashtags: [],
    publishedAt: 1,
    insights: null,
    insightsError: null,
  };

  test("returns the same actionable message on every post when Meta credentials are missing", async () => {
    const result = await attachMetaInsights([igPost], false, {
      secretsPath: noCredsPath,
    });
    expect(result[0].insightsError).toMatch(/publish:auth meta/);
  });

  test("marks a post with no mediaId instead of calling the network", async () => {
    let called = false;
    const result = await attachMetaInsights(
      [{ ...igPost, mediaId: null }],
      false,
      {
        secretsPath,
        cacheDir,
        fetchImpl: (async () => {
          called = true;
          return new Response("{}");
        }) as unknown as typeof fetch,
      },
    );
    expect(called).toBe(false);
    expect(result[0].insightsError).toMatch(/no media id/);
  });

  test("fetches instagram insights and caches them", async () => {
    let calls = 0;
    const fetchImpl = (async (url: any) => {
      calls++;
      expect(String(url)).toContain("/media1/insights");
      expect(String(url)).toContain("appsecret_proof=");
      return new Response(
        JSON.stringify({
          data: [
            { name: "views", values: [{ value: 42 }] },
            { name: "reach", values: [{ value: 10 }] },
          ],
        }),
        { status: 200 },
      );
    }) as unknown as typeof fetch;

    const first = await attachMetaInsights([igPost], false, {
      secretsPath,
      cacheDir,
      fetchImpl,
    });
    expect(first[0].insights).toEqual({
      views: 42,
      reach: 10,
      saves: undefined,
      shares: undefined,
    });
    expect(calls).toBe(1);

    const second = await attachMetaInsights([igPost], false, {
      secretsPath,
      cacheDir,
      fetchImpl,
    });
    expect(calls).toBe(1); // cache-first: second call doesn't hit the network again
    expect(second[0].insights?.views).toBe(42);
  });

  test("fetches facebook video insights via a different field set", async () => {
    const fbPost: PublishedMetaPost = {
      ...igPost,
      platform: "facebook",
      postType: "fb_video",
      mediaId: "vid1",
    };
    const fetchImpl = (async (url: any) => {
      expect(String(url)).toContain("/vid1?");
      expect(String(url)).toContain("likes.summary");
      return new Response(
        JSON.stringify({
          likes: { summary: { total_count: 5 } },
          comments: { summary: { total_count: 2 } },
        }),
        { status: 200 },
      );
    }) as unknown as typeof fetch;

    const result = await attachMetaInsights([fbPost], false, {
      secretsPath,
      cacheDir,
      fetchImpl,
    });
    expect(result[0].insights).toEqual({ likes: 5, comments: 2 });
  });

  test("a per-post Graph failure doesn't fail the rest of the batch", async () => {
    const goodPost: PublishedMetaPost = { ...igPost, mediaId: "good" };
    const badPost: PublishedMetaPost = { ...igPost, mediaId: "bad" };
    const fetchImpl = (async (url: any) => {
      if (String(url).includes("/bad/"))
        return new Response(JSON.stringify({ error: { message: "deleted" } }), {
          status: 400,
        });
      return new Response(JSON.stringify({ data: [] }), { status: 200 });
    }) as unknown as typeof fetch;

    const result = await attachMetaInsights([goodPost, badPost], false, {
      secretsPath,
      cacheDir,
      fetchImpl,
    });
    const good = result.find((r) => r.mediaId === "good");
    const bad = result.find((r) => r.mediaId === "bad");
    expect(good?.insightsError).toBeNull();
    expect(bad?.insightsError).toMatch(/deleted/);
  });
});
