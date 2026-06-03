// bun run pipeline -- <post-key> [<post-key> ...] [flags]
// THE one-command render pipeline. For each post it runs, in order:
//   1. art          backgrounds via ComfyUI  (only if inner slides lack art; --art forces, --no-art skips)
//   2. export       carousel PNGs
//   3. package      upload-ready package files
//   4. free-comfyui release ComfyUI's VRAM   (so VoxCPM/Whisper get the GPU; 8GB = one model at a time)
//   5. voice        VoxCPM2/Bark/HTTP TTS     (only if video.audio.voice_mode needs generating)
//   6. align        Whisper word-synced captions
//   7. reel         Remotion reel — AUTO-EMBEDS the voice from step 5 (no more silent reels)
//
// Flags:
//   --flux2        use the FLUX.2 klein graph for step 1 (else FLUX.1-schnell)
//   --art          force background regeneration even if slides already have art
//   --no-art       skip background generation
//   --no-package   skip the package step
//   --no-voice     skip voice+align (render a silent reel)
//   --no-reel      stop after the carousel/package
//   --no-fit-voice don't trim/realign the reel to the voice length
//   --tail=N       seconds of silence to keep after the voice (reel; default 0.6)
//   --seed=N       voice seed (consistent speaker) — forwarded to `bun run voice`
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RENDERER = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const POSTS = path.join(RENDERER, "content", "posts");
const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith("--")));
const keys = argv.filter((a) => !a.startsWith("--"));
if (!keys.length) {
  console.error("Usage: bun run pipeline -- <post-key> [<post-key> ...] [--flux2] [--art|--no-art] [--no-voice] [--no-reel] [--no-package] [--seed=N] [--tail=N]");
  process.exit(1);
}
const seedArg = [...flags].find((f) => f.startsWith("--seed="));
const tailArg = [...flags].find((f) => f.startsWith("--tail="));

const DRY = flags.has("--dry-run");
const bun = process.platform === "win32" ? "bun.exe" : "bun";
function step(label, runArgs, { env, fatal = true } = {}) {
  console.log(`${DRY ? "   • would run:" : "\n── " + label + " ──"}  bun run ${runArgs.join(" ")}`);
  if (DRY) return;
  const r = spawnSync(bun, ["run", ...runArgs], {
    cwd: RENDERER,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, ...env },
  });
  if (r.status !== 0) {
    if (!fatal) {
      console.warn(`⚠ '${label}' failed (exit ${r.status}) — continuing (slides fall back to procedural backgrounds).`);
      return;
    }
    throw new Error(`'${label}' failed (exit ${r.status})`);
  }
}

function runPost(key) {
  const file = readdirSync(POSTS).find((f) => f.endsWith(".json") && f.includes(key));
  if (!file) throw new Error(`No post JSON matching "${key}"`);
  const fullKey = file.replace(/\.json$/, "");
  const post = JSON.parse(readFileSync(path.join(POSTS, file), "utf8"));

  const voiceMode = post.video?.audio?.voice_mode ?? "none";
  const innerNeedsArt = (post.slides ?? []).some((s) => s.role !== "cover" && !s.background_asset);
  const wantsArt = flags.has("--art") || (!flags.has("--no-art") && innerNeedsArt);
  const wantsVoice = !flags.has("--no-voice") && ["voxcpm2", "voxcpm2-0.5b", "bark", "http"].includes(voiceMode);
  const wantsReel = !flags.has("--no-reel") && !!post.video?.enabled;

  console.log(`\n╭─ ${fullKey}`);
  console.log(`│  art=${wantsArt ? (flags.has("--flux2") ? "flux2" : "flux1") : "skip"}  ·  voice=${wantsVoice ? voiceMode : "skip"}  ·  reel=${wantsReel ? "yes" : "skip"}`);
  console.log(`╰─`);

  if (wantsArt) step("art (backgrounds)", ["art", "--", fullKey, ...(flags.has("--flux2") ? ["--flux2"] : [])], { fatal: false });
  step("export (carousel)", ["export", "--", fullKey]);
  if (!flags.has("--no-package")) step("package (upload files)", ["package", "--", fullKey]);

  if (wantsVoice) {
    step("free-comfyui (release GPU)", ["free-comfyui"]); // non-fatal if ComfyUI is down
    step("voice (TTS)", ["voice", "--", fullKey, ...(seedArg ? [seedArg] : [])]);
    step("align (caption sync)", ["align", "--", fullKey]);
  }

  if (wantsReel) {
    const reelArgs = ["reel", "--", fullKey];
    if (!flags.has("--no-fit-voice")) reelArgs.push("--fit-voice");
    if (tailArg) reelArgs.push(tailArg);
    step("reel (audio auto-embedded)", reelArgs);
  }
  console.log(`\n✓ ${fullKey} → pipeline/renders/${fullKey}/`);
}

let ok = 0;
for (const key of keys) {
  try {
    runPost(key);
    ok++;
  } catch (e) {
    console.error(`\n✗ ${key}: ${e.message}`);
    if (keys.length === 1) process.exit(1);
    console.error("  (continuing with the next post)");
  }
}
console.log(`\n${"=".repeat(48)}\n✓ Pipeline finished — ${ok}/${keys.length} post(s) rendered.`);
