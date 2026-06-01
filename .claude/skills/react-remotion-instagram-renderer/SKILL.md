---
name: react-remotion-instagram-renderer
description: Optional React, Tailwind, Playwright, and Remotion rendering layer for branded Instagram carousel images and Reel-style videos. Use when asked to turn approved structured social content or an existing ai-ugc-pipeline post package into deterministic carousel PNG/JPG slides, source-controlled visual templates, Remotion MP4 videos, or a reusable rendering pipeline for AI-in-cybersecurity UGC content.
---

# React/Remotion Instagram Renderer Skill

Use this skill when a user wants **source-controlled, repeatable visual rendering** for Instagram carousels or short-form videos. This skill is an optional sibling to `ai-cybersecurity-ugc-carousel`: that skill creates the content strategy, scripts, captions, and QA; this skill turns approved structured content into branded visual assets.

> Preserve the manual-first pipeline. React and Remotion improve repeatability and polish, but they do not replace human review, Canva/Figma/CapCut/manual upload paths, or cybersecurity credibility checks.

## When a Project Folder Exists

If the user provides or references `ai-ugc-pipeline`, inspect the existing `pipeline` folder before designing or implementing the renderer. Prioritize these files if present.

| File | Why it matters |
| --- | --- |
| `pipeline/content/POST_TEMPLATE.md` | Defines the post data the renderer should map into JSON. |
| `pipeline/content/WEEK_1_POSTS.md` | Provides real fixtures and initial render tests. |
| `pipeline/content/VISUAL_PROMPT_BANK.md` | Defines the dark cinematic visual style, pillar accents, and no-rendered-text rule. |
| `pipeline/content/QA_CHECKLIST.md` | Defines source, safety, defender-value, readability, platform, and media-rights gates. |
| `pipeline/media/VIDEO_ASSEMBLY_WORKFLOW.md` | Defines Reel packaging, caption/audio expectations, and manual upload conventions. |
| `pipeline/media/OPEN_SOURCE_EVALUATION_MATRIX.md` | Defines production-safe vs R&D-only media tool choices. |

Do not invent a parallel workflow if these files exist. The renderer should attach after approved content exists and produce upload-ready assets that fit the current folder conventions.

## Choose the Rendering Route

| User need | Route | Output |
| --- | --- | --- |
| Static carousel slides, exact typography, repeatable branding, batch exports | React + Tailwind + Playwright screenshots | One PNG/JPG per slide, default `1080x1350`; optional `1080x1080` variant |
| Vertical Reel, motion captions, paced narration, b-roll layers, audio bed | Remotion composition | `1080x1920`, `30fps` MP4 plus optional poster frame |
| A one-off concept image with no source-controlled layout requirement | Image generation/editing route | Final image file, not a React project |
| API publishing or scheduling | Keep separate | Manual upload first; API later with approval gate |

Do not build this layer if the user only needs a caption, hook bank, or post idea. Invoke the content skill first when the post itself is not yet written.

## Standard Workflow

1. **Confirm approved content exists.** Require a slide script, headline, caption, source notes, alt text, visual direction, and QA status. If missing, create or request those before rendering.
2. **Normalize content into data.** Prefer JSON for renderable assets. Markdown is acceptable as the authoring source if converted into the same schema.
3. **Preserve pipeline metadata.** Carry forward post ID, pillar, status, audience, claim tags, score, sources, upload filenames, and media-license fields.
4. **Define brand tokens.** Use a dark cyber base, one accent color per pillar/post, consistent type scale, safe margins, and a small unobtrusive handle/logo.
5. **Render the carousel.** Build React components, run a local preview, and export screenshots with Playwright at the exact target size.
6. **Render the Reel if requested.** Use the same content data plus timing, narration, b-roll, subtitle, music, SFX, and license fields in a Remotion composition.
7. **Run QA gates.** Check resolution, text overflow, safe areas, contrast, filename order, alt-text count, source notes, media licenses, and cybersecurity safety.
8. **Package for manual upload.** Deliver final assets, captions, alt text, hashtags, source notes, license records, and a posting checklist.

## Content Data Schema

Use one post-level JSON object. Keep field names stable so future automation can target them. When mapping from an existing pipeline Markdown post, do not silently guess missing facts.

```json
{
  "post_id": "2026-06-01-ai-phishing-awareness",
  "date": "2026-06-01",
  "slug": "ai-phishing-awareness",
  "platform": "instagram",
  "format": "carousel",
  "status": "approved",
  "pillar": "offensive_ai",
  "audience": "security_practitioners",
  "core_claim": "AI can make phishing training that depends on obvious red flags less reliable.",
  "claim_tags": ["scenario", "practitioner_takeaway"],
  "score": { "credibility": 4, "relevance": 5, "novelty": 4, "visual_drama": 5, "defender_usefulness": 5, "total": 23 },
  "canvas": { "width": 1080, "height": 1350, "safe_margin": 96 },
  "brand": {
    "handle": "@your_handle",
    "pillar_accent": "offensive_ai",
    "palette": { "bg": "#05070d", "fg": "#f8fafc", "accent": "#22d3ee", "danger": "#ef4444" },
    "font_stack": "Inter, Satoshi, Space Grotesk, system-ui, sans-serif"
  },
  "upload_package": {
    "folder": "pipeline/renders/2026-06-01-ai-phishing-awareness",
    "filename_prefix": "2026-06-01-ai-phishing-awareness",
    "caption_file": "caption.txt",
    "alt_text_file": "alt_text.txt",
    "sources_file": "sources.md",
    "licenses_file": "LICENSES.md"
  },
  "slides": [
    {
      "slide": 1,
      "role": "cover",
      "on_slide_copy": "AI PHISHING MADE OLD TRAINING OBSOLETE",
      "subline": "The risk is personalization at scale.",
      "visual_prompt": "cinematic AI cybersecurity scene, dark lower-third, no rendered text, no logos",
      "background_asset": "assets/backgrounds/2026-06-01-ai-phishing-awareness/01.png",
      "cta": "SWIPE →"
    }
  ],
  "caption": "...",
  "hashtags": ["#AI", "#Cybersecurity"],
  "alt_text": ["Slide 1 description..."],
  "sources": [{ "source": "Source title", "link": "https://example.com", "supports": "Which claim this source supports.", "confidence": "high", "claim_tag": "reported_fact" }],
  "asset_licenses": [{ "asset": "assets/backgrounds/.../01.png", "source": "generated|stock|owned|existing_pipeline_asset", "license_or_terms": "...", "commercial_use_allowed": true }],
  "qa": { "fact_checked": true, "sources_present": true, "alt_text_count_matches_slides": true, "no_exploit_steps": true, "manual_review_required": true }
}
```

For Reels, add a `video` object with `duration_seconds`, `fps`, `narration`, `beats`, `subtitle_style`, `music`, `sfx`, `licenses`, and `export_name`.

## Canonical Carousel Roles

For the existing AI-cyber pipeline, prefer the eight-slide arc below.

| Slide | Role | Component |
| --- | --- | --- |
| 1 | `cover` | `<CoverSlide>` |
| 2 | `context` | `<ContextSlide>` |
| 3 | `risk` | `<RiskSlide>` |
| 4 | `mechanism` | `<MechanismSlide>` |
| 5 | `failure_point` | `<FailurePointSlide>` |
| 6 | `defense` | `<DefenseSlide>` |
| 7 | `takeaway` | `<TakeawaySlide>` |
| 8 | `cta` | `<CtaSlide>` |

The renderer can support other lengths later, but the first implementation should handle this canonical structure cleanly.

## React Carousel Architecture

Use small, bounded components. Recommended structure:

| Component | Responsibility |
| --- | --- |
| `<CarouselDeck>` | Maps post JSON to slides and sets canvas size. |
| `<CarouselSlide>` | Shared layout shell with safe area, background, overlay, brand mark, pagination, and CTA zone. |
| `<CoverSlide>` | Large hero typography, strong visual focal point, concise subline, and swipe cue. |
| `<ContextSlide>` | Explains what changed without overloading the slide. |
| `<RiskSlide>` | Communicates practical security impact. |
| `<MechanismSlide>` | Shows safe high-level process only, with no exploit strings or operational details. |
| `<FailurePointSlide>` | Highlights the weak process, policy, or control. |
| `<DefenseSlide>` | Shows the practitioner action or mitigation. |
| `<TakeawaySlide>` | One memorable lesson with strong contrast and minimal text. |
| `<CtaSlide>` | Question, save/follow prompt, and optional credibility cue. |

The Playwright export script should load each slide route or query parameter, wait for fonts/images, screenshot the slide root at `deviceScaleFactor: 1`, and name files with stable ordering such as `YYYY-MM-DD_slug_01_cover.png`.

## Remotion Reel Architecture

Use Remotion when the user asks for video, Reel, motion captions, narration, or a 9:16 short. Recommended structure:

| Composition piece | Responsibility |
| --- | --- |
| `<ReelComposition>` | Global `1080x1920`, `30fps` canvas, duration, brand theme, audio stack, and scene mapping. |
| `<Scene>` | One timed content beat with background, motion, headline, and subtitles. |
| `<CaptionLayer>` | Burned-in readable subtitles with safe margins. |
| `<AudioBed>` | Music/SFX under narration, never overpowering speech. |
| `<SourceEndCard>` | Optional trust cue, CTA, and follow/save prompt. |

Default vertical export is `1080x1920`, `30fps`, H.264 MP4, and 20–45 seconds unless the user specifies otherwise. Keep video claims as high-level explanations, not exploit walkthroughs.

## Visual Design Rules

The target is **cinematic AI-cyber editorial**, not generic SaaS cards. Use a dark base, one pillar accent, high-contrast text, strong negative space, and disciplined hierarchy.

| Layer | Rule |
| --- | --- |
| Typography | Use 2–3 levels only: huge condensed headline, compact subline, tiny metadata/CTA. Avoid paragraph walls. |
| Composition | Keep critical text inside safe margins. Covers should protect a dark lower-third or equivalent text zone. |
| Color | Offensive AI = cyan; model security = electric blue; data leakage = neon green; defensive AI = teal; governance = amber/desaturated blue; myth-busting = red-to-blue split. |
| Imagery | Use text-free, logo-free, credential-free, payload-free visuals. Keep exploit mechanisms abstract. |
| Texture | Use subtle noise, glow, gradients, scanlines, code fragments, or HUD motifs sparingly. Do not reduce readability. |
| Brand | Handle/logo should be consistent but quiet. The idea should be louder than the watermark. |
| Accessibility | Maintain strong contrast and mobile readability. Body copy should survive a phone screen at arm’s length. |

## QA Gates

Before delivery, verify:

| Gate | Pass condition |
| --- | --- |
| Resolution | Carousel exports exactly match requested size; Reels export `1080x1920` unless specified. |
| Overflow | No clipped headline, hidden CTA, subtitles outside safe zones, or text outside safe margins. |
| Readability | Text is legible on mobile; background does not fight the copy. |
| Consistency | Slide order, filename order, accent color, type scale, and brand mark are consistent. |
| Source support | Content JSON carries claim tags, source links, and source confidence/claim support. |
| Cyber safety | No payloads, evasion details, fake CVEs, unsupported breach claims, credential theft flows, or misleading panic. |
| Media rights | Audio, b-roll, stock assets, generated visuals, and model outputs are logged in `LICENSES.md` or equivalent. |
| Manual upload | Caption, hashtags, alt text, source notes, licenses, and posting checklist are included. |

If any gate fails, revise the source and re-export instead of patching final images manually.

## Delivery Format

For a rendered post package, deliver:

| File/folder | Purpose |
| --- | --- |
| `content/post.json` | Source data for carousel and/or Reel. |
| `YYYY-MM-DD_slug_01_cover.png` through `YYYY-MM-DD_slug_08_cta.png` | Final upload-ready slide images. |
| `YYYY-MM-DD_slug_reel.mp4` | Final Reel if requested. |
| `caption.txt` | Caption, hashtags, and comment prompt. |
| `alt_text.txt` | Slide-by-slide alt text. |
| `sources.md` | Claims, links, and credibility notes. |
| `LICENSES.md` | Required when stock/generative/audio/video assets need rights tracking. |
| `render_qa_checklist.md` | Pass/fail rendering and cybersecurity review. |

Keep this rendering layer optional. If time is tight, the correct fallback is still manual Canva/Figma/CapCut assembly using the same approved content package.
