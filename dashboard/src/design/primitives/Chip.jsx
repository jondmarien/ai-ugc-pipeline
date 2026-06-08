import React from "react";

// Chip — the pill CTA / swipe cue. Two variants:
//   solid (default) — filled with the accent, near-black ink (the loud CTA)
//   outline         — accent hairline border + accent ink (the quiet CTA)
// Mono, uppercase, wide tracking. Used for SWIPE →, SAVE + FOLLOW, COMMENT + SAVE.
export function Chip({ children, variant = "solid", accent, style }) {
  const color = accent || "var(--accent)";
  const solid = variant === "solid";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        fontFamily: "var(--font-mono)",
        fontWeight: 600,
        fontSize: "var(--type-cta)",
        letterSpacing: "var(--tracking-cta)",
        textTransform: "uppercase",
        padding: "14px 26px",
        borderRadius: "var(--radius-pill)",
        color: solid ? "var(--bg-deep)" : color,
        background: solid ? color : "transparent",
        border: solid ? "none" : `2px solid color-mix(in srgb, ${color} 55%, transparent)`,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
}
