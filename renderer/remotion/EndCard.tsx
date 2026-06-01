import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { fonts, palette } from "./theme";

// Final CTA: question + save/follow prompt + handle. Don't bury the CTA.
export function EndCard({ question, handle, accent }: { question: string; handle: string; accent: string }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill
      style={{
        opacity,
        justifyContent: "center",
        alignItems: "center",
        padding: 96,
        gap: 40,
        textAlign: "center",
      }}
    >
      <div style={{ fontFamily: fonts.mono, fontSize: 30, letterSpacing: "0.2em", textTransform: "uppercase", color: accent }}>
        Your move
      </div>
      <div style={{ fontFamily: fonts.headline, fontWeight: 800, fontSize: 84, lineHeight: 1.05, color: palette.fg, maxWidth: 880 }}>
        {question}
      </div>
      <div
        style={{
          fontFamily: fonts.mono,
          fontSize: 36,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: palette.bgDeep,
          background: accent,
          padding: "18px 34px",
          borderRadius: 999,
          fontWeight: 700,
        }}
      >
        Comment + Save
      </div>
      <div style={{ fontFamily: fonts.mono, fontSize: 28, color: palette.muted, letterSpacing: "0.12em" }}>{handle}</div>
    </AbsoluteFill>
  );
}
