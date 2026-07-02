import { readFileSync, statSync } from "node:fs";
import type { PlatformAdapter, RenderPackage, AdapterResult, PublishOpts } from "../types";
import { loadPublishConfig } from "../config";
import { getMetaCredentials, GRAPH_BASE, appSecretProof } from "../auth/meta";

// Every call below is authenticated with a Page access token (user-derived), so it needs
// appsecret_proof once the app's "Require app secret" setting is enabled.
function withProof(pageAccessToken: string, params: Record<string, string>): Record<string, string> {
  const appSecret = process.env.META_APP_SECRET ?? "";
  return { ...params, appsecret_proof: appSecretProof(pageAccessToken, appSecret) };
}

// ---------------------------------------------------------------------------
// Facebook Page video publish — resumable upload API (POST /<PAGE_ID>/videos).
//
// Flow (single-chunk transfer; our reels are small enough for one shot):
//   1. upload_phase=start   → { upload_session_id, video_id }
//   2. upload_phase=transfer (whole file as one chunk) → { start_offset, end_offset }
//   3. upload_phase=finish   → { success: true }
//
// Privacy: Meta has no direct "private" video state via this API the way YouTube
// does. We approximate it with `published=false`, which uploads the video as an
// unpublished draft on the Page (visible only to Page admins) until the config's
// privacy is flipped to "public".
// ---------------------------------------------------------------------------

type StartResponse = { upload_session_id: string; video_id: string };
type TransferResponse = { start_offset: string; end_offset: string };
type FinishResponse = { success: boolean };

export type FacebookConfig = { enabled: boolean; privacy: "draft" | "public" };

export type FacebookDeps = {
  loadConfig: () => FacebookConfig;
  getCredentials: () => Promise<{ pageId: string; pageAccessToken: string }>;
  fetchImpl: typeof fetch;
  readFile: (path: string) => Buffer;
  fileSize: (path: string) => number;
};

// ---------------------------------------------------------------------------
// Pure result shaper
// ---------------------------------------------------------------------------

export function shapeFacebookResult(videoId: string, privacy: string): AdapterResult {
  return {
    platform: "facebook",
    kind: "api",
    status: "published",
    id: videoId,
    url: `https://www.facebook.com/watch/?v=${videoId}`,
    privacy,
  };
}

// ---------------------------------------------------------------------------
// Friendly error hints for known Meta Graph API error codes
// ---------------------------------------------------------------------------

function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('"code":190') || msg.includes("Error validating access token")) {
    return `${msg} — Meta token invalid or expired — run bun run publish:auth meta`;
  }
  if (msg.includes('"code":100')) {
    return `${msg} — bad parameter — check the request body summary above`;
  }
  if (msg.includes("No Meta credentials found")) {
    return msg;
  }
  return msg;
}

// ---------------------------------------------------------------------------
// Network steps
// ---------------------------------------------------------------------------

async function startUpload(
  fetchImpl: typeof fetch,
  pageId: string,
  pageAccessToken: string,
  fileSizeBytes: number,
): Promise<StartResponse> {
  const params = new URLSearchParams(
    withProof(pageAccessToken, {
      upload_phase: "start",
      file_size: String(fileSizeBytes),
      access_token: pageAccessToken,
    }),
  );
  const resp = await fetchImpl(`${GRAPH_BASE}/${pageId}/videos?${params.toString()}`, { method: "POST" });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Facebook upload start failed: ${resp.status} — ${text}`);
  }
  return (await resp.json()) as StartResponse;
}

async function transferChunk(
  fetchImpl: typeof fetch,
  pageId: string,
  pageAccessToken: string,
  uploadSessionId: string,
  startOffset: string,
  bytes: Buffer,
): Promise<TransferResponse> {
  const form = new FormData();
  form.set("upload_phase", "transfer");
  form.set("start_offset", startOffset);
  form.set("upload_session_id", uploadSessionId);
  form.set("access_token", pageAccessToken);
  form.set("appsecret_proof", appSecretProof(pageAccessToken, process.env.META_APP_SECRET ?? ""));
  form.set("video_file_chunk", new Blob([new Uint8Array(bytes)]));

  const resp = await fetchImpl(`${GRAPH_BASE}/${pageId}/videos`, { method: "POST", body: form });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Facebook upload transfer failed: ${resp.status} — ${text}`);
  }
  return (await resp.json()) as TransferResponse;
}

async function finishUpload(
  fetchImpl: typeof fetch,
  pageId: string,
  pageAccessToken: string,
  uploadSessionId: string,
  title: string,
  description: string,
  published: boolean,
): Promise<FinishResponse> {
  const params = new URLSearchParams(
    withProof(pageAccessToken, {
      upload_phase: "finish",
      upload_session_id: uploadSessionId,
      access_token: pageAccessToken,
      title,
      description,
      published: String(published),
    }),
  );
  const resp = await fetchImpl(`${GRAPH_BASE}/${pageId}/videos?${params.toString()}`, { method: "POST" });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Facebook upload finish failed: ${resp.status} — ${text}`);
  }
  return (await resp.json()) as FinishResponse;
}

// ---------------------------------------------------------------------------
// Factory (dependency-injectable for testing)
// ---------------------------------------------------------------------------

export function makeFacebookAdapter(deps: FacebookDeps): PlatformAdapter {
  return {
    name: "facebook",
    kind: "api",

    async publish(pkg: RenderPackage, opts: PublishOpts): Promise<AdapterResult> {
      const cfg = deps.loadConfig();

      if (opts.dryRun) {
        return { platform: "facebook", kind: "api", status: "manual", message: "(dry-run)" };
      }

      try {
        const { pageId, pageAccessToken } = await deps.getCredentials();
        const fileSizeBytes = deps.fileSize(pkg.reelPath);
        const bytes = deps.readFile(pkg.reelPath);

        const start = await startUpload(deps.fetchImpl, pageId, pageAccessToken, fileSizeBytes);
        await transferChunk(deps.fetchImpl, pageId, pageAccessToken, start.upload_session_id, "0", bytes);

        const hashtagStr = pkg.post.hashtags.map((t) => `#${t}`).join(" ");
        const description = `${pkg.post.caption}\n\n${hashtagStr}`;
        const published = cfg.privacy === "public";

        await finishUpload(
          deps.fetchImpl,
          pageId,
          pageAccessToken,
          start.upload_session_id,
          pkg.post.caption.split("\n")[0]?.trim() || pkg.post.post_id,
          description,
          published,
        );

        return shapeFacebookResult(start.video_id, cfg.privacy);
      } catch (err) {
        return { platform: "facebook", kind: "api", status: "failed", error: friendlyError(err) };
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Default export — wired to real implementations
// ---------------------------------------------------------------------------

export const facebookAdapter = makeFacebookAdapter({
  loadConfig: () => loadPublishConfig().facebook,
  getCredentials: () => getMetaCredentials(),
  fetchImpl: fetch,
  readFile: (p) => readFileSync(p),
  fileSize: (p) => statSync(p).size,
});
