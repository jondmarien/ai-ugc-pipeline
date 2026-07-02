import { slideCaptionsOutputName } from "../../src/lib/caption-export.ts";
import type { TPostData } from "../../src/lib/schema.ts";
import { multipleCaptionsEnabled } from "../../src/lib/schema.ts";
import { slideFilename } from "../lib.ts";

/**
 * Manual Instagram carousel upload steps (no Graph API in this repo).
 * When multiple_captions is enabled, lists slide_captions_file + per-slide paste order.
 */
export function instagramUploadChecklist(
  post: TPostData,
  renderDir: string,
): string {
  const pngs = post.slides.map((_, i) => slideFilename(post, i));
  const multi = multipleCaptionsEnabled(post);
  const captionFile = post.upload_package.caption_file;
  const slideCaptionsFile = slideCaptionsOutputName(post);

  const lines = [
    `# Instagram upload checklist — ${post.post_id}`,
    "",
    `Render folder: ${renderDir}`,
    "",
    "## Carousel images (in order)",
    ...pngs.map((f, i) => `${i + 1}. ${f}`),
    "",
  ];

  if (multi) {
    lines.push(
      "## Per-slide captions (native Multiple Captions)",
      `1. Open \`${slideCaptionsFile}\` — one blank-line-separated block per slide (topics on the last block only).`,
      "2. In the Instagram app, enable per-slide captions for this carousel and paste each block into the matching slide.",
      `3. Keep \`${captionFile}\` as the carousel-level fallback for schedulers that only accept one caption.`,
      "",
    );
  } else {
    lines.push(
      "## Caption",
      `1. Paste \`${captionFile}\` into the carousel caption field.`,
      "",
    );
  }

  lines.push(
    "## Alt text",
    "1. Open `alt_text.txt` and paste each blank-line block into the matching slide's accessibility field.",
    "",
    "## Reel (optional)",
    post.video?.enabled
      ? `1. Upload \`${post.video.export_name}\` as a separate Reel (not part of the carousel).`
      : "1. No reel in this package.",
    "",
    "> Instagram Graph API carousels still use a single parent caption; native per-slide captions are manual-app only.",
    "",
  );

  return lines.join("\n");
}
