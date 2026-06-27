import { readFileSync } from "node:fs";
import type { PlatformAdapter, RenderPackage, AdapterResult, PublishOpts } from "../types";
import { tiktokMetadata } from "../metadata";
import { loadPublishConfig } from "../config";
import { getAccessToken } from "../auth/oauth";

// ---------------------------------------------------------------------------
// TikTok Content Posting API — Direct Post of a reel video.
//
// Flow (all on https://open.tiktokapis.com):
//   1. POST /v2/post/publish/creator_info/query/   → allowed privacy levels + caps
//   2. pickPrivacy(creatorInfo, configured)         → chosen privacy_level (or throw)
//   3. POST /v2/post/publish/video/init/            → { publish_id, upload_url }
//        source_info FILE_UPLOAD, single chunk (chunk_size == video_size, total == 1)
//   4. PUT upload_url  (the reel bytes)             → MUST send Content-Range + Content-Type
//   5. POST /v2/post/publish/status/fetch/          → poll until PUBLISH_COMPLETE / FAILED
//
// All network is injected (fetchImpl) so the adapter is fixture-testable with no creds.
// ---------------------------------------------------------------------------

const TIKTOK_HOST = "https://open.tiktokapis.com";

// ---------------------------------------------------------------------------
// API response shapes (only the fields we read)
// ---------------------------------------------------------------------------

type TiktokEnvelope<T> = { data?: T; error?: { code?: string; message?: string; log_id?: string } };

type CreatorInfo = {
  privacy_level_options?: string[];
  comment_disabled?: boolean;
  duet_disabled?: boolean;
  stitch_disabled?: boolean;
};

type InitData = { publish_id?: string; upload_url?: string };

type StatusData = {
  status?: string;
  publicaly_available_post_id?: Array<number | string>; // TikTok's documented (misspelled) field
  publicly_available_post_id?: Array<number | string>;
};

export type TiktokConfig = {
  enabled: boolean;
  privacy: string;
  disableComment: boolean;
  disableDuet: boolean;
  disableStitch: boolean;
};

export type TiktokDeps = {
  loadConfig: () => TiktokConfig;
  getToken: () => Promise<string>;
  fetchImpl: typeof fetch;
  readFile: (path: string) => Uint8Array;
  pollIntervalMs?: number;
  maxPolls?: number;
};

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/**
 * Return `configured` if the creator's account permits it, else throw a clear
 * privacy-mismatch error. Unaudited apps only expose SELF_ONLY.
 */
export function pickPrivacy(creatorInfo: TiktokEnvelope<CreatorInfo>, configured: string): string {
  const opts = creatorInfo?.data?.privacy_level_options ?? [];
  if (!opts.includes(configured)) {
    throw new Error(
      `TikTok privacy mismatch: configured "${configured}" is not in the creator's allowed options [${opts.join(", ") || "none"}]. ` +
        `Unaudited apps can only post SELF_ONLY; set tiktok.privacy in publish.config.json accordingly.`,
    );
  }
  return configured;
}

/** Map a status/fetch response (+ the init publish_id and chosen privacy) to an AdapterResult. */
export function shapeTiktokResult(
  statusResp: TiktokEnvelope<StatusData>,
  privacy: string,
  publishId: string,
): AdapterResult {
  const data = statusResp?.data ?? {};
  const published = data.status === "PUBLISH_COMPLETE";
  const postId =
    (Array.isArray(data.publicaly_available_post_id) && data.publicaly_available_post_id[0]) ||
    (Array.isArray(data.publicly_available_post_id) && data.publicly_available_post_id[0]) ||
    null;
  return {
    platform: "tiktok",
    kind: "api",
    status: published ? "published" : "failed",
    id: publishId,
    // SELF_ONLY posts have no public URL; only set one when TikTok returns a public post id.
    url: postId != null ? `https://www.tiktok.com/video/${postId}` : null,
    privacy,
    ...(published ? {} : { error: `TikTok did not complete (status: ${data.status ?? "unknown"})` }),
  };
}

// ---------------------------------------------------------------------------
// Friendly error hints for known TikTok error codes
// ---------------------------------------------------------------------------

function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("unaudited_client_can_only_post_to_private_accounts")) {
    return `${msg} — the app is unaudited, so set tiktok.privacy to "SELF_ONLY" in publish.config.json until the Content Posting audit passes`;
  }
  if (msg.includes("scope_not_authorized")) {
    return `${msg} — re-run bun run publish:auth tiktok and grant the video.publish scope`;
  }
  if (msg.includes("access_token") || msg.includes("token")) {
    return `${msg} — token issue; re-run bun run publish:auth tiktok`;
  }
  return msg;
}

// ---------------------------------------------------------------------------
// Network steps (each throws on an HTTP error or a non-"ok" TikTok error code)
// ---------------------------------------------------------------------------

async function tiktokPost<T>(
  fetchImpl: typeof fetch,
  path: string,
  token: string,
  body: unknown,
): Promise<TiktokEnvelope<T>> {
  const resp = await fetchImpl(`${TIKTOK_HOST}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify(body),
  });
  const json = (await resp.json().catch(() => ({}))) as TiktokEnvelope<T>;
  if (!resp.ok) {
    throw new Error(`TikTok ${path} failed: ${resp.status} — ${json?.error?.code ?? ""} ${json?.error?.message ?? ""}`.trim());
  }
  const code = json?.error?.code;
  if (code && code !== "ok") {
    throw new Error(`TikTok ${path} error: ${code} — ${json?.error?.message ?? ""}`.trim());
  }
  return json;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Factory (dependency-injectable for testing)
// ---------------------------------------------------------------------------

export function makeTiktokAdapter(deps: TiktokDeps): PlatformAdapter {
  const pollIntervalMs = deps.pollIntervalMs ?? 3000;
  const maxPolls = deps.maxPolls ?? 20;

  return {
    name: "tiktok",
    kind: "api",

    async publish(pkg: RenderPackage, opts: PublishOpts): Promise<AdapterResult> {
      const cfg = deps.loadConfig();

      // Dry-run: touch nothing (no token, no network, no file read).
      if (opts.dryRun) {
        return { platform: "tiktok", kind: "api", status: "manual", message: "(dry-run)" };
      }

      try {
        const token = await deps.getToken();

        // 1. creator_info → allowed privacy levels
        const creatorInfo = await tiktokPost<CreatorInfo>(
          deps.fetchImpl,
          "/v2/post/publish/creator_info/query/",
          token,
          {},
        );

        // 2. resolve privacy (throws a clear error on mismatch)
        const privacy = pickPrivacy(creatorInfo, cfg.privacy);

        const meta = tiktokMetadata(pkg.post, {
          privacy,
          disableComment: cfg.disableComment,
          disableDuet: cfg.disableDuet,
          disableStitch: cfg.disableStitch,
        });

        // 3. init the upload (single-chunk FILE_UPLOAD)
        const bytes = deps.readFile(pkg.reelPath);
        const videoSize = bytes.byteLength;
        const init = await tiktokPost<InitData>(deps.fetchImpl, "/v2/post/publish/video/init/", token, {
          post_info: meta.post_info,
          source_info: {
            source: "FILE_UPLOAD",
            video_size: videoSize,
            chunk_size: videoSize,
            total_chunk_count: 1,
          },
        });
        const publishId = init.data?.publish_id;
        const uploadUrl = init.data?.upload_url;
        if (!publishId || !uploadUrl) {
          throw new Error("TikTok init returned no publish_id/upload_url");
        }

        // 4. PUT the bytes — Content-Range + Content-Type are REQUIRED or TikTok rejects the chunk
        const putResp = await deps.fetchImpl(uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Range": `bytes 0-${videoSize - 1}/${videoSize}`,
            "Content-Type": "video/mp4",
          },
          body: bytes,
        });
        if (!putResp.ok) {
          throw new Error(`TikTok chunk upload failed: ${putResp.status} ${putResp.statusText}`);
        }

        // 5. poll status until terminal
        let last: TiktokEnvelope<StatusData> = {};
        for (let i = 0; i < maxPolls; i++) {
          last = await tiktokPost<StatusData>(deps.fetchImpl, "/v2/post/publish/status/fetch/", token, {
            publish_id: publishId,
          });
          const s = last.data?.status;
          if (s === "PUBLISH_COMPLETE" || s === "FAILED") break;
          if (i < maxPolls - 1) await sleep(pollIntervalMs);
        }

        return shapeTiktokResult(last, privacy, publishId);
      } catch (err) {
        return { platform: "tiktok", kind: "api", status: "failed", error: friendlyError(err) };
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Default export — wired to real implementations
// ---------------------------------------------------------------------------

export const tiktokAdapter = makeTiktokAdapter({
  loadConfig: () => loadPublishConfig().tiktok,
  getToken: () => getAccessToken("tiktok"),
  fetchImpl: fetch,
  readFile: (p) => readFileSync(p),
});
