#!/usr/bin/env python3
"""
Generate per-slide background art with FLUX.1-schnell (Apache-2.0, commercial-OK).

Reads each slide's `visual_prompt`, generates a dark cinematic cyber background into
renderer/public/backgrounds/<prefix>/NN_<role>.png, and updates the post JSON
(background_asset + asset_status="generated") so `bun run export` picks it up.
By default it skips slides whose asset_status is "existing" (keeps your cover art).

Setup (uv, local — no server/Docker):
    cd renderer
    uv pip install "diffusers>=0.31" transformers accelerate torch sentencepiece protobuf pillow
    bun run art -- <post-key>            # generates inner-slide backgrounds, then: bun run export

8GB VRAM (RTX 3070 Ti): uses enable_model_cpu_offload() to fit. ~10-20s/image after
the one-time ~24GB fp16 download (or set ART_MODEL to a GGUF/quantized repo / SDXL).
Model via ART_MODEL (default black-forest-labs/FLUX.1-schnell). Steps via ART_STEPS (4).

Usage: python scripts/art-flux.py <post-key> [--all] [--dry-run]
  --all      also regenerate slides whose asset_status is "existing"
  --dry-run  print the prompts it would render; generate nothing (no model load)
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
RENDERER = os.path.dirname(HERE)
POSTS = os.path.join(RENDERER, "content", "posts")
ART_MODEL = os.environ.get("ART_MODEL", "black-forest-labs/FLUX.1-schnell")
ART_STEPS = int(os.environ.get("ART_STEPS", "4"))

# Accent description per pillar (mirrors src/design/tokens.ts).
ACCENT = {
    "offensive_ai": "cyan",
    "model_security": "electric blue",
    "data_leakage": "neon green",
    "defensive_ai": "cool teal",
    "governance": "amber",
    "myth_busting": "split red-and-blue",
}
SHARED_STYLE = (
    "realistic editorial cybersecurity photography, dark cinematic high-contrast scene, "
    "premium magazine feel, shallow depth of field, subtle grain. "
    "Vertical portrait composition. Keep the lower third darker and uncluttered for overlaid text. "
    "No text, no words, no logos, no watermark, no readable UI, no credentials."
)
ROLE_FILE = {"failure_point": "failure-point"}


def find_post(key):
    if key.endswith(".json") and os.path.exists(key):
        return key
    for f in os.listdir(POSTS):
        if f.endswith(".json") and key in f:
            return os.path.join(POSTS, f)
    sys.exit(f"No post JSON in {POSTS} matching '{key}'.")


def build_prompt(slide, accent, core_claim=""):
    # Prefer an explicit visual_prompt/direction; otherwise derive a topic-matching
    # scene from the slide's on-slide copy + the post's core claim (used as SEMANTIC
    # guidance only — SHARED_STYLE forbids rendering any text).
    explicit = (slide.get("visual_prompt") or slide.get("visual_direction") or "").strip()
    if explicit:
        base = explicit
    else:
        idea = (slide.get("on_slide_copy") or "").strip()
        base = f"a conceptual cybersecurity scene illustrating the idea: \"{idea}\""
        if core_claim:
            base += f" (topic: {core_claim})"
    return f"{base}. {SHARED_STYLE} {accent} accent glow."


def main():
    args = [a for a in sys.argv[1:]]
    flags = {a for a in args if a.startswith("--")}
    pos = [a for a in args if not a.startswith("--")]
    if not pos:
        sys.exit("Usage: python scripts/art-flux.py <post-key> [--all] [--dry-run]")
    post_path = find_post(pos[0])
    post = json.load(open(post_path, encoding="utf-8"))
    prefix = post["upload_package"]["filename_prefix"]
    accent = ACCENT.get(post.get("pillar", ""), "cyan")
    slides = post["slides"]

    targets = []
    for i, s in enumerate(slides):
        if s.get("asset_status") == "existing" and "--all" not in flags:
            continue
        targets.append((i, s))
    if not targets:
        sys.exit("No slides to generate (all are 'existing'; use --all to include them).")

    print(f"Model: {ART_MODEL}  ·  pillar accent: {accent}  ·  {len(targets)} slide(s)")
    for i, s in targets:
        print(f"  slide {i + 1} ({s['role']}): {build_prompt(s, accent, post.get("core_claim", ""))[:110]}…")
    if "--dry-run" in flags:
        print("\n(dry run — nothing generated)")
        return

    out_dir = os.path.join(RENDERER, "public", "backgrounds", prefix)
    os.makedirs(out_dir, exist_ok=True)

    try:
        import torch
        from diffusers import FluxPipeline  # type: ignore
    except Exception as e:  # pragma: no cover
        sys.exit(
            f"diffusers/torch not available ({e}).\n"
            'Install:  uv pip install "diffusers>=0.31" transformers accelerate torch sentencepiece protobuf pillow'
        )

    # FLUX.2 [klein] 4B (Apache-2.0, fits 8GB at FP8) uses a DIFFERENT pipeline class
    # than FLUX.1. We try it, but the most reliable 8GB route for FLUX.2 is ComfyUI's
    # official FP8 Klein-4B workflow. FLUX.2 [dev]/[klein] 9B are non-commercial + too big.
    is_flux2 = any(t in ART_MODEL.lower() for t in ("flux.2", "flux2", "klein"))
    if is_flux2:
        try:
            from diffusers import Flux2KleinPipeline as Pipe  # type: ignore
        except Exception:
            sys.exit(
                "This diffusers build lacks Flux2KleinPipeline (needed for FLUX.2 klein).\n"
                "Options: (1) upgrade diffusers (uv pip install -U diffusers), "
                "(2) run FLUX.2 klein 4B in ComfyUI with the official FP8 workflow (best for 8GB), "
                "or (3) keep ART_MODEL=black-forest-labs/FLUX.1-schnell (verified path).\n"
                "Use only the Apache-2.0 4B variant for commercial work — the 9B/dev models are non-commercial."
            )
        Pipe, offload = Pipe, "sequential"
    else:
        Pipe, offload = FluxPipeline, "model"

    print(f"Loading {ART_MODEL} (first run downloads weights)…")
    try:
        pipe = Pipe.from_pretrained(ART_MODEL, torch_dtype=torch.bfloat16)
    except Exception as e:
        msg = str(e).lower()
        if any(t in msg for t in ("gated", "403", "restricted", "authorized", "forbidden")):
            sys.exit(
                f"\n'{ART_MODEL}' is a GATED Hugging Face repo — you must accept its license and log in:\n"
                f"  1) Open https://huggingface.co/{ART_MODEL} and click 'Agree and access repository' (free, instant).\n"
                "  2) Create a READ token: https://huggingface.co/settings/tokens\n"
                "  3) Authenticate this venv:  .venv\\Scripts\\python -m huggingface_hub login   (or set env HF_TOKEN=hf_xxx)\n"
                f"  4) Re-run:  bun run art -- <post-key>\n"
                "Ungated alternative: run a GGUF build in ComfyUI (see docs/IMAGE_MODELS.md → Route B)."
            )
        raise
    if not torch.cuda.is_available():
        print("⚠ torch.cuda.is_available() is False — running on CPU (very slow). "
              "Install the CUDA build: see docs/IMAGE_MODELS.md → 'make sure torch uses your GPU'.")
    (pipe.enable_sequential_cpu_offload() if offload == "sequential" else pipe.enable_model_cpu_offload())

    for i, s in targets:
        role = ROLE_FILE.get(s["role"], s["role"])
        fname = f"{str(i + 1).zfill(2)}_{role}.png"
        prompt = build_prompt(s, accent, post.get("core_claim", ""))
        print(f"  → slide {i + 1} ({s['role']})…")
        image = pipe(
            prompt,
            guidance_scale=0.0,
            num_inference_steps=ART_STEPS,
            height=1216, width=832,  # portrait, FLUX-friendly; export cover-fits to 1080x1350
            max_sequence_length=256,
        ).images[0]
        image.save(os.path.join(out_dir, fname))
        s["background_asset"] = f"/backgrounds/{prefix}/{fname}"
        s["asset_status"] = "generated"

    json.dump(post, open(post_path, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
    open(post_path, "a", encoding="utf-8").write("\n")
    print(f"\n✓ Generated {len(targets)} background(s) → public/backgrounds/{prefix}/")
    print(f"  Post JSON updated (asset_status=generated). Now: bun run export -- {pos[0]}")
    print("  FLUX.1-schnell output is Apache-2.0 (commercial OK). Log it in the package LICENSES.md.")


if __name__ == "__main__":
    main()
