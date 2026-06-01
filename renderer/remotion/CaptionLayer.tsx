import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { fonts, palette } from "./theme";

export type CaptionMode = "block" | "word" | "highlight";

// Burned-in lower-third captions with three animation modes:
//   block     — full caption fades in (default)
//   word      — one word at a time (karaoke), with a small pop
//   highlight — full line shown; the current word lit in the accent
// Word timing is distributed evenly across the beat window (durationInFrames).
// When real audio + word timestamps exist later, pass explicit per-word timing.
export function CaptionLayer({
  text,
  accent,
  mode = "block",
  durationInFrames,
}: {
  text: string;
  accent: string;
  mode?: CaptionMode;
  durationInFrames: number;
}) {
  const frame = useCurrentFrame();
  const words = text.trim().split(/\s+/).filter(Boolean);
  const safeDur = Math.max(1, durationInFrames);
  const activeIdx = words.length
    ? Math.min(words.length - 1, Math.max(0, Math.floor((frame / safeDur) * words.length)))
    : 0;

  const wrap: React.CSSProperties = {
    justifyContent: "flex-end",
    alignItems: "center",
    padding: "0 96px 280px",
  };
  const baseText: React.CSSProperties = {
    fontFamily: fonts.headline,
    fontWeight: 800,
    lineHeight: 1.05,
    textAlign: "center",
    color: palette.fg,
    maxWidth: 900,
  };

  if (mode === "word") {
    const framesPerWord = safeDur / Math.max(1, words.length);
    const localFrame = frame - activeIdx * framesPerWord;
    const pop = interpolate(localFrame, [0, 6], [0.86, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return (
      <AbsoluteFill style={wrap}>
        <div
          style={{
            ...baseText,
            fontSize: 116,
            transform: `scale(${pop})`,
            color: palette.fg,
            textShadow: `0 4px 40px rgba(0,0,0,0.85), 0 0 56px ${accent}55`,
          }}
        >
          {words[activeIdx] ?? ""}
        </div>
      </AbsoluteFill>
    );
  }

  if (mode === "highlight") {
    return (
      <AbsoluteFill style={wrap}>
        <div style={{ ...baseText, fontSize: 76, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 18px" }}>
          {words.map((w, i) => {
            const active = i === activeIdx;
            return (
              <span
                key={i}
                style={{
                  color: active ? accent : palette.fg,
                  opacity: active ? 1 : 0.42,
                  textShadow: active ? `0 4px 40px rgba(0,0,0,0.85), 0 0 40px ${accent}66` : "0 2px 24px rgba(0,0,0,0.7)",
                  transition: "none",
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
    );
  }

  // block (default)
  const opacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const y = interpolate(frame, [0, 10], [24, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={wrap}>
      <div
        style={{
          ...baseText,
          fontSize: 78,
          opacity,
          transform: `translateY(${y}px)`,
          textShadow: `0 4px 40px rgba(0,0,0,0.8), 0 0 48px ${accent}33`,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
}
