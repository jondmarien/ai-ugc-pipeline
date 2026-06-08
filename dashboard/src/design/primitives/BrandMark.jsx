import React from "react";

// BrandMark — the quiet account handle, mono + uppercase + wide tracking.
// Sits top-left on every slide; never competes with the headline. The idea is
// always louder than the watermark.
export function BrandMark({ handle = "@chron0s_cyb3r_w0rld.ai", style }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontWeight: 500,
        fontSize: "var(--type-meta)",
        letterSpacing: "var(--tracking-meta)",
        textTransform: "uppercase",
        color: "var(--muted)",
        ...style,
      }}
    >
      {handle}
    </span>
  );
}
