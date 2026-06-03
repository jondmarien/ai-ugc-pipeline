// Local copy of the pillar accents + palette for the Remotion bundle, so the
// composition stays self-contained and matches src/design/tokens.ts.
export const palette = {
  bg: "#05070d",
  bgDeep: "#02030a",
  fg: "#f8fafc",
  muted: "#94a3b8",
};

export const pillarAccent: Record<string, string> = {
  offensive_ai: "#22d3ee",
  model_security: "#3b82f6",
  data_leakage: "#39ff88",
  defensive_ai: "#2dd4bf",
  governance: "#f59e0b",
  myth_busting: "#ef4444",
};

// Brand themes (mirror src/design/tokens.ts) — accent by category.
export const themeAccentColor: Record<string, string> = { defensive: "#3b82f6", offensive: "#ef4444", hacking: "#39ff88" };
const pillarTheme: Record<string, string> = {
  offensive_ai: "offensive",
  model_security: "defensive",
  data_leakage: "offensive",
  defensive_ai: "defensive",
  governance: "defensive",
  myth_busting: "hacking",
};
export function themeAccent(post: { theme?: string; pillar: string }): string {
  const theme = post.theme ?? pillarTheme[post.pillar] ?? "defensive";
  return themeAccentColor[theme] ?? "#3b82f6";
}

export const fonts = {
  headline: '"Archivo", system-ui, sans-serif',
  body: '"Inter", system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
};
