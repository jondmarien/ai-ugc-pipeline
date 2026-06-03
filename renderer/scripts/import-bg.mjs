// bun run import-bg -- <post-key> <source-folder> [--all]
// Copies a folder of externally-generated backgrounds (e.g. from ComfyUI) into
// renderer/public/backgrounds/<prefix>/ named NN_role.png, and flips those slides to
// asset_status:"existing" + background_asset in the post JSON. Then: bun run export.
//
// Matching: for each target slide it looks for a source image whose filename contains
// the 2-digit slide number (e.g. "02") or the role (e.g. "context"); if none match by
// name but the counts line up, it assigns the sorted images in order. Skips the cover
// unless --all.
import { readFileSync, writeFileSync, readdirSync, copyFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RENDERER = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const POSTS = path.join(RENDERER, "content", "posts");
const ROLE_FILE = { failure_point: "failure-point" };
const IMG = /\.(png|jpe?g|webp)$/i;

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const [key, srcArg] = args.filter((a) => !a.startsWith("--"));
if (!key) {
  console.error("Usage: bun run import-bg -- <post-key> [<source-folder>|flux2] [--all]");
  console.error("  source defaults to this post's FLUX.2 set: public/backgrounds/<prefix>_flux2");
  process.exit(1);
}

const file = readdirSync(POSTS).find((f) => f.endsWith(".json") && f.includes(key));
if (!file) { console.error(`No post JSON in ${POSTS} matching "${key}".`); process.exit(1); }
const postPath = path.join(POSTS, file);
const post = JSON.parse(readFileSync(postPath, "utf8"));
const prefix = post.upload_package.filename_prefix;

// Source: an explicit folder, or the shorthand "flux2"/"_flux2"/(omitted) = this post's
// FLUX.2 compare set at public/backgrounds/<prefix>_flux2.
const srcDir = (!srcArg || srcArg === "flux2" || srcArg === "_flux2")
  ? path.join(RENDERER, "public", "backgrounds", `${prefix}_flux2`)
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
  const role = ROLE_FILE[slide.role] ?? slide.role;
  const destName = `${String(slide.slide).padStart(2, "0")}_${role}.png`;
  copyFileSync(path.join(srcDir, src), path.join(destDir, destName));
  slide.background_asset = `/backgrounds/${prefix}/${destName}`;
  slide.asset_status = "existing";
  console.log(`  ✓ ${src}  →  ${destName}`);
  n++;
});

writeFileSync(postPath, JSON.stringify(post, null, 2) + "\n", "utf8");
console.log(`\n✓ Imported ${n}/${targets.length} background(s) → public/backgrounds/${prefix}/ and set asset_status=existing.`);
console.log(`  Next: bun run export -- ${key}`);
