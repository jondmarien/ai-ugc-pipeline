# 📦 renderer/scripts/lib/ — shared modules for the CLI layer

Entry scripts in [`../`](../README.md) stay thin orchestrators; anything two scripts need lives here. `.mjs` entry scripts import these modules; TypeScript scripts (`validate`, `export`, `reel`, `package`) use [`../lib.ts`](../lib.ts) with Zod validation instead of `post-resolve.mjs`.

## Post I/O & selection

| Module | Purpose |
| --- | --- |
| `paths.mjs` | `RENDERER_ROOT`, `POSTS_DIR`, `public/backgrounds`/`videos` paths — the one place paths are defined. |
| `post-resolve.mjs` | Substring post key → load JSON from `content/posts/`. |
| `post-io.mjs` | `writePostJson` (pretty-printed, trailing newline). |
| `post-status.mjs` | Lifecycle status line replace (`draft → approved → generated → upload_ready`). |
| `post-selection.mjs` | `pipeline`: expand keys, filter by `--status=`, honour `--skip`. |
| `status-targets.mjs` | `set-status`: `--from` tier + substring keys. |

## Art

| Module | Purpose |
| --- | --- |
| `art-slide-prompt.mjs` | `buildSlidePrompt` — theme accent + seed offset, shared by ComfyUI and Higgsfield/FAL. |
| `flux-negative-prompt.mjs` | The shared FLUX/Higgsfield negative prompt (text suppression). |
| `art-targeting.mjs` | `--only=` slide selection; `selectArtSlides` (`--all` vs missing-art-only). |
| `comfyui-env.mjs` | `COMFYUI_URL`, upscale/unet model dirs, model auto-download. |
| `public-asset.mjs` | `slideBackgroundExists` under `renderer/public`. |
| `slide-filename.mjs` | `NN_role.png` / video filename tokens (`failure_point` → `failure-point`). |

## Voice, Python & publishing

| Module | Purpose |
| --- | --- |
| `python-runner.mjs` | Resolve the Python runtime: `.venv` → `uv run` → `python3`, for `scripts/*.py`. |
| `voice-ref.mjs` | Auto-discover the voice-clone reference WAV (`$VOICE_REF` → `public/audio/_voiceref/` → `E:\ai-ugc\_voiceref\`). Has a paired test. |
| `instagram-upload.ts` | Shared Instagram Graph API upload helpers used by the publish adapter. |
| `cli.mjs` | `postKeyFromArgv`, `flagOpt`, `showHelpAndExit` — the tiny arg-parsing kit every script uses. |
