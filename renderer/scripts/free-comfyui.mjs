// bun run free-comfyui  — unload ComfyUI's models + free its VRAM via the /free endpoint.
import { comfyBaseUrl } from "./lib/comfyui-env.mjs";

const URL_BASE = comfyBaseUrl();

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