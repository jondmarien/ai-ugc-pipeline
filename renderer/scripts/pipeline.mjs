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
import { setStatus } from "./lib/post-status.mjs";

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
let keys = argv.filter((a, i) => !a.startsWith("--") && !consumed.has(i));

const HELP = `
bun run pipeline — the one-command render pipeline (post JSON → upload-ready package)

USAGE
  bun run pipeline -- <post-key> [<post-key> ...] [flags]
  bun run pipeline --status=approved [flags]              (render a whole status tier)

  <post-key> matches files in renderer/content/posts/ by substring. A unique slug runs one
  post; a substring matching several runs them ALL — e.g. a date prefix 2026-06-11 runs the
  whole day. Combine multiple keys. (Use --dry-run to preview the matched set.)

BATCH SELECTION
  --status=VALUE   render every post whose JSON status == VALUE (draft|approved|generated|
                   upload_ready), in date order. Lifecycle: draft → approved → generated →
                   upload_ready; the normal batch is --status=approved. On a COMPLETE run each
                   rendered post auto-flips to 'generated', so re-running skips finished work
                   (no duplicates). Explicit <post-key>s always run regardless of status and
                   re-flip to generated — that's how you regenerate one finished post.
                   Pair with --dry-run to preview the matched set without rendering.

STAGES (in order; each auto-skips when not needed)
  1. art           backgrounds via a running ComfyUI (FLUX.2 klein 4B GGUF by default) —
                   only for slides still missing art; --art forces a full regen
  2. upscale       only when --upscale WITHOUT an art step (sharpens existing backgrounds);
                   with an art step, upscaling runs INSIDE the art graph instead
  3. export        carousel PNGs (1080×1350)
  4. package       upload-ready files → pipeline/renders/<key>/
  5. free-comfyui  unload ComfyUI's models (8 GB GPU = one big model at a time)
  6. voice         narration TTS (VoxCPM2 by default; your voice clone if a ref clip exists)
  7. align         Whisper word-synced captions
  8. reel          1080×1920 Remotion reel with the voice auto-embedded

ART & IMAGE QUALITY
  --flux1                   legacy FLUX.1-schnell graph (default is FLUX.2 klein)
  --art | --no-art          force background regeneration | skip art entirely
  --passes=N                sampling steps (alias of --steps). klein is step-distilled:
                            recommended 4–8, hard max 12 (clamped; >8 adds heat, not quality)
  --q6                      use flux-2-klein-4b-Q6_K.gguf this run (≈98% of fp16 vs Q5's ≈95%);
                            auto-downloads to the ComfyUI unet dir if missing
  --upscale                 GAN upscale each background (RealESRGAN_x4plus by default).
                            With art: integrated generate→upscale→downscale-to-canvas pass.
                            Without art: standalone pass over existing backgrounds.
  --upscale-model=NAME.pth  RealESRGAN_x4plus.pth | 4x-UltraSharp.pth (both auto-download)
  --upscale-scale=N         final size = canvas × N (default 1)
  --ui-format               art executes the version-controlled ComfyUI workflow FILE from
                            renderer/comfyui-workflows/ (the _with_upscale variant when
                            --upscale) instead of the code-built graph. The file's
                            steps/CFG/resolution win; per-slide prompt + seed are patched.

VOICE & NARRATION
  --voice=MODE              voxcpm2 (default) | voxcpm2-0.5b | bark | http | none
  --vox2 | --vox0.5         aliases for --voice=voxcpm2 | --voice=voxcpm2-0.5b
  --custom-voice PATH.wav   clone YOUR authorized voice (zero-shot; on by default when a
                            reference clip exists — $VOICE_REF or public/audio/_voiceref/)
  --custom-voice-text "…"   override the clone clip's transcript (Hi-Fi cloning)
  --no-hifi                 timbre-only cloning (skip the Whisper transcript match)
  --no-clone                ignore the reference clip; use the plain seeded voice
  --seed=N                  lock the speaker (same N = same voice; logged to voice.meta.json)

CAPTIONS & REEL
  --captions=MODE           highlight (default) | block | word — reel subtitle style
  --no-fit-voice            don't trim/realign the reel to the voice length
  --tail=N                  seconds of silence kept after the voice (default 0.6)

STAGE TOGGLES & MISC
  --no-voice                skip voice + align (silent reel)
  --no-reel                 stop after the carousel/package
  --no-package              skip the package step
  --dry-run                 print what would run, submit nothing
  --help, -h                this help

EXAMPLES
  bun run pipeline -- 2026-06-08_chatbot-log-leak
      full render with all defaults (art only if slides are missing backgrounds)
  bun run pipeline -- 2026-06-11 --dry-run
      preview every post from that day (date prefix expands to all matches)
  bun run pipeline -- 2026-06-08_chatbot-log-leak --art --q6 --upscale
      force-regenerate art at Q6 quality with the integrated upscale pass
  bun run pipeline -- my-post --art --ui-format --upscale-model=4x-UltraSharp.pth
      execute the version-controlled with-upscale workflow file, UltraSharp model
  bun run pipeline -- post-a post-b --no-reel
      batch two posts, carousel + package only

DOCS  renderer/docs/IMAGE_MODELS.md (quality knobs) · PIPELINE_ARCHITECTURE.md · CLAUDE.md
`;

if (flags.has("--help") || flags.has("-h") || argv.includes("-h")) {
  console.log(HELP);
  process.exit(0);
}
// Resolve the run set. Each positional key expands to EVERY post it matches as a substring — a
// unique slug runs one, a date prefix like 2026-06-11 runs the whole day. --status=VALUE adds
// every post currently at that status. Explicit keys run regardless of status. Merge, de-dupe,
// sort by filename (date order).
const ALL_KEYS = readdirSync(POSTS).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));
const statusArg = [...flags].find((f) => f.startsWith("--status="))?.split("=")[1];
const requested = keys.length > 0 || !!statusArg;
const selected = new Set();
for (const k of keys) {
  const m = ALL_KEYS.filter((fk) => fk.includes(k));
  if (!m.length) console.warn(`⚠ no post matches "${k}"`);
  m.forEach((fk) => selected.add(fk));
}
if (statusArg) {
  const matched = ALL_KEYS.filter((fk) => { try { return JSON.parse(readFileSync(path.join(POSTS, `${fk}.json`), "utf8")).status === statusArg; } catch { return false; } });
  matched.forEach((fk) => selected.add(fk));
  console.log(`▶ status="${statusArg}" → ${matched.length} post(s).`);
}
keys = [...selected].sort();
if (!keys.length) {
  if (requested) {
    console.error(`No matching posts for that selection. Check the key / date / status (lifecycle: draft → approved → generated → upload_ready), or run --help.`);
    process.exit(1);
  }
  console.error(HELP);
  process.exit(1);
}
if (keys.length > 1) console.log(`▶ ${keys.length} post(s) in date order: ${keys.join(", ")}\n`);
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
  return fullKey;
}

// On a COMPLETE run, flip draft/approved → generated (via the shared setStatus helper) so a
// status batch never re-renders it. The onlyFrom guard leaves generated (no-op) and upload_ready
// (terminal — regenerating a posted item must not un-post it) untouched. Skipped for dry-runs and
// intentionally-partial renders.
const COMPLETE_RUN = !DRY && !["--no-reel", "--no-voice", "--no-package"].some((f) => flags.has(f));
function markGenerated(fullKey) {
  if (setStatus(fullKey, "generated", { onlyFrom: ["draft", "approved"] }).changed) console.log(`  ↳ status → generated`);
}

let ok = 0;
for (const key of keys) {
  try {
    const fk = runPost(key);
    ok++;
    if (COMPLETE_RUN && fk) markGenerated(fk);
  } catch (e) {
    console.error(`\n✗ ${key}: ${e.message}`);
    if (keys.length === 1) process.exit(1);
    console.error("  (continuing with the next post)");
  }
}
console.log(`\n${"=".repeat(48)}\n✓ Pipeline finished — ${ok}/${keys.length} post(s) rendered.`);
