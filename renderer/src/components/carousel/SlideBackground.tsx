import type { CSSProperties } from "react";
import type { TPostData, TSlideData } from "@/lib/schema";
import { overlays, palette, wallFor } from "@/design/tokens";

// Procedural, text-free, logo-free cyber backgrounds built purely in CSS so the
// PoC needs no new image generation. Where `background_asset` + asset_status
// "existing"/"generated"/"stock" is set, the real image is layered instead and
// these procedural motifs become a dark scrim under it.

function gridLayer(accent: string): CSSProperties {
  return {
    position: "absolute",
    inset: 0,
    backgroundImage: `linear-gradient(${accent}22 1px, transparent 1px), linear-gradient(90deg, ${accent}22 1px, transparent 1px)`,
    backgroundSize: "60px 60px",
    maskImage: "radial-gradient(120% 90% at 50% 30%, black 35%, transparent 78%)",
    opacity: 0.5,
  };
}

function glowLayer(accent: string, x = "50%", y = "34%"): CSSProperties {
  return {
    position: "absolute",
    inset: 0,
    background: `radial-gradient(60% 45% at ${x} ${y}, ${accent}40 0%, ${accent}14 32%, transparent 68%)`,
  };
}

function scanlines(): CSSProperties {
  return {
    position: "absolute",
    inset: 0,
    backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 4px)",
    opacity: 0.35,
  };
}

export function SlideBackground({ post, slide, accent }: { post: TPostData; slide: TSlideData; accent: string }) {
  const usesImage =
    slide.background_asset &&
    (slide.asset_status === "existing" || slide.asset_status === "generated" || slide.asset_status === "stock");
  // Optional themed wall: the post theme's still becomes the BASE layer and the per-slide art is
  // composited on top at art_opacity, so the moving/glowing wall shows through the dark areas.
  const wall = post.wall?.enabled ? wallFor(post) : null;
  const artOpacity = post.wall?.art_opacity ?? 0.85;
  const cover: CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" };

  return (
    <div style={{ position: "absolute", inset: 0, background: palette.bgDeep, overflow: "hidden" }}>
      {wall ? (
        <>
          <img src={wall.still} alt="" data-bg-wall style={cover} />
          {usesImage && <img src={slide.background_asset} alt="" data-bg-image style={{ ...cover, opacity: artOpacity }} />}
        </>
      ) : usesImage ? (
        <img src={slide.background_asset} alt="" data-bg-image style={cover} />
      ) : (
        <>
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(140% 120% at 50% 0%, #0a1322 0%, ${palette.bg} 55%, ${palette.bgDeep} 100%)` }} />
          <div style={gridLayer(accent)} />
          <div style={glowLayer(accent)} />
          <div style={scanlines()} />
        </>
      )}
      {/* Light AMBIENT grounding only — the strong text legibility scrim is the
          content-hugging plate in CarouselSlide. Keeps slide edges from glaring. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: overlays.topHeight,
          background: overlays.topVignette,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: overlays.ambientBottom,
          backdropFilter: usesImage && overlays.ambientBlurPx > 0 ? `blur(${overlays.ambientBlurPx}px)` : undefined,
          WebkitBackdropFilter: usesImage && overlays.ambientBlurPx > 0 ? `blur(${overlays.ambientBlurPx}px)` : undefined,
        }}
      />
    </div>
  );
}
