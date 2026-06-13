import { loadPost } from "./lib.ts";
import { checkCopyBudget, lintVisualPrompts } from "../src/lib/content-checks";

// Standalone validation: `npm run validate -- <post-key>`
const key = process.argv[2] ?? "2026-06-02_ai-phishing-training";
const post = loadPost(key);
console.log(`✓ ${post.post_id} valid — ${post.slides.length} slides, score ${post.score.total}/25, pillar ${post.pillar}`);
console.log(`  alt_text: ${post.alt_text.length}  sources: ${post.sources.length}  video.enabled: ${post.video?.enabled ?? false}`);

const copyWarn = checkCopyBudget(post);
const promptWarn = lintVisualPrompts(post);
if (copyWarn.length || promptWarn.length) {
  console.warn(`\n⚠ content advisories (${copyWarn.length + promptWarn.length}):`);
  for (const w of [...copyWarn, ...promptWarn]) console.warn(`   • ${w}`);
}
