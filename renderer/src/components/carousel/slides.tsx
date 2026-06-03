import type { ReactElement } from "react";
import type { TPostData, TSlideData } from "@/lib/schema";
import { fonts, palette, themeAccent, type as t } from "@/design/tokens";
import { CarouselSlide, Kicker } from "./CarouselSlide";

type SlideProps = { post: TPostData; slide: TSlideData };

function Headline({ text, size, accent }: { text: string; size: number; accent?: string }) {
  return (
    <h1
      style={{
        fontFamily: fonts.headline,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1.02,
        letterSpacing: "-0.01em",
        margin: 0,
        textWrap: "balance",
        textShadow: accent ? `0 0 48px ${accent}33` : undefined,
      }}
    >
      {text}
    </h1>
  );
}

function Subline({ text }: { text: string }) {
  if (!text) return null;
  return (
    <p style={{ fontFamily: fonts.body, fontWeight: 500, fontSize: t.subline, lineHeight: 1.22, color: palette.muted, margin: 0, maxWidth: "90%" }}>
      {text}
    </p>
  );
}

function SwipeCue({ label, accent }: { label: string; accent: string }) {
  if (!label) return null;
  return (
    <div
      style={{
        marginTop: 8,
        alignSelf: "flex-start",
        fontFamily: fonts.mono,
        fontSize: t.cta,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: palette.bgDeep,
        background: accent,
        padding: "14px 26px",
        borderRadius: 999,
        fontWeight: 600,
      }}
    >
      {label}
    </div>
  );
}

export function CoverSlide({ post, slide }: SlideProps) {
  const accent = themeAccent(post);
  return (
    <CarouselSlide post={post} slide={slide} align="end">
      <Kicker text={slide.kicker} accent={accent} />
      <Headline text={slide.on_slide_copy} size={t.coverHeadline} accent={accent} />
      <Subline text={slide.subline} />
      <SwipeCue label={slide.cta} accent={accent} />
    </CarouselSlide>
  );
}

function StandardSlide({ post, slide }: SlideProps) {
  const accent = themeAccent(post);
  return (
    <CarouselSlide post={post} slide={slide} align="end">
      <Kicker text={slide.kicker} accent={accent} />
      <Headline text={slide.on_slide_copy} size={t.headline} />
      <Subline text={slide.subline} />
    </CarouselSlide>
  );
}

export function TakeawaySlide({ post, slide }: SlideProps) {
  const accent = themeAccent(post);
  return (
    <CarouselSlide post={post} slide={slide} align="center">
      <Kicker text={slide.kicker} accent={accent} />
      <Headline text={slide.on_slide_copy} size={t.coverHeadline - 8} accent={accent} />
      <Subline text={slide.subline} />
    </CarouselSlide>
  );
}

export function CtaSlide({ post, slide }: SlideProps) {
  const accent = themeAccent(post);
  return (
    <CarouselSlide post={post} slide={slide} align="end">
      <Kicker text={slide.kicker} accent={accent} />
      <Headline text={slide.on_slide_copy} size={t.headline} />
      <Subline text={slide.subline} />
      <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
        <SwipeCue label={slide.cta || "SAVE + FOLLOW"} accent={accent} />
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: t.meta,
            letterSpacing: "0.1em",
            color: palette.muted,
            alignSelf: "center",
          }}
        >
          {post.brand.handle}
        </div>
      </div>
    </CarouselSlide>
  );
}

// Role → component registry. context/risk/mechanism/failure_point/defense share
// the standard layout; cover/takeaway/cta are specialized.
export const SLIDE_COMPONENTS: Record<TSlideData["role"], (p: SlideProps) => ReactElement> = {
  cover: CoverSlide,
  context: StandardSlide,
  risk: StandardSlide,
  mechanism: StandardSlide,
  failure_point: StandardSlide,
  defense: StandardSlide,
  takeaway: TakeawaySlide,
  cta: CtaSlide,
};
