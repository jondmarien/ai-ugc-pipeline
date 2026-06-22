// Pretty-write post JSON after art/voice/import steps (2-space indent, trailing newline).
// Keeps formatting consistent across scripts that patch slides in memory.
import { writeFileSync } from "node:fs";

export function writePostJson(postPath, post) {
  writeFileSync(postPath, `${JSON.stringify(post, null, 2)}\n`, "utf8");
}