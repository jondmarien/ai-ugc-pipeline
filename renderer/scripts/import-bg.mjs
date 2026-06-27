// bun run import-bg -- <post-key> [<source-folder>] [--all]
//
// Manual / compare workflow: copy externally generated backgrounds into the canonical
// public/backgrounds/<prefix>/ layout and mark slides asset_status:"existing".
// Does NOT call ComfyUI or Higgsfield — use after you have PNGs in a side folder.
//
// Matching: filename contains slide number (02) or role (context); fallback sorted order
// when counts match. Skips cover unless --all. Then: bun run export -- <key>.
import { readdirSync, copyFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { writePostJson } from "./lib/post-io.mjs";
import { loadPostByKey, POSTS_DIR } from "./lib/post-resolve.mjs";
import { RENDERER_ROOT as RENDERER } from "./lib/paths.mjs";
import { roleFileToken } from "./lib/slide-filename.mjs";
import { flagSet, showHelpAndExit } from "./lib/cli.mjs";

const IMG = /\.(png|jpe?g|webp)$/i;

const args = process.argv.slice(2);
const flags = flagSet(args);

const HELP = `
bun run import-bg — adopt external background PNGs into a post

USAGE
  bun run import-bg -- <post-key> [<source-folder>] [--all]

  <post-key>        slug or substring
  <source-folder>   path to folder of images, or shorthand:
                    (omit) | flux2 | _flux2  → public/backgrounds/<prefix>_flux2
                    higgsfield               → public/backgrounds/<prefix>_higgsfield

FLAGS
  --all             include cover slide (default: inner slides only)
  --help, -h

OUTPUT
  Copies to public/backgrounds/<prefix>/NN_role.png, updates post JSON, asset_status=existing.

EXAMPLES
  bun run import-bg -- my-post flux2
  bun run import-bg -- my-post D:/ComfyUI/output/batch --all
`;

if (flags.has("--help") || flags.has("-h") || args.includes("-h")) showHelpAndExit(HELP);

const [key, srcArg] = args.filter((a) => !a.startsWith("--"));
if (!key) {
  console.error(HELP);
  process.exit(1);
}

const loaded = loadPostByKey(key);
if (!loaded) {
  console.error(`No post JSON in ${POSTS_DIR} matching "${key}".`);
  process.exit(1);
}
const { postPath, post } = loaded;
const prefix = post.upload_package.filename_prefix;

// Source: an explicit folder, or the shorthand "flux2"/"_flux2"/(omitted) = this post's
// FLUX.2 compare set at public/backgrounds/<prefix>_flux2.
const srcDir = (!srcArg || srcArg === "flux2" || srcArg === "_flux2")
  ? path.join(RENDERER, "public", "backgrounds", `${prefix}_flux2`)
  : srcArg === "higgsfield"
    ? path.resolve(path.join(RENDERER, "public", "backgrounds", `${prefix}_higgsfield`))
    : path.resolve(srcArg);
if (!existsSync(srcDir)) { console.error(`Source folder not found: ${srcDir}`); process.exit(1); }

const srcImgs = readdirSync(srcDir).filter((f) => IMG.test(f)).sort();
if (!srcImgs.length) { console.error(`No images (.png/.jpg/.webp) in ${srcDir}`); process.exit(1); }

const targets = post.slides.filter((s) => flags.has("--all") || s.role !== "cover");
const destDir = path.join(RENDERER, "public", "backgrounds", prefix);
mkdirSync(destDir, { recursive: true });

const used = new Set();
function pick(slide) {
  const nn = String(slide.slide).padStart(2, "0");
  // by slide number, then by role token, among not-yet-used files
  return (
    srcImgs.find((f) => !used.has(f) && f.includes(nn)) ||
    srcImgs.find((f) => !used.has(f) && f.toLowerCase().includes(slide.role.replace("_", "-"))) ||
    srcImgs.find((f) => !used.has(f) && f.toLowerCase().includes(slide.role)) ||
    null
  );
}

// If nothing matches by name but counts line up, fall back to sorted order.
let byName = targets.map((s) => pick(s));
const noneMatched = byName.every((x) => x === null);
if (noneMatched && srcImgs.length === targets.length) byName = srcImgs.slice();

let n = 0;
targets.forEach((slide, idx) => {
  const src = byName[idx];
  if (!src) { console.warn(`⚠ slide ${slide.slide} (${slide.role}): no source image matched — left as ${slide.asset_status}`); return; }
  used.add(src);
  const role = roleFileToken(slide.role);
  const destName = `${String(slide.slide).padStart(2, "0")}_${role}.png`;
  copyFileSync(path.join(srcDir, src), path.join(destDir, destName));
  slide.background_asset = `/backgrounds/${prefix}/${destName}`;
  slide.asset_status = "existing";
  console.log(`  ✓ ${src}  →  ${destName}`);
  n++;
});

writePostJson(postPath, post);
console.log(`\n✓ Imported ${n}/${targets.length} background(s) → public/backgrounds/${prefix}/ and set asset_status=existing.`);
console.log(`  Next: bun run export -- ${key}`);
