// Post selection for bun run pipeline (multi-key, --status, --skip).
//
// Merges explicit substring keys with optional status batch, then applySkipTerms prunes
// fuzzy matches (case-insensitive substring on full post filename).
import { readFileSync } from "node:fs";
import path from "node:path";
import { allPostKeys, POSTS_DIR } from "./post-resolve.mjs";

export function expandKeysBySubstring(keys) {
  const selected = new Set();
  const all = allPostKeys();
  for (const k of keys) {
    const m = all.filter((fk) => fk.includes(k));
    if (!m.length) console.warn(`⚠ no post matches "${k}"`);
    m.forEach((fk) => selected.add(fk));
  }
  return selected;
}

export function filterByStatus(keys, status) {
  if (!status) return keys;
  const matched = keys.filter((fk) => {
    try {
      const post = JSON.parse(
        readFileSync(path.join(POSTS_DIR, `${fk}.json`), "utf8"),
      );
      return post.status === status;
    } catch {
      return false;
    }
  });
  return matched;
}

export function applySkipTerms(selectedSet, skipTerms) {
  const before = [...selectedSet];
  for (const term of skipTerms) {
    const hit = before.filter((fk) => fk.toLowerCase().includes(term));
    if (!hit.length) {
      console.warn(`⚠ --skip "${term}" matched no selected post`);
      continue;
    }
    hit.forEach((fk) => selectedSet.delete(fk));
    console.log(`⤬ skip "${term}" → ${hit.length} post(s): ${hit.join(", ")}`);
  }
}
