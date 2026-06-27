import type { PlatformAdapter, RenderPackage, AdapterResult, PublishOpts } from "../types";

export const instagramAdapter: PlatformAdapter = {
  name: "instagram",
  kind: "manual",

  async publish(pkg: RenderPackage, _opts: PublishOpts): Promise<AdapterResult> {
    const message = [
      "Manual upload to Instagram:",
      `  1) Open the render folder: ${pkg.dir}`,
      `  2) Post the reel: ${pkg.reelPath}`,
      `  3) Copy the caption from caption.txt (topics are already appended as a bracketed list)`,
      `  4) Paste the per-slide alt text from alt_text.txt if posting the carousel`,
      `  5) Tag location / collaborators if needed, then publish`,
    ].join("\n");

    return {
      platform: "instagram",
      kind: "manual",
      status: "manual",
      id: null,
      url: null,
      message,
    };
  },
};
