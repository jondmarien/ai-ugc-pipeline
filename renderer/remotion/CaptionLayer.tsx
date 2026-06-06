import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { fonts, palette } from "./theme";

export type CaptionMode = "block" | "word" | "highlight";
export type WordTiming = { text: string; start: number; end: number }; // seconds, relative to beat

// Burned-in lower-third captions with three animation modes:
//   block     — full caption fades in (default)
//   word      — one word at a time (karaoke), with a small pop
//   highlight — full line shown; the current word lit in the accent
// Word timing: if `words` (from Whisper alignment, `bun run align`) is provided, the
// active word is chosen by real timestamps; otherwise words are distributed evenly
// across the beat window.
export function CaptionLayer({
  text,
  accent,
  mode = "block",
  durationInFrames,
  words: timedWords,
}: {
  text: string;
  accent: string;
  mode?: CaptionMode;
  durationInFrames: number;
  words?: WordTiming[];
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const useTimed = !!(timedWords && timedWords.length);
  const words = useTimed ? timedWords!.map((w) => w.text) : text.trim().split(/\s+/).filter(Boolean);
  const safeDur = Math.max(1, durationInFrames);
  let activeIdx = 0;
  if (useTimed) {
    const t = frame / fps; // seconds into the beat
    for (let i = 0; i < timedWords!.length; i++) if (timedWords![i].start <= t) activeIdx = i;
  } else if (words.length) {
    activeIdx = Math.min(words.length - 1, Math.max(0, Math.floor((frame / safeDur) * words.length)));
  }

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

  // block (default) → rolling window of up to 3 words, advancing with the active word,
  // so each screen holds 2–3 words instead of the whole beat line.
  const CHUNK = 3;
  const start = Math.floor(Math.max(0, activeIdx) / CHUNK) * CHUNK;
  const phrase = words.slice(start, start + CHUNK).join(" ");
  const opacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const y = interpolate(frame, [0, 10], [24, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={wrap}>
      <div
        style={{
          ...baseText,
          fontSize: 92,
          opacity,
          transform: `translateY(${y}px)`,
          textShadow: `0 4px 40px rgba(0,0,0,0.8), 0 0 48px ${accent}33`,
        }}
      >
        {phrase}
      </div>
    </AbsoluteFill>
  );
}
