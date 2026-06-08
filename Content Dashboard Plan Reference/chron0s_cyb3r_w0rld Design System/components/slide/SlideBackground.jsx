import React from "react";

// SlideBackground — the full-bleed background layer behind every slide.
// Two modes:
//   image       — a text-free cinematic AI key art photo (objectFit: cover)
//   procedural  — pure-CSS fallback: radial accent wash + masked accent grid +
//                 faint scanlines (used when there's no generated art)
// Either way it lays down the brand's legibility grounding on top: a top
// vignette and an ambient bottom gradient. The STRONG text scrim is the
// content-hugging plate inside SlideShell, not here.
export function SlideBackground({ src, accent, children }) {
  const a = accent || "var(--accent)";
  return (
    <div style={{ position: "absolute", inset: 0, background: "var(--bg-deep)", overflow: "hidden" }}>
      {src ? (
        <img
          src={src}
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(140% 120% at 50% 0%, var(--bg-raise) 0%, var(--bg) 55%, var(--bg-deep) 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `linear-gradient(${a}22 1px, transparent 1px), linear-gradient(90deg, ${a}22 1px, transparent 1px)`,
              backgroundSize: "var(--grid-size) var(--grid-size)",
              maskImage: "radial-gradient(120% 90% at 50% 30%, black 35%, transparent 78%)",
              WebkitMaskImage: "radial-gradient(120% 90% at 50% 30%, black 35%, transparent 78%)",
              opacity: 0.5,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(60% 45% at 50% 34%, ${a}40 0%, ${a}14 32%, transparent 68%)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 4px)",
              opacity: 0.35,
            }}
          />
        </>
      )}

      {/* Ambient grounding — light; the text plate does the real legibility work */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: "var(--overlay-top-height)",
          background: "var(--overlay-top-vignette)",
        }}
      />
      <div style={{ position: "absolute", inset: 0, background: "var(--overlay-ambient-bottom)" }} />
      {children}
    </div>
  );
}
