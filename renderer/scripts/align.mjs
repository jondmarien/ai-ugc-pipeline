// bun run align -- <post-key>
// Runs Whisper (faster-whisper) on the post's generated voice.wav and writes exact
// per-word timings into video.beats[].words[] so word/highlight captions sync tightly.
// Uses renderer/.venv (uv) → `uv run python` → system python, like `bun run voice`.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RENDERER = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const args = process.argv.slice(2);
if (!args.length) {
  console.error("Usage: bun run align -- <post-key>   (run `bun run voice -- <key>` first to make voice.wav)");
  process.exit(1);
}

const script = path.join(RENDERER, "scripts", "align-whisper.py");
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
  console.warn("⚠ No .venv or uv — using system python. Recommended: `uv pip install faster-whisper`.");
}
const res = spawnSync(cmd, cmdArgs, { cwd: RENDERER, stdio: "inherit" });
process.exit(res.status ?? 1);
