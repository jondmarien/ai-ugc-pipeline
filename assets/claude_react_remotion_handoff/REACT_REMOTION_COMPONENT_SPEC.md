# React/Remotion Component Specification

**Prepared by:** Manus AI  
**Prepared for:** Jon / D-Sports  
**Purpose:** Define the component architecture, content schema, and visual system for an optional React/Playwright and Remotion rendering layer that fits the existing `ai-ugc-pipeline/pipeline` folder.

## 1. Component Philosophy

This renderer should be treated as a **template engine for premium social assets**, not as a general-purpose web app. Claude’s existing pipeline already defines what the posts say, how claims are checked, and how uploads are packaged. The renderer’s job is to make approved content look consistently strong.

> The content layer decides what to say. The rendering layer decides how approved content becomes consistent images and videos.

The component system should make strong visual decisions by default. A future agent should not need to reinvent typography, safe areas, gradients, pillar colors, or slide roles every time it receives a new carousel script.

## 2. Recommended Project Structure

A minimal local renderer can live beside the existing `pipeline/` folder.

| Path | Purpose |
| --- | --- |
| `renderer/content/posts/*.json` | Normalized render data generated from `pipeline/content/POST_TEMPLATE.md` or `WEEK_1_POSTS.md`. |
| `renderer/src/components/carousel/` | Static slide components for carousel image export. |
| `renderer/src/components/reel/` | Remotion-specific composition and scene components. |
| `renderer/src/design/tokens.ts` | Brand colors, pillar accents, spacing, type scale, safe margins, and motion presets. |
| `renderer/src/lib/schema.ts` | TypeScript types or Zod schema for post data validation. |
| `renderer/scripts/export-carousel.ts` | Playwright screenshot export script. |
| `renderer/remotion/Root.tsx` | Remotion composition registration. |
| `pipeline/renders/<YYYY-MM-DD_slug>/` | Upload-ready rendered package that mirrors the manual pipeline. |

Keep the source renderer and final upload packages separate. Jon should not need to open the codebase to manually post a finished carousel or Reel.

## 3. Core Data Types

Use JSON as the stable source of truth for rendering. Markdown remains the human authoring format; JSON is the render adapter.

| Type | Required fields | Notes |
| --- | --- | --- |
| `PostData` | `post_id`, `slug`, `pillar`, `status`, `audience`, `core_claim`, `claim_tags`, `score`, `canvas`, `brand`, `slides`, `caption`, `hashtags`, `alt_text`, `sources`, `upload_package`, `qa` | Root object. One file per post. |
| `ScoreSpec` | `credibility`, `relevance`, `novelty`, `visual_drama`, `defender_usefulness`, `total` | Mirrors `IDEA_BACKLOG.md` / `WEEK_1_POSTS.md` scoring. |
| `CanvasSpec` | `width`, `height`, `safe_margin` | Default carousel is `1080x1350`; Reel is `1080x1920`. |
| `BrandSpec` | `handle`, `palette`, `font_stack`, `accent_name`, `pillar_accent` | Accent should follow `VISUAL_PROMPT_BANK.md`. |
| `SlideData` | `slide`, `role`, `on_slide_copy`, `visual_direction`, `visual_prompt`, `background_asset`, `notes` | `role` drives component choice. |
| `SourceNote` | `source`, `link`, `supports`, `confidence`, `claim_tag` | Supports the QA source gate. |
| `UploadPackage` | `folder`, `filename_prefix`, `expected_files`, `caption_file`, `alt_text_file`, `sources_file`, `licenses_file` | Mirrors manual upload conventions. |
| `VideoSpec` | `enabled`, `duration_seconds`, `fps`, `narration`, `beats`, `subtitle_style`, `music`, `sfx`, `licenses`, `export_name` | Optional. Required only for Reels. |

## 4. Canonical Slide Roles

Use Claude’s existing eight-slide arc. Do not rename these casually; role names are a useful interface between content, layout, and export filenames.

| Slide | Role | Component | Purpose |
| --- | --- | --- | --- |
| 1 | `cover` | `<CoverSlide>` | Scroll-stopping hook, subline, visual identity, swipe cue. |
| 2 | `context` | `<ContextSlide>` | What changed, what happened, or what pattern the audience should understand. |
| 3 | `risk` | `<RiskSlide>` | Why the topic matters in practical security terms. |
| 4 | `mechanism` | `<MechanismSlide>` | Safe high-level “how it works,” with no payloads or abuse steps. |
| 5 | `failure_point` | `<FailurePointSlide>` | Where teams/processes/tools are weak. |
| 6 | `defense` | `<DefenseSlide>` | Concrete mitigation, control, review step, or process change. |
| 7 | `takeaway` | `<TakeawaySlide>` | Memorable save-worthy lesson. |
| 8 | `cta` | `<CtaSlide>` | Specific comment question plus save/follow cue. |

## 5. Carousel Components

The carousel component architecture should be role-based. This keeps the design flexible without letting every slide become a one-off.

| Component | Props | Responsibility |
| --- | --- | --- |
| `<CarouselDeck>` | `post: PostData` | Iterates through slides, chooses slide component by role, and applies global theme. |
| `<CarouselSlide>` | `slide`, `post`, `children` | Shared canvas shell with background, gradient, safe area, brand mark, pagination, and CTA zone. |
| `<CoverSlide>` | `slide`, `post` | Hero headline, optional subline, dramatic image crop, and swipe cue. |
| `<ContextSlide>` | `slide`, `post` | Short context sentence with a clear before/after or pattern visual. |
| `<RiskSlide>` | `slide`, `post` | Impact statement with one strong visual metaphor. |
| `<MechanismSlide>` | `slide`, `post` | Abstract high-level mechanism; must not show exploit strings, payloads, or evasion. |
| `<FailurePointSlide>` | `slide`, `post` | Process or control gap visualization. |
| `<DefenseSlide>` | `slide`, `post` | Practical defender action with control/workflow imagery. |
| `<TakeawaySlide>` | `slide`, `post` | One memorable lesson with strong contrast and minimal copy. |
| `<CtaSlide>` | `slide`, `post` | Final question, save/follow prompt, and optional credibility/source cue. |

The default carousel should use exactly eight slides for Week-1. The system can support six to nine slides later, but the first build should match the shipped posts.

## 6. Slide Layout Contract

Every slide component should respect the same layout contract so exports stay consistent.

| Layout field | Standard |
| --- | --- |
| Canvas | Fixed pixel dimensions from `canvas.width` and `canvas.height`; default `1080x1350`. |
| Safe area | `safe_margin` on all sides; no critical text outside it. Use `96px` as the initial 1080-wide default. |
| Background | Text-free generated/stock/editorial visual, gradient, texture, or existing reusable asset. |
| Text stack | Kicker, headline/on-slide copy, subline/body, supporting label, CTA. Not every slide needs every level. |
| Lower-third | Covers should preserve a dark protected text zone or equivalent contrast protection. |
| Brand mark | Same position across all slides, usually quiet top or bottom corner. |
| Pagination | Optional `01/08` marker; keep subtle and consistent. |
| CTA | Cover can use `SWIPE →`; final slide should use save/follow/comment prompt. |

## 7. Visual Design Tokens

The default design system should come from `VISUAL_PROMPT_BANK.md`, not from a new unrelated visual identity.

| Token | Default value | Use |
| --- | --- | --- |
| `color.bg` | `#05070d` | Main cyber-black background. |
| `color.panel` | `rgba(2, 6, 23, 0.78)` | Text panels and lower thirds. |
| `color.fg` | `#f8fafc` | Primary text. |
| `color.muted` | `#94a3b8` | Metadata and secondary labels. |
| `accent.offensive_ai` | `#22d3ee` | Cyan for phishing/social-engineering/offensive-AI topics. |
| `accent.model_security` | `#3b82f6` | Electric blue for prompt injection, agent risks, model security. |
| `accent.data_leakage` | `#39ff88` | Neon green for data leakage and safe-path topics. |
| `accent.defensive_ai` | `#2dd4bf` | Cool teal for defensive-AI/SOC topics. |
| `accent.governance` | `#f59e0b` | Amber/desaturated blue for governance and shadow-AI topics. |
| `accent.myth_busting` | `#ef4444` + `#3b82f6` | Red-to-blue split for correction/debunking posts. |
| `font.headline` | Condensed bold sans | Covers and major slide claims. |
| `font.body` | Clean geometric sans | Subline and body copy. |
| `space.safe` | `96px` | Default safe margin for 1080-wide exports. |
| `radius.panel` | `28px` | Large rounded panels when used. |
| `shadow.glow` | Accent-colored soft glow | Use sparingly for focal points. |

Typography should use two or three hierarchy levels per slide. Overusing text sizes makes the slide look amateur. The headline should dominate; the subline should clarify; metadata should stay quiet.

## 8. Remotion Components

The Remotion layer should reuse the same post data and design tokens. It should not require a separate content-writing process.

| Component | Props | Responsibility |
| --- | --- | --- |
| `<ReelComposition>` | `post: PostData`, `video: VideoSpec` | Root `1080x1920`, `30fps` composition with total duration, audio, and scene mapping. |
| `<ReelScene>` | `beat`, `post`, `slide` | Timed visual beat using slide data, motion preset, and background media. |
| `<MotionHeadline>` | `text`, `preset`, `accent` | Animated hook or key sentence in first 1–2 seconds. |
| `<CaptionLayer>` | `narration`, `style` | Burned-in readable subtitles with safe margins. |
| `<BrollLayer>` | `asset`, `prompt`, `motion` | Background video/image layer with safe crop and overlay. |
| `<AudioBed>` | `music`, `sfx`, `narration` | Mixes music under narration; speech must remain dominant. |
| `<EndCard>` | `cta`, `handle`, `takeaway` | Final save/follow/comment prompt and memorable line. |

For most Reels, use 20–45 seconds at 30 fps. Segment the video into beats of roughly 3–6 seconds. Captions should be large, high-contrast, proofread, and limited to one or two lines at a time.

## 9. Motion and Audio Rules

Motion should add attention without creating chaos. Use slow push-ins, parallax, subtle scanline sweeps, terminal cursor blinks, network-node reveals, and restrained kinetic typography. Avoid constant spinning, overdone shake, or illegible subtitle animations.

| Media layer | Rule |
| --- | --- |
| Narration | Use short sentences and leave breathing room. Technical acronyms must be pronounced clearly and proofread in subtitles. |
| Music | Instrumental only, no vocals, dark cyber pulse or restrained industrial ambient. Keep it under the voice. |
| SFX | Use subtle UI clicks, data whooshes, low impacts, and risers. Cap at roughly three SFX per short. |
| Captions | Burned in for social viewing. Keep contrast strong and line length short. |
| End card | Ask one specific question or invite saving/following. Do not bury the CTA. |
| Licenses | Any voice, music, b-roll, or generated model must be logged in `LICENSES.md`. |

## 10. QA Contract

Before a render package is considered finished, Claude should check the following against `QA_CHECKLIST.md`.

| Check | Carousel requirement | Reel requirement |
| --- | --- | --- |
| Resolution | Exact `1080x1350` images unless a variant is requested | Exact `1080x1920`, `30fps`, H.264 MP4 |
| Text overflow | No clipped headline, hidden CTA, or text outside safe zones | No subtitles outside safe zones |
| Slide/scene order | Filenames sort in intended order | Beat timing matches narration and captions |
| Visual consistency | Same type scale, brand mark, and accent logic | Same design tokens and caption style |
| Accessibility | Mobile-readable contrast and sizing; alt text present | Captions readable with audio off |
| Source support | Sources and claim tags travel with the package | Sources and claim tags still match narration |
| Cybersecurity safety | No operational abuse details | No exploit walkthrough in narration or visuals |
| Media rights | Background assets are allowed for use | `LICENSES.md` covers voice, music, b-roll, and models |
| Upload readiness | `caption.txt`, `alt_text.txt`, `sources.md`, ordered PNGs | Reel MP4, caption/description, sources, and licenses included |

If QA fails, fix the source data or component logic and re-export. Do not manually patch final images unless Jon explicitly asks for a one-off emergency fix.
