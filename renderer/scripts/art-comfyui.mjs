// bun run art -- <post-key> [--all] [--dry-run] [--steps=N] [--width=N] [--height=N] [--model=NAME] [--seed=N]
// Generates per-slide background art by driving a RUNNING ComfyUI server over its HTTP API
// (the locked-in FLUX.1-schnell Q4_K_S GGUF workflow — fits 8GB, ~30-58s/img). No diffusers,
// no Docker, no model loading in this process. ComfyUI just has to be running.
//
// For each inner slide it: builds an API-format graph with that slide's prompt, POSTs /prompt,
// polls /history, downloads the PNG via /view into public/backgrounds/<prefix>/NN_role.png,
// flips the slide to asset_status:"existing" + background_asset, and logs an Apache-2.0 license
// entry (FLUX.1-schnell). Then: bun run export -- <post-key>.
//
// Config via env (or flags): COMFYUI_URL (default http://127.0.0.1:8000),
//   ART_MODEL (flux1-schnell-Q4_K_S.gguf), ART_STEPS (4), ART_WIDTH (768), ART_HEIGHT (1024),
//   ART_T5 (t5xxl_fp8_e4m3fn.safetensors), ART_CLIP (clip_l.safetensors),
//   ART_VAE (split_files\vae\ae.safetensors), ART_CLIP_DEVICE (cpu).
// Legacy local-diffusers path is still available via:  bun run art:diffusers -- <key>
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { themes, pillarTheme, BRAND_STYLE } from "../src/design/tokens.ts";

const RENDERER = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const POSTS = path.join(RENDERER, "content", "posts");
const ROLE_FILE = { failure_point: "failure-point" };

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const opt = (name, def) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=")[1] : def;
};
const key = args.find((a) => !a.startsWith("--"));
if (!key) {
  console.error("Usage: bun run art -- <post-key> [--all|--force] [--flux1 (legacy FLUX.1; default is FLUX.2)] [--only=N[,N]] [--dry-run] [--steps=N] [--width=N] [--height=N] [--seed=N]");
  process.exit(1);
}

const URL_BASE = (process.env.COMFYUI_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

// FLUX.2 [klein] 4B (distilled GGUF) mode — `--flux2`. Different architecture: a single Qwen3
// text encoder (CLIPLoader type "flux2", run on CPU), the flux2 VAE, and the
// Flux2Scheduler → CFGGuider → SamplerCustomAdvanced sampling stack. Writes to a SEPARATE
// public/backgrounds/<prefix>_flux2/ folder when --compare; otherwise updates the post JSON.
// FLUX.2 [klein] is the DEFAULT art engine. Opt out to the legacy FLUX.1-schnell GGUF with --flux1.
// (--flux2 is still accepted as a harmless no-op alias so older commands keep working.)
const FLUX2 = !flags.has("--flux1");
// --flux2 writes REAL backgrounds (updates the post JSON), like FLUX.1. Add --compare to
// instead do a non-destructive A/B into <prefix>_flux2/ without touching the JSON.
const COMPARE = flags.has("--compare");

const MODEL = opt("model", process.env.ART_MODEL || "flux1-schnell-Q4_K_S.gguf");
// FLUX.2 klein (distilled) coherence: 4 steps suffices for trivial prompts, but 6-8 steps
// markedly improve structure on complex scenes (community + BFL guidance). FLUX.1-schnell
// keeps its 4-step distillation. Dimensions MUST be multiples of 16 for FLUX.2 → snapped
// below; 4:5 to match the 1080x1350 carousel (1024x1280) instead of the old 3:4 768x1024.
const snap16 = (n) => Math.max(16, Math.round(n / 16) * 16);
const STEPS = Number(opt("steps", process.env.ART_STEPS || (FLUX2 ? 8 : 4)));
const WIDTH = snap16(Number(opt("width", process.env.ART_WIDTH || (FLUX2 ? 1024 : 768))));
const HEIGHT = snap16(Number(opt("height", process.env.ART_HEIGHT || (FLUX2 ? 1280 : 1024))));
const SEED_BASE = Number(opt("seed", process.env.ART_SEED || 42));
const T5 = process.env.ART_T5 || "t5xxl_fp8_e4m3fn.safetensors";
const CLIP_L = process.env.ART_CLIP || "clip_l.safetensors";
const VAE = process.env.ART_VAE || "split_files\\vae\\ae.safetensors";
const CLIP_DEVICE = process.env.ART_CLIP_DEVICE || "cpu";
const DRY = flags.has("--dry-run");

const F2_MODEL = process.env.ART2_MODEL || "flux-2-klein-4b-Q5_K_S.gguf";
const F2_CLIP = process.env.ART2_CLIP || "split_files\\text_encoders\\qwen_3_4b.safetensors";
const F2_VAE = process.env.ART2_VAE || "split_files\\vae\\flux2-vae.safetensors";
// A gentle true-CFG (>1) so the NEGATIVE prompt actually suppresses fake text/UI — at CFG 1
// FLUX ignores the negative entirely. 1.2 nudges without the 1.5 over-cook / artifact return.
const F2_CFG = Number(process.env.ART2_CFG || 1.2);

// Text/UI suppression lives ONLY in the negative node (never the positive — negative phrasing
// in a FLUX positive prompt can SUMMON the very tokens). Bites only when F2_CFG > 1.
const NEG_PROMPT =
  "text, words, letters, numbers, typography, captions, labels, signage, logo, watermark, " +
  "user interface, dashboard, control panel, charts, diagrams, icons, gibberish, fake writing";

// Role-aware visual motifs (NO on-slide text — FLUX would render garbled words).
const ROLE_MOTIF = {
  context: "two diverging glowing data streams over a dark grid, one clean direct path and one hidden shadowed path, contrast of trusted versus untrusted flow",
  risk: "untrusted content fanning outward across abstract documents, envelopes, browser windows and image frames, thin glowing connection lines",
  mechanism: "an abstract AI agent core emitting outbound action beams to connected API nodes and tool icons lighting up in sequence",
  failure_point: "a dark control panel with glowing warning hotspots and layered risk zones, alert highlights, tension",
  defense: "a layered protective shield wrapping an isolated sandbox, padlocks and permission gates, controlled gateways, calm and secure",
  takeaway: "translucent mask and glyph motifs glowing in the corners and along the edges, faint ambient circuitry and particle haze across the whole frame, the center kept calm and uncluttered (dark but not empty), minimal high-impact composition",
  cta: "a forward-motion arrow and a softly glowing question mark toward the upper area, sense of momentum inviting a swipe",
  // Generic body slide (dynamic-count posts beyond the named arc). Per-slide visual_prompt
  // should override this; this is the fallback motif for an unfilled `point` slide.
  point: "a single focal abstract object glowing in the dark with thin connecting light lines, clean high-contrast composition, one clear idea",
};

// Where the slide's TEXT sits → keep that zone of the image dark/empty so captions stay legible.
// Takeaway centers its text (centered radial scrim); every other role is bottom-aligned.
const TEXT_ZONE = {
  takeaway: "keep the central area calm and uncluttered for a centered text overlay (dark but not empty); arrange the focal elements in the corners and along the edges, with faint ambient detail elsewhere",
};
const DEFAULT_ZONE = "keep the lower portion of the frame dark, calm and uncluttered for a text overlay; place focal elements in the upper third and the periphery";

// Strip colour words from reused copy (e.g. visual_direction) so it can't fight the theme accent.
function stripColor(s) {
  return s
    .replace(/\b(cyan|electric[- ]?blue|blue|red|teal|neon[- ]?green|green|amber|magenta|crimson|scarlet|azure|orange|purple|violet)\b/gi, "")
    .replace(/\b(accent|glow)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;])/g, "$1")
    .replace(/,(\s*,)+/g, ",")
    .trim();
}

function buildPrompt(slide, accentHex, accentName, topic, mood) {
  // Subject priority — front-load the most POST-SPECIFIC scene available (FLUX anchors on it):
  //   1. slide.visual_prompt (specific, authored)  2. slide.visual_direction (colour-stripped)
  //   3. generic ROLE_MOTIF blended with the post topic (last resort).
  let subject;
  if (slide.visual_prompt && slide.visual_prompt.trim()) {
    subject = slide.visual_prompt.trim();
  } else if (slide.visual_direction && slide.visual_direction.trim()) {
    subject = `dark cinematic cybersecurity illustration, ${stripColor(slide.visual_direction.trim())}`;
  } else {
    const motif = ROLE_MOTIF[slide.role] || "abstract flowing data network, nodes and light trails";
    const themed = topic ? `${motif}, evoking the theme of ${topic}` : motif;
    subject = `dark cinematic cybersecurity illustration, ${themed}`;
  }
  const zone = TEXT_ZONE[slide.role] || DEFAULT_ZONE;
  const moodPart = mood ? `${mood}. ` : "";
  // Natural-language sentences (FLUX's qwen/T5 encoder favours prose over comma-tag soup).
  // BRAND_STYLE is the constant house look (so every post reads as one brand); the theme
  // accent colour + mood change per category. NO "no text" here — that's the negative node.
  return `${subject}. A single ${accentName} (${accentHex}) accent glow on a deep navy void #05070d. ${moodPart}${BRAND_STYLE}. ${zone}.`;
}

// Stable per-post seed offset (FNV-1a hash of the prefix) so the same role/slide in
// DIFFERENT posts renders different images, while a given post stays reproducible.
function postSeedOffset(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 90000;
}

function buildGraph(promptText, seed) {
  return {
    "4": { class_type: "UnetLoaderGGUF", inputs: { unet_name: MODEL } },
    "5": { class_type: "DualCLIPLoader", inputs: { clip_name1: T5, clip_name2: CLIP_L, type: "flux", device: CLIP_DEVICE } },
    "6": { class_type: "VAELoader", inputs: { vae_name: VAE } },
    "7": { class_type: "CLIPTextEncode", inputs: { text: promptText, clip: ["5", 0] } },
    "8": { class_type: "CLIPTextEncode", inputs: { text: NEG_PROMPT, clip: ["5", 0] } },
    "9": { class_type: "EmptySD3LatentImage", inputs: { width: WIDTH, height: HEIGHT, batch_size: 1 } },
    "10": { class_type: "KSampler", inputs: { seed, steps: STEPS, cfg: 1, sampler_name: "euler", scheduler: "simple", denoise: 1, model: ["4", 0], positive: ["7", 0], negative: ["8", 0], latent_image: ["9", 0] } },
    "11": { class_type: "VAEDecode", inputs: { samples: ["10", 0], vae: ["6", 0] } },
    "12": { class_type: "SaveImage", inputs: { filename_prefix: "art_pipeline/bg", images: ["11", 0] } },
  };
}

// FLUX.2 [klein] distilled GGUF graph (mirrors the image_flux2_klein_text_to_image template).
function buildGraphFlux2(promptText, seed) {
  return {
    "4": { class_type: "UnetLoaderGGUF", inputs: { unet_name: F2_MODEL } },
    "5": { class_type: "CLIPLoader", inputs: { clip_name: F2_CLIP, type: "flux2", device: CLIP_DEVICE } },
    "6": { class_type: "VAELoader", inputs: { vae_name: F2_VAE } },
    "7": { class_type: "CLIPTextEncode", inputs: { text: promptText, clip: ["5", 0] } },
    "8": { class_type: "CLIPTextEncode", inputs: { text: NEG_PROMPT, clip: ["5", 0] } },
    "9": { class_type: "Flux2Scheduler", inputs: { steps: STEPS, width: WIDTH, height: HEIGHT } },
    "10": { class_type: "RandomNoise", inputs: { noise_seed: seed } },
    "11": { class_type: "KSamplerSelect", inputs: { sampler_name: "euler" } },
    "12": { class_type: "CFGGuider", inputs: { model: ["4", 0], positive: ["7", 0], negative: ["8", 0], cfg: F2_CFG } },
    "13": { class_type: "EmptySD3LatentImage", inputs: { width: WIDTH, height: HEIGHT, batch_size: 1 } },
    "14": { class_type: "SamplerCustomAdvanced", inputs: { noise: ["10", 0], guider: ["12", 0], sampler: ["11", 0], sigmas: ["9", 0], latent_image: ["13", 0] } },
    "15": { class_type: "VAEDecode", inputs: { samples: ["14", 0], vae: ["6", 0] } },
    "16": { class_type: "SaveImage", inputs: { filename_prefix: "art_pipeline/flux2", images: ["15", 0] } },
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function generate(promptText, seed) {
  const client_id = crypto.randomUUID();
  const graph = FLUX2 ? buildGraphFlux2(promptText, seed) : buildGraph(promptText, seed);
  const res = await fetch(`${URL_BASE}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: graph, client_id }),
  });
  if (!res.ok) throw new Error(`/prompt ${res.status}: ${await res.text()}`);
  const { prompt_id, node_errors } = await res.json();
  if (node_errors && Object.keys(node_errors).length) throw new Error(`node_errors: ${JSON.stringify(node_errors)}`);

  // poll /history until this prompt has outputs (or errors out)
  const deadline = Date.now() + 8 * 60 * 1000;
  const t0 = Date.now();
  while (Date.now() < deadline) {
    await sleep(2000);
    process.stdout.write(`\r    …rendering ${((Date.now() - t0) / 1000).toFixed(0)}s   `);
    const h = await fetch(`${URL_BASE}/history/${prompt_id}`).then((r) => r.json());
    const entry = h[prompt_id];
    if (!entry) continue;
    const status = entry.status?.status_str;
    if (status === "error") throw new Error(`ComfyUI execution error (see ComfyUI logs). messages: ${JSON.stringify(entry.status?.messages)}`);
    const out = entry.outputs && Object.values(entry.outputs).find((o) => o.images?.length);
    if (out) return out.images[0]; // { filename, subfolder, type }
  }
  throw new Error(`timed out waiting for ${prompt_id}`);
}

async function fetchImage(img) {
  const q = new URLSearchParams({ filename: img.filename, subfolder: img.subfolder || "", type: img.type || "output" });
  const r = await fetch(`${URL_BASE}/view?${q}`);
  if (!r.ok) throw new Error(`/view ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

// ---- main ----
const file = readdirSync(POSTS).find((f) => f.endsWith(".json") && f.includes(key));
if (!file) { console.error(`No post JSON in ${POSTS} matching "${key}".`); process.exit(1); }
const postPath = path.join(POSTS, file);
const post = JSON.parse(readFileSync(postPath, "utf8"));
const prefix = post.upload_package.filename_prefix;
// Brand theme drives the accent colour + mood (explicit post.theme, else pillar fallback).
const theme = post.theme || pillarTheme[post.pillar] || "defensive";
const T = themes[theme] || themes.defensive;
const accentHex = T.accent;
const accentName = T.name;
const mood = T.mood;
// Short, text-free theme hint (≤12 words from the post's claim/slug) for fallback prompts,
// and a per-post seed base so different posts don't collide on identical images.
const topic = String(post.core_claim || post.slug || "").replace(/["']/g, "").split(/\s+/).filter(Boolean).slice(0, 12).join(" ");
const postBaseSeed = SEED_BASE + postSeedOffset(prefix);

// confirm ComfyUI is reachable + the model exists
if (!DRY) {
  let stats;
  try { stats = await fetch(`${URL_BASE}/system_stats`).then((r) => r.json()); }
  catch { console.error(`✗ Can't reach ComfyUI at ${URL_BASE}. Start ComfyUI, then retry. (override with COMFYUI_URL)`); process.exit(1); }
  console.log(`ComfyUI ${stats?.system?.comfyui_version ?? "?"} @ ${URL_BASE} · ${FLUX2 ? "FLUX.2" : "FLUX.1"} model=${FLUX2 ? F2_MODEL : MODEL} · ${WIDTH}x${HEIGHT} · ${STEPS} steps`);
}

const onlyArg = opt("only", "");
const onlySet = onlyArg ? new Set(onlyArg.split(",").map((x) => Number(x.trim())).filter((n) => !Number.isNaN(n))) : null;
// Targeting (cover is NOT special-cased — it generates by need, like any slide):
//   • asset_status "existing" → never touched (locked custom asset, e.g. a hand-made cover).
//   • --only=N → regenerate exactly those slides (explicit intent overrides the has-art check).
//   • --all / --force → regenerate every non-"existing" slide (cover included).
//   • default → only slides that still NEED art (no background_asset yet), cover included.
// This is why `bun run pipeline` no longer needs `--all` to get a cover background.
const FORCE = flags.has("--all") || flags.has("--force") || COMPARE;
// A slide "has art" only if its background_asset actually exists ON DISK — a fresh scaffold points
// the cover at a not-yet-created path, which must still count as needing art.
const artExists = (s) =>
  !!s.background_asset && existsSync(path.join(RENDERER, "public", s.background_asset.replace(/^[\\/]+/, "")));
const targets = post.slides.filter((s) => {
  if (s.asset_status === "existing") return false; // locked custom asset — never overwrite
  if (onlySet) return onlySet.has(s.slide); // explicit selection wins
  return FORCE || !artExists(s); // else: regenerate-all, or only slides still missing art (cover included)
});
if (onlySet) console.log(`(regenerating only slide(s): ${[...onlySet].join(", ")})`);
const compareMode = FLUX2 && COMPARE;
const outPrefix = compareMode ? `${prefix}_flux2` : prefix;
const destDir = path.join(RENDERER, "public", "backgrounds", outPrefix);
if (!DRY) mkdirSync(destDir, { recursive: true });
post.asset_licenses = post.asset_licenses || [];

let n = 0;
for (const slide of targets) {
  const role = ROLE_FILE[slide.role] ?? slide.role;
  const nn = String(slide.slide).padStart(2, "0");
  const destName = `${nn}_${role}.png`;
  const promptText = buildPrompt(slide, accentHex, accentName, topic, mood);
  const seed = postBaseSeed + slide.slide;
  if (DRY) { console.log(`\n[slide ${slide.slide} ${slide.role}] seed=${seed}\n  ${promptText}`); continue; }

  process.stdout.write(`  slide ${slide.slide} (${slide.role})… `);
  const t0 = Date.now();
  try {
    const img = await generate(promptText, seed);
    writeFileSync(path.join(destDir, destName), await fetchImage(img));
  } catch (e) {
    console.log(`✗ ${e.message}`);
    continue;
  }
  // --flux2 --compare = non-destructive A/B (write images only; leave JSON on the live set).
  if (!compareMode) {
    const assetPath = `/backgrounds/${prefix}/${destName}`;
    slide.background_asset = assetPath;
    slide.asset_status = "generated";
    const modelName = FLUX2 ? F2_MODEL : MODEL;
    const source = FLUX2 ? "FLUX.2 [klein] 4B (GGUF) via local ComfyUI" : "FLUX.1-schnell (GGUF) via local ComfyUI";
    if (!post.asset_licenses.some((l) => l.asset === assetPath)) {
      post.asset_licenses.push({
        asset: assetPath,
        source,
        license_or_terms: "Apache-2.0 — commercial use allowed; text-free generated background.",
        commercial_use_allowed: true,
        disclosure_required: false,
        notes: `Generated locally with ${modelName}; no rendered text, no logos.`,
      });
    }
  }
  console.log(`✓ ${destName} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  n++;
}

if (!DRY) {
  if (compareMode) {
    console.log(`\n✓ Generated ${n}/${targets.length} FLUX.2 background(s) → public/backgrounds/${outPrefix}/ (comparison set; post JSON untouched).`);
    console.log(`  Compare against the live set in public/backgrounds/${prefix}/.`);
  } else {
    writeFileSync(postPath, JSON.stringify(post, null, 2) + "\n", "utf8");
    const which = FLUX2 ? "FLUX.2 klein" : "FLUX.1-schnell";
    console.log(`\n✓ Generated ${n}/${targets.length} ${which} background(s) → public/backgrounds/${prefix}/ (asset_status=generated, licenses logged).`);
    console.log(`  Next: bun run export -- ${key}`);
  }
}
