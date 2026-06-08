import * as React from "react";

export interface ClaimTagProps {
  /** Trust tier. verified = sourced fact, emerging = early signal, scenario = illustrative. */
  tag?: "verified" | "emerging" | "scenario";
  /** Override the label text (defaults to the tag name). */
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * The trust-standard credibility badge that labels a claim's altitude.
 * Tiny mono pill — it labels, never shouts. Core to "no fake panic".
 */
export function ClaimTag(props: ClaimTagProps): React.ReactElement;
