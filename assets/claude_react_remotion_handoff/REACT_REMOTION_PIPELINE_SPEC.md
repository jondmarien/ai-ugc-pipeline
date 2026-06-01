# React/Remotion Pipeline Specification

**Prepared by:** Manus AI  
**Prepared for:** Jon / D-Sports  
**Purpose:** Define the optional end-to-end rendering pipeline from approved AI-cybersecurity content data to Instagram carousel images and Reel-style videos, aligned with the existing `ai-ugc-pipeline/pipeline` folder.

## 1. Pipeline Boundary

This renderer is only one layer in Jon’s larger content operation. It should not absorb research, scripting, caption writing, source verification, publishing, analytics, or API credentials. Those remain separate concerns.

| Pipeline stage | Owner | Renderer involvement |
| --- | --- | --- |
| Idea research and source review | `pipeline/content/CONTENT_PIPELINE.md` | None, except carrying source notes forward. |
| Carousel script and caption | `POST_TEMPLATE.md` / `WEEK_1_POSTS.md` | Consumes approved copy and metadata. |
| Visual direction | `VISUAL_PROMPT_BANK.md` plus renderer design tokens | Converts prompts/assets into component-ready backgrounds. |
| QA gate | `QA_CHECKLIST.md` | Surfaces required checks and adds render-specific checks. |
| Static slide rendering | React + Playwright renderer | Primary responsibility. |
| Reel rendering | Remotion renderer | Primary responsibility only when video is requested. |
| Upload and scheduling | Manual upload or future approval-gated API module | Renderer only creates files and metadata. |

> The renderer should be easy to remove. If it breaks, Jon can still publish manually using the same scripts, captions, visual prompts, and upload package.

## 2. Static Carousel Pipeline

The carousel pipeline should be deterministic. The same content JSON, assets, and component version should export the same slides.

| Step | Input | Process | Output |
| --- | --- | --- | --- |
| 1. Select approved post | Markdown package from `WEEK_1_POSTS.md` or `POST_TEMPLATE.md` | Confirm status, claim tags, source notes, caption, alt text, and QA readiness. | Approved post candidate. |
| 2. Normalize to JSON | Approved Markdown post | Map post ID, slug, pillar, score, cover, slide roles, copy, visual directions, sources, caption, and upload naming. | `renderer/content/posts/<post_id>.json` |
| 3. Prepare assets | Existing backgrounds, generated text-free visuals, icons, texture overlays | Place assets in stable paths and verify commercial/licensing comfort. | `renderer/assets/<post_id>/...` |
| 4. Preview in React | JSON plus components | Render each slide at fixed canvas size with safe margins. | Local preview routes. |
| 5. Export via Playwright | Preview routes | Screenshot each slide root at exact dimensions. | Ordered PNGs in a render package. |
| 6. QA exported images | PNG files plus source JSON | Check resolution, overflow, readability, ordering, brand consistency, and missing metadata. | Pass/fail checklist. |
| 7. Package for upload | Images, caption, hashtags, alt text, source notes | Bundle final assets and metadata using the manual convention. | `pipeline/renders/<YYYY-MM-DD_slug>/` or equivalent upload folder. |

## 3. Carousel File Naming

Match the existing content pipeline’s naming convention. Do not introduce `slide_` into filenames unless Jon explicitly changes the convention.

```text
YYYY-MM-DD_slug/
  YYYY-MM-DD_slug_01_cover.png
  YYYY-MM-DD_slug_02_context.png
  YYYY-MM-DD_slug_03_risk.png
  YYYY-MM-DD_slug_04_mechanism.png
  YYYY-MM-DD_slug_05_failure-point.png
  YYYY-MM-DD_slug_06_defense.png
  YYYY-MM-DD_slug_07_takeaway.png
  YYYY-MM-DD_slug_08_cta.png
  caption.txt
  alt_text.txt
  sources.md
```

The slide number must always be zero-padded. The filename role should come from the canonical slide role. Do not rely on manual sorting in the upload UI.

## 4. Markdown-to-JSON Mapping

The renderer should treat Markdown as the human editing format and JSON as the render format.

| Markdown section | JSON destination |
| --- | --- |
| `Post ID` | `post_id` |
| Date/slug from `Post ID` or upload filename | `date`, `slug`, `filename_prefix` |
| `Pillar` | `pillar` and `brand.pillar_accent` |
| `Status` | `status` |
| `Audience` | `audience` |
| `Core claim` | `core_claim` |
| `Claim tag` | `claim_tags[]` |
| `Score` | `score` object |
| `Source Notes` table | `sources[]` with `confidence` and `claim_supported` |
| `Cover` | slide 1 plus `cover` metadata |
| `Carousel script` table | `slides[]` with `role`, `on_slide_copy`, `visual_direction`, and notes |
| `Caption` | `caption` plus `hashtags[]` |
| `Alt text` | `alt_text[]` |
| `Assets / upload` | `upload_package` and `asset_reuse` fields |

If a required field is missing, the renderer should fail validation and ask for completion instead of guessing.

## 5. Playwright Export Workflow

The Playwright script should open a local preview route for each slide, wait for assets and fonts, screenshot the exact slide element, and write the file to the export folder. The script should fail loudly if an image cannot load or if the rendered element has the wrong size.

| Export setting | Recommendation |
| --- | --- |
| Viewport | Match canvas dimensions exactly, default `1080x1350`. |
| Device scale | Use `deviceScaleFactor: 1` unless a higher-res export is intentionally requested. |
| Selector | Screenshot the slide root, not the entire browser page. |
| Readiness | Wait for fonts, images, and any layout-stabilizing animation state. |
| Background | Use opaque canvas background unless transparent exports are explicitly needed. |
| Validation | Verify image dimensions, non-empty output, filename convention, missing alt text, and missing sources. |
| Failure behavior | Stop export on missing asset, wrong resolution, overflow, or empty screenshot. |

## 6. Reel Pipeline

The Reel pipeline should reuse the carousel content where possible, but it needs timing data, narration, caption blocks, b-roll, audio, and licenses. The same hook, context, defender value, and CTA can become a 20–45 second vertical video.

| Step | Input | Process | Output |
| --- | --- | --- | --- |
| 1. Select post for Reel | Approved carousel JSON | Decide whether the topic works as motion/narration. | Reel candidate. |
| 2. Add video spec | `VideoSpec` object | Define duration, fps, beats, narration, subtitle style, music/SFX intent, and export name. | Renderable video data. |
| 3. Prepare audio assets | Narration, music, SFX | Use approved TTS/manual recording and instrumental background music. Log rights. | `voice.wav`, `music.mp3`, SFX files, `LICENSES.md`. |
| 4. Prepare b-roll | Background clips/images | Use stock, generated visuals, animated stills, or the carousel background assets. | `broll/01.mp4`, `broll/02.mp4`, etc. |
| 5. Preview Remotion | JSON, assets, Remotion components | Check scene timing, captions, readability, CTA, and audio balance. | Local composition preview. |
| 6. Render MP4 | Remotion CLI/project renderer | Export vertical MP4. | `YYYY-MM-DD_slug_reel.mp4`. |
| 7. QA video | MP4 plus metadata | Check duration, audio levels, subtitle safe areas, claim safety, and media rights. | Gate 7 pass/fail. |

## 7. Video Package Shape

Mirror `VIDEO_ASSEMBLY_WORKFLOW.md` so manual and automated video paths stay compatible.

```text
YYYY-MM-DD_slug/
  voice.wav            # license-clear narration, if generated/recorded
  broll/
    01.mp4
    02.mp4
  music.mp3            # licensed instrumental bed, optional
  hook.png             # optional transparent hook overlay/poster asset
  cta.png              # optional end card/poster asset
  subs.srt             # generated/proofread if external subtitles are used
  YYYY-MM-DD_slug_reel.mp4
  caption.txt
  alt_text.txt
  sources.md
  LICENSES.md
```

If Remotion burns captions directly from JSON rather than `subs.srt`, the package should still include the caption text or subtitle transcript for review.

## 8. Video Timing Model

A simple timing model is enough for the first version. Each beat should map to one idea, not one paragraph.

```json
{
  "video": {
    "enabled": true,
    "duration_seconds": 32,
    "fps": 30,
    "export_name": "2026-06-02_ai-phishing-training_reel.mp4",
    "beats": [
      {
        "start": 0,
        "end": 4,
        "slide_ref": 1,
        "purpose": "hook",
        "motion": "slow push-in over cover visual",
        "caption": "AI phishing made old training obsolete."
      },
      {
        "start": 4,
        "end": 9,
        "slide_ref": 2,
        "purpose": "context",
        "motion": "parallax inbox and red flags dissolving",
        "caption": "Old red flags are fading."
      }
    ],
    "narration": [
      {
        "start": 0,
        "end": 4,
        "text": "AI phishing made old training obsolete."
      }
    ]
  }
}
```

For a first Remotion implementation, use 3–6 second beats, 30 fps, and one caption block per narration span. Do not force every carousel slide into the video if it hurts pacing.

## 9. Music and SFX Guidance

The media layer already covers music and SFX sourcing. The renderer should store prompts, file paths, mixing intent, and license records; it should not hide licensing details inside code.

| Audio element | Recommendation |
| --- | --- |
| Narration | 20–45 seconds, direct, clear, technically accurate, no exploit detail. |
| Voice engine | Prefer the currently evaluated production-safe path such as VoxCPM2 if using OSS synthetic voice; do not use F5-TTS official weights for commercial posts. |
| Music | Instrumental only, no vocals, dark cyber pulse or restrained industrial ambient. |
| SFX | Low-volume UI clicks, glitch hits, data whooshes, and subtle risers; use sparingly. |
| Mix | Narration should dominate; music should support tension without masking speech. |
| License logging | `LICENSES.md` must name source, license/terms, commercial-use status, and any disclosure requirement. |

## 10. QA Checklist

Every rendered package should include a QA file. It should reference the repo’s existing `QA_CHECKLIST.md` and add renderer-specific checks.

| QA area | Question | Pass/fail |
| --- | --- | --- |
| Resolution | Do all images/videos match the requested dimensions? |  |
| Ordering | Do filenames sort in the correct slide/scene order? |  |
| Text overflow | Is all critical text inside safe margins? |  |
| Mobile readability | Can the cover and subtitles be read quickly on a phone? |  |
| Brand consistency | Are pillar accent, fonts, spacing, and marks consistent? |  |
| Source support | Are factual claims sourced, qualified, or framed as scenario/opinion? |  |
| Safety | Are exploit details, payloads, evasion steps, and fake panic absent? |  |
| Accessibility | Does every slide have alt text and every Reel have readable captions? |  |
| Media rights | Are music, footage, voice, and model licenses logged where used? |  |
| Manual upload | Are caption, hashtags, alt text, source notes, and final files packaged? |  |

## 11. Delivery Package Shape

A complete rendered post should use this structure.

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
  LICENSES.md                    # required if any video/audio/generated asset license must be tracked
  render_qa_checklist.md
```

The renderer source can also keep development artifacts under `renderer/`, but the final package should be simple enough for manual posting.

## 12. Implementation Sequence

Claude should recommend implementation in small, testable slices.

| Slice | Goal | Done when |
| --- | --- | --- |
| 1. Schema | Define `PostData`, `SlideData`, `UploadPackage`, `SourceNote`, and `VideoSpec`. | Week-1 Post 1 validates cleanly. |
| 2. Markdown adapter | Convert one existing Week-1 Markdown post to JSON manually or with a script. | No fields guessed; missing fields are flagged. |
| 3. Carousel preview | Render cover, context, defense, and CTA roles locally. | Preview matches `1080x1350` and pillar accent. |
| 4. Playwright export | Export PNGs from preview routes. | Files match target dimensions and pipeline filenames. |
| 5. Full carousel | Render all eight slides from one real post. | QA passes and manual upload package exists. |
| 6. Second topic | Render Post 4 or 5 with new text-free visuals. | System handles non-reused assets. |
| 7. Remotion proof | Render a 20–30 second Reel from the same post data. | MP4 exports with readable captions, clean timing, and `LICENSES.md`. |
| 8. Batch readiness | Add a command that renders multiple posts. | Weekly batch can export without per-slide manual work. |

This sequence keeps the system useful even if the video layer takes longer than expected. The static carousel renderer should ship first because it has the clearest immediate value.
