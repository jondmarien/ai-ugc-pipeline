// Target list for bun run status (set-status.mjs).
//
// Combines --from=<current-status> (whole tier) with substring key args; de-dupes and sorts.
import { allPostJsonFiles } from "./post-resolve.mjs";
import { readStatus } from "./post-status.mjs";

/** Resolve post keys for `bun run status` (substring keys + optional --from tier). */
export function collectStatusTargets({ keyArgs = [], fromStatus = null }) {
  const all = allPostJsonFiles();
  let targets = [];
  if (fromStatus) {
    targets.push(...all.filter((f) => readStatus(f) === fromStatus));
  }
  for (const k of keyArgs) {
    const m = all.filter((f) => f.includes(k));
    if (!m.length) console.warn(`  ⚠ no post matches "${k}"`);
    targets.push(...m);
  }
  return [...new Set(targets)].map((f) => f.replace(/\.json$/, "")).sort();
}