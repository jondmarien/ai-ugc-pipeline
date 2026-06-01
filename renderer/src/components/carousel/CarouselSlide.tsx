import type { ReactNode } from "react";
import type { TPostData, TSlideData } from "@/lib/schema";
import { accentFor, fonts, palette, type as typeScale } from "@/design/tokens";
import { SlideBackground } from "./SlideBackground";

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
  align?: "start" | "center" | "end";
}) {
  const accent = accentFor(post.pillar);
  const { width, height, safe_margin } = post.canvas;
  const justify = align === "center" ? "center" : align === "start" ? "flex-start" : "flex-end";

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
      <SlideBackground slide={slide} accent={accent} />

      {/* Top accent hairline */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: accent, opacity: 0.9 }} />

      {/* Content frame inside the safe margin */}
      <div
        style={{
          position: "absolute",
          inset: safe_margin,
          display: "flex",
          flexDirection: "column",
          justifyContent: justify,
          gap: 24,
        }}
      >
        {children}
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
