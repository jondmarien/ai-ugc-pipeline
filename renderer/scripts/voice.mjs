// npm run voice -- <post-key> [--voice-ref path/to/reference.wav]
// Thin wrapper around scripts/voice-voxcpm.py — generates reel narration with
// VoxCPM2 into renderer/public/audio/<prefix>/voice.wav, then you re-run reel.
//
// Requires a local VoxCPM2 install (python -m pip install voxcpm soundfile;
// CUDA torch recommended). The JS pipeline never auto-installs ML deps.
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RENDERER = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const args = process.argv.slice(2);
if (!args.length) {
  console.error('Usage: npm run voice -- <post-key> [--voice-ref ref.wav]');
  process.exit(1);
}

const py = process.platform === "win32" ? "python" : "python3";
const script = path.join(RENDERER, "scripts", "voice-voxcpm.py");
const res = spawnSync(py, [script, ...args], { cwd: RENDERER, stdio: "inherit" });
process.exit(res.status ?? 1);
