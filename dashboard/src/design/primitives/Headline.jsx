import React from "react";

// Inline emphasis markup, parsed from a headline string:
//   [[text]] → the post's THEME ACCENT colour (the affirmative point)
//   {{text}} → danger red (the negation / "what it's NOT")
// Everything else renders in the normal foreground. Used mainly on takeaways.
function colorize(text, accent, danger) {
  return String(text)
    .split(/(\[\[[^\]]+\]\]|\{\{[^}]+\}\})/g)
    .map((seg, i) => {
      if (seg.startsWith("[[") && seg.endsWith("]]"))
        return (
          <span key={i} style={{ color: accent }}>
            {seg.slice(2, -2)}
          </span>
        );
      if (seg.startsWith("{{") && seg.endsWith("}}"))
        return (
          <span key={i} style={{ color: danger }}>
            {seg.slice(2, -2)}
          </span>
        );
      return seg;
    });
}

// Headline — Archivo 800, balanced wrap, optional soft accent glow. `size`
// picks a step from the scale (cover | takeaway | headline) or any px number.
// Casing is authored in the copy (covers shout in CAPS, takeaways sentence-case).
export function Headline({
  children,
  size = "headline",
  accent,
  glow = true,
  danger = "var(--danger)",
  as: Tag = "h1",
  style,
}) {
  const accentColor = accent || "var(--accent)";
  const px =
    typeof size === "number"
      ? `${size}px`
      : {
          cover: "var(--type-cover-headline)",
          takeaway: "var(--type-takeaway)",
          headline: "var(--type-headline)",
        }[size] || "var(--type-headline)";
  return (
    <Tag
      style={{
        fontFamily: "var(--font-headline)",
        fontWeight: 800,
        fontSize: px,
        lineHeight: "var(--leading-headline)",
        letterSpacing: "var(--tracking-headline)",
        margin: 0,
        textWrap: "balance",
        color: "var(--fg)",
        textShadow: glow
          ? "var(--glow-headline) color-mix(in srgb, " + accentColor + " 20%, transparent)"
          : undefined,
        ...style,
      }}
    >
      {colorize(children, accentColor, danger)}
    </Tag>
  );
}
