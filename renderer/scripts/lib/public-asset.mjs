// Check whether a slide's background_asset path exists under renderer/public.
//
// Used by pipeline (needsArt?), art-comfyui, art-higgsfield to skip slides that already
// have on-disk backgrounds. asset_status:"existing" is handled separately in art-targeting.
import { existsSync } from "node:fs";
import path from "node:path";
import { publicDir } from "./paths.mjs";

/** True when background_asset points at an on-disk file under renderer/public. */
export function slideBackgroundExists(rendererRoot, slide) {
  if (!slide?.background_asset) return false;
  const rel = slide.background_asset.replace(/^[/\\]+/, "");
  const root = rendererRoot ?? publicDir().replace(/[/\\]public$/, "");
  return existsSync(path.join(root, "public", rel));
}