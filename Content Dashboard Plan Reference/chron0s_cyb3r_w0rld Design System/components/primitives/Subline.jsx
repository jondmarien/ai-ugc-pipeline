import React from "react";

// Subline — the quiet Inter clarifier under a headline. Muted, ≤90% width so
// it never competes with the display type. Renders nothing if empty.
export function Subline({ children, style }) {
  if (!children) return null;
  return (
    <p
      style={{
        fontFamily: "var(--font-body)",
        fontWeight: 500,
        fontSize: "var(--type-subline)",
        lineHeight: "var(--leading-subline)",
        color: "var(--muted)",
        margin: 0,
        maxWidth: "90%",
        ...style,
      }}
    >
      {children}
    </p>
  );
}
