import path from "node:path";

/** dashboard/server -> repo root is two levels up. */
export const REPO_ROOT = path.resolve(import.meta.dir, "..", "..");
export const DASH_ROOT = path.resolve(import.meta.dir, "..");
export const DATA_DIR = path.join(DASH_ROOT, "data");
export const IG_CACHE_DIR = path.join(DATA_DIR, "ig-cache");
export const TRENDS_CACHE_DIR = path.join(DATA_DIR, "trends-cache");
export const POSTS_DIR = path.join(REPO_ROOT, "renderer", "content", "posts");
export const RENDERS_DIR = path.join(REPO_ROOT, "pipeline", "renders");
export const INGESTED_DIR = path.join(REPO_ROOT, "pipeline", "content", "ingested");
export const CAPTION_BANK = path.join(REPO_ROOT, "pipeline", "content", "CAPTION_BANK.md");
