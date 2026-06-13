import { test, expect } from "bun:test";
import { youtubeMetadata, tiktokMetadata } from "./metadata";

const post = {
  post_id: "2026-06-11_bluehammer-cve-2026-33825",
  caption: "BlueHammer abused Defender's update flow.\n\nFollow for more.",
  hashtags: ["BlueHammer", "Windows", "Defender"],
} as any;

test("youtube title is <=100 chars and from the first caption line", () => {
  const m = youtubeMetadata(post, { privacy: "private", categoryId: "28" });
  expect(m.snippet.title.length).toBeLessThanOrEqual(100);
  expect(m.status.privacyStatus).toBe("private");
  expect(m.snippet.description).toContain("#Shorts");
  expect(m.snippet.tags).toContain("BlueHammer");
});

test("tiktok payload carries privacy + caption title", () => {
  const m = tiktokMetadata(post, { privacy: "SELF_ONLY", disableComment: false, disableDuet: false, disableStitch: false });
  expect(m.post_info.privacy_level).toBe("SELF_ONLY");
  expect(m.post_info.title.length).toBeGreaterThan(0);
});

test("youtube title truncates an over-long first line on a word boundary", () => {
  const long = { ...post, caption: "x ".repeat(120) };
  const m = youtubeMetadata(long, { privacy: "private", categoryId: "28" });
  expect(m.snippet.title.length).toBeLessThanOrEqual(100);
});
