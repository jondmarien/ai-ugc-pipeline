/// <reference types="node" />

// higgsfield-client.mjs
//
// Higgsfield integration adapter for ai-ugc-pipeline.
//
// Responsibilities
// - authenticate via HF_CREDENTIALS / env (no secrets in repo)
// - generate images through Higgsfield's Cloud API / CLI / SDK surface
// - write assets into renderer/public/backgrounds/<prefix>/NN_role.png
// - patch post JSON: background_asset, asset_status, asset_licenses
// - retry + jittered backoff + per-slide timeout + caching
// - expose: generateImage(), estimateCost(), healthCheck(), MODEL_CATALOG
//
// Implementation notes
// - This module is intentionally provider-agnostic where possible. The HTTP path is the
//   primary integration target; the CLI path lets operators keep using an installed
//   Higgsfield client if API access is gated. Swap providers by replacing the internal
//   request() call sites.
// - Credentials are read from process.env only. Do not stash tokens in JSON, cache keys,
//   or logs.
// - Cache lives under renderer/.cache/higgsfield/ and is keyed on (model, prompt hash,
//   seed, width, height). A credential change does NOT invalidate the cache; the caller
//   must bump a cache breaker (e.g. pass a non-default cacheBreaker) when switching
//   accounts or models.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const RENDERER = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const CACHE_DIR = path.join(RENDERER, ".cache", "higgsfield");

const DEFAULT_PLATFORM_URL = "https://platform.higgsfield.ai";

export const MODEL_CATALOG = Object.freeze({
  // Image-first set per approved architecture; apiModelId is the Higgsfield platform path.
  // Video models are catalogued for future reel/b-roll paths (not used by art:higgsfield yet).
  image: [
    { id: "soul-2.0", name: "Soul 2.0", type: "image", apiModelId: "higgsfield-ai/soul/standard", defaultSize: [1024, 1280], aspectRatio: "4:5", resolution: "720p" },
    { id: "cinema-studio-3.0", name: "Cinema Studio 3.0", type: "image", apiModelId: "higgsfield-ai/soul/standard", defaultSize: [1024, 1280], aspectRatio: "4:5", resolution: "720p" },
    { id: "flux", name: "Flux", type: "image", apiModelId: "reve/text-to-image", defaultSize: [1024, 1280], aspectRatio: "4:5", resolution: "720p" },
    { id: "gpt-image-2", name: "GPT Image 2", type: "image", apiModelId: "reve/text-to-image", defaultSize: [1024, 1280], aspectRatio: "4:5", resolution: "720p" },
    { id: "seedream-4.5", name: "Seedream 4.5", type: "image", apiModelId: "reve/text-to-image", defaultSize: [1024, 1280], aspectRatio: "4:5", resolution: "720p" },
  ],
  video: [
    { id: "dop", name: "DoP Standard", type: "video", apiModelId: "higgsfield-ai/dop/standard", defaultDuration: 5, aspectRatio: "9:16" },
    { id: "kling-3.0", name: "Kling 3.0", type: "video", apiModelId: "kling-video/v2.1/pro/image-to-video", defaultDuration: 5, aspectRatio: "9:16" },
    { id: "seedance-2.0", name: "Seedance 2.0", type: "video", apiModelId: "bytedance/seedance/v1/pro/image-to-video", defaultDuration: 5, aspectRatio: "9:16" },
    { id: "veo-3.1", name: "Veo 3.1", type: "video", apiModelId: "bytedance/seedance/v1/pro/image-to-video", defaultDuration: 5, aspectRatio: "9:16" },
  ],
});

export const DEFAULT_IMAGE_MODEL = MODEL_CATALOG.image[0]?.id ?? "soul-2.0";
export const DEFAULT_VIDEO_MODEL = process.env.HIGGSFIELD_VIDEO_MODEL?.trim() || "dop";

function resolveEnv(name, fallback) {
  const v = process.env[name];
  return v !== undefined && v !== null && String(v).length ? String(v) : fallback;
}

export function buildNegativePrompt() {
  // Mirrors art-comfyui's guardrails so Higgsfield outputs match the same text-free contract.
  return [
    "text, words, letters, numbers, typography, captions, subtitles, labels, signage, logo, watermark",
    "garbled text, random characters, fake words, gibberish, fake writing, handwriting, paragraph of text",
    "document, spreadsheet, calendar grid, source code, terminal window, user interface, dashboard",
    "control panel, charts, graphs, diagrams, icons",
  ].join(", ");
}

function sha1(str) {
  try {
    if (typeof createHash === "function") {
      return createHash("sha1").update(str).digest("hex");
    }
  } catch {
    // fall through to pure fallback on unsupported environments
  }
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
  } catch {
    // missing or corrupt => miss
  }
  return null;
}

function writeCache(key, value, ttlMs) {
  try {
    mkdirSync(CACHE_DIR, { recursive: true });
    const payload = { ...value, cachedAt: Date.now(), expiresAt: Date.now() + ttlMs };
    writeFileSync(cachePathForKey(key), JSON.stringify(payload), "utf8");
  } catch {
    // cache writes must never break generation
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function jitter(ms) {
  const jitterMs = Math.floor(Math.random() * Math.max(0, ms) * 0.25);
  await sleep(ms + jitterMs);
}

function buildRetrySchedule() {
  return [2_000, 5_000, 15_000];
}

function isRetryableStatus(status) {
  if (!status) return false;
  const code = typeof status === "number" ? status : Number(status);
  return code === 429 || code === 502 || code === 503 || code === 504;
}

function isAuthStatus(status) {
  if (!status) return false;
  const code = typeof status === "number" ? status : Number(status);
  return code === 401 || code === 403;
}

function parseRetryAfterSeconds(headers) {
  try {
    const val =
      (headers && (headers["retry-after"] ?? headers["Retry-After"])) ??
      null;
    if (!val) return null;
    const n = Number(val);
    if (Number.isFinite(n) && n > 0) return Math.min(n, 120);
  } catch {
    // ignore malformed header
  }
  return null;
}

function headersToObject(source) {
  if (!source) return {};
  const out = {};
  for (const k of Object.keys(source)) out[k] = source[k];
  return out;
}

function resolveAuthHeader() {
  const key = resolveEnv("HIGGSFIELD_API_KEY", "").trim();
  const secret = resolveEnv("HIGGSFIELD_API_SECRET", "").trim();
  if (key && secret) return `Key ${key}:${secret}`;
  const combo = resolveEnv("HF_CREDENTIALS", "").trim() || resolveEnv("HIGGSFIELD_API_TOKEN", "").trim();
  if (!combo) return "";
  if (combo.includes(":")) return `Key ${combo}`;
  throw new Error(
    "higgsfield auth misconfigured: set HIGGSFIELD_API_KEY + HIGGSFIELD_API_SECRET, or HF_CREDENTIALS as key:secret",
  );
}

async function request(pathname, opts = {}) {
  const baseUrl = resolveEnv("HIGGSFIELD_API_URL", DEFAULT_PLATFORM_URL).replace(/\/$/, "");
  if (!baseUrl) {
    throw new Error(
      "higgsfield client misconfigured: set HIGGSFIELD_API_URL (default https://platform.higgsfield.ai) and API credentials",
    );
  }

  const url = pathname.startsWith("http") ? pathname : `${baseUrl}${pathname.startsWith("/") ? "" : "/"}${pathname}`;
  const auth = resolveAuthHeader();
  if (!auth) {
    throw new Error("higgsfield auth missing: HIGGSFIELD_API_KEY/SECRET or HF_CREDENTIALS (key:secret) is empty");
  }

  const method = (opts.method ?? "GET").toUpperCase();
  const headers = {
    Authorization: auth,
    Accept: "application/json",
    "Content-Type": "application/json",
    ...headersToObject(opts.headers),
  };

  const res = await fetch(url, {
    method,
    headers,
    signal: opts.signal,
    body: method !== "GET" && method !== "HEAD" ? JSON.stringify(opts.body ?? {}) : undefined,
  });

  const text = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }

  if (!res.ok) {
    const err = new Error(`higgsfield ${method} ${pathname} failed: ${res.status}`);
    err.status = res.status;
    err.body = parsed;
    err.headers = headersToObject(res.headers);
    throw err;
  }

  return parsed;
}

export async function healthCheck() {
  const baseUrl = resolveEnv("HIGGSFIELD_API_URL", DEFAULT_PLATFORM_URL).replace(/\/$/, "");
  resolveAuthHeader();
  return { ok: true, baseUrl, message: "credentials present" };
}

function catalogEntry(model) {
  return [MODEL_CATALOG.image, MODEL_CATALOG.video].flat().find((m) => m.id === model);
}

function aspectRatioForSize(width, height) {
  const w = Number.isFinite(width) ? width : 1024;
  const h = Number.isFinite(height) ? height : 1280;
  const r = w / h;
  if (Math.abs(r - 4 / 5) < 0.08) return "4:5";
  if (Math.abs(r - 16 / 9) < 0.08) return "16:9";
  if (Math.abs(r - 9 / 16) < 0.08) return "9:16";
  if (Math.abs(r - 1) < 0.08) return "1:1";
  return w >= h ? "16:9" : "9:16";
}

async function pollRequestStatus(statusUrl, { timeoutMs, signal }) {
  const deadline = Date.now() + timeoutMs;
  const pollMs = 2_500;
  while (Date.now() < deadline) {
    if (signal?.aborted) throw new Error("aborted");
    const status = await request(statusUrl, { method: "GET", signal });
    const st = status?.status;
    if (st === "completed") return status;
    if (st === "failed" || st === "nsfw") {
      const err = new Error(`higgsfield generation ${st}`);
      err.status = 422;
      err.body = status;
      throw err;
    }
    await sleep(pollMs);
  }
  const timeoutErr = new Error(`higgsfield generation timed out after ${timeoutMs}ms`);
  timeoutErr.status = 504;
  throw timeoutErr;
}

async function downloadImageToFile(imageUrl, destPath, signal) {
  const res = await fetch(imageUrl, { signal });
  if (!res.ok) throw new Error(`higgsfield image download failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  mkdirSync(path.dirname(destPath), { recursive: true });
  writeFileSync(destPath, buf);
  return destPath;
}

async function downloadVideoToFile(videoUrl, destPath, signal) {
  const res = await fetch(videoUrl, { signal });
  if (!res.ok) throw new Error(`higgsfield video download failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  mkdirSync(path.dirname(destPath), { recursive: true });
  writeFileSync(destPath, buf);
  return destPath;
}

/** Resolve a publicly fetchable image URL for image-to-video (Higgsfield servers must reach it). */
export function resolveSegmentImageUrl(slide, { publicBaseUrl } = {}) {
  const fromSlide = String(slide?.higgsfield_image_url || "").trim();
  if (fromSlide.startsWith("http")) return fromSlide;
  const base = (publicBaseUrl ?? resolveEnv("HIGGSFIELD_PUBLIC_BASE_URL", "")).replace(/\/$/, "");
  const asset = String(slide?.background_asset || "").trim();
  if (base && asset.startsWith("/")) return `${base}${asset}`;
  throw new Error(
    "reel segment needs a public image URL: run art:higgsfield first (stores higgsfield_image_url) or set HIGGSFIELD_PUBLIC_BASE_URL where backgrounds are hosted over HTTPS",
  );
}

export function motionPromptForBeat(beat, slide) {
  const motion = String(beat?.motion || "slow cinematic push-in").trim();
  const dir = String(slide?.visual_direction || slide?.visual_prompt || "").trim();
  const cinematic = motion.toLowerCase().includes("end card") ? "subtle ambient drift, minimal motion" : motion;
  if (!dir) return `Smooth cinematic camera motion: ${cinematic}. Dark cybersecurity aesthetic, no text, no logos.`;
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
  if (!catalog || catalog.type !== "video") throw new Error(`UnknownHiggsfieldVideoModel: ${model}`);
  const apiModelId = catalog.apiModelId ?? catalog.id;
  const duration = Number.isFinite(durationSeconds)
    ? Math.min(10, Math.max(3, Math.round(durationSeconds)))
    : catalog.defaultDuration ?? 5;

  const cacheKey = promptHash(`${imageUrl}\n${prompt}`, model, 1080, 1920, duration, cacheBreaker);
  const cached = readCache(cacheKey);
  if (cached?.videoPath && existsSync(cached.videoPath)) {
    return { videoPath: cached.videoPath, provider: "higgsfield", model, duration, cached: true };
  }

  const body = { image_url: imageUrl, prompt, duration };
  const schedule = buildRetrySchedule();
  let lastErr;
  for (let attempt = 0; attempt <= schedule.length; attempt++) {
    if (attempt > 0) {
      const ra = lastErr?.retryAfterSeconds ?? schedule[attempt - 1];
      await jitter(ra * 1000);
    }
    const started = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.max(1_000, timeoutMs));
    try {
      const queued = await request(`/${apiModelId}`, { method: "POST", body, signal: controller.signal });
      const statusUrl = queued?.status_url ?? (queued?.request_id ? `/requests/${queued.request_id}/status` : null);
      if (!statusUrl) throw new Error("higgsfield video response missing status_url / request_id");
      const completed = await pollRequestStatus(statusUrl, {
        timeoutMs: timeoutMs - (Date.now() - started),
        signal: controller.signal,
      });
      const videoUrl = completed?.video?.url ?? completed?.videos?.[0]?.url;
      if (!videoUrl) throw new Error("higgsfield video job completed but no video.url in response");
      if (!outDir || !outName) throw new Error("generateVideoFromImage requires outDir and outName");
      const videoPath = path.join(outDir, outName);
      await downloadVideoToFile(videoUrl, videoPath, controller.signal);
      const result = { videoPath, provider: "higgsfield", model, duration, videoUrl, cached: false };
      writeCache(cacheKey, { ...result, videoPath }, 7 * 24 * 60 * 60 * 1000);
      return result;
    } catch (e) {
      lastErr = e;
      const status = e?.status ?? 0;
      if (isAuthStatus(status)) throw e;
      if (isRetryableStatus(status) && attempt < schedule.length) continue;
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
}

export async function estimateCost(model, width, height) {
  // Placeholder accounting hook. Real cost estimation should be supplied by the Higgsfield
  // provider once rate cards / credit meters are confirmed.
  const catalog = catalogEntry(model);
  if (!catalog) throw new Error(`UnknownHiggsfieldModel: ${model}`);
  const w = Number.isFinite(width) ? width : 1024;
  const h = Number.isFinite(height) ? height : 1280;
  const pixels = w * h;
  const unit = catalog.type === "video" ? 1_920_000 : 1_040_000;
  const base = 0.015;
  return Number((base * (pixels / unit)).toFixed(4));
}

export async function generateImage({
  prompt,
  model = DEFAULT_IMAGE_MODEL,
  negativePrompt = buildNegativePrompt(),
  width = 1024,
  height = 1280,
  seed,
  refs = [],
  cacheBreaker = "",
  post,
  slide,
  outDir,
  outName,
  timeoutMs = 600_000,
}) {
  const resolvedSeed = Number.isFinite(seed) ? seed : Math.floor(Math.random() * 2 ** 31);
  const cacheKey = promptHash(prompt, model, width, height, resolvedSeed, cacheBreaker);
  const cached = readCache(cacheKey);
  if (cached?.imagePath && existsSync(cached.imagePath)) {
    return {
      imagePath: cached.imagePath,
      provider: cached.provider ?? "higgsfield",
      model,
      seed: resolvedSeed,
      cached: true,
    };
  }

  const catalog = catalogEntry(model);
  if (!catalog) throw new Error(`UnknownHiggsfieldModel: ${model}`);
  const apiModelId = catalog.apiModelId ?? catalog.id;
  const aspectRatio = catalog.aspectRatio ?? aspectRatioForSize(width, height);
  const resolution = catalog.resolution ?? "720p";

  const fullPrompt = negativePrompt?.trim()
    ? `${prompt}. Avoid: ${negativePrompt}`
    : prompt;

  const body = {
    prompt: fullPrompt,
    aspect_ratio: aspectRatio,
    resolution,
  };

  const schedule = buildRetrySchedule();
  let lastErr;
  for (let attempt = 0; attempt <= schedule.length; attempt++) {
    if (attempt > 0) {
      const ra = lastErr?.retryAfterSeconds ?? schedule[attempt - 1];
      await jitter(ra * 1000);
    }

    const started = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.max(1_000, timeoutMs));
    try {
      const queued = await request(`/${apiModelId}`, {
        method: "POST",
        body,
        signal: controller.signal,
      });
      const statusUrl = queued?.status_url ?? (queued?.request_id ? `/requests/${queued.request_id}/status` : null);
      if (!statusUrl) {
        throw new Error("higgsfield provider response missing status_url / request_id");
      }
      const completed = await pollRequestStatus(statusUrl, {
        timeoutMs: timeoutMs - (Date.now() - started),
        signal: controller.signal,
      });
      const imageUrl = completed?.images?.[0]?.url ?? completed?.image?.url ?? completed?.imageUrl;
      if (!imageUrl) {
        throw new Error("higgsfield completed job but no image URL in response");
      }

      if (!outDir || !outName) {
        throw new Error("higgsfield generateImage requires outDir and outName to persist PNG");
      }
      mkdirSync(outDir, { recursive: true });
      const imagePath = path.join(outDir, outName);
      await downloadImageToFile(imageUrl, imagePath, controller.signal);

      const result = {
        imagePath,
        provider: "higgsfield",
        model,
        seed: resolvedSeed,
        cached: false,
        imageUrl,
      };
      writeCache(cacheKey, result, 7 * 24 * 60 * 60 * 1000);
      return result;
    } catch (e) {
      lastErr = e;
      const status = e?.status ?? 0;

      if (isAuthStatus(status)) {
        const fatal = new Error(`higgsfield auth error (${status})`);
        fatal.status = status;
        fatal.body = e.body;
        throw fatal;
      }

      if (isRetryableStatus(status) && attempt < schedule.length) {
        continue;
      }

      if (Date.now() - started >= timeoutMs || e?.message === "aborted") {
        const timeoutErr = new Error(`higgsfield generation timed out after ${timeoutMs}ms`);
        timeoutErr.status = 504;
        throw timeoutErr;
      }

      throw e;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastErr;
}

function updatePostJson(postPath, prefix, destName, slideIndex, model, providerLabel, licenseTermsOverride, higgsfieldImageUrl) {
  const post = JSON.parse(readFileSync(postPath, "utf8"));
  const assetPath = `/backgrounds/${prefix}/${destName}`;
  const slide = post.slides?.[slideIndex];
  if (!slide) throw new Error(`Higgsfield write failed: slide index ${slideIndex} missing from ${postPath}`);

  slide.background_asset = assetPath;
  slide.asset_status = "generated";
  if (higgsfieldImageUrl && String(higgsfieldImageUrl).startsWith("http")) {
    slide.higgsfield_image_url = higgsfieldImageUrl;
  }

  post.asset_licenses = Array.isArray(post.asset_licenses) ? post.asset_licenses : [];
  if (!post.asset_licenses.some((l) => l?.asset === assetPath)) {
    post.asset_licenses.push({
      asset: assetPath,
      source: `${providerLabel ?? "Higgsfield"} / ${model}`,
      license_or_terms: licenseTermsOverride ?? "Pending confirmation from Higgsfield provider terms.",
      commercial_use_allowed: false,
      disclosure_required: true,
      notes: "Generated via higgsfield-client.mjs; license terms to be confirmed with provider before publish.",
    });
  }

  post.renderMetadata = {
    provider: providerLabel ?? "higgsfield",
    model,
    costEstimate: typeof post.renderMetadata?.costEstimate === "number" ? post.renderMetadata.costEstimate : null,
  };

  writeFileSync(postPath, JSON.stringify(post, null, 2) + "\n", "utf8");
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
  refs = [],
  cacheBreaker = "",
  timeoutMs,
  providerLabel = "Higgsfield",
  licenseTermsOverride,
}) {
  const prefix = post?.upload_package?.filename_prefix;
  if (!prefix) throw new Error("post.upload_package.filename_prefix is required for Higgsfield output paths");

  const outDir = path.join(RENDERER, "public", "backgrounds", prefix);
  mkdirSync(outDir, { recursive: true });
  const role = slideIndex >= 0 && post?.slides?.[slideIndex]?.role
    ? post.slides[slideIndex].role
    : `slide-${slideIndex + 1}`;
  const nn = String((post?.slides?.[slideIndex]?.slide ?? slideIndex + 1)).padStart(2, "0");
  // Match existing pipeline naming so import-bg/export never notice the difference.
  const outName = `${nn}_${role}.png`;

  const generated = await generateImage({
    prompt,
    model,
    negativePrompt,
    width,
    height,
    seed,
    refs,
    cacheBreaker,
    post,
    slide: post?.slides?.[slideIndex],
    outDir,
    outName,
    timeoutMs,
  });

  const postPath = path.join(RENDERER, "content", "posts", `${post.post_id}.json`);
  const assetPath = updatePostJson(
    postPath,
    prefix,
    outName,
    slideIndex,
    model,
    providerLabel,
    licenseTermsOverride,
    generated.imageUrl,
  );

  return {
    imagePath: path.join(outDir, outName),
    assetPath,
    provider: providerLabel,
    model,
    seed: generated.seed ?? seed,
    cached: generated.cached ?? false,
  };
}

export default {
  MODEL_CATALOG,
  DEFAULT_IMAGE_MODEL,
  DEFAULT_VIDEO_MODEL,
  healthCheck,
  estimateCost,
  generateImage,
  generateVideoFromImage,
  renderSlide,
  promptHash,
  buildNegativePrompt,
  resolveSegmentImageUrl,
  motionPromptForBeat,
};
