// A resolved render package + the post data adapters need.
export type RenderPackage = {
  key: string;            // e.g. "2026-06-11_bluehammer-cve-2026-33825"
  dir: string;            // absolute path to pipeline/renders/<key>/
  reelPath: string;       // absolute path to <key>_reel.mp4
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
  message?: string;       // human-facing note (e.g. the manual checklist)
  error?: string;
};

export type PublishOpts = { dryRun?: boolean };

export interface PlatformAdapter {
  name: string;                 // "instagram" | "youtube" | "tiktok"
  kind: "api" | "manual";
  publish(pkg: RenderPackage, opts: PublishOpts): Promise<AdapterResult>;
}
