import * as React from "react";

export interface KickerProps {
  /** The label text — a design role label, uppercase by convention (e.g. "DEFENSIVE MOVE"). */
  children: React.ReactNode;
  /** Override the accent colour. Defaults to the inherited `--accent` token. */
  accent?: string;
  /** Show the short leading rule before the label. Default true. */
  rule?: boolean;
  style?: React.CSSProperties;
}

/**
 * The small mono, uppercase, accent role label that sits above a headline.
 * A design label derived from the slide role — never a factual claim.
 */
export function Kicker(props: KickerProps): React.ReactElement;
