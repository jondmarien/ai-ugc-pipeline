# renderer/scripts — CLI entrypoints

Bun/Node scripts invoked via `renderer/package.json` (`bun run <script> -- …`).

## Pipeline order (typical)

1. `draft` / hand-edit JSON in `content/posts/`
2. `status` → `approved`
3. `pipeline` — orchestrates art → export → package → voice → align → reel

## Scripts

| npm/bun script | File | Role |
|----------------|------|------|
| `pipeline` | pipeline.mjs | Full orchestrator, multi-post selection |
| `art` | art-comfyui.mjs | ComfyUI FLUX backgrounds |
| `art:higgsfield` | art-higgsfield.mjs | Cloud Higgsfield backgrounds |
| `art:diffusers` | art.mjs | Legacy local diffusers (Python) |
| `upscale` | upscale-comfyui.mjs | Sharpen existing backgrounds |
| `free-comfyui` | free-comfyui.mjs | Release GPU between art and voice |
| `import-bg` | import-bg.mjs | Adopt external PNG folders |
| `export` | export-carousel.ts | Playwright carousel PNGs (Node) |
| `package` | build-package.ts | Upload bundle files |
| `voice` | voice.mjs → voice-voxcpm.py | TTS WAV |
| `align` | align.mjs → align-whisper.py | Caption timings |
| `reel` | render-reel.ts | Remotion MP4 |
| `reel:higgsfield` | reel-segments-higgsfield.mjs | Beat motion clips |
| `validate` | validate.ts | Schema + content lint |
| `status` | set-status.mjs | Lifecycle status field |

Shared MJS modules: `scripts/lib/` (see `lib/README.md`). TS tools use `scripts/lib.ts`.

Most scripts support `--help` or `-h`.