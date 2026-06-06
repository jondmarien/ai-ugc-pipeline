#!/usr/bin/env python3
"""
Generate reel narration with VoxCPM2 (open-source, Apache-2.0, commercial-OK).

Reads a post JSON, concatenates its `video.narration[].text` into one script,
synthesizes speech locally with VoxCPM, and writes a WAV to
  renderer/public/audio/<filename_prefix>/voice.wav
which is exactly where `video.audio.voice_file` points by default.

Setup (uv recommended):
    cd renderer
    uv venv                 # if you haven't already
    uv pip install voxcpm soundfile torch
    npm run voice -- <post-key>     # the wrapper auto-uses .venv

Or call directly with the venv's python:
    .venv/Scripts/python scripts/voice-voxcpm.py <post-key>

Model size: openbmb/VoxCPM2 (default) is the 2B model (~5 GB, 48 kHz, best quality).
For a much smaller download set VOXCPM_MODEL:
    VOXCPM_MODEL=openbmb/VoxCPM1.5   # 0.6B, EN/ZH, 44.1 kHz
    VOXCPM_MODEL=openbmb/VoxCPM-0.5B # 0.5B, EN/ZH, 16 kHz

Usage:
    python scripts/voice-voxcpm.py <post-key> [--custom-voice path/to/reference.wav] [--seed N]
    (--voice-ref is kept as an alias of --custom-voice)

Notes:
- Per VoxCPM2's terms of use: no impersonation/fraud; LABEL AI-generated audio.
- Clone only a synthetic voice or your OWN authorized reference sample.
"""
import argparse
import datetime
import faulthandler
import json
import os
import random
import sys

# Surface native (C-level) crashes — VoxCPM/torch can hard-crash without a Python
# traceback (process dies, cryptic exit code). faulthandler dumps the stack on fatal
# signals so we can see WHERE it died.
faulthandler.enable()

HERE = os.path.dirname(os.path.abspath(__file__))
RENDERER = os.path.dirname(HERE)
REPO = os.path.dirname(RENDERER)
POSTS = os.path.join(RENDERER, "content", "posts")
DEFAULT_MODEL = os.environ.get("VOXCPM_MODEL", "openbmb/VoxCPM2")
# Seeds known to make VoxCPM degenerate into non-terminating generation (very slow). Never auto-pick these.
BAD_SEEDS = {777}


def find_post(key: str) -> str:
    if key.endswith(".json") and os.path.exists(key):
        return key
    for f in os.listdir(POSTS):
        if f.endswith(".json") and key in f:
            return os.path.join(POSTS, f)
    sys.exit(f"No post JSON in {POSTS} matching '{key}'.")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("key", help="post slug / filename_prefix / path")
    ap.add_argument("--custom-voice", "--voice-ref", dest="voice_ref",
                  help="path to an AUTHORIZED reference WAV to clone (your OWN voice only). "
                       "Zero-shot: timbre comes from this clip; a seed is optional.")
    ap.add_argument(
        "--seed",
        type=int,
        default=None,
        help="RNG seed to LOCK the speaker (same seed = same voice). Omitted by default → "
        "random speaker, which is FAST. WARNING: an unlucky seed can make VoxCPM2 generate a "
        "degenerate, non-terminating sequence (runs toward max_len → very slow). If a seed "
        "crawls, it's just unlucky — pick another. Also settable via VOXCPM_SEED.",
    )
    args = ap.parse_args()
    seed = args.seed
    if seed is None and os.environ.get("VOXCPM_SEED"):
        try:
            seed = int(os.environ["VOXCPM_SEED"])
        except ValueError:
            seed = None
    # Always end up with a concrete seed so the voice is reproducible AND loggable. If the
    # caller didn't pin one, roll a random seed (avoiding known-bad ones) and record it.
    seed_source = "fixed" if seed is not None else "auto"
    if seed is None:
        seed = random.randint(1, 2**31 - 1)
        while seed in BAD_SEEDS:
            seed = random.randint(1, 2**31 - 1)

    post = json.load(open(find_post(args.key), encoding="utf-8"))
    narration = (post.get("video") or {}).get("narration") or []
    if not narration:
        sys.exit("Post has no video.narration[] to synthesize.")
    script = " ".join(n["text"].strip() for n in narration if n.get("text"))
    print(f"Model: {DEFAULT_MODEL}\nScript ({len(script)} chars):\n  {script}\n")

    prefix = post["upload_package"]["filename_prefix"]
    out_dir = os.path.join(RENDERER, "public", "audio", prefix)
    os.makedirs(out_dir, exist_ok=True)
    out_wav = os.path.join(out_dir, "voice.wav")

    try:
        import numpy as np
        import soundfile as sf
        from voxcpm import VoxCPM  # type: ignore
    except Exception as e:  # pragma: no cover - depends on local install
        hint = ""
        if "WinError 127" in str(e) or "specified procedure" in str(e):
            hint = (
                "\n→ This is almost always a torch/torchaudio VERSION MISMATCH (torchaudio's native\n"
                "  _torchaudio.pyd can't load against a different torch). Pin them to the same release:\n"
                "    uv pip install \"torchaudio==2.8.0\" --index-url https://download.pytorch.org/whl/cu128\n"
                "  (match torchaudio to your installed torch — see renderer/pyproject.toml, which locks the trio)."
            )
        sys.exit(
            f"VoxCPM not available ({e}).{hint}\n"
            "Install (or repair) from renderer/:  uv sync   (or  uv pip install -e .)\n"
            "See renderer/docs/REMOTION_REEL_WORKFLOW.md. Prefer the HTTP TTS mode "
            "(Kokoro-FastAPI) if you'd rather not download a multi-GB model."
        )

    print(f"Loading {DEFAULT_MODEL} (first run downloads weights)…")
    # load_denoiser=False: we do plain TTS, not reference-audio cleanup. The denoiser
    # (zipenhancer) imports modelscope → datasets → pandas → pyarrow, whose native lib
    # crashes on Windows (access violation, exit code 5). Skipping it avoids the crash.
    # optimize: torch.compile needs Triton (absent on Windows by default). Set
    # VOXCPM_OPTIMIZE=1 only if you've installed triton-windows.
    model = VoxCPM.from_pretrained(
        DEFAULT_MODEL,
        load_denoiser=False,
        optimize=os.environ.get("VOXCPM_OPTIMIZE", "0") == "1",
    )

    # inference_timesteps: diffusion steps (4–30). Lower = faster, slightly less detail.
    # 10 is the model default; drop to ~6 to speed up on weaker GPUs (VOXCPM_TIMESTEPS).
    kwargs = {"inference_timesteps": int(os.environ.get("VOXCPM_TIMESTEPS", "10"))}
    if args.voice_ref:
        kwargs["reference_wav_path"] = args.voice_ref  # clone an AUTHORIZED voice only

    # Seed the RNG right before generation ONLY if a seed was given — a fixed seed locks
    # the speaker (reproducible voice) but an unlucky one can stall generation. Default
    # (no seed) = random + fast, which is the right default.
    import torch  # noqa: E402  (torch is already loaded via voxcpm)

    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
    print(
        f"Voice seed: {seed} ({seed_source}) — locks this speaker. "
        f"Reuse with --seed={seed}. (If a run crawls, that seed is unlucky; pick another.)",
        file=sys.stderr,
    )

    try:
        wav = model.generate(text=script, **kwargs)
    except Exception as e:  # pragma: no cover - runtime/VRAM dependent
        msg = str(e)
        oom = any(s in msg.lower() for s in ("out of memory", "cuda", "alloc", "cublas", "cudnn"))
        sys.exit(
            f"VoxCPM generation failed: {e}\n"
            + (
                "→ Almost certainly a VRAM conflict: VoxCPM2 needs ~5 GB on the GPU, and on an 8 GB card\n"
                "  it can't share with ComfyUI's loaded models. Fix: fully close ComfyUI (or free its VRAM)\n"
                "  before running voice; OR force CPU with `CUDA_VISIBLE_DEVICES= bun run voice -- <key>` (slow);\n"
                "  OR switch the post to the HTTP TTS mode (Kokoro-FastAPI). See REMOTION_REEL_WORKFLOW.md.\n"
                if oom
                else "→ Re-run and check the traceback above for the cause.\n"
            )
        )
    # generate() returns a 1D float32 ndarray (or a generator of chunks when streaming).
    if not isinstance(wav, np.ndarray):
        wav = np.concatenate(list(wav))

    # IMPORTANT: VoxCPM2 outputs 48 kHz — read the model's real rate, never hardcode.
    sr = getattr(getattr(model, "tts_model", None), "sample_rate", None) or 24000

    sf.write(out_wav, wav, int(sr))

    # Log the seed (+ run details) so a voice you like can be reproduced exactly. Written next
    # to the WAV and, if the render package folder exists, into pipeline/renders/<prefix>/ too.
    meta = {
        "seed": seed,
        "seed_source": seed_source,  # "fixed" (you passed --seed) or "auto" (rolled for you)
        "model": DEFAULT_MODEL,
        "sample_rate": int(sr),
        "inference_timesteps": kwargs["inference_timesteps"],
        "voice_ref": args.voice_ref or None,
        "script_chars": len(script),
        "generated_at": datetime.datetime.now().isoformat(timespec="seconds"),
        "reuse_command": f"bun run pipeline -- {args.key} --seed={seed}",
    }
    meta_json = json.dumps(meta, indent=2) + "\n"
    with open(os.path.join(out_dir, "voice.meta.json"), "w", encoding="utf-8") as f:
        f.write(meta_json)
    renders_dir = os.path.join(REPO, "pipeline", "renders", prefix)
    os.makedirs(renders_dir, exist_ok=True)
    with open(os.path.join(renders_dir, "voice.meta.json"), "w", encoding="utf-8") as f:
        f.write(meta_json)

    print(f"\n✓ Wrote {out_wav}  ({sr} Hz)")
    print(f"✓ Voice seed {seed} logged → pipeline/renders/{prefix}/voice.meta.json")
    print(f"  Like this voice? Reuse it:  bun run pipeline -- {args.key} --seed={seed}")
    print(f"  video.audio.voice_file already points to /audio/{prefix}/voice.wav.")
    print(f"  Next: bun run align -- {args.key}   (sync captions to this voice)")
    print(f"  Then: bun run reel -- {args.key} --fit-voice")
    print("  Reminder: label AI-generated audio per VoxCPM's terms.")


if __name__ == "__main__":
    main()
