/**
 * bun run validate -- <post-key> [--help]
 *
 * Zod schema validation (scripts/lib.ts loadPost) plus copy-budget and visual_prompt
 * advisories. Does not render. Use before approving a draft or after hand-editing JSON.
 */
import { loadPost } from "./lib.ts";
import { checkCopyBudget, lintVisualPrompts } from "../src/lib/content-checks";

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

EXAMPLES
  bun run validate -- my-post
`);
  process.exit(0);
}

const key = args.find((a) => !a.startsWith("--")) ?? "2026-06-02_ai-phishing-training";
const post = loadPost(key);
console.log(`✓ ${post.post_id} valid — ${post.slides.length} slides, score ${post.score.total}/25, pillar ${post.pillar}`);
console.log(`  alt_text: ${post.alt_text.length}  sources: ${post.sources.length}  video.enabled: ${post.video?.enabled ?? false}`);

const copyWarn = checkCopyBudget(post);
const promptWarn = lintVisualPrompts(post);
if (copyWarn.length || promptWarn.length) {
  console.warn(`\n⚠ content advisories (${copyWarn.length + promptWarn.length}):`);
  for (const w of [...copyWarn, ...promptWarn]) console.warn(`   • ${w}`);
}