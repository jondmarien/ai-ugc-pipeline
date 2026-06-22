import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

export function comfyBaseUrl() {
  return (process.env.COMFYUI_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
}

export function defaultUpscaleDir() {
  return process.env.COMFYUI_UPSCALE_DIR || "E:\\ComfyUI\\models\\upscale_models";
}

export function defaultUnetDir() {
  return process.env.COMFYUI_UNET_DIR || "E:\\ComfyUI\\models\\unet";
}

export const UPSCALE_MODEL_URLS = {
  "RealESRGAN_x4plus.pth":
    "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth",
  "4x-UltraSharp.pth":
    "https://huggingface.co/lokCX/4x-Ultrasharp/resolve/main/4x-UltraSharp.pth?download=true",
};

/**
 * Download known upscale .pth if missing. Returns true if file exists or was downloaded.
 */
export async function ensureUpscaleModelOnDisk(modelFile, upscaleDir = defaultUpscaleDir()) {
  const url = UPSCALE_MODEL_URLS[modelFile];
  if (!url) return false;
  let dirExists = false;
  try {
    dirExists = existsSync(upscaleDir);
  } catch {
    dirExists = false;
  }
  if (!dirExists) {
    console.warn(
      `  ⚠ ComfyUI upscale dir not found at ${upscaleDir} (remote ComfyUI?). Put ${modelFile} there, or set COMFYUI_UPSCALE_DIR.`,
    );
    return false;
  }
  const dest = path.join(upscaleDir, modelFile);
  if (existsSync(dest)) return true;
  console.log(`  ↓ ${modelFile} not found — downloading (~65 MB) from ${url.split("?")[0]} …`);
  try {
    const r = await fetch(url, { redirect: "follow" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
    console.log(`  ✓ ${modelFile} downloaded to ${upscaleDir}.`);
    return true;
  } catch (e) {
    console.warn(
      `  ⚠ auto-download failed (${e.message}). Get it manually:\n     ${url.split("?")[0]}\n     → ${upscaleDir}`,
    );
    return false;
  }
}

const KLEIN_GGUF_REPO = process.env.KLEIN_GGUF_REPO || "unsloth/FLUX.2-klein-4B-GGUF";

export function ensureFlux2Model(modelFile, unetDir = defaultUnetDir()) {
  if (!/^flux-2-klein-4b-.*\.gguf$/i.test(modelFile)) return;
  let dirExists = false;
  try {
    dirExists = existsSync(unetDir);
  } catch {
    dirExists = false;
  }
  if (!dirExists) {
    console.warn(
      `  ⚠ ComfyUI unet dir not found at ${unetDir} (remote ComfyUI?). Make sure ${modelFile} is present there, or set COMFYUI_UNET_DIR.`,
    );
    return;
  }
  if (existsSync(path.join(unetDir, modelFile))) return;
  console.log(`  ↓ ${modelFile} not in ${unetDir} — downloading from ${KLEIN_GGUF_REPO} via hf…`);
  const r = spawnSync("hf", ["download", KLEIN_GGUF_REPO, modelFile, "--local-dir", unetDir], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (r.status !== 0) {
    console.warn(
      `  ⚠ auto-download failed (hf exit ${r.status ?? "?"}). Run manually:  hf download ${KLEIN_GGUF_REPO} ${modelFile} --local-dir ${unetDir}`,
    );
  } else {
    console.log(`  ✓ ${modelFile} downloaded.`);
  }
}