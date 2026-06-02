# CONTENT_SCHEMA.md

The JSON contract the renderer consumes, mapped from `../../pipeline/content/POST_TEMPLATE.md`. Authoritative implementation: `../src/lib/schema.ts` (Zod). Markdown is the human authoring format; **JSON is the render format**. The adapter never invents missing facts — a missing required field fails validation.

## Markdown → JSON mapping

| `POST_TEMPLATE.md` section | JSON field | Notes |
| --- | --- | --- |
| Post ID | `post_id`, `date`, `slug` | `date` = `YYYY-MM-DD`; `slug` kebab-case. |
| Pillar | `pillar`, `brand.pillar_accent` | Drives accent color. |
| Status | `status` | `draft` \| `approved` \| `upload_ready`. |
| Primary audience | `audience` | |
| Core claim | `core_claim` | |
| Claim tag | `claim_tags[]` | e.g. `reported_fact`, `emerging`, `scenario`, `practitioner_takeaway`. |
| Score | `score{}` | 5 axes + `total`; total must equal the sum (enforced). |
| Source Notes table | `sources[]` | `source, link, supports, confidence, claim_tag`. ≥1 required. |
| Cover | `slides[0]` (role `cover`) + `brand` | |
| Carousel script rows | `slides[]` | role, on_slide_copy, subline, visual_direction/prompt, background_asset, asset_status. |
| Caption | `caption` | exported to `caption.txt`. |
| Hashtags | `hashtags[]` | |
| Alt text | `alt_text[]` | count **must** equal slide count (enforced). |
| Assets / upload | `upload_package`, `asset_licenses[]` | filename prefix + folder. |
| (Reel) | `video{}` | optional; required only for Reels. |
| QA notes | `qa{}` | mirrors `QA_CHECKLIST.md` flags. |

## Field reference (required ✓)

### Root `PostData`
| Field | Type | Req | Notes |
| --- | --- | --- | --- |
| `post_id` | string | ✓ | unique. |
| `date` | `YYYY-MM-DD` | ✓ | |
| `slug` | string | ✓ | |
| `platform` | string | | default `instagram`. |
| `format` | string | | `carousel`. |
| `status` | enum | ✓ | `draft\|approved\|upload_ready`. |
| `pillar` | enum | ✓ | `offensive_ai\|model_security\|data_leakage\|defensive_ai\|governance\|myth_busting`. |
| `audience` | string | ✓ | |
| `core_claim` | string | ✓ | |
| `claim_tags` | string[] | ✓ | ≥1. |
| `score` | ScoreSpec | ✓ | total = sum of axes. |
| `canvas` | CanvasSpec | ✓ | `{width,height,safe_margin}`. |
| `brand` | BrandSpec | ✓ | handle, pillar_accent, palette, font_stack. |
| `upload_package` | UploadPackage | ✓ | folder, filename_prefix, expected_files. |
| `slides` | SlideData[] | ✓ | slide 1 must be `cover`; numbering 1..n contiguous. |
| `caption` | string | ✓ | |
| `hashtags` | string[] | ✓ | ≥1. |
| `comment_prompt` | string | | used by CTA slide + reel end card. |
| `alt_text` | string[] | ✓ | length == slides length. |
| `sources` | SourceNote[] | ✓ | ≥1. |
| `asset_licenses` | object[] | | logged into `LICENSES.md`. |
| `video` | VideoSpec | | optional; Reels only. |
| `qa` | object | | flags surfaced into `render_qa_checklist.md`. |

### `SlideData`
| Field | Type | Req | Notes |
| --- | --- | --- | --- |
| `slide` | int | ✓ | 1-based, contiguous. |
| `role` | enum | ✓ | `cover\|context\|risk\|mechanism\|failure_point\|defense\|takeaway\|cta`. |
| `on_slide_copy` | string | ✓ | the headline; keep ≤ ~12 words. |
| `kicker` | string | | small role label (design element, not a claim). |
| `subline` | string | | |
| `visual_direction`, `visual_prompt` | string | | guidance for backgrounds; **never rendered as text**. |
| `background_asset` | string | | `/backgrounds/...` served from `public/`. |
| `asset_status` | enum | | `existing\|needed\|generated\|stock\|procedural`. |
| `cta` | string | | cover swipe cue / CTA chip. |

### `SourceNote`
`{ source, link, supports, confidence: high|medium|low, claim_tag }` — all required.

### `VideoSpec` (Reels)
`{ enabled, duration_seconds, fps, export_name, caption_mode, narration[], beats[], subtitle_style, music, sfx[], licenses[] }`.
Each `beat` = `{ start, end, slide_ref, purpose, motion, caption, words? }`. `purpose: "cta"` renders the end card.

**`caption_mode`** ∈ `block | word | highlight` (default `block`) — how burned-in captions animate:
- `block` — full caption per scene (current behavior).
- `word` — one word at a time (karaoke).
- `highlight` — full line shown, current word lit in the pillar accent.

Set it per post via `npm run new -- … --captions=<mode>`, the `--captions=` flag on `npm run draft`, or `captions=<mode>` in `/draft-post` / `/draft-week`. Word timing is distributed evenly across each beat window; optional per-word `beat.words[]` timings are reserved for future audio-synced alignment.

**`video.audio`** — selectable reel audio (like captions):
```
audio: {
  voice_mode: none | voxcpm2 | http | file,   // none = silent; http = OpenAI-compatible /v1/audio/speech server
  voice_file: "/audio/<prefix>/voice.wav",   // served from public/
  voice_gain_db: 0,
  music_mode: none | free | licensed | generated | file,
  music_file: "/audio/<prefix>/music.mp3",
  music_gain_db: -18                    // ducked under narration
}
```
Default is `none`/`none` → **silent** (backward compatible; posts without `audio` validate). The mode is mostly metadata for `LICENSES.md` + where files come from; the reel plays whatever audio **files** exist under `renderer/public/`. **`render-reel.ts` strips any audio ref whose file is missing and renders silent + warns** — so you can set `voice_mode: voxcpm2` now and the reel goes silent until you generate `voice.wav` (`npm run voice -- <key>`). Set via `--voice=`/`--music=` on `npm run new`/`draft`, or in the slash commands.

## Validation rules (enforced in `schema.ts`)
- Slide 1 role must be `cover`.
- Slide numbering contiguous `1..n` matching array order.
- `alt_text.length === slides.length`.
- `score.total === credibility+relevance+novelty+visual_drama+defender_usefulness`.
- ≥1 source.
- `date` matches `YYYY-MM-DD`.

If any fails, `npm run validate` / `npm run export` print the offending path and **exit non-zero**. The renderer does not guess.

## Filename convention (authoritative)

Pipeline convention uses an **underscore** between date and slug, then zero-padded index + role token:
```
YYYY-MM-DD_slug_01_cover.png
YYYY-MM-DD_slug_02_context.png
YYYY-MM-DD_slug_03_risk.png
YYYY-MM-DD_slug_04_mechanism.png
YYYY-MM-DD_slug_05_failure-point.png   ← role token uses a hyphen
YYYY-MM-DD_slug_06_defense.png
YYYY-MM-DD_slug_07_takeaway.png
YYYY-MM-DD_slug_08_cta.png
YYYY-MM-DD_slug_reel.mp4
```
> Note: the skill's JSON template shows an all-hyphen prefix (`YYYY-MM-DD-topic-slug_…`). The **pipeline convention above wins** (it matches `VIDEO_ASSEMBLY_WORKFLOW.md` and the manual upload package). The role→filename map lives in `ROLE_FILENAME` in `schema.ts`.

## Worked example
`../content/posts/2026-06-02_ai-phishing-training.json` is the real, validated mapping of **Week-1 Post 1** from `WEEK_1_POSTS.md` — use it as the canonical fixture.
