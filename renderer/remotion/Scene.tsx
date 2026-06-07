import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { palette } from "./theme";

type Slide = {
  role: string;
  background_asset?: string;
  asset_status?: string;
};

// One timed visual beat: background (reused cover image or procedural) with a
// slow push-in. Text/captions are layered above by ReelComposition.
export function Scene({
  slide,
  accent,
  durationInFrames,
  wallActive = false,
  artOpacity = 0.6,
}: {
  slide: Slide;
  accent: string;
  durationInFrames: number;
  wallActive?: boolean;
  artOpacity?: number;
}) {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, durationInFrames], [1.04, 1.12], {
    extrapolateRight: "clamp",
  });
  const useImage =
    slide.background_asset &&
    (slide.asset_status === "existing" || slide.asset_status === "generated" || slide.asset_status === "stock");

  return (
    <AbsoluteFill style={{ backgroundColor: wallActive ? "transparent" : palette.bgDeep, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${scale})` }}>
        {useImage ? (
          <Img
            src={staticFile(slide.background_asset!.replace(/^\//, ""))}
            style={{ width: "100%", height: "100%", objectFit: "cover", opacity: wallActive ? artOpacity : 1 }}
          />
        ) : wallActive ? null : (
          <AbsoluteFill
            style={{
              background: `radial-gradient(60% 40% at 50% 32%, ${accent}38 0%, ${accent}10 34%, ${palette.bg} 70%, ${palette.bgDeep} 100%)`,
            }}
          />
        )}
      </AbsoluteFill>
      {/* Grid + scanline texture for procedural scenes */}
      {!useImage && !wallActive && (
        <AbsoluteFill
          style={{
            backgroundImage: `linear-gradient(${accent}22 1px, transparent 1px), linear-gradient(90deg, ${accent}22 1px, transparent 1px)`,
            backgroundSize: "72px 72px",
            opacity: 0.4,
            maskImage: "radial-gradient(120% 80% at 50% 30%, black 30%, transparent 75%)",
          }}
        />
      )}
      {/* Bottom scrim for caption legibility */}
      <AbsoluteFill
        style={{
          background: "linear-gradient(180deg, transparent 45%, rgba(2,3,10,0.55) 70%, rgba(2,3,10,0.95) 100%)",
        }}
      />
    </AbsoluteFill>
  );
}
