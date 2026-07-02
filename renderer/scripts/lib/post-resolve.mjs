// Resolve post JSON files by substring key (MJS pipeline — no Zod).
//
// Used by art, pipeline, import-bg, upscale, reel:higgsfield, etc.
// For schema-validated loads in TS, use scripts/lib.ts loadPost() instead.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { POSTS_DIR } from "./paths.mjs";

export { POSTS_DIR };

export function allPostJsonFiles() {
  return readdirSync(POSTS_DIR).filter((f) => f.endsWith(".json"));
}

export function allPostKeys() {
  return allPostJsonFiles().map((f) => f.replace(/\.json$/, ""));
}

/** First matching post filename (substring match), or null. */
export function findPostFile(key) {
  if (!key) return null;
  return allPostJsonFiles().find((f) => f.includes(key)) ?? null;
}

/**
 * Load raw post object from content/posts (mutates post.post_id default).
 * @returns {{ file: string, fullKey: string, postPath: string, post: object } | null}
 */
export function loadPostByKey(key) {
  const file = findPostFile(key);
  if (!file) return null;
  const postPath = path.join(POSTS_DIR, file);
  const post = JSON.parse(readFileSync(postPath, "utf8"));
  const fullKey = file.replace(/\.json$/, "");
  post.post_id = post.post_id ?? fullKey;
  return { file, fullKey, postPath, post };
}
