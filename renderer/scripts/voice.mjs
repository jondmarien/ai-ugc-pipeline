// npm run voice -- <post-key> [--voice-ref ref.wav]
// Generates reel narration into renderer/public/audio/<prefix>/voice.wav, routing by
// the post's video.audio.voice_mode:
//   voxcpm2 → scripts/voice-voxcpm.py (local model; uses .venv / uv automatically)
//   http    → scripts/voice-http.mjs  (OpenAI-compatible /v1/audio/speech server)
//   file    → reminder to drop your own voice.wav
// Override the route with --voxcpm2 or --http.  Then re-run: npm run reel -- <post-key>
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RENDERER = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const POSTS = path.join(RENDERER, "content", "posts");
const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const pos = args.filter((a) => !a.startsWith("--"));
const key = pos[0];

if (!key) {
  console.error("Usage: npm run voice -- <post-key> [--voice-ref ref.wav] [--http|--voxcpm2]");
  process.exit(1);
}

// Resolve voice_mode from the post (flags override).
let mode = "voxcpm2";
try {
  const f = readdirSync(POSTS).find((x) => x.endsWith(".json") && x.includes(key));
  if (f) mode = JSON.parse(readFileSync(path.join(POSTS, f), "utf8")).video?.audio?.voice_mode ?? "voxcpm2";
} catch { /* fall through to default */ }
if (flags.has("--http")) mode = "http";
if (flags.has("--voxcpm2")) mode = "voxcpm2";

if (mode === "none") {
  console.log(`Post ${key} has voice_mode=none — nothing to generate. Set --voice=voxcpm2|http (or edit video.audio.voice_mode).`);
  process.exit(0);
}
if (mode === "file") {
  console.log(`voice_mode=file — drop your own WAV at renderer/public/audio/<prefix>/voice.wav, then: npm run reel -- ${key}`);
  process.exit(0);
}

if (mode === "http") {
  const res = spawnSync("node", [path.join(RENDERER, "scripts", "voice-http.mjs"), ...args], { cwd: RENDERER, stdio: "inherit" });
  process.exit(res.status ?? 1);
}

// mode === "voxcpm2": pick the venv python (uv-created) → uv run → system python.
const script = path.join(RENDERER, "scripts", "voice-voxcpm.py");
const venvPy = process.platform === "win32"
  ? path.join(RENDERER, ".venv", "Scripts", "python.exe")
  : path.join(RENDERER, ".venv", "bin", "python");

let cmd, cmdArgs;
if (existsSync(venvPy)) {
  cmd = venvPy; cmdArgs = [script, ...args];
} else if (spawnSync(process.platform === "win32" ? "where" : "which", ["uv"]).status === 0) {
  cmd = "uv"; cmdArgs = ["run", "python", script, ...args]; // uv auto-uses ./.venv
} else {
  cmd = process.platform === "win32" ? "python" : "python3"; cmdArgs = [script, ...args];
  console.warn("⚠ No .venv or uv found — using system python. Recommended: `uv venv && uv pip install voxcpm soundfile torch`.");
}
console.log(`Running: ${path.basename(cmd)} ${cmdArgs.map((a) => (a.includes(" ") ? `"${a}"` : a)).join(" ")}\n`);
const res = spawnSync(cmd, cmdArgs, { cwd: RENDERER, stdio: "inherit" });
process.exit(res.status ?? 1);
