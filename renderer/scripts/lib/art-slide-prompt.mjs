// Shared per-slide background prompt assembly (ComfyUI + Higgsfield art scripts).
//
// Exports buildSlidePrompt(), postThemeContext(), postSeedOffset() — role motifs,
// pillar theme, brand style, text-safe zones. Keep in sync with content-checks visual lint.
import { BRAND_STYLE, pillarTheme, themes } from "../../src/design/tokens.ts";

const ROLE_MOTIF = {
  context:
    "two diverging glowing streams of light over a dark grid, one clean direct path and one hidden shadowed path, contrast of a trusted versus an untrusted flow",
  risk: "untrusted signals fanning outward through the dark toward many small floating targets, thin glowing connection lines, a sense of spreading exposure",
  mechanism:
    "an abstract glowing core emitting outbound beams of light to a sequence of connected nodes lighting up one after another, an automated chain",
  failure_point:
    "a dark scene of glowing hazard hotspots and overlapping risk zones, tense highlights, a sense of an overlooked gap in the defenses",
  defense:
    "a layered protective shield wrapping an isolated sandbox, padlocks and permission gates, controlled gateways, calm and secure",
  takeaway:
    "translucent mask and glyph motifs glowing in the corners and along the edges, faint ambient circuitry and particle haze across the whole frame, the center kept calm and uncluttered (dark but not empty), minimal high-impact composition",
  cta: "a forward-motion arrow and a softly glowing question mark toward the upper area, sense of momentum inviting a swipe",
  point:
    "a single focal abstract object glowing in the dark with thin connecting light lines, clean high-contrast composition, one clear idea",
};

const TEXT_ZONE = {
  takeaway:
    "keep the central area calm and uncluttered (dark but not empty); arrange the focal elements in the corners and along the edges, with faint ambient detail elsewhere",
};
const DEFAULT_ZONE =
  "keep the lower portion of the frame dark, calm and uncluttered; place the focal elements in the upper third and around the edges";

function stripColor(s) {
  return s
    .replace(
      /\b(cyan|electric[- ]?blue|blue|red|teal|neon[- ]?green|green|amber|magenta|crimson|scarlet|azure|orange|purple|violet)\b/gi,
      "",
    )
    .replace(/\b(accent|glow)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;])/g, "$1")
    .replace(/,(\s*,)+/g, ",")
    .trim();
}

// Structured, model-agnostic description of a slide background. Per-model composers (below) turn
// this into the concrete prompt string each model wants. Keeping one canonical spec means we adapt
// to a new model by adding a composer, not by re-authoring every prompt.
export function buildPromptSpec(
  slide,
  { accentHex, accentName, topic, mood, styleFusion },
) {
  let subject;
  if (slide.visual_prompt?.trim()) {
    subject = slide.visual_prompt.trim();
  } else if (slide.visual_direction?.trim()) {
    subject = `dark cinematic cybersecurity illustration, ${stripColor(slide.visual_direction.trim())}`;
  } else {
    const motif =
      ROLE_MOTIF[slide.role] ||
      "abstract flowing data network, nodes and light trails";
    const themed = topic ? `${motif}, evoking the theme of ${topic}` : motif;
    subject = `dark cinematic cybersecurity illustration, ${themed}`;
  }
  const zone = TEXT_ZONE[slide.role] || DEFAULT_ZONE;
  const SIGNAGE = /\b(alert|warning|danger|caution|breach|threat|notice)\b/gi;
  const accent =
    (accentName || "")
      .replace(SIGNAGE, "")
      .replace(/\s{2,}/g, " ")
      .trim() || "red";
  const cleanMood = mood
    ? mood
        .replace(SIGNAGE, "")
        .replace(/\s{2,}/g, " ")
        .replace(/\s+([,.;—-])/g, "$1")
        .replace(/,\s*,/g, ",")
        .trim()
    : "";
  const fusionClause = styleFusion
    ? ` fused with ${stripColor(styleFusion).trim() || styleFusion.trim()}`
    : "";
  return {
    subject,
    accent,
    accentHex,
    voidHex: "#05070d",
    zone,
    brandStyle: BRAND_STYLE,
    fusionClause,
    mood: cleanMood,
  };
}

// FLUX-family composer — the canonical house string (FLUX.2 [klein] local, fal flux, Higgsfield
// flux_2). This reproduces the historical buildSlidePrompt output byte-for-byte.
export function composeFluxPrompt(spec) {
  const styleTag = `Style: ${spec.brandStyle}${spec.fusionClause}.${spec.mood ? ` Mood: ${spec.mood}.` : ""}`;
  return `${spec.subject}. Lit by a single ${spec.accent} (${spec.accentHex}) accent glow against a deep navy void ${spec.voidHex}. ${spec.zone}. ${styleTag}`;
}

// NONE of the Higgsfield CLI image models accept a negative-prompt param, so we bake the critical
// exclusions into the POSITIVE prompt as plain language (modern models obey this far better than a
// folded SD-style "Avoid:" dump). This is also the fix for cover slides rendering hallucinated text
// "posters" — it forbids text/typography explicitly and up front.
const POSITIVE_EXCLUSIONS =
  "Pure abstract background imagery only: absolutely no text, no words, no letters, no numbers, no captions, no labels, no typography, no watermark, no logo, and no user-interface elements.";

function composeNaturalPrompt(spec) {
  // Natural-language models (Soul, Seedream, GPT-Image): drop the literal #hex (they read color
  // names) and lead with the exclusions so text suppression wins.
  const styleTag = `Style: ${spec.brandStyle}${spec.fusionClause}.${spec.mood ? ` Mood: ${spec.mood}.` : ""}`;
  return `${POSITIVE_EXCLUSIONS} ${spec.subject}. Lit by a single ${spec.accent} accent glow against a deep navy void. ${spec.zone}. ${styleTag}`;
}

// Prompt family per model. "flux" gets the rich house prose (our prompts are tuned for it); all
// families get the positive exclusions and an empty negative (no Higgsfield model supports one).
export const PROMPT_FAMILIES = Object.freeze([
  "flux",
  "soul",
  "seedream",
  "gpt",
]);

export function composePromptForFamily(spec, family) {
  const isNatural =
    family === "soul" || family === "seedream" || family === "gpt";
  const prompt = isNatural
    ? composeNaturalPrompt(spec)
    : `${composeFluxPrompt(spec)} ${POSITIVE_EXCLUSIONS}`;
  return { prompt, negative: "" };
}

// Back-compat: the historical entry point used by ComfyUI/FAL art, the MCP plan, and visual lint.
// Unchanged output (FLUX-family string).
export function buildSlidePrompt(slide, ctx) {
  return composeFluxPrompt(buildPromptSpec(slide, ctx));
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
