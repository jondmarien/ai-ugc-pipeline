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
  ambientBlurPx: 3,
  // Content-hugging text plate (the primary legibility layer). Translucent + blurred,
  // so the background image still reads (softly) through it; densest over the text and
  // fading to transparent at the edges. The blur — not opacity — carries legibility.
  textPlate: "radial-gradient(125% 135% at 50% 50%, rgba(2,3,10,0.66) 0%, rgba(2,3,10,0.54) 48%, rgba(2,3,10,0.24) 78%, rgba(2,3,10,0) 100%)",
  textPlateBlurPx: 10,
  textPlateInset: "-40px -56px", // how far the plate extends beyond the text box (feathered)
  textPlateRadius: 44,
} as const;

export function accentFor(pillar: Pillar): string {
  return pillarAccent[pillar].accent;
}
