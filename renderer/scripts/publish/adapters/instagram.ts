import type { PlatformAdapter, RenderPackage, AdapterResult, PublishOpts } from "../types";
import { loadPublishConfig } from "../config";
import { getMetaCredentials, GRAPH_BASE } from "../auth/meta";
import { uploadTemp, type TempUpload } from "./lib/temp-hosting";

// ---------------------------------------------------------------------------
// Instagram Graph API — Reels publish, two-step container flow:
//   1. POST /<IG_USER_ID>/media (media_type=REELS, video_url, caption, share_to_feed)
//        video_url must be a PUBLIC url — Meta fetches it — so we stage the reel via
//        lib/temp-hosting.ts (ai-ugc.chron0.tech + Vercel Blob) first.
//   2. Poll GET /<CONTAINER_ID>?fields=status_code until FINISHED/ERROR/EXPIRED.
//   3. POST /<IG_USER_ID>/media_publish?creation_id=...
// The temp-hosted blob is deleted in a `finally`, regardless of outcome.
//
// publish.config.json's instagram.mode gates this: "manual" keeps the original
// checklist behavior (e.g. for carousel posts, which this adapter doesn't cover);
// "api" runs the real Reels flow below.
// ---------------------------------------------------------------------------

const CAPTION_MAX = 2200;
const HASHTAG_MAX = 30;

type ContainerCreateResponse = { id: string };
type ContainerStatusResponse = { status_code?: "IN_PROGRESS" | "FINISHED" | "ERROR" | "EXPIRED"; status?: string };
type PublishResponse = { id: string };

export type InstagramConfig = { enabled: boolean; mode: "api" | "manual"; privacy?: string };

export type InstagramDeps = {
  loadConfig: () => InstagramConfig;
  getCredentials: () => Promise<{ igUserId: string; pageAccessToken: string }>;
  fetchImpl: typeof fetch;
  uploadTemp: (filePath: string) => Promise<TempUpload>;
  pollIntervalMs?: number;
  maxPolls?: number;
};

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/** Build an IG caption: caption + up to HASHTAG_MAX hashtags, truncated to CAPTION_MAX chars. */
export function buildInstagramCaption(post: { caption: string; hashtags: string[] }): {
  caption: string;
  truncated: boolean;
} {
  const hashtags = post.hashtags.slice(0, HASHTAG_MAX);
  const hashtagStr = hashtags.map((t) => `#${t}`).join(" ");
  const full = `${post.caption}\n\n${hashtagStr}`;
  if (full.length <= CAPTION_MAX) return { caption: full, truncated: false };
  return { caption: full.slice(0, CAPTION_MAX), truncated: true };
}

export function shapeInstagramResult(mediaId: string): AdapterResult {
  return {
    platform: "instagram",
    kind: "api",
    status: "published",
    id: mediaId,
    url: `https://www.instagram.com/reel/${mediaId}/`,
  };
}

function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('"code":190') || msg.includes("Error validating access token")) {
    return `${msg} — Meta token invalid or expired — run bun run publish:auth meta`;
  }
  if (msg.includes("No Meta credentials found")) {
    return msg;
  }
  if (msg.includes("PUBLISH_TEMP_SECRET")) {
    return `${msg} — set PUBLISH_TEMP_SECRET in renderer/.env (matches the Vercel env var on ai-ugc.chron0.tech)`;
  }
  return msg;
}

// ---------------------------------------------------------------------------
// Network steps
// ---------------------------------------------------------------------------

async function createContainer(
  fetchImpl: typeof fetch,
  igUserId: string,
  pageAccessToken: string,
  videoUrl: string,
  caption: string,
): Promise<ContainerCreateResponse> {
  const params = new URLSearchParams({
    media_type: "REELS",
    video_url: videoUrl,
    caption,
    share_to_feed: "true",
    access_token: pageAccessToken,
  });
  const resp = await fetchImpl(`${GRAPH_BASE}/${igUserId}/media?${params.toString()}`, { method: "POST" });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Instagram container create failed: ${resp.status} — ${text}`);
  }
  return (await resp.json()) as ContainerCreateResponse;
}

async function checkContainerStatus(
  fetchImpl: typeof fetch,
  containerId: string,
  pageAccessToken: string,
): Promise<ContainerStatusResponse> {
  const params = new URLSearchParams({ fields: "status_code,status", access_token: pageAccessToken });
  const resp = await fetchImpl(`${GRAPH_BASE}/${containerId}?${params.toString()}`);
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Instagram container status check failed: ${resp.status} — ${text}`);
  }
  return (await resp.json()) as ContainerStatusResponse;
}

async function publishContainer(
  fetchImpl: typeof fetch,
  igUserId: string,
  containerId: string,
  pageAccessToken: string,
): Promise<PublishResponse> {
  const params = new URLSearchParams({ creation_id: containerId, access_token: pageAccessToken });
  const resp = await fetchImpl(`${GRAPH_BASE}/${igUserId}/media_publish?${params.toString()}`, { method: "POST" });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Instagram media_publish failed: ${resp.status} — ${text}`);
  }
  return (await resp.json()) as PublishResponse;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Manual fallback (original behavior — kept for mode: "manual", e.g. carousels)
// ---------------------------------------------------------------------------

function manualChecklist(pkg: RenderPackage): AdapterResult {
  const message = [
    "Manual upload to Instagram:",
    `  1) Open the render folder: ${pkg.dir}`,
    `  2) Post the reel: ${pkg.reelPath}`,
    `  3) Copy the caption from caption.txt (topics are already appended as a bracketed list)`,
    `  4) Paste the per-slide alt text from alt_text.txt if posting the carousel`,
    `  5) Tag location / collaborators if needed, then publish`,
  ].join("\n");

  return { platform: "instagram", kind: "manual", status: "manual", id: null, url: null, message };
}

// ---------------------------------------------------------------------------
// Factory (dependency-injectable for testing)
// ---------------------------------------------------------------------------

export function makeInstagramAdapter(deps: InstagramDeps): PlatformAdapter {
  const pollIntervalMs = deps.pollIntervalMs ?? 5000;
  const maxPolls = deps.maxPolls ?? 60; // ~5 minutes at the default interval

  return {
    name: "instagram",
    kind: "api",

    async publish(pkg: RenderPackage, opts: PublishOpts): Promise<AdapterResult> {
      const cfg = deps.loadConfig();

      if (cfg.mode === "manual") {
        return manualChecklist(pkg);
      }

      if (opts.dryRun) {
        return { platform: "instagram", kind: "api", status: "manual", message: "(dry-run)" };
      }

      let temp: TempUpload | undefined;
      try {
        const { igUserId, pageAccessToken } = await deps.getCredentials();
        temp = await deps.uploadTemp(pkg.reelPath);

        const { caption } = buildInstagramCaption(pkg.post);
        const container = await createContainer(deps.fetchImpl, igUserId, pageAccessToken, temp.url, caption);

        let last: ContainerStatusResponse = {};
        for (let i = 0; i < maxPolls; i++) {
          last = await checkContainerStatus(deps.fetchImpl, container.id, pageAccessToken);
          if (last.status_code === "FINISHED" || last.status_code === "ERROR" || last.status_code === "EXPIRED") break;
          if (i < maxPolls - 1) await sleep(pollIntervalMs);
        }

        if (last.status_code !== "FINISHED") {
          throw new Error(
            `Instagram container did not finish processing (status_code: ${last.status_code ?? "unknown"}${last.status ? `, status: ${last.status}` : ""})`,
          );
        }

        const published = await publishContainer(deps.fetchImpl, igUserId, container.id, pageAccessToken);
        return shapeInstagramResult(published.id);
      } catch (err) {
        return { platform: "instagram", kind: "api", status: "failed", error: friendlyError(err) };
      } finally {
        if (temp) await temp.cleanup();
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Default export — wired to real implementations
// ---------------------------------------------------------------------------

export const instagramAdapter = makeInstagramAdapter({
  loadConfig: () => loadPublishConfig().instagram,
  getCredentials: () => getMetaCredentials(),
  fetchImpl: fetch,
  uploadTemp: (p) => uploadTemp(p),
});
