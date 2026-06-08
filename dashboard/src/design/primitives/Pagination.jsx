import React from "react";

// Pagination — the NN/NN slide counter, mono in the accent colour, top-right.
// Always zero-padded to two digits so the grid reads consistently (01/08).
export function Pagination({ current = 1, total = 8, accent, style }) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontWeight: 500,
        fontSize: "var(--type-meta)",
        letterSpacing: "0.12em",
        color: accent || "var(--accent)",
        ...style,
      }}
    >
      {pad(current)}/{pad(total)}
    </span>
  );
}
