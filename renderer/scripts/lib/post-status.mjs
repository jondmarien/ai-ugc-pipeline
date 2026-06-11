// Single source of truth for reading/writing a post's lifecycle `status`. Used by both
// scripts/set-status.mjs (the `bun run status` CLI) and scripts/pipeline.mjs (the auto-flip to
// `generated` after a complete run), so the write logic lives in exactly one place.
// Targeted single-line replace — never reformats the JSON. Keep STATUSES in sync with the enum
// in renderer/src/lib/schema.ts (lifecycle: draft → approved → generated → upload_ready).
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const LIB_DIR = path.dirname(fileURLToPath(import.meta.url)); // renderer/scripts/lib
export const POSTS = path.join(LIB_DIR, "..", "..", "content", "posts");
export const STATUSES = ["draft", "approved", "generated", "upload_ready"];
const STATUS_RE = /^(\s*)"status": "(?:draft|approved|generated|upload_ready)"/m;

export function listPosts() {
  return readdirSync(POSTS).filter((f) => f.endsWith(".json"));
}

const toFile = (key) => (key.endsWith(".json") ? key : `${key}.json`);

export function readStatus(key) {
  try {
    const m = readFileSync(path.join(POSTS, toFile(key)), "utf8").match(/"status": "(draft|approved|generated|upload_ready)"/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

// Set a single post's status. `onlyFrom` (array) gates the change to those current statuses, so
// the pipeline can flip draft/approved → generated without ever demoting a posted upload_ready.
// `dryRun` computes the transition without writing. Returns {key, old, new, changed, reason}.
export function setStatus(key, newStatus, { onlyFrom = null, dryRun = false } = {}) {
  const k = key.replace(/\.json$/, "");
  const fp = path.join(POSTS, `${k}.json`);
  if (!existsSync(fp)) return { key: k, changed: false, reason: "missing" };
  const s = readFileSync(fp, "utf8");
  const old = readStatus(k);
  if (onlyFrom && !onlyFrom.includes(old)) return { key: k, old, new: newStatus, changed: false, reason: "skipped" };
  if (old === newStatus) return { key: k, old, new: newStatus, changed: false, reason: "same" };
  if (!STATUS_RE.test(s)) return { key: k, old, changed: false, reason: "no-status-line" };
  if (!dryRun) writeFileSync(fp, s.replace(STATUS_RE, (_, ind) => `${ind}"status": "${newStatus}"`));
  return { key: k, old, new: newStatus, changed: true };
}
