// bun run art:fal -- <post-key> [--all] [--dry-run] [--model=ID]
//
// Pipeline art step when using --fal: cloud image generation via fal-client.mjs (FAL.ai).
// Writes public/backgrounds/<prefix>/NN_role.png and patches post JSON.
// Prompt assembly: lib/art-slide-prompt.mjs (same visual contract as Comfy art).
//
// Requires FAL_KEY in env. Next: export, optional reel:fal, reel.

import {
  buildNegativePrompt,
  DEFAULT_IMAGE_MODEL,
  estimateCost,
  healthCheck,
  renderSlide,
} from "./fal-client.mjs";
import {
  buildSlidePrompt,
  postSeedOffset,
  postThemeContext,
} from "./lib/art-slide-prompt.mjs";
import { parseOnlySlides, selectArtSlides } from "./lib/art-targeting.mjs";
import { RENDERER_ROOT as RENDERER } from "./lib/paths.mjs";
import { writePostJson } from "./lib/post-io.mjs";
import { loadPostByKey, POSTS_DIR } from "./lib/post-resolve.mjs";
import { slideBackgroundExists } from "./lib/public-asset.mjs";

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const opt = (name, def) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=").slice(1).join("=") : def;
};
const key = args.find((a) => !a.startsWith("--") && a !== "-h");

const HELP = `
bun run art:fal — per-slide backgrounds via FAL.ai Cloud API

USAGE
  bun run art:fal -- <post-key> [flags]

  Same slide targeting as \`bun run art\` (missing art by default; --all forces regen).
  Requires FAL_KEY env var.

FLAGS
  --all | --force     regenerate every non-"existing" slide
  --only=N[,N]        regenerate specific slide numbers
  --model=ID          catalog id (default: flux-dev)
  --dry-run           print prompts only
  --help, -h

EXAMPLES
  bun run art:fal -- my-post
  bun run pipeline -- my-post --fal
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
const MODEL = opt("model", process.env.FAL_IMAGE_MODEL || DEFAULT_IMAGE_MODEL);
const SEED_BASE = Number(opt("seed", process.env.ART_SEED || "42")) || 42;
const COOLDOWN_MS = Number(process.env.ART_COOLDOWN_MS || "3000") || 0;

const loaded = loadPostByKey(key);
if (!loaded) {
  console.error(`No post JSON in ${POSTS_DIR} matching "${key}".`);
  process.exit(1);
}
const { postPath, post } = loaded;
const prefix = post.upload_package?.filename_prefix;
if (!prefix) {
  console.error("post.upload_package.filename_prefix is required");
  process.exit(1);
}

const themeCtx = postThemeContext(post);
const postBaseSeed = SEED_BASE + postSeedOffset(prefix);

if (!DRY) {
  const hc = await healthCheck();
  console.log(`FAL @ ${hc.baseUrl} · model=${MODEL}`);
  if (!hc.hasKey) {
    console.error(hc.message);
    process.exit(1);
  }
}

const onlySet = parseOnlySlides(opt("only", ""));
const FORCE = flags.has("--all") || flags.has("--force");
const artExists = (s) => slideBackgroundExists(RENDERER, s);
const targets = selectArtSlides(post.slides ?? [], {
  onlySet,
  force: FORCE,
  artExists,
});

if (!targets.length) {
  console.log("No slides need FAL art for this post.");
  process.exit(0);
}

let totalCost =
  typeof post.renderMetadata?.costEstimate === "number"
    ? post.renderMetadata.costEstimate
    : 0;
const width = post.canvas?.width ?? 1080;
const height = post.canvas?.height ?? 1350;
const neg = buildNegativePrompt();

let n = 0;
for (let ti = 0; ti < targets.length; ti++) {
  const slide = targets[ti];
  const slideIndex = post.slides.indexOf(slide);
  const styleFusion = String(
    slide.style_fusion || themeCtx.postStyleFusion || "",
  ).trim();
  const promptText = buildSlidePrompt(slide, { ...themeCtx, styleFusion });
  const seed = postBaseSeed + slide.slide;

  if (DRY) {
    console.log(
      `\n[slide ${slide.slide} ${slide.role}] seed=${seed}\n  ${promptText}`,
    );
    continue;
  }

  if (COOLDOWN_MS && ti > 0)
    await new Promise((r) => setTimeout(r, COOLDOWN_MS));

  process.stdout.write(`  slide ${slide.slide} (${slide.role})… `);
  const t0 = Date.now();
  try {
    const unitCost = await estimateCost(MODEL, width, height);
    totalCost += unitCost;
    await renderSlide({
      post,
      slideIndex,
      prompt: promptText,
      model: MODEL,
      negativePrompt: neg,
      width: 1024,
      height: 1280,
      seed,
      timeoutMs: Number(process.env.FAL_TIMEOUT_MS || "600000"),
    });
    post.renderMetadata = {
      provider: "fal",
      model: MODEL,
      costEstimate: Number(totalCost.toFixed(4)),
    };
    process.stdout.write(
      `\r  slide ${slide.slide} (${slide.role})… ✓ (${((Date.now() - t0) / 1000).toFixed(0)}s)\n`,
    );
    n++;
  } catch (e) {
    process.stdout.write(
      `\r  slide ${slide.slide} (${slide.role})… ✗ ${e.message}\n`,
    );
  }
}

if (!DRY && n > 0) {
  writePostJson(postPath, post);
  console.log(
    `\n✓ FAL generated ${n}/${targets.length} background(s) → public/backgrounds/${prefix}/`,
  );
  console.log(`  Next: bun run export -- ${key}`);
}
