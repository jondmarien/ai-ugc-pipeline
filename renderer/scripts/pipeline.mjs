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
//   --flux1        use the legacy FLUX.1-schnell graph for step 1 (default is FLUX.2 klein)
//   --art          force background regeneration even if slides already have art
//   --no-art       skip background generation
//   --no-package   skip the package step
//   --no-voice     skip voice+align (render a silent reel)
//   --no-reel      stop after the carousel/package
//   --no-fit-voice don't trim/realign the reel to the voice length
//   --tail=N       seconds of silence to keep after the voice (reel; default 0.6)
//   --seed=N       voice seed (consistent speaker) — forwarded to `bun run voice`
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RENDERER = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const POSTS = path.join(RENDERER, "content", "posts");
const argv = process.argv.slice(2);
// --custom-voice <path>: capture its value (an authorized reference WAV to clone) and keep
// that path out of the positional post-keys list so it isn't treated as another post.
const cvIdx = argv.indexOf("--custom-voice");
const customVoice = cvIdx >= 0 ? argv[cvIdx + 1] : null;
const cvtIdx = argv.indexOf("--custom-voice-text");
const customVoiceText = cvtIdx >= 0 ? argv[cvtIdx + 1] : null;
// indices whose value is consumed by a flag (so they're NOT positional post-keys).
// Guard with >=0 — otherwise an absent flag (indexOf -1) would exclude argv[0] (the key).
const consumed = new Set([cvIdx, cvtIdx].filter((i) => i >= 0).map((i) => i + 1));
const flags = new Set(argv.filter((a) => a.startsWith("--")));
const keys = argv.filter((a, i) => !a.startsWith("--") && !consumed.has(i));
if (!keys.length) {
  console.error("Usage: bun run pipeline -- <post-key> [<post-key> ...] [--flux1] [--art|--no-art] [--voice=voxcpm2|voxcpm2-0.5b|bark|http|none] [--vox0.5|--vox2] [--custom-voice path.wav] [--custom-voice-text \"transcript\"] [--no-hifi] [--no-clone] [--captions=block|word|highlight] [--passes=N] [--q6] [--upscale [--upscale-model=NAME] [--upscale-scale=N]] [--ui-format] [--no-voice] [--no-reel] [--no-package] [--seed=N] [--tail=N]");
  process.exit(1);
}
const seedArg = [...flags].find((f) => f.startsWith("--seed="));
const tailArg = [...flags].find((f) => f.startsWith("--tail="));
// Captions default to "highlight" for pipeline reels; override with --captions=block|word.
const capFlag = [...flags].find((f) => f.startsWith("--captions="))?.split("=")[1];
const captionMode = ["block", "word", "highlight"].includes(capFlag) ? capFlag : "highlight";
// Opt-in quality knobs — all default OFF; only meaningful with the art step (or, for --upscale,
// when there are background images to sharpen). They don't change a normal `bun run pipeline` run.
const passesArg = [...flags].find((f) => f.startsWith("--passes="));   // forwarded to `bun run art`
const wantsQ6 = flags.has("--q6");                                     // higher-quality Q6_K GGUF for this run
const wantsUpscale = flags.has("--upscale");                           // GAN upscale (integrated into art when art runs)
const upscaleModelArg = [...flags].find((f) => f.startsWith("--upscale-model="));
const upscaleScaleArg = [...flags].find((f) => f.startsWith("--upscale-scale="));
// --ui-format: art executes the version-controlled workflow FILE (renderer/comfyui-workflows/) instead
// of the code-built graph — with --upscale it picks the _with_upscale file. The file's settings win.
const wantsUiFormat = flags.has("--ui-format");
const Q6_MODEL = "flux-2-klein-4b-Q6_K.gguf";                          // auto-downloaded by art-comfyui if missing

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
  // Voice override for this run (else use the post's voice_mode):
  //   --voice=<mode> (voxcpm2 | voxcpm2-0.5b | bark | http | none)  ·  --vox2 / --vox0.5 are aliases.
  const voiceFlag = [...flags].find((f) => f.startsWith("--voice="))?.split("=")[1];
  const voiceOverride = flags.has("--vox0.5")
    ? "voxcpm2-0.5b"
    : flags.has("--vox2")
      ? "voxcpm2"
      : voiceFlag && ["voxcpm2", "voxcpm2-0.5b", "bark", "http", "none"].includes(voiceFlag)
        ? voiceFlag
        : null;
  const effVoiceMode = voiceOverride || voiceMode;
  // Any slide that still needs art — INCLUDING the cover (covers used to be skipped here, so the
  // pipeline never generated 01_cover.png). A locked custom asset (asset_status "existing") never
  // counts; a background_asset that points at a missing file (e.g. a scaffold's cover placeholder) does.
  const artExists = (s) =>
    !!s.background_asset && existsSync(path.join(RENDERER, "public", s.background_asset.replace(/^[\\/]+/, "")));
  const needsArt = (post.slides ?? []).some((s) => s.asset_status !== "existing" && !artExists(s));
  const wantsArt = flags.has("--art") || (!flags.has("--no-art") && needsArt);
  const wantsVoice = !flags.has("--no-voice") && ["voxcpm2", "voxcpm2-0.5b", "bark", "http"].includes(effVoiceMode);
  const wantsReel = !flags.has("--no-reel") && !!post.video?.enabled;
  if ((passesArg || wantsQ6 || wantsUiFormat) && !wantsArt)
    console.warn(`  ⚠ ${[passesArg && "--passes", wantsQ6 && "--q6", wantsUiFormat && "--ui-format"].filter(Boolean).join("/")} ignored this run — no art step (pass --art to force background regeneration).`);

  // Ordered list of the stages that will actually run for this post (after the skip logic above).
  // --upscale runs INSIDE the art graph when art runs (one generate→upscale pass per slide); the
  // standalone upscale step only fires for --upscale WITHOUT art (sharpen existing backgrounds).
  const plan = [];
  if (wantsArt) plan.push(`art (${wantsUiFormat ? "ui-format file" : flags.has("--flux1") ? "flux1" : "flux2"}${wantsQ6 ? " Q6" : ""} backgrounds${passesArg ? `, ${passesArg.split("=")[1]} passes` : ""}${wantsUpscale ? " + integrated upscale" : ""})`);
  if (wantsUpscale && !wantsArt) plan.push(`upscale (existing backgrounds${upscaleModelArg ? `, ${upscaleModelArg.split("=")[1]}` : ""})`);
  plan.push("export (carousel)");
  if (!flags.has("--no-package")) plan.push("package (upload files)");
  if (wantsVoice) plan.push("free-comfyui (release GPU)", `voice (${effVoiceMode})`, "align (captions)");
  if (wantsReel) plan.push("reel (audio auto-embedded)");

  console.log(`\n╭─ ${fullKey}`);
  console.log(`│  art=${wantsArt ? (flags.has("--flux1") ? "flux1" : "flux2") : "skip"}  ·  voice=${wantsVoice ? effVoiceMode : "skip"}  ·  reel=${wantsReel ? "yes" : "skip"}`);
  console.log(`│  steps to run:`);
  plan.forEach((s, i) => console.log(`│   ${i + 1}. ${s}`));
  console.log(`╰─`);

  // Default art run generates every needy slide (cover included). `--art` forces a full regen (→ art --all).
  if (wantsArt) step("art (backgrounds)", ["art", "--", fullKey, ...(flags.has("--flux1") ? ["--flux1"] : []), ...(flags.has("--art") ? ["--all"] : []), ...(passesArg ? [passesArg] : []), ...(wantsUpscale ? ["--upscale"] : []), ...(upscaleModelArg ? [upscaleModelArg] : []), ...(upscaleScaleArg ? [upscaleScaleArg] : []), ...(wantsUiFormat ? ["--ui-format"] : [])], { fatal: false, env: wantsQ6 ? { ART2_MODEL: Q6_MODEL } : undefined });
  if (wantsUpscale && !wantsArt) step("upscale (existing backgrounds)", ["upscale", "--", fullKey, ...(upscaleModelArg ? [upscaleModelArg] : []), ...(upscaleScaleArg ? [upscaleScaleArg] : [])], { fatal: false });
  step("export (carousel)", ["export", "--", fullKey]);
  if (!flags.has("--no-package")) step("package (upload files)", ["package", "--", fullKey]);

  if (wantsVoice) {
    step("free-comfyui (release GPU)", ["free-comfyui"]); // non-fatal if ComfyUI is down
    step("voice (TTS)", ["voice", "--", fullKey, ...(voiceOverride ? [`--voice=${voiceOverride}`] : []), ...(customVoice ? ["--custom-voice", customVoice] : []), ...(customVoiceText ? ["--custom-voice-text", customVoiceText] : []), ...(flags.has("--no-hifi") ? ["--no-hifi"] : []), ...(flags.has("--no-clone") ? ["--no-clone"] : []), ...(seedArg ? [seedArg] : [])]);
    step("align (caption sync)", ["align", "--", fullKey]);
  }

  if (wantsReel) {
    const reelArgs = ["reel", "--", fullKey, `--captions=${captionMode}`];
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
