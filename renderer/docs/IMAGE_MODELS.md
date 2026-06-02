# IMAGE_MODELS.md — Slide background generation (`bun run art`)

`bun run art -- <post-key>` turns each slide's `visual_prompt` into a dark cinematic background and updates the post JSON (`asset_status: "generated"`). It's **local Python in `renderer/.venv` (uv) — no server/Docker**, mirroring the voice/align steps. Pick the model with `ART_MODEL`. Pairs with `../../pipeline/media/VOICEOVER_BAKEOFF.md` (the audio equivalent).

> **Commercial rule:** only ship images from a model whose license allows commercial use. Log the model in the package `LICENSES.md`.

## Put big models on another drive — use `HF_HUB_CACHE`, **not** `HF_HOME`
FLUX is large (~24–33 GB). To send model downloads to a roomier drive, set **`HF_HUB_CACHE`** (the *model cache* only) in `renderer/.env` — Bun auto-loads it and the spawned Python inherits it:
```ini
# renderer/.env
HF_HUB_CACHE=E:/ai-ugc-hf/hub
```
**Do NOT use `HF_HOME` for this.** `HF_HOME` relocates *both* the cache **and the auth-token lookup** (to `<HF_HOME>/token`). Your `hf login` token lives at the default `~/.cache/huggingface/token`, so setting `HF_HOME` makes `bun run art` fail with a **gated/403 error even when you're logged in** (the token isn't found at the new location). `HF_HUB_CACHE` moves only the cache and leaves auth alone. (If you prefer, hardcode `HF_TOKEN=hf_…` in `.env` — it overrides token lookup entirely.) `.env` is git-ignored.

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

## ⚠ First: make sure torch uses your GPU (CUDA)
A plain `uv pip install torch` on Windows installs the **CPU-only** build (`torch x.y.z+cpu`) — image gen then runs on CPU (minutes per image, often unusable). If `torch.cuda.is_available()` is `False` or logs say *"cuda is not available, using cpu instead"*, you have the CPU build.

**Gotcha:** re-running `uv pip install torch --index-url …cu124` often does **nothing** — uv sees the same version already installed and skips it. You must **force-reinstall** (uninstall first). RTX 3070 Ti → CUDA 12.x build (Python 3.11–3.13 supported):
```bash
cd renderer
uv pip uninstall torch torchvision torchaudio
uv pip install torch torchvision --index-url https://download.pytorch.org/whl/cu124
.venv/Scripts/python -c "import torch; print('CUDA:', torch.cuda.is_available(), torch.version.cuda)"
```
You want `CUDA: True 12.4` (and `torch x.y.z+cu124`, not `+cpu`). This also makes VoxCPM/Bark/Whisper use the GPU. (Installing `torchvision` too silences the diffusers `CLIPImageProcessor requires torchvision` warning.) If no cu124 wheel exists for your Python, recreate the venv on 3.12: `uv venv --python 3.12`.

## Default (FLUX.1-schnell) — step by step
FLUX.1-schnell is Apache-2.0 (commercial-OK) **but its Hugging Face repo is GATED** — you must accept the license + log in once (a 403 `GatedRepoError` means you skipped this).
```bash
cd renderer
# 1. deps (do the CUDA-torch step above FIRST), plus the diffusers stack
uv pip install "diffusers>=0.31" transformers accelerate sentencepiece protobuf pillow huggingface_hub[cli]
# 2. accept the license: open https://huggingface.co/black-forest-labs/FLUX.1-schnell
#    and click "Agree and access repository" (free, instant). Make a READ token at
#    https://huggingface.co/settings/tokens
# 3. log in this venv (or set env HF_TOKEN=hf_xxx instead):
.venv/Scripts/python -m huggingface_hub login
# 4. preview prompts (no download)
bun run art -- <post-key> --dry-run
# 5. generate — first run downloads FLUX.1-schnell (~24GB fp16) to your HF cache
#    (C:\Users\<you>\.cache\huggingface — same place VoxCPM2 went). cpu-offload fits 8GB.
bun run art -- <post-key>
# 6. bake the new backgrounds into the carousel
bun run export -- <post-key>
#    --all also (re)generates the cover; ART_MODEL swaps models; HF_HUB_CACHE=E:/path moves the cache (see below).
```
**No-login / smaller-download alternative:** use a **GGUF** build in ComfyUI — community GGUF repos (e.g. `city96/FLUX.1-schnell-gguf`, Q4/Q5, ~6–8GB) are typically **ungated**. Generate there, drop the PNGs into `public/backgrounds/<prefix>/`, set those slides to `asset_status: "existing"`, then `bun run export` (same Route B as FLUX.2 below).

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
- Put big models on another drive with **`HF_HUB_CACHE`** (see the cache-relocation note below).

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
bun run reel   -- 2026-06-04_prompt-injection-agents --fit-voice  # narrated reel, auto-trimmed to the voice (no silent tail)
bun run package -- 2026-06-04_prompt-injection-agents  # caption/alt/sources/LICENSES/QA
```
Skip any step you don't need: no `art` → procedural backgrounds; no `voice` → silent reel; no `align` → captions distribute evenly. Output lands in `../../pipeline/renders/<date_slug>/`. Always review sources + media licenses before posting.

## Troubleshooting: `OSError: [WinError 6714]` on `bun run art`/`voice`
This means Python's import machinery hit a directory carrying a stale NTFS kernel-transaction (TxF) marker while listing it — usually a **corrupted/transaction-polluted Python install** (we traced it to the uv-managed CPython's `DLLs` dir). It's environmental, not the pipeline. Also note **VoxCPM2 requires Python ≥3.10 and <3.13**. Fix by recreating the venv on a clean **Python 3.12**:
```bash
cd renderer
rm -rf .venv                       # (PowerShell: Remove-Item -Recurse -Force .venv)
uv venv --python 3.12              # uv downloads 3.12 if missing
uv pip install torch torchvision --index-url https://download.pytorch.org/whl/cu124
uv pip install voxcpm soundfile faster-whisper "diffusers>=0.31" transformers accelerate sentencepiece protobuf pillow
.venv/Scripts/python -c "import torch,diffusers; print('CUDA',torch.cuda.is_available(),'| diffusers OK')"
```
Packages are served from uv's cache, so this is fast if you've installed them before. The HF model weights live in `~/.cache/huggingface` (not the venv), so nothing re-downloads.
