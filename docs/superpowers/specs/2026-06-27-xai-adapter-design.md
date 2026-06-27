# Design Spec: xAI Grok Imagine Adapter for ai-ugc-pipeline (Cloud-Only)

**Date**: 2026-06-27  
**Author**: Chronus (Hermes on VPS)  
**Status**: Design – ready for review  
**Related**: Approach A (approved), FAL/Higgsfield client patterns, xAI Imagine API research (REST + SDK)

## 1. Problem Statement & Goals

The ai-ugc-pipeline currently supports local ComfyUI/FLUX (GPU-bound) and two cloud providers (FAL, Higgsfield) for slide background generation (`art`) and per-beat reel motion (`reel` via image-to-video).

**Goal**: Add a third cloud provider using xAI Grok Imagine models (`grok-imagine-image*` for images, `grok-imagine-video*` / `-1.5` for i2v) so the pipeline can run **entirely on the VPS** using Hermes xAI OAuth / `XAI_API_KEY` — no local GPU or ComfyUI required.

**Non-goals**:
- No changes to the local ComfyUI path.
- No new Python dependencies in the renderer.
- No modifications to draft, publish, or Remotion layers.
- Strictly cloud-only for this adapter.

## 2. Architecture Overview (Approved)

- New core adapter: `renderer/scripts/xai-client.mjs` (modeled 1:1 on `fal-client.mjs` and `higgsfield-client.mjs`).
- Thin entrypoints: `art-xai.mjs` and `reel-xai.mjs` (or `--provider=xai` flags on existing scripts).
- Reuses shared libs (`lib/art-slide-prompt.mjs`, `lib/slide-filename.mjs`, `lib/flux-negative-prompt.mjs`).
- Same asset paths, post-JSON fields (`asset_status`, `background_asset`, `beat.video_asset`, `xai_*_url`, `asset_licenses`), caching, dry-run, etc.
- Credentials: `XAI_API_KEY` from `process.env` only (Hermes OAuth surface supported).

**MODEL_CATALOG** (initial)
- Image: `grok-imagine-image-quality` (default), `grok-imagine-image`
- Video (i2v): `grok-imagine-video-1.5` (default), `grok-imagine-video`

## 3. Data Flow (Approved)

Image generation: Post JSON `visual_prompt` → `art-xai` → `xai-client.generateImage` → `POST /v1/images/generations` → download PNG → update JSON + cache.

i2v: Same pattern hitting `/v1/videos/generations` with `image_url` + motion prompt.

## 4. Error Handling, Resilience, Testing, Risks (Approved)

See Section 3 of the design presentation (exponential backoff, timeouts, partial failures, moderation handling, `--dry-run`, cost logging, rate-limit cooldown, graceful error paths, license tracking).

Testing: dry-run smoke tests + manual integration (same as FAL/Higgsfield). No new CI framework.

Risks mitigated: cost (dry-run + logging), rate limits (cooldown), API evolution (thin client + versioned models), no SDK dependency (pure `fetch`).

## 5. Implementation Notes

- Pure Node `fetch` + stdlib (no new deps) — confirmed via xAI research that REST surface is sufficient and matches existing client discipline.
- Official Python `xai-sdk` and OpenAI-compatible client noted as alternatives in docs/comments but not used.
- Caching key includes model + prompt hash + seed + dimensions + optional `cacheBreaker`.
- Negative prompt reuse from library (even for cloud).
- All generations log model + commercial license note.

## 6. Scope & Deliverables

**In scope for this change**:
- `xai-client.mjs`
- `art-xai.mjs` + `reel-xai.mjs` (or flag support)
- Updates to `package.json` scripts / CLI help
- Documentation updates (`IMAGE_MODELS.md`, `PROJECT_ARCHITECTURE.md`, `README.md`)
- Design spec committed

**Out of scope**:
- Full pipeline run on VPS (user explicitly requested only the adapter)
- Local GPU path changes
- Publishing or Remotion modifications

## 7. Next Steps (After User Review)

1. User reviews this spec.
2. Invoke `writing-plans` skill for detailed implementation plan.
3. Create feature branch off `main`.
4. Implement, test, commit.
5. Open PR with proper description (including this spec link).
6. Merge after review.

---

**Self-review checklist (completed)**:
- No placeholders or TBDs.
- Consistent with approved design sections.
- Focused single feature (cloud xAI adapter).
- No ambiguity in scope or success criteria.
- Matches codebase conventions and user constraints (VPS/cloud-only, no ComfyUI).