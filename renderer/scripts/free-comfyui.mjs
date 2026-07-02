// bun run free-comfyui
//
// Pipeline step (local Comfy path only): POST ComfyUI /free to unload models and free VRAM
// before voice/TTS so the GPU is available. Non-fatal if ComfyUI is down — pipeline continues.
//
// Env: COMFYUI_URL (default http://127.0.0.1:8000). Skipped when using --higgsfield art.

import { flagSet, showHelpAndExit } from "./lib/cli.mjs";
import { comfyBaseUrl } from "./lib/comfyui-env.mjs";

const args = process.argv.slice(2);
const flags = flagSet(args);

const HELP = `
bun run free-comfyui — release ComfyUI VRAM between art and voice

USAGE
  bun run free-comfyui

ENV
  COMFYUI_URL   Comfy API base (default http://127.0.0.1:8000)

BEHAVIOR
  POST /free with unload_models + free_memory. Warns and exits 0 if unreachable.

PIPELINE
  Inserted automatically after art when voice runs (not with --higgsfield).

EXAMPLES
  bun run free-comfyui
`;

if (flags.has("--help") || flags.has("-h") || args.includes("-h"))
  showHelpAndExit(HELP);

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
    console.warn(
      `⚠ ComfyUI /free returned ${res.status} (is it running?). Continuing.`,
    );
  }
} catch {
  console.warn(
    `⚠ ComfyUI not reachable at ${URL_BASE} — nothing to free. Continuing.`,
  );
}
