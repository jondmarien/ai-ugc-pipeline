import { writeFileSync } from "node:fs";

export function writePostJson(postPath, post) {
  writeFileSync(postPath, `${JSON.stringify(post, null, 2)}\n`, "utf8");
}