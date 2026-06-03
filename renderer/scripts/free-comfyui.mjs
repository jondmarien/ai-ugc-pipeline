// bun run free-comfyui  — unload ComfyUI's models + free its VRAM via the /free endpoint.
//
// Use at the image→audio handoff in the pipeline: ComfyUI is a persistent server that
// keeps the diffusion model resident, while VoxCPM (voice) / Whisper (align) load their
// own ~5GB models in a separate process. On an 8GB GPU the two can't coexist, so call
// this AFTER all image generation and BEFORE `bun run voice` / `bun run align`.
// Non-fatal: if ComfyUI isn't running there's nothing to free.
//
// Override the target with COMFYUI_URL (default http://127.0.0.1:8000).
const URL_BASE = (process.env.COMFYUI_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

try {
  const res = await fetch(`${URL_BASE}/free`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ unload_models: true, free_memory: true }),
  });
  if (res.ok) {
    console.log(`✓ ComfyUI unloaded models + freed VRAM (${URL_BASE}).`);
  } else {
    console.warn(`⚠ ComfyUI /free returned ${res.status} (is it running?). Continuing.`);
  }
} catch {
  console.warn(`⚠ ComfyUI not reachable at ${URL_BASE} — nothing to free. Continuing.`);
}
