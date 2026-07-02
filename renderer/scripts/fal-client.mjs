/// <reference types="node" />

// fal-client.mjs — FAL.ai adapter for ai-ugc-pipeline (image + reel i2v).

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildNegativePrompt as buildNegativePromptFromLib } from "./lib/flux-negative-prompt.mjs";
import { backgroundFileName } from "./lib/slide-filename.mjs";

const RENDERER = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const CACHE_DIR = path.join(RENDERER, ".cache", "fal");

export const MODEL_CATALOG = Object.freeze({
  image: [
    {
      id: "flux-dev",
      name: "FLUX.1 dev",
      type: "image",
      apiModelId: "fal-ai/flux/dev",
      defaultSize: [1024, 1280],
      aspectRatio: "4:5",
      resolution: "720p",
    },
    {
      id: "flux-schnell",
      name: "FLUX.1 schnell",
      type: "image",
      apiModelId: "fal-ai/flux/schnell",
      defaultSize: [1024, 1280],
      aspectRatio: "4:5",
      resolution: "720p",
    },
    {
      id: "flux-2-pro",
      name: "FLUX.2 Pro",
      type: "image",
      apiModelId: "fal-ai/flux-2-pro",
      defaultSize: [1024, 1280],
      aspectRatio: "4:5",
      resolution: "720p",
    },
    {
      id: "flux-2-dev",
      name: "FLUX.2 dev",
      type: "image",
      apiModelId: "fal-ai/flux-2-dev",
      defaultSize: [1024, 1280],
      aspectRatio: "4:5",
      resolution: "720p",
    },
  ],
  video: [
    {
      id: "kling-standard",
      name: "Kling 2.1 Standard (i2v)",
      type: "video",
      apiModelId: "fal-ai/kling-video/v2.1/standard/image-to-video",
      defaultDuration: 5,
      aspectRatio: "9:16",
    },
  ],
});

export const DEFAULT_IMAGE_MODEL = MODEL_CATALOG.image[0]?.id ?? "flux-dev";
export const DEFAULT_VIDEO_MODEL =
  process.env.FAL_VIDEO_MODEL?.trim() || "kling-standard";

function resolveEnv(name, fallback) {
  const v = process.env[name];
  return v !== undefined && v !== null && String(v).length
    ? String(v)
    : fallback;
}

function catalogEntry(modelId) {
  return (
    [...MODEL_CATALOG.image, ...MODEL_CATALOG.video].find(
      (m) => m.id === modelId,
    ) ?? null
  );
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
    if (entry?.expiresAt && Date.now() < entry.expiresAt) return entry;
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

async function downloadImageToFile(imageUrl, destPath, signal) {
  const res = await fetch(imageUrl, { signal });
  if (!res.ok) throw new Error(`FAL image download failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  mkdirSync(path.dirname(destPath), { recursive: true });
  writeFileSync(destPath, buf);
  return destPath;
}

async function downloadVideoToFile(videoUrl, destPath, signal) {
  const res = await fetch(videoUrl, { signal });
  if (!res.ok) throw new Error(`FAL video download failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  mkdirSync(path.dirname(destPath), { recursive: true });
  writeFileSync(destPath, buf);
  return destPath;
}

export async function healthCheck() {
  const key = resolveEnv("FAL_KEY", "");
  return {
    ok: !!key,
    baseUrl: "https://api.fal.ai",
    hasKey: !!key,
    message: key ? "FAL_KEY present" : "FAL_KEY missing (set in env)",
  };
}

export function estimateCost(modelId, _width, _height) {
  const catalog = catalogEntry(modelId);
  if (!catalog) return 0.01;
  if (catalog.type === "video") return 0.08;
  return 0.01;
}

async function getFal() {
  const apiKey = resolveEnv("FAL_KEY", "");
  if (!apiKey) {
    throw new Error(
      "FAL_KEY not set in environment. Get one at https://fal.ai/dashboard/keys",
    );
  }
  const { fal } = await import("@fal-ai/client");
  fal.config({ credentials: apiKey });
  return fal;
}

export async function generateImage({
  prompt,
  model,
  width = 1024,
  height = 1280,
  seed,
  negativePrompt,
  outDir,
  outName,
  cacheBreaker = "",
}) {
  const catalog = catalogEntry(model);
  const modelId = catalog?.apiModelId || "fal-ai/flux/dev";
  const resolvedSeed = seed ?? Math.floor(Math.random() * 1_000_000);
  const cacheKey = promptHash(
    prompt,
    model,
    width,
    height,
    resolvedSeed,
    cacheBreaker,
  );
  const cached = readCache(cacheKey);
  if (cached?.imagePath && existsSync(cached.imagePath)) {
    return { ...cached, cached: true };
  }

  const fal = await getFal();
  const input = {
    prompt,
    image_size: { width, height },
    seed: resolvedSeed,
    guidance_scale: 3.5,
    num_inference_steps: 28,
    ...(negativePrompt ? { negative_prompt: negativePrompt } : {}),
  };

  const result = await fal.subscribe(modelId, {
    input,
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS") {
        update.logs
          ?.map((log) => log.message)
          .forEach((m) => {
            console.log(`  FAL: ${m}`);
          });
      }
    },
  });

  const imageUrl = result.data?.images?.[0]?.url || result.data?.image?.url;
  if (!imageUrl) throw new Error("No image URL in FAL response");

  let imagePath;
  if (outDir && outName) {
    imagePath = path.join(outDir, outName);
    await downloadImageToFile(imageUrl, imagePath);
  }

  const payload = {
    url: imageUrl,
    imageUrl,
    imagePath,
    requestId: result.requestId,
    model: modelId,
    seed: resolvedSeed,
    cached: false,
  };
  if (imagePath) writeCache(cacheKey, payload, 7 * 24 * 60 * 60 * 1000);
  return payload;
}

export function resolveSegmentImageUrl(slide, { publicBaseUrl } = {}) {
  const fromSlide = String(slide?.fal_image_url || "").trim();
  if (fromSlide.startsWith("http")) return fromSlide;
  const base = (
    publicBaseUrl ??
    resolveEnv(
      "FAL_PUBLIC_BASE_URL",
      resolveEnv("HIGGSFIELD_PUBLIC_BASE_URL", ""),
    )
  ).replace(/\/$/, "");
  const asset = String(slide?.background_asset || "").trim();
  if (base && asset.startsWith("/")) return `${base}${asset}`;
  throw new Error(
    "reel segment needs a public image URL: run art:fal first (stores fal_image_url) or set FAL_PUBLIC_BASE_URL where backgrounds are hosted over HTTPS",
  );
}

export function motionPromptForBeat(beat, slide) {
  const motion = String(beat?.motion || "slow cinematic push-in").trim();
  const dir = String(
    slide?.visual_direction || slide?.visual_prompt || "",
  ).trim();
  const cinematic = motion.toLowerCase().includes("end card")
    ? "subtle ambient drift, minimal motion"
    : motion;
  if (!dir)
    return `Smooth cinematic camera motion: ${cinematic}. Dark cybersecurity aesthetic, no text, no logos.`;
  return `Smooth cinematic motion (${cinematic}). Visual context: ${dir}. Dark moody lighting, no text, no logos.`;
}

export async function generateVideoFromImage({
  imageUrl,
  prompt,
  model = DEFAULT_VIDEO_MODEL,
  durationSeconds,
  cacheBreaker = "",
  outDir,
  outName,
  timeoutMs = 900_000,
}) {
  const catalog = catalogEntry(model);
  if (catalog?.type !== "video")
    throw new Error(`UnknownFalVideoModel: ${model}`);
  const apiModelId = catalog.apiModelId;
  const duration = Number.isFinite(durationSeconds)
    ? Math.min(10, Math.max(3, Math.round(durationSeconds)))
    : (catalog.defaultDuration ?? 5);

  const cacheKey = promptHash(
    `${imageUrl}\n${prompt}`,
    model,
    1080,
    1920,
    duration,
    cacheBreaker,
  );
  const cached = readCache(cacheKey);
  if (cached?.videoPath && existsSync(cached.videoPath)) {
    return {
      videoPath: cached.videoPath,
      provider: "fal",
      model,
      duration,
      cached: true,
    };
  }

  if (!outDir || !outName)
    throw new Error("generateVideoFromImage requires outDir and outName");

  const fal = await getFal();
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    Math.max(1_000, timeoutMs),
  );
  try {
    const result = await fal.subscribe(apiModelId, {
      input: {
        prompt,
        image_url: imageUrl,
        duration: String(duration),
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs
            ?.map((log) => log.message)
            .forEach((m) => {
              console.log(`  FAL i2v: ${m}`);
            });
        }
      },
    });
    const videoUrl = result.data?.video?.url ?? result.data?.videos?.[0]?.url;
    if (!videoUrl)
      throw new Error("FAL i2v completed but no video.url in response");
    const videoPath = path.join(outDir, outName);
    await downloadVideoToFile(videoUrl, videoPath, controller.signal);
    const payload = {
      videoPath,
      provider: "fal",
      model,
      duration,
      videoUrl,
      cached: false,
    };
    writeCache(cacheKey, { ...payload, videoPath }, 7 * 24 * 60 * 60 * 1000);
    return payload;
  } finally {
    clearTimeout(timer);
  }
}

// Mutates the passed-in `post` object (the caller's single source of truth) and persists it.
// Reading a fresh copy from disk here would be clobbered by the caller's own final write, so we
// patch the shared object instead — incremental per-slide writes still persist correctly.
function updatePostJson(
  post,
  postPath,
  prefix,
  destName,
  slideIndex,
  model,
  falImageUrl,
) {
  const assetPath = `/backgrounds/${prefix}/${destName}`;
  const slide = post.slides?.[slideIndex];
  if (!slide)
    throw new Error(
      `FAL write failed: slide index ${slideIndex} missing from ${postPath}`,
    );

  slide.background_asset = assetPath;
  slide.asset_status = "generated";
  if (falImageUrl && String(falImageUrl).startsWith("http")) {
    slide.fal_image_url = falImageUrl;
  }

  post.asset_licenses = Array.isArray(post.asset_licenses)
    ? post.asset_licenses
    : [];
  if (!post.asset_licenses.some((l) => l?.asset === assetPath)) {
    post.asset_licenses.push({
      asset: assetPath,
      source: `FAL.ai / ${model}`,
      license_or_terms:
        "Subject to fal.ai terms of service; confirm commercial use before publish.",
      commercial_use_allowed: false,
      disclosure_required: true,
      notes: "Generated via fal-client.mjs",
    });
  }

  post.renderMetadata = {
    provider: "fal",
    model,
    costEstimate:
      typeof post.renderMetadata?.costEstimate === "number"
        ? post.renderMetadata.costEstimate
        : null,
  };

  writeFileSync(postPath, `${JSON.stringify(post, null, 2)}\n`, "utf8");
  return assetPath;
}

export async function renderSlide({
  post,
  slideIndex,
  prompt,
  model,
  negativePrompt,
  width,
  height,
  seed,
  cacheBreaker = "",
  timeoutMs = 600_000,
}) {
  const prefix = post?.upload_package?.filename_prefix;
  if (!prefix)
    throw new Error(
      "post.upload_package.filename_prefix is required for FAL output paths",
    );

  const outDir = path.join(RENDERER, "public", "backgrounds", prefix);
  mkdirSync(outDir, { recursive: true });
  const slide = post?.slides?.[slideIndex];
  const outName = backgroundFileName({
    slide: slide?.slide ?? slideIndex + 1,
    role: slide?.role ?? `slide-${slideIndex + 1}`,
  });

  const generated = await generateImage({
    prompt,
    model,
    negativePrompt,
    width,
    height,
    seed,
    cacheBreaker,
    outDir,
    outName,
    timeoutMs,
  });

  const postPath = path.join(
    RENDERER,
    "content",
    "posts",
    `${post.post_id}.json`,
  );
  const assetPath = updatePostJson(
    post,
    postPath,
    prefix,
    outName,
    slideIndex,
    model,
    generated.imageUrl,
  );

  return {
    imagePath: path.join(outDir, outName),
    assetPath,
    provider: "fal",
    model,
    seed: generated.seed ?? seed,
    cached: generated.cached ?? false,
  };
}

export default {
  MODEL_CATALOG,
  DEFAULT_IMAGE_MODEL,
  DEFAULT_VIDEO_MODEL,
  buildNegativePrompt,
  healthCheck,
  estimateCost,
  generateImage,
  generateVideoFromImage,
  renderSlide,
  promptHash,
  resolveSegmentImageUrl,
  motionPromptForBeat,
};
