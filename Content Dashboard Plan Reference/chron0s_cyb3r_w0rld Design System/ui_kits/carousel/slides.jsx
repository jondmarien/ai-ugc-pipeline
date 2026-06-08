// Carousel slide-role renderer. Maps a slide's `role` to a layout built from the
// design-system primitives (SlideShell / Kicker / Headline / Subline / Chip),
// exactly mirroring the pipeline's SLIDE_COMPONENTS registry. Read DS components
// at call time so the namespace is resolved at runtime, never at module load.
(function () {
  const DS = window.Chron0sCyb3rW0rldDesignSystem_0b1a15;
  const { SlideShell, Kicker, Headline, Subline, Chip } = DS;

  // One slide, sized via `scale`. `current`/`total` drive pagination.
  function CarouselSlide({ post, slide, index, total, scale }) {
    const bg = `${post.bgDir}/${slide.bg}`;
    const common = { background: bg, handle: post.handle, current: index + 1, total, scale };

    if (slide.role === "cover") {
      return (
        <SlideShell {...common} align="end">
          <Kicker>{slide.kicker}</Kicker>
          <Headline size="cover">{slide.copy}</Headline>
          <Subline>{slide.sub}</Subline>
          {slide.cta ? <Chip>{slide.cta}</Chip> : null}
        </SlideShell>
      );
    }

    if (slide.role === "takeaway") {
      return (
        <SlideShell {...common} align="center">
          <Kicker>{slide.kicker}</Kicker>
          <Headline size="takeaway">{slide.copy}</Headline>
          <Subline>{slide.sub}</Subline>
        </SlideShell>
      );
    }

    if (slide.role === "cta") {
      return (
        <SlideShell {...common} align="end">
          <Kicker>{slide.kicker}</Kicker>
          <Headline>{slide.copy}</Headline>
          <Subline>{slide.sub}</Subline>
          <div style={{ display: "flex", gap: 16, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
            <Chip>{slide.cta || "Save + Follow"}</Chip>
          </div>
        </SlideShell>
      );
    }

    // context / risk / mechanism / failure_point / defense / point → standard body
    return (
      <SlideShell {...common} align="end">
        <Kicker>{slide.kicker}</Kicker>
        <Headline>{slide.copy}</Headline>
        <Subline>{slide.sub}</Subline>
      </SlideShell>
    );
  }

  window.CarouselRoles = { CarouselSlide };
})();
