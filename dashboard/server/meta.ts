import fs from "node:fs";
import path from "node:path";
import type {
  MetaInsights,
  MetaPostType,
  PublishedMetaPost,
  PublishResult,
} from "../shared/types";
import { fetchWithCache } from "./ig";
import { appSecretProof, requireMetaStore } from "./meta_auth";
import { META_CACHE_DIR, POSTS_DIR, RENDERS_DIR, REPO_ROOT } from "./paths";
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
      if (result?.status !== "published") continue;

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

// ---------------------------------------------------------------------------
// Graph API insights (Phase 2)
// ---------------------------------------------------------------------------

const GRAPH = "https://graph.facebook.com/v25.0";
const INSTAGRAM_REEL_METRICS = ["views", "reach", "saved", "shares"];
const INSTAGRAM_CAROUSEL_METRICS = ["reach", "saved", "shares"];

async function graphGet(
  pathAndQuery: string,
  pageAccessToken: string,
  appSecret: string,
  fetchImpl: typeof fetch,
): Promise<any> {
  const sep = pathAndQuery.includes("?") ? "&" : "?";
  const proof = appSecretProof(pageAccessToken, appSecret);
  const resp = await fetchImpl(
    `${GRAPH}${pathAndQuery}${sep}access_token=${pageAccessToken}&appsecret_proof=${proof}`,
  );
  const body = await resp.json();
  if (!resp.ok || body.error) {
    const msg = body?.error?.message ?? `HTTP ${resp.status}`;
    throw new Error(msg);
  }
  return body;
}

async function fetchInstagramInsights(
  mediaId: string,
  postType: MetaPostType,
  pageAccessToken: string,
  appSecret: string,
  fetchImpl: typeof fetch,
): Promise<MetaInsights> {
  const metrics =
    postType === "carousel"
      ? INSTAGRAM_CAROUSEL_METRICS
      : INSTAGRAM_REEL_METRICS;
  const raw = await graphGet(
    `/${mediaId}/insights?metric=${metrics.join(",")}`,
    pageAccessToken,
    appSecret,
    fetchImpl,
  );
  const values: Record<string, number> = {};
  for (const m of raw.data ?? []) values[m.name] = m.values?.[0]?.value ?? 0;
  return {
    views: values.views,
    reach: values.reach,
    saves: values.saved,
    shares: values.shares,
  };
}

async function fetchFacebookVideoInsights(
  videoId: string,
  pageAccessToken: string,
  appSecret: string,
  fetchImpl: typeof fetch,
): Promise<MetaInsights> {
  const raw = await graphGet(
    `/${videoId}?fields=likes.summary(true),comments.summary(true)`,
    pageAccessToken,
    appSecret,
    fetchImpl,
  );
  return {
    likes: raw?.likes?.summary?.total_count,
    comments: raw?.comments?.summary?.total_count,
  };
}

export type FetchMetaInsightsDeps = {
  fetchImpl?: typeof fetch;
  cacheDir?: string;
  secretsPath?: string;
};

/**
 * Attaches Graph API insights to every post that has a mediaId, using a per-post
 * cache entry (fetchWithCache, same cache-first/force pattern as ig.ts). A missing
 * Meta credentials file fails ALL posts with the same actionable message the CLI
 * gives; a per-post Graph failure (deleted post, stale token) only fails that post
 * so the rest of the list still renders.
 */
export async function attachMetaInsights(
  posts: PublishedMetaPost[],
  force: boolean,
  deps: FetchMetaInsightsDeps = {},
): Promise<PublishedMetaPost[]> {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const cacheDir = deps.cacheDir ?? META_CACHE_DIR;

  let store: ReturnType<typeof requireMetaStore>;
  let appSecret: string;
  try {
    store = requireMetaStore(deps.secretsPath);
    appSecret = process.env.META_APP_SECRET ?? "";
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return posts.map((p) => ({ ...p, insightsError: message }));
  }

  return Promise.all(
    posts.map(async (p) => {
      if (!p.mediaId) return { ...p, insightsError: "no media id recorded" };
      try {
        const cached = await fetchWithCache<MetaInsights>(
          `${p.platform}-${p.mediaId}`,
          () =>
            p.platform === "instagram"
              ? fetchInstagramInsights(
                  p.mediaId as string,
                  p.postType,
                  store.page_access_token,
                  appSecret,
                  fetchImpl,
                )
              : fetchFacebookVideoInsights(
                  p.mediaId as string,
                  store.page_access_token,
                  appSecret,
                  fetchImpl,
                ),
          cacheDir,
          { force },
        );
        if (cached.error && !cached.data) {
          return { ...p, insights: null, insightsError: cached.error };
        }
        return { ...p, insights: cached.data, insightsError: cached.error };
      } catch (e) {
        return {
          ...p,
          insights: null,
          insightsError: e instanceof Error ? e.message : String(e),
        };
      }
    }),
  );
}
