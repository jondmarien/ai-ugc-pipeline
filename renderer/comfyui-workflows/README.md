# 🧩 renderer/comfyui-workflows/ — version-controlled ComfyUI graphs

UI-format ComfyUI workflows mirroring what `scripts/art-comfyui.mjs` builds in code and submits over the HTTP API. Two uses:

1. **Inspect / experiment in the ComfyUI web UI** — open them from ComfyUI's workflow library (sync below).
2. **Run them literally from the pipeline** — `bun run pipeline -- <key> --art --ui-format` loads the matching file from THIS folder, converts UI → API format, patches each slide's `visual_prompt` + seed (and the upscale model/canvas when `--upscale`), and submits it. Without `--ui-format`, the graph is built in code as usual.

| File | Mirrors | Used by `--ui-format` when |
| --- | --- | --- |
| `flux2_klein_4b_8gb.json` | `buildGraphFlux2()` — klein 4B GGUF, Qwen3 on CPU, 8 steps, CFG 1.2, 1024×1280, negative text-suppression node | art runs **without** `--upscale` |
| `flux2_klein_4b_8gb_with_upscale.json` | same + `appendUpscale()` — VAE decode → GAN upscale (RealESRGAN_x4plus / 4x-UltraSharp) → lanczos downscale to the post canvas → save | art runs **with** `--upscale` |

## Rules of the folder

- **Keep mirrors in sync.** When `art-comfyui.mjs`'s graph builders change (steps/CFG/resolution/nodes), update these files **in the same commit**.
- **In `--ui-format` mode the file wins.** That's the point (WYSIWYG) — the file's steps/CFG/resolution are used as-is, except the per-slide patches: positive prompt, seed, and (with `--upscale`) the upscale `model_name` + `ImageScale` dimensions.
- **Sync to your ComfyUI library** so the web UI shows the current mirrors: copy both files to `E:\ComfyUI\user\default\workflows\` (or wherever your ComfyUI userdata lives).
