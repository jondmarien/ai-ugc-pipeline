import { loadPost } from "./lib.ts";

// Standalone validation: `npm run validate -- <post-key>`
const key = process.argv[2] ?? "2026-06-02_ai-phishing-training";
const post = loadPost(key);
console.log(`✓ ${post.post_id} valid — ${post.slides.length} slides, score ${post.score.total}/25, pillar ${post.pillar}`);
console.log(`  alt_text: ${post.alt_text.length}  sources: ${post.sources.length}  video.enabled: ${post.video?.enabled ?? false}`);
