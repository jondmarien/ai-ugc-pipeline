import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { POSTS_DIR } from "./lib.ts";
import { PostData } from "../src/lib/schema.ts";
import { pillarAccent, palette, canvas, themes, pillarTheme, type Pillar, type Theme } from "../src/design/tokens.ts";

// Usage: npm run new -- <YYYY-MM-DD> <slug> <pillar> [--captions=block|word|highlight]
// Generates a schema-valid BLANK post JSON you then fill in.
const rawArgs = process.argv.slice(2);
const flagArgs = rawArgs.filter((a) => a.startsWith("--"));
const [date, slug, pillarArg] = rawArgs.filter((a) => !a.startsWith("--"));

const CAPTION_MODES = ["block", "word", "highlight"] as const;
const captionsFlag = flagArgs.find((a) => a.startsWith("--captions="))?.split("=")[1] ?? "block";
const captionMode = (CAPTION_MODES as readonly string[]).includes(captionsFlag) ? captionsFlag : "block";

const VOICE_MODES = ["none", "voxcpm2", "voxcpm2-0.5b", "bark", "http", "file"] as const;
const MUSIC_MODES = ["none", "free", "licensed", "generated", "file"] as const;
const voiceFlag = flagArgs.find((a) => a.startsWith("--voice="))?.split("=")[1] ?? "none";
const musicFlag = flagArgs.find((a) => a.startsWith("--music="))?.split("=")[1] ?? "none";
const voiceMode = (VOICE_MODES as readonly string[]).includes(voiceFlag) ? voiceFlag : "none";
const musicMode = (MUSIC_MODES as readonly string[]).includes(musicFlag) ? musicFlag : "none";
const THEMES = ["offensive", "defensive", "hacking"] as const;
const themeFlag = flagArgs.find((a) => a.startsWith("--theme="))?.split("=")[1] ?? "";

const PILLARS = Object.keys(pillarAccent) as Pillar[];

function usageAndExit(msg?: string): never {
  if (msg) console.error(`\n✗ ${msg}`);
  console.error(`\nUsage: bun run new -- <YYYY-MM-DD> <slug> <pillar> [--theme=offensive|defensive|hacking] [--captions=…] [--voice=…] [--music=…]`);
  console.error(`  pillar ∈ ${PILLARS.join(" | ")}`);
  console.error(`  theme  ∈ offensive (red) | defensive (blue) | hacking (green)  — optional; defaults from pillar`);
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

const pillar = pillarArg as Pillar;
const prefix = `${date}_${slug}`;
// Brand theme: explicit --theme, else the pillar's default. Drives accent colour + image mood.
const theme = ((THEMES as readonly string[]).includes(themeFlag) ? themeFlag : pillarTheme[pillar]) as Theme;
const themeDef = themes[theme];

type Role =
  | "cover" | "context" | "risk" | "mechanism" | "failure_point" | "defense" | "takeaway" | "cta";

// Each slide ships with a rich, art-ready `vp` (visual_prompt) so `bun run art`
// has a specific scene per role out of the box (no deriving from copy). These are
// topic-agnostic archetypes — refine the bracketed bits for your exact post.
const accentName = themeDef.name;
const SLIDE_SPEC: Array<{ role: Role; kicker: string; copy: string; subline: string; vp: string; cta?: string; status?: string }> = [
  { role: "cover", kicker: "AI × CYBERSECURITY", copy: "YOUR COVER HOOK GOES HERE", subline: "One-line promise of what they'll learn.", cta: "SWIPE →", status: "needed",
    vp: `cinematic establishing shot for an AI-cybersecurity story about [the topic]: a dramatic central subject (analyst, SOC, AI agent, or device) in a dark high-contrast scene, ${accentName} rim light, strong empty lower-third for the headline` },
  { role: "context", kicker: "WHAT CHANGED", copy: "What happened, or the pattern to notice.", subline: "Keep it plain-language.",
    vp: `an abstract "what changed" scene for [the topic]: a shifting before/after pattern or emerging-signal motif, dark editorial, ${accentName} accent, no readable text` },
  { role: "risk", kicker: "WHY IT MATTERS", copy: "Why this matters to defenders.", subline: "Security impact, not hype.",
    vp: `a tension-building impact scene for [the topic]: a single focal hazard/stakes motif (a target, a breach path, a fragile control), dark and high-contrast, ${accentName} warning glow` },
  { role: "mechanism", kicker: "HOW IT WORKS", copy: "Safe, high-level mechanism.", subline: "No payloads or exploit steps.",
    vp: `a clean abstract diagrammatic scene showing the HIGH-LEVEL mechanism of [the topic] — glowing nodes and connections, a flow between abstract components; absolutely no exploit detail, payloads, or readable code; ${accentName} accent` },
  { role: "failure_point", kicker: "WHERE TEAMS FAIL", copy: "The people / process / tooling gap.", subline: "Where this slips through today.",
    vp: `a scene depicting a process/control gap for [the topic]: an overlooked checkpoint or skipped verification step, a person near an approve button with an ignored checklist, dark, ${accentName} accent` },
  { role: "defense", kicker: "DEFENSIVE MOVE", copy: "One concrete control or review step.", subline: "Something they can do this week.",
    vp: `a defensive control-room workflow scene for [the topic]: verification, permission gates, audit log, approval chain and identity-check icons, calm professional ${accentName} accent` },
  { role: "takeaway", kicker: "TAKEAWAY", copy: "One memorable, save-worthy line.", subline: "",
    vp: `a minimal iconic high-contrast scene for [the topic]: a single strong symbol (lock, shield, or verified checkmark) in deep negative space, dark gradient, subtle ${accentName} glow` },
  { role: "cta", kicker: "YOUR MOVE", copy: "A specific question for the comments?", subline: "Save this for your next review.", cta: "COMMENT + SAVE",
    vp: `a clean dark end-card scene with strong empty negative space for a question and handle, subtle ${accentName} glow, premium editorial cybersecurity look` },
];

const slides = SLIDE_SPEC.map((s, i) => ({
  slide: i + 1,
  role: s.role,
  kicker: s.kicker,
  on_slide_copy: s.copy,
  subline: s.subline,
  visual_direction: `cinematic, dark, one ${accentName} accent glow; text-free background; protected lower-third.`,
  // Rich per-slide art prompt — used directly by `bun run art`. Replace [the topic].
  visual_prompt: s.vp,
  background_asset: s.role === "cover" ? `/backgrounds/${prefix}_cover.png` : "",
  // cover uses 'needed' (swap to 'existing' once you add the PNG); inners are procedural CSS.
  asset_status: s.status ?? "procedural",
  cta: s.cta ?? "",
  notes: s.role === "cover" ? "Add a 1080×1350 text-free PNG to renderer/public/backgrounds/ then set asset_status to 'existing'." : "",
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
      ...slides.map((s) => {
        const role = s.role === "failure_point" ? "failure-point" : s.role;
        return `${prefix}_${String(s.slide).padStart(2, "0")}_${role}.png`;
      }),
      "caption.txt", "alt_text.txt", "sources.md", "render_qa_checklist.md",
    ],
    caption_file: "caption.txt",
    alt_text_file: "alt_text.txt",
    sources_file: "sources.md",
    licenses_file: "LICENSES.md",
  },
  slides,
  caption: "TODO: hook restated · what happened · why it matters · defender takeaway · question.\n\nFollow for AI security breakdowns without the fake panic.",
  hashtags: ["#Cybersecurity", "#InfoSec", "#AISecurity"],
  comment_prompt: "TODO: a specific, easy-to-answer question.",
  alt_text: SLIDE_SPEC.map((s, i) => `Slide ${i + 1} (${s.role}): TODO accessible description.`),
  sources: [
    { source: "TODO source name", link: "https://example.com", supports: "Which claim this supports.", confidence: "medium", claim_tag: "scenario" },
  ],
  asset_licenses: [],
  video: {
    enabled: true,
    duration_seconds: 26,
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
    narration: [
      { start: 0, end: 5, text: "TODO hook line." },
      { start: 5, end: 11, text: "TODO context line." },
      { start: 11, end: 17, text: "TODO defense line." },
      { start: 17, end: 22, text: "TODO takeaway line." },
      { start: 22, end: 26, text: "TODO CTA line." },
    ],
    beats: [
      { start: 0, end: 5, slide_ref: 1, purpose: "hook", motion: "slow push-in over cover", caption: "TODO hook caption." },
      { start: 5, end: 11, slide_ref: 2, purpose: "context", motion: "parallax", caption: "TODO context caption." },
      { start: 11, end: 17, slide_ref: 6, purpose: "defense", motion: "slow push-in", caption: "TODO defense caption." },
      { start: 17, end: 22, slide_ref: 7, purpose: "takeaway", motion: "static high contrast", caption: "TODO takeaway caption." },
      { start: 22, end: 26, slide_ref: 8, purpose: "cta", motion: "end card", caption: "TODO CTA caption." },
    ],
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
console.log(`  pillar: ${pillar}  ·  theme: ${theme} (${themeDef.name})  ·  8 slides  ·  reel enabled  ·  captions: ${captionMode}\n`);
console.log("Next:");
console.log(`  1. Edit the file — replace every TODO (copy, caption, sources, alt text).`);
console.log(`  2. (optional) Add a cover image to renderer/public/backgrounds/${prefix}_cover.png and set slide 1 asset_status to "existing".`);
console.log(`  3. npm run validate -- ${prefix}`);
console.log(`  4. npm run export -- ${prefix} && npm run package -- ${prefix} && npm run reel -- ${prefix}\n`);
