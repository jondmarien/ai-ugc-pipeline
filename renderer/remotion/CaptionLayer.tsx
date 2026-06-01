import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { fonts, palette } from "./theme";

// Burned-in, high-contrast subtitle in the lower third, inside mobile-safe margins.
// One short caption per beat. Proofread acronyms in the source data, not here.
export function CaptionLayer({ text, accent }: { text: string; accent: string }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const y = interpolate(frame, [0, 10], [24, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", padding: "0 96px 280px" }}>
      <div
        style={{
          opacity,
          transform: `translateY(${y}px)`,
          fontFamily: fonts.headline,
          fontWeight: 800,
          fontSize: 78,
          lineHeight: 1.05,
          textAlign: "center",
          color: palette.fg,
          textShadow: `0 4px 40px rgba(0,0,0,0.8), 0 0 48px ${accent}33`,
          maxWidth: 900,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
}
