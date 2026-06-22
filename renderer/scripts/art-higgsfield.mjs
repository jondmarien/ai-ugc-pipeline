// bun run art:higgsfield -- <post-key> [--all] [--dry-run] [--model=ID]
// Cloud background art via Higgsfield platform API (replaces local ComfyUI for step 1).
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_IMAGE_MODEL,
  buildNegativePrompt,
  estimateCost,
  healthCheck,
  renderSlide,
} from "./higgsfield-client.mjs";
import { buildSlidePrompt, postThemeContext, postSeedOffset } from "./lib/art-slide-prompt.mjs";

const RENDERER = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const POSTS = path.join(RENDERER, "content", "posts");

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const opt = (name, def) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=").slice(1).join("=") : def;
};
const key = args.find((a) => !a.startsWith("--") && a !== "-h");

const HELP = `
bun run art:higgsfield — per-slide backgrounds via Higgsfield Cloud API

USAGE
  bun run art:higgsfield -- <post-key> [flags]

  Same slide targeting as \`bun run art\` (missing art by default; --all forces regen).
  Requires HIGGSFIELD_API_KEY + HIGGSFIELD_API_SECRET (or HF_CREDENTIALS=key:secret).

FLAGS
  --all | --force     regenerate every non-"existing" slide
  --only=N[,N]        regenerate specific slide numbers
  --model=ID          catalog id (default: ${DEFAULT_IMAGE_MODEL})
  --dry-run           print prompts only
  --help, -h

EXAMPLES
  bun run art:higgsfield -- my-post
  bun run pipeline -- my-post --higgsfield
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
const MODEL = opt("model", process.env.HIGGSFIELD_IMAGE_MODEL || DEFAULT_IMAGE_MODEL);
const SEED_BASE = Number(opt("seed", process.env.ART_SEED || "42")) || 42;
const COOLDOWN_MS = Number(process.env.ART_COOLDOWN_MS || "3000") || 0;

const file = readdirSync(POSTS).find((f) => f.endsWith(".json") && f.includes(key));
if (!file) {
  console.error(`No post JSON in ${POSTS} matching "${key}".`);
  process.exit(1);
}
const postPath = path.join(POSTS, file);
const post = JSON.parse(readFileSync(postPath, "utf8"));
post.post_id = post.post_id ?? file.replace(/\.json$/, "");
const prefix = post.upload_package?.filename_prefix;
if (!prefix) {
  console.error("post.upload_package.filename_prefix is required");
  process.exit(1);
}

const themeCtx = postThemeContext(post);
const postBaseSeed = SEED_BASE + postSeedOffset(prefix);

if (!DRY) {
  const hc = await healthCheck();
  console.log(`Higgsfield @ ${hc.baseUrl} · model=${MODEL}`);
}

const onlyArg = opt("only", "");
const onlySet = onlyArg ? new Set(onlyArg.split(",").map((x) => Number(x.trim())).filter((n) => !Number.isNaN(n))) : null;
const FORCE = flags.has("--all") || flags.has("--force");
const artExists = (s) =>
  !!s.background_asset && existsSync(path.join(RENDERER, "public", s.background_asset.replace(/^[\\/]+/, "")));
const targets = (post.slides ?? []).filter((s) => {
  if (s.asset_status === "existing") return false;
  if (onlySet) return onlySet.has(s.slide);
  return FORCE || !artExists(s);
});

if (!targets.length) {
  console.log("No slides need Higgsfield art for this post.");
  process.exit(0);
}

let totalCost = typeof post.renderMetadata?.costEstimate === "number" ? post.renderMetadata.costEstimate : 0;
const width = post.canvas?.width ?? 1080;
const height = post.canvas?.height ?? 1350;
const neg = buildNegativePrompt();

let n = 0;
for (let ti = 0; ti < targets.length; ti++) {
  const slide = targets[ti];
  const slideIndex = post.slides.indexOf(slide);
  const styleFusion = String(slide.style_fusion || themeCtx.postStyleFusion || "").trim();
  const promptText = buildSlidePrompt(slide, { ...themeCtx, styleFusion });
  const seed = postBaseSeed + slide.slide;

  if (DRY) {
    console.log(`\n[slide ${slide.slide} ${slide.role}] seed=${seed}\n  ${promptText}`);
    continue;
  }

  if (COOLDOWN_MS && ti > 0) await new Promise((r) => setTimeout(r, COOLDOWN_MS));

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
      timeoutMs: Number(process.env.HIGGSFIELD_TIMEOUT_MS || "600000"),
    });
    post.renderMetadata = {
      provider: "higgsfield",
      model: MODEL,
      costEstimate: Number(totalCost.toFixed(4)),
    };
    process.stdout.write(`\r  slide ${slide.slide} (${slide.role})… ✓ (${((Date.now() - t0) / 1000).toFixed(0)}s)\n`);
    n++;
  } catch (e) {
    process.stdout.write(`\r  slide ${slide.slide} (${slide.role})… ✗ ${e.message}\n`);
  }
}

if (!DRY && n > 0) {
  writeFileSync(postPath, `${JSON.stringify(post, null, 2)}\n`, "utf8");
  console.log(`\n✓ Higgsfield generated ${n}/${targets.length} background(s) → public/backgrounds/${prefix}/`);
  console.log(`  Next: bun run export -- ${key}`);
}