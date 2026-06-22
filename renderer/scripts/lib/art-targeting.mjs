// Which slides get background generation (--only, --all, skip existing / locked assets).
//
// art-comfyui.mjs and art-higgsfield.mjs share this filter so pipeline dry-run matches art.
/** Parse `--only=1,2` into a Set of slide numbers, or null. */
export function parseOnlySlides(onlyArg) {
  if (!onlyArg) return null;
  const set = new Set(
    onlyArg
      .split(",")
      .map((x) => Number(x.trim()))
      .filter((n) => !Number.isNaN(n)),
  );
  return set.size ? set : null;
}

/**
 * Slides to (re)generate backgrounds for.
 * @param {object[]} slides
 * @param {{ onlySet: Set<number>|null, force: boolean, artExists: (s: object) => boolean }} opts
 */
export function selectArtSlides(slides, { onlySet, force, artExists }) {
  return slides.filter((s) => {
    if (s.asset_status === "existing") return false;
    if (onlySet) return onlySet.has(s.slide);
    return force || !artExists(s);
  });
}