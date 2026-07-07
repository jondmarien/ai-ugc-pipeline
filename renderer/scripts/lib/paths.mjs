// Canonical filesystem roots for Bun/Node CLI scripts under renderer/scripts/.
//
// Import RENDERER_ROOT / POSTS_DIR instead of duplicating fileURLToPath("../..") in
// every entry script. TS tools use scripts/lib.ts (same layout, adds Zod on loadPost).
import path from "node:path";
import { fileURLToPath } from "node:url";

const LIB_DIR = path.dirname(fileURLToPath(import.meta.url));

/** renderer/ (parent of scripts/) */
export const RENDERER_ROOT = path.resolve(LIB_DIR, "..", "..");

/** renderer/content/posts */
export const POSTS_DIR = path.join(RENDERER_ROOT, "content", "posts");

/** ai-ugc-pipeline repo root */
export const REPO_ROOT = path.resolve(RENDERER_ROOT, "..");

export function publicDir() {
  return path.join(RENDERER_ROOT, "public");
}

export function backgroundsDir(prefix) {
  return path.join(publicDir(), "backgrounds", prefix);
}

export function videosDir(prefix) {
  return path.join(publicDir(), "video", prefix);
}
