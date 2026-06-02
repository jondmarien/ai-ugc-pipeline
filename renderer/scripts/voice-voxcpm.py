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
    python scripts/voice-voxcpm.py <post-key> [--voice-ref path/to/reference.wav]

Notes:
- Per VoxCPM2's terms of use: no impersonation/fraud; LABEL AI-generated audio.
- Clone only a synthetic voice or your OWN authorized reference sample.
"""
import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
RENDERER = os.path.dirname(HERE)
POSTS = os.path.join(RENDERER, "content", "posts")
DEFAULT_MODEL = os.environ.get("VOXCPM_MODEL", "openbmb/VoxCPM2")


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
    ap.add_argument("--voice-ref", help="optional AUTHORIZED reference WAV for voice cloning")
    args = ap.parse_args()

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
        sys.exit(
            f"VoxCPM not available ({e}).\n"
            "Install:  uv pip install voxcpm soundfile torch  (CUDA torch recommended).\n"
            "See renderer/docs/REMOTION_REEL_WORKFLOW.md. Prefer the HTTP TTS mode "
            "(Kokoro-FastAPI) if you'd rather not download a multi-GB model."
        )

    print(f"Loading {DEFAULT_MODEL} (first run downloads weights)…")
    model = VoxCPM.from_pretrained(DEFAULT_MODEL)

    kwargs = {}
    if args.voice_ref:
        kwargs["reference_wav_path"] = args.voice_ref  # clone an AUTHORIZED voice only

    wav = model.generate(text=script, **kwargs)
    # generate() returns a 1D float32 ndarray (or a generator of chunks when streaming).
    if not isinstance(wav, np.ndarray):
        wav = np.concatenate(list(wav))

    # IMPORTANT: VoxCPM2 outputs 48 kHz — read the model's real rate, never hardcode.
    sr = getattr(getattr(model, "tts_model", None), "sample_rate", None) or 24000

    sf.write(out_wav, wav, int(sr))
    print(f"\n✓ Wrote {out_wav}  ({sr} Hz)")
    print(f"  video.audio.voice_file already points to /audio/{prefix}/voice.wav.")
    print(f"  Next: npm run reel -- {args.key}")
    print("  Reminder: label AI-generated audio per VoxCPM2's terms.")


if __name__ == "__main__":
    main()
