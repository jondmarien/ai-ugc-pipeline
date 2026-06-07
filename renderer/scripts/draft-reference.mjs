// bun run draft-context [N]
// Scans content/posts/*.json and prints a "variety digest" so the NEXT draft picks a
// DISTINCT cover hook, DISTINCT image-gen motifs, and a DIFFERENT defender takeaway/angle.
// The draft flow (interactive /draft-post and headless `bun run draft`) reads this and treats
// it as a NOT-list: do not reuse a recent hook opener, a recent visual object, or the same
// "it's all indirect prompt injection / this is unsafe" takeaway every single time.
//
// Pure read-only. N = how many most-recent posts to consider (default 12).
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RENDERER = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const POSTS = path.join(RENDERER, "content", "posts");

const argN = Number(process.argv.find((a) => /^\d+$/.test(a)));
const N = Number.isInteger(argN) && argN > 0 ? argN : 12;

const files = readdirSync(POSTS).filter((f) => f.endsWith(".json")).sort().reverse().slice(0, N);
const posts = files
  .map((f) => {
    try {
      return JSON.parse(readFileSync(path.join(POSTS, f), "utf8"));
    } catch {
      return null;
    }
  })
  .filter(Boolean);

const stripAccent = (s) => (s || "").replace(/\[\[|\]\]|\{\{|\}\}/g, "").trim();
const slideRole = (p, role) => (p.slides || []).find((s) => s.role === role);
const coverOf = (p) => (p.slides || [])[0]?.on_slide_copy || "";
const takeawayOf = (p) => stripAccent(slideRole(p, "takeaway")?.on_slide_copy || "");

// --- Visual motifs: the concrete objects each post's image prompts lean on. Drop the
// boilerplate scene words so only the distinctive nouns (padlock, mask, marionette…) surface.
const STOP = new Set(
  ("a an the of in on to into for and or but with at by from out off up down over under across toward towards beside between behind " +
    "single one its their this that no not as it is are was while then later left right side front back top " +
    "dark darkness cinematic editorial scene shot establishing dramatic rim light lights glow glowing lit " +
    "lower upper third area focal high contrast empty negative space calm quiet still soft strong faint thin " +
    "small large vast huge tall long wide deep clear clean orderly contained premium look composition headline " +
    "kept open center centre toward distance distant faraway away around outward inward both ways direction " +
    "text readable logos color colour cybersecurity story about people person figure hand")
    .split(/\s+/)
);
const nounsOf = (str) => ((str || "").toLowerCase().match(/[a-z][a-z-]{2,}/g) || []).filter((w) => !STOP.has(w));

const motif = new Map();
for (const p of posts) for (const s of p.slides || []) for (const w of nounsOf(s.visual_prompt)) motif.set(w, (motif.get(w) || 0) + 1);
const overusedMotifs = [...motif.entries()].filter(([, c]) => c >= 3).sort((a, b) => b[1] - a[1]).slice(0, 22);

// --- Cover-hook openers: the first two words tell you the hook FORMULA being reused.
const opener = (s) => stripAccent(s).split(/\s+/).slice(0, 2).join(" ").toUpperCase();
const openerCount = new Map();
for (const p of posts) {
  const o = opener(coverOf(p));
  if (o) openerCount.set(o, (openerCount.get(o) || 0) + 1);
}
const overusedOpeners = [...openerCount.entries()].filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]);

// --- Defender-takeaway ANGLES. The point of the post, not the topic. We want these to ROTATE.
const ANGLES = {
  "indirect prompt injection": /prompt[ -]?inject|injected instructions|steer(s|ed)? the agent|poisoned (?:page|doc)/i,
  "data exfiltration / leakage": /exfil|leak|data (?:moves|out|both ways)|drive ?mount/i,
  "credential & token scope": /credential|token|oauth|\bscope|api key|long-lived/i,
  "supply chain / dependency trust": /supply[ -]?chain|dependency|plugin|package|mcp server|skills? execute/i,
  "cost & resource abuse": /\bcost\b|crypto-?min|resource abuse|billable|gpu (?:abuse|bill)|cost-?bomb/i,
  "identity & authentication": /identity|authenticat|proof of identity|second channel|call ?back|code word|voice/i,
  "autonomy & blast radius": /blast radius|long-running|autonom|hundreds of turns|goal drift|run for hours/i,
  "auditability & logging": /\baudit|\blog(s|ging|ged)?\b|forensic|trail|read the (?:tool|stream)/i,
  "governance, approval & human-in-the-loop": /policy|governance|\bapprov|dual auth|human (?:in|review)|gate (?:it|what)/i,
  "least privilege / sandboxing": /least privilege|sandbox|isolat|scoped (?:key|account)|throwaway vm|disposable/i,
  "myth-busting the hype": /not (?:magic|theoretical|a step-change)|overhyped|\bhype\b|\bmyth|force multiplier|lower floor/i,
};
const angleHits = Object.fromEntries(Object.keys(ANGLES).map((k) => [k, []]));
for (const p of posts) {
  const blob = [p.core_claim, takeawayOf(p), p.caption].join("  ");
  for (const [k, re] of Object.entries(ANGLES)) if (re.test(blob)) angleHits[k].push(p.slug || p.post_id || "?");
}
const used = Object.entries(angleHits).filter(([, a]) => a.length).sort((a, b) => b[1].length - a[1].length);
const unused = Object.keys(ANGLES).filter((k) => angleHits[k].length === 0);
const overusedThreshold = Math.max(2, Math.ceil(posts.length * 0.4));

// ---------- print ----------
const L = [];
L.push(`# Draft variety digest — last ${posts.length} post(s)`);
L.push(`Use this as a NOT-list. The next post should NOT reuse these hooks, visual objects, or the same takeaway angle. Vary deliberately.`);
L.push("");
L.push(`## Recent posts (hook → takeaway → angle)`);
for (const p of posts) {
  L.push(`- [${p.pillar}/${p.theme}] ${p.slug}`);
  L.push(`    hook:     ${stripAccent(coverOf(p))}`);
  L.push(`    takeaway: ${takeawayOf(p)}`);
}
L.push("");
L.push(`## Overused cover-hook openers (pick a different opening move)`);
L.push(overusedOpeners.length ? overusedOpeners.map(([o, c]) => `  - "${o}…" ×${c}`).join("\n") : "  (none repeated yet)");
L.push(`  Hook formulas to rotate through: contradiction ("Everyone thinks X. Actually Y."), command ("Stop X. Start Y."), a number/stat, a named scenario ("Someone used AI to…"), a blunt question, a myth flip.`);
L.push("");
L.push(`## Overused visual motifs (do NOT build the new prompts from these — invent fresh objects)`);
L.push(overusedMotifs.length ? "  " + overusedMotifs.map(([w, c]) => `${w}×${c}`).join(", ") : "  (no motif used 3+ times yet)");
L.push("");
L.push(`## Defender-takeaway ANGLE coverage (rotate — not every AI-tool post is "indirect prompt injection / it's unsafe")`);
for (const [k, a] of used) {
  const flag = a.length >= overusedThreshold ? "  ⚠ OVERUSED, rotate away" : "";
  L.push(`  - ${k}: ${a.length}× (${a.join(", ")})${flag}`);
}
L.push("");
L.push(`## Angles NOT used recently (prefer one of these for the next post)`);
L.push(unused.length ? unused.map((k) => `  - ${k}`).join("\n") : "  (every tracked angle has been used recently — find a genuinely new one or a sharper sub-angle)");
L.push("");
L.push(`Rule of thumb: a reader scrolling your feed should not see the same hook shape, the same dark-padlock-and-key imagery, or the same "this is unsafe, use least privilege" ending on post after post. Same standards (sourced, defender takeaway), different surface every time.`);

console.log(L.join("\n"));
