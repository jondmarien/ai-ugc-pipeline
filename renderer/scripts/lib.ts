import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { PostData, ROLE_FILENAME, type TPostData } from "../src/lib/schema.ts";

export const ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
export const REPO_ROOT = path.resolve(ROOT, "..");
export const POSTS_DIR = path.join(ROOT, "content", "posts");

export function loadPost(key: string): TPostData {
  // Accept a slug, post_id, filename_prefix, or a path to a JSON file.
  let file = key;
  if (!key.endsWith(".json")) {
    const candidates = readdirSync(POSTS_DIR).filter((f) => f.endsWith(".json"));
    const match = candidates.find((f) => f.includes(key));
    if (!match) throw new Error(`No post JSON in ${POSTS_DIR} matching "${key}". Available: ${candidates.join(", ")}`);
    file = path.join(POSTS_DIR, match);
  }
  const raw = JSON.parse(readFileSync(file, "utf8"));
  const parsed = PostData.safeParse(raw);
  if (!parsed.success) {
    console.error(`\n[validate] ${path.basename(file)} failed schema validation:`);
    for (const issue of parsed.error.issues) {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    }
    throw new Error("Post JSON validation failed. Fix the source data; the renderer does not guess missing fields.");
  }
  return parsed.data;
}

export function slideFilename(post: TPostData, slideIndex0: number): string {
  const slide = post.slides[slideIndex0];
  const n = String(slide.slide).padStart(2, "0");
  const role = ROLE_FILENAME[slide.role];
  return `${post.upload_package.filename_prefix}_${n}_${role}.png`;
}

export function outputDir(post: TPostData): string {
  // Output package lives under the repo's pipeline/renders/<folder-name>.
  const folderName = path.basename(post.upload_package.folder);
  return path.join(REPO_ROOT, "pipeline", "renders", folderName);
}
