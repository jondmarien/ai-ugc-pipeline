import * as React from "react";

export interface BrandMarkProps {
  /** The account handle. Default "@chron0s_cyb3r_w0rld.ai". */
  handle?: string;
  style?: React.CSSProperties;
}

/** The quiet mono account handle / watermark that sits top-left on every slide. */
export function BrandMark(props: BrandMarkProps): React.ReactElement;
