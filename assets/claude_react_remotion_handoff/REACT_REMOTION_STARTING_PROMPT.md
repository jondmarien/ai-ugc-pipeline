# React/Remotion Renderer Starting Prompt for Claude

Copy and paste this into Claude after attaching the original handoff ZIP, the tool-stack addendum ZIP, this React/Remotion renderer ZIP, and the current `ai-ugc-pipeline` project folder if available.

```text
You are helping me extend an existing AI-in-cybersecurity UGC content production pipeline.

Important context: this is no longer a greenfield brief. I already have a project folder named ai-ugc-pipeline with a completed pipeline folder. Inspect that folder first if it is attached or available.

Read in this order:

1. The current project folder, especially:
   - pipeline/content/README.md
   - pipeline/content/CONTENT_PIPELINE.md
   - pipeline/content/POST_TEMPLATE.md
   - pipeline/content/WEEK_1_POSTS.md
   - pipeline/content/VISUAL_PROMPT_BANK.md
   - pipeline/content/QA_CHECKLIST.md
   - pipeline/media/VIDEO_ASSEMBLY_WORKFLOW.md
   - pipeline/media/OPEN_SOURCE_EVALUATION_MATRIX.md
2. Original AI cybersecurity carousel handoff ZIP.
3. Tool-stack addendum ZIP for voiceover, b-roll, music, subtitles, and open-source media experiments.
4. React/Remotion renderer add-on ZIP.

Your job is to design or implement an OPTIONAL rendering layer. Do not replace the manual-first content pipeline. Do not make the workflow depend on Instagram API access. Do not turn this into a SaaS dashboard unless I explicitly ask for that later.

The renderer should attach at the Assemble stage after approved content exists. It should let me turn the existing post structure into:

- Instagram carousel images exported as PNG/JPG, default 1080x1350.
- Optional square variants only if requested.
- Reel-style vertical videos exported as 1080x1920, 30 fps, H.264 MP4 through Remotion.
- A source-controlled JSON format mapped from POST_TEMPLATE.md and WEEK_1_POSTS.md.
- Upload-ready folders that match the existing manual package convention.

Maintain the original non-negotiables:

- Viral packaging is allowed; fake certainty is not.
- No invented breach details, CVEs, statistics, papers, quotes, or timelines.
- No exploit walkthroughs, payloads, evasion steps, credential theft flows, or operational abuse detail.
- Every post needs defender value or a credible practitioner takeaway.
- Manual upload must remain viable while Meta verification/API access is pending.
- The renderer must surface the existing QA gates, not bypass them.
- Media/video outputs must include license tracking through LICENSES.md where audio, footage, voice, or generative models are used.

Use the existing repo conventions:

- Canonical slide arc: cover, context, risk, mechanism, failure point, defense, takeaway, CTA.
- Canonical carousel filenames: YYYY-MM-DD_slug_01_cover.png through YYYY-MM-DD_slug_08_cta.png.
- Canonical Reel filename: YYYY-MM-DD_slug_reel.mp4.
- Upload package should include caption.txt, alt_text.txt, sources.md, and LICENSES.md when applicable.
- Default visual language comes from VISUAL_PROMPT_BANK.md: dark, cinematic, realistic editorial tech photography, high contrast, one pillar accent, text-free imagery, no logos/secrets/payloads, protected lower-third typography.

Create these files as your deliverable:

1. RENDERER_ARCHITECTURE.md
2. CONTENT_SCHEMA.md
3. CAROUSEL_COMPONENTS.md
4. PLAYWRIGHT_EXPORT_WORKFLOW.md
5. REMOTION_REEL_WORKFLOW.md
6. DESIGN_SYSTEM.md
7. WEEK_1_RENDER_TESTS.md
8. PIPELINE_INTEGRATION_NOTES.md

Design expectations:

- The visual style should be dark, cinematic, AI-cybersecurity editorial.
- The slides should look premium, high-contrast, and mobile-readable, not generic Canva templates.
- Use strong typography hierarchy, disciplined negative space, one neon accent color per post, subtle cyber texture, and consistent brand marks.
- Do not reference unavailable external design skill names. If you know design principles from systems like Huashu/Taste/Impeccable, embed the principles directly without making them dependencies.
- Prefer data-driven components such as CarouselDeck, CarouselSlide, CoverSlide, ContextSlide, RiskSlide, MechanismSlide, FailurePointSlide, DefenseSlide, TakeawaySlide, CtaSlide, and ReelComposition.
- Keep the system simple enough to build locally first: Markdown post package → normalized JSON → React components → Playwright screenshot export → PNG slides; JSON/timing data → Remotion composition → MP4 Reel.

Implementation priority:

1. Start with Week-1 Post 1 from WEEK_1_POSTS.md because the content and assets already exist.
2. Then test Week-1 Post 4 or 5 because those require new text-free visuals and prove the renderer works beyond reused assets.
3. Build static carousel export before the Remotion layer.
4. Add Remotion only after the static export path passes QA.

If you recommend implementation, start with a small proof of concept: one post JSON file, three to four reusable slide components, one Playwright export script, one Remotion composition stub, and one QA checklist. Do not overbuild.
```
