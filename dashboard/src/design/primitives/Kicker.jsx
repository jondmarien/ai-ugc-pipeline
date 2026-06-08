import React from "react";

// Kicker — the small mono, uppercase, accent role label that sits above a
// headline, preceded by a short accent rule. It's a DESIGN label derived from
// the slide role ("WHAT CHANGED", "DEFENSIVE MOVE"), never a factual claim.
export function Kicker({ children, accent, rule = true, style }) {
  const color = accent || "var(--accent)";
  return (
    <div
      style={{
        fontFamily: "var(--font-mono)",
        fontWeight: 500,
        fontSize: "var(--type-kicker)",
        letterSpacing: "var(--tracking-kicker)",
        textTransform: "uppercase",
        color,
        display: "flex",
        alignItems: "center",
        gap: 16,
        lineHeight: 1,
        ...style,
      }}
    >
      {rule ? (
        <span
          aria-hidden
          style={{
            width: "var(--kicker-rule-w)",
            height: "var(--kicker-rule-h)",
            background: color,
            display: "inline-block",
            flex: "0 0 auto",
          }}
        />
      ) : null}
      {children}
    </div>
  );
}
