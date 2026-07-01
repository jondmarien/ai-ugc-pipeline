import { test, expect } from "bun:test";
import { shapeYoutubeResult, makeYoutubeAdapter } from "./youtube";
import fixture from "../fixtures/youtube-insert-200.json";
import type { RenderPackage } from "../types";

const pkg: RenderPackage = {
  key: "k", dir: "/d", reelPath: "/d/k_reel.mp4", slides: [],
  post: { post_id: "k", caption: "BlueHammer abused Defender's update flow.\n\nFollow.", hashtags: ["BlueHammer"] },
};

test("shapeYoutubeResult maps an insert response to a published AdapterResult", () => {
  const r = shapeYoutubeResult(fixture as any, "private");
  expect(r.platform).toBe("youtube");
  expect(r.status).toBe("published");
  expect(r.id).toBe("dQw4w9WgXcQ");
  expect(r.url).toBe("https://youtu.be/dQw4w9WgXcQ");
  expect(r.privacy).toBe("private");
});

test("adapter uploads via the injected uploader and returns published", async () => {
  let receivedMeta: any = null;
  const adapter = makeYoutubeAdapter({
    loadConfig: () => ({ enabled: true, privacy: "private", categoryId: "28" }),
    getToken: async () => "fake-token",
    upload: async (_token, meta, _file) => { receivedMeta = meta; return fixture as any; },
  });
  const r = await adapter.publish(pkg, {});
  expect(r.status).toBe("published");
  expect(r.id).toBe("dQw4w9WgXcQ");
  expect(receivedMeta.snippet.title.length).toBeGreaterThan(0);
  expect(receivedMeta.status.privacyStatus).toBe("private");
});

test("adapter reports a failed AdapterResult when the upload throws", async () => {
  const adapter = makeYoutubeAdapter({
    loadConfig: () => ({ enabled: true, privacy: "private", categoryId: "28" }),
    getToken: async () => "fake-token",
    upload: async () => { throw new Error("quotaExceeded"); },
  });
  const r = await adapter.publish(pkg, {});
  expect(r.status).toBe("failed");
  expect(r.error).toContain("quota");
});
