/**
 * bun run validate -- <post-key> [--help]
 *
 * Zod schema validation (scripts/lib.ts loadPost) plus copy-budget and visual_prompt
 * advisories. Does not render. Use before approving a draft or after hand-editing JSON.
 */

import {
  checkCopyBudget,
  checkSlideCaptions,
  lintVisualPrompts,
} from "../src/lib/content-checks";
import { multipleCaptionsEnabled } from "../src/lib/schema.ts";
import { loadPost } from "./lib.ts";

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log(`
bun run validate — schema + content lint for one post

USAGE
  bun run validate -- <post-key>

  <post-key>   slug or substring (default demo key if omitted)

CHECKS
  - PostData schema (required fields, enums)
  - on_slide_copy word budgets
  - visual_prompt lint (text-summoning nouns, etc.)
  - slide_captions advisories (count vs slides, empty, ~2200-char IG cap) when features.multiple_captions is on

EXAMPLES
  bun run validate -- my-post
`);
  process.exit(0);
}

const key =
  args.find((a) => !a.startsWith("--")) ?? "2026-06-02_ai-phishing-training";
const post = loadPost(key);
console.log(
  `✓ ${post.post_id} valid — ${post.slides.length} slides, score ${post.score.total}/25, pillar ${post.pillar}`,
);
console.log(
  `  alt_text: ${post.alt_text.length}  sources: ${post.sources.length}  video.enabled: ${post.video?.enabled ?? false}`,
);
if (multipleCaptionsEnabled(post)) {
  console.log(
    `  features.multiple_captions: true  slide_captions: ${post.slide_captions?.length ?? 0}`,
  );
}

const copyWarn = checkCopyBudget(post);
const promptWarn = lintVisualPrompts(post);
const slideCaptionWarn = checkSlideCaptions(post);
if (copyWarn.length || promptWarn.length || slideCaptionWarn.length) {
  console.warn(
    `\n⚠ content advisories (${copyWarn.length + promptWarn.length + slideCaptionWarn.length}):`,
  );
  for (const w of [...copyWarn, ...promptWarn, ...slideCaptionWarn])
    console.warn(`   • ${w}`);
}
