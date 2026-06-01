# React/Remotion Rendering Layer Handoff

**Prepared for:** Jon, CTO @ D-Sports  
**Primary assignee:** Claude or another coding agent  
**Prepared by:** Manus AI  
**Date:** 2026-06-01  
**Revision:** Repo-aware update after inspecting `J:\projects\personal-projects\ai-ugc-pipeline\pipeline`

## 1. Situation Summary

Jon’s project now has a concrete **AI-in-cybersecurity UGC production kit** under `pipeline/`, with a content layer and a media/video layer already written by Claude. This means the React/Remotion work should no longer be treated as a greenfield renderer brief. It should be treated as an **optional rendering adapter for the existing pipeline files**.

The current pipeline already defines the content spine, post template, Week-1 drafts, visual prompt language, QA gates, video assembly workflow, and media-license constraints. This add-on should consume that structure rather than inventing a parallel one.

> **Core instruction for Claude:** Build React/Remotion as a rendering layer, not as the content brain, publishing system, research agent, or SaaS dashboard. The renderer should read approved post data from the existing pipeline shape, export deterministic carousel images and optional Reel videos, then hand files back to the manual-first upload package.

## 2. Current Repo Context Claude Should Assume

The inspected project root is `J:\projects\personal-projects\ai-ugc-pipeline`. The relevant work is in `pipeline/content` and `pipeline/media`.

| Existing file | What it contributes to the renderer |
| --- | --- |
| `pipeline/content/README.md` | Confirms the production kit positioning, manual-first default, canonical canvas sizes, and non-negotiables. |
| `pipeline/content/CONTENT_PIPELINE.md` | Defines the ten-stage workflow from idea intake to feedback. The renderer attaches at Stage 8, **Assemble**, after QA-ready content exists. |
| `pipeline/content/POST_TEMPLATE.md` | Defines the content unit the renderer should convert into JSON: post ID, pillar, status, audience, claim tag, score, sources, cover, eight-slide script, image prompts, caption, alt text, upload package, and QA notes. |
| `pipeline/content/WEEK_1_POSTS.md` | Provides five real first-batch render tests. Posts 1–3 can reuse existing assets; Posts 4–5 need new text-free visuals. |
| `pipeline/content/VISUAL_PROMPT_BANK.md` | Defines the dark cinematic editorial style, one-accent-per-pillar convention, no-rendered-text rule, lower-third space, and safe abstract cyber imagery. |
| `pipeline/content/QA_CHECKLIST.md` | Defines the pass/fail gates the renderer should surface: credibility, safety, sources, defender value, readability, platform fit, and media rights. |
| `pipeline/media/VIDEO_ASSEMBLY_WORKFLOW.md` | Defines the current Reel package shape, export spec, subtitle/audio expectations, `LICENSES.md`, and manual upload package convention. |
| `pipeline/media/OPEN_SOURCE_EVALUATION_MATRIX.md` | Defines tool-license constraints. Do not build around F5-TTS for production because official weights are non-commercial; prefer VoxCPM2 for OSS voice where appropriate. |

## 3. Why This Layer Exists

The manual-first path is correct right now, but manual layout has predictable failure modes: inconsistent spacing, typography drift, slow batch exports, and hard-to-repeat visual polish. A React carousel renderer makes layout deterministic. A Remotion Reel renderer makes timing, captions, motion, and export settings repeatable.

| Existing pipeline strength | Remaining problem | React/Remotion add-on |
| --- | --- | --- |
| Week-1 scripts and source notes exist | Markdown tables are not directly renderable | Convert `POST_TEMPLATE`/`WEEK_1_POSTS` into validated JSON. |
| Visual prompt language is strong | Canva/Figma assembly can drift post-to-post | Encode the style as design tokens and slide components. |
| QA gates are explicit | Rendering errors can slip in late | Add automated checks for canvas, overflow, filenames, missing alt text, and license metadata. |
| Video workflow exists | CapCut/Canva timing can become ad hoc | Use Remotion only when repeatable Reel output is worth the extra setup. |

This layer should help Jon produce **SICK** assets, but “sick” must mean controlled visual intensity, not overdesigned chaos. The target is dark, cinematic, technical, high-contrast, and phone-readable.

## 4. Non-Negotiable Constraints

The renderer must preserve the project’s trust standard. Visual drama is allowed; fabricated certainty and unsafe cyber detail are not.

| Constraint | Practical meaning |
| --- | --- |
| **Optional layer** | The manual Canva/Figma/CapCut path must still work if the renderer is not used. |
| **Stage 8 attachment point** | Rendering starts after scripting, source review, visual direction, captioning, and QA preparation. It does not replace those files. |
| **Canonical canvas sizes** | Carousel default is `1080x1350`; Reel default is `1080x1920`, `30 fps`, H.264 MP4. Support `1080x1080` only as an optional variant. |
| **Exact filename convention** | Match the pipeline convention: `YYYY-MM-DD_slug_01_cover.png` through `YYYY-MM-DD_slug_08_cta.png`; Reel exports as `YYYY-MM-DD_slug_reel.mp4`. |
| **Human approval before posting** | The renderer may create upload-ready folders, but publishing remains manual or approval-gated. |
| **No unavailable design-skill dependency** | Do not reference external/local design skills such as Huashu, Impeccable, or Taste unless the runtime actually provides them. Embed the principles directly. |
| **Media-rights discipline** | Reels require `LICENSES.md`. F5-TTS official weights are R&D/reference only; VoxCPM2 is the preferred OSS voice candidate from Claude’s current evaluation. |
| **No unsafe cybersecurity content** | No payloads, exploit chains, evasion steps, credential-bypass flows, fake CVEs, invented incident details, or unsupported statistics. |

## 5. Recommended System Shape

The first version should be a local folder-based render kit, not a giant dashboard. It should live beside the pipeline and produce upload packages that match the manual workflow.

| Layer | Recommended choice | Reason |
| --- | --- | --- |
| Content source | JSON generated from the existing Markdown post package | The current pipeline is Markdown-native, but React/Remotion need stable structured data. |
| Static layout | React + Tailwind CSS | Component-driven layout with repeatable typography, spacing, and safe areas. |
| Slide export | Playwright screenshots | Browser-accurate export of exact-size slide roots. |
| Video rendering | Remotion | React-based composition for 9:16 Reels, captions, timing, and motion. |
| Upload path | Existing manual package | Keeps the renderer compatible with Business Suite / Instagram manual upload. |
| Future API path | Separate publisher module later | Prevents rendering from becoming coupled to Meta permissions or credentials. |

The strongest first deliverable is a proof of concept using **Week-1 Post 1** from `WEEK_1_POSTS.md`, because it already has a clear script, source notes, caption, and existing reusable assets. The second render test should use **Post 4 or Post 5**, because those require new visuals and will prove the system handles both existing-asset reuse and new text-free backgrounds.

## 6. Design Direction

Use the visual system already defined in `VISUAL_PROMPT_BANK.md`: realistic editorial technology photography, dark high-contrast mood, one accent glow, a strong central subject, and clean lower-third space for typography. Avoid generic SaaS cards and avoid “hacker hoodie” clichés.

| Design element | Repo-aware rule |
| --- | --- |
| **Pillar accent** | Offensive AI = cyan; Model security = electric blue; Data leakage = neon green; Defensive AI = cool teal; Governance = amber/desaturated blue; Myth-busting = red-to-blue split. |
| **Slide roles** | Use the canonical eight-slide arc: cover, context, risk, mechanism, failure point, defense, takeaway, CTA. |
| **Cover layout** | Preserve a dark lower-third or protected text zone. The headline must survive thumbnail viewing. |
| **Inner slides** | Keep one job per slide and usually `≤ ~12 words` of on-slide copy. |
| **Imagery** | Backgrounds should be text-free, logo-free, credential-free, and abstract enough to avoid enabling abuse. |
| **Brand mark** | Keep Jon’s handle/logo small and consistent. The idea should be louder than the watermark. |
| **Reel captions** | Burned-in, proofread, high-contrast, inside mobile safe margins; acronyms like OAuth, SIEM, and EDR must be checked manually. |

> The visual target is **cinematic credibility**: dramatic enough to stop a scroll, restrained enough that security professionals do not dismiss it as hype.

## 7. What Claude Should Produce Next

Claude should produce implementation-ready renderer documents that directly reference the existing repo structure. If asked to implement, start with a minimal local proof of concept.

| Deliverable | Purpose |
| --- | --- |
| `RENDERER_ARCHITECTURE.md` | Project structure, dependencies, and boundaries beside `pipeline/`. |
| `CONTENT_SCHEMA.md` | JSON schema mapped from `POST_TEMPLATE.md` and `WEEK_1_POSTS.md`, including score, claim tags, source confidence, alt text, upload filenames, and media licenses. |
| `CAROUSEL_COMPONENTS.md` | React components for the canonical eight-slide arc. |
| `PLAYWRIGHT_EXPORT_WORKFLOW.md` | Exact screenshot export process using the pipeline filename convention. |
| `REMOTION_REEL_WORKFLOW.md` | Remotion composition structure aligned with `VIDEO_ASSEMBLY_WORKFLOW.md`. |
| `DESIGN_SYSTEM.md` | Tokens derived from `VISUAL_PROMPT_BANK.md`, not a new unrelated style. |
| `WEEK_1_RENDER_TESTS.md` | Tests for Week-1 Posts 1–5, with Posts 1–3 existing-asset mode and Posts 4–5 new-visual mode. |
| `PIPELINE_INTEGRATION_NOTES.md` | Short mapping from current Markdown files to renderer inputs/outputs, including what not to automate yet. |

## 8. Success Criteria

This package is successful if Jon can hand Claude the current `pipeline/` folder and get a renderer plan or implementation that speaks the same language as the existing content kit.

| Criterion | Pass condition |
| --- | --- |
| Repo compatibility | The renderer consumes the existing `POST_TEMPLATE`/`WEEK_1_POSTS` structure instead of inventing incompatible fields. |
| Upload compatibility | Export folders include ordered PNGs, optional Reel MP4, `caption.txt`, `alt_text.txt`, `sources.md`, and `LICENSES.md` where video/audio appears. |
| Visual consistency | The rendered output follows the existing dark cinematic editorial style and pillar accent colors. |
| QA discipline | Renderer checks line up with `QA_CHECKLIST.md`, including readability, source support, safety, and media rights. |
| Manual fallback | Jon can still assemble in Canva/Figma/CapCut if code rendering is not available. |
| Small first slice | The initial implementation proves one static carousel before expanding to full batch and Remotion. |

## 9. References

[1]: https://playwright.dev/docs/screenshots "Playwright — Screenshots"  
[2]: https://www.remotion.dev/docs/ "Remotion Documentation"
