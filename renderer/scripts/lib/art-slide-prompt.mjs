// Shared per-slide background prompt assembly (ComfyUI + Higgsfield art scripts).
import { themes, pillarTheme, BRAND_STYLE } from "../../src/design/tokens.ts";

const ROLE_MOTIF = {
  context: "two diverging glowing streams of light over a dark grid, one clean direct path and one hidden shadowed path, contrast of a trusted versus an untrusted flow",
  risk: "untrusted signals fanning outward through the dark toward many small floating targets, thin glowing connection lines, a sense of spreading exposure",
  mechanism: "an abstract glowing core emitting outbound beams of light to a sequence of connected nodes lighting up one after another, an automated chain",
  failure_point: "a dark scene of glowing hazard hotspots and overlapping risk zones, tense highlights, a sense of an overlooked gap in the defenses",
  defense: "a layered protective shield wrapping an isolated sandbox, padlocks and permission gates, controlled gateways, calm and secure",
  takeaway: "translucent mask and glyph motifs glowing in the corners and along the edges, faint ambient circuitry and particle haze across the whole frame, the center kept calm and uncluttered (dark but not empty), minimal high-impact composition",
  cta: "a forward-motion arrow and a softly glowing question mark toward the upper area, sense of momentum inviting a swipe",
  point: "a single focal abstract object glowing in the dark with thin connecting light lines, clean high-contrast composition, one clear idea",
};

const TEXT_ZONE = {
  takeaway: "keep the central area calm and uncluttered (dark but not empty); arrange the focal elements in the corners and along the edges, with faint ambient detail elsewhere",
};
const DEFAULT_ZONE = "keep the lower portion of the frame dark, calm and uncluttered; place the focal elements in the upper third and around the edges";

function stripColor(s) {
  return s
    .replace(/\b(cyan|electric[- ]?blue|blue|red|teal|neon[- ]?green|green|amber|magenta|crimson|scarlet|azure|orange|purple|violet)\b/gi, "")
    .replace(/\b(accent|glow)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;])/g, "$1")
    .replace(/,(\s*,)+/g, ",")
    .trim();
}

export function buildSlidePrompt(slide, { accentHex, accentName, topic, mood, styleFusion }) {
  let subject;
  if (slide.visual_prompt?.trim()) {
    subject = slide.visual_prompt.trim();
  } else if (slide.visual_direction?.trim()) {
    subject = `dark cinematic cybersecurity illustration, ${stripColor(slide.visual_direction.trim())}`;
  } else {
    const motif = ROLE_MOTIF[slide.role] || "abstract flowing data network, nodes and light trails";
    const themed = topic ? `${motif}, evoking the theme of ${topic}` : motif;
    subject = `dark cinematic cybersecurity illustration, ${themed}`;
  }
  const zone = TEXT_ZONE[slide.role] || DEFAULT_ZONE;
  const SIGNAGE = /\b(alert|warning|danger|caution|breach|threat|notice)\b/gi;
  const cleanAccent = (accentName || "").replace(SIGNAGE, "").replace(/\s{2,}/g, " ").trim() || "red";
  const cleanMood = mood
    ? mood
        .replace(SIGNAGE, "")
        .replace(/\s{2,}/g, " ")
        .replace(/\s+([,.;—-])/g, "$1")
        .replace(/,\s*,/g, ",")
        .trim()
    : "";
  const fused = styleFusion ? ` fused with ${stripColor(styleFusion).trim() || styleFusion.trim()}` : "";
  const styleTag = `Style: ${BRAND_STYLE}${fused}.${cleanMood ? ` Mood: ${cleanMood}.` : ""}`;
  return `${subject}. Lit by a single ${cleanAccent} (${accentHex}) accent glow against a deep navy void #05070d. ${zone}. ${styleTag}`;
}

export function postThemeContext(post) {
  const theme = post.theme || pillarTheme[post.pillar] || "defensive";
  const T = themes[theme] || themes.defensive;
  const topic = String(post.core_claim || post.slug || "")
    .replace(/["']/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 12)
    .join(" ");
  const postStyleFusion = String(post.style_fusion || "").trim();
  return {
    accentHex: T.accent,
    accentName: T.name,
    mood: T.mood,
    topic,
    postStyleFusion,
  };
}

export function postSeedOffset(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 90000;
}