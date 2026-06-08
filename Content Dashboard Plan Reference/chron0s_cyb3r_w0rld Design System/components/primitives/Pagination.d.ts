import * as React from "react";

export interface PaginationProps {
  /** Current slide (1-based). */
  current?: number;
  /** Total slides. */
  total?: number;
  /** Override accent colour. Defaults to `--accent`. */
  accent?: string;
  style?: React.CSSProperties;
}

/** The zero-padded NN/NN slide counter, mono in the accent colour, top-right. */
export function Pagination(props: PaginationProps): React.ReactElement;
