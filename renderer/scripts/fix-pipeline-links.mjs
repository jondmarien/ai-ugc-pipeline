// One-shot: repoint cross-folder Markdown links broken by the content/↔media/ reorg.
// Content-layer files linked from media/ get a ../content/ prefix and vice-versa.
// Same-folder links are left untouched. Idempotent (won't double-prefix).
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.argv[2] ?? ".");
const contentDir = path.join(ROOT, "pipeline", "content");
const mediaDir = path.join(ROOT, "pipeline", "media");

const CONTENT_FILES = ["CONTENT_PIPELINE", "IDEA_BACKLOG", "POST_TEMPLATE", "CAPTION_BANK", "VISUAL_PROMPT_BANK", "QA_CHECKLIST", "WEEK_1_POSTS", "README"];
const MEDIA_FILES = ["MEDIA_TOOL_STACK", "VOICEOVER_BAKEOFF", "BROLL_PROMPT_BANK", "MUSIC_SFX_GUIDE", "VIDEO_ASSEMBLY_WORKFLOW", "OPEN_SOURCE_EVALUATION_MATRIX", "WEEK_1_VIDEO_EXPERIMENTS"];

function fixDir(dir, targets, prefix) {
  let total = 0;
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".md"))) {
    const fp = path.join(dir, f);
    let txt = readFileSync(fp, "utf8");
    let n = 0;
    for (const name of targets) {
      // Match ](NAME.md) that is NOT already prefixed with a path.
      const re = new RegExp(`\\]\\((${name}\\.md)(#[^)]*)?\\)`, "g");
      txt = txt.replace(re, (_m, file, anchor = "") => {
        n++;
        return `](${prefix}${file}${anchor})`;
      });
    }
    if (n) {
      writeFileSync(fp, txt, "utf8");
      console.log(`  ${path.relative(ROOT, fp)}: ${n} link(s)`);
      total += n;
    }
  }
  return total;
}

console.log("Fixing content/ → media/ links:");
const a = fixDir(contentDir, MEDIA_FILES, "../media/");
console.log("Fixing media/ → content/ links:");
const b = fixDir(mediaDir, CONTENT_FILES, "../content/");
console.log(`\nTotal cross-folder links repointed: ${a + b}`);
