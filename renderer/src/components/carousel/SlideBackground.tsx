import type { CSSProperties } from "react";
import type { TSlideData } from "@/lib/schema";
import { palette } from "@/design/tokens";

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

export function SlideBackground({ slide, accent }: { slide: TSlideData; accent: string }) {
  const usesImage =
    slide.background_asset &&
    (slide.asset_status === "existing" || slide.asset_status === "generated" || slide.asset_status === "stock");

  return (
    <div style={{ position: "absolute", inset: 0, background: palette.bgDeep, overflow: "hidden" }}>
      {usesImage ? (
        <img
          src={slide.background_asset}
          alt=""
          data-bg-image
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <>
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(140% 120% at 50% 0%, #0a1322 0%, ${palette.bg} 55%, ${palette.bgDeep} 100%)` }} />
          <div style={gridLayer(accent)} />
          <div style={glowLayer(accent)} />
          <div style={scanlines()} />
        </>
      )}
      {/* Protected dark lower-third for headline legibility on every slide. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "62%",
          background: "linear-gradient(180deg, transparent 0%, rgba(2,3,10,0.55) 42%, rgba(2,3,10,0.92) 100%)",
        }}
      />
      {/* Top vignette to seat the kicker/brand mark. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: "26%",
          background: "linear-gradient(0deg, transparent 0%, rgba(2,3,10,0.7) 100%)",
        }}
      />
    </div>
  );
}
