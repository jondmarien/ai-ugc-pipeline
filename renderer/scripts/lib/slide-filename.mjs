// Background PNG basename: NN_role.png under public/backgrounds/<prefix>/.
//
// Must stay aligned with renderer/src/lib/schema.ts ROLE_FILENAME and export slide names.
// failure_point role maps to failure-point in filenames (historical Comfy output naming).
const ROLE_FILE = { failure_point: "failure-point" };

export function roleFileToken(role) {
  return ROLE_FILE[role] ?? role;
}

/** @param {{ slide: number, role: string }} slide */
export function backgroundFileName(slide) {
  const nn = String(slide.slide).padStart(2, "0");
  const role = roleFileToken(slide.role);
  return `${nn}_${role}.png`;
}

/** Video clip basename: NN_role.mp4 under public/video/<prefix>/. Mirrors backgroundFileName. */
export function videoFileName(slide) {
  return backgroundFileName(slide).replace(/\.png$/, ".mp4");
}
