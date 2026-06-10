// Design tokens derived from pipeline/content/VISUAL_PROMPT_BANK.md and the
// react-remotion-instagram-renderer skill. The principles (dark cinematic
// editorial, one accent per pillar, disciplined hierarchy) are embedded here
// directly — no dependency on external design skills.

export type Pillar =
  | "offensive_ai"
  | "model_security"
  | "data_leakage"
  | "defensive_ai"
  | "governance"
  | "myth_busting";

export const palette = {
  bg: "#05070d",
  bgDeep: "#02030a",
  panel: "rgba(2, 6, 23, 0.78)",
  fg: "#f8fafc",
  muted: "#94a3b8",
  hairline: "rgba(148, 163, 184, 0.18)",
  danger: "#ef4444",
} as const;

// One accent glow per pillar (matches VISUAL_PROMPT_BANK.md convention).
export const pillarAccent: Record<Pillar, { name: string; accent: string; accent2?: string }> = {
  offensive_ai: { name: "cyan", accent: "#22d3ee" },
  model_security: { name: "electric blue", accent: "#3b82f6" },
  data_leakage: { name: "neon green", accent: "#39ff88" },
  defensive_ai: { name: "cool teal", accent: "#2dd4bf" },
  governance: { name: "amber", accent: "#f59e0b" },
  myth_busting: { name: "red-to-blue split", accent: "#ef4444", accent2: "#3b82f6" },
};

export const canvas = {
  carousel: { width: 1080, height: 1350, safeMargin: 96 },
  reel: { width: 1080, height: 1920, safeMargin: 96 },
} as const;

export const fonts = {
  headline: '"Archivo", system-ui, sans-serif',
  body: '"Inter", system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
} as const;

// Type scale (px) tuned for a 1080-wide canvas and thumbnail legibility.
export const type = {
  kicker: 26,
  coverHeadline: 104,
  headline: 76,
  subline: 40,
  body: 36,
  meta: 24,
  cta: 34,
} as const;

export const radius = { panel: 28 } as const;

// Layout no-go zones + the text-block budget, so the overlay copy can never cover the whole
// frame or collide with the header. headerBand = reserved strip below the safe margin for the
// handle + pagination (the text column starts below it). textMaxFrac = the tallest the text
// column may grow, as a fraction of canvas height; the rest of the top is GUARANTEED background.
export const layout = {
  headerBand: 64,      // px reserved under the top safe margin for handle + NN/NN
  textMaxFrac: 0.6,    // text column caps at 60% of canvas height → top ~40% always shows art
} as const;

// Length-based headline auto-fit: long hooks (the dragged-hook covers especially) shrink to fit
// the bounded text block instead of overflowing it. Deterministic by character count, no measure
// pass. `base` is the slide's normal size; the result never exceeds base.
export function fitHeadline(text: string, base: number, bump = 0): number {
  const n = (text ?? "").replace(/\[\[|\]\]|\{\{|\}\}/g, "").length; // ignore accent markers
  const size = n <= 30 ? 104 : n <= 55 ? 84 : n <= 80 ? 68 : n <= 110 ? 58 : 50;
  // `bump` lifts every length tier (used by the takeaway so it reads a step larger than body
  // slides at the same length); still never exceeds `base`.
  return Math.min(base, size + bump);
}

// Readability scrims layered between the (AI-generated) background and the text.
// Strategy: light AMBIENT grounding in SlideBackground (edges/vignette) + a strong
// CONTENT-HUGGING plate behind the actual text block in CarouselSlide. The plate moves
// with the text (bottom-aligned or centered) and is feathered (radial → transparent at
// the edges) so it reads as editorial darkening, never a hard rectangle.
export const overlays = {
  // Ambient grounding in SlideBackground (kept light — the text plate does the real work).
  topVignette: "linear-gradient(0deg, transparent 0%, rgba(2,3,10,0.62) 100%)",
  topHeight: "24%",
  ambientBottom: "linear-gradient(180deg, transparent 28%, rgba(2,3,10,0.30) 64%, rgba(2,3,10,0.62) 100%)",
  // Full-frame blur over the whole background — keep this 0 so the AI art stays crisp.
  // (It's a backdrop-filter on an inset:0 layer, so any value > 0 softens the ENTIRE image,
  // not just the gradient. Text legibility is handled locally by the text plate below.)
  ambientBlurPx: 0,
  // Content-hugging text plate (the primary legibility layer). Translucent + blurred,
  // so the background image still reads (softly) through it; densest over the text and
  // fading to transparent at the edges. The blur — not opacity — carries legibility.
  textPlate: "radial-gradient(125% 135% at 50% 50%, rgba(2,3,10,0.66) 0%, rgba(2,3,10,0.54) 48%, rgba(2,3,10,0.24) 78%, rgba(2,3,10,0) 100%)",
  textPlateBlurPx: 5,
  textPlateInset: "-40px -56px", // how far the plate extends beyond the text box (feathered)
  textPlateRadius: 44,
} as const;

export function accentFor(pillar: Pillar): string {
  return pillarAccent[pillar].accent;
}

// ─── Brand themes (the 3-way colour system) ────────────────────────────────
// A post's THEME drives both the carousel accent and the AI-image colour/mood,
// so category is readable at a glance and the brand stays consistent. Authors set
// `theme` explicitly on a post; otherwise it falls back to the pillar mapping.
// Theme = the post's category. Each maps to a signature colour + mood.
//   defensive → blue · offensive → red · hacking → green · purple-team → purple · ai → orange
export type Theme = "offensive" | "defensive" | "hacking" | "purple-team" | "ai";

export const themes: Record<Theme, { name: string; accent: string; accent2: string; mood: string }> = {
  defensive: { name: "electric blue", accent: "#3b82f6", accent2: "#22d3ee", mood: "calm, controlled, shielded, secure — defensive blue-team energy" },
  offensive: { name: "alert red", accent: "#ef4444", accent2: "#f43f5e", mood: "aggressive, high-stakes, intrusion-and-exposure tension — offensive red-team / vulnerability energy" },
  hacking: { name: "neon green", accent: "#39ff88", accent2: "#22d3ee", mood: "raw, exploratory underground hacker energy, glowing circuitry and signal traces" },
  // purple-team = red + blue combined (offence + defence). Purple is the canonical purple-team colour.
  "purple-team": { name: "purple", accent: "#a855f7", accent2: "#c084fc", mood: "purple-team — offence and defence combined, adversary emulation meeting detection, red-and-blue collaboration energy" },
  // generic AI / model-centric posts. Orange = warm, anti-cliché AI (purple/green/blue are taken by other themes).
  ai: { name: "orange", accent: "#f97316", accent2: "#fb923c", mood: "generic AI / model-centric — warm, curious, forward-looking, the human side of the technology" },
};

// Default theme per content pillar (used when a post has no explicit `theme`).
export const pillarTheme: Record<Pillar, Theme> = {
  offensive_ai: "offensive",
  model_security: "defensive",
  data_leakage: "offensive",
  defensive_ai: "defensive",
  governance: "defensive",
  myth_busting: "hacking",
};

export function themeFor(post: { theme?: Theme; pillar: Pillar }): Theme {
  return post.theme ?? pillarTheme[post.pillar] ?? "defensive";
}
export function themeAccent(post: { theme?: Theme; pillar: Pillar }): string {
  return themes[themeFor(post)].accent;
}

// Themed "wall" backgrounds (renderer/public/walls). One per theme: a still PNG (carousel) and an
// animated WebM loop (reel), both 1080x1920. Used when a post sets wall.enabled.
export const themeWall: Record<Theme, { still: string; loop: string }> = {
  defensive: { still: "/walls/01-defensive-aegis.png", loop: "/walls/01-defensive-aegis.webm" },
  offensive: { still: "/walls/02-offensive-breach.png", loop: "/walls/02-offensive-breach.webm" },
  hacking: { still: "/walls/03-hacking-datastream.png", loop: "/walls/03-hacking-datastream.webm" },
  "purple-team": { still: "/walls/04-purple-team-convergence.png", loop: "/walls/04-purple-team-convergence.webm" },
  ai: { still: "/walls/05-ai-latent-mesh.png", loop: "/walls/05-ai-latent-mesh.webm" },
};
export function wallFor(post: { theme?: Theme; pillar: Pillar }): { still: string; loop: string } {
  return themeWall[themeFor(post)];
}

// Constant "brand style signature" injected into EVERY AI background prompt so all
// posts read as the same brand — only the theme colour + mood change by category.
export const BRAND_STYLE =
  "signature house style: dark cinematic cybersecurity key art, thin precise glowing linework, " +
  "volumetric haze, fine particle detail, premium minimal, high contrast, generous negative space";
