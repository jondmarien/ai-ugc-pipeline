// bun run art -- <post-key> [--all] [--dry-run]
// Generates per-slide background art with FLUX.1-schnell (local, Apache-2.0) by
// reading each slide's visual_prompt, writing to public/backgrounds/<prefix>/, and
// updating the post JSON. Uses renderer/.venv (uv) → `uv run python` → system python,
// exactly like `bun run voice` / `bun run align`. No server/Docker.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RENDERER = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const args = process.argv.slice(2);
if (!args.length || args.every((a) => a.startsWith("--"))) {
  console.error("Usage: bun run art -- <post-key> [--all] [--dry-run]");
  process.exit(1);
}

const script = path.join(RENDERER, "scripts", "art-flux.py");
const venvPy = process.platform === "win32"
  ? path.join(RENDERER, ".venv", "Scripts", "python.exe")
  : path.join(RENDERER, ".venv", "bin", "python");

let cmd, cmdArgs;
if (existsSync(venvPy)) {
  cmd = venvPy; cmdArgs = [script, ...args];
} else if (spawnSync(process.platform === "win32" ? "where" : "which", ["uv"]).status === 0) {
  cmd = "uv"; cmdArgs = ["run", "python", script, ...args];
} else {
  cmd = process.platform === "win32" ? "python" : "python3"; cmdArgs = [script, ...args];
  console.warn('⚠ No .venv or uv — using system python. Recommended: uv pip install "diffusers>=0.31" transformers accelerate torch sentencepiece protobuf pillow');
}
const res = spawnSync(cmd, cmdArgs, { cwd: RENDERER, stdio: "inherit" });
process.exit(res.status ?? 1);
