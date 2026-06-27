import { readFileSync } from "node:fs";
import { test, expect } from "bun:test";
import { validatePost, PostData, multipleCaptionsEnabled } from "./schema";

const fixturePath = new URL("../../content/posts/2026-06-05_hexstrike-ai-redteam.json", import.meta.url);
const basePost = JSON.parse(readFileSync(fixturePath, "utf8")) as Record<string, unknown>;

test("legacy posts without features still validate (single caption path)", () => {
  const post = validatePost(basePost);
  expect(multipleCaptionsEnabled(post)).toBe(false);
  expect(post.slide_captions).toBeUndefined();
});

test("multiple_captions on accepts N captions for N slides", () => {
  const n = (basePost.slides as unknown[]).length;
  const slide_captions = Array.from({ length: n }, (_, i) => `Per-slide caption ${i + 1}.`);
  const raw = {
    ...basePost,
    features: { multiple_captions: true },
    slide_captions,
  };
  const post = validatePost(raw);
  expect(multipleCaptionsEnabled(post)).toBe(true);
  expect(post.slide_captions?.length).toBe(n);
});

test("rejects slide_captions when flag is off", () => {
  const raw = {
    ...basePost,
    slide_captions: ["only one"],
  };
  const parsed = PostData.safeParse(raw);
  expect(parsed.success).toBe(false);
  if (!parsed.success) {
    expect(parsed.error.issues.some((i) => i.path.join(".") === "slide_captions")).toBe(true);
  }
});

test("rejects length mismatch when multiple_captions is on", () => {
  const raw = {
    ...basePost,
    features: { multiple_captions: true },
    slide_captions: ["a", "b"],
  };
  const parsed = PostData.safeParse(raw);
  expect(parsed.success).toBe(false);
  if (!parsed.success) {
    expect(parsed.error.issues.some((i) => String(i.message).includes("slide_captions count"))).toBe(true);
  }
});

test("rejects empty slide_captions entry when flag is on", () => {
  const n = (basePost.slides as unknown[]).length;
  const slide_captions = Array.from({ length: n }, (_, i) => (i === 2 ? "   " : `Caption ${i + 1}.`));
  const raw = {
    ...basePost,
    features: { multiple_captions: true },
    slide_captions,
  };
  const parsed = PostData.safeParse(raw);
  expect(parsed.success).toBe(false);
  if (!parsed.success) {
    expect(parsed.error.issues.some((i) => i.path.join(".") === "slide_captions.2")).toBe(true);
  }
});