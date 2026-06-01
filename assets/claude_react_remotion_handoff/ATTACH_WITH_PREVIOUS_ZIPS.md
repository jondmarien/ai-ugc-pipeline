# Attach This React/Remotion Add-On With the Existing Pipeline

Jon, attach this ZIP **after** Claude has access to the current `ai-ugc-pipeline` project folder and the previous handoff ZIPs.

## Recommended Attachment Order

Use this order so Claude does not misunderstand the renderer as a replacement pipeline.

| Order | Attachment | Why |
| --- | --- | --- |
| 1 | Current `ai-ugc-pipeline` project folder | This now contains the most important context: the real `pipeline/content` and `pipeline/media` files Claude already built. |
| 2 | Original AI-cybersecurity UGC handoff ZIP | Defines the content strategy and trust rules. |
| 3 | Tool-stack/media addendum ZIP | Defines voiceover, b-roll, subtitle, music, and open-source media constraints. |
| 4 | This React/Remotion renderer ZIP | Adds an optional deterministic asset-rendering layer. |

## Short Message to Paste With the ZIP

```text
Use this React/Remotion package as an optional renderer add-on for the existing ai-ugc-pipeline project.

First inspect the actual pipeline folder, especially pipeline/content/POST_TEMPLATE.md, pipeline/content/WEEK_1_POSTS.md, pipeline/content/VISUAL_PROMPT_BANK.md, pipeline/content/QA_CHECKLIST.md, and pipeline/media/VIDEO_ASSEMBLY_WORKFLOW.md.

Do not create a separate incompatible workflow. Map the existing Markdown post package into JSON, render carousel slides with React/Playwright, and add Remotion only after the static carousel path works.

Keep manual upload viable. Match the pipeline filename convention: YYYY-MM-DD_slug_01_cover.png through YYYY-MM-DD_slug_08_cta.png, plus caption.txt, alt_text.txt, sources.md, and LICENSES.md when media/audio/generative assets require license tracking.
```

## What Claude Should Produce

Claude should produce implementation-ready renderer documents or code that directly fits the existing repo.

| Deliverable | Purpose |
| --- | --- |
| `RENDERER_ARCHITECTURE.md` | Where the renderer lives beside `pipeline/`, dependencies, and boundaries. |
| `CONTENT_SCHEMA.md` | JSON schema mapped from `POST_TEMPLATE.md` and `WEEK_1_POSTS.md`. |
| `CAROUSEL_COMPONENTS.md` | React components for cover, context, risk, mechanism, failure point, defense, takeaway, and CTA. |
| `PLAYWRIGHT_EXPORT_WORKFLOW.md` | Screenshot export commands, validation, and filename conventions. |
| `REMOTION_REEL_WORKFLOW.md` | Remotion workflow aligned with `VIDEO_ASSEMBLY_WORKFLOW.md`. |
| `DESIGN_SYSTEM.md` | Tokens from `VISUAL_PROMPT_BANK.md`, not a new unrelated style. |
| `WEEK_1_RENDER_TESTS.md` | Render tests for Week-1 Posts 1–5. |
| `PIPELINE_INTEGRATION_NOTES.md` | Mapping between current Markdown files and renderer inputs/outputs. |

## Guardrails

Do not let Claude turn this into a giant app before the renderer works. The first useful version is a local proof of concept with one real post JSON, a few reusable slide components, a Playwright export script, and a short QA checklist.

Do not let the renderer loosen the cybersecurity rules. It must preserve the source checks, no-exploit-detail rule, defender value requirement, alt text, captions, and media-license tracking already in the pipeline.

## Best First Slice

Start with Week-1 Post 1 because it already has a clear eight-slide script and reusable assets. Then render Post 4 or Post 5 because those require fresh text-free visuals and will test whether the design system generalizes.

| Slice | Done when |
| --- | --- |
| Week-1 Post 1 JSON | All fields map from Markdown without invented claims. |
| Four slide components | Cover, context, defense, and CTA render at `1080x1350`. |
| Playwright export | Ordered PNGs match `YYYY-MM-DD_slug_01_cover.png` naming. |
| Upload package | `caption.txt`, `alt_text.txt`, `sources.md`, and `render_qa_checklist.md` are present. |
| Second post test | Post 4 or 5 renders with new text-free backgrounds. |
| Remotion stub | A short composition can reuse the same JSON without blocking static carousel export. |
