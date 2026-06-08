import * as React from "react";

export interface ChipProps {
  /** Label content, e.g. "SWIPE →" or "SAVE + FOLLOW". */
  children: React.ReactNode;
  /** solid = filled accent w/ dark ink (loud CTA); outline = accent border + ink. */
  variant?: "solid" | "outline";
  /** Override accent colour. Defaults to `--accent`. */
  accent?: string;
  style?: React.CSSProperties;
}

/** The pill CTA / swipe cue — mono, uppercase, wide tracking. */
export function Chip(props: ChipProps): React.ReactElement;
