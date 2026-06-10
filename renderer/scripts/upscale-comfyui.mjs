// bun run upscale -- <post-key> [--upscale-model=NAME.pth] [--upscale-scale=N] [--only=N[,N]] [--dry-run]
// OPT-IN quality pass. Sharpens each slide's existing background by running it through a tiled GAN
// upscaler on the SAME running ComfyUI server (LoadImage → UpscaleModelLoader → ImageUpscaleWithModel
// → ImageScale back down to the carousel canvas → SaveImage), then overwrites the background file in
// place. This is the "generate small, upscale after" path: the GAN adds real detail that re-downscaling
// to 1080×1350 keeps crisp — better than asking the distilled diffusion model for more steps.
//
// Default model: RealESRGAN_x4plus.pth (BSD-3, commercial-safe). Override with --upscale-model=4x-UltraSharp.pth
// (verify that model's licence before shipping). The model lives in ComfyUI's models/upscale_models/ dir;
// if it's missing this auto-downloads the known ones (RealESRGAN_x4plus from the xinntao GitHub release,
// 4x-UltraSharp from HF lokCX/4x-Ultrasharp) to COMFYUI_UPSCALE_DIR, then re-scans. If it still can't be
// registered (or is unknown) the run warns and skips (non-fatal — backgrounds stay un-upscaled).
//
// Mirrors art-comfyui.mjs: HTTP-only, no diffusers, ComfyUI just has to be running. Config via env:
//   COMFYUI_URL (default http://127.0.0.1:8000), UPSCALE_MODEL.
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RENDERER = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const POSTS = path.join(RENDERER, "content", "posts");

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const opt = (name, def) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=")[1] : def;
};
const key = args.find((a) => !a.startsWith("--"));
if (!key) {
  console.error("Usage: bun run upscale -- <post-key> [--upscale-model=NAME.pth] [--upscale-scale=N] [--only=N[,N]] [--dry-run]");
  process.exit(1);
}

const URL_BASE = (process.env.COMFYUI_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const MODEL = opt("upscale-model", process.env.UPSCALE_MODEL || "RealESRGAN_x4plus.pth");
const SCALE = Math.max(0.25, Number(opt("upscale-scale", "1")) || 1); // final size = canvas × SCALE
const DRY = flags.has("--dry-run");
const onlyArg = opt("only", "");
const onlySet = onlyArg ? new Set(onlyArg.split(",").map((x) => Number(x.trim())).filter((n) => !Number.isNaN(n))) : null;

// Where ComfyUI keeps upscale models, and how to auto-fetch the common ones (same idea as the Q6
// GGUF auto-download in art-comfyui). `.pth` = a PyTorch weights checkpoint. Override the dir with
// COMFYUI_UPSCALE_DIR. Both sources are direct downloads (no hf CLI needed).
const COMFY_UPSCALE_DIR = process.env.COMFYUI_UPSCALE_DIR || "E:\\ComfyUI\\models\\upscale_models";
const MODEL_SOURCES = {
  "RealESRGAN_x4plus.pth": "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth",
  "4x-UltraSharp.pth": "https://huggingface.co/lokCX/4x-Ultrasharp/resolve/main/4x-UltraSharp.pth?download=true",
};
async function ensureUpscaleModel(modelFile) {
  const url = MODEL_SOURCES[modelFile];
  if (!url) return false;                          // unknown model — caller warns with manual steps
  let dirExists = false;
  try { dirExists = existsSync(COMFY_UPSCALE_DIR); } catch { dirExists = false; }
  if (!dirExists) {
    console.warn(`  ⚠ ComfyUI upscale dir not found at ${COMFY_UPSCALE_DIR} (remote ComfyUI?). Put ${modelFile} there, or set COMFYUI_UPSCALE_DIR.`);
    return false;
  }
  const dest = path.join(COMFY_UPSCALE_DIR, modelFile);
  if (existsSync(dest)) return true;               // already on disk
  console.log(`  ↓ ${modelFile} not found — downloading (~65 MB) from ${url.split("?")[0]} …`);
  try {
    const r = await fetch(url, { redirect: "follow" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
    console.log(`  ✓ ${modelFile} downloaded to ${COMFY_UPSCALE_DIR}.`);
    return true;
  } catch (e) {
    console.warn(`  ⚠ auto-download failed (${e.message}). Get it manually:\n     ${url.split("?")[0]}\n     → ${COMFY_UPSCALE_DIR}`);
    return false;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Upload a local PNG to ComfyUI's input dir so LoadImage can reference it.
async function uploadImage(absPath) {
  const bytes = readFileSync(absPath);
  const form = new FormData();
  form.append("image", new Blob([bytes], { type: "image/png" }), path.basename(absPath));
  form.append("overwrite", "true");
  const r = await fetch(`${URL_BASE}/upload/image`, { method: "POST", body: form });
  if (!r.ok) throw new Error(`/upload/image ${r.status}: ${await r.text()}`);
  const j = await r.json();
  return j.subfolder ? `${j.subfolder}/${j.name}` : j.name;
}

function buildGraph(imageRef, targetW, targetH) {
  return {
    "1": { class_type: "LoadImage", inputs: { image: imageRef } },
    "2": { class_type: "UpscaleModelLoader", inputs: { model_name: MODEL } },
    "3": { class_type: "ImageUpscaleWithModel", inputs: { upscale_model: ["2", 0], image: ["1", 0] } },
    "4": { class_type: "ImageScale", inputs: { image: ["3", 0], upscale_method: "lanczos", width: targetW, height: targetH, crop: "disabled" } },
    "5": { class_type: "SaveImage", inputs: { filename_prefix: "upscale_pipeline/up", images: ["4", 0] } },
  };
}

async function runGraph(graph) {
  const client_id = crypto.randomUUID();
  const res = await fetch(`${URL_BASE}/prompt`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: graph, client_id }),
  });
  if (!res.ok) throw new Error(`/prompt ${res.status}: ${await res.text()}`);
  const { prompt_id, node_errors } = await res.json();
  if (node_errors && Object.keys(node_errors).length) throw new Error(`node_errors: ${JSON.stringify(node_errors)}`);
  const deadline = Date.now() + 5 * 60 * 1000;
  while (Date.now() < deadline) {
    await sleep(1500);
    const h = await fetch(`${URL_BASE}/history/${prompt_id}`).then((r) => r.json());
    const entry = h[prompt_id];
    if (!entry) continue;
    if (entry.status?.status_str === "error") throw new Error(`ComfyUI error: ${JSON.stringify(entry.status?.messages)}`);
    const out = entry.outputs && Object.values(entry.outputs).find((o) => o.images?.length);
    if (out) return out.images[0];
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
const post = JSON.parse(readFileSync(path.join(POSTS, file), "utf8"));
const canvasW = post.canvas?.width ?? 1080;
const canvasH = post.canvas?.height ?? 1350;
const targetW = Math.round(canvasW * SCALE);
const targetH = Math.round(canvasH * SCALE);

const bgAbs = (s) => (s.background_asset ? path.join(RENDERER, "public", s.background_asset.replace(/^[\\/]+/, "")) : null);
const targets = (post.slides ?? []).filter((s) => {
  if (onlySet) return onlySet.has(s.slide);
  const p = bgAbs(s);
  return p && existsSync(p);
});
if (!targets.length) { console.log("No existing slide backgrounds to upscale (run art first)."); process.exit(0); }

if (DRY) {
  console.log(`DRY RUN — would upscale ${targets.length} slide background(s) with ${MODEL} → ${targetW}x${targetH} (canvas ×${SCALE}).`);
  for (const s of targets) console.log(`  slide ${s.slide} (${s.role}) ← ${s.background_asset}`);
  process.exit(0);
}

// Reachability + model presence (warn-and-skip the whole run if the upscale model isn't installed).
let available = [];
try {
  const info = await fetch(`${URL_BASE}/object_info/UpscaleModelLoader`).then((r) => r.json());
  available = info?.UpscaleModelLoader?.input?.required?.model_name?.[0] ?? [];
} catch {
  console.error(`✗ Can't reach ComfyUI at ${URL_BASE}. Start ComfyUI, then retry. (override with COMFYUI_URL)`);
  process.exit(1);
}
if (Array.isArray(available) && available.length && !available.includes(MODEL)) {
  // Not registered yet — try to auto-download a known model, then re-scan ComfyUI's list.
  const got = await ensureUpscaleModel(MODEL);
  if (got) {
    try {
      const info2 = await fetch(`${URL_BASE}/object_info/UpscaleModelLoader`).then((r) => r.json());
      available = info2?.UpscaleModelLoader?.input?.required?.model_name?.[0] ?? available;
    } catch { /* keep prior list */ }
  }
  if (!available.includes(MODEL)) {
    console.warn(`⚠ upscale model "${MODEL}" not available to ComfyUI${got ? " yet — downloaded to disk, but ComfyUI may need a restart/refresh to register it" : ""} — skipping upscale.`);
    console.warn(`  Available now: ${available.join(", ") || "(none)"}`);
    if (!got && !MODEL_SOURCES[MODEL]) console.warn(`  Unknown model; drop the .pth in ${COMFY_UPSCALE_DIR} and re-run with --upscale-model=<name>.`);
    process.exit(0); // non-fatal: the pipeline continues with the un-upscaled backgrounds
  }
}

console.log(`Upscaling ${targets.length} background(s) @ ${URL_BASE} · ${MODEL} → ${targetW}x${targetH} (canvas ×${SCALE})`);
let ok = 0;
for (const slide of targets) {
  const abs = bgAbs(slide);
  process.stdout.write(`  slide ${slide.slide} (${slide.role})… `);
  try {
    const ref = await uploadImage(abs);
    const img = await runGraph(buildGraph(ref, targetW, targetH));
    writeFileSync(abs, await fetchImage(img)); // overwrite the background in place
    ok++;
    process.stdout.write(`✓\n`);
  } catch (e) {
    process.stdout.write(`✗ ${e.message}\n`);
  }
}

// Log the upscale model in LICENSES.md once (provenance for the sharpened backgrounds).
if (ok > 0) {
  const licPath = path.join(path.dirname(RENDERER), "LICENSES.md");
  try {
    const note = `- Image upscaler: \`${MODEL}\` (ComfyUI UpscaleModelLoader) — verify the model's licence is commercial-safe (RealESRGAN x4plus = BSD-3; 4x-UltraSharp = check terms).`;
    const cur = existsSync(licPath) ? readFileSync(licPath, "utf8") : "";
    if (!cur.includes(`Image upscaler: \`${MODEL}\``)) writeFileSync(licPath, cur + (cur.endsWith("\n") || !cur ? "" : "\n") + note + "\n");
  } catch { /* non-fatal */ }
}
console.log(`\n✓ Upscaled ${ok}/${targets.length} background(s).`);
