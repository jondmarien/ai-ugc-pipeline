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
import { spawnSync } from "node:child_process";
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
const key = args.find((a) => !a.startsWith("--") && a !== "-h");

const HELP = `
bun run art — per-slide AI backgrounds via a RUNNING ComfyUI (HTTP API; no local model loading)

USAGE
  bun run art -- <post-key> [flags]

  For each target slide it builds the FLUX graph with that slide's visual_prompt, POSTs
  /prompt, polls /history, downloads the PNG into public/backgrounds/<prefix>/NN_role.png,
  flips the slide to asset_status:"generated", and logs the model licence in the post JSON.
  Then: bun run export -- <post-key>.

TARGETING
  (default)                 only slides still MISSING art (cover included); "existing" never touched
  --all | --force           regenerate every non-"existing" slide
  --only=N[,N]              regenerate exactly those slide numbers

ENGINE & QUALITY
  --flux1                   legacy FLUX.1-schnell graph (default is FLUX.2 klein 4B GGUF)
  --passes=N | --steps=N    sampling steps. klein is step-distilled: recommended 4–8,
                            hard max 12 (clamped; >8 adds heat, not quality)
  --width=N --height=N      generation size (snapped to ×16; default 1024×1280 on FLUX.2)
  --seed=N                  seed base (per-post offset keeps posts distinct; default 42)
  --cooldown=SEC            pause between generations (default 25; 0 disables) — eases the
                            sustained CPU/GPU load that can trip an OS watchdog on 8 GB rigs

UPSCALE (integrated into the same graph)
  --upscale                 after VAE decode: GAN upscale → lanczos downscale to the post
                            canvas → save (the _with_upscale workflow's node chain)
  --upscale-model=NAME.pth  RealESRGAN_x4plus.pth (default) | 4x-UltraSharp.pth — both
                            auto-download to COMFYUI_UPSCALE_DIR if missing
  --upscale-scale=N         final size = canvas × N (default 1)

WORKFLOW SOURCE
  (default)                 graph built in code (buildGraphFlux2/appendUpscale)
  --ui-format               execute the version-controlled ComfyUI workflow FILE from
                            renderer/comfyui-workflows/ (the _with_upscale variant when
                            --upscale). The file's steps/CFG/size win; each slide's prompt
                            + seed (and upscale model/canvas) are patched in. FLUX.2 only.

MISC
  --dry-run                 print the assembled per-slide prompts (and validate --ui-format
                            conversion) without submitting anything
  --compare                 (FLUX.2) write into a separate _flux2/ folder, don't touch the JSON
  --help, -h                this help

ENV  COMFYUI_URL (http://127.0.0.1:8000) · ART2_MODEL / ART2_CFG (1.2) · ART_STEPS ·
     ART_COOLDOWN_MS · COMFYUI_UNET_DIR · COMFYUI_UPSCALE_DIR · UPSCALE_MODEL

EXAMPLES
  bun run art -- 2026-06-08_chatbot-log-leak                 fill in missing backgrounds
  bun run art -- my-post --all --upscale                     full regen + integrated upscale
  bun run art -- my-post --only=1 --ui-format --dry-run      check the file-driven graph
`;

if (flags.has("--help") || flags.has("-h") || args.includes("-h")) {
  console.log(HELP);
  process.exit(0);
}
if (!key) {
  console.error(HELP);
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
// Sampling steps, a.k.a. "passes". `--passes=N` (forwarded by `bun run pipeline`) is the user-facing
// alias; `--steps=N` / ART_STEPS still work (lower priority). FLUX.2 klein and FLUX.1-schnell are
// step-DISTILLED: native ~4, useful 4-8, nothing past ~8 but heat. Clamp to a hard max of 12 and warn
// outside the recommended band so a stray `--passes=40` can't cook the card for zero quality gain.
const PASSES_HARD_MAX = 12;
const PASSES_REC = [4, 8];
const PASSES_DEFAULT = FLUX2 ? 8 : 4;
const rawPasses = Number(opt("passes", opt("steps", process.env.ART_STEPS || PASSES_DEFAULT)));
const STEPS = Math.max(1, Math.min(PASSES_HARD_MAX, Number.isFinite(rawPasses) ? Math.round(rawPasses) : PASSES_DEFAULT));
if (Number.isFinite(rawPasses) && STEPS !== rawPasses)
  console.warn(`  ⚠ passes clamped ${rawPasses} → ${STEPS} (hard max ${PASSES_HARD_MAX}; ${FLUX2 ? "FLUX.2 klein" : "FLUX.1-schnell"} is step-distilled, gains nothing past ~8).`);
else if (STEPS < PASSES_REC[0] || STEPS > PASSES_REC[1])
  console.warn(`  ⚠ ${STEPS} passes is outside the recommended ${PASSES_REC[0]}-${PASSES_REC[1]} for a distilled model (4 = native; >8 rarely helps).`);
const WIDTH = snap16(Number(opt("width", process.env.ART_WIDTH || (FLUX2 ? 1024 : 768))));
const HEIGHT = snap16(Number(opt("height", process.env.ART_HEIGHT || (FLUX2 ? 1280 : 1024))));
const SEED_BASE = Number(opt("seed", process.env.ART_SEED || 42));
// Breather BETWEEN slide generations. Back-to-back FLUX on a low-VRAM card keeps CPU+GPU pinned
// with heavy offload; on a thermally/power-marginal rig that sustained load can trip an OS CPU
// watchdog after a few images. A cooldown lets the system settle between gens. Default 25s (from
// community thermal-pacing guidance for 8GB FLUX; see renderer/docs/IMAGE_MODELS.md). Override with
// `--cooldown=<seconds>` or env ART_COOLDOWN_MS=<ms>; `--cooldown=0` (or ART_COOLDOWN_MS=0) disables.
const COOLDOWN_MS = opt("cooldown", "")
  ? Math.max(0, Number(opt("cooldown", "")) * 1000)
  : process.env.ART_COOLDOWN_MS !== undefined
    ? Math.max(0, Number(process.env.ART_COOLDOWN_MS))
    : 25000;
const T5 = process.env.ART_T5 || "t5xxl_fp8_e4m3fn.safetensors";
const CLIP_L = process.env.ART_CLIP || "clip_l.safetensors";
const VAE = process.env.ART_VAE || "split_files\\vae\\ae.safetensors";
const CLIP_DEVICE = process.env.ART_CLIP_DEVICE || "cpu";
const DRY = flags.has("--dry-run");

// `--upscale` builds the INTEGRATED generate→upscale graph in one pass (the exact node chain in the
// `<workflow>_with_upscale` ComfyUI workflow): after VAE decode, run a GAN upscaler then downscale to
// the post's canvas, and save THAT. Forwarded by `bun run pipeline -- <key> --art --upscale`. Without
// `--upscale` the base graph runs unchanged. (Upscaling EXISTING backgrounds without regen still uses
// the standalone `bun run upscale`.)
const UPSCALE = flags.has("--upscale");
const UPSCALE_MODEL = opt("upscale-model", process.env.UPSCALE_MODEL || "RealESRGAN_x4plus.pth");
const UPSCALE_SCALE = Math.max(0.25, Number(opt("upscale-scale", "1")) || 1);
let UP_W = 1080, UP_H = 1350; // downscale target = post canvas × scale; set in main from the post JSON

// `--ui-format`: instead of building the graph in code, LOAD the version-controlled ComfyUI workflow
// file from renderer/comfyui-workflows/ (UI format, same files you open in the ComfyUI web UI),
// convert it to API format, patch the per-slide essentials (positive prompt + seed; with --upscale
// also the upscale model_name + ImageScale canvas), and submit THAT. The file's other settings
// (steps/CFG/resolution/sampler) win — WYSIWYG. Default (no flag) keeps the code-built graph.
const UI_FORMAT = flags.has("--ui-format");
const WF_DIR = path.join(RENDERER, "comfyui-workflows");
const WF_FILE = () => (UPSCALE ? "flux2_klein_4b_8gb_with_upscale.json" : "flux2_klein_4b_8gb.json");
if (UI_FORMAT && flags.has("--flux1"))
  console.warn("  ⚠ --ui-format only mirrors the FLUX.2 graphs; --flux1 keeps the code-built graph.");

const F2_MODEL = process.env.ART2_MODEL || "flux-2-klein-4b-Q5_K_S.gguf";
const F2_CLIP = process.env.ART2_CLIP || "split_files\\text_encoders\\qwen_3_4b.safetensors";
const F2_VAE = process.env.ART2_VAE || "split_files\\vae\\flux2-vae.safetensors";
// A gentle true-CFG (>1) so the NEGATIVE prompt actually suppresses fake text/UI — at CFG 1
// FLUX ignores the negative entirely. 1.2 nudges without the 1.5 over-cook / artifact return.
const F2_CFG = Number(process.env.ART2_CFG || 1.2);

// `--q6` (via `bun run pipeline`) sets ART2_MODEL=flux-2-klein-4b-Q6_K.gguf. If the selected klein-4B
// GGUF isn't already in ComfyUI's unet dir, fetch it from the same unsloth repo Q5 came from (the `hf`
// CLI, same command the docs use). Only the klein-4B GGUFs are auto-fetchable; a remote ComfyUI whose
// models dir isn't on this box just gets a warning. Override the dir with COMFYUI_UNET_DIR.
const COMFY_UNET_DIR = process.env.COMFYUI_UNET_DIR || "E:\\ComfyUI\\models\\unet";
const KLEIN_GGUF_REPO = process.env.KLEIN_GGUF_REPO || "unsloth/FLUX.2-klein-4B-GGUF";
function ensureFlux2Model(modelFile) {
  if (!/^flux-2-klein-4b-.*\.gguf$/i.test(modelFile)) return; // only known klein-4B GGUFs
  let dirExists = false;
  try { dirExists = existsSync(COMFY_UNET_DIR); } catch { dirExists = false; }
  if (!dirExists) {
    console.warn(`  ⚠ ComfyUI unet dir not found at ${COMFY_UNET_DIR} (remote ComfyUI?). Make sure ${modelFile} is present there, or set COMFYUI_UNET_DIR.`);
    return;
  }
  if (existsSync(path.join(COMFY_UNET_DIR, modelFile))) return; // already downloaded
  console.log(`  ↓ ${modelFile} not in ${COMFY_UNET_DIR} — downloading from ${KLEIN_GGUF_REPO} via hf…`);
  const r = spawnSync("hf", ["download", KLEIN_GGUF_REPO, modelFile, "--local-dir", COMFY_UNET_DIR],
    { stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0)
    console.warn(`  ⚠ auto-download failed (hf exit ${r.status ?? "?"}). Run manually:  hf download ${KLEIN_GGUF_REPO} ${modelFile} --local-dir ${COMFY_UNET_DIR}`);
  else
    console.log(`  ✓ ${modelFile} downloaded.`);
}

// Upscale model (for the integrated --upscale path). Auto-fetch the known `.pth` to ComfyUI's
// upscale_models dir if missing (same direct-download idea as scripts/upscale-comfyui.mjs).
const COMFY_UPSCALE_DIR = process.env.COMFYUI_UPSCALE_DIR || "E:\\ComfyUI\\models\\upscale_models";
const UPSCALE_SOURCES = {
  "RealESRGAN_x4plus.pth": "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth",
  "4x-UltraSharp.pth": "https://huggingface.co/lokCX/4x-Ultrasharp/resolve/main/4x-UltraSharp.pth?download=true",
};
async function ensureUpscaleModel(modelFile) {
  const url = UPSCALE_SOURCES[modelFile];
  if (!url) return;
  let dirExists = false;
  try { dirExists = existsSync(COMFY_UPSCALE_DIR); } catch { dirExists = false; }
  if (!dirExists) {
    console.warn(`  ⚠ ComfyUI upscale dir not found at ${COMFY_UPSCALE_DIR} (remote ComfyUI?). Put ${modelFile} there, or set COMFYUI_UPSCALE_DIR.`);
    return;
  }
  const dest = path.join(COMFY_UPSCALE_DIR, modelFile);
  if (existsSync(dest)) return;
  console.log(`  ↓ ${modelFile} not found — downloading (~65 MB) from ${url.split("?")[0]} …`);
  try {
    const r = await fetch(url, { redirect: "follow" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
    console.log(`  ✓ ${modelFile} downloaded to ${COMFY_UPSCALE_DIR}.`);
  } catch (e) {
    console.warn(`  ⚠ auto-download failed (${e.message}). Get it manually:\n     ${url.split("?")[0]}\n     → ${COMFY_UPSCALE_DIR}`);
  }
}

// Append the upscale tail to a built graph: VAE-decoded IMAGE → UpscaleModelLoader/ImageUpscaleWithModel
// → ImageScale (down to UP_W×UP_H) → and repoint the existing SaveImage to the upscaled image. Uses high
// node IDs (97/98/99) to avoid colliding with the base graph's IDs. Mirrors `<workflow>_with_upscale`.
function appendUpscale(graph, decodeId, saveId) {
  graph["97"] = { class_type: "UpscaleModelLoader", inputs: { model_name: UPSCALE_MODEL } };
  graph["98"] = { class_type: "ImageUpscaleWithModel", inputs: { upscale_model: ["97", 0], image: [decodeId, 0] } };
  graph["99"] = { class_type: "ImageScale", inputs: { image: ["98", 0], upscale_method: "lanczos", width: UP_W, height: UP_H, crop: "disabled" } };
  graph[saveId].inputs.images = ["99", 0];
  return graph;
}

// ---- --ui-format support: load a UI-format workflow file and run it ----
// Convert ComfyUI's saved UI format ({nodes:[],links:[]}) to the API format the /prompt endpoint
// wants ({id:{class_type,inputs}}). Widget values map positionally onto widget-bearing inputs; a
// seed widget's trailing control value ("fixed"/"randomize"/…) has no input slot and is skipped.
// Muted/bypassed nodes (mode 2/4) are dropped.
function uiToApi(ui) {
  const linkMap = new Map();
  for (const l of ui.links || []) linkMap.set(l[0], [String(l[1]), l[2]]);
  const api = {};
  for (const n of ui.nodes || []) {
    if (n.mode === 2 || n.mode === 4) continue;
    const inputs = {};
    const wv = n.widgets_values || [];
    let wi = 0;
    for (const inp of n.inputs || []) {
      if (inp.link != null && linkMap.has(inp.link)) {
        inputs[inp.name] = linkMap.get(inp.link);
      } else if (inp.widget) {
        inputs[inp.name] = wv[wi++];
        if (/seed/i.test(inp.name) && typeof wv[wi] === "string" &&
            ["fixed", "randomize", "increment", "decrement"].includes(wv[wi])) wi++;
      }
    }
    api[String(n.id)] = { class_type: n.type, inputs };
  }
  return api;
}

let uiGraphCache = null; // parse + convert once per run; deep-copied and patched per slide
function loadUiGraph(promptText, seed) {
  if (!uiGraphCache) {
    const file = path.join(WF_DIR, WF_FILE());
    if (!existsSync(file)) throw new Error(`--ui-format: workflow file not found: ${file}`);
    uiGraphCache = uiToApi(JSON.parse(readFileSync(file, "utf8")));
    console.log(`  (ui-format: executing ${WF_FILE()} — the file's steps/CFG/resolution win)`);
  }
  const g = structuredClone(uiGraphCache);
  // Patch per-slide essentials. Positive prompt = the CLIPTextEncode feeding CFGGuider.positive.
  const guider = Object.values(g).find((n) => n.class_type === "CFGGuider");
  const posId = guider?.inputs?.positive?.[0];
  if (posId && g[posId]?.class_type === "CLIPTextEncode") g[posId].inputs.text = promptText;
  else throw new Error("--ui-format: couldn't locate the positive CLIPTextEncode via CFGGuider.positive");
  const noise = Object.values(g).find((n) => n.class_type === "RandomNoise");
  if (noise) noise.inputs.noise_seed = seed;
  if (UPSCALE) {
    const up = Object.values(g).find((n) => n.class_type === "UpscaleModelLoader");
    const scale = Object.values(g).find((n) => n.class_type === "ImageScale");
    if (!up || !scale) throw new Error(`--ui-format --upscale: ${WF_FILE()} has no upscale chain`);
    up.inputs.model_name = UPSCALE_MODEL;
    scale.inputs.width = UP_W;
    scale.inputs.height = UP_H;
  }
  return g;
}

// Text/UI suppression lives ONLY in the negative node (never the positive — negative phrasing
// in a FLUX positive prompt can SUMMON the very tokens). Bites only when F2_CFG > 1.
const NEG_PROMPT =
  "text, words, letters, numbers, typography, captions, labels, signage, logo, watermark, " +
  "user interface, dashboard, control panel, charts, diagrams, icons, gibberish, fake writing";

// Role-aware visual motifs (NO on-slide text — FLUX would render garbled words).
const ROLE_MOTIF = {
  context: "two diverging glowing streams of light over a dark grid, one clean direct path and one hidden shadowed path, contrast of a trusted versus an untrusted flow",
  risk: "untrusted signals fanning outward through the dark toward many small floating targets, thin glowing connection lines, a sense of spreading exposure",
  mechanism: "an abstract glowing core emitting outbound beams of light to a sequence of connected nodes lighting up one after another, an automated chain",
  failure_point: "a dark scene of glowing hazard hotspots and overlapping risk zones, tense highlights, a sense of an overlooked gap in the defenses",
  defense: "a layered protective shield wrapping an isolated sandbox, padlocks and permission gates, controlled gateways, calm and secure",
  takeaway: "translucent mask and glyph motifs glowing in the corners and along the edges, faint ambient circuitry and particle haze across the whole frame, the center kept calm and uncluttered (dark but not empty), minimal high-impact composition",
  cta: "a forward-motion arrow and a softly glowing question mark toward the upper area, sense of momentum inviting a swipe",
  // Generic body slide (dynamic-count posts beyond the named arc). Per-slide visual_prompt
  // should override this; this is the fallback motif for an unfilled `point` slide.
  point: "a single focal abstract object glowing in the dark with thin connecting light lines, clean high-contrast composition, one clear idea",
};

// Where the slide's TEXT sits → keep that zone of the image dark/empty so captions stay legible.
// Takeaway centers its text (centered radial scrim); every other role is bottom-aligned.
// NOTE: never use the word "text"/"overlay"/"headline"/"caption" here — these live in the
// POSITIVE prompt and FLUX renders them as literal (garbled) lettering. Describe the empty
// zone purely as composition (dark, uncluttered) and let the carousel place real copy later.
const TEXT_ZONE = {
  takeaway: "keep the central area calm and uncluttered (dark but not empty); arrange the focal elements in the corners and along the edges, with faint ambient detail elsewhere",
};
const DEFAULT_ZONE = "keep the lower portion of the frame dark, calm and uncluttered; place the focal elements in the upper third and around the edges";

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
  // Strip signage/alarm words from the accent name + mood — FLUX renders "alert"/"warning"
  // as literal lettering (a garbled title card), especially on the offensive/red theme.
  const SIGNAGE = /\b(alert|warning|danger|caution|breach|threat|notice)\b/gi;
  const cleanAccent = (accentName || "").replace(SIGNAGE, "").replace(/\s{2,}/g, " ").trim() || "red";
  const cleanMood = mood ? mood.replace(SIGNAGE, "").replace(/\s{2,}/g, " ").replace(/\s+([,.;—-])/g, "$1").replace(/,\s*,/g, ",").trim() : "";
  // Natural-language sentences (FLUX's qwen/T5 encoder favours prose over comma-tag soup).
  // Shape follows the FLUX.2 [klein] guidance: subject + lighting (the accent glow, phrased as a
  // light source — lighting is klein's highest-impact lever) + the text-safe zone, then a trailing
  // `Style: … Mood:` tag (klein's documented consistency trick). BRAND_STYLE is the constant house
  // look so every post reads as one brand; the theme accent + mood change per category. NO "no text"
  // here — that lives in the negative node.
  const styleTag = `Style: ${BRAND_STYLE}.${cleanMood ? ` Mood: ${cleanMood}.` : ""}`;
  return `${subject}. Lit by a single ${cleanAccent} (${accentHex}) accent glow against a deep navy void #05070d. ${zone}. ${styleTag}`;
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

// In-place countdown for the between-generation cooldown (overwrites the line in a TTY).
async function cooldownPause(ms) {
  let remain = Math.round(ms / 1000);
  if (!process.stdout.isTTY) {
    console.log(`  cooldown ${remain}s (ease sustained CPU/GPU load)…`);
    await sleep(ms);
    return;
  }
  while (remain > 0) {
    process.stdout.write(`\r  cooldown ${String(remain).padStart(2, " ")}s … (let CPU/GPU settle) `);
    await sleep(1000);
    remain -= 1;
  }
  process.stdout.write(`\r  cooldown done.                       \n`);
}

async function generate(promptText, seed) {
  const client_id = crypto.randomUUID();
  let graph;
  if (UI_FORMAT && FLUX2) {
    graph = loadUiGraph(promptText, seed); // execute the version-controlled workflow FILE
  } else {
    graph = FLUX2 ? buildGraphFlux2(promptText, seed) : buildGraph(promptText, seed);
    if (UPSCALE) appendUpscale(graph, FLUX2 ? "15" : "11", FLUX2 ? "16" : "12"); // gen→upscale in one graph
  }
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

// Ensure the selected FLUX.2 klein GGUF is present (auto-download Q6 etc. on first use).
if (FLUX2 && !DRY) ensureFlux2Model(F2_MODEL);

// Integrated --upscale: downscale target = this post's canvas × scale; ensure the upscale model exists.
if (UPSCALE) {
  UP_W = Math.round((post.canvas?.width ?? 1080) * UPSCALE_SCALE);
  UP_H = Math.round((post.canvas?.height ?? 1350) * UPSCALE_SCALE);
  if (!DRY) await ensureUpscaleModel(UPSCALE_MODEL);
}

// One config banner reflecting EVERY active flag, so a pipeline log shows exactly what this
// run does (model, size, steps, cfg, upscale chain, ui-format source, cooldown). Printed in
// --dry-run too (without the server version) so the config is verifiable without a GPU job.
const cfgParts = [
  `${FLUX2 ? "FLUX.2" : "FLUX.1"} model=${FLUX2 ? F2_MODEL : MODEL}`,
  `${WIDTH}x${HEIGHT}`,
  `${STEPS} steps`,
  ...(FLUX2 ? [`cfg=${F2_CFG}`] : []),
  ...(UPSCALE ? [`upscale=${UPSCALE_MODEL} → ${UP_W}x${UP_H}${UPSCALE_SCALE !== 1 ? ` (canvas ×${UPSCALE_SCALE})` : ""}`] : []),
  ...(UI_FORMAT && FLUX2 ? [`ui-format=${WF_FILE()} (file's steps/cfg/size win)`] : []),
  ...(COOLDOWN_MS ? [`cooldown=${Math.round(COOLDOWN_MS / 1000)}s`] : ["cooldown=off"]),
];
// confirm ComfyUI is reachable + the model exists
if (!DRY) {
  let stats;
  try { stats = await fetch(`${URL_BASE}/system_stats`).then((r) => r.json()); }
  catch { console.error(`✗ Can't reach ComfyUI at ${URL_BASE}. Start ComfyUI, then retry. (override with COMFYUI_URL)`); process.exit(1); }
  console.log(`ComfyUI ${stats?.system?.comfyui_version ?? "?"} @ ${URL_BASE} · ${cfgParts.join(" · ")}`);
} else {
  console.log(`DRY RUN @ ${URL_BASE} · ${cfgParts.join(" · ")}`);
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
for (let ti = 0; ti < targets.length; ti++) {
  const slide = targets[ti];
  // Cooldown between generations (not before the first) — eases sustained load. Live countdown.
  if (COOLDOWN_MS && ti > 0 && !DRY) await cooldownPause(COOLDOWN_MS);
  const role = ROLE_FILE[slide.role] ?? slide.role;
  const nn = String(slide.slide).padStart(2, "0");
  const destName = `${nn}_${role}.png`;
  const promptText = buildPrompt(slide, accentHex, accentName, topic, mood);
  const seed = postBaseSeed + slide.slide;
  if (DRY) {
    console.log(`\n[slide ${slide.slide} ${slide.role}] seed=${seed}\n  ${promptText}`);
    if (UI_FORMAT && FLUX2) { // validate the file→API conversion + patching without submitting
      const g = loadUiGraph(promptText, seed);
      const kinds = Object.values(g).map((n) => n.class_type);
      console.log(`  (ui-format dry-check: ${kinds.length} nodes — ${kinds.join(", ")})`);
    }
    continue;
  }

  process.stdout.write(`  slide ${slide.slide} (${slide.role})… `);
  const t0 = Date.now();
  // In-place elapsed-seconds counter while ComfyUI renders (each FLUX gen is slow on 8GB).
  const tick = process.stdout.isTTY
    ? setInterval(() => process.stdout.write(`\r  slide ${slide.slide} (${slide.role})… ${Math.round((Date.now() - t0) / 1000)}s  `), 1000)
    : null;
  try {
    const img = await generate(promptText, seed);
    writeFileSync(path.join(destDir, destName), await fetchImage(img));
  } catch (e) {
    if (tick) clearInterval(tick);
    process.stdout.write(`\r  slide ${slide.slide} (${slide.role})… ✗ ${e.message}        \n`);
    continue;
  }
  if (tick) clearInterval(tick);
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
  process.stdout.write(`\r  slide ${slide.slide} (${slide.role})… ✓ ${destName} (${((Date.now() - t0) / 1000).toFixed(0)}s)        \n`);
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
