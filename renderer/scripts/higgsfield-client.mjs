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

export const MODEL_CATALOG = Object.freeze({
  // Image-first set per approved architecture; video models can be added as the video
  // path is wired (P2: Kling 3.0 / Seedance 2.0 / Veo 3.1).
  image: [
    { id: "soul-2.0", name: "Soul 2.0", type: "image", defaultSize: [1024, 1280] },
    { id: "cinema-studio-3.0", name: "Cinema Studio 3.0", type: "image", defaultSize: [1024, 1280] },
    { id: "flux", name: "Flux", type: "image", defaultSize: [1024, 1280] },
    { id: "gpt-image-2", name: "GPT Image 2", type: "image", defaultSize: [1024, 1280] },
    { id: "seedream-4.5", name: "Seedream 4.5", type: "image", defaultSize: [1024, 1280] },
  ],
  video: [
    { id: "kling-3.0", name: "Kling 3.0", type: "video", defaultSize: [1024, 1792] },
    { id: "seedance-2.0", name: "Seedance 2.0", type: "video", defaultSize: [1024, 1792] },
    { id: "veo-3.1", name: "Veo 3.1", type: "video", defaultSize: [1280, 720] },
  ],
});

export const DEFAULT_IMAGE_MODEL = MODEL_CATALOG.image[0]?.id ?? "soul-2.0";

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

async function request(pathname, opts = {}) {
  // Real implementation will hit Higgsfield's Cloud API.
  // For now, return a typed not-implemented error so callers fail fast and the
  // integration boundary is explicit.
  const baseUrl = resolveEnv("HIGGSFIELD_API_URL", "").replace(/\/$/, "");
  if (!baseUrl) {
    throw new Error(
      "higgsfield client misconfigured: set HIGGSFIELD_API_URL (and HIGGSFIELD_API_TOKEN / HF_CREDENTIALS)",
    );
  }

  const url = `${baseUrl}${pathname}`;
  const token = resolveEnv("HIGGSFIELD_API_TOKEN", "").trim() || resolveEnv("HF_CREDENTIALS", "").trim();
  if (!token) {
    throw new Error("higgsfield auth missing: HIGGSFIELD_API_TOKEN or HF_CREDENTIALS is empty");
  }

  const method = (opts.method ?? "GET").toUpperCase();
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...headersToObject(opts.headers),
  };

  const res = await fetch(url, {
    method,
    headers,
    body: method !== "GET" && method !== "HEAD" ? JSON.stringify(opts.body ?? null) : undefined,
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
  // Surface auth / connectivity early so pipeline fails on config, not mid-render.
  return request("/health", { method: "GET" });
}

export async function estimateCost(model, width, height) {
  // Placeholder accounting hook. Real cost estimation should be supplied by the Higgsfield
  // provider once rate cards / credit meters are confirmed.
  const catalog = [MODEL_CATALOG.image, MODEL_CATALOG.video].flat().find((m) => m.id === model);
  if (!catalog) throw new Error(`UnknownHiggsfieldModel: ${model}`);
  const pixels = (width ?? 1024) * (height ?? 1280);
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

  // TODO: replace this request body with the actual Higgsfield generation endpoint + schema.
  const body = {
    model,
    prompt,
    negativePrompt,
    width,
    height,
    seed: resolvedSeed,
    refs,
  };

  const schedule = buildRetrySchedule();
  let lastErr;
  for (let attempt = 0; attempt <= schedule.length; attempt++) {
    if (attempt > 0) {
      const ra = lastErr?.retryAfterSeconds ?? schedule[attempt - 1];
      await jitter(ra * 1000);
    }

    const started = Date.now();
    try {
      // Use an AbortController-backed fetch so we can honor post.timeoutMs cleanly when the
      // underlying environment supports AbortSignal.timeout (Node 18+).
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), Math.max(1_000, timeoutMs));
      let res;
      try {
        res = await Promise.race([
          request("/v1/generate", { method: "POST", body, signal: controller.signal }),
          new Promise((_, reject) => controller.signal.addEventListener("abort", () => reject(new Error("aborted")))),
        ]);
      } finally {
        clearTimeout(timer);
      }

      // TODO: normalize actual Higgsfield response fields here.
      // Intended contract from provider:
      //   { imageUrl, imageBase64, file, provider, model, creditsUsed, expiresAt }
      // Until then, fail fast with a clear message so tests exercise the error path.
      throw new Error(
        "higgsfield provider response not yet wired: expected imageUrl/imageBase64 from /v1/generate",
      );
    } catch (e) {
      lastErr = e;
      const status = e?.status ?? (e?.cause?.code ?? 0);

      if (isAuthStatus(status)) {
        const fatal = new Error(`higgsfield auth error (${status})`);
        fatal.status = status;
        fatal.body = e.body;
        throw fatal;
      }

      if (isRetryableStatus(status) && attempt < schedule.length) {
        continue;
      }

      if (Date.now() - started >= timeoutMs) {
        const timeoutErr = new Error(`higgsfield generation timed out after ${timeoutMs}ms`);
        timeoutErr.status = 504;
        throw timeoutErr;
      }

      throw e;
    }
  }

  // Unreachable: loop either returns or throws above.
  throw lastErr;
}

function updatePostJson(postPath, prefix, destName, slideIndex, model, providerLabel, licenseTermsOverride) {
  const post = JSON.parse(readFileSync(postPath, "utf8"));
  const assetPath = `/backgrounds/${prefix}/${destName}`;
  const slide = post.slides?.[slideIndex];
  if (!slide) throw new Error(`Higgsfield write failed: slide index ${slideIndex} missing from ${postPath}`);

  slide.background_asset = assetPath;
  slide.asset_status = "generated";

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

  // TODO: replace with real generateImage() once provider endpoint + auth are confirmed.
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
  healthCheck,
  estimateCost,
  generateImage,
  renderSlide,
  promptHash,
  buildNegativePrompt,
};
