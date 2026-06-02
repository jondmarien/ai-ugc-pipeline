# IMAGE_MODELS.md — Slide background generation (`bun run art`)

`bun run art -- <post-key>` turns each slide's `visual_prompt` into a dark cinematic background and updates the post JSON (`asset_status: "generated"`). It's **local Python in `renderer/.venv` (uv) — no server/Docker**, mirroring the voice/align steps. Pick the model with `ART_MODEL`. Pairs with `../../pipeline/media/VOICEOVER_BAKEOFF.md` (the audio equivalent).

> **Commercial rule:** only ship images from a model whose license allows commercial use. Log the model in the package `LICENSES.md`.

## Model matrix (for an 8 GB GPU like the RTX 3070 Ti)

| Model | License | Commercial | 8 GB fit | Quality / notes |
| --- | --- | --- | --- | --- |
| **FLUX.1-schnell** *(default)* | **Apache-2.0** | ✅ yes | ✅ fp16 + cpu-offload, or Q4/Q5 GGUF | 4-step, ~10–20 s/img. Verified-API default. |
| **FLUX.2 [klein] 4B** | **Apache-2.0** | ✅ yes | ✅ **FP8 ~6 GB** (fp16 ~10 GB) | Newer, sub-second, also does image editing. Best commercial pick — see "Run FLUX.2" below. |
| SDXL 1.0 | CreativeML OpenRAIL++ | ✅ yes (use-based restrictions) | ✅ ~8 GB base | Huge LoRA/ControlNet ecosystem; domain-tuned checkpoints shine. |
| SD 3.5 Medium/Large | Stability Community | ⚠️ free < $1M revenue | Medium ~12 GB / Large ~11 GB TensorRT | Strong text rendering; tighter on 8 GB. |
| FLUX.2 [klein] 9B | FLUX **Non-Commercial** | ❌ no | ~20 GB | Excluded (license + VRAM). |
| FLUX.2 [dev] (32B) | FLUX **Non-Commercial** | ❌ no | ❌ 24 GB+ (FP8 ~12 GB) | The flagship — too big for 8 GB **and** non-commercial. |
| FLUX.1-dev | FLUX **Non-Commercial** | ❌ no | ✅ (GGUF) | Excluded (license). |

**TL;DR:** start on **FLUX.1-schnell** (works out of the box), upgrade to **FLUX.2 [klein] 4B** for newer/better at the same commercial license. Avoid anything labeled *dev* or *9B* — non-commercial.

## Default (FLUX.1-schnell)
```bash
cd renderer
uv pip install "diffusers>=0.31" transformers accelerate torch sentencepiece protobuf pillow
bun run art -- <post-key>            # ART_MODEL defaults to black-forest-labs/FLUX.1-schnell
bun run art -- <post-key> --dry-run  # preview the prompts, generate nothing
bun run art -- <post-key> --all      # also (re)generate the cover
```

## Run FLUX.2 [klein] 4B (the commercial upgrade)

It's a *different* diffusers pipeline than FLUX.1, and quantization matters on 8 GB. Two routes:

**Route A — diffusers (if your diffusers is recent enough):**
```bash
cd renderer
uv pip install -U "diffusers" transformers accelerate torch sentencepiece protobuf pillow
ART_MODEL=black-forest-labs/FLUX.2-klein-4B bun run art -- <post-key>
```
`art-flux.py` detects the FLUX.2/klein id and uses `Flux2KleinPipeline` with sequential CPU-offload. If your diffusers build lacks that class, the script tells you to upgrade or use Route B.

**Route B — ComfyUI FP8 (most reliable on 8 GB):**
1. Install ComfyUI; grab the **official FP8 FLUX.2 [klein] 4B** weights (BFL shipped FP8/NVFP4 with NVIDIA) + the text encoder + VAE into `ComfyUI/models/`.
2. Load the FLUX.2 klein workflow, set portrait (multiples of 16, e.g. 832×1216), generate one image per slide using that slide's `visual_prompt`.
3. Save each as `renderer/public/backgrounds/<prefix>/NN_<role>.png`, set those slides to `asset_status: "existing"` + `background_asset: "/backgrounds/<prefix>/NN_<role>.png"`, then `bun run export -- <post-key>`.

### How to download FLUX.2 to your PC
- **Hugging Face (gated):** accept the license on `https://huggingface.co/black-forest-labs/FLUX.2-klein-4B`, then `hf auth login` (or `huggingface-cli login`) once. diffusers `from_pretrained("black-forest-labs/FLUX.2-klein-4B")` then auto-downloads to your HF cache (`%USERPROFILE%\.cache\huggingface`). For ComfyUI, download the FP8 safetensors from that repo's *Files* tab (or a community FP8/GGUF repo, e.g. `unsloth/FLUX.2-klein-4B-GGUF`) into `ComfyUI/models/`.
- **Only the 4B (Apache-2.0) variant for commercial work** — do not use klein 9B or dev.
- Set a custom cache dir with `HF_HOME=D:\models` if your C: drive is tight.

## Make prompts rich
`bun run new` now writes a specific `visual_prompt` per slide (with a `[the topic]` placeholder to refine), and `/draft-post` / `/draft-week` instruct the model to write topic-specific prompts. So `bun run art` always has a real scene per slide rather than deriving from the on-slide copy.

## Full "rich export" of a post
Everything for one post, end to end (example key `2026-06-04_prompt-injection-agents`):
```bash
cd renderer
bun run art    -- 2026-06-04_prompt-injection-agents   # AI backgrounds on every slide (FLUX)
bun run export -- 2026-06-04_prompt-injection-agents   # carousel PNGs with imagery baked in
bun run voice  -- 2026-06-04_prompt-injection-agents   # narration (voxcpm2 / bark — local, no server)
bun run align  -- 2026-06-04_prompt-injection-agents   # Whisper word-timestamps → exact caption sync
bun run reel   -- 2026-06-04_prompt-injection-agents   # narrated reel (voice over ducked music)
bun run package -- 2026-06-04_prompt-injection-agents  # caption/alt/sources/LICENSES/QA
```
Skip any step you don't need: no `art` → procedural backgrounds; no `voice` → silent reel; no `align` → captions distribute evenly. Output lands in `../../pipeline/renders/<date_slug>/`. Always review sources + media licenses before posting.
