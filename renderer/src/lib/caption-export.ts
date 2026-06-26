import type { TPostData } from "./schema.ts";
import { multipleCaptionsEnabled } from "./schema.ts";

/** Bracketed topic line from post.hashtags (not #hashtags). Empty when no topics. */
export function topicLine(post: Pick<TPostData, "hashtags">): string {
  const topics = post.hashtags.map((t) => t.replace(/^#/, "").trim()).filter(Boolean);
  return topics.length ? `[${topics.join(", ")}]` : "";
}

/** Single post-level caption export (legacy default). */
export function captionTxt(post: Pick<TPostData, "caption" | "hashtags">): string {
  const topics = topicLine(post);
  const topicSuffix = topics ? `\n\n${topics}\n` : "\n";
  return `${post.caption}${topicSuffix}`;
}

/**
 * Per-slide Instagram caption export (opt-in via features.multiple_captions).
 *
 * Product rules (enforced upstream by Zod when the flag is on):
 * - slide_captions.length must equal slides.length; every entry non-empty after trim.
 * - Partial lists and empty strings are rejected at validate time, not repaired here.
 *
 * Export rules:
 * - One paste-ready block per slide, blank-line separated (same shape as alt_text.txt).
 * - Bracketed topics append only to the **last** slide block (single newline, same block)
 *   so blank-line splitting still yields exactly N paste-ready blocks.
 * - When the flag is off, returns null (callers must not write slide_captions_file).
 */
export function slideCaptionsTxt(
  post: Pick<TPostData, "features" | "slide_captions" | "slides" | "hashtags">,
): string | null {
  if (!multipleCaptionsEnabled(post as Pick<TPostData, "features">)) return null;
  const captions = post.slide_captions;
  if (!captions?.length) return null;
  const topics = topicLine(post);
  const blocks = captions.map((line, i) => {
    const body = line.trim();
    const isLast = i === captions.length - 1;
    if (isLast && topics) return `${body}\n${topics}`;
    return body;
  });
  return blocks.join("\n\n") + "\n";
}

export function slideCaptionsOutputName(post: Pick<TPostData, "upload_package">): string {
  return post.upload_package.slide_captions_file ?? "slide_captions.txt";
}