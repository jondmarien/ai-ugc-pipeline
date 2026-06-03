// bun run draft -- "<idea>" <pillar> [YYYY-MM-DD] [flags]
// Headless bridge: drives the `claude` CLI (with the repo's two skills) to turn an
// idea into a researched, sourced, schema-valid post JSON, then renders it.
//
// Flags:
//   --no-render     stop after the JSON is written + validated (don't export/package/reel)
//   --carousel-only render carousel + package, skip the reel
//   --yolo          run claude with --permission-mode bypassPermissions (fully unattended)
//   --dry-run       print the claude command that would run, then exit (no API calls)
//
// Requires: `claude` CLI on PATH and logged in. The skills live in ../.claude/skills.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RENDERER = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const REPO = path.resolve(RENDERER, "..");

const PILLARS = ["offensive_ai", "model_security", "data_leakage", "defensive_ai", "governance", "myth_busting"];

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith("--")));
const pos = argv.filter((a) => !a.startsWith("--"));
const idea = pos[0];
const pillar = pos[1];
const date = pos[2] && /^\d{4}-\d{2}-\d{2}$/.test(pos[2]) ? pos[2] : new Date().toISOString().slice(0, 10);
const MODES = ["block", "word", "highlight"];
const captionsFlag = [...flags].find((f) => f.startsWith("--captions="))?.split("=")[1] ?? "block";
const captions = MODES.includes(captionsFlag) ? captionsFlag : "block";
const VOICE = ["none", "voxcpm2", "voxcpm2-0.5b", "bark", "http", "file"];
const MUSIC = ["none", "free", "licensed", "generated", "file"];
const voiceFlag = [...flags].find((f) => f.startsWith("--voice="))?.split("=")[1] ?? "none";
const musicFlag = [...flags].find((f) => f.startsWith("--music="))?.split("=")[1] ?? "none";
const voice = VOICE.includes(voiceFlag) ? voiceFlag : "none";
const music = MUSIC.includes(musicFlag) ? musicFlag : "none";
const THEMES = ["blue", "red", "green"];
const themeFlag = [...flags].find((f) => f.startsWith("--theme="))?.split("=")[1] ?? "";
const theme = THEMES.includes(themeFlag) ? themeFlag : ""; // "" = let the agent pick from the topic

function die(msg) {
  if (msg) console.error(`\n✗ ${msg}`);
  console.error(`\nUsage:\n  bun run draft -- "<idea>" <pillar> [YYYY-MM-DD] [flags]\n`);
  console.error(`Pillars (pick one for <pillar>):`);
  for (const p of PILLARS) console.error(`  • ${p}`);
  console.error(`\nFlags:`);
  console.error(`  --theme=blue|red|green                 brand theme (blue=defensive, red=offensive/vuln, green=hacking; default from pillar)`);
  console.error(`  --captions=block|word|highlight        reel subtitle animation (default block)`);
  console.error(`  --voice=none|voxcpm2|voxcpm2-0.5b|bark|http|file   narration (default none)`);
  console.error(`  --music=none|free|licensed|generated|file          music bed (default none)`);
  console.error(`  --carousel-only | --no-render | --yolo | --dry-run`);
  console.error(`\nExample:`);
  console.error(`  bun run draft -- "AI agents leaking RAG data through tool calls" model_security --voice=voxcpm2 --captions=highlight\n`);
  process.exit(1);
}

if (!idea) die("Missing <idea>.");
if (!pillar || !PILLARS.includes(pillar)) die(`Missing/invalid <pillar>: "${pillar ?? ""}".`);

// Resolve `claude` on PATH up front for a clear error.
const claudeCheck = spawnSync(process.platform === "win32" ? "where" : "which", ["claude"], { encoding: "utf8" });
if (claudeCheck.status !== 0) die("`claude` CLI not found on PATH. Install Claude Code, or use the interactive /draft-post command.");

const renderStep = flags.has("--no-render")
  ? "Do NOT render — stop after validate."
  : flags.has("--carousel-only")
    ? `Then render the carousel only: \`cd renderer && bun run pipeline -- ${date}_<slug> --no-voice --no-reel\` (backgrounds → carousel → package; needs ComfyUI running for AI art, else falls back to procedural).`
    : `Then run the FULL pipeline in one command: \`cd renderer && bun run pipeline -- ${date}_<slug>\` — backgrounds (ComfyUI) → carousel → package → free GPU → voice → synced captions → reel WITH audio. (Start ComfyUI first for AI backgrounds; the reel auto-embeds the voice.)`;

// The prompt mirrors the /draft-post command. Keeping it inline lets this run headless.
const prompt = [
  `Use the repo skills "ai-cybersecurity-ugc-carousel" and "react-remotion-instagram-renderer" to produce ONE complete AI-in-cybersecurity post, end to end.`,
  ``,
  `Idea: ${idea}`,
  `Pillar: ${pillar}`,
  `Date: ${date}`,
  ``,
  `HARD RULES (from pipeline/content/QA_CHECKLIST.md): no fabricated CVEs/stats/quotes; every factual claim must be backed by a real source found via WebSearch/WebFetch, or explicitly framed as a [Scenario]; no payloads/exploit/evasion steps; include a concrete defender takeaway.`,
  ``,
  `STEPS:`,
  `1. Design the 8-slide post (cover, context, risk, mechanism, failure_point, defense, takeaway, cta) + caption + hashtags + comment question, house voice.`,
  `2. Research sources with WebSearch/WebFetch; record {source, link, supports, confidence, claim_tag} for each factual claim.`,
  `3. Pick a short kebab-case slug from the idea.`,
  `4. Pick a brand THEME for this post — blue (defensive / blue-team / securing AI), red (offensive / red-team / vulnerabilities / exploits / CVEs), or green (general hacking / how-it-works)${theme ? ` — use "${theme}"` : ", based on the topic"}. Run \`cd renderer && bun run new -- ${date} <slug> ${pillar} --theme=${theme || "<theme>"} --captions=${captions} --voice=${voice} --music=${music}\` to scaffold, then EDIT renderer/content/posts/${date}_<slug>.json to replace EVERY TODO with real, sourced content. Keep schema rules (8 slides, slide1=cover, alt_text length 8, score.total = sum of axes, >=1 real source, reel beats filled, video.caption_mode="${captions}", video.audio.voice_mode="${voice}", video.audio.music_mode="${music}"). Write a SPECIFIC, text-free visual_prompt for EVERY slide, tied to this exact topic (a concrete dark cinematic cybersecurity scene per slide; no rendered text/logos/exploit detail) so \`bun run art\` produces rich, on-topic imagery.`,
  `5. Run \`cd renderer && bun run validate -- ${date}_<slug>\` and fix until clean.`,
  `6. ${renderStep}`,
  `7. FINISH by printing, on its own final line, exactly: POST_KEY=${date}_<slug>`,
].join("\n");

const allowed = "Skill WebSearch WebFetch Read Write Edit Glob Grep Bash";
const permMode = flags.has("--yolo") ? "bypassPermissions" : "acceptEdits";
const claudeArgs = ["-p", prompt, "--permission-mode", permMode, "--allowedTools", allowed, "--add-dir", REPO];

if (flags.has("--dry-run")) {
  console.log("DRY RUN — would execute from", REPO, ":\n");
  console.log("claude \\");
  console.log(`  -p <prompt: ${prompt.length} chars> \\`);
  console.log(`  --permission-mode ${permMode} \\`);
  console.log(`  --allowedTools "${allowed}" \\`);
  console.log(`  --add-dir "${REPO}"`);
  console.log("\n--- prompt preview ---\n" + prompt + "\n--- end ---");
  process.exit(0);
}

console.log(`Drafting "${idea}" (${pillar}, ${date}) via claude + skills…\n`);
const run = spawnSync("claude", claudeArgs, { cwd: REPO, stdio: ["inherit", "pipe", "inherit"], encoding: "utf8", shell: process.platform === "win32" });

const out = run.stdout ?? "";
process.stdout.write(out);
if (run.status !== 0) {
  console.error(`\n✗ claude exited ${run.status}.`);
  process.exit(run.status ?? 1);
}

// Parse the POST_KEY the agent printed, and confirm the file exists.
const m = out.match(/POST_KEY=([0-9]{4}-[0-9]{2}-[0-9]{2}_[a-z0-9-]+)/);
if (!m) {
  console.error("\n⚠ Could not find POST_KEY in output. Check renderer/content/posts/ and render manually with bun run export/package/reel.");
  process.exit(2);
}
const key = m[1];
const jsonPath = path.join(RENDERER, "content", "posts", `${key}.json`);
if (!existsSync(jsonPath)) {
  console.error(`\n⚠ ${jsonPath} not found despite POST_KEY=${key}. Aborting render.`);
  process.exit(2);
}

console.log(`\n✓ Draft written + validated: ${key}`);
console.log(`  Review renderer/content/posts/${key}.json — confirm sources are real and claims are tagged before posting.`);
console.log(`  Rendered output (if not --no-render): pipeline/renders/${key}/`);
