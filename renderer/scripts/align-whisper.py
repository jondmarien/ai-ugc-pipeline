#!/usr/bin/env python3
"""
Align reel captions to the generated narration using Whisper (STT) word timestamps.

Whisper is speech-TO-text; it does NOT generate the voice. Run it AFTER you have a
voice.wav (from `bun run voice`) to get exact per-word timing, then write those
timings into the post's video.beats[].words[] (relative to each beat) so the
`word` / `highlight` caption modes are lip-tight instead of evenly distributed.

Setup (uv):
    cd renderer
    uv pip install faster-whisper
    bun run align -- <post-key>     # the wrapper auto-uses .venv

Model size via WHISPER_MODEL (default base.en): tiny.en | base.en | small.en | medium.en | large-v3
Device auto-detects CUDA (your 3070 Ti) → float16, else CPU int8.

Usage: python scripts/align-whisper.py <post-key>
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
RENDERER = os.path.dirname(HERE)
POSTS = os.path.join(RENDERER, "content", "posts")
WHISPER_MODEL = os.environ.get("WHISPER_MODEL", "base.en")


def find_post_path(key: str) -> str:
    if key.endswith(".json") and os.path.exists(key):
        return key
    for f in os.listdir(POSTS):
        if f.endswith(".json") and key in f:
            return os.path.join(POSTS, f)
    sys.exit(f"No post JSON in {POSTS} matching '{key}'.")


def merge_hyphens(words):
    """Whisper splits hyphenated compounds at the hyphen ('first-ever' -> 'first' + '-ever';
    'AI-assisting' -> 'AI' + '-assisting'). Glue any token that begins with a hyphen (or a bare
    '-') onto the previous word with NO space, and glue a word ending in a dangling hyphen onto
    the next — so captions read 'first-ever', never 'first -ever' or a lone '-assisting'. Word
    timings merge (prev.start … this.end) so highlight/word modes still sync."""
    out = []
    for w in words:
        t = (w.get("text") or "").strip()
        if not t:
            continue
        if out and t[0] == "-":                       # leading-hyphen fragment → glue to prev
            out[-1]["text"] += t
            out[-1]["end"] = w["end"]
        elif out and out[-1]["text"].endswith("-"):   # prev had a dangling hyphen → glue this
            out[-1]["text"] += t
            out[-1]["end"] = w["end"]
        else:
            out.append({"text": t, "start": w["start"], "end": w["end"]})
    return out


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit("Usage: python scripts/align-whisper.py <post-key>")
    post_path = find_post_path(sys.argv[1])
    post = json.load(open(post_path, encoding="utf-8"))
    video = post.get("video") or {}
    beats = video.get("beats") or []
    if not beats:
        sys.exit("Post has no video.beats[] to align.")

    prefix = post["upload_package"]["filename_prefix"]
    voice_wav = os.path.join(RENDERER, "public", "audio", prefix, "voice.wav")
    if not os.path.exists(voice_wav):
        sys.exit(f"No narration at {voice_wav}. Generate it first:  bun run voice -- {sys.argv[1]}")

    try:
        from faster_whisper import WhisperModel  # type: ignore
    except Exception as e:  # pragma: no cover
        sys.exit(f"faster-whisper not installed ({e}). Run:  uv pip install faster-whisper")

    # Device auto-detect: CUDA if torch sees a GPU, else CPU.
    device, compute = "cpu", "int8"
    try:
        import torch  # type: ignore
        if torch.cuda.is_available():
            device, compute = "cuda", "float16"
    except Exception:
        pass

    print(f"Whisper: {WHISPER_MODEL} on {device} ({compute}) → {os.path.basename(voice_wav)}")
    model = WhisperModel(WHISPER_MODEL, device=device, compute_type=compute)
    segments, _info = model.transcribe(voice_wav, word_timestamps=True, language="en")

    words = []  # absolute-time word list
    for seg in segments:
        for w in (seg.words or []):
            words.append({"text": w.word.strip(), "start": float(w.start), "end": float(w.end)})
    if not words:
        sys.exit("Whisper returned no words — check the audio.")
    words = merge_hyphens(words)  # un-split hyphenated compounds (first-ever, AI-assisting)
    print(f"  {len(words)} words, {words[-1]['end']:.1f}s total")

    # Re-chunk the transcript into short caption lines (≤ ~7 words, ≤ ~3.5s, or a
    # >0.6s pause), each with absolute word timings. The reel renders these EXACTLY
    # synced to the voice — they ARE the spoken words, not the planned beat text.
    MAX_WORDS, MAX_DUR, GAP = 7, 3.5, 0.6
    captions, cur = [], []

    def flush():
        if cur:
            captions.append({
                "start": round(cur[0]["start"], 3),
                "end": round(cur[-1]["end"], 3),
                "text": " ".join(w["text"] for w in cur),
                "words": [{"text": w["text"], "start": round(w["start"], 3), "end": round(w["end"], 3)} for w in cur],
            })

    for i, w in enumerate(words):
        if cur:
            too_long = len(cur) >= MAX_WORDS or (w["end"] - cur[0]["start"]) > MAX_DUR
            big_gap = (w["start"] - cur[-1]["end"]) > GAP
            if too_long or big_gap:
                flush(); cur = []
        cur.append(w)
    flush()

    post.setdefault("video", {})["captions"] = captions
    json.dump(post, open(post_path, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
    open(post_path, "a", encoding="utf-8").write("\n")
    print(f"\n✓ Wrote {len(captions)} voice-synced caption lines → video.captions in {os.path.relpath(post_path, RENDERER)}")
    print(f"  These now match the voice exactly (transcript + real timing). Re-render: bun run reel -- {sys.argv[1]} --fit-voice")


if __name__ == "__main__":
    main()
