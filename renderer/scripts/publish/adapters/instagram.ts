import type { PlatformAdapter, RenderPackage, AdapterResult, PublishOpts } from "../types";
import { loadPublishConfig } from "../config";
import { getMetaCredentials, GRAPH_BASE, appSecretProof } from "../auth/meta";
import { uploadTemp, type TempUpload } from "./lib/temp-hosting";

// Every call below is authenticated with a Page access token (user-derived), so it needs
// appsecret_proof once the app's "Require app secret" setting is enabled.
function withProof(pageAccessToken: string, params: Record<string, string>): Record<string, string> {
  const appSecret = process.env.META_APP_SECRET ?? "";
  return { ...params, appsecret_proof: appSecretProof(pageAccessToken, appSecret) };
}

// ---------------------------------------------------------------------------
// Instagram Graph API — Reels and Carousel publish.
//
// Reels (two-step container flow):
//   1. POST /<IG_USER_ID>/media (media_type=REELS, video_url, caption, share_to_feed,
//        is_ai_generated=true always, trial_params when instagram.trialReels is enabled)
//        video_url must be a PUBLIC url — Meta fetches it — staged via lib/temp-hosting.ts.
//   2. Poll GET /<CONTAINER_ID>?fields=status_code until FINISHED/ERROR/EXPIRED.
//   3. POST /<IG_USER_ID>/media_publish?creation_id=...
//
// Carousel (children built first, then a parent container):
//   1. Temp-host every slide PNG, then POST /<IG_USER_ID>/media per image
//        (image_url, is_carousel_item=true, alt_text) to get child container ids.
//   2. POST /<IG_USER_ID>/media (media_type=CAROUSEL, children=<ids>, caption,
//        is_ai_generated=true — only the PARENT container may set this; Meta errors
//        if a child container also sets it).
//   3. Poll + publish exactly like Reels. All temp-hosted images are cleaned up
//      in a `finally`, regardless of outcome.
//
// publish.config.json's instagram.mode gates all of this: "manual" keeps the
// original checklist; "api" runs postType ("reels" | "carousel") below.
//
// AI content disclosure: Meta requires self-disclosure of AI-generated media via
// `is_ai_generated`. Every post this pipeline makes is AI-generated, so this
// adapter always sends `is_ai_generated=true` — it is not configurable per post.
// Facebook Page videos have no equivalent documented parameter on this endpoint
// as of API v25.0, so it is not sent there.
// ---------------------------------------------------------------------------

const CAPTION_MAX = 2200;
const HASHTAG_MAX = 30;

type ContainerCreateResponse = { id: string };
type ContainerStatusResponse = { status_code?: "IN_PROGRESS" | "FINISHED" | "ERROR" | "EXPIRED"; status?: string };
type PublishResponse = { id: string };

export type InstagramConfig = {
  enabled: boolean;
  mode: "api" | "manual";
  postType: "reels" | "carousel";
  trialReels: boolean;
};

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
    return `${msg} — set PUBLISH_TEMP_SECRET in renderer/.env (matches the Vercel env var on aiugc.chron0.tech)`;
  }
  if (msg.includes("trial_params") || msg.includes("TRIAL")) {
    return `${msg} — Trial Reels requires the account to be approved for the feature; set instagram.trialReels to false until then`;
  }
  return msg;
}

// ---------------------------------------------------------------------------
// Network steps
// ---------------------------------------------------------------------------

async function createReelsContainer(
  fetchImpl: typeof fetch,
  igUserId: string,
  pageAccessToken: string,
  videoUrl: string,
  caption: string,
  trialReels: boolean,
): Promise<ContainerCreateResponse> {
  const params = new URLSearchParams(
    withProof(pageAccessToken, {
      media_type: "REELS",
      video_url: videoUrl,
      caption,
      share_to_feed: "true",
      is_ai_generated: "true",
      access_token: pageAccessToken,
    }),
  );
  if (trialReels) {
    params.set("trial_params", JSON.stringify({ graduation_strategy: "MANUAL" }));
  }
  const resp = await fetchImpl(`${GRAPH_BASE}/${igUserId}/media?${params.toString()}`, { method: "POST" });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Instagram Reels container create failed: ${resp.status} — ${text}`);
  }
  return (await resp.json()) as ContainerCreateResponse;
}

async function createCarouselChildContainer(
  fetchImpl: typeof fetch,
  igUserId: string,
  pageAccessToken: string,
  imageUrl: string,
  altText: string,
): Promise<ContainerCreateResponse> {
  const params = new URLSearchParams(
    withProof(pageAccessToken, {
      image_url: imageUrl,
      is_carousel_item: "true",
      access_token: pageAccessToken,
    }),
  );
  if (altText) params.set("alt_text", altText);
  const resp = await fetchImpl(`${GRAPH_BASE}/${igUserId}/media?${params.toString()}`, { method: "POST" });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Instagram carousel child container create failed: ${resp.status} — ${text}`);
  }
  return (await resp.json()) as ContainerCreateResponse;
}

async function createCarouselParentContainer(
  fetchImpl: typeof fetch,
  igUserId: string,
  pageAccessToken: string,
  childrenIds: string[],
  caption: string,
): Promise<ContainerCreateResponse> {
  const params = new URLSearchParams(
    withProof(pageAccessToken, {
      media_type: "CAROUSEL",
      children: childrenIds.join(","),
      caption,
      is_ai_generated: "true", // only the parent carousel container may set this — children error if set
      access_token: pageAccessToken,
    }),
  );
  const resp = await fetchImpl(`${GRAPH_BASE}/${igUserId}/media?${params.toString()}`, { method: "POST" });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Instagram carousel parent container create failed: ${resp.status} — ${text}`);
  }
  return (await resp.json()) as ContainerCreateResponse;
}

async function checkContainerStatus(
  fetchImpl: typeof fetch,
  containerId: string,
  pageAccessToken: string,
): Promise<ContainerStatusResponse> {
  const params = new URLSearchParams(
    withProof(pageAccessToken, { fields: "status_code,status", access_token: pageAccessToken }),
  );
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
  const params = new URLSearchParams(
    withProof(pageAccessToken, { creation_id: containerId, access_token: pageAccessToken }),
  );
  const resp = await fetchImpl(`${GRAPH_BASE}/${igUserId}/media_publish?${params.toString()}`, { method: "POST" });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Instagram media_publish failed: ${resp.status} — ${text}`);
  }
  return (await resp.json()) as PublishResponse;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function pollUntilFinished(
  fetchImpl: typeof fetch,
  containerId: string,
  pageAccessToken: string,
  pollIntervalMs: number,
  maxPolls: number,
): Promise<void> {
  let last: ContainerStatusResponse = {};
  for (let i = 0; i < maxPolls; i++) {
    last = await checkContainerStatus(fetchImpl, containerId, pageAccessToken);
    if (last.status_code === "FINISHED" || last.status_code === "ERROR" || last.status_code === "EXPIRED") break;
    if (i < maxPolls - 1) await sleep(pollIntervalMs);
  }
  if (last.status_code !== "FINISHED") {
    throw new Error(
      `Instagram container did not finish processing (status_code: ${last.status_code ?? "unknown"}${last.status ? `, status: ${last.status}` : ""})`,
    );
  }
}

// ---------------------------------------------------------------------------
// Manual fallback (original behavior — kept for mode: "manual")
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

      const temps: TempUpload[] = [];
      const cleanupAll = async () => {
        await Promise.all(temps.map((t) => t.cleanup()));
      };

      try {
        const { igUserId, pageAccessToken } = await deps.getCredentials();
        const { caption } = buildInstagramCaption(pkg.post);

        if (cfg.postType === "carousel") {
          if (pkg.slides.length === 0) {
            throw new Error("No slides found for carousel publish — this post has no carousel images.");
          }

          const childrenIds: string[] = [];
          for (const slide of pkg.slides) {
            const temp = await deps.uploadTemp(slide.path);
            temps.push(temp);
            const child = await createCarouselChildContainer(
              deps.fetchImpl,
              igUserId,
              pageAccessToken,
              temp.url,
              slide.altText,
            );
            childrenIds.push(child.id);
          }

          const parent = await createCarouselParentContainer(
            deps.fetchImpl,
            igUserId,
            pageAccessToken,
            childrenIds,
            caption,
          );
          await pollUntilFinished(deps.fetchImpl, parent.id, pageAccessToken, pollIntervalMs, maxPolls);
          const published = await publishContainer(deps.fetchImpl, igUserId, parent.id, pageAccessToken);
          return shapeInstagramResult(published.id);
        }

        // postType === "reels"
        const temp = await deps.uploadTemp(pkg.reelPath);
        temps.push(temp);
        const container = await createReelsContainer(
          deps.fetchImpl,
          igUserId,
          pageAccessToken,
          temp.url,
          caption,
          cfg.trialReels,
        );
        await pollUntilFinished(deps.fetchImpl, container.id, pageAccessToken, pollIntervalMs, maxPolls);
        const published = await publishContainer(deps.fetchImpl, igUserId, container.id, pageAccessToken);
        return shapeInstagramResult(published.id);
      } catch (err) {
        return { platform: "instagram", kind: "api", status: "failed", error: friendlyError(err) };
      } finally {
        await cleanupAll();
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
