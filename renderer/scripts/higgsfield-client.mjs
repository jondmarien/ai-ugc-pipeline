/// <reference types="node" />

// higgsfield-client.mjs
//
// Higgsfield integration adapter for ai-ugc-pipeline.
//
// Responsibilities
// - authenticate via the installed `higgsfield` CLI (cli mode) or HF_CREDENTIALS / env (rest mode)
// - generate images through Higgsfield (CLI `generate create`, or the HTTP platform API)
// - write assets into renderer/public/backgrounds/<prefix>/NN_role.png
// - patch post JSON: background_asset, asset_status, asset_licenses, higgsfield_image_url
// - retry + jittered backoff + per-slide timeout + caching
// - expose: generateImage(), estimateCost(), healthCheck(), MODEL_CATALOG, resolveMode()
//
// Provider modes (resolveMode):
// - "cli"  : shell out to the authed `higgsfield` CLI (default when no REST creds are set).
//            No API key needed; the CLI carries its own auth token. CLI auto-uploads local
//            files for image-to-video, so no public asset hosting is required.
// - "rest" : HTTP platform API at HIGGSFIELD_API_URL with HIGGSFIELD_API_KEY/SECRET
//            (or HF_CREDENTIALS=key:secret). Used automatically when those creds are present.
// - "mcp"  : agent-driven. A headless script cannot call the Claude MCP, so mcp mode is
//            handled out-of-band via higgsfield-mcp.mjs (buildArtPlan/ingestArtPlan): an agent
//            (Claude / Hermes) generates each slide through the MCP generate_image tool, then
//            the pipeline ingests the produced PNGs. renderSlide() does not run in mcp mode.
//
// Implementation notes
// - Mode is resolved from --mode / HIGGSFIELD_MODE, else auto: rest if creds present, else cli.
// - CLI binary is resolved from HIGGSFIELD_CLI_BIN, else `hf`/`higgsfield` on PATH. The native
//   `hf(.exe)` is preferred (spawned without a shell so prompts with spaces/punctuation are safe).
// - Credentials are read from process.env / the CLI's own store only. Never stash tokens in
//   JSON, cache keys, or logs.
// - Cache lives under renderer/.cache/higgsfield/ and is keyed on (model, prompt hash, seed,
//   width, height). A credential change does NOT invalidate the cache; bump cacheBreaker when
//   switching accounts or models.

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildNegativePrompt as buildNegativePromptFromLib } from "./lib/flux-negative-prompt.mjs";
import { backgroundFileName } from "./lib/slide-filename.mjs";

const RENDERER = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const CACHE_DIR = path.join(RENDERER, ".cache", "higgsfield");

const DEFAULT_PLATFORM_URL = "https://platform.higgsfield.ai";

export const MODEL_CATALOG = Object.freeze({
  // Image-first set per approved architecture.
  // - apiModelId    : Higgsfield HTTP platform path (rest mode).
  // - cliJobSetType : the `higgsfield generate create <job_set_type>` id (cli mode), verified
  //                   against `higgsfield model list`.
  // - cliExtraArgs  : per-model CLI flags (quality/resolution); aspect_ratio is added at call time.
  // - mcpModel      : a hint for the MCP generate_image tool (mcp mode); the agent may override
  //                   via models_explore.
  // Note: the CLI/platform image models accept 3:4 (not 4:5); aspect 4:5 is mapped to 3:4.
  // promptFamily → which composer in art-slide-prompt.mjs shapes the prompt (flux keeps a real
  // negative; soul/seedream/gpt are positive-only). creditCost → credits per image (verified via
  // `higgsfield generate cost`); null = unknown / not a plain text→image (e.g. cinematic_studio_image
  // requires camera params we don't supply — kept for compatibility but not recommended).
  image: [
    {
      id: "soul-2.0",
      name: "Soul 2.0",
      type: "image",
      apiModelId: "higgsfield-ai/soul/standard",
      cliJobSetType: "text2image_soul_v2",
      cliExtraArgs: ["--quality", "2k"],
      mcpModel: "soul",
      promptFamily: "soul",
      creditCost: 0.12,
      defaultSize: [1024, 1280],
      aspectRatio: "4:5",
      resolution: "720p",
    },
    {
      id: "cinema-studio-3.0",
      name: "Cinema Studio 3.0",
      type: "image",
      apiModelId: "higgsfield-ai/soul/standard",
      cliJobSetType: "cinematic_studio_image",
      cliExtraArgs: [],
      mcpModel: "soul",
      promptFamily: "soul",
      creditCost: null,
      defaultSize: [1024, 1280],
      aspectRatio: "4:5",
      resolution: "720p",
    },
    {
      id: "flux",
      name: "Flux",
      type: "image",
      apiModelId: "reve/text-to-image",
      cliJobSetType: "flux_2",
      cliExtraArgs: ["--resolution", "2k"],
      mcpModel: "flux",
      promptFamily: "flux",
      creditCost: 1,
      defaultSize: [1024, 1280],
      aspectRatio: "4:5",
      resolution: "720p",
    },
    {
      id: "gpt-image-2",
      name: "GPT Image 2",
      type: "image",
      apiModelId: "reve/text-to-image",
      cliJobSetType: "gpt_image_2",
      cliExtraArgs: [],
      mcpModel: "gpt-image",
      promptFamily: "gpt",
      creditCost: 7,
      defaultSize: [1024, 1280],
      aspectRatio: "4:5",
      resolution: "720p",
    },
    {
      id: "seedream-4.5",
      name: "Seedream 4.5",
      type: "image",
      apiModelId: "reve/text-to-image",
      cliJobSetType: "seedream_v4_5",
      cliExtraArgs: [],
      mcpModel: "seedream",
      promptFamily: "seedream",
      creditCost: 1,
      defaultSize: [1024, 1280],
      aspectRatio: "4:5",
      resolution: "720p",
    },
  ],
  // creditCost = credits per CLIP (verified via `higgsfield generate cost`). i2v is far pricier than
  // images, so a reel of N beats × this is what the motion budget gate checks.
  video: [
    {
      id: "dop",
      name: "DoP Standard",
      type: "video",
      apiModelId: "higgsfield-ai/dop/standard",
      cliJobSetType: "cinematic_studio_video_v2",
      creditCost: 7.5,
      defaultDuration: 5,
      aspectRatio: "9:16",
    },
    {
      id: "kling-3.0",
      name: "Kling 3.0",
      type: "video",
      apiModelId: "kling-video/v2.1/pro/image-to-video",
      cliJobSetType: "cinematic_studio_video_v2",
      creditCost: 7.5,
      defaultDuration: 5,
      aspectRatio: "9:16",
    },
    {
      id: "seedance-2.0",
      name: "Seedance 2.0",
      type: "video",
      apiModelId: "bytedance/seedance/v1/pro/image-to-video",
      cliJobSetType: "cinematic_studio_video_v2",
      creditCost: 7.5,
      defaultDuration: 5,
      aspectRatio: "9:16",
    },
    {
      id: "veo-3.1",
      name: "Veo 3.1",
      type: "video",
      apiModelId: "bytedance/seedance/v1/pro/image-to-video",
      cliJobSetType: "veo3_1",
      creditCost: 22,
      defaultDuration: 5,
      aspectRatio: "9:16",
    },
  ],
});

// Provider mode resolution. Explicit flag/env wins; otherwise auto: rest when REST creds are
// present, else cli (the CLI carries its own auth so no API key is needed).
const VALID_MODES = Object.freeze(["cli", "rest", "mcp"]);
export function hasRestCreds() {
  const key = resolveEnv("HIGGSFIELD_API_KEY", "").trim();
  const secret = resolveEnv("HIGGSFIELD_API_SECRET", "").trim();
  if (key && secret) return true;
  return !!(
    resolveEnv("HF_CREDENTIALS", "").trim() ||
    resolveEnv("HIGGSFIELD_API_TOKEN", "").trim()
  );
}
export function resolveMode(explicit) {
  const m = String(explicit || process.env.HIGGSFIELD_MODE || "")
    .trim()
    .toLowerCase();
  if (m) {
    if (!VALID_MODES.includes(m))
      throw new Error(
        `UnknownHiggsfieldMode: ${m} (use ${VALID_MODES.join("|")})`,
      );
    return m;
  }
  return hasRestCreds() ? "rest" : "cli";
}

// Default to FLUX.2 (flux_2): our prompts are FLUX-tuned so it follows them faithfully (no text
// "posters"), it's higher quality than Soul, and it costs ~1 cr/img (8–15 cr/carousel). Soul stays
// the cheap (0.12 cr) opt-in via --higgsfield-model=soul-2.0. Override with HIGGSFIELD_IMAGE_MODEL.
export const DEFAULT_IMAGE_MODEL =
  process.env.HIGGSFIELD_IMAGE_MODEL?.trim() || "flux";
export const DEFAULT_VIDEO_MODEL =
  process.env.HIGGSFIELD_VIDEO_MODEL?.trim() || "dop";

function resolveEnv(name, fallback) {
  const v = process.env[name];
  return v !== undefined && v !== null && String(v).length
    ? String(v)
    : fallback;
}

export function buildNegativePrompt() {
  return buildNegativePromptFromLib();
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
    const payload = {
      ...value,
      cachedAt: Date.now(),
      expiresAt: Date.now() + ttlMs,
    };
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
      (headers && (headers["retry-after"] ?? headers["Retry-After"])) ?? null;
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
  const combo =
    resolveEnv("HF_CREDENTIALS", "").trim() ||
    resolveEnv("HIGGSFIELD_API_TOKEN", "").trim();
  if (!combo) return "";
  if (combo.includes(":")) return `Key ${combo}`;
  throw new Error(
    "higgsfield auth misconfigured: set HIGGSFIELD_API_KEY + HIGGSFIELD_API_SECRET, or HF_CREDENTIALS as key:secret",
  );
}

async function request(pathname, opts = {}) {
  const baseUrl = resolveEnv(
    "HIGGSFIELD_API_URL",
    DEFAULT_PLATFORM_URL,
  ).replace(/\/$/, "");
  if (!baseUrl) {
    throw new Error(
      "higgsfield client misconfigured: set HIGGSFIELD_API_URL (default https://platform.higgsfield.ai) and API credentials",
    );
  }

  const url = pathname.startsWith("http")
    ? pathname
    : `${baseUrl}${pathname.startsWith("/") ? "" : "/"}${pathname}`;
  const auth = resolveAuthHeader();
  if (!auth) {
    throw new Error(
      "higgsfield auth missing: HIGGSFIELD_API_KEY/SECRET or HF_CREDENTIALS (key:secret) is empty",
    );
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
    body:
      method !== "GET" && method !== "HEAD"
        ? JSON.stringify(opts.body ?? {})
        : undefined,
  });

  const text = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }

  if (!res.ok) {
    const err = new Error(
      `higgsfield ${method} ${pathname} failed: ${res.status}`,
    );
    err.status = res.status;
    err.body = parsed;
    err.headers = headersToObject(res.headers);
    throw err;
  }

  return parsed;
}

export async function healthCheck(mode) {
  const m = resolveMode(mode);
  if (m === "cli") return { ...cliHealthCheck(), mode: m };
  if (m === "mcp")
    return {
      ok: true,
      baseUrl: "mcp:agent-driven",
      mode: m,
      message: "mcp mode is agent-driven (see higgsfield-mcp.mjs)",
    };
  const baseUrl = resolveEnv(
    "HIGGSFIELD_API_URL",
    DEFAULT_PLATFORM_URL,
  ).replace(/\/$/, "");
  resolveAuthHeader();
  return { ok: true, baseUrl, mode: m, message: "credentials present" };
}

function catalogEntry(model) {
  return [MODEL_CATALOG.image, MODEL_CATALOG.video]
    .flat()
    .find((m) => m.id === model);
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

// ── CLI provider (mode: "cli") ───────────────────────────────────────────────
// The Higgsfield image models accept a fixed aspect_ratio enum that does NOT include 4:5
// (the carousel ratio). Map the canvas ratio to the nearest supported value; portrait → 3:4.
export function cliAspectRatio(width, height) {
  const w = Number.isFinite(width) ? width : 1024;
  const h = Number.isFinite(height) ? height : 1280;
  const r = w / h;
  if (r <= 0.7) return "9:16"; // tall
  if (r < 0.95) return "3:4"; // portrait (covers 4:5 and 3:4)
  if (r <= 1.05) return "1:1";
  if (r < 1.5) return "4:3";
  return "16:9";
}

// Resolve a directly-spawnable CLI binary. Returns { bin, shell }.
//
// Pitfalls this guards against:
// - `hf` is ALSO HuggingFace's CLI on most systems, so it is never used as an auto-candidate
//   (only `higgsfield` / `higgs`, which are unambiguous). HIGGSFIELD_CLI_BIN can still point at
//   an explicit `hf` if you really mean Higgsfield's.
// - The npm `higgsfield` command is a Node shim, not a native exe. We prefer the real vendored
//   binary it wraps (node_modules/@higgsfield/cli/vendor/hf[.exe]) so we can spawn WITHOUT a
//   shell — prompts with spaces/punctuation then pass verbatim, no quoting hazards.
function vendoredBinNextTo(shimPath) {
  // npm global layout: <root>/higgsfield(.cmd) alongside <root>/node_modules/@higgsfield/cli/vendor/hf[.exe]
  const root = path.dirname(shimPath);
  for (const name of ["hf.exe", "hf"]) {
    const candidate = path.join(
      root,
      "node_modules",
      "@higgsfield",
      "cli",
      "vendor",
      name,
    );
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

let _cliBinCache;
export function resolveCliBin() {
  if (_cliBinCache) return _cliBinCache;
  const isWin = process.platform === "win32";
  const override = resolveEnv("HIGGSFIELD_CLI_BIN", "").trim();
  if (override && (override.includes("/") || override.includes("\\"))) {
    const shell = isWin && /\.(cmd|bat|ps1)$/i.test(override);
    _cliBinCache = { bin: override, shell };
    return _cliBinCache;
  }
  const names = override ? [override] : ["higgsfield", "higgs"]; // never bare `hf` (HuggingFace collision)
  const pathDirs = String(process.env.PATH || "")
    .split(path.delimiter)
    .filter(Boolean);
  const exeExts = isWin ? [".exe", "", ".cmd", ".bat"] : [""];
  for (const name of names) {
    for (const dir of pathDirs) {
      for (const ext of exeExts) {
        const candidate = path.join(dir, name + ext);
        if (!existsSync(candidate)) continue;
        // Prefer the real vendored binary the shim wraps (spawn without a shell).
        const vendored = vendoredBinNextTo(candidate);
        if (vendored) {
          _cliBinCache = { bin: vendored, shell: false };
          return _cliBinCache;
        }
        const shell =
          isWin && /\.(cmd|bat|ps1)$/i.test(candidate)
            ? true
            : isWin && ext === "";
        _cliBinCache = { bin: candidate, shell };
        return _cliBinCache;
      }
    }
  }
  // Last resort: rely on the OS to resolve the bare name (shell:true on Windows for .cmd shims).
  _cliBinCache = { bin: names[0], shell: isWin };
  return _cliBinCache;
}

function runCli(args, { timeoutMs, input } = {}) {
  const { bin, shell } = resolveCliBin();
  const res = spawnSync(bin, args, {
    encoding: "utf8",
    timeout: Math.max(1_000, timeoutMs ?? 600_000),
    shell,
    input,
    maxBuffer: 64 * 1024 * 1024,
  });
  if (res.error) {
    const e = new Error(
      `higgsfield CLI spawn failed (${bin}): ${res.error.message}`,
    );
    e.cause = res.error;
    throw e;
  }
  return {
    status: res.status ?? 1,
    stdout: res.stdout ?? "",
    stderr: res.stderr ?? "",
  };
}

// Build the argv for `higgsfield generate create`. Pure + exported for unit tests.
export function buildCliCreateArgs({
  jobSetType,
  prompt,
  aspectRatio,
  extraArgs = [],
  waitTimeout = "10m",
}) {
  if (!jobSetType)
    throw new Error("buildCliCreateArgs: jobSetType is required");
  if (!prompt) throw new Error("buildCliCreateArgs: prompt is required");
  const args = ["generate", "create", jobSetType, "--prompt", prompt];
  if (aspectRatio) args.push("--aspect_ratio", aspectRatio);
  for (const a of extraArgs) args.push(a);
  args.push("--wait", "--wait-timeout", waitTimeout, "--json");
  return args;
}

// Parse `generate create ... --json` output. The CLI prints a JSON array of job objects.
// Pure + exported for unit tests.
export function parseCliCreateJson(text) {
  let data;
  try {
    data = JSON.parse(String(text));
  } catch {
    throw new Error(
      "higgsfield CLI did not return JSON (is --json supported on this version?)",
    );
  }
  const jobs = Array.isArray(data) ? data : [data];
  const job = jobs[0];
  if (!job) throw new Error("higgsfield CLI returned an empty job list");
  if (job.status && job.status !== "completed") {
    const err = new Error(`higgsfield CLI job ${job.status}`);
    err.status = job.status === "nsfw" ? 422 : 500;
    throw err;
  }
  const url =
    job.result_url ??
    job.image?.url ??
    job.images?.[0]?.url ??
    job.video?.url ??
    job.videos?.[0]?.url ??
    job.url;
  if (!url)
    throw new Error(
      "higgsfield CLI job completed but no result_url in response",
    );
  return {
    url,
    id: job.id ?? null,
    seed: job.params?.seed ?? null,
    jobSetType: job.job_set_type ?? null,
  };
}

export function cliHealthCheck() {
  const { bin } = resolveCliBin();
  const r = runCli(["account", "status", "--json"], { timeoutMs: 30_000 });
  if (r.status !== 0) {
    throw new Error(
      `higgsfield CLI not authed/usable (${bin}): ${(r.stderr || r.stdout || "").trim().slice(0, 200)}\n` +
        `Fix: install + log in — npm i -g @higgsfield/cli && higgsfield auth login (or set HIGGSFIELD_CLI_BIN).`,
    );
  }
  return { ok: true, baseUrl: `cli:${bin}`, message: "higgsfield CLI authed" };
}

async function generateImageViaCli({
  prompt,
  model = DEFAULT_IMAGE_MODEL,
  negativePrompt = buildNegativePrompt(),
  width = 1024,
  height = 1280,
  seed,
  cacheBreaker = "",
  outDir,
  outName,
  timeoutMs = 600_000,
}) {
  const catalog = catalogEntry(model);
  if (!catalog || catalog.type !== "image")
    throw new Error(`UnknownHiggsfieldModel: ${model}`);
  const jobSetType = catalog.cliJobSetType;
  if (!jobSetType)
    throw new Error(`Higgsfield model "${model}" has no cliJobSetType mapping`);

  const resolvedSeed = Number.isFinite(seed) ? seed : 0; // CLI assigns its own seed; kept only for the cache key
  const cacheKey = promptHash(
    prompt,
    `cli:${model}`,
    width,
    height,
    resolvedSeed,
    cacheBreaker,
  );
  const cached = readCache(cacheKey);
  if (cached?.imagePath && existsSync(cached.imagePath)) {
    return {
      imagePath: cached.imagePath,
      provider: "higgsfield-cli",
      model,
      seed: cached.seed ?? null,
      imageUrl: cached.imageUrl,
      cached: true,
    };
  }

  const fullPrompt = negativePrompt?.trim()
    ? `${prompt}. Avoid: ${negativePrompt}`
    : prompt;
  const aspectRatio = cliAspectRatio(width, height);
  const args = buildCliCreateArgs({
    jobSetType,
    prompt: fullPrompt,
    aspectRatio,
    extraArgs: catalog.cliExtraArgs ?? [],
    waitTimeout: `${Math.ceil(timeoutMs / 60000)}m`,
  });

  const schedule = buildRetrySchedule();
  let lastErr;
  for (let attempt = 0; attempt <= schedule.length; attempt++) {
    if (attempt > 0) await jitter(schedule[attempt - 1]);
    const r = runCli(args, { timeoutMs });
    if (r.status !== 0) {
      lastErr = new Error(
        `higgsfield CLI generate failed: ${(r.stderr || r.stdout || "").trim().slice(0, 300)}`,
      );
      // CLI errors are usually deterministic (bad params/auth) — only retry on transient hints.
      if (
        /timeout|temporarily|rate|429|503|502|504/i.test(r.stderr || "") &&
        attempt < schedule.length
      )
        continue;
      throw lastErr;
    }
    const { url, seed: returnedSeed } = parseCliCreateJson(r.stdout);
    if (!outDir || !outName)
      throw new Error(
        "generateImageViaCli requires outDir and outName to persist PNG",
      );
    mkdirSync(outDir, { recursive: true });
    const imagePath = path.join(outDir, outName);
    await downloadImageToFile(url, imagePath);
    const result = {
      imagePath,
      provider: "higgsfield-cli",
      model,
      seed: returnedSeed,
      imageUrl: url,
      cached: false,
    };
    writeCache(cacheKey, result, 7 * 24 * 60 * 60 * 1000);
    return result;
  }
  throw lastErr ?? new Error("higgsfield CLI generate failed");
}

async function generateVideoFromImageViaCli({
  imageUrl,
  imagePath,
  prompt,
  model = DEFAULT_VIDEO_MODEL,
  durationSeconds,
  cacheBreaker = "",
  outDir,
  outName,
  timeoutMs = 900_000,
}) {
  const catalog = catalogEntry(model);
  if (!catalog || catalog.type !== "video")
    throw new Error(`UnknownHiggsfieldVideoModel: ${model}`);
  const jobSetType = catalog.cliJobSetType;
  if (!jobSetType)
    throw new Error(
      `Higgsfield video model "${model}" has no cliJobSetType mapping`,
    );
  // The CLI auto-uploads a local path, so we can hand it the on-disk PNG (no public hosting).
  const imageRef = imagePath && existsSync(imagePath) ? imagePath : imageUrl;
  if (!imageRef)
    throw new Error(
      "generateVideoFromImageViaCli requires imagePath or imageUrl",
    );
  if (!outDir || !outName)
    throw new Error("generateVideoFromImageViaCli requires outDir and outName");

  const cacheKey = promptHash(
    `${imageRef}\n${prompt}`,
    `cli:${model}`,
    1080,
    1920,
    0,
    cacheBreaker,
  );
  const cached = readCache(cacheKey);
  if (cached?.videoPath && existsSync(cached.videoPath)) {
    return {
      videoPath: cached.videoPath,
      provider: "higgsfield-cli",
      model,
      cached: true,
    };
  }

  // Reels are 9:16 — pass it explicitly (the video models default to 16:9, which would letterbox).
  const aspect = catalog.aspectRatio || "9:16";
  const args = [
    "generate",
    "create",
    jobSetType,
    "--prompt",
    prompt,
    "--image",
    imageRef,
    "--aspect_ratio",
    aspect,
    "--wait",
    "--wait-timeout",
    `${Math.ceil(timeoutMs / 60000)}m`,
    "--json",
  ];
  const r = runCli(args, { timeoutMs });
  if (r.status !== 0) {
    throw new Error(
      `higgsfield CLI video generate failed: ${(r.stderr || r.stdout || "").trim().slice(0, 300)}`,
    );
  }
  const { url } = parseCliCreateJson(r.stdout);
  const videoPath = path.join(outDir, outName);
  await downloadVideoToFile(url, videoPath);
  const result = {
    videoPath,
    provider: "higgsfield-cli",
    model,
    videoUrl: url,
    cached: false,
  };
  writeCache(cacheKey, result, 7 * 24 * 60 * 60 * 1000);
  return result;
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
  const timeoutErr = new Error(
    `higgsfield generation timed out after ${timeoutMs}ms`,
  );
  timeoutErr.status = 504;
  throw timeoutErr;
}

async function downloadImageToFile(imageUrl, destPath, signal) {
  const res = await fetch(imageUrl, { signal });
  if (!res.ok)
    throw new Error(`higgsfield image download failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  mkdirSync(path.dirname(destPath), { recursive: true });
  writeFileSync(destPath, buf);
  return destPath;
}

async function downloadVideoToFile(videoUrl, destPath, signal) {
  const res = await fetch(videoUrl, { signal });
  if (!res.ok)
    throw new Error(`higgsfield video download failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  mkdirSync(path.dirname(destPath), { recursive: true });
  writeFileSync(destPath, buf);
  return destPath;
}

/** Resolve a publicly fetchable image URL for image-to-video (Higgsfield servers must reach it). */
export function resolveSegmentImageUrl(slide, { publicBaseUrl } = {}) {
  const fromSlide = String(slide?.higgsfield_image_url || "").trim();
  if (fromSlide.startsWith("http")) return fromSlide;
  const base = (
    publicBaseUrl ?? resolveEnv("HIGGSFIELD_PUBLIC_BASE_URL", "")
  ).replace(/\/$/, "");
  const asset = String(slide?.background_asset || "").trim();
  if (base && asset.startsWith("/")) return `${base}${asset}`;
  throw new Error(
    "reel segment needs a public image URL: run art:higgsfield first (stores higgsfield_image_url) or set HIGGSFIELD_PUBLIC_BASE_URL where backgrounds are hosted over HTTPS",
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
  imagePath,
  prompt,
  model = DEFAULT_VIDEO_MODEL,
  durationSeconds,
  cacheBreaker = "",
  outDir,
  outName,
  timeoutMs = 900_000,
  mode,
}) {
  if (resolveMode(mode) === "cli") {
    return generateVideoFromImageViaCli({
      imageUrl,
      imagePath,
      prompt,
      model,
      durationSeconds,
      cacheBreaker,
      outDir,
      outName,
      timeoutMs,
    });
  }
  const catalog = catalogEntry(model);
  if (!catalog || catalog.type !== "video")
    throw new Error(`UnknownHiggsfieldVideoModel: ${model}`);
  const apiModelId = catalog.apiModelId ?? catalog.id;
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
      provider: "higgsfield",
      model,
      duration,
      cached: true,
    };
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
    const timer = setTimeout(
      () => controller.abort(),
      Math.max(1_000, timeoutMs),
    );
    try {
      const queued = await request(`/${apiModelId}`, {
        method: "POST",
        body,
        signal: controller.signal,
      });
      const statusUrl =
        queued?.status_url ??
        (queued?.request_id ? `/requests/${queued.request_id}/status` : null);
      if (!statusUrl)
        throw new Error(
          "higgsfield video response missing status_url / request_id",
        );
      const completed = await pollRequestStatus(statusUrl, {
        timeoutMs: timeoutMs - (Date.now() - started),
        signal: controller.signal,
      });
      const videoUrl = completed?.video?.url ?? completed?.videos?.[0]?.url;
      if (!videoUrl)
        throw new Error(
          "higgsfield video job completed but no video.url in response",
        );
      if (!outDir || !outName)
        throw new Error("generateVideoFromImage requires outDir and outName");
      const videoPath = path.join(outDir, outName);
      await downloadVideoToFile(videoUrl, videoPath, controller.signal);
      const result = {
        videoPath,
        provider: "higgsfield",
        model,
        duration,
        videoUrl,
        cached: false,
      };
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

const DEFAULT_CREDIT_COST = 1; // conservative fallback when a model has no verified rate

/** Credits per image for a catalog model id (verified via `higgsfield generate cost`). */
export function imageModelCost(model) {
  const catalog = catalogEntry(model);
  if (!catalog) throw new Error(`UnknownHiggsfieldModel: ${model}`);
  return typeof catalog.creditCost === "number"
    ? catalog.creditCost
    : DEFAULT_CREDIT_COST;
}

/** Prompt family for a catalog model id (drives which composer shapes the prompt). */
export function imageModelFamily(model) {
  const catalog = catalogEntry(model);
  if (!catalog) throw new Error(`UnknownHiggsfieldModel: ${model}`);
  return catalog.promptFamily ?? "flux";
}

/** Credits per CLIP for a video (i2v) model id (verified via `higgsfield generate cost`). */
export function videoModelCost(model) {
  const catalog = catalogEntry(model);
  if (!catalog || catalog.type !== "video")
    throw new Error(`UnknownHiggsfieldVideoModel: ${model}`);
  return typeof catalog.creditCost === "number"
    ? catalog.creditCost
    : DEFAULT_CREDIT_COST;
}

export async function estimateCost(model, _width, _height) {
  // Credits per generation, from the verified rate table (dimensions don't change Higgsfield cost).
  return imageModelCost(model);
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
  const resolvedSeed = Number.isFinite(seed)
    ? seed
    : Math.floor(Math.random() * 2 ** 31);
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
    const timer = setTimeout(
      () => controller.abort(),
      Math.max(1_000, timeoutMs),
    );
    try {
      const queued = await request(`/${apiModelId}`, {
        method: "POST",
        body,
        signal: controller.signal,
      });
      const statusUrl =
        queued?.status_url ??
        (queued?.request_id ? `/requests/${queued.request_id}/status` : null);
      if (!statusUrl) {
        throw new Error(
          "higgsfield provider response missing status_url / request_id",
        );
      }
      const completed = await pollRequestStatus(statusUrl, {
        timeoutMs: timeoutMs - (Date.now() - started),
        signal: controller.signal,
      });
      const imageUrl =
        completed?.images?.[0]?.url ??
        completed?.image?.url ??
        completed?.imageUrl;
      if (!imageUrl) {
        throw new Error(
          "higgsfield completed job but no image URL in response",
        );
      }

      if (!outDir || !outName) {
        throw new Error(
          "higgsfield generateImage requires outDir and outName to persist PNG",
        );
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
        const timeoutErr = new Error(
          `higgsfield generation timed out after ${timeoutMs}ms`,
        );
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
  providerLabel,
  licenseTermsOverride,
  higgsfieldImageUrl,
) {
  const assetPath = `/backgrounds/${prefix}/${destName}`;
  const slide = post.slides?.[slideIndex];
  if (!slide)
    throw new Error(
      `Higgsfield write failed: slide index ${slideIndex} missing from ${postPath}`,
    );

  slide.background_asset = assetPath;
  slide.asset_status = "generated";
  if (higgsfieldImageUrl && String(higgsfieldImageUrl).startsWith("http")) {
    slide.higgsfield_image_url = higgsfieldImageUrl;
  }

  post.asset_licenses = Array.isArray(post.asset_licenses)
    ? post.asset_licenses
    : [];
  if (!post.asset_licenses.some((l) => l?.asset === assetPath)) {
    post.asset_licenses.push({
      asset: assetPath,
      source: `${providerLabel ?? "Higgsfield"} / ${model}`,
      license_or_terms:
        licenseTermsOverride ??
        "Pending confirmation from Higgsfield provider terms.",
      commercial_use_allowed: false,
      disclosure_required: true,
      notes:
        "Generated via higgsfield-client.mjs; license terms to be confirmed with provider before publish.",
    });
  }

  post.renderMetadata = {
    provider: providerLabel ?? "higgsfield",
    model,
    costEstimate:
      typeof post.renderMetadata?.costEstimate === "number"
        ? post.renderMetadata.costEstimate
        : null,
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
  mode,
  providerLabel,
  licenseTermsOverride,
}) {
  const prefix = post?.upload_package?.filename_prefix;
  if (!prefix)
    throw new Error(
      "post.upload_package.filename_prefix is required for Higgsfield output paths",
    );

  const resolvedMode = resolveMode(mode);
  if (resolvedMode === "mcp") {
    throw new Error(
      "renderSlide does not run in mcp mode — use higgsfield-mcp.mjs (buildArtPlan/ingestArtPlan) with the MCP generate_image tool.",
    );
  }
  const effLabel =
    providerLabel ?? (resolvedMode === "cli" ? "Higgsfield CLI" : "Higgsfield");

  const outDir = path.join(RENDERER, "public", "backgrounds", prefix);
  mkdirSync(outDir, { recursive: true });
  const slide = post?.slides?.[slideIndex];
  const outName = backgroundFileName({
    slide: slide?.slide ?? slideIndex + 1,
    role: slide?.role ?? `slide-${slideIndex + 1}`,
  });

  const genFn = resolvedMode === "cli" ? generateImageViaCli : generateImage;
  const generated = await genFn({
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
    effLabel,
    licenseTermsOverride,
    generated.imageUrl,
  );

  return {
    imagePath: path.join(outDir, outName),
    assetPath,
    provider: effLabel,
    model,
    seed: generated.seed ?? seed,
    cached: generated.cached ?? false,
  };
}

export default {
  MODEL_CATALOG,
  DEFAULT_IMAGE_MODEL,
  DEFAULT_VIDEO_MODEL,
  resolveMode,
  hasRestCreds,
  healthCheck,
  estimateCost,
  imageModelCost,
  imageModelFamily,
  videoModelCost,
  generateImage,
  generateVideoFromImage,
  renderSlide,
  promptHash,
  buildNegativePrompt,
  resolveSegmentImageUrl,
  motionPromptForBeat,
  cliAspectRatio,
  resolveCliBin,
  buildCliCreateArgs,
  parseCliCreateJson,
  cliHealthCheck,
};
