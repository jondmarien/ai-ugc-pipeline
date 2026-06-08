import { AbsoluteFill, Loop, OffthreadVideo, Sequence, staticFile, useVideoConfig } from "remotion";
import "@fontsource/archivo/700.css";
import "@fontsource/archivo/800.css";
import "@fontsource/inter/500.css";
import "@fontsource/jetbrains-mono/500.css";
import { palette, themeAccent, wallFor } from "./theme";
import { Scene } from "./Scene";
import { CaptionLayer, type CaptionMode, type WordTiming } from "./CaptionLayer";
import { CaptionTrack, type CaptionLine } from "./CaptionTrack";
import { EndCard } from "./EndCard";
import { AudioBed, type AudioConfig } from "./AudioBed";

type Beat = { start: number; end: number; slide_ref: number; purpose: string; caption: string; words?: WordTiming[] };
type Slide = { role: string; background_asset?: string; asset_status?: string; on_slide_copy?: string };
type Post = {
  pillar: string;
  theme?: string;
  brand?: { handle?: string };
  comment_prompt?: string;
  slides: Slide[];
  video: { beats: Beat[]; caption_mode?: CaptionMode; audio?: AudioConfig; captions?: CaptionLine[] };
  wall?: { enabled?: boolean; art_opacity?: number };
};

// 1080x1920 @ fps. Each VideoSpec beat → a timed Sequence with a Scene + caption.
// The last beat (purpose "cta") renders the EndCard instead of a caption.
export function ReelComposition({ post }: { post: Post }) {
  const { fps } = useVideoConfig();
  const accent = themeAccent(post);
  const handle = post.brand?.handle ?? "@your_handle";
  const beats = post.video.beats;
  const captionMode: CaptionMode = post.video.caption_mode ?? "block";
  // Voice-synced transcript captions (from `bun run align`) win over planned beat captions.
  const syncedCaptions = post.video.captions;
  const useSynced = !!(syncedCaptions && syncedCaptions.length);
  // Optional themed wall: an animated loop behind every scene. Each Scene then draws its art
  // semi-transparent (artOpacity) so the wall shows through.
  const wall = post.wall?.enabled ? wallFor(post) : null;
  const wallArtOpacity = post.wall?.art_opacity ?? 0.6;

  return (
    <AbsoluteFill style={{ backgroundColor: palette.bgDeep }}>
      {wall && (
        <AbsoluteFill>
          <Loop durationInFrames={Math.max(1, Math.round(wall.seconds * fps))}>
            <OffthreadVideo src={staticFile(wall.loop.replace(/^\//, ""))} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </Loop>
        </AbsoluteFill>
      )}
      <AudioBed audio={post.video.audio} />
      {beats.map((beat, i) => {
        const from = Math.round(beat.start * fps);
        const durationInFrames = Math.max(1, Math.round((beat.end - beat.start) * fps));
        const slide = post.slides[beat.slide_ref - 1] ?? post.slides[0];
        const isCta = beat.purpose === "cta";
        return (
          <Sequence key={i} from={from} durationInFrames={durationInFrames}>
            <Scene slide={slide} accent={accent} durationInFrames={durationInFrames} wallActive={!!wall} artOpacity={wallArtOpacity} />
            {isCta ? (
              <EndCard question={post.comment_prompt ?? slide.on_slide_copy ?? ""} handle={handle} accent={accent} />
            ) : useSynced ? null : (
              <CaptionLayer text={beat.caption} accent={accent} mode={captionMode} durationInFrames={durationInFrames} words={beat.words} />
            )}
          </Sequence>
        );
      })}

      {/* Voice-synced caption track (overrides per-beat captions when present) */}
      {useSynced && <CaptionTrack captions={syncedCaptions!} accent={accent} mode={captionMode} />}

      {/* Persistent quiet brand mark + accent hairline */}
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 8, background: accent }} />
        <div
          style={{
            position: "absolute",
            top: 64,
            left: 96,
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 28,
            letterSpacing: "0.14em",
            color: palette.muted,
            textTransform: "uppercase",
          }}
        >
          {handle}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
