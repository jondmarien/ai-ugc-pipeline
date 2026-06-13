import type { ReactElement } from "react";
import type { TPostData, TSlideData } from "@/lib/schema";
import { fonts, headlineBase, palette, themeAccent, type as t } from "@/design/tokens";
import { CarouselSlide, Kicker } from "./CarouselSlide";

type SlideProps = { post: TPostData; slide: TSlideData };

// Inline emphasis markup for on-slide headlines (mainly the takeaway):
//   [[text]] → the post's THEME ACCENT colour   ·   {{text}} → danger red (denial/negation)
// On a red-accent theme (offensive / data_leakage) the {{negation}} falls back from red to muted
// slate so it doesn't disappear into the red [[affirmative]] (see Headline's neg fallback).
// Everything else renders in the normal foreground. Markers live only in on_slide_copy and
// are consumed here (alt_text + reel captions are separate, so they never see the markers).
function colorize(text: string, accent: string, danger: string) {
  return text.split(/(\[\[[^\]]+\]\]|\{\{[^}]+\}\})/g).map((seg, i) => {
    if (seg.startsWith("[[") && seg.endsWith("]]")) return <span key={i} style={{ color: accent }}>{seg.slice(2, -2)}</span>;
    if (seg.startsWith("{{") && seg.endsWith("}}")) return <span key={i} style={{ color: danger }}>{seg.slice(2, -2)}</span>;
    return seg;
  });
}

function Headline({ text, size, accent, danger }: { text: string; size: number; accent?: string; danger?: string }) {
  const acc = accent ?? palette.fg;
  // {{negation}} normally renders danger red. On a red-accent theme (offensive / data_leakage) that
  // would be red-on-red with the [[affirmative]] accent, so fall back to muted slate — keeping a
  // distinct, legible third tone: white base, red affirmative, slate negation.
  const neg = danger ?? (acc.toLowerCase() === palette.danger.toLowerCase() ? palette.muted : palette.danger);
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
      {colorize(text, acc, neg)}
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
      <Headline text={slide.on_slide_copy} size={headlineBase.cover} accent={accent} />
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
      <Headline text={slide.on_slide_copy} size={headlineBase.body} />
      <Subline text={slide.subline} />
    </CarouselSlide>
  );
}

export function TakeawaySlide({ post, slide }: SlideProps) {
  const accent = themeAccent(post);
  return (
    <CarouselSlide post={post} slide={slide} align="center">
      <Kicker text={slide.kicker} accent={accent} />
      <Headline text={slide.on_slide_copy} size={headlineBase.takeaway} accent={accent} />
      <Subline text={slide.subline} />
    </CarouselSlide>
  );
}

export function CtaSlide({ post, slide }: SlideProps) {
  const accent = themeAccent(post);
  return (
    <CarouselSlide post={post} slide={slide} align="end">
      <Kicker text={slide.kicker} accent={accent} />
      <Headline text={slide.on_slide_copy} size={headlineBase.body} />
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

// One step box in a chain diagram. The final step (the outcome) is emphasized with the accent.
function ChainStep({ step, accent, outcome }: { step: { stage?: string; title: string; detail?: string }; accent: string; outcome?: boolean }) {
  return (
    <div
      style={{
        border: `1px solid ${outcome ? accent : "rgba(148,163,184,0.26)"}`,
        background: outcome ? `${accent}22` : "rgba(11,15,26,0.6)",
        borderLeft: `4px solid ${accent}`,
        borderRadius: 12,
        padding: "9px 16px",
      }}
    >
      {step.stage ? (
        <div style={{ fontFamily: fonts.mono, fontSize: 13, letterSpacing: "0.16em", textTransform: "uppercase", color: accent, marginBottom: 2 }}>{step.stage}</div>
      ) : null}
      <div style={{ fontFamily: fonts.headline, fontWeight: 800, fontSize: outcome ? 25 : 22, lineHeight: 1.04, color: palette.fg }}>{step.title}</div>
      {step.detail ? (
        <div style={{ fontFamily: fonts.body, fontSize: 15, lineHeight: 1.18, color: palette.muted, marginTop: 3 }}>{step.detail}</div>
      ) : null}
    </div>
  );
}

// Full-bleed step-flow diagram (role "chain"), rendered from slide.chain[] in the design system —
// no AI background, so technical posts (exploit/kill chains) get an on-brand, readable diagram slide.
export function ChainSlide({ post, slide }: SlideProps) {
  const accent = themeAccent(post);
  const steps = slide.chain ?? [];
  return (
    <CarouselSlide post={post} slide={slide} align="fill">
      <Kicker text={slide.kicker} accent={accent} />
      <Headline text={slide.on_slide_copy} size={headlineBase.chain} accent={accent} />
      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 2 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "stretch", gap: 5 }}>
            <ChainStep step={s} accent={accent} outcome={i === steps.length - 1} />
            {i < steps.length - 1 ? <div style={{ alignSelf: "center", width: 2, height: 8, background: accent, opacity: 0.7 }} /> : null}
          </div>
        ))}
      </div>
    </CarouselSlide>
  );
}

// Role → component registry. context/risk/mechanism/failure_point/defense/point share
// the standard body layout; cover/takeaway/cta/chain are specialized. `point` is the generic
// body slide; `chain` is a full-bleed step-flow diagram from slide.chain[].
export const SLIDE_COMPONENTS: Record<TSlideData["role"], (p: SlideProps) => ReactElement> = {
  cover: CoverSlide,
  context: StandardSlide,
  risk: StandardSlide,
  mechanism: StandardSlide,
  failure_point: StandardSlide,
  defense: StandardSlide,
  takeaway: TakeawaySlide,
  cta: CtaSlide,
  point: StandardSlide,
  chain: ChainSlide,
};
