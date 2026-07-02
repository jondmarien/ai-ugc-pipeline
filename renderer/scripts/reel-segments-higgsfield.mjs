// bun run reel:higgsfield -- <post-key> [--dry-run] [--model=dop] [--only=0,1]
//
// Optional pipeline step with --higgsfield: per-beat image-to-video clips for Remotion.
// Uses slide higgsfield_image_url (from art:higgsfield) or HIGGSFIELD_PUBLIC_BASE_URL.
// Writes public/video/<prefix>/beat_*.mp4 and sets beat.video_asset. Skips CTA beats.
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import {
  DEFAULT_VIDEO_MODEL,
  generateVideoFromImage,
  healthCheck,
  motionPromptForBeat,
  resolveMode,
  resolveSegmentImageUrl,
  videoModelCost,
} from "./higgsfield-client.mjs";
import { RENDERER_ROOT as RENDERER } from "./lib/paths.mjs";
import { writePostJson } from "./lib/post-io.mjs";
import { loadPostByKey, POSTS_DIR } from "./lib/post-resolve.mjs";

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const opt = (name, def) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=").slice(1).join("=") : def;
};
const key = args.find((a) => !a.startsWith("--") && a !== "-h");

const HELP = `
bun run reel:higgsfield — per-beat motion clips for Remotion reels (Higgsfield image-to-video)

USAGE
  bun run reel:higgsfield -- <post-key> [flags]

  Requires video.enabled and existing slide backgrounds. Best after art:higgsfield (stores higgsfield_image_url).
  Skips beats with purpose "cta" (static end card). Writes MP4s to public/video/<prefix>/ and sets beat.video_asset.

FLAGS
  --model=ID          video catalog id (default: ${DEFAULT_VIDEO_MODEL}) — see: bun run higgsfield:models
  --only=I[,I]        beat indices (0-based) to generate
  --force             regenerate even when beat.video_asset file exists
  --budget=N          abort if the estimated clip cost exceeds N credits (default 60; 0 = unlimited)
  --yes               override the budget gate
  --dry-run           print plan only
  --help, -h

EXAMPLES
  bun run reel:higgsfield -- my-post
  bun run pipeline -- my-post --higgsfield --motion=higgsfield
`;

if (flags.has("--help") || flags.has("-h") || args.includes("-h")) {
  console.log(HELP);
  process.exit(0);
}
if (!key) {
  console.error(HELP);
  process.exit(1);
}

const DRY = flags.has("--dry-run");
const MODE = resolveMode(opt("mode", ""));
const MODEL = opt(
  "model",
  process.env.HIGGSFIELD_VIDEO_MODEL || DEFAULT_VIDEO_MODEL,
);
// Motion credit gate: i2v is pricey (≈7.5 cr/clip default, 22 for Veo). Estimated cost must stay
// ≤ BUDGET unless --yes. Default 60 allows a typical reel on the default model but blocks Veo; 0 = off.
const BUDGET = Number(
  opt("budget", process.env.HIGGSFIELD_MOTION_BUDGET ?? "60"),
);
const YES = flags.has("--yes");
const onlyRaw = opt("only", "");
const onlySet = onlyRaw
  ? new Set(
      onlyRaw
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => Number.isFinite(n)),
    )
  : null;

const loaded = loadPostByKey(key);
if (!loaded) {
  console.error(`No post JSON in ${POSTS_DIR} matching "${key}".`);
  process.exit(1);
}
const { postPath, post } = loaded;
if (!post.video?.enabled) {
  console.log(
    `Post ${post.post_id ?? key} has video.enabled=false — nothing to do.`,
  );
  process.exit(0);
}
const prefix = post.upload_package?.filename_prefix;
if (!prefix) {
  console.error("post.upload_package.filename_prefix is required");
  process.exit(1);
}

const beats = post.video.beats ?? [];
if (!beats.length) {
  console.error("post.video.beats is empty");
  process.exit(1);
}

const slideByNum = new Map((post.slides ?? []).map((s) => [s.slide, s]));
const outDir = path.join(RENDERER, "public", "video", prefix);
mkdirSync(outDir, { recursive: true });

// Pre-flight credit estimate + budget gate. Count the beats that would actually generate this run
// (non-CTA, in --only if set, slide present, not already generated unless --force).
const FORCE = flags.has("--force");
const eligibleBeats = beats.filter((beat, i) => {
  if (onlySet && !onlySet.has(i)) return false;
  if (String(beat.purpose).toLowerCase() === "cta") return false;
  if (!slideByNum.has(beat.slide_ref)) return false;
  if (
    !FORCE &&
    beat.video_asset &&
    existsSync(
      path.join(
        RENDERER,
        "public",
        String(beat.video_asset).replace(/^\//, ""),
      ),
    )
  )
    return false;
  return true;
}).length;
const unitCost = videoModelCost(MODEL);
const estTotal = Number((unitCost * eligibleBeats).toFixed(2));
console.log(
  `Estimated motion cost: ${eligibleBeats} clip(s) × ${unitCost} cr (${MODEL}) ≈ ${estTotal} credits.`,
);
if (BUDGET > 0 && estTotal > BUDGET && !YES && !DRY) {
  console.error(
    `\n✋ Estimated ${estTotal} credits exceeds the motion budget cap of ${BUDGET}.\n` +
      `   Use a cheaper model (--model=dop), fewer beats (--only=), raise the cap (--motion-budget=${Math.ceil(estTotal)}\n` +
      `   on the pipeline / --budget=${Math.ceil(estTotal)} here, set HIGGSFIELD_MOTION_BUDGET), or pass --yes.\n` +
      `   (Skipping motion — the reel still renders locally from the stills.)`,
  );
  process.exit(1);
}

if (!DRY) {
  const hc = await healthCheck(MODE);
  console.log(
    `Higgsfield reel segments [${hc.mode}] @ ${hc.baseUrl} · model=${MODEL}`,
  );
}

let generated = 0;
for (let i = 0; i < beats.length; i++) {
  if (onlySet && !onlySet.has(i)) continue;
  const beat = beats[i];
  if (String(beat.purpose).toLowerCase() === "cta") {
    console.log(`  beat ${i}: skip cta (end card)`);
    continue;
  }
  const slide = slideByNum.get(beat.slide_ref);
  if (!slide) {
    console.warn(`  beat ${i}: slide_ref ${beat.slide_ref} missing — skip`);
    continue;
  }

  const purpose = String(beat.purpose || "beat").replace(/[^a-z0-9_-]+/gi, "-");
  const outName = `beat_${String(i + 1).padStart(2, "0")}_${purpose}.mp4`;
  const videoAsset = `/video/${prefix}/${outName}`;
  const localPath = path.join(outDir, outName);

  if (
    !flags.has("--force") &&
    beat.video_asset &&
    existsSync(
      path.join(RENDERER, "public", beat.video_asset.replace(/^\//, "")),
    )
  ) {
    console.log(
      `  beat ${i}: ${beat.video_asset} exists — skip (use --force to regen)`,
    );
    continue;
  }

  const durationSeconds = beat.end - beat.start;
  const prompt = motionPromptForBeat(beat, slide);

  // CLI mode can hand the local PNG straight to the CLI (it auto-uploads), so a public URL is
  // optional there. REST mode still needs a fetchable URL via resolveSegmentImageUrl.
  const localImagePath = slide.background_asset
    ? path.join(RENDERER, "public", slide.background_asset.replace(/^\//, ""))
    : null;
  let imageUrl;
  try {
    imageUrl = resolveSegmentImageUrl(slide);
  } catch (e) {
    if (MODE !== "cli" || !(localImagePath && existsSync(localImagePath))) {
      console.error(`  beat ${i}: ${e.message}`);
      continue;
    }
  }

  if (DRY) {
    console.log(
      `  [dry-run] beat ${i} slide_ref=${beat.slide_ref} ~${durationSeconds.toFixed(1)}s`,
    );
    console.log(
      `    image: ${imageUrl ? imageUrl.slice(0, 80) + "…" : localImagePath}`,
    );
    console.log(`    prompt: ${prompt.slice(0, 120)}…`);
    console.log(`    → ${videoAsset}`);
    continue;
  }

  console.log(`  beat ${i} (${purpose}) → ${outName} …`);
  const result = await generateVideoFromImage({
    imageUrl,
    imagePath: localImagePath,
    prompt,
    model: MODEL,
    durationSeconds,
    outDir,
    outName,
    mode: MODE,
  });
  beat.video_asset = videoAsset;
  generated++;

  post.video.licenses = Array.isArray(post.video.licenses)
    ? post.video.licenses
    : [];
  if (!post.video.licenses.some((l) => l?.asset === videoAsset)) {
    post.video.licenses.push({
      asset: videoAsset,
      source: `Higgsfield / ${MODEL}`,
      license_or_terms: "Pending confirmation from Higgsfield provider terms.",
      commercial_use_allowed: false,
      disclosure_required: true,
      notes: `Image-to-video segment; cached=${result.cached ?? false}`,
    });
  }
}

if (!DRY && generated > 0) {
  writePostJson(postPath, post);
  console.log(`\n✓ Updated ${postPath} (${generated} segment(s))`);
} else if (DRY) {
  console.log("\n(dry-run — no API calls, no JSON writes)");
} else {
  console.log("\n(no new segments generated)");
}
