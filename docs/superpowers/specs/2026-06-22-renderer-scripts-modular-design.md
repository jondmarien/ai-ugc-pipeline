# Renderer `.mjs` modularization — design spec

**Date:** 2026-06-22  
**Branch:** `refactor/renderer-scripts-modular`  
**Goal:** DRY shared logic under `renderer/scripts/lib/` without changing CLI contracts or pipeline outputs.

## Constraints

- Behavior-preserving: same flags, paths, filenames, JSON mutations, exit codes.
- No TS script rewrites; `.mjs` CLIs only (+ existing `higgsfield-client` tests).
- VPS validates with `bun test`; full `bun run pipeline` remains on Jon's host.

## Approach (recommended)

**Incremental lib extraction** — move duplicated blocks into small ESM modules; entry scripts stay thin orchestrators. Avoid a single mega-refactor of `pipeline.mjs` in pass 1.

Alternatives considered:

1. **Monorepo-style `scripts/core/` package** — heavier; rejected (YAGNI).
2. **Convert all `.mjs` to `.ts`** — out of scope.

## Module map

| Module | Responsibility |
|--------|----------------|
| `lib/paths.mjs` | `RENDERER_ROOT`, `POSTS_DIR`, `REPO_ROOT` |
| `lib/post-resolve.mjs` | Substring post-key → file + parsed JSON |
| `lib/post-io.mjs` | `writePostJson` (trailing newline) |
| `lib/public-asset.mjs` | `slideBackgroundExists` |
| `lib/slide-filename.mjs` | `failure_point` → `failure-point`; `backgroundFileName(slide)` |
| `lib/flux-negative-prompt.mjs` | Canonical FLUX text-free negative string |
| `lib/art-slide-prompt.mjs` | *(existing)* prompts + theme |
| `lib/art-targeting.mjs` | `--only` / force / slide filter |
| `lib/comfyui-env.mjs` | Comfy URL, upscale model bootstrap |
| `lib/python-runner.mjs` | venv → uv → system python `spawnSync` |
| `lib/cli.mjs` | `flagOpt`, `postKeyFromArgv` |
| `lib/post-selection.mjs` | Batch key expansion (`pipeline`, `set-status`) |
| `lib/post-status.mjs` | *(existing)* status I/O |

## Migration order

1. Prompt + negative prompt (`art-comfyui` → `art-slide-prompt`, `flux-negative-prompt`)
2. Paths, resolve, assets, filenames, targeting (art + pipeline + higgsfield)
3. Comfy env (art + upscale + free-comfyui)
4. Python runner (art.mjs, voice.mjs, align.mjs)
5. CLI helpers + post-selection (mechanical)

## Verification

- `cd renderer && bun test`
- `bun run validate -- <known-key>` on an existing post JSON
- Spot-check: `bun run art:higgsfield -- <key> --dry-run` (no API)

## Non-goals

- Performance tuning, renaming `package.json` scripts, changing Higgsfield API surface.