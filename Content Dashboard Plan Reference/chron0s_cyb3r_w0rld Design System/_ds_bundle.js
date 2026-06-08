/* @ds-bundle: {"format":3,"namespace":"Chron0sCyb3rW0rldDesignSystem_0b1a15","components":[{"name":"BrandMark","sourcePath":"components/primitives/BrandMark.jsx"},{"name":"Chip","sourcePath":"components/primitives/Chip.jsx"},{"name":"ClaimTag","sourcePath":"components/primitives/ClaimTag.jsx"},{"name":"Headline","sourcePath":"components/primitives/Headline.jsx"},{"name":"Kicker","sourcePath":"components/primitives/Kicker.jsx"},{"name":"Pagination","sourcePath":"components/primitives/Pagination.jsx"},{"name":"Subline","sourcePath":"components/primitives/Subline.jsx"},{"name":"SlideBackground","sourcePath":"components/slide/SlideBackground.jsx"},{"name":"SlideShell","sourcePath":"components/slide/SlideShell.jsx"}],"sourceHashes":{"components/primitives/BrandMark.jsx":"4c2ff1628bdd","components/primitives/Chip.jsx":"eac47b0e0d5f","components/primitives/ClaimTag.jsx":"699e569b5122","components/primitives/Headline.jsx":"e2d3b62b5781","components/primitives/Kicker.jsx":"40a63843b248","components/primitives/Pagination.jsx":"6b191191686f","components/primitives/Subline.jsx":"d73b2e5e2510","components/slide/SlideBackground.jsx":"5d5011127350","components/slide/SlideShell.jsx":"538913dbb7f4","ui_kits/carousel/data.js":"75b613eacb53","ui_kits/carousel/slides.jsx":"7f5cc5f0d085","ui_kits/reel/ReelPlayer.jsx":"bf4f07a38f6c","ui_kits/reel/data.js":"e6cb331ac3dc"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.Chron0sCyb3rW0rldDesignSystem_0b1a15 = window.Chron0sCyb3rW0rldDesignSystem_0b1a15 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/primitives/BrandMark.jsx
try { (() => {
// BrandMark — the quiet account handle, mono + uppercase + wide tracking.
// Sits top-left on every slide; never competes with the headline. The idea is
// always louder than the watermark.
function BrandMark({
  handle = "@chron0s_cyb3r_w0rld.ai",
  style
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontWeight: 500,
      fontSize: "var(--type-meta)",
      letterSpacing: "var(--tracking-meta)",
      textTransform: "uppercase",
      color: "var(--muted)",
      ...style
    }
  }, handle);
}
Object.assign(__ds_scope, { BrandMark });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/primitives/BrandMark.jsx", error: String((e && e.message) || e) }); }

// components/primitives/Chip.jsx
try { (() => {
// Chip — the pill CTA / swipe cue. Two variants:
//   solid (default) — filled with the accent, near-black ink (the loud CTA)
//   outline         — accent hairline border + accent ink (the quiet CTA)
// Mono, uppercase, wide tracking. Used for SWIPE →, SAVE + FOLLOW, COMMENT + SAVE.
function Chip({
  children,
  variant = "solid",
  accent,
  style
}) {
  const color = accent || "var(--accent)";
  const solid = variant === "solid";
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      fontFamily: "var(--font-mono)",
      fontWeight: 600,
      fontSize: "var(--type-cta)",
      letterSpacing: "var(--tracking-cta)",
      textTransform: "uppercase",
      padding: "14px 26px",
      borderRadius: "var(--radius-pill)",
      color: solid ? "var(--bg-deep)" : color,
      background: solid ? color : "transparent",
      border: solid ? "none" : `2px solid color-mix(in srgb, ${color} 55%, transparent)`,
      whiteSpace: "nowrap",
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Chip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/primitives/Chip.jsx", error: String((e && e.message) || e) }); }

// components/primitives/ClaimTag.jsx
try { (() => {
// ClaimTag — the trust-standard credibility badge. Every factual claim is
// tagged so the audience knows the altitude:
//   verified  → confirmed, sourced fact          (accent / theme colour)
//   emerging  → early signal, reported but moving (amber)
//   scenario  → illustrative, not a real event    (muted outline)
// Mono, uppercase, square-ish pill. Tiny by design — it labels, never shouts.
const VARIANTS = {
  verified: {
    label: "VERIFIED",
    color: "var(--accent)"
  },
  emerging: {
    label: "EMERGING",
    color: "var(--pillar-governance)"
  },
  scenario: {
    label: "SCENARIO",
    color: "var(--muted)"
  }
};
function ClaimTag({
  tag = "verified",
  children,
  style
}) {
  const v = VARIANTS[tag] || VARIANTS.verified;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      fontFamily: "var(--font-mono)",
      fontWeight: 500,
      fontSize: "0.62em",
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      padding: "5px 11px",
      borderRadius: 7,
      color: v.color,
      border: `1.5px solid color-mix(in srgb, ${v.color} 45%, transparent)`,
      background: `color-mix(in srgb, ${v.color} 12%, transparent)`,
      lineHeight: 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    style: {
      width: 5,
      height: 5,
      borderRadius: 999,
      background: v.color
    }
  }), children || v.label);
}
Object.assign(__ds_scope, { ClaimTag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/primitives/ClaimTag.jsx", error: String((e && e.message) || e) }); }

// components/primitives/Headline.jsx
try { (() => {
// Inline emphasis markup, parsed from a headline string:
//   [[text]] → the post's THEME ACCENT colour (the affirmative point)
//   {{text}} → danger red (the negation / "what it's NOT")
// Everything else renders in the normal foreground. Used mainly on takeaways.
function colorize(text, accent, danger) {
  return String(text).split(/(\[\[[^\]]+\]\]|\{\{[^}]+\}\})/g).map((seg, i) => {
    if (seg.startsWith("[[") && seg.endsWith("]]")) return /*#__PURE__*/React.createElement("span", {
      key: i,
      style: {
        color: accent
      }
    }, seg.slice(2, -2));
    if (seg.startsWith("{{") && seg.endsWith("}}")) return /*#__PURE__*/React.createElement("span", {
      key: i,
      style: {
        color: danger
      }
    }, seg.slice(2, -2));
    return seg;
  });
}

// Headline — Archivo 800, balanced wrap, optional soft accent glow. `size`
// picks a step from the scale (cover | takeaway | headline) or any px number.
// Casing is authored in the copy (covers shout in CAPS, takeaways sentence-case).
function Headline({
  children,
  size = "headline",
  accent,
  glow = true,
  danger = "var(--danger)",
  as: Tag = "h1",
  style
}) {
  const accentColor = accent || "var(--accent)";
  const px = typeof size === "number" ? `${size}px` : {
    cover: "var(--type-cover-headline)",
    takeaway: "var(--type-takeaway)",
    headline: "var(--type-headline)"
  }[size] || "var(--type-headline)";
  return /*#__PURE__*/React.createElement(Tag, {
    style: {
      fontFamily: "var(--font-headline)",
      fontWeight: 800,
      fontSize: px,
      lineHeight: "var(--leading-headline)",
      letterSpacing: "var(--tracking-headline)",
      margin: 0,
      textWrap: "balance",
      color: "var(--fg)",
      textShadow: glow ? "var(--glow-headline) color-mix(in srgb, " + accentColor + " 20%, transparent)" : undefined,
      ...style
    }
  }, colorize(children, accentColor, danger));
}
Object.assign(__ds_scope, { Headline });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/primitives/Headline.jsx", error: String((e && e.message) || e) }); }

// components/primitives/Kicker.jsx
try { (() => {
// Kicker — the small mono, uppercase, accent role label that sits above a
// headline, preceded by a short accent rule. It's a DESIGN label derived from
// the slide role ("WHAT CHANGED", "DEFENSIVE MOVE"), never a factual claim.
function Kicker({
  children,
  accent,
  rule = true,
  style
}) {
  const color = accent || "var(--accent)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontWeight: 500,
      fontSize: "var(--type-kicker)",
      letterSpacing: "var(--tracking-kicker)",
      textTransform: "uppercase",
      color,
      display: "flex",
      alignItems: "center",
      gap: 16,
      lineHeight: 1,
      ...style
    }
  }, rule ? /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    style: {
      width: "var(--kicker-rule-w)",
      height: "var(--kicker-rule-h)",
      background: color,
      display: "inline-block",
      flex: "0 0 auto"
    }
  }) : null, children);
}
Object.assign(__ds_scope, { Kicker });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/primitives/Kicker.jsx", error: String((e && e.message) || e) }); }

// components/primitives/Pagination.jsx
try { (() => {
// Pagination — the NN/NN slide counter, mono in the accent colour, top-right.
// Always zero-padded to two digits so the grid reads consistently (01/08).
function Pagination({
  current = 1,
  total = 8,
  accent,
  style
}) {
  const pad = n => String(n).padStart(2, "0");
  return /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontWeight: 500,
      fontSize: "var(--type-meta)",
      letterSpacing: "0.12em",
      color: accent || "var(--accent)",
      ...style
    }
  }, pad(current), "/", pad(total));
}
Object.assign(__ds_scope, { Pagination });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/primitives/Pagination.jsx", error: String((e && e.message) || e) }); }

// components/primitives/Subline.jsx
try { (() => {
// Subline — the quiet Inter clarifier under a headline. Muted, ≤90% width so
// it never competes with the display type. Renders nothing if empty.
function Subline({
  children,
  style
}) {
  if (!children) return null;
  return /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-body)",
      fontWeight: 500,
      fontSize: "var(--type-subline)",
      lineHeight: "var(--leading-subline)",
      color: "var(--muted)",
      margin: 0,
      maxWidth: "90%",
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Subline });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/primitives/Subline.jsx", error: String((e && e.message) || e) }); }

// components/slide/SlideBackground.jsx
try { (() => {
// SlideBackground — the full-bleed background layer behind every slide.
// Two modes:
//   image       — a text-free cinematic AI key art photo (objectFit: cover)
//   procedural  — pure-CSS fallback: radial accent wash + masked accent grid +
//                 faint scanlines (used when there's no generated art)
// Either way it lays down the brand's legibility grounding on top: a top
// vignette and an ambient bottom gradient. The STRONG text scrim is the
// content-hugging plate inside SlideShell, not here.
function SlideBackground({
  src,
  accent,
  children
}) {
  const a = accent || "var(--accent)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "var(--bg-deep)",
      overflow: "hidden"
    }
  }, src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: "",
    style: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover"
    }
  }) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "radial-gradient(140% 120% at 50% 0%, var(--bg-raise) 0%, var(--bg) 55%, var(--bg-deep) 100%)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      backgroundImage: `linear-gradient(${a}22 1px, transparent 1px), linear-gradient(90deg, ${a}22 1px, transparent 1px)`,
      backgroundSize: "var(--grid-size) var(--grid-size)",
      maskImage: "radial-gradient(120% 90% at 50% 30%, black 35%, transparent 78%)",
      WebkitMaskImage: "radial-gradient(120% 90% at 50% 30%, black 35%, transparent 78%)",
      opacity: 0.5
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: `radial-gradient(60% 45% at 50% 34%, ${a}40 0%, ${a}14 32%, transparent 68%)`
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 4px)",
      opacity: 0.35
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      height: "var(--overlay-top-height)",
      background: "var(--overlay-top-vignette)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "var(--overlay-ambient-bottom)"
    }
  }), children);
}
Object.assign(__ds_scope, { SlideBackground });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/slide/SlideBackground.jsx", error: String((e && e.message) || e) }); }

// components/slide/SlideShell.jsx
try { (() => {
// SlideShell — the shared carousel canvas. Exact pixel size, background,
// 6px accent hairline, quiet brand mark (top-left), pagination (top-right),
// and a safe-area content frame with a content-hugging feathered text plate
// behind the children. Role slides supply the kicker / headline / subline.
//
// `align` controls the vertical anchor of the content block: most slides are
// "end" (bottom-aligned over a lower-third), takeaways are "center".
function SlideShell({
  background,
  accent,
  handle = "@chron0s_cyb3r_w0rld.ai",
  current = 1,
  total = 8,
  align = "end",
  format = "carousel",
  // "carousel" (1080×1350) | "reel" (1080×1920)
  scale = 1,
  // render at scale to fit smaller containers
  plate = true,
  children,
  style
}) {
  const w = format === "reel" ? 1080 : 1080;
  const h = format === "reel" ? 1920 : 1350;
  const justify = align === "center" ? "center" : align === "start" ? "flex-start" : "flex-end";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: w * scale,
      height: h * scale,
      flex: "0 0 auto",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    "data-screen-label": `slide ${String(current).padStart(2, "0")}`,
    style: {
      position: "relative",
      width: w,
      height: h,
      overflow: "hidden",
      background: "var(--bg-deep)",
      color: "var(--fg)",
      fontFamily: "var(--font-body)",
      transform: scale === 1 ? undefined : `scale(${scale})`,
      transformOrigin: "top left"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.SlideBackground, {
    src: background,
    accent: accent
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "var(--hairline-w)",
      background: accent || "var(--accent)",
      opacity: 0.9
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: "var(--safe-margin)",
      display: "flex",
      flexDirection: "column",
      justifyContent: justify
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      alignSelf: "stretch"
    }
  }, plate ? /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      inset: "var(--plate-inset-y) var(--plate-inset-x)",
      background: "var(--overlay-text-plate)",
      backdropFilter: "blur(var(--plate-blur))",
      WebkitBackdropFilter: "blur(var(--plate-blur))",
      borderRadius: "var(--radius-plate)",
      pointerEvents: "none"
    }
  }) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-content-gap)"
    }
  }, children))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: "calc(var(--safe-margin) - 36px)",
      left: "var(--safe-margin)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.BrandMark, {
    handle: handle
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: "calc(var(--safe-margin) - 36px)",
      right: "var(--safe-margin)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Pagination, {
    current: current,
    total: total,
    accent: accent
  }))));
}
Object.assign(__ds_scope, { SlideShell });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/slide/SlideShell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/carousel/data.js
try { (() => {
// Carousel UI kit — sample post data lifted verbatim from the pipeline
// (renderer/content/posts/*.json). Two approved posts, two themes.
// Backgrounds are the text-free FLUX key art; React renders the type on top.
window.CAROUSEL_POSTS = [{
  id: "prompt-injection-agents",
  theme: "defensive",
  handle: "@chron0s_cyb3r_w0rld.ai",
  bgDir: "../../assets/backgrounds/blue",
  pillar: "model_security",
  likes: 1284,
  posted: "JUNE 3",
  comment_prompt: "Would your agent trust a webpage it was told to summarize?",
  caption: "The weirdest AI attack doesn't get typed into the chat box. It hides in the content your AI agent reads. That's indirect prompt injection. Defender move: isolate untrusted content, scope agent permissions, log every action, confirm sensitive steps.",
  hashtags: ["#AISecurity", "#PromptInjection", "#LLMSecurity", "#AIagents", "#OWASP"],
  slides: [{
    role: "cover",
    bg: "01_cover.png",
    kicker: "AI × Cybersecurity",
    copy: "THE WEIRDEST AI ATTACK HIDES WHERE YOUR AGENT READS",
    sub: "Prompt injection isn't always typed by the user.",
    cta: "Swipe →"
  }, {
    role: "context",
    bg: "02_context.png",
    kicker: "What Changed",
    copy: "Direct injection: the user manipulates the model. Indirect: the content does.",
    sub: "The instruction can come from data, not the chat box."
  }, {
    role: "risk",
    bg: "03_risk.png",
    kicker: "Why It Matters",
    copy: "It can live in web pages, emails, documents, or images, anywhere the agent reads.",
    sub: "Untrusted content becomes untrusted instructions."
  }, {
    role: "mechanism",
    bg: "04_mechanism.png",
    kicker: "How It Works",
    copy: "The risk spikes when the AI can act: send email, read files, call APIs.",
    sub: "Reading is one thing. Acting is another."
  }, {
    role: "failure_point",
    bg: "05_failure-point.png",
    kicker: "Where Teams Fail",
    copy: "OWASP flags the pattern: injection, sensitive disclosure, excessive agency.",
    sub: "It's a known risk class, not a surprise."
  }, {
    role: "defense",
    bg: "06_defense.png",
    kicker: "Defensive Move",
    copy: "Isolate untrusted content. Limit tools. Log actions. Confirm sensitive steps.",
    sub: "Least privilege for agents, not just users."
  }, {
    role: "takeaway",
    bg: "07_takeaway.png",
    kicker: "Takeaway",
    copy: "Treat external content [[like user input wearing a costume]].",
    sub: ""
  }, {
    role: "cta",
    bg: "08_cta.png",
    kicker: "Your Move",
    copy: "Would your agent trust a webpage it was told to summarize?",
    sub: "Save this for your next agent design review.",
    cta: "Comment + Save"
  }]
}, {
  id: "hexstrike-ai-v6",
  theme: "offensive",
  handle: "@chron0s_cyb3r_w0rld.ai",
  bgDir: "../../assets/backgrounds/red",
  pillar: "offensive_ai",
  likes: 2071,
  posted: "JUNE 6",
  comment_prompt: "How fast can your team patch an internet-facing zero-day, honestly?",
  caption: "An open-source tool just let an AI agent drive 150+ hacking tools by itself. The gap between a disclosure and mass exploitation is collapsing. No fake panic, but the direction is real: patch velocity and exposure management matter more than ever.",
  hashtags: ["#offensiveAI", "#redteam", "#MCP", "#CVE", "#patchmanagement", "#AIsecurity"],
  slides: [{
    role: "cover",
    bg: "01_cover.png",
    kicker: "Offensive AI · Red Team Tools",
    copy: "AI JUST CUT EXPLOIT DEVELOPMENT FROM WEEKS TO MINUTES",
    sub: "HexStrike AI: one open-source tool, 150+ hacking tools, driven by an AI agent.",
    cta: "Swipe →"
  }, {
    role: "context",
    bg: "02_context.png",
    kicker: "What It Is",
    copy: "An open-source framework that lets an AI agent run 150+ security tools.",
    sub: "Built for authorized red teams via MCP, with Claude, GPT, or Copilot as the operator."
  }, {
    role: "risk",
    bg: "03_risk.png",
    kicker: "What Actually Happened",
    copy: "Hours after a Citrix zero-day dropped, attackers discussed using it to mass-exploit.",
    sub: "Reported on dark-web forums by Check Point: chatter, not confirmed forensics."
  }, {
    role: "mechanism",
    bg: "04_mechanism.png",
    kicker: "How It Works",
    copy: "A decision engine turns a plain-language goal into a recon-to-exploit loop.",
    sub: "It selects the tools, chains them, and retries failures on its own. That's the leap."
  }, {
    role: "failure_point",
    bg: "05_failure-point.png",
    kicker: "The Shrinking Window",
    copy: "The gap between disclosure and mass exploitation is now hours, not weeks.",
    sub: "~28,000 NetScaler boxes were exposed to one bug (CVE-2025-7775, CVSS 9.2)."
  }, {
    role: "defense",
    bg: "06_defense.png",
    kicker: "What Actually Works",
    copy: "Patch internet-facing gear first, and fast. Assume n-day exploitation is automated.",
    sub: "Track exposure, watch threat intel on disclosure day, tune detection for the window."
  }, {
    role: "takeaway",
    bg: "07_takeaway.png",
    kicker: "The Real Shift",
    copy: "AI lowers the skill floor for attackers. [[Patch velocity matters more]], {{not less}}.",
    sub: "Same fundamentals. Far less time to apply them."
  }, {
    role: "cta",
    bg: "08_cta.png",
    kicker: "Your Move",
    copy: "How fast can your team patch an internet-facing zero-day, honestly?",
    sub: "Save this for your next patch-SLA review.",
    cta: "Comment + Save"
  }]
}];
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/carousel/data.js", error: String((e && e.message) || e) }); }

// ui_kits/carousel/slides.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Carousel slide-role renderer. Maps a slide's `role` to a layout built from the
// design-system primitives (SlideShell / Kicker / Headline / Subline / Chip),
// exactly mirroring the pipeline's SLIDE_COMPONENTS registry. Read DS components
// at call time so the namespace is resolved at runtime, never at module load.
(function () {
  const DS = window.Chron0sCyb3rW0rldDesignSystem_0b1a15;
  const {
    SlideShell,
    Kicker,
    Headline,
    Subline,
    Chip
  } = DS;

  // One slide, sized via `scale`. `current`/`total` drive pagination.
  function CarouselSlide({
    post,
    slide,
    index,
    total,
    scale
  }) {
    const bg = `${post.bgDir}/${slide.bg}`;
    const common = {
      background: bg,
      handle: post.handle,
      current: index + 1,
      total,
      scale
    };
    if (slide.role === "cover") {
      return /*#__PURE__*/React.createElement(SlideShell, _extends({}, common, {
        align: "end"
      }), /*#__PURE__*/React.createElement(Kicker, null, slide.kicker), /*#__PURE__*/React.createElement(Headline, {
        size: "cover"
      }, slide.copy), /*#__PURE__*/React.createElement(Subline, null, slide.sub), slide.cta ? /*#__PURE__*/React.createElement(Chip, null, slide.cta) : null);
    }
    if (slide.role === "takeaway") {
      return /*#__PURE__*/React.createElement(SlideShell, _extends({}, common, {
        align: "center"
      }), /*#__PURE__*/React.createElement(Kicker, null, slide.kicker), /*#__PURE__*/React.createElement(Headline, {
        size: "takeaway"
      }, slide.copy), /*#__PURE__*/React.createElement(Subline, null, slide.sub));
    }
    if (slide.role === "cta") {
      return /*#__PURE__*/React.createElement(SlideShell, _extends({}, common, {
        align: "end"
      }), /*#__PURE__*/React.createElement(Kicker, null, slide.kicker), /*#__PURE__*/React.createElement(Headline, null, slide.copy), /*#__PURE__*/React.createElement(Subline, null, slide.sub), /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          gap: 16,
          marginTop: 12,
          alignItems: "center",
          flexWrap: "wrap"
        }
      }, /*#__PURE__*/React.createElement(Chip, null, slide.cta || "Save + Follow")));
    }

    // context / risk / mechanism / failure_point / defense / point → standard body
    return /*#__PURE__*/React.createElement(SlideShell, _extends({}, common, {
      align: "end"
    }), /*#__PURE__*/React.createElement(Kicker, null, slide.kicker), /*#__PURE__*/React.createElement(Headline, null, slide.copy), /*#__PURE__*/React.createElement(Subline, null, slide.sub));
  }
  window.CarouselRoles = {
    CarouselSlide
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/carousel/slides.jsx", error: String((e && e.message) || e) }); }

// ui_kits/reel/ReelPlayer.jsx
try { (() => {
// Reel player — recreates the Remotion reel composition as a live, scrubbable
// player. Slow push-in per beat (scale 1.04 → 1.12), burned-in lower-third
// captions in three modes (block / word / highlight), and an end card. Reads
// the brand palette from CSS custom properties. Exports window.ReelKit.
(function () {
  const {
    useState,
    useEffect,
    useRef,
    useCallback
  } = React;
  const lerp = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t));
  function beatAt(beats, t) {
    for (let k = beats.length - 1; k >= 0; k--) if (t >= beats[k].start) return k;
    return 0;
  }

  // Active word index within a beat (relative seconds), from words[] or even spread.
  function activeWord(beat, localT) {
    if (beat.words && beat.words.length) {
      let idx = 0;
      for (let i = 0; i < beat.words.length; i++) if (beat.words[i][1] <= localT) idx = i;
      return idx;
    }
    const words = beat.caption.trim().split(/\s+/);
    const dur = beat.end - beat.start;
    return Math.min(words.length - 1, Math.max(0, Math.floor(localT / dur * words.length)));
  }
  function Captions({
    beat,
    localT,
    mode,
    S
  }) {
    const words = beat.words ? beat.words.map(w => w[0]) : beat.caption.trim().split(/\s+/);
    const idx = activeWord(beat, localT);
    const base = {
      fontFamily: "var(--font-headline)",
      fontWeight: 800,
      lineHeight: 1.05,
      textAlign: "center",
      color: "var(--fg)",
      maxWidth: 900 * S,
      hyphens: "none"
    };
    const wrap = {
      position: "absolute",
      inset: 0,
      display: "flex",
      justifyContent: "flex-end",
      alignItems: "center",
      flexDirection: "column",
      padding: `0 ${96 * S}px ${230 * S}px`
    };
    if (mode === "word") {
      return /*#__PURE__*/React.createElement("div", {
        style: wrap
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          ...base,
          fontSize: 116 * S,
          textShadow: `var(--shadow-caption), 0 0 ${56 * S}px color-mix(in srgb, var(--accent) 33%, transparent)`
        }
      }, words[idx]));
    }
    if (mode === "highlight") {
      return /*#__PURE__*/React.createElement("div", {
        style: wrap
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          ...base,
          fontSize: 76 * S,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: `0 ${18 * S}px`
        }
      }, words.map((w, i) => {
        const on = i === idx;
        return /*#__PURE__*/React.createElement("span", {
          key: i,
          style: {
            color: on ? "var(--accent)" : "var(--fg)",
            opacity: on ? 1 : 0.42,
            textShadow: on ? `var(--shadow-caption), 0 0 ${40 * S}px color-mix(in srgb, var(--accent) 40%, transparent)` : "0 2px 24px rgba(0,0,0,0.7)"
          }
        }, w);
      })));
    }
    // block — rolling window of up to 3 words
    const start = Math.floor(idx / 3) * 3;
    return /*#__PURE__*/React.createElement("div", {
      style: wrap
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        ...base,
        fontSize: 92 * S,
        textShadow: `var(--shadow-caption), 0 0 ${48 * S}px color-mix(in srgb, var(--accent) 20%, transparent)`
      }
    }, words.slice(start, start + 3).join(" ")));
  }
  function EndCard({
    question,
    handle,
    S
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: 96 * S,
        gap: 40 * S
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: 30 * S,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: "var(--accent)"
      }
    }, "Your move"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--font-headline)",
        fontWeight: 800,
        fontSize: 84 * S,
        lineHeight: 1.05,
        color: "var(--fg)",
        maxWidth: 880 * S
      }
    }, question), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: 36 * S,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: "var(--bg-deep)",
        background: "var(--accent)",
        padding: `${18 * S}px ${34 * S}px`,
        borderRadius: 999,
        fontWeight: 700
      }
    }, "Comment + Save"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: 28 * S,
        color: "var(--muted)",
        letterSpacing: "0.12em"
      }
    }, handle));
  }
  function ReelPlayer({
    reel,
    scale
  }) {
    const S = scale;
    const W = 1080 * S,
      H = 1920 * S;
    const KEY = "reel:" + reel.id;
    const [t, setT] = useState(() => parseFloat(localStorage.getItem(KEY) || "0") || 0);
    const [playing, setPlaying] = useState(false);
    const [mode, setMode] = useState(reel.caption_mode);
    const raf = useRef(0);
    const last = useRef(0);
    useEffect(() => {
      localStorage.setItem(KEY, t.toFixed(2));
    }, [t]);
    useEffect(() => {
      if (!playing) return;
      last.current = performance.now();
      const tick = now => {
        const dt = (now - last.current) / 1000;
        last.current = now;
        setT(prev => {
          const nt = prev + dt;
          if (nt >= reel.duration) {
            setPlaying(false);
            return reel.duration;
          }
          return nt;
        });
        raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf.current);
    }, [playing, reel.duration]);
    const toggle = useCallback(() => {
      setPlaying(p => {
        if (!p && t >= reel.duration - 0.05) setT(0);
        return !p;
      });
    }, [t, reel.duration]);
    const k = beatAt(reel.beats, t);
    const beat = reel.beats[k];
    const localT = t - beat.start;
    const pushScale = lerp(1.04, 1.12, localT / (beat.end - beat.start));
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "modes"
    }, ["block", "word", "highlight"].map(m => /*#__PURE__*/React.createElement("button", {
      key: m,
      "data-active": m === mode,
      onClick: () => setMode(m)
    }, m))), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "relative",
        width: W,
        height: H,
        overflow: "hidden",
        background: "var(--bg-deep)",
        borderRadius: 22,
        border: "1px solid var(--hairline)",
        boxShadow: "var(--shadow-panel)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        inset: 0,
        transform: `scale(${pushScale})`,
        transformOrigin: "center"
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: `${reel.bgDir}/${beat.bg}`,
      alt: "",
      style: {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover"
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        inset: 0,
        background: "var(--overlay-reel-bottom)"
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 5,
        background: "var(--accent)",
        opacity: 0.9
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        top: 18 * S * 3,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "space-between",
        padding: `0 ${60 * S}px`,
        fontFamily: "var(--font-mono)",
        fontSize: Math.max(10, 26 * S),
        letterSpacing: "0.13em",
        textTransform: "uppercase",
        color: "var(--muted)"
      }
    }, /*#__PURE__*/React.createElement("span", null, reel.handle), /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--accent)"
      }
    }, "\u25CF AI Voiceover")), beat.endcard ? /*#__PURE__*/React.createElement(EndCard, {
      question: reel.comment_prompt,
      handle: reel.handle,
      S: S
    }) : /*#__PURE__*/React.createElement(Captions, {
      beat: beat,
      localT: localT,
      mode: mode,
      S: S
    })), /*#__PURE__*/React.createElement("div", {
      className: "transport",
      style: {
        width: W
      }
    }, /*#__PURE__*/React.createElement("button", {
      className: "play",
      onClick: toggle
    }, playing ? /*#__PURE__*/React.createElement("svg", {
      width: "18",
      height: "18",
      viewBox: "0 0 24 24",
      fill: "currentColor"
    }, /*#__PURE__*/React.createElement("rect", {
      x: "6",
      y: "5",
      width: "4",
      height: "14",
      rx: "1"
    }), /*#__PURE__*/React.createElement("rect", {
      x: "14",
      y: "5",
      width: "4",
      height: "14",
      rx: "1"
    })) : /*#__PURE__*/React.createElement("svg", {
      width: "18",
      height: "18",
      viewBox: "0 0 24 24",
      fill: "currentColor"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M8 5v14l11-7z"
    }))), /*#__PURE__*/React.createElement("div", {
      className: "track",
      onClick: e => {
        const r = e.currentTarget.getBoundingClientRect();
        setT((e.clientX - r.left) / r.width * reel.duration);
      }
    }, reel.beats.map((b, i) => /*#__PURE__*/React.createElement("span", {
      key: i,
      className: "seg",
      style: {
        left: b.start / reel.duration * 100 + "%",
        width: (b.end - b.start) / reel.duration * 100 + "%"
      }
    })), /*#__PURE__*/React.createElement("span", {
      className: "fill",
      style: {
        width: t / reel.duration * 100 + "%"
      }
    })), /*#__PURE__*/React.createElement("span", {
      className: "time"
    }, t.toFixed(1), "s")));
  }
  window.ReelKit = {
    ReelPlayer
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/reel/ReelPlayer.jsx", error: String((e && e.message) || e) }); }

// ui_kits/reel/data.js
try { (() => {
// Reel UI kit — sample reel timeline lifted from the pipeline
// (renderer/content/posts/2026-06-03_prompt-injection-agents.json → video).
// 26s, 5 beats, highlight captions, narrated (AI voiceover, labelled).
// Each beat references a slide background; words[] are relative-to-beat seconds
// (from Whisper alignment) and drive word/highlight caption modes.
window.REEL = {
  id: "prompt-injection-agents",
  theme: "defensive",
  handle: "@chron0s_cyb3r_w0rld.ai",
  bgDir: "../../assets/backgrounds/blue",
  duration: 26,
  caption_mode: "highlight",
  comment_prompt: "Would your agent trust a webpage it was told to summarize?",
  beats: [{
    start: 0,
    end: 5,
    bg: "01_cover.png",
    purpose: "hook",
    caption: "The weirdest AI attack hides where your agent reads.",
    words: [["The", 0, 0.1], ["weirdest", 0.1, 0.46], ["AI", 0.46, 0.7], ["attack", 0.7, 1.22], ["hides", 1.22, 1.5], ["where", 1.5, 1.76], ["your", 1.76, 1.88], ["agent", 1.88, 2.12], ["reads.", 2.12, 2.64]]
  }, {
    start: 5,
    end: 11,
    bg: "03_risk.png",
    purpose: "context",
    caption: "It hides in the content, not the chat box.",
    words: [["It", 0.2, 0.4], ["hides", 0.4, 0.8], ["in", 0.8, 0.95], ["the", 0.95, 1.1], ["content,", 1.1, 1.7], ["not", 2.0, 2.3], ["the", 2.3, 2.5], ["chat", 2.5, 2.9], ["box.", 2.9, 3.4]]
  }, {
    start: 11,
    end: 17,
    bg: "06_defense.png",
    purpose: "defense",
    caption: "Isolate untrusted content. Limit tools. Log every action.",
    words: [["Isolate", 0.2, 0.8], ["untrusted", 0.8, 1.5], ["content.", 1.5, 2.1], ["Limit", 2.4, 2.9], ["tools.", 2.9, 3.4], ["Log", 3.8, 4.1], ["every", 4.1, 4.5], ["action.", 4.5, 5.1]]
  }, {
    start: 17,
    end: 22,
    bg: "07_takeaway.png",
    purpose: "takeaway",
    caption: "External content is user input in a costume."
  }, {
    start: 22,
    end: 26,
    bg: "08_cta.png",
    purpose: "cta",
    endcard: true,
    caption: "Comment + save."
  }]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/reel/data.js", error: String((e && e.message) || e) }); }

__ds_ns.BrandMark = __ds_scope.BrandMark;

__ds_ns.Chip = __ds_scope.Chip;

__ds_ns.ClaimTag = __ds_scope.ClaimTag;

__ds_ns.Headline = __ds_scope.Headline;

__ds_ns.Kicker = __ds_scope.Kicker;

__ds_ns.Pagination = __ds_scope.Pagination;

__ds_ns.Subline = __ds_scope.Subline;

__ds_ns.SlideBackground = __ds_scope.SlideBackground;

__ds_ns.SlideShell = __ds_scope.SlideShell;

})();
