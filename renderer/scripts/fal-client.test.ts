import { test, expect } from "bun:test";
import {
  MODEL_CATALOG,
  DEFAULT_IMAGE_MODEL,
  DEFAULT_VIDEO_MODEL,
  promptHash,
  buildNegativePrompt,
  estimateCost,
  motionPromptForBeat,
  resolveSegmentImageUrl,
} from "./fal-client.mjs";

test("MODEL_CATALOG exposes image and video entries", () => {
  expect(MODEL_CATALOG.image.length).toBeGreaterThan(0);
  expect(MODEL_CATALOG.video.map((m) => m.id)).toContain("kling-standard");
});

test("DEFAULT_IMAGE_MODEL is flux-dev", () => {
  expect(DEFAULT_IMAGE_MODEL).toBe("flux-dev");
});

test("DEFAULT_VIDEO_MODEL is kling-standard", () => {
  expect(DEFAULT_VIDEO_MODEL).toBe("kling-standard");
});

test("promptHash is deterministic", () => {
  const a = promptHash("p", "flux-dev", 1024, 1280, 1, "");
  const b = promptHash("p", "flux-dev", 1024, 1280, 1, "");
  expect(a).toBe(b);
});

test("motionPromptForBeat includes motion", () => {
  const p = motionPromptForBeat({ motion: "dolly in" }, { visual_prompt: "server room" });
  expect(p).toContain("dolly in");
  expect(p).toContain("server room");
});

test("resolveSegmentImageUrl prefers fal_image_url", () => {
  const url = resolveSegmentImageUrl({ fal_image_url: "https://cdn.example.com/a.png" });
  expect(url).toBe("https://cdn.example.com/a.png");
});

test("resolveSegmentImageUrl throws without public URL", () => {
  expect(() => resolveSegmentImageUrl({ background_asset: "/backgrounds/x/01_cover.png" })).toThrow(
    /public image URL/,
  );
});

test("estimateCost returns numbers", async () => {
  expect(await estimateCost("flux-dev", 1024, 1280)).toBeGreaterThan(0);
  expect(await estimateCost("kling-standard", 1080, 1920)).toBeGreaterThan(0);
});

test("buildNegativePrompt includes text-free contract", () => {
  const p = buildNegativePrompt();
  expect(p).toContain("text");
});