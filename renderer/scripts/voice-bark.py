#!/usr/bin/env python3
"""
Generate reel narration with Bark (Suno) — MIT licensed, free for commercial use.

Bark is an expressive transformer TTS (it can do emphasis and even non-verbal cues
like [laughs], [sighs]). Higher quality / more character than lightweight TTS, but
slower and occasionally unstable. Writes to renderer/public/audio/<prefix>/voice.wav.

Setup (uv):
    cd renderer
    uv pip install bark soundfile      # if that fails: uv pip install git+https://github.com/suno-ai/bark.git
    bun run voice -- <post-key>         # routes here when voice_mode=bark

Voice preset via BARK_VOICE (default v2/en_speaker_6 — a clear narrator).
GPU (your 3070 Ti) is used automatically if torch sees CUDA. Small-model mode:
    SUNO_USE_SMALL_MODELS=1 bun run voice -- <key>   (faster, a bit lower quality)

Usage: python scripts/voice-bark.py <post-key>
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
RENDERER = os.path.dirname(HERE)
POSTS = os.path.join(RENDERER, "content", "posts")
BARK_VOICE = os.environ.get("BARK_VOICE", "v2/en_speaker_6")


def find_post(key: str) -> str:
    if key.endswith(".json") and os.path.exists(key):
        return key
    for f in os.listdir(POSTS):
        if f.endswith(".json") and key in f:
            return os.path.join(POSTS, f)
    sys.exit(f"No post JSON in {POSTS} matching '{key}'.")


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit("Usage: python scripts/voice-bark.py <post-key>")
    post = json.load(open(find_post(sys.argv[1]), encoding="utf-8"))
    narration = (post.get("video") or {}).get("narration") or []
    if not narration:
        sys.exit("Post has no video.narration[] to synthesize.")
    lines = [n["text"].strip() for n in narration if n.get("text")]
    print(f"Bark voice: {BARK_VOICE}  ·  {len(lines)} line(s)")

    prefix = post["upload_package"]["filename_prefix"]
    out_dir = os.path.join(RENDERER, "public", "audio", prefix)
    os.makedirs(out_dir, exist_ok=True)
    out_wav = os.path.join(out_dir, "voice.wav")

    try:
        import numpy as np
        import soundfile as sf
        from bark import generate_audio, preload_models, SAMPLE_RATE  # type: ignore
    except Exception as e:  # pragma: no cover
        sys.exit(
            f"Bark not available ({e}).\n"
            "Install:  uv pip install bark soundfile\n"
            "  (if the PyPI name fails: uv pip install git+https://github.com/suno-ai/bark.git)"
        )

    print("Loading Bark models (first run downloads weights)…")
    preload_models()

    # Bark works best on sentence-sized chunks; render each narration line, then
    # concatenate with a short pause between lines.
    pause = np.zeros(int(0.25 * SAMPLE_RATE), dtype=np.float32)
    pieces = []
    for i, line in enumerate(lines):
        print(f"  [{i + 1}/{len(lines)}] {line[:70]}")
        audio = generate_audio(line, history_prompt=BARK_VOICE)
        pieces.append(np.asarray(audio, dtype=np.float32))
        pieces.append(pause)
    wav = np.concatenate(pieces) if pieces else np.zeros(1, dtype=np.float32)

    sf.write(out_wav, wav, SAMPLE_RATE)
    print(f"\n✓ Wrote {out_wav}  ({SAMPLE_RATE} Hz)")
    print(f"  Next: bun run reel -- {sys.argv[1]}   (and bun run align -- {sys.argv[1]} for exact word sync)")
    print("  Reminder: label AI-generated audio.")


if __name__ == "__main__":
    main()
