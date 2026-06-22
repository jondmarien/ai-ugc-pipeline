import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { validatePost } from "./schema";
import { instagramUploadChecklist } from "../../scripts/lib/instagram-upload";

const fixturePath = new URL("../../content/posts/2026-06-05_hexstrike-ai-redteam.json", import.meta.url);
const basePost = JSON.parse(readFileSync(fixturePath, "utf8")) as Record<string, unknown>;

test("upload checklist: default single-caption path", () => {
  const post = validatePost(basePost);
  const md = instagramUploadChecklist(post, "/tmp/render-dir");
  expect(md).toContain("caption.txt");
  expect(md).not.toContain("Per-slide captions");
  expect(md).not.toContain("slide_captions.txt");
});

test("upload checklist: multi-caption path lists slide_captions file", () => {
  const n = (basePost.slides as unknown[]).length;
  const post = validatePost({
    ...basePost,
    features: { multiple_captions: true },
    slide_captions: Array.from({ length: n }, (_, i) => `Cap ${i + 1}.`),
  });
  const md = instagramUploadChecklist(post, "/tmp/render-dir");
  expect(md).toContain("slide_captions.txt");
  expect(md).toContain("Per-slide captions");
});