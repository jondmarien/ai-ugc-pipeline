import * as React from "react";

export interface SublineProps {
  /** Clarifier text. Renders nothing when empty. */
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/** The quiet muted Inter clarifier under a headline, capped at 90% width. */
export function Subline(props: SublineProps): React.ReactElement | null;
