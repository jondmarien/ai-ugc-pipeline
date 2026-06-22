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