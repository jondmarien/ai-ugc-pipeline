// A resolved render package + the post data adapters need.
export type RenderPackage = {
  key: string; // e.g. "2026-06-11_bluehammer-cve-2026-33825"
  dir: string; // absolute path to pipeline/renders/<key>/
  reelPath: string; // absolute path to <key>_reel.mp4
  // carousel items in order, each with its alt text. `path` is always the poster/still PNG;
  // `videoPath` is set when this position is a real video clip (media_type: "video") and, when
  // present and the file exists, adapters should publish/upload the video instead of the PNG.
  slides: Array<{ path: string; altText: string; videoPath?: string }>;
  post: {
    post_id: string;
    caption: string;
    hashtags: string[];
    [k: string]: unknown;
  };
};

export type AdapterResult = {
  platform: string;
  kind: "api" | "manual";
  status: "published" | "manual" | "failed";
  id?: string | null;
  url?: string | null;
  privacy?: string;
  message?: string; // human-facing note (e.g. the manual checklist)
  error?: string;
};

export type PublishOpts = { dryRun?: boolean };

export interface PlatformAdapter {
  name: string; // "instagram" | "youtube" | "tiktok"
  kind: "api" | "manual";
  publish(pkg: RenderPackage, opts: PublishOpts): Promise<AdapterResult>;
}
