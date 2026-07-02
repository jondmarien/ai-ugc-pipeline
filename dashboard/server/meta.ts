import fs from "node:fs";
import path from "node:path";
import type {
  MetaPostType,
  PublishedMetaPost,
  PublishResult,
} from "../shared/types";
import { POSTS_DIR, RENDERS_DIR, REPO_ROOT } from "./paths";
import { parseRenderDirName } from "./repo";

const STATE_FILE = "publish.state.json";

/** Mirrors renderer/scripts/publish/state.ts's readState — not imported, dashboard
 * has no dependency on the renderer project. */
function readPublishState(dir: string): Record<string, PublishResult> {
  try {
    const raw = fs.readFileSync(path.join(dir, STATE_FILE), "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, PublishResult>;
    }
    return {};
  } catch {
    return {};
  }
}

function readPostMeta(
  slug: string,
  postsDir: string,
): { caption: string; hashtags: string[] } {
  try {
    const raw = fs.readFileSync(path.join(postsDir, `${slug}.json`), "utf8");
    const j = JSON.parse(raw);
    return {
      caption: typeof j.caption === "string" ? j.caption : "",
      hashtags: Array.isArray(j.hashtags) ? j.hashtags : [],
    };
  } catch {
    return { caption: "", hashtags: [] };
  }
}

/**
 * Facebook only ever publishes Page video; Instagram's postType (reels vs. carousel)
 * isn't recorded per-publish in publish.state.json, only decided at publish time by
 * publish.config.json. Best-effort label: read the CURRENT config value for Instagram
 * records — this may be wrong for older posts published under a different postType.
 */
function inferPostType(
  platform: string,
  configuredInstagramPostType: "reels" | "carousel",
): MetaPostType {
  if (platform === "facebook") return "fb_video";
  return configuredInstagramPostType === "carousel" ? "carousel" : "reel";
}

/** Best-effort read of the repo's publish.config.json instagram.postType, plain JSON
 * (no zod) since the dashboard has no dependency on the renderer project's schema. */
export function readCurrentInstagramPostType(): "reels" | "carousel" {
  try {
    const raw = fs.readFileSync(
      path.join(REPO_ROOT, "publish.config.json"),
      "utf8",
    );
    const j = JSON.parse(raw);
    return j?.instagram?.postType === "carousel" ? "carousel" : "reels";
  } catch {
    return "reels";
  }
}

export type ListPublishedMetaOpts = {
  rendersDir?: string;
  postsDir?: string;
  instagramPostType?: "reels" | "carousel";
};

/** Walks pipeline/renders/<key>/, reads each publish.state.json, and joins the
 * facebook/instagram "published" entries with the originating post's caption/hashtags. */
export function listPublishedMeta(
  opts: ListPublishedMetaOpts = {},
): PublishedMetaPost[] {
  const rendersDir = opts.rendersDir ?? RENDERS_DIR;
  const postsDir = opts.postsDir ?? POSTS_DIR;
  const instagramPostType = opts.instagramPostType ?? "reels";

  if (!fs.existsSync(rendersDir)) return [];

  const out: PublishedMetaPost[] = [];
  for (const entry of fs.readdirSync(rendersDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(rendersDir, entry.name);
    const state = readPublishState(dir);
    const { date, slug } = parseRenderDirName(entry.name);

    for (const platform of ["facebook", "instagram"] as const) {
      const result = state[platform];
      if (!result || result.status !== "published") continue;

      const { caption, hashtags } = readPostMeta(slug, postsDir);

      out.push({
        renderDir: entry.name,
        slug,
        date,
        platform,
        postType: inferPostType(platform, instagramPostType),
        mediaId: result.id ?? null,
        url: result.url ?? null,
        privacy: result.privacy ?? null,
        isAiGenerated: true,
        caption,
        hashtags,
        publishedAt: result.at,
        insights: null,
        insightsError: null,
      });
    }
  }

  return out.sort((a, b) => b.publishedAt - a.publishedAt);
}
