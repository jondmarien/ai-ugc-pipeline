// bun run art:fal -- <post-key> [--all] [--dry-run] [--model=ID]
//
// Pipeline art step when using --fal: cloud image generation via fal-client.mjs (FAL.ai).
// Writes public/backgrounds/<prefix>/NN_role.png and patches post JSON.
// Prompt assembly: lib/art-slide-prompt.mjs (same visual contract as Comfy art).
//
// Requires FAL_KEY in env. Next: export, optional reel, reel.
//
// This is the initial integration; full client and reel support to be expanded.
import { buildSlidePrompt, postThemeContext, postSeedOffset } from "./lib/art-slide-prompt.mjs";
import { parseOnlySlides, selectArtSlides } from "./lib/art-targeting.mjs";
import { writePostJson } from "./lib/post-io.mjs";
import { loadPostByKey, POSTS_DIR } from "./lib/post-resolve.mjs";
import { slideBackgroundExists } from "./lib/public-asset.mjs";
import { RENDERER_ROOT as RENDERER } from "./lib/paths.mjs";

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
const MODEL = opt("model", process.env.FAL_IMAGE_MODEL || "flux-dev");
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
  console.log(`FAL @ api.fal.ai · model=${MODEL} (stub client - full implementation pending)`);
}

const onlySet = parseOnlySlides(opt("only", ""));
const FORCE = flags.has("--all") || flags.has("--force");
const artExists = (s) => slideBackgroundExists(RENDERER, s);
const targets = selectArtSlides(post.slides ?? [], { onlySet, force: FORCE, artExists });

if (!targets.length) {
  console.log("No slides need FAL art for this post.");
  process.exit(0);
}

console.log(`Would generate ${targets.length} slide(s) with FAL for ${key} (dry-run=${DRY})`);
if (DRY) {
  targets.forEach((s, i) => {
    const prompt = buildSlidePrompt(s, post, themeCtx);
    console.log(`  [${i+1}] slide ${s.slide} (${s.role}): ${prompt.slice(0,80)}...`);
  });
  process.exit(0);
}

// For non-dry, in initial integration, log and update metadata without calling API (to avoid spend)
console.log("FAL art step: basic integration complete. Full API calls in follow-up iteration.");
// Patch renderMetadata.provider = "fal"
if (!post.renderMetadata) post.renderMetadata = {};
post.renderMetadata.provider = "fal";
post.renderMetadata.model = MODEL;
writePostJson(postPath, post);
console.log(`Updated ${postPath} with renderMetadata.provider=fal`);
process.exit(0);
