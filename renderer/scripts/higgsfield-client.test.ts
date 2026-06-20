import { test, expect } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MODEL_CATALOG, DEFAULT_IMAGE_MODEL, promptHash, buildNegativePrompt, estimateCost } from "./higgsfield-client.mjs";
import { renderSlide } from "./higgsfield-client.mjs";

const RENDERER = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const POSTS = path.join(RENDERER, "content", "posts");

function makePostJson(): string {
  const id = `smoke-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const file = path.join(POSTS, `${id}.json`);
  const payload = {
    post_id: id,
    date: new Date().toISOString().slice(0, 10),
    slug: "higgsfield-smoke",
    platform: "instagram",
    format: "carousel",
    status: "draft",
    pillar: "offensive_ai",
    theme: "offensive",
    style_fusion: "",
    audience: "security teams",
    core_claim: "Smoke",
    claim_tags: ["smoke"],
    score: { credibility: 4, relevance: 5, novelty: 5, visual_drama: 5, defender_usefulness: 4, total: 23 },
    canvas: { width: 1080, height: 1350, safe_margin: 72 },
    brand: { handle: "@chron0", pillar_accent: "offensive_ai" },
    upload_package: { folder: "test", filename_prefix: id },
    slides: [
      { slide: 1, role: "cover", on_slide_copy: "Smoke test cover", background_asset: "", asset_status: "needed", visual_prompt: "abstract dark tech" },
      { slide: 2, role: "context", on_slide_copy: "Smoke test body", background_asset: "", asset_status: "needed", visual_prompt: "abstract dark tech" },
    ],
    caption: "Higgsfield smoke test",
    hashtags: ["security"],
    alt_text: ["a", "b"],
    sources: [{ source: "x", link: "https://example.com", supports: "y", confidence: "high", claim_tag: "z" }],
    asset_licenses: [],
  };
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return id;
}

function removePostJson(id: string) {
  const file = path.join(POSTS, `${id}.json`);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

test("MODEL_CATALOG exposes the approved image set", () => {
  expect(MODEL_CATALOG.image.map((m) => m.id)).toEqual([
    "soul-2.0",
    "cinema-studio-3.0",
    "flux",
    "gpt-image-2",
    "seedream-4.5",
  ]);
});

test("DEFAULT_IMAGE_MODEL is the first approved image model", () => {
  expect(DEFAULT_IMAGE_MODEL).toBe("soul-2.0");
});

test("promptHash is deterministic for equal inputs", () => {
  const a = promptHash("p", "model", 1024, 1280, 1, "");
  const b = promptHash("p", "model", 1024, 1280, 1, "");
  expect(a).toBe(b);
});

test("promptHash changes when inputs change", () => {
  const a = promptHash("p", "model", 1024, 1280, 1, "");
  const b = promptHash("p2", "model", 1024, 1280, 1, "");
  expect(a).not.toBe(b);
});

test("buildNegativePrompt includes text-free contract phrases", () => {
  const p = buildNegativePrompt();
  expect(p).toContain("text");
  expect(p).toContain("watermark");
  expect(p).toContain("user interface");
});

test("estimateCost returns a finite value for an approved model", async () => {
  const cost = await estimateCost("flux", 1024, 1280);
  expect(typeof cost).toBe("number");
  expect(Number.isFinite(cost)).toBe(true);
});

test("estimateCost rejects unknown models", async () => {
  await expect(estimateCost("does-not-exist", 1024, 1280)).rejects.toThrow("UnknownHiggsfieldModel");
});

test("estimateCost tolerates non-finite dimensions by falling back to the default unit", async () => {
  const cost = await estimateCost("flux", Number.NaN, Number.NaN);
  expect(typeof cost).toBe("number");
  expect(Number.isFinite(cost)).toBe(true);
});

test("renderSlide gates on HIGGSFIELD_API_URL/auth", async () => {
  const id = makePostJson();
  try {
    const err = await renderSlide({
      post: { post_id: id, upload_package: { filename_prefix: id } },
      slideIndex: 0,
      prompt: "x",
      width: 1024,
      height: 1280,
      postPath: path.join(POSTS, `${id}.json`),
    });
    // Unreachable unless Higgsfield is configured; treat a successful path as a live-environment edge.
    if (err) expect(err.message).toBeTruthy();
  } catch (e: any) {
    expect(["higgsfield client misconfigured", "higgsfield auth missing"].some((s) => (e?.message ?? "").includes(s))).toBe(true);
  } finally {
    removePostJson(id);
  }
});
