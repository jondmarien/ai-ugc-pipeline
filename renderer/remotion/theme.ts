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
export const themeAccentColor: Record<string, string> = { defensive: "#3b82f6", offensive: "#ef4444", hacking: "#39ff88", "purple-team": "#a855f7", ai: "#f97316" };
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

// Themed "wall" backgrounds (public/walls), mirrors src/design/tokens.ts. The reel uses the
// animated WebM loop; the still PNG is the carousel's job.
type Wall = { still: string; loop: string; seconds: number };
export const themeWall: Record<string, Wall> = {
  defensive: { still: "/walls/01-defensive-aegis.png", loop: "/walls/01-defensive-aegis.webm", seconds: 15.83 },
  offensive: { still: "/walls/02-offensive-breach.png", loop: "/walls/02-offensive-breach.webm", seconds: 11.17 },
  hacking: { still: "/walls/03-hacking-datastream.png", loop: "/walls/03-hacking-datastream.webm", seconds: 11.1 },
  "purple-team": { still: "/walls/04-purple-team-convergence.png", loop: "/walls/04-purple-team-convergence.webm", seconds: 18.9 },
  ai: { still: "/walls/05-ai-latent-mesh.png", loop: "/walls/05-ai-latent-mesh.webm", seconds: 8.17 },
};
export function wallFor(post: { theme?: string; pillar: string }): Wall | null {
  const theme = post.theme ?? pillarTheme[post.pillar] ?? "defensive";
  return themeWall[theme] ?? null;
}

export const fonts = {
  headline: '"Archivo", system-ui, sans-serif',
  body: '"Inter", system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
};
