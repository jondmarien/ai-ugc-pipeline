// bun run art -- <post-key> [--all] [--dry-run] [--4bit] [--steps=N] [--width=N] [--height=N] [--model=ID]
// Generates per-slide background art with FLUX (local) by reading each slide's
// visual_prompt, writing to public/backgrounds/<prefix>/, and updating the post JSON.
// Uses renderer/.venv (uv) → `uv run python` → system python (like voice/align).
//
// Convenience flags map to the env vars art-flux.py reads — so you don't need to set
// shell env vars (handy on PowerShell where `VAR=val cmd` doesn't work):
//   --4bit            ART_QUANTIZE=4bit   (bitsandbytes NF4 — fits 8GB, much faster)
//   --steps=N         ART_STEPS
//   --width=/--height= ART_WIDTH / ART_HEIGHT
//   --model=ID        ART_MODEL (e.g. black-forest-labs/FLUX.2-klein-4B)
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RENDERER = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const args = process.argv.slice(2);
if (!args.length || args.every((a) => a.startsWith("--"))) {
  console.error("Usage: bun run art -- <post-key> [--all] [--dry-run] [--4bit] [--steps=N] [--width=N] [--height=N] [--model=ID]");
  process.exit(1);
}

// Translate convenience flags → env overrides; pass non-flag/recognized-passthrough to python.
const env = { ...process.env };
const passthrough = [];
for (const a of args) {
  if (a === "--4bit" || a === "--quant=4bit" || a === "--nf4") env.ART_QUANTIZE = "4bit";
  else if (a.startsWith("--steps=")) env.ART_STEPS = a.split("=")[1];
  else if (a.startsWith("--width=")) env.ART_WIDTH = a.split("=")[1];
  else if (a.startsWith("--height=")) env.ART_HEIGHT = a.split("=")[1];
  else if (a.startsWith("--model=")) env.ART_MODEL = a.split("=")[1];
  else passthrough.push(a); // <post-key>, --all, --dry-run
}

const script = path.join(RENDERER, "scripts", "art-flux.py");
const venvPy = process.platform === "win32"
  ? path.join(RENDERER, ".venv", "Scripts", "python.exe")
  : path.join(RENDERER, ".venv", "bin", "python");

let cmd, cmdArgs;
if (existsSync(venvPy)) {
  cmd = venvPy; cmdArgs = [script, ...passthrough];
} else if (spawnSync(process.platform === "win32" ? "where" : "which", ["uv"]).status === 0) {
  cmd = "uv"; cmdArgs = ["run", "python", script, ...passthrough];
} else {
  cmd = process.platform === "win32" ? "python" : "python3"; cmdArgs = [script, ...passthrough];
  console.warn('⚠ No .venv or uv — using system python. Recommended: uv pip install "diffusers>=0.31" transformers accelerate torch sentencepiece protobuf pillow');
}
const res = spawnSync(cmd, cmdArgs, { cwd: RENDERER, stdio: "inherit", env });
process.exit(res.status ?? 1);
