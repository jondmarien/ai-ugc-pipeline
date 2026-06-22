// Background PNG naming: NN_role.png (matches import-bg, art-comfyui, schema ROLE_FILENAME).

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