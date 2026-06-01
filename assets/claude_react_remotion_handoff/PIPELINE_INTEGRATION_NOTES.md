# Pipeline Integration Notes for React/Remotion Renderer

**Prepared by:** Manus AI  
**Prepared for:** Jon / D-Sports  
**Purpose:** Explain how the optional React/Remotion renderer should attach to the existing `ai-ugc-pipeline/pipeline` folder without changing the content strategy or manual upload workflow.

## 1. Integration Position

Claude’s existing pipeline already does the important upstream work: idea scoring, source checks, slide scripting, caption drafting, visual prompt direction, QA, and upload packaging. The React/Remotion renderer should attach only after a post is **approved enough to assemble**.

> The renderer is not a replacement for the pipeline. It is a deterministic asset factory for posts that already passed the content workflow.

| Existing pipeline responsibility | Renderer responsibility |
| --- | --- |
| Decide whether the topic is credible and useful. | Refuse to render if required credibility fields are missing. |
| Write the carousel script, caption, hashtags, and alt text. | Convert those fields into renderable JSON and final upload files. |
| Define the visual prompt and pillar style. | Encode the visual direction as reusable tokens, backgrounds, and layouts. |
| Run source, safety, readability, and media-rights QA. | Add render checks for overflow, resolution, filenames, and missing files. |
| Keep manual upload viable. | Export upload folders that Jon can use without opening the renderer codebase. |

## 2. Files Claude Should Read First

When implementing this add-on inside Jon’s repo, Claude should inspect these files before writing renderer code.

| Priority | File | Why it matters |
| --- | --- | --- |
| 1 | `pipeline/content/POST_TEMPLATE.md` | The renderer schema should map from this template. |
| 2 | `pipeline/content/WEEK_1_POSTS.md` | Provides real render fixtures and filename expectations. |
| 3 | `pipeline/content/VISUAL_PROMPT_BANK.md` | Defines the visual language and pillar accents. |
| 4 | `pipeline/content/QA_CHECKLIST.md` | Defines required content and safety gates. |
| 5 | `pipeline/media/VIDEO_ASSEMBLY_WORKFLOW.md` | Defines Reel export shape and manual video package conventions. |
| 6 | `pipeline/media/OPEN_SOURCE_EVALUATION_MATRIX.md` | Defines production-safe vs R&D-only voice/video tool choices. |

## 3. Markdown-to-JSON Adapter Contract

The current content pipeline is human-readable Markdown. The renderer should introduce a JSON adapter rather than asking Jon to rewrite everything by hand.

| Markdown field | JSON field | Renderer behavior |
| --- | --- | --- |
| Post ID | `post_id`, `date`, `slug` | Parse or manually enter once; use for filenames. |
| Pillar | `pillar`, `brand.pillar_accent` | Determines accent color and visual motif. |
| Status | `status` | Render only if status is acceptable or Jon explicitly requests a draft preview. |
| Audience | `audience` | Helps choose density and terminology. |
| Core claim | `core_claim` | Must appear in source notes and QA. |
| Claim tag | `claim_tags[]` | Carry into QA and sources. |
| Score | `score` | Preserve for prioritization; do not use for layout decoration unless useful. |
| Source Notes | `sources[]` | Every source should include what claim it supports. |
| Cover | `slides[0]` | Role must be `cover`; use as hero. |
| Carousel script | `slides[]` | Map rows to canonical roles. |
| Visual direction / prompts | `visual_prompt`, `background_asset` | Use for backgrounds; never render prompt text onto images. |
| Caption / hashtags | `caption`, `hashtags[]`, `caption_file` | Export as `caption.txt`. |
| Alt text | `alt_text[]` | Export as `alt_text.txt` and validate count against slide count. |
| Upload package | `upload_package` | Determines final folder and expected file list. |

If the adapter cannot confidently map a field, it should fail validation and ask for a human decision. It should not silently invent source notes, statistics, or slide copy.

## 4. Week-1 Render Test Strategy

Use the Week-1 posts as practical fixtures. Do not start with synthetic examples that look good but fail the real content shape.

| Test | Recommended post | Why |
| --- | --- | --- |
| First static carousel | Week-1 Post 1 | It has a clear hook, existing reusable assets, and a complete eight-slide arc. |
| Second static carousel | Week-1 Post 4 or 5 | These require new text-free visuals, proving the renderer handles fresh image prep. |
| First Reel | Post 1 or the strongest short-form candidate | It should reuse the same hook, source notes, and visual system. |
| Batch smoke test | Posts 1–5 | Confirms filename sorting, schema validation, and QA output across a week. |

The renderer should support draft previews, but Jon should be able to distinguish `draft`, `approved`, and `upload_ready` outputs.

## 5. Output Folder Contract

Final packages should be simple enough for manual posting. The suggested path is `pipeline/renders/<YYYY-MM-DD_slug>/`, but Claude can choose another local path if it documents it clearly and keeps the package shape stable.

```text
pipeline/renders/YYYY-MM-DD_slug/
  YYYY-MM-DD_slug_01_cover.png
  YYYY-MM-DD_slug_02_context.png
  YYYY-MM-DD_slug_03_risk.png
  YYYY-MM-DD_slug_04_mechanism.png
  YYYY-MM-DD_slug_05_failure-point.png
  YYYY-MM-DD_slug_06_defense.png
  YYYY-MM-DD_slug_07_takeaway.png
  YYYY-MM-DD_slug_08_cta.png
  YYYY-MM-DD_slug_reel.mp4        # optional
  caption.txt
  alt_text.txt
  sources.md
  LICENSES.md                    # required when media/audio/model licenses must be tracked
  render_qa_checklist.md
```

The filename prefix should come from the post ID or upload package metadata. The renderer should never rely on manual renaming after export.

## 6. What Not to Automate Yet

The biggest failure mode is overbuilding. The current opportunity is a polished renderer, not a full content operating system.

| Do not build yet | Reason |
| --- | --- |
| Auto-publishing to Instagram | Manual upload and approval should remain the default. |
| A full SaaS dashboard | It increases scope without proving the asset-generation value. |
| Autonomous research and claim generation | The existing content pipeline already defines source and QA discipline. |
| Auto-generated exploit visuals | This risks unsafe or misleading content. Keep mechanism visuals abstract. |
| Hidden media-license assumptions | Every voice, b-roll, music, and model source needs explicit tracking. |
| Dependency on unavailable design skills | Use design principles directly; do not require tools that may not exist in Claude’s environment. |

## 7. Practical First Implementation

The smallest useful implementation should include one normalized JSON post, four slide components, a Playwright export command, and a render QA checklist.

| Slice | Minimum acceptance test |
| --- | --- |
| Schema | Week-1 Post 1 validates without invented fields. |
| Components | Cover, context, defense, and CTA render at `1080x1350`. |
| Export | PNG files follow the pipeline filename convention. |
| Package | `caption.txt`, `alt_text.txt`, `sources.md`, and `render_qa_checklist.md` are generated. |
| QA | Wrong dimensions, missing alt text, missing source notes, and overflow fail loudly. |
| Remotion stub | A 20–30 second composition can be previewed later without blocking static carousel shipping. |

Ship static carousel rendering first. Remotion should be added only after the static export path is proven with real Week-1 content.
