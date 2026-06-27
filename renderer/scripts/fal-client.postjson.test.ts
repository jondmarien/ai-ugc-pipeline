import { test, expect, mock, afterAll } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Regression test for the post-JSON clobber bug: renderSlide must MUTATE the passed-in `post`
// (and persist it) so a caller's later writePostJson doesn't wipe background_asset/asset_status/
// asset_licenses. Network is fully stubbed (FAL client + fetch), so no FAL_KEY / no API calls.

const RENDERER = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const POSTS = path.join(RENDERER, "content", "posts");

mock.module("@fal-ai/client", () => ({
  fal: {
    config() {},
    async subscribe() {
      return { data: { images: [{ url: "https://example.test/fake.png" }] }, requestId: "req-test" };
    },
  },
}));

const realFetch = globalThis.fetch;
globalThis.fetch = (async () => ({
  ok: true,
  status: 200,
  async arrayBuffer() {
    return new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer; // PNG magic
  },
})) as unknown as typeof fetch;
process.env.FAL_KEY = process.env.FAL_KEY || "test-key";

afterAll(() => {
  globalThis.fetch = realFetch;
});

test("renderSlide mutates + persists the post (no clobber)", async () => {
  const { renderSlide } = await import("./fal-client.mjs");
  const id = `fal-clobber-${Date.now()}`;
  const post: any = {
    post_id: id,
    upload_package: { filename_prefix: id },
    canvas: { width: 1080, height: 1350 },
    slides: [{ slide: 1, role: "cover", background_asset: "", asset_status: "needed", visual_prompt: "x" }],
    asset_licenses: [],
  };
  const outPng = path.join(RENDERER, "public", "backgrounds", id, "01_cover.png");
  const postFile = path.join(POSTS, `${id}.json`);
  try {
    await renderSlide({ post, slideIndex: 0, prompt: "dark bg", model: "flux-dev", width: 1024, height: 1280, seed: 1 });

    // (1) the passed-in object is mutated — so a caller's final write stays consistent
    expect(post.slides[0].background_asset).toBe(`/backgrounds/${id}/01_cover.png`);
    expect(post.slides[0].asset_status).toBe("generated");
    expect(post.asset_licenses.length).toBe(1);

    // (2) the same patch is on disk
    const onDisk = JSON.parse(fs.readFileSync(postFile, "utf8"));
    expect(onDisk.slides[0].background_asset).toBe(`/backgrounds/${id}/01_cover.png`);
    expect(onDisk.slides[0].asset_status).toBe("generated");
  } finally {
    try { fs.unlinkSync(outPng); } catch {}
    try { fs.rmdirSync(path.dirname(outPng)); } catch {}
    try { fs.unlinkSync(postFile); } catch {}
  }
});
