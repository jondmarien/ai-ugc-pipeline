// bun run slide-video -- <post-key> --slide=N --source=<path/to/clip.gif|mp4> [--poster-at=<sec>]
//
// Turns a real video/GIF clip into a carousel slide: converts it into a canvas-fit MP4 (for
// publishing, both manual and API) plus a letterboxed poster-frame PNG (so the slide still goes
// through the normal Playwright export/QA pipeline like every other slide — background_asset,
// asset_status, on_slide_copy overlay all work unchanged). Sets slide.media_type = "video" so
// build-package.ts copies the clip into the render output and the Instagram adapter publishes it
// as a real video carousel child instead of the poster PNG.
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { backgroundFileName, videoFileName } from "./lib/slide-filename.mjs";
import { backgroundsDir, publicDir, videosDir } from "./lib/paths.mjs";
import { loadPostByKey } from "./lib/post-resolve.mjs";
import { writePostJson } from "./lib/post-io.mjs";

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log(`
bun run slide-video — convert a real clip into a carousel video slide

USAGE
  bun run slide-video -- <post-key> --slide=N --source=<path> [--poster-at=<sec>]

  <post-key>       slug or substring (same matching as other scripts)
  --slide=N        1-based slide number to turn into a video (must already exist in the post)
  --source=<path>  local GIF or video file to convert (ffmpeg reads both)
  --poster-at=<s>  seconds into the clip to grab the poster frame (default 0.2)

OUTPUT
  public/video/<prefix>/NN_role.mp4       (canvas-fit, h264, faststart — used at publish time)
  public/backgrounds/<prefix>/NN_role.png (letterboxed poster frame — used for local export/QA)
  patches the slide: media_type="video", video_asset, background_asset, asset_status="existing"

EXAMPLE
  bun run slide-video -- 2026-07-09_januscape-kvm-escape --slide=4 --source=~/Desktop/demo.gif
`);
  process.exit(0);
}

const key = args.find((a) => !a.startsWith("--"));
const opt = (name, def) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=").slice(1).join("=") : def;
};
const slideNum = parseInt(opt("slide", ""), 10);
const source = opt("source", "");
const posterAt = opt("poster-at", "0.2");

if (!key || !slideNum || !source) {
  console.error(
    "Usage: bun run slide-video -- <post-key> --slide=N --source=<path> (run --help for details)",
  );
  process.exit(1);
}

const found = loadPostByKey(key);
if (!found) {
  console.error(`No post JSON matching "${key}"`);
  process.exit(1);
}
const { post, postPath, fullKey } = found;
const slideIndex = post.slides.findIndex((s) => s.slide === slideNum);
if (slideIndex === -1) {
  console.error(
    `Slide ${slideNum} not found in ${fullKey} (has ${post.slides.length} slides)`,
  );
  process.exit(1);
}
const slide = post.slides[slideIndex];
const prefix = post.upload_package.filename_prefix;
const { width, height } = post.canvas;
const voidHex = post.brand?.palette?.bg ?? "#05070d";

const outVideoDir = videosDir(prefix);
const outBgDir = backgroundsDir(prefix);
mkdirSync(outVideoDir, { recursive: true });
mkdirSync(outBgDir, { recursive: true });

const videoName = videoFileName(slide);
const posterName = backgroundFileName(slide);
const videoPath = path.join(outVideoDir, videoName);
const posterPath = path.join(outBgDir, posterName);

// scale to fit inside the canvas, then pad with the house void color — same letterbox treatment
// as any other "existing" (real, non-generated) slide asset.
const scalePad = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=${voidHex}`;

console.log(`Converting ${source} → ${path.relative(publicDir(), videoPath)}`);
execFileSync(
  "ffmpeg",
  [
    "-y",
    "-i",
    source,
    "-vf",
    `${scalePad},format=yuv420p`,
    "-c:v",
    "libx264",
    "-movflags",
    "+faststart",
    "-an", // carousel video children don't need audio for a silent demo clip; re-encode drops it cleanly
    videoPath,
  ],
  { stdio: "inherit" },
);

console.log(
  `Extracting poster frame (t=${posterAt}s) → ${path.relative(publicDir(), posterPath)}`,
);
execFileSync(
  "ffmpeg",
  [
    "-y",
    "-ss",
    posterAt,
    "-i",
    source,
    "-frames:v",
    "1",
    "-update",
    "1",
    "-vf",
    scalePad,
    posterPath,
  ],
  { stdio: "inherit" },
);

slide.media_type = "video";
slide.video_asset = `/video/${prefix}/${videoName}`;
slide.background_asset = `/backgrounds/${prefix}/${posterName}`;
slide.asset_status = "existing";
writePostJson(postPath, post);

console.log(
  `\n✓ Slide ${slideNum} (${slide.role}) is now a video slide.\n` +
    `  video_asset:      ${slide.video_asset}\n` +
    `  background_asset: ${slide.background_asset} (poster, used by export/QA)\n` +
    `  Next: bun run export -- ${fullKey}  (renders the poster like any other slide)`,
);
