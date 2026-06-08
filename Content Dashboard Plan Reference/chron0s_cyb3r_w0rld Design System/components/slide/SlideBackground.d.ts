import * as React from "react";

export interface SlideBackgroundProps {
  /** Text-free cinematic AI key art (objectFit: cover). Omit for the procedural CSS fallback. */
  src?: string;
  /** Accent for the procedural glow + grid. Defaults to `--accent`. */
  accent?: string;
  /** Extra overlay children rendered above the grounding gradients. */
  children?: React.ReactNode;
}

/**
 * The full-bleed background layer: image mode (cinematic key art) or procedural
 * CSS (accent wash + masked grid + scanlines), always with top vignette + ambient
 * bottom grounding. The strong text scrim lives in SlideShell.
 */
export function SlideBackground(props: SlideBackgroundProps): React.ReactElement;
