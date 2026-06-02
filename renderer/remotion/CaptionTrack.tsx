import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { fonts, palette } from "./theme";
import type { CaptionMode, WordTiming } from "./CaptionLayer";

export type CaptionLine = { start: number; end: number; text: string; words?: WordTiming[] };

// Voice-synced caption track (written by `bun run align` from Whisper). Each line is
// shown during its absolute [start,end]; word/highlight modes light the current word
// by real timestamp. This is the accurate path — the displayed words ARE the spoken
// words. Falls back to per-beat captions only when video.captions is absent.
export function CaptionTrack({ captions, accent, mode = "block" }: { captions: CaptionLine[]; accent: string; mode?: CaptionMode }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const line = captions.find((c) => t >= c.start && t < c.end);
  if (!line) return null;

  const words = line.words?.length ? line.words.map((w) => w.text) : line.text.trim().split(/\s+/).filter(Boolean);
  let activeIdx = -1;
  if (line.words?.length) {
    for (let i = 0; i < line.words.length; i++) if (line.words[i].start <= t) activeIdx = i;
  } else {
    const prog = (t - line.start) / Math.max(0.001, line.end - line.start);
    activeIdx = Math.min(words.length - 1, Math.max(0, Math.floor(prog * words.length)));
  }

  const wrap: React.CSSProperties = { justifyContent: "flex-end", alignItems: "center", padding: "0 96px 280px" };
  const base: React.CSSProperties = { fontFamily: fonts.headline, fontWeight: 800, lineHeight: 1.05, textAlign: "center", color: palette.fg, maxWidth: 900 };

  if (mode === "word") {
    return (
      <AbsoluteFill style={wrap}>
        <div style={{ ...base, fontSize: 116, textShadow: `0 4px 40px rgba(0,0,0,0.85), 0 0 56px ${accent}55` }}>
          {words[activeIdx] ?? words[words.length - 1] ?? ""}
        </div>
      </AbsoluteFill>
    );
  }
  if (mode === "highlight") {
    return (
      <AbsoluteFill style={wrap}>
        <div style={{ ...base, fontSize: 76, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 18px" }}>
          {words.map((w, i) => {
            const on = i === activeIdx;
            return (
              <span key={i} style={{ color: on ? accent : palette.fg, opacity: on ? 1 : 0.42, textShadow: on ? `0 4px 40px rgba(0,0,0,0.85), 0 0 40px ${accent}66` : "0 2px 24px rgba(0,0,0,0.7)" }}>{w}</span>
            );
          })}
        </div>
      </AbsoluteFill>
    );
  }
  // block
  const opacity = interpolate(t - line.start, [0, 0.2], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={wrap}>
      <div style={{ ...base, fontSize: 78, opacity, textShadow: `0 4px 40px rgba(0,0,0,0.8), 0 0 48px ${accent}33` }}>{line.text}</div>
    </AbsoluteFill>
  );
}
