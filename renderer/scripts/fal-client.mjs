/// <reference types="node" />

// fal-client.mjs
//
// FAL.ai integration adapter for ai-ugc-pipeline (initial implementation).
// Responsibilities
// - authenticate via FAL_KEY env (https://fal.ai/dashboard/keys)
// - generate images through @fal-ai/client for FLUX models
// - write assets into renderer/public/backgrounds/<prefix>/NN_role.png
// - patch post JSON: background_asset, asset_status, renderMetadata.provider="fal", fal_image_url
// - retry + jittered backoff + per-slide timeout + caching (stubbed for v1)
// - expose: generateImage(), estimateCost(), healthCheck(), MODEL_CATALOG, renderSlide
//
// Implementation notes
// - Uses @fal-ai/client (added to package.json)
// - Credentials from process.env.FAL_KEY only.
// - Cache under renderer/.cache/fal/
// - For reel i2v, store fal_image_url for public HTTPS URL.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { backgroundFileName } from "./lib/slide-filename.mjs";
import { buildNegativePrompt as buildNegativePromptFromLib } from "./lib/flux-negative-prompt.mjs";

const RENDERER = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const CACHE_DIR = path.join(RENDERER, ".cache", "fal");

export const MODEL_CATALOG = Object.freeze({
  image: [
    { id: "flux-dev", name: "FLUX.1 dev", type: "image", apiModelId: "fal-ai/flux/dev", defaultSize: [1024, 1280], aspectRatio: "4:5", resolution: "720p" },
    { id: "flux-schnell", name: "FLUX.1 schnell", type: "image", apiModelId: "fal-ai/flux/schnell", defaultSize: [1024, 1280], aspectRatio: "4:5", resolution: "720p" },
    { id: "flux-2-pro", name: "FLUX.2 Pro", type: "image", apiModelId: "fal-ai/flux-2-pro", defaultSize: [1024, 1280], aspectRatio: "4:5", resolution: "720p" },
    { id: "flux-2-dev", name: "FLUX.2 dev", type: "image", apiModelId: "fal-ai/flux-2-dev", defaultSize: [1024, 1280], aspectRatio: "4:5", resolution: "720p" },
  ],
  video: [],
});

export const DEFAULT_IMAGE_MODEL = MODEL_CATALOG.image[0]?.id ?? "flux-dev";

function resolveEnv(name, fallback) {
  const v = process.env[name];
  return v !== undefined && v !== null && String(v).length ? String(v) : fallback;
}

export function buildNegativePrompt() {
  return buildNegativePromptFromLib();
}

function sha1(str) {
  try {
    if (typeof createHash === "function") {
      return createHash("sha1").update(str).digest("hex");
    }
  } catch {}
  return String(str);
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

export async function healthCheck() {
  const key = resolveEnv("FAL_KEY", "");
  const baseUrl = "https://api.fal.ai";
  return {
    ok: !!key,
    baseUrl,
    hasKey: !!key,
    message: key ? "FAL_KEY present" : "FAL_KEY missing (set in env)",
  };
}

export function estimateCost(modelId, width, height) {
  // Rough estimate; FAL pricing is usage-based (credits per generation)
  return 0.01; // placeholder
}

export async function generateImage({ prompt, model, width = 1024, height = 1280, seed, negativePrompt, aspectRatio = "4:5" }) {
  const apiKey = resolveEnv("FAL_KEY", "");
  if (!apiKey) {
    throw new Error("FAL_KEY not set in environment. Get one at https://fal.ai/dashboard/keys");
  }

  const modelId = MODEL_CATALOG.image.find(m => m.id === model)?.apiModelId || "fal-ai/flux/dev";

  // Dynamic import to avoid top-level dep issues if not installed in some envs
  const { fal } = await import("@fal-ai/client");
  fal.config({ credentials: apiKey });

  const input = {
    prompt,
    image_size: { width, height },
    seed: seed ?? Math.floor(Math.random() * 1000000),
    guidance_scale: 3.5,
    num_inference_steps: 28,
    ...(negativePrompt ? { negative_prompt: negativePrompt } : {}),
  };

  try {
    const result = await fal.subscribe(modelId, {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs?.map((log) => log.message).forEach((m) => console.log(`  FAL: ${m}`));
        }
      },
    });

    const imageUrl = result.data?.images?.[0]?.url || result.data?.image?.url;
    if (!imageUrl) {
      throw new Error("No image URL in FAL response");
    }
    return { url: imageUrl, requestId: result.requestId, model: modelId };
  } catch (err) {
    console.error("FAL generateImage error:", err.message || err);
    throw err;
  }
}

// renderSlide: high-level entry used by art-fal.mjs (stub for v1, full impl downloads + patches JSON)
export async function renderSlide(slide, post, opts = {}) {
  const { model = DEFAULT_IMAGE_MODEL, dryRun = false, prefix } = opts;
  const prompt = buildSlidePrompt ? (await import("./lib/art-slide-prompt.mjs")).buildSlidePrompt(slide, post, {}) : slide.visual_prompt || "cyberpunk security illustration";
  const neg = buildNegativePrompt();

  if (dryRun) {
    console.log(`[FAL dry] slide ${slide.slide} (${slide.role}): ${prompt.slice(0, 60)}...`);
    return { dryRun: true };
  }

  // In v1, the art-fal.mjs handles the logic; this is placeholder for direct calls
  const result = await generateImage({
    prompt,
    model,
    width: 1024,
    height: 1280,
    negativePrompt: neg,
  });

  // Note: full download + JSON patch happens in art script or caller
  return { url: result.url, model: result.model, requestId: result.requestId };
}

export default {
  MODEL_CATALOG,
  DEFAULT_IMAGE_MODEL,
  buildNegativePrompt,
  healthCheck,
  estimateCost,
  generateImage,
  renderSlide,
  promptHash,
};
