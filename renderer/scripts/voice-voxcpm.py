#!/usr/bin/env python3
"""
Generate reel narration with VoxCPM2 (open-source, Apache-2.0, commercial-OK).

Reads a post JSON, concatenates its `video.narration[].text` into one script,
synthesizes speech locally with VoxCPM2, and writes a WAV to
  renderer/public/audio/<filename_prefix>/voice.wav
which is exactly where `video.audio.voice_file` points by default.

REQUIRES a local VoxCPM2 setup (this is NOT run by the JS pipeline automatically):
    python -m pip install voxcpm soundfile
    # CUDA build of torch recommended (RTX 3060+/~8GB VRAM); CPU works but is slow.

Usage:
    python scripts/voice-voxcpm.py <post-key> [--voice-ref path/to/reference.wav]

Notes:
- Per VoxCPM2's terms of use: no impersonation/fraud; label AI-generated audio.
- Use a synthetic voice or your OWN authorized reference sample only.
- After it writes voice.wav, run:  npm run reel -- <post-key>
"""
import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
RENDERER = os.path.dirname(HERE)
POSTS = os.path.join(RENDERER, "content", "posts")


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
    ap.add_argument("--voice-ref", help="optional authorized reference WAV for voice cloning")
    args = ap.parse_args()

    post_path = find_post(args.key)
    post = json.load(open(post_path, encoding="utf-8"))
    video = post.get("video") or {}
    narration = video.get("narration") or []
    if not narration:
        sys.exit("Post has no video.narration[] to synthesize.")
    script = " ".join(n["text"].strip() for n in narration if n.get("text"))
    print(f"Script ({len(script)} chars):\n  {script}\n")

    prefix = post["upload_package"]["filename_prefix"]
    out_dir = os.path.join(RENDERER, "public", "audio", prefix)
    os.makedirs(out_dir, exist_ok=True)
    out_wav = os.path.join(out_dir, "voice.wav")

    try:
        import soundfile as sf  # noqa
        from voxcpm import VoxCPM  # type: ignore
    except Exception as e:  # pragma: no cover - depends on local install
        sys.exit(
            f"VoxCPM2 not available ({e}).\n"
            "Install locally:  python -m pip install voxcpm soundfile  (CUDA torch recommended).\n"
            "Then re-run this script. See renderer/docs/REMOTION_REEL_WORKFLOW.md."
        )

    print("Loading VoxCPM2 (first run downloads weights)…")
    model = VoxCPM.from_pretrained("openbmb/VoxCPM2")
    kwargs = {}
    if args.voice_ref:
        kwargs["prompt_wav_path"] = args.voice_ref  # clone an AUTHORIZED voice only
    wav = model.generate(text=script, **kwargs)

    sr = getattr(model, "sample_rate", 24000)
    sf.write(out_wav, wav, sr)
    print(f"\n✓ Wrote {out_wav}")
    print(f"  Set video.audio.voice_file = /audio/{prefix}/voice.wav (default already does).")
    print(f"  Next: npm run reel -- {args.key}")
    print("  Reminder: label AI-generated audio per VoxCPM2's terms.")


if __name__ == "__main__":
    main()
