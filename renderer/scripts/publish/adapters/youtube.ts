import { readFileSync } from "node:fs";
import type { PlatformAdapter, RenderPackage, AdapterResult, PublishOpts } from "../types";
import { youtubeMetadata } from "../metadata";
import { loadPublishConfig } from "../config";
import { getAccessToken } from "../auth/oauth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type YoutubeInsertResponse = {
  id: string;
  snippet?: Record<string, unknown>;
  status?: Record<string, unknown>;
};

export type YoutubeDeps = {
  loadConfig: () => { enabled: boolean; privacy: string; categoryId: string };
  getToken: () => Promise<string>;
  upload: (
    token: string,
    metadata: object,
    filePath: string,
  ) => Promise<YoutubeInsertResponse>;
};

// ---------------------------------------------------------------------------
// Pure result shaper
// ---------------------------------------------------------------------------

export function shapeYoutubeResult(
  resp: YoutubeInsertResponse,
  privacy: string,
): AdapterResult {
  return {
    platform: "youtube",
    kind: "api",
    status: "published",
    id: resp.id,
    url: `https://youtu.be/${resp.id}`,
    privacy,
  };
}

// ---------------------------------------------------------------------------
// Friendly error hints for known YouTube API error codes
// ---------------------------------------------------------------------------

function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("quotaExceeded") || msg.includes("quota")) {
    return `${msg} — YouTube daily upload quota exceeded (resets midnight PT)`;
  }
  if (msg.includes("401") || msg.includes("invalid_grant")) {
    return `${msg} — auth expired — run bun run publish:auth youtube`;
  }
  return msg;
}

// ---------------------------------------------------------------------------
// Real resumable-upload implementation (2-step: POST session → PUT bytes)
// ---------------------------------------------------------------------------

export async function resumableUpload(
  token: string,
  metadata: object,
  filePath: string,
  fetchImpl: typeof fetch = fetch,
): Promise<YoutubeInsertResponse> {
  // Step 1: Initiate the resumable session
  const initResp = await fetchImpl(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Upload-Content-Type": "video/*",
      },
      body: JSON.stringify(metadata),
    },
  );

  if (!initResp.ok) {
    const text = await initResp.text();
    throw new Error(
      `YouTube resumable init failed: ${initResp.status} ${initResp.statusText} — ${text}`,
    );
  }

  const location = initResp.headers.get("location");
  if (!location) {
    throw new Error("YouTube resumable init returned no Location header");
  }

  // Step 2: Upload the file bytes
  const fileBytes = readFileSync(filePath);

  const uploadResp = await fetchImpl(location, {
    method: "PUT",
    headers: {
      "Content-Type": "video/*",
    },
    body: fileBytes,
  });

  if (!uploadResp.ok) {
    const text = await uploadResp.text();
    throw new Error(
      `YouTube resumable upload failed: ${uploadResp.status} ${uploadResp.statusText} — ${text}`,
    );
  }

  return (await uploadResp.json()) as YoutubeInsertResponse;
}

// ---------------------------------------------------------------------------
// Factory (dependency-injectable for testing)
// ---------------------------------------------------------------------------

export function makeYoutubeAdapter(deps: YoutubeDeps): PlatformAdapter {
  return {
    name: "youtube",
    kind: "api",

    async publish(pkg: RenderPackage, opts: PublishOpts): Promise<AdapterResult> {
      const cfg = deps.loadConfig();

      // Dry-run: no upload
      if (opts.dryRun) {
        return {
          platform: "youtube",
          kind: "api",
          status: "manual",
          message: "(dry-run)",
        };
      }

      try {
        const metadata = youtubeMetadata(pkg.post, {
          privacy: cfg.privacy,
          categoryId: cfg.categoryId,
        });

        const token = await deps.getToken();
        const resp = await deps.upload(token, metadata, pkg.reelPath);

        return shapeYoutubeResult(resp, cfg.privacy);
      } catch (err) {
        return {
          platform: "youtube",
          kind: "api",
          status: "failed",
          error: friendlyError(err),
        };
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Default export — wired to real implementations
// ---------------------------------------------------------------------------

export const youtubeAdapter = makeYoutubeAdapter({
  loadConfig: () => loadPublishConfig().youtube,
  getToken: () => getAccessToken("youtube"),
  upload: resumableUpload,
});
