import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { listPublishedMeta } from "./meta";

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
