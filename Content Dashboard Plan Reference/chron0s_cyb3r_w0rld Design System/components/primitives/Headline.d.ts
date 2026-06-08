import * as React from "react";

export interface HeadlineProps {
  /**
   * Headline text. Supports inline emphasis markup:
   *  `[[text]]` → theme accent colour · `{{text}}` → danger red (negation).
   */
  children: string;
  /** Size step or explicit px. Default "headline". */
  size?: "cover" | "takeaway" | "headline" | number;
  /** Override accent colour for `[[...]]` spans + glow. Defaults to `--accent`. */
  accent?: string;
  /** Soft accent text-shadow glow. Default true. */
  glow?: boolean;
  /** Colour for `{{...}}` spans. Defaults to `--danger`. */
  danger?: string;
  /** Element tag. Default "h1". */
  as?: keyof JSX.IntrinsicElements;
  style?: React.CSSProperties;
}

/**
 * The dominant display headline — Archivo 800, balanced wrap, optional accent glow.
 * Casing is authored in the copy (covers SHOUT, takeaways are sentence-case).
 */
export function Headline(props: HeadlineProps): React.ReactElement;
