import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { POSTS_DIR } from "./lib.ts";
import { PostData, ROLE_FILENAME } from "../src/lib/schema.ts";
import { pillarAccent, palette, canvas, themes, pillarTheme, type Pillar, type Theme } from "../src/design/tokens.ts";

// Usage: npm run new -- <YYYY-MM-DD> <slug> <pillar> [--captions=block|word|highlight]
// Generates a schema-valid BLANK post JSON you then fill in.
const rawArgs = process.argv.slice(2);
const flagArgs = rawArgs.filter((a) => a.startsWith("--"));
const [date, slug, pillarArg] = rawArgs.filter((a) => !a.startsWith("--"));

const CAPTION_MODES = ["block", "word", "highlight"] as const;
const captionsFlag = flagArgs.find((a) => a.startsWith("--captions="))?.split("=")[1] ?? "highlight";
const captionMode = (CAPTION_MODES as readonly string[]).includes(captionsFlag) ? captionsFlag : "highlight";

const VOICE_MODES = ["none", "voxcpm2", "voxcpm2-0.5b", "bark", "http", "file"] as const;
const MUSIC_MODES = ["none", "free", "licensed", "generated", "file"] as const;
// Voice is ON by default (VoxCPM2 2B) — every post narrates unless you pass --voice=none (or --no-voice at render).
const voiceFlag = flagArgs.find((a) => a.startsWith("--voice="))?.split("=")[1] ?? "voxcpm2";
const musicFlag = flagArgs.find((a) => a.startsWith("--music="))?.split("=")[1] ?? "none";
const voiceMode = (VOICE_MODES as readonly string[]).includes(voiceFlag) ? voiceFlag : "voxcpm2";
const musicMode = (MUSIC_MODES as readonly string[]).includes(musicFlag) ? musicFlag : "none";
const THEMES = ["offensive", "defensive", "hacking", "purple-team", "ai"] as const;
const themeFlag = flagArgs.find((a) => a.startsWith("--theme="))?.split("=")[1] ?? "";
// Optional FLUX.2 style fusion for every background (a second aesthetic blended with the house
// style). Decided at creation, like theme/pillar. Free-form "X meets Y" string; empty = none.
const styleFusionFlag = flagArgs.find((a) => a.startsWith("--style-fusion="))?.split("=").slice(1).join("=").trim() ?? "";

// Dynamic slide count: --slides=N (default 8, range 3–20). Range is enforced here at
// creation time (not in the zod schema) so hand-authored posts for other platforms
// aren't blocked. The narrative arc scales via roleSequence() below.
const SLIDES_DEFAULT = 8, SLIDES_MIN = 3, SLIDES_MAX = 20;
const slidesFlag = flagArgs.find((a) => a.startsWith("--slides="))?.split("=")[1];
const slideCount = slidesFlag === undefined ? SLIDES_DEFAULT : Number(slidesFlag);

const PILLARS = Object.keys(pillarAccent) as Pillar[];

function usageAndExit(msg?: string): never {
  if (msg) console.error(`\n✗ ${msg}`);
  console.error(`\nUsage: bun run new -- <YYYY-MM-DD> <slug> <pillar> [--slides=N (3–20, default 8)] [--theme=offensive|defensive|hacking|purple-team|ai] [--style-fusion="ancient marble meets cyberpunk neon"] [--captions=…] [--voice=… (default voxcpm2; use none for a silent reel)] [--music=…]`);
  console.error(`  pillar ∈ ${PILLARS.join(" | ")}`);
  console.error(`  theme  ∈ offensive (red) | defensive (blue) | hacking (green) | purple-team (purple) | ai (generic AI, orange)  — optional; defaults from pillar`);
  console.error(`  example: bun run new -- 2026-06-13 ai-agent-permissions model_security --theme=defensive\n`);
  process.exit(1);
}

if (!date || !slug || !pillarArg) usageAndExit("Missing argument.");
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) usageAndExit(`date "${date}" must be YYYY-MM-DD.`);
if (!/^[a-z0-9-]+$/.test(slug)) usageAndExit(`slug "${slug}" must be lowercase kebab-case (a-z 0-9 -).`);
if (!PILLARS.includes(pillarArg as Pillar)) usageAndExit(`pillar "${pillarArg}" is not valid.`);
if (!(CAPTION_MODES as readonly string[]).includes(captionsFlag)) usageAndExit(`--captions "${captionsFlag}" must be one of: ${CAPTION_MODES.join(", ")}.`);
if (!(VOICE_MODES as readonly string[]).includes(voiceFlag)) usageAndExit(`--voice "${voiceFlag}" must be one of: ${VOICE_MODES.join(", ")}.`);
if (!(MUSIC_MODES as readonly string[]).includes(musicFlag)) usageAndExit(`--music "${musicFlag}" must be one of: ${MUSIC_MODES.join(", ")}.`);
if (themeFlag && !(THEMES as readonly string[]).includes(themeFlag)) usageAndExit(`--theme "${themeFlag}" must be one of: ${THEMES.join(", ")}.`);
if (slidesFlag !== undefined && (!Number.isInteger(slideCount) || slideCount < SLIDES_MIN || slideCount > SLIDES_MAX)) {
  usageAndExit(`--slides "${slidesFlag}" must be an integer in [${SLIDES_MIN}, ${SLIDES_MAX}] (default ${SLIDES_DEFAULT}).`);
}

const pillar = pillarArg as Pillar;
const prefix = `${date}_${slug}`;
// Brand theme: explicit --theme, else the pillar's default. Drives accent colour + image mood.
const theme = ((THEMES as readonly string[]).includes(themeFlag) ? themeFlag : pillarTheme[pillar]) as Theme;
const themeDef = themes[theme];

type Role =
  | "cover" | "context" | "risk" | "mechanism" | "failure_point" | "defense" | "takeaway" | "cta"
  // generic body slide used to scale beyond the named 8-arc (see roleSequence)
  | "point";

// Each role ships with a rich, art-ready `vp` (visual_prompt) so `bun run art`
// has a specific scene per role out of the box (no deriving from copy). These are
// topic-agnostic archetypes — refine the bracketed bits for your exact post.
// THEME-AGNOSTIC `vp` templates — NO colour words; the theme supplies the accent colour
// + mood at generation time (see art-comfyui.mjs). Tailor [the topic] + each scene per post.
// Avoid UI/dashboard/panel/label nouns (they make FLUX render garbled text).
const SLIDE_SPEC: Record<Role, { kicker: string; copy: string; subline: string; vp: string; cta?: string; status?: string }> = {
  cover: { kicker: "AI × CYBERSECURITY", copy: "YOUR COVER HOOK GOES HERE", subline: "One-line promise of what they'll learn.", cta: "SWIPE →", status: "needed",
    vp: `cinematic establishing shot for an AI-cybersecurity story about [the topic]: a dramatic central subject (analyst, SOC, AI agent, or device) in a dark high-contrast scene, dramatic rim light, strong empty lower-third for the headline` },
  context: { kicker: "WHAT CHANGED", copy: "What happened, or the pattern to notice.", subline: "Keep it plain-language.",
    vp: `an abstract "what changed" scene for [the topic]: a shifting before/after pattern or emerging-signal motif, dark editorial, lower third kept clear, no readable text` },
  risk: { kicker: "WHY IT MATTERS", copy: "Why this matters to defenders.", subline: "Security impact, not hype.",
    vp: `a tension-building impact scene for [the topic]: a single focal hazard/stakes motif (a target, a breach path, a fragile control), dark and high-contrast, tense atmosphere` },
  mechanism: { kicker: "HOW IT WORKS", copy: "Safe, high-level mechanism.", subline: "No payloads or exploit steps.",
    vp: `a clean abstract diagrammatic scene showing the HIGH-LEVEL mechanism of [the topic] — glowing nodes and connections, a flow between abstract components; absolutely no exploit detail, payloads, or readable code; dark, upper-area focus` },
  failure_point: { kicker: "WHERE TEAMS FAIL", copy: "The people / process / tooling gap.", subline: "Where this slips through today.",
    vp: `a scene depicting a process/control gap for [the topic]: an overlooked checkpoint or skipped verification step, a figure near an approve button with an ignored checklist, dark, lower third clear` },
  defense: { kicker: "DEFENSIVE MOVE", copy: "One concrete control or review step.", subline: "Something they can do this week.",
    vp: `a defensive workflow scene for [the topic]: verification, permission gates, an audit trail, approval chain and identity-check motifs, calm and orderly, dark` },
  takeaway: { kicker: "TAKEAWAY", copy: "One memorable, save-worthy line.", subline: "",
    vp: `a minimal iconic high-contrast scene for [the topic]: a single strong symbol (lock, shield, or verified checkmark) toward the edges in deep negative space, center open and dark` },
  cta: { kicker: "YOUR MOVE", copy: "A specific question for the comments?", subline: "Save this for your next review.", cta: "COMMENT + SAVE",
    vp: `a clean dark end-card scene with strong empty negative space for a question and handle, premium editorial cybersecurity look` },
  // Generic body slide — repeated to fill longer posts. Differentiated per-occurrence below.
  point: { kicker: "POINT", copy: "One more point worth making.", subline: "Keep it specific and concrete.",
    vp: `a distinct focal scene for one specific aspect of [the topic]: a single concrete physical object doing something physical, dark high-contrast cinematic, lower third kept clear, no readable text` },
};

// Map a slide count to an ordered list of roles. Fixed bookends (cover first;
// takeaway + cta last); the middle is filled from the named arc, then padded with
// the generic `point` role. n=8 reproduces the original arc exactly.
const NAMED_MIDDLE: Role[] = ["context", "risk", "mechanism", "failure_point", "defense"];
function roleSequence(n: number): Role[] {
  const seq: Role[] = ["cover"];
  const middleCount = n - 3; // slides between cover and [takeaway, cta]
  for (let i = 0; i < middleCount; i++) seq.push(NAMED_MIDDLE[i] ?? "point");
  seq.push("takeaway", "cta");
  return seq;
}

const sequence = roleSequence(slideCount);
let pointN = 0;
const slides = sequence.map((role, i) => {
  const s = SLIDE_SPEC[role];
  let kicker = s.kicker, copy = s.copy;
  if (role === "point") {
    pointN += 1;
    kicker = `POINT ${pointN}`;
    copy = `Body point ${pointN}: one idea, one line.`;
  }
  return {
    slide: i + 1,
    role,
    kicker,
    on_slide_copy: copy,
    subline: s.subline,
    visual_direction: "cinematic, dark, single accent glow; text-free background; protected lower-third.",
    // Rich per-slide art prompt — used directly by `bun run art`. Replace [the topic].
    visual_prompt: s.vp,
    background_asset: role === "cover" ? `/backgrounds/${prefix}_cover.png` : "",
    // cover uses 'needed' (swap to 'existing' once you add the PNG); inners are procedural CSS.
    asset_status: s.status ?? "procedural",
    cta: s.cta ?? "",
    notes: role === "cover" ? "Add a 1080×1350 text-free PNG to renderer/public/backgrounds/ then set asset_status to 'existing'." : "",
  };
});

// Reel = a short highlight, not every slide. Anchor a handful of beats to slides that
// always exist for this count (cover → context → defense → takeaway → cta), dedupe, and
// divide the duration evenly. At n=8 this yields the original 5 beats on slides 1,2,6,7,8.
const reelDuration = Math.round(slideCount * 3.25); // n=8 → 26s
const roleRef = (r: Role): number | null => {
  const idx = sequence.indexOf(r);
  return idx >= 0 ? idx + 1 : null;
};
const anchorPlan: Array<{ ref: number | null; purpose: string; motion: string }> = [
  { ref: 1, purpose: "hook", motion: "slow push-in over cover" },
  { ref: roleRef("context"), purpose: "context", motion: "parallax" },
  { ref: roleRef("defense"), purpose: "defense", motion: "slow push-in" },
  { ref: roleRef("takeaway"), purpose: "takeaway", motion: "static high contrast" },
  { ref: slideCount, purpose: "cta", motion: "end card" },
];
const seenRefs = new Set<number>();
const anchors = anchorPlan.filter((a): a is { ref: number; purpose: string; motion: string } => {
  if (a.ref == null || seenRefs.has(a.ref)) return false;
  seenRefs.add(a.ref);
  return true;
});
const beatBound = (i: number) => Math.round((i * reelDuration) / anchors.length);
const narration = anchors.map((a, i) => ({ start: beatBound(i), end: beatBound(i + 1), text: `TODO ${a.purpose} line.` }));
const beats = anchors.map((a, i) => ({
  start: beatBound(i),
  end: beatBound(i + 1),
  slide_ref: a.ref,
  purpose: a.purpose,
  motion: a.motion,
  caption: `TODO ${a.purpose} caption.`,
}));

const post = {
  post_id: prefix,
  date,
  slug,
  platform: "instagram",
  format: "carousel",
  status: "draft",
  pillar,
  theme,
  style_fusion: styleFusionFlag,
  audience: "security_practitioners",
  core_claim: "TODO: one-sentence claim this post makes.",
  claim_tags: ["scenario"],
  score: { credibility: 3, relevance: 3, novelty: 3, visual_drama: 3, defender_usefulness: 3, total: 15 },
  canvas: { width: canvas.carousel.width, height: canvas.carousel.height, safe_margin: canvas.carousel.safeMargin },
  brand: {
    handle: "@chron0s_cyb3r_w0rld.ai",
    accent_name: themeDef.name,
    pillar_accent: pillar,
    palette: { bg: palette.bg, fg: palette.fg, muted: palette.muted, accent: themeDef.accent, danger: palette.danger },
    font_stack: "Archivo, Inter, system-ui, sans-serif",
  },
  upload_package: {
    folder: `pipeline/renders/${prefix}`,
    filename_prefix: prefix,
    expected_files: [
      ...slides.map((s) => `${prefix}_${String(s.slide).padStart(2, "0")}_${ROLE_FILENAME[s.role]}.png`),
      "caption.txt", "alt_text.txt", "sources.md", "render_qa_checklist.md",
    ],
    caption_file: "caption.txt",
    alt_text_file: "alt_text.txt",
    sources_file: "sources.md",
    licenses_file: "LICENSES.md",
  },
  slides,
  caption: "TODO: hook restated · what happened · why it matters · defender takeaway · question.\n\nFollow for AI security breakdowns without the fake panic.",
  // Topics (NOT hashtags) — rendered as a bracketed list in caption.txt; no '#', no 5-tag cap.
  hashtags: ["AI security", "cybersecurity", "threat intel"],
  comment_prompt: "TODO: a specific, easy-to-answer question.",
  // Accessibility alt text: ONE entry per slide, in order. Lead with the slide's MESSAGE
  // (transcribe the on_slide_copy / claim that is rendered as text in the image — invisible to a
  // screen reader otherwise), then a short visual note. No "Slide N"/role/number prefix, no
  // "image of", no em-dashes. ~125-220 chars, meaning first. See QA_CHECKLIST alt-text gate.
  alt_text: slides.map((s) => `TODO ${s.role} alt text: restate this slide's message, then one brief clause of visual scene.`),
  sources: [
    { source: "TODO source name", link: "https://example.com", supports: "Which claim this supports.", confidence: "medium", claim_tag: "scenario" },
  ],
  asset_licenses: [],
  video: {
    enabled: true,
    duration_seconds: reelDuration,
    fps: 30,
    export_name: `${prefix}_reel.mp4`,
    caption_mode: captionMode,
    audio: {
      voice_mode: voiceMode,
      voice_file: voiceMode === "none" ? undefined : `/audio/${prefix}/voice.wav`,
      voice_gain_db: 0,
      music_mode: musicMode,
      music_file: musicMode === "none" ? undefined : `/audio/${prefix}/music.mp3`,
      music_gain_db: -18,
    },
    narration,
    beats,
    subtitle_style: "large centered lower-third, high contrast, two lines max",
    music: null,
    sfx: [],
    licenses: [],
  },
  qa: {
    fact_checked: false,
    sources_present: false,
    alt_text_count_matches_slides: true,
    no_exploit_steps: true,
    no_fake_cves_or_stats: true,
    defender_value_present: true,
    media_rights_logged: false,
    manual_review_required: true,
    render_checks_required: ["exact_resolution", "no_text_overflow", "safe_margins", "mobile_readability", "filename_order", "license_metadata"],
  },
};

// Guarantee the scaffold is schema-valid before writing.
const parsed = PostData.safeParse(post);
if (!parsed.success) {
  console.error("✗ Internal error: scaffold failed its own schema validation:");
  for (const issue of parsed.error.issues) console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  process.exit(1);
}

mkdirSync(POSTS_DIR, { recursive: true });
const outFile = path.join(POSTS_DIR, `${prefix}.json`);
if (existsSync(outFile)) usageAndExit(`${outFile} already exists — pick a different date/slug or delete it first.`);

writeFileSync(outFile, JSON.stringify(post, null, 2) + "\n", "utf8");

console.log(`✓ Created ${path.relative(path.join(POSTS_DIR, "..", ".."), outFile)}`);
console.log(`  pillar: ${pillar}  ·  theme: ${theme} (${themeDef.name})  ·  ${slideCount} slides  ·  reel enabled (${reelDuration}s)  ·  captions: ${captionMode}\n`);
console.log("Next:");
console.log(`  1. Edit the file — replace every TODO (copy, caption, sources, alt text).`);
console.log(`  2. (optional) Add a cover image to renderer/public/backgrounds/${prefix}_cover.png and set slide 1 asset_status to "existing".`);
console.log(`  3. npm run validate -- ${prefix}`);
console.log(`  4. npm run export -- ${prefix} && npm run package -- ${prefix} && npm run reel -- ${prefix}\n`);
