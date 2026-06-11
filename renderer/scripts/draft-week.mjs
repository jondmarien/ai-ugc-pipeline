// bun run draft-week -- "idea one" "idea two" ... (up to 5) [flags]
// Batch version of draft.mjs: drives the `claude` CLI (with the repo's skills) to
// produce up to 5 researched, sourced, schema-valid posts with pillar variety and
// sequential weekday dates, then renders each.
//
// Per-idea pillar/captions/style_fusion: append "::pillar", "::captions=word|highlight",
// and/or "::style_fusion=ancient marble meets cyberpunk neon"
//   e.g. "RAG data leaks::model_security::captions=highlight::style_fusion=blueprint etching meets studio photography"
// Flags: --no-render | --carousel-only | --yolo | --dry-run
//
// Requires the `claude` CLI on PATH and logged in.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RENDERER = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const REPO = path.resolve(RENDERER, "..");
const PILLARS = ["offensive_ai", "model_security", "data_leakage", "defensive_ai", "governance", "myth_busting"];
const MODES = ["block", "word", "highlight"];

// Variety digest (read-only): prior posts' hooks, image motifs, and takeaway angles, injected so
// the week varies against RECENT posts too, not just within itself.
const digest = (() => {
  const r = spawnSync("bun", [path.join("scripts", "draft-reference.mjs")], { cwd: RENDERER, encoding: "utf8", shell: process.platform === "win32" });
  return r.status === 0 && r.stdout ? r.stdout.trim() : "";
})();

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith("--")));
const ideas = argv.filter((a) => !a.startsWith("--")).slice(0, 5);

function die(msg) {
  console.error(`\n✗ ${msg}`);
  console.error(`\nUsage: bun run draft-week -- "idea one" "idea two" ... (up to 5) [--no-render|--carousel-only|--yolo|--dry-run]`);
  console.error(`  per-idea options: "idea::pillar::captions=word::style_fusion=X meets Y"`);
  console.error(`  pillars: ${PILLARS.join(" | ")}   ·   captions: ${MODES.join(" | ")}`);
  console.error(`  example: bun run draft-week -- "voice clone fraud::offensive_ai" "RAG leaks::model_security::captions=highlight" "shadow AI::governance"\n`);
  process.exit(1);
}

if (!ideas.length) die("Provide 1–5 ideas (quote each).");

const claudeCheck = spawnSync(process.platform === "win32" ? "where" : "which", ["claude"], { encoding: "utf8" });
if (claudeCheck.status !== 0) die("`claude` CLI not found on PATH. Use the interactive /draft-week command instead.");

// Parse each idea into {text, pillar?, captions?}.
const parsed = ideas.map((raw) => {
  const parts = raw.split("::").map((s) => s.trim());
  const text = parts[0];
  let pillar, captions, styleFusion;
  for (const p of parts.slice(1)) {
    if (PILLARS.includes(p)) pillar = p;
    else if (p.startsWith("captions=") && MODES.includes(p.split("=")[1])) captions = p.split("=")[1];
    else if (p.startsWith("style_fusion=")) styleFusion = p.slice("style_fusion=".length).trim();
  }
  return { text, pillar, captions: captions ?? "block", styleFusion: styleFusion ?? "" };
});

const renderLine = flags.has("--no-render")
  ? "Do NOT render — stop after each post validates."
  : flags.has("--carousel-only")
    ? "Then render each carousel + package (skip reels)."
    : "Then render each fully (export + package + reel).";

const list = parsed
  .map((p, i) => `  ${i + 1}. "${p.text}"  [pillar: ${p.pillar ?? "you choose — diversify"}; captions: ${p.captions}${p.styleFusion ? `; style_fusion: "${p.styleFusion}"` : ""}]`)
  .join("\n");

const prompt = [
  `Use the repo skills "ai-cybersecurity-ugc-carousel" and "react-remotion-instagram-renderer" to batch-draft a WEEK of AI-in-cybersecurity posts — one per idea below.`,
  ``,
  `Ideas (${parsed.length}):`,
  list,
  ``,
  `WEEK RULES: spread across different pillars (don't repeat); assign sequential weekday dates starting from \`date +%F\` (use Bash); sharpen overlapping angles so the week doesn't repeat. Also vary against RECENT posts using the VARIETY DIGEST below: rotate cover-hook formulas, image motifs, and defender-takeaway angles, and do not default every post to "indirect prompt injection / it's unsafe."`,
  `HARD RULES (from pipeline/content/QA_CHECKLIST.md): no fabricated CVEs/stats/quotes; back every factual claim with a real source via WebSearch/WebFetch, or tag it [Scenario]; each post needs a concrete defender takeaway. Offensive depth is OK on offensive-theme posts (real tools, techniques, tradecraft, educational + authorized-security framing), default high-level and go deep when it fits; never give turnkey instructions whose only purpose is indiscriminate harm. NO em-dashes anywhere (—/–) and NO sentence fragments; complete sentences with plain punctuation on every surface (caption, narration, on_slide_copy, subline, alt_text).`,
  digest ? `\nVARIETY DIGEST (NOT-list, do not reuse these recent hooks, motifs, or angles):\n${digest}\n` : ``,
  ``,
  `For EACH idea: design the 8-slide post + caption + hashtags + question; research sources; pick a kebab slug; run \`cd renderer && bun run new -- <date> <slug> <pillar> --captions=<mode>\` (add \`--style-fusion="<fusion>"\` when that idea lists a style_fusion); EDIT the JSON replacing every TODO with real sourced content (8 slides, slide1=cover, alt_text length 8, score.total = sum, >=1 source, reel beats filled, video.caption_mode set, and a SPECIFIC text-free visual_prompt per slide tied to that post's topic for \`bun run art\`, authored for FLUX.2 [klein] per pipeline/content/VISUAL_PROMPT_BANK.md (prose not tags, Subject+Action+Style+Context with the focal subject first, LEAD with DP-style lighting as klein's highest-impact lever, 30–80 words specific-not-long, NO colour words, type-free zones phrased positively), with fresh motifs per the VARIETY DIGEST); then run the humanizer, stop-slop, and professional-proofreader skills over caption/narration/on_slide_copy/subline/alt_text (house voice, no em-dashes, no fragments, complete sentences, never alter a sourced fact); \`bun run validate -- <date>_<slug>\` until clean. ${renderLine}`,
  ``,
  `FINISH by printing one line per post: POST_KEY=<date>_<slug>  — then a summary table (date | slug | pillar | caption_mode | fact/scenario | output folder).`,
].join("\n");

const allowed = "Skill WebSearch WebFetch Read Write Edit Glob Grep Bash";
const permMode = flags.has("--yolo") ? "bypassPermissions" : "acceptEdits";

if (flags.has("--dry-run")) {
  console.log("DRY RUN — would execute from", REPO, "\n");
  console.log(`claude -p <prompt: ${prompt.length} chars> --permission-mode ${permMode} --allowedTools "${allowed}" --add-dir "${REPO}"`);
  console.log("\n--- prompt preview ---\n" + prompt + "\n--- end ---");
  process.exit(0);
}

console.log(`Batch-drafting ${parsed.length} post(s) via claude + skills…\n`);
const run = spawnSync("claude", ["-p", prompt, "--permission-mode", permMode, "--allowedTools", allowed, "--add-dir", REPO], {
  cwd: REPO,
  stdio: ["inherit", "pipe", "inherit"],
  encoding: "utf8",
  shell: process.platform === "win32",
});
const out = run.stdout ?? "";
process.stdout.write(out);
if (run.status !== 0) { console.error(`\n✗ claude exited ${run.status}.`); process.exit(run.status ?? 1); }

const keys = [...out.matchAll(/POST_KEY=([0-9]{4}-[0-9]{2}-[0-9]{2}_[a-z0-9-]+)/g)].map((m) => m[1]);
const uniq = [...new Set(keys)];
if (!uniq.length) {
  console.error("\n⚠ No POST_KEY lines found. Check renderer/content/posts/ and render manually.");
  process.exit(2);
}
console.log(`\n✓ Drafted ${uniq.length} post(s):`);
for (const k of uniq) {
  const ok = existsSync(path.join(RENDERER, "content", "posts", `${k}.json`));
  console.log(`  ${ok ? "✓" : "⚠ missing JSON"}  ${k}  →  pipeline/renders/${k}/`);
}
console.log(`\nReview each post's sources before posting (no-fabrication rule). Reels ship without audio — narrate per renderer/docs/REMOTION_REEL_WORKFLOW.md.`);
