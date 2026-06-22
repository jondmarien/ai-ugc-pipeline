// scripts/lib/README.md — shared modules for renderer CLI (.mjs entry scripts)
//
// Entry scripts stay thin orchestrators; repeated logic lives here. TS scripts (validate,
// export, reel) use scripts/lib.ts with Zod validation instead of post-resolve.mjs.
//
// | Module | Purpose |
// |--------|---------|
// | paths.mjs | RENDERER_ROOT, POSTS_DIR, public/backgrounds paths |
// | post-resolve.mjs | Substring post key → load JSON from content/posts |
// | post-io.mjs | writePostJson (pretty, trailing newline) |
// | post-status.mjs | Lifecycle status line replace (draft→approved→generated→upload_ready) |
// | post-selection.mjs | pipeline: expand keys, filter by status, --skip |
// | status-targets.mjs | set-status: --from tier + substring keys |
// | public-asset.mjs | slideBackgroundExists under renderer/public |
// | slide-filename.mjs | NN_role.png tokens (failure_point → failure-point) |
// | art-slide-prompt.mjs | buildSlidePrompt, theme, seed offset (Comfy + Higgsfield) |
// | flux-negative-prompt.mjs | Shared FLUX/Higgsfield negative prompt |
// | art-targeting.mjs | --only= slides, selectArtSlides (--all / missing art) |
// | comfyui-env.mjs | COMFYUI_URL, upscale/unet dirs, model auto-download |
// | python-runner.mjs | .venv → uv run → python3 for scripts/*.py |
// | voice-ref.mjs | Auto clone WAV: repo/_voiceref, public _voiceref, E:\\ai-ugc\\_voiceref |
// | cli.mjs | postKeyFromArgv, flagOpt, showHelpAndExit |