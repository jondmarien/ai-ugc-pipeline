import * as React from "react";

/**
 * @startingPoint section="Carousel" subtitle="Full carousel slide canvas — background, hairline, brand mark, pagination, text plate" viewport="1080x1350"
 */
export interface SlideShellProps {
  /** Text-free background image. Omit for the procedural CSS background. */
  background?: string;
  /** Accent colour. Usually set via a `theme-*` class instead. */
  accent?: string;
  /** Account handle (top-left). Default "@chron0s_cyb3r_w0rld.ai". */
  handle?: string;
  /** Current slide number (1-based). */
  current?: number;
  /** Total slide count. */
  total?: number;
  /** Vertical anchor of the content block. Most slides "end"; takeaways "center". */
  align?: "start" | "center" | "end";
  /** Canvas format. carousel = 1080×1350, reel = 1080×1920. */
  format?: "carousel" | "reel";
  /** Render scale (e.g. 0.4 to fit a card). Default 1. */
  scale?: number;
  /** Show the content-hugging feathered text plate. Default true. */
  plate?: boolean;
  /** Slide content: Kicker / Headline / Subline / Chip. */
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * The shared carousel/reel canvas shell: exact pixel size, background, 6px accent
 * hairline, brand mark, pagination, and a safe-area content frame with a feathered
 * text plate behind the copy. Compose the text primitives inside it.
 */
export function SlideShell(props: SlideShellProps): React.ReactElement;
