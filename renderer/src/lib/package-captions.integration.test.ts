import { test, expect } from "bun:test";
import { readFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { validatePost } from "./schema";
import { captionTxt, slideCaptionsTxt } from "./caption-export";
import { instagramUploadChecklist } from "../../scripts/lib/instagram-upload";

const fixturePath = new URL("../../content/posts/2026-06-05_hexstrike-ai-redteam.json", import.meta.url);
const basePost = JSON.parse(readFileSync(fixturePath, "utf8")) as Record<string, unknown>;

test("package path: legacy post still uses single caption.txt only", () => {
  const post = validatePost(basePost);
  expect(slideCaptionsTxt(post)).toBeNull();
  expect(captionTxt(post).startsWith(post.caption)).toBe(true);
});

test("package path: multi-caption export produces N distinct blocks", () => {
  const n = (basePost.slides as unknown[]).length;
  const slide_captions = Array.from({ length: n }, (_, i) => `Slide ${i + 1} IG caption.`);
  const post = validatePost({
    ...basePost,
    features: { multiple_captions: true },
    slide_captions,
    upload_package: {
      ...(basePost.upload_package as object),
      expected_files: [
        ...((basePost.upload_package as { expected_files?: string[] }).expected_files ?? []),
        "slide_captions.txt",
      ],
    },
  });
  const exported = slideCaptionsTxt(post);
  expect(exported).not.toBeNull();
  const blocks = exported!.trim().split(/\n\n+/);
  expect(blocks.length).toBe(n);
  expect(blocks[0]).toBe("Slide 1 IG caption.");
  expect(blocks[n - 1]).toContain("[");
});

test("instagram upload checklist references slide_captions when enabled", () => {
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