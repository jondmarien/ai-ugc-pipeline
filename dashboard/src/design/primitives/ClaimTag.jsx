import React from "react";

// ClaimTag — the trust-standard credibility badge. Every factual claim is
// tagged so the audience knows the altitude:
//   verified  → confirmed, sourced fact          (accent / theme colour)
//   emerging  → early signal, reported but moving (amber)
//   scenario  → illustrative, not a real event    (muted outline)
// Mono, uppercase, square-ish pill. Tiny by design — it labels, never shouts.
const VARIANTS = {
  verified: { label: "VERIFIED", color: "var(--accent)" },
  emerging: { label: "EMERGING", color: "var(--pillar-governance)" },
  scenario: { label: "SCENARIO", color: "var(--muted)" },
};

export function ClaimTag({ tag = "verified", children, style }) {
  const v = VARIANTS[tag] || VARIANTS.verified;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontFamily: "var(--font-mono)",
        fontWeight: 500,
        fontSize: "0.62em",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        padding: "5px 11px",
        borderRadius: 7,
        color: v.color,
        border: `1.5px solid color-mix(in srgb, ${v.color} 45%, transparent)`,
        background: `color-mix(in srgb, ${v.color} 12%, transparent)`,
        lineHeight: 1,
        ...style,
      }}
    >
      <span aria-hidden style={{ width: 5, height: 5, borderRadius: 999, background: v.color }} />
      {children || v.label}
    </span>
  );
}
