import type { ReactNode } from "react";
import type { TPostData, TSlideData } from "@/lib/schema";
import { fitFloors, fonts, headlineBase, layout, overlays, palette, themeAccent, type as typeScale } from "@/design/tokens";
import { SlideBackground } from "./SlideBackground";
import { useFitToFrame } from "./useFitToFrame";

// Shared canvas shell: exact pixel size, background, safe area, brand mark,
// pagination, accent hairline, and a CTA zone. Role slides supply children.
export function CarouselSlide({
  post,
  slide,
  children,
  align = "end",
}: {
  post: TPostData;
  slide: TSlideData;
  children: ReactNode;
  align?: "start" | "center" | "end" | "fill";
}) {
  const accent = themeAccent(post);
  const { width, height, safe_margin } = post.canvas;
  const justify = align === "center" ? "center" : align === "end" ? "flex-end" : "flex-start";
  // The text column may never enter the top header band, and never grow above textMaxFrac of the
  // canvas — so the header row stays clear and the top of the background is always visible.
  // Centered (takeaway) and fill (chain diagram) slides get the FULL region below the header:
  // centered lands on the optical eye-line, fill uses the whole height top-down for a diagram.
  const frameTop = align === "center" || align === "fill"
    ? safe_margin + layout.headerBand
    : Math.max(safe_margin + layout.headerBand, Math.round(height * (1 - layout.textMaxFrac)));

  // Measured shrink-to-fit: the text block renders at its per-role base size, gets measured
  // against the bounded frame, then scales DOWN (never below the legibility floor) so copy
  // never clips. The floor is the larger of the headline and subline floor ratios.
  const headlineBaseForRole =
    slide.role === "cover" ? headlineBase.cover
    : slide.role === "takeaway" ? headlineBase.takeaway
    : align === "fill" ? headlineBase.chain
    : headlineBase.body;
  const minScale = Math.max(
    fitFloors.headline / headlineBaseForRole,
    fitFloors.subline / typeScale.subline,
  );
  const { frameRef, blockRef, scale } = useFitToFrame(minScale, [slide.on_slide_copy, slide.subline]);
  // The block scales toward its anchored edge so it stays pinned: bottom for `end`, centre for
  // `center`, top for `fill`/`start`.
  const transformOrigin = align === "end" ? "50% 100%" : align === "center" ? "50% 50%" : "50% 0%";

  return (
    <div
      id="slide-root"
      data-role={slide.role}
      style={{
        position: "relative",
        width,
        height,
        overflow: "hidden",
        background: palette.bgDeep,
        color: palette.fg,
        fontFamily: fonts.body,
      }}
    >
      <SlideBackground post={post} slide={slide} accent={accent} />

      {/* Top accent hairline */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: accent, opacity: 0.9 }} />

      {/* Content frame inside the safe margin. The text block is wrapped with a
          content-hugging soft scrim (feathered dark plate + backdrop-blur) that moves
          with the text — bottom-aligned or centered — so copy stays legible over any
          background without a hard box. */}
      <div
        ref={frameRef}
        style={{
          position: "absolute",
          top: frameTop,
          left: safe_margin,
          right: safe_margin,
          bottom: safe_margin,
          display: "flex",
          flexDirection: "column",
          justifyContent: justify,
          overflow: "hidden",
        }}
      >
        <div
          ref={blockRef}
          style={{
            position: "relative",
            alignSelf: "stretch",
            transform: `scale(${scale})`,
            transformOrigin,
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: overlays.textPlateInset,
              background: overlays.textPlate,
              backdropFilter: `blur(${overlays.textPlateBlurPx}px)`,
              WebkitBackdropFilter: `blur(${overlays.textPlateBlurPx}px)`,
              borderRadius: overlays.textPlateRadius,
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 24 }}>
            {children}
          </div>
        </div>
      </div>

      {/* Brand mark (quiet, consistent top-left) */}
      <div
        style={{
          position: "absolute",
          top: safe_margin - 36,
          left: safe_margin,
          fontFamily: fonts.mono,
          fontSize: typeScale.meta,
          letterSpacing: "0.14em",
          color: palette.muted,
          textTransform: "uppercase",
        }}
      >
        {post.brand.handle}
      </div>

      {/* Pagination NN/08 (top-right) */}
      <div
        style={{
          position: "absolute",
          top: safe_margin - 36,
          right: safe_margin,
          fontFamily: fonts.mono,
          fontSize: typeScale.meta,
          letterSpacing: "0.12em",
          color: accent,
        }}
      >
        {String(slide.slide).padStart(2, "0")}/{String(post.slides.length).padStart(2, "0")}
      </div>
    </div>
  );
}

// Small reusable kicker label (design element derived from the slide role).
export function Kicker({ text, accent }: { text: string; accent: string }) {
  if (!text) return null;
  return (
    <div
      style={{
        fontFamily: fonts.mono,
        fontSize: typeScale.kicker,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: accent,
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <span style={{ width: 48, height: 3, background: accent, display: "inline-block" }} />
      {text}
    </div>
  );
}
