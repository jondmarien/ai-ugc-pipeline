/// <reference types="node" />

// xai-client.mjs — xAI Grok Imagine adapter for ai-ugc-pipeline (image + reel i2v).
// Follows the exact patterns from fal-client.mjs and higgsfield-client.mjs.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { backgroundFileName } from "./lib/slide-filename.mjs";
import { buildNegativePrompt as buildNegativePromptFromLib } from "./lib/flux-negative-prompt.mjs";

const RENDERER = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const CACHE_DIR = path.join(RENDERER, ".cache", "xai");

export const MODEL_CATALOG = Object.freeze({
  image: [
    { id: "grok-imagine-image-quality", name: "Grok Imagine Image Quality", type: "image", apiModelId: "grok-imagine-image-quality", defaultSize: [1024, 1280], aspectRatio: "4:5" },
    { id: "grok-imagine-image", name: "Grok Imagine Image", type: "image", apiModelId: "grok-imagine-image", defaultSize: [1024, 1280], aspectRatio: "4:5" },
  ],
  video: [
    { id: "grok-imagine-video-1.5", name: "Grok Imagine Video 1.5 (i2v)", type: "video", apiModelId: "grok-imagine-video-1.5", defaultDuration: 5, aspectRatio: "9:16" },
    { id: "grok-imagine-video", name: "Grok Imagine Video (i2v)", type: "video", apiModelId: "grok-imagine-video", defaultDuration: 5, aspectRatio: "9:16" },
  ],
});

export const DEFAULT_IMAGE_MODEL = "grok-imagine-image-quality";
export const DEFAULT_VIDEO_MODEL = "grok-imagine-video-1.5";

export function buildNegativePrompt() {
  return buildNegativePromptFromLib();
}

function sha1(str) {
  try {
    return createHash("sha1").update(str).digest("hex");
  } catch {
    return String(str);
  }
}

export function promptHash(prompt, model, width, height, seed, cacheBreaker) {
  const payload = `${model}\n${width}\n${height}\n${seed}\n${cacheBreaker ?? ""}\n${prompt}`;
  return `sha1:${sha1(payload)}`;
}

function cachePathForKey(key) {
  return path.join(CACHE_DIR, `${key}.json`);
}

function readCache(key) {
  try {
    const raw = readFileSync(cachePathForKey(key), "utf8");
    const entry = JSON.parse(raw);
    if (entry && entry.expiresAt && Date.now() < entry.expiresAt) return entry;
  } catch {}
  return null;
}

function writeCache(key, value, ttlMs) {
  try {
    mkdirSync(CACHE_DIR, { recursive: true });
    const entry = { ...value, expiresAt: Date.now() + ttlMs };
    writeFileSync(cachePathForKey(key), JSON.stringify(entry, null, 2));
  } catch {}
}

async function callXaiImages(prompt, model) {
  const key = process.env.XAI_API_KEY;
  if (!key) throw new Error("XAI_API_KEY not set");

  const res = await fetch("https://api.x.ai/v1/images/generations", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      n: 1,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`xAI image error: ${res.status} ${text}`);
  }
  return res.json();
}

async function callXaiVideos(prompt, model, imageUrl, duration = 5) {
  const key = process.env.XAI_API_KEY;
  if (!key) throw new Error("XAI_API_KEY not set");

  const res = await fetch("https://api.x.ai/v1/videos/generations", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      image: { url: imageUrl },
      duration,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`xAI video error: ${res.status} ${text}`);
  }
  return res.json();
}

export async function generateImage(postKey, opts = {}) {
  const { dryRun = false, only = null, model = DEFAULT_IMAGE_MODEL, cooldown = 0 } = opts;

  if (dryRun) {
    console.log(`[xai] DRY-RUN image gen for ${postKey} (model=${model})`);
    return { success: true, dryRun: true, model };
  }

  console.log(`[xai] Generating image for ${postKey} (model=${model})`);

  const result = await callXaiImages("Dark cinematic background for cybersecurity slide", model);
  const imageUrl = result.data?.[0]?.url;

  if (!imageUrl) throw new Error("No image URL returned from xAI");
  console.log(`[xai] Image generated: ${imageUrl}`);

  return { success: true, url: imageUrl, model };
}

export async function generateVideo(postKey, opts = {}) {
  const { dryRun = false, only = null, model = DEFAULT_VIDEO_MODEL, cooldown = 0 } = opts;

  if (dryRun) {
    console.log(`[xai] DRY-RUN video gen for ${postKey} (model=${model})`);
    return { success: true, dryRun: true, model };
  }

  console.log(`[xai] Generating video for ${postKey} (model=${model})`);

  const result = await callXaiVideos("Slow cinematic camera push-in", model, "https://example.com/placeholder.jpg", 5);
  const videoUrl = result.video?.url || result.data?.[0]?.url;

  if (!videoUrl) throw new Error("No video URL returned from xAI");
  console.log(`[xai] Video generated: ${videoUrl}`);

  return { success: true, url: videoUrl, model };
}

console.log("xai-client skeleton loaded");