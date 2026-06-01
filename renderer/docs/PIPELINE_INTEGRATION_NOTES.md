# PIPELINE_INTEGRATION_NOTES.md

How the renderer attaches to the existing `ai-ugc-pipeline` without changing the content strategy or the manual-first upload flow.

## Integration position

The content pipeline already does the upstream work (idea scoring, source checks, scripting, captions, visual direction, QA, upload packaging). The renderer attaches **only after a post is approved enough to assemble** — Stage 8 of `../../pipeline/content/CONTENT_PIPELINE.md`.

| Existing pipeline owns | Renderer owns |
| --- | --- |
| Is the topic credible & useful? | Refuse to render if required fields are missing (Zod). |
| Carousel script, caption, hashtags, alt text | Convert to JSON; render slides + write upload files. |
| Visual prompt + pillar style | Encode as tokens, backgrounds, layouts. |
| Source / safety / readability / media-rights QA | Add render checks: resolution, overflow, filenames, missing files/alt/sources. |
| Keep manual upload viable | Export folders Jon can post without opening the codebase. |

## File-to-file mapping

| Pipeline file | Renderer touchpoint |
| --- | --- |
| `pipeline/content/POST_TEMPLATE.md` | source shape for `CONTENT_SCHEMA.md` / `content/posts/*.json` |
| `pipeline/content/WEEK_1_POSTS.md` | render fixtures (Post 1 mapped & rendered) |
| `pipeline/content/VISUAL_PROMPT_BANK.md` | `DESIGN_SYSTEM.md` tokens + pillar accents + no-rendered-text rule |
| `pipeline/content/QA_CHECKLIST.md` | surfaced into `render_qa_checklist.md` (render gates added, content gates referenced) |
| `pipeline/content/CONTENT_PIPELINE.md` | renderer = Stage 8 (Assemble) |
| `pipeline/media/VIDEO_ASSEMBLY_WORKFLOW.md` | Reel package shape + filename + `LICENSES.md` |
| `pipeline/media/VOICEOVER_BAKEOFF.md` | VoxCPM2 voice for narrated reels (next slice) |
| `pipeline/media/MUSIC_SFX_GUIDE.md` | music bed rules for narrated reels |
| `pipeline/media/OPEN_SOURCE_EVALUATION_MATRIX.md` | license constraints (VoxCPM2 ✅ commercial; **F5-TTS base weights ❌ CC-BY-NC**) |

## Output contract

Final packages land in `pipeline/renders/<YYYY-MM-DD_slug>/` and are simple enough to post manually:
```
2026-06-02_ai-phishing-training_01_cover.png … _08_cta.png
2026-06-02_ai-phishing-training_reel.mp4        # optional
caption.txt  alt_text.txt  sources.md  LICENSES.md  render_qa_checklist.md
```
Filename prefix comes from `upload_package.filename_prefix`; the renderer never relies on manual renaming.

## Markdown → JSON adapter rule
Map fields 1:1 (see `CONTENT_SCHEMA.md`). If a field can't be mapped confidently, **fail validation and ask a human** — never invent sources, stats, or slide copy.

## What NOT to automate yet
| Don't build | Why |
| --- | --- |
| Auto-publishing to Instagram | Manual upload + approval stays default. |
| SaaS dashboard / auth / billing | Scope creep; no asset-value proof. |
| Autonomous research / claim generation | Content discipline lives upstream. |
| Auto-generated exploit visuals | Unsafe; keep mechanism abstract. |
| Hidden media-license assumptions | Every voice/music/b-roll/model tracked in `LICENSES.md`. |
| External design-skill dependencies | Principles embedded in `tokens.ts`. |

## Removability
Delete `renderer/` and the pipeline is unchanged — Jon can still assemble the same approved content in Canva/Figma/CapCut. That's the design goal: the renderer is a deterministic convenience, not a dependency.
