import React from "react";
import { SlideBackground } from "./SlideBackground.jsx";
import { BrandMark } from "../primitives/BrandMark.jsx";
import { Pagination } from "../primitives/Pagination.jsx";

// SlideShell — the shared carousel canvas. Exact pixel size, background,
// 6px accent hairline, quiet brand mark (top-left), pagination (top-right),
// and a safe-area content frame with a content-hugging feathered text plate
// behind the children. Role slides supply the kicker / headline / subline.
//
// `align` controls the vertical anchor of the content block: most slides are
// "end" (bottom-aligned over a lower-third), takeaways are "center".
export function SlideShell({
  background,
  accent,
  handle = "@chron0s_cyb3r_w0rld.ai",
  current = 1,
  total = 8,
  align = "end",
  format = "carousel", // "carousel" (1080×1350) | "reel" (1080×1920)
  scale = 1, // render at scale to fit smaller containers
  plate = true,
  children,
  style,
}) {
  const w = format === "reel" ? 1080 : 1080;
  const h = format === "reel" ? 1920 : 1350;
  const justify = align === "center" ? "center" : align === "start" ? "flex-start" : "flex-end";

  return (
    <div
      style={{
        width: w * scale,
        height: h * scale,
        flex: "0 0 auto",
        ...style,
      }}
    >
      <div
        data-screen-label={`slide ${String(current).padStart(2, "0")}`}
        style={{
          position: "relative",
          width: w,
          height: h,
          overflow: "hidden",
          background: "var(--bg-deep)",
          color: "var(--fg)",
          fontFamily: "var(--font-body)",
          transform: scale === 1 ? undefined : `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <SlideBackground src={background} accent={accent} />

        {/* Top accent hairline */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "var(--hairline-w)",
            background: accent || "var(--accent)",
            opacity: 0.9,
          }}
        />

        {/* Content frame inside the safe margin */}
        <div
          style={{
            position: "absolute",
            inset: "var(--safe-margin)",
            display: "flex",
            flexDirection: "column",
            justifyContent: justify,
          }}
        >
          <div style={{ position: "relative", alignSelf: "stretch" }}>
            {plate ? (
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: "var(--plate-inset-y) var(--plate-inset-x)",
                  background: "var(--overlay-text-plate)",
                  backdropFilter: "blur(var(--plate-blur))",
                  WebkitBackdropFilter: "blur(var(--plate-blur))",
                  borderRadius: "var(--radius-plate)",
                  pointerEvents: "none",
                }}
              />
            ) : null}
            <div
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-content-gap)",
              }}
            >
              {children}
            </div>
          </div>
        </div>

        {/* Brand mark + pagination */}
        <div
          style={{
            position: "absolute",
            top: "calc(var(--safe-margin) - 36px)",
            left: "var(--safe-margin)",
          }}
        >
          <BrandMark handle={handle} />
        </div>
        <div
          style={{
            position: "absolute",
            top: "calc(var(--safe-margin) - 36px)",
            right: "var(--safe-margin)",
          }}
        >
          <Pagination current={current} total={total} accent={accent} />
        </div>
      </div>
    </div>
  );
}
