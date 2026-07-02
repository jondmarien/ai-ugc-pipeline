// bun run pipeline -- <post-key> [<post-key> ...] [flags]
// THE one-command render pipeline. For each post it runs, in order:
//   1. art          backgrounds via ComfyUI or Higgsfield (--higgsfield)  (only if inner slides lack art; --art forces, --no-art skips)
//   2. export       carousel PNGs
//   3. package      upload-ready package files
//   4. free-comfyui release ComfyUI's VRAM   (so VoxCPM/Whisper get the GPU; 8GB = one model at a time)
//   5. voice        VoxCPM2/Bark/HTTP TTS     (only if video.audio.voice_mode needs generating)
//   6. align        Whisper word-synced captions
//   7. reel         Remotion reel — AUTO-EMBEDS the voice from step 5 (no more silent reels)
//
// Flags:
//   --flux1        use the legacy FLUX.1-schnell graph for step 1 (default is FLUX.2 klein)
//   --higgsfield   use Higgsfield Cloud API for backgrounds instead of local ComfyUI (no free-comfyui needed before voice)
//   --art          force background regeneration even if slides already have art
//   --no-art       skip background generation
//   --no-package   skip the package step
//   --no-voice     skip voice+align (render a silent reel)
//   --no-reel      stop after the carousel/package
//   --no-fit-voice don't trim/realign the reel to the voice length
//   --tail=N       seconds of silence to keep after the voice (reel; default 0.6)
//   --seed=N       voice seed (consistent speaker) — forwarded to `bun run voice`
//   --skip=A,B     after selection, drop matched posts whose key fuzzily contains A or B
//
// Shared logic: ./lib/post-selection.mjs, post-resolve.mjs, post-status.mjs, public-asset.mjs.
// Run `bun run pipeline -- --help` for full flag list.
import { spawnSync } from "node:child_process";
import { RENDERER_ROOT as RENDERER } from "./lib/paths.mjs";
import { allPostKeys, loadPostByKey } from "./lib/post-resolve.mjs";
import {
  applySkipTerms,
  expandKeysBySubstring,
  filterByStatus,
} from "./lib/post-selection.mjs";
import { readStatus, setStatus } from "./lib/post-status.mjs";
import { slideBackgroundExists } from "./lib/public-asset.mjs";

const argv = process.argv.slice(2);
// --custom-voice <path>: capture its value (an authorized reference WAV to clone) and keep
// that path out of the positional post-keys list so it isn't treated as another post.
const cvIdx = argv.indexOf("--custom-voice");
const customVoice = cvIdx >= 0 ? argv[cvIdx + 1] : null;
const cvtIdx = argv.indexOf("--custom-voice-text");
const customVoiceText = cvtIdx >= 0 ? argv[cvtIdx + 1] : null;
// indices whose value is consumed by a flag (so they're NOT positional post-keys).
// Guard with >=0 — otherwise an absent flag (indexOf -1) would exclude argv[0] (the key).
const consumed = new Set(
  [cvIdx, cvtIdx].filter((i) => i >= 0).map((i) => i + 1),
);
const flags = new Set(argv.filter((a) => a.startsWith("--")));
let keys = argv.filter((a, i) => !a.startsWith("--") && !consumed.has(i));
// --force bypasses the approval gate (render non-approved posts anyway). It does NOT demote a
// generated/upload_ready post — those keep their status; --force only lifts the "must be approved" stop.
const FORCE = flags.has("--force");

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
                   (no duplicates). ONLY 'approved' posts render: selecting a non-approved post
                   (by key, date, or status) STOPS the run and tells you which + how to fix.
                   Approve first to (re)render: bun run status -- approved <key>, or pass
                   --force to bypass the gate and render non-approved posts anyway (a
                   generated/upload_ready post keeps its status, it is not demoted). Pair any
                   selection with --dry-run to preview the matched set without rendering.
  --skip=A,B,…     after selection, drop any matched post whose key contains one of these
                   (case-insensitive, substring/"fuzzy") terms. Comma-separated. Pairs with a
                   date-prefix or --status batch to render the whole set EXCEPT a few — e.g.
                   already-rendered posts. A term that matches nothing just warns.

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
  9. publish       OPT-IN (--publish=…): post the reel to YouTube/TikTok via the gated
                   publish command (publishes at the generated status this run produces;
                   Instagram stays manual)

ART & IMAGE QUALITY  (--higgsfield / --fal pick the cloud ART provider only — reel motion is
                      separate, see REEL MOTION below)
  --higgsfield                cloud backgrounds via Higgsfield (instead of local ComfyUI)
  --higgsfield-model=ID       Higgsfield image model: soul-2.0 (default), cinema-studio-3.0,
                              flux, gpt-image-2, seedream-4.5 (see: bun run higgsfield:models)
  --higgsfield-mode=MODE      cli (default, headless via the authed CLI) | rest (platform API) |
                              mcp (agent-driven; writes a plan only — use the manual two-step flow)
  --fal                       cloud backgrounds via FAL.ai (needs FAL_KEY)
  --fal-model=ID              FAL image model: flux-dev (default), flux-schnell, flux-2-pro, flux-2-dev
  --flux1                   legacy FLUX.1-schnell graph (default is FLUX.2 klein; ComfyUI only)
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

REEL MOTION  (opt-in; the reel itself is always composited locally by Remotion)
  --motion=PROVIDER         local (default) | higgsfield | fal — animate the existing backgrounds
                            into per-beat image-to-video clips via a cloud provider. "local" (or
                            omitted) = no cloud i2v, Remotion animates the stills. Works with any
                            art source (local or cloud). Higgsfield CLI mode auto-uploads the local
                            PNG, so no public hosting is needed.
  --motion-model=ID         i2v model for --motion (e.g. dop for Higgsfield; kling-standard for FAL)
  --motion-budget=N         credit cap for Higgsfield motion (default 60; 0 = unlimited; --yes overrides).
                            i2v is pricey: ≈7.5 cr/clip (dop), 22 (veo-3.1) — a 6-beat reel is 45/132.

CAPTIONS & REEL
  --captions=MODE           highlight (default) | block | word — reel subtitle style
  --no-fit-voice            don't trim/realign the reel to the voice length
  --tail=N                  seconds of silence kept after the voice (default 0.6)

STAGE TOGGLES & MISC
  --no-voice                skip voice + align (silent reel)
  --no-reel                 stop after the carousel/package
  --no-package              skip the package step
  --publish=a,b             after the reel, publish to youtube,tiktok (publishes at the
                            generated status this run produces; respects --dry-run; --yes
                            skips the confirm prompt). Authorize once: bun run publish:auth …
  --dry-run                 print what would run, submit nothing
  --help, -h                this help

EXAMPLES
  bun run pipeline -- 2026-06-08_chatbot-log-leak
      full render with all defaults (art only if slides are missing backgrounds)
  bun run pipeline -- 2026-06-11 --dry-run
      preview every post from that day (date prefix expands to all matches)
  bun run pipeline -- 2026-06-10 --skip=cohere,rogueplanet
      render the whole day EXCEPT the cohere and rogueplanet posts (already done)
  bun run pipeline -- 2026-06-08_chatbot-log-leak --art --q6 --upscale
      force-regenerate art at Q6 quality with the integrated upscale pass
  bun run pipeline -- my-post --art --ui-format --upscale-model=4x-UltraSharp.pth
      execute the version-controlled with-upscale workflow file, UltraSharp model
  bun run pipeline -- post-a post-b --no-reel
      batch two posts, carousel + package only
  bun run pipeline -- 2026-06-08_chatbot-log-leak --publish=youtube,tiktok --dry-run
      full render, then preview the publish plan for both platforms (posts nothing)

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
const statusArg = [...flags]
  .find((f) => f.startsWith("--status="))
  ?.split("=")[1];
const requested = keys.length > 0 || !!statusArg;
const selected = expandKeysBySubstring(keys);
if (statusArg) {
  const matched = filterByStatus(allPostKeys(), statusArg);
  matched.forEach((fk) => {
    selected.add(fk);
  });
  console.log(`▶ status="${statusArg}" → ${matched.length} post(s).`);
}
// --skip=a,b,c removes any matched post whose key contains one of the (case-insensitive,
// substring/"fuzzy") terms — handy for "render the whole day EXCEPT the ones already done".
// Applied AFTER selection so it can prune a date-prefix/status expansion. Warns on no-op terms.
const skipArg = [...flags]
  .find((f) => f.startsWith("--skip="))
  ?.split("=")
  .slice(1)
  .join("=");
const skipTerms = (skipArg ?? "")
  .split(",")
  .map((t) => t.trim().toLowerCase())
  .filter(Boolean);
if (skipTerms.length) applySkipTerms(selected, skipTerms);
keys = [...selected].sort();
if (!keys.length) {
  if (requested) {
    console.error(
      `No matching posts for that selection. Check the key / date / status (lifecycle: draft → approved → generated → upload_ready), or run --help.`,
    );
    process.exit(1);
  }
  console.error(HELP);
  process.exit(1);
}
if (keys.length > 1)
  console.log(`▶ ${keys.length} post(s) in date order: ${keys.join(", ")}\n`);
const seedArg = [...flags].find((f) => f.startsWith("--seed="));
const tailArg = [...flags].find((f) => f.startsWith("--tail="));
// Captions default to "highlight" for pipeline reels; override with --captions=block|word.
const capFlag = [...flags]
  .find((f) => f.startsWith("--captions="))
  ?.split("=")[1];
const captionMode = ["block", "word", "highlight"].includes(capFlag)
  ? capFlag
  : "highlight";
// Opt-in final stage: after the reel, publish to YouTube/TikTok via the gated `publish` command
// (gated on the generated status; Instagram stays manual). --publish=youtube,tiktok ; omit to skip.
const publishArg = [...flags]
  .find((f) => f.startsWith("--publish="))
  ?.split("=")[1];
const publishPlatforms = publishArg
  ? publishArg
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : null;
// Opt-in quality knobs — all default OFF; only meaningful with the art step (or, for --upscale,
// when there are background images to sharpen). They don't change a normal `bun run pipeline` run.
const passesArg = [...flags].find((f) => f.startsWith("--passes=")); // forwarded to `bun run art`
const wantsQ6 = flags.has("--q6"); // higher-quality Q6_K GGUF for this run
const wantsUpscale = flags.has("--upscale"); // GAN upscale (integrated into art when art runs)
const upscaleModelArg = [...flags].find((f) =>
  f.startsWith("--upscale-model="),
);
const upscaleScaleArg = [...flags].find((f) =>
  f.startsWith("--upscale-scale="),
);
// --ui-format: art executes the version-controlled workflow FILE (renderer/comfyui-workflows/) instead
// of the code-built graph — with --upscale it picks the _with_upscale file. The file's settings win.
const wantsUiFormat = flags.has("--ui-format");
// --higgsfield / --fal pick the cloud ART provider (backgrounds) ONLY. Reel motion is decoupled:
// it is opt-in via --motion=<provider> (see below). Each also takes an image-model passthrough.
const USE_HIGGSFIELD = flags.has("--higgsfield");
const USE_FAL = flags.has("--fal");
const hfImageModelArg = [...flags]
  .find((f) => f.startsWith("--higgsfield-model="))
  ?.split("=")[1];
const falImageModelArg = [...flags]
  .find((f) => f.startsWith("--fal-model="))
  ?.split("=")[1];
// Credit budget cap for the Higgsfield art step (forwarded). --yes overrides the cap.
const hfBudgetArg = [...flags].find((f) => f.startsWith("--budget="));
// --motion=<provider> opts INTO per-beat cloud image-to-video motion for the reel, animating the
// existing backgrounds (whether generated locally or by a cloud provider). Default "none" = the
// reel is pure local Remotion (animated stills). Independent of which provider made the art.
const motionArgRaw = [...flags]
  .find((f) => f.startsWith("--motion="))
  ?.split("=")[1];
const MOTION_VALID = ["higgsfield", "fal", "none", "local"];
if (motionArgRaw && !MOTION_VALID.includes(motionArgRaw)) {
  console.error(
    `✋ --motion=${motionArgRaw} is invalid (use ${MOTION_VALID.join("|")}).`,
  );
  process.exit(1);
}
const MOTION =
  motionArgRaw && motionArgRaw !== "none" && motionArgRaw !== "local"
    ? motionArgRaw
    : null;
const motionModelArg = [...flags]
  .find((f) => f.startsWith("--motion-model="))
  ?.split("=")[1];
// Separate credit cap for the (pricier) motion step; forwarded to reel:* as --budget. --yes overrides.
const motionBudgetArg = [...flags]
  .find((f) => f.startsWith("--motion-budget="))
  ?.split("=")[1];
// Higgsfield provider mode (cli default | rest | mcp) applies to whichever Higgsfield step runs
// this turn — art (--higgsfield) and/or motion (--motion=higgsfield).
const hfModeArg = [...flags]
  .find((f) => f.startsWith("--higgsfield-mode="))
  ?.split("=")[1];
const USES_HIGGSFIELD_ANY = USE_HIGGSFIELD || MOTION === "higgsfield";
if (USES_HIGGSFIELD_ANY && hfModeArg === "mcp") {
  console.warn(
    `  ⚠ --higgsfield-mode=mcp is agent-driven: the Higgsfield step only writes a generation plan.\n     Use the two-step flow instead: art:higgsfield --mode=mcp --plan → generate via MCP → --mode=mcp --ingest.`,
  );
}
const hfModeArgs =
  USES_HIGGSFIELD_ANY && hfModeArg ? [`--mode=${hfModeArg}`] : [];
const Q6_MODEL = "flux-2-klein-4b-Q6_K.gguf"; // auto-downloaded by art-comfyui if missing

const DRY = flags.has("--dry-run");
const bun = process.platform === "win32" ? "bun.exe" : "bun";
function step(label, runArgs, { env, fatal = true } = {}) {
  console.log(
    `${DRY ? "   • would run:" : `\n── ${label} ──`}  bun run ${runArgs.join(" ")}`,
  );
  if (DRY) return;
  const r = spawnSync(bun, ["run", ...runArgs], {
    cwd: RENDERER,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, ...env },
  });
  if (r.status !== 0) {
    if (!fatal) {
      console.warn(
        `⚠ '${label}' failed (exit ${r.status}) — continuing (slides fall back to procedural backgrounds).`,
      );
      return;
    }
    throw new Error(`'${label}' failed (exit ${r.status})`);
  }
}

function runPost(key) {
  const loaded = loadPostByKey(key);
  if (!loaded) throw new Error(`No post JSON matching "${key}"`);
  const { fullKey, post } = loaded;

  const voiceMode = post.video?.audio?.voice_mode ?? "none";
  // Voice override for this run (else use the post's voice_mode):
  //   --voice=<mode> (voxcpm2 | voxcpm2-0.5b | bark | http | none)  ·  --vox2 / --vox0.5 are aliases.
  const voiceFlag = [...flags]
    .find((f) => f.startsWith("--voice="))
    ?.split("=")[1];
  const voiceOverride = flags.has("--vox0.5")
    ? "voxcpm2-0.5b"
    : flags.has("--vox2")
      ? "voxcpm2"
      : voiceFlag &&
          ["voxcpm2", "voxcpm2-0.5b", "bark", "http", "none"].includes(
            voiceFlag,
          )
        ? voiceFlag
        : null;
  const effVoiceMode = voiceOverride || voiceMode;
  // Any slide that still needs art — INCLUDING the cover (covers used to be skipped here, so the
  // pipeline never generated 01_cover.png). A locked custom asset (asset_status "existing") never
  // counts; a background_asset that points at a missing file (e.g. a scaffold's cover placeholder) does.
  const artExists = (s) => slideBackgroundExists(RENDERER, s);
  const needsArt = (post.slides ?? []).some(
    (s) => s.asset_status !== "existing" && !artExists(s),
  );
  const wantsArt = flags.has("--art") || (!flags.has("--no-art") && needsArt);
  const wantsVoice =
    !flags.has("--no-voice") &&
    ["voxcpm2", "voxcpm2-0.5b", "bark", "http"].includes(effVoiceMode);
  const wantsReel = !flags.has("--no-reel") && !!post.video?.enabled;
  if ((passesArg || wantsQ6 || wantsUiFormat) && !wantsArt && !USE_HIGGSFIELD)
    console.warn(
      `  ⚠ ${[passesArg && "--passes", wantsQ6 && "--q6", wantsUiFormat && "--ui-format"].filter(Boolean).join("/")} ignored this run — no art step (pass --art to force background regeneration).`,
    );
  if (
    (USE_HIGGSFIELD || USE_FAL) &&
    (flags.has("--flux1") ||
      wantsQ6 ||
      wantsUpscale ||
      wantsUiFormat ||
      passesArg)
  )
    console.warn(
      `  ⚠ ComfyUI-only flags (--flux1/--q6/--upscale/--ui-format/--passes) are ignored with --higgsfield.`,
    );
  if (MOTION && !wantsReel)
    console.warn(
      `  ⚠ --motion=${MOTION} ignored — no reel this run (${flags.has("--no-reel") ? "--no-reel" : "post.video.enabled is false"}).`,
    );

  // Ordered list of the stages that will actually run for this post (after the skip logic above).
  // --upscale runs INSIDE the art graph when art runs (one generate→upscale pass per slide); the
  // standalone upscale step only fires for --upscale WITHOUT art (sharpen existing backgrounds).
  const plan = [];
  if (wantsArt) {
    if (USE_HIGGSFIELD) {
      plan.push(
        `art:higgsfield (cloud backgrounds${passesArg ? `, ${passesArg.split("=")[1]} passes ignored` : ""})`,
      );
    } else if (USE_FAL) {
      plan.push(
        `art:fal (cloud backgrounds via FAL.ai${passesArg ? `, ${passesArg.split("=")[1]} passes ignored` : ""})`,
      );
    } else {
      plan.push(
        `art (${wantsUiFormat ? "ui-format file" : flags.has("--flux1") ? "flux1" : "flux2"}${wantsQ6 ? " Q6" : ""} backgrounds${passesArg ? `, ${passesArg.split("=")[1]} passes` : ""}${wantsUpscale ? " + integrated upscale" : ""})`,
      );
    }
  }
  if (wantsUpscale && !wantsArt)
    plan.push(
      `upscale (existing backgrounds${upscaleModelArg ? `, ${upscaleModelArg.split("=")[1]}` : ""})`,
    );
  plan.push("export (carousel)");
  if (!flags.has("--no-package")) plan.push("package (upload files)");
  if (wantsVoice) {
    if (!USE_HIGGSFIELD && !USE_FAL) plan.push("free-comfyui (release GPU)");
    plan.push(`voice (${effVoiceMode})`, "align (captions)");
  }
  if (wantsReel) {
    if (MOTION === "higgsfield")
      plan.push(
        `reel:higgsfield (motion segments${motionModelArg ? `, ${motionModelArg}` : ""})`,
      );
    if (MOTION === "fal")
      plan.push(
        `reel:fal (motion segments${motionModelArg ? `, ${motionModelArg}` : ""})`,
      );
    plan.push("reel (audio auto-embedded)");
  }
  if (publishPlatforms)
    plan.push(
      `publish (${publishPlatforms.join(",")}${DRY ? ", dry-run" : ""})`,
    );

  console.log(`\n╭─ ${fullKey}`);
  console.log(
    `│  art=${wantsArt ? (USE_HIGGSFIELD ? "higgsfield" : USE_FAL ? "fal" : flags.has("--flux1") ? "flux1" : "flux2") : "skip"}  ·  voice=${wantsVoice ? effVoiceMode : "skip"}  ·  reel=${wantsReel ? "yes" : "skip"}  ·  motion=${MOTION ?? "local"}`,
  );
  console.log(`│  steps to run:`);
  plan.forEach((s, i) => {
    console.log(`│   ${i + 1}. ${s}`);
  });
  console.log(`╰─`);

  // Default art run generates every needy slide (cover included). `--art` forces a full regen (→ art --all).
  if (wantsArt) {
    if (USE_HIGGSFIELD) {
      step(
        "art:higgsfield (backgrounds)",
        [
          "art:higgsfield",
          "--",
          fullKey,
          ...hfModeArgs,
          ...(hfImageModelArg ? [`--model=${hfImageModelArg}`] : []),
          ...(hfBudgetArg ? [hfBudgetArg] : []),
          ...(flags.has("--yes") ? ["--yes"] : []),
          ...(flags.has("--art") ? ["--all"] : []),
        ],
        { fatal: false },
      );
    } else if (USE_FAL) {
      step(
        "art:fal (backgrounds)",
        [
          "art:fal",
          "--",
          fullKey,
          ...(falImageModelArg ? [`--model=${falImageModelArg}`] : []),
          ...(flags.has("--art") ? ["--all"] : []),
        ],
        { fatal: false },
      );
    } else {
      step(
        "art (backgrounds)",
        [
          "art",
          "--",
          fullKey,
          ...(flags.has("--flux1") ? ["--flux1"] : []),
          ...(flags.has("--art") ? ["--all"] : []),
          ...(passesArg ? [passesArg] : []),
          ...(wantsUpscale ? ["--upscale"] : []),
          ...(upscaleModelArg ? [upscaleModelArg] : []),
          ...(upscaleScaleArg ? [upscaleScaleArg] : []),
          ...(wantsUiFormat ? ["--ui-format"] : []),
        ],
        { fatal: false, env: wantsQ6 ? { ART2_MODEL: Q6_MODEL } : undefined },
      );
    }
  }
  if (wantsUpscale && !wantsArt)
    step(
      "upscale (existing backgrounds)",
      [
        "upscale",
        "--",
        fullKey,
        ...(upscaleModelArg ? [upscaleModelArg] : []),
        ...(upscaleScaleArg ? [upscaleScaleArg] : []),
      ],
      { fatal: false },
    );
  step("export (carousel)", ["export", "--", fullKey]);
  if (!flags.has("--no-package"))
    step("package (upload files)", ["package", "--", fullKey]);

  if (wantsVoice) {
    if (!USE_HIGGSFIELD && !USE_FAL)
      step("free-comfyui (release GPU)", ["free-comfyui"]); // non-fatal if ComfyUI is down
    step("voice (TTS)", [
      "voice",
      "--",
      fullKey,
      ...(voiceOverride ? [`--voice=${voiceOverride}`] : []),
      ...(customVoice ? ["--custom-voice", customVoice] : []),
      ...(customVoiceText ? ["--custom-voice-text", customVoiceText] : []),
      ...(flags.has("--no-hifi") ? ["--no-hifi"] : []),
      ...(flags.has("--no-clone") ? ["--no-clone"] : []),
      ...(seedArg ? [seedArg] : []),
    ]);
    step("align (caption sync)", ["align", "--", fullKey]);
  }

  if (wantsReel) {
    // Reel motion is OPT-IN via --motion=<provider> and independent of the art provider; the final
    // reel is always composited locally by Remotion (these only pre-generate per-beat i2v clips).
    if (MOTION === "higgsfield") {
      step(
        "reel:higgsfield (motion segments)",
        [
          "reel:higgsfield",
          "--",
          fullKey,
          ...hfModeArgs,
          ...(motionModelArg ? [`--model=${motionModelArg}`] : []),
          ...(motionBudgetArg ? [`--budget=${motionBudgetArg}`] : []),
          ...(flags.has("--yes") ? ["--yes"] : []),
        ],
        { fatal: false },
      );
    }
    if (MOTION === "fal") {
      step(
        "reel:fal (motion segments)",
        [
          "reel:fal",
          "--",
          fullKey,
          ...(motionModelArg ? [`--model=${motionModelArg}`] : []),
        ],
        { fatal: false },
      );
    }
    const reelArgs = ["reel", "--", fullKey, `--captions=${captionMode}`];
    if (!flags.has("--no-fit-voice")) reelArgs.push("--fit-voice");
    if (tailArg) reelArgs.push(tailArg);
    step("reel (audio auto-embedded)", reelArgs);
  }
  console.log(`\n✓ ${fullKey} → pipeline/renders/${fullKey}/`);
  return fullKey;
}

// Approval gate: ONLY posts with status "approved" may render. Nothing becomes "generated" (and
// nothing already posted gets regenerated) without an explicit human approval first. Any selected
// post that isn't approved stops the run with an explanation. On --dry-run we warn but still preview.
const blocked = keys
  .map((k) => ({ k, st: readStatus(k) }))
  .filter((x) => x.st !== "approved");
if (blocked.length) {
  const list = blocked
    .map((x) => `    ${x.k}  [${x.st ?? "unknown"}]`)
    .join("\n");
  const fix = blocked.map((x) => x.k).join(" ");
  const msg =
    `\n✋ ${blocked.length} of ${keys.length} selected post(s) are not "approved" — the pipeline only renders approved posts:\n${list}\n\n` +
    `WHY: a post must be human-approved before it renders, so unreviewed drafts and already-posted posts\n` +
    `     are never (re)generated by accident. Lifecycle: draft → approved → generated → upload_ready.\n\n` +
    `FIX: approve them, then re-run —\n     cd renderer && bun run status -- approved ${fix}\n` +
    `     (or /update-status approved …). To re-render a "generated"/"upload_ready" post, set it back to "approved" first.`;
  if (FORCE) {
    console.warn(
      `\n⚠ --force: bypassing the approval gate for ${blocked.length} non-approved post(s):\n${list}\n     (rendering anyway; a "generated"/"upload_ready" post keeps its status and is not demoted.)\n`,
    );
  } else if (DRY) {
    console.warn(
      `${msg}\n\n(dry-run: a real run would STOP here; previewing the set below anyway. Pass --force to render non-approved posts.)\n`,
    );
  } else {
    console.error(`${msg}\n\n     Or bypass the gate entirely with --force.`);
    process.exit(1);
  }
}

// On a COMPLETE run, flip approved → generated (via the shared setStatus helper) so a status batch
// never re-renders it. The onlyFrom guard leaves generated (no-op) and upload_ready (terminal —
// regenerating a posted item must not un-post it) untouched. Skipped for dry-runs and partial renders.
const COMPLETE_RUN =
  !DRY &&
  !["--no-reel", "--no-voice", "--no-package"].some((f) => flags.has(f));
function markGenerated(fullKey) {
  if (
    setStatus(fullKey, "generated", { onlyFrom: ["draft", "approved"] }).changed
  )
    console.log(`  ↳ status → generated`);
}

let ok = 0;
for (const key of keys) {
  try {
    const fk = runPost(key);
    ok++;
    if (COMPLETE_RUN && fk) markGenerated(fk);
    // Opt-in publish stage. By here a complete run has flipped the post approved -> generated,
    // which is exactly the status `bun run publish` requires.
    if (publishPlatforms && fk) {
      if (flags.has("--no-reel")) {
        console.warn(
          `  ⚠ --publish ignored for ${fk}: --no-reel means there is no reel to publish.`,
        );
      } else {
        step(
          `publish (${publishPlatforms.join(",")})`,
          [
            "publish",
            "--",
            fk,
            `--platforms=${publishPlatforms.join(",")}`,
            ...(DRY ? ["--dry-run"] : []),
            ...(flags.has("--yes") ? ["--yes"] : []),
          ],
          { fatal: false },
        );
      }
    }
  } catch (e) {
    console.error(`\n✗ ${key}: ${e.message}`);
    if (keys.length === 1) process.exit(1);
    console.error("  (continuing with the next post)");
  }
}
console.log(
  `\n${"=".repeat(48)}\n✓ Pipeline finished — ${ok}/${keys.length} post(s) rendered.`,
);
