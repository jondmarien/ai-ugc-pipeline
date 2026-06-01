import { validatePost, type TPostData } from "./schema";

// Eagerly import every post JSON under content/posts so the preview app and
// the export script share one validated source of truth.
const modules = import.meta.glob("../../content/posts/*.json", { eager: true });

const byId: Record<string, TPostData> = {};
for (const [path, mod] of Object.entries(modules)) {
  const raw = (mod as { default: unknown }).default;
  try {
    const post = validatePost(raw);
    byId[post.post_id] = post;
    byId[post.slug] = post;
    // Also key by filename_prefix so the export script can address it directly.
    byId[post.upload_package.filename_prefix] = post;
  } catch (err) {
    // Fail loud in the preview console; the export script validates again before writing.
    console.error(`[posts] validation failed for ${path}:`, err);
    throw err;
  }
}

export function getPost(idOrSlug: string): TPostData | undefined {
  return byId[idOrSlug];
}

export function allPosts(): TPostData[] {
  const seen = new Set<string>();
  const out: TPostData[] = [];
  for (const p of Object.values(byId)) {
    if (!seen.has(p.post_id)) {
      seen.add(p.post_id);
      out.push(p);
    }
  }
  return out;
}
