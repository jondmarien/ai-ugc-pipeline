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


# Whisper mishears a few project-specific proper nouns; fix them after transcription.
# Key is matched case-insensitively as a whole word; value is the correct spelling.
CORRECTIONS = {
    "olima": "Ollama", "ollamma": "Ollama", "olama": "Ollama",
    "unslot": "Unsloth", "unsloss": "Unsloth",
    "vox cpm": "VoxCPM", "voxcom": "VoxCPM",
    "hexstrike": "HexStrike", "net scaler": "NetScaler",
    # "Nous" (Nous Research) is French, spoken like "noo" (silent s); narration spells it
    # phonetically so VoxCPM says it right, and we map the transcription back to "Nous" for the
    # caption. "Nous" is also in KNOWN_NOUNS so Whisper is biased toward that spelling.
    "noo": "Nous", "noos": "Nous", "noose": "Nous",
    # Whisper fuses fast-spoken word pairs or drops a trailing consonant. Corrections are
    # applied per word token, so keys must be single tokens; these are never legitimate in
    # this domain ("lease" → "least privilege" context), so they're safe to apply globally.
    "patchfast": "Patch fast",
    "lease": "least",
}


def merge_hyphens(words):
    """Whisper splits compounds and numbers at their punctuation ('first-ever' -> 'first' +
    '-ever'; 'AI-assisting' -> 'AI' + '-assisting'; '180,000' -> '180' + ',000'). Glue any token
    that BEGINS with joining punctuation (- , . ' ’) onto the previous word with NO space, and
    glue a word ending in a dangling hyphen onto the next — so captions read 'first-ever' and
    '180,000', never 'first -ever', a lone '-assisting', or '180' then ',000'. Timings merge."""
    out = []
    for w in words:
        t = (w.get("text") or "").strip()
        if not t:
            continue
        if out and t[0] in "-,.'’":                   # leading joining-punctuation fragment → glue to prev
            out[-1]["text"] += t
            out[-1]["end"] = w["end"]
        elif out and out[-1]["text"].endswith("-"):   # prev had a dangling hyphen → glue this
            out[-1]["text"] += t
            out[-1]["end"] = w["end"]
        else:
            out.append({"text": t, "start": w["start"], "end": w["end"]})
    return out


def fix_proper_nouns(words, corrections):
    """Apply corrections to merged caption words (case-insensitive, punctuation-preserving)."""
    import re
    for w in words:
        for bad, good in corrections.items():
            w["text"] = re.sub(rf"(?i)\b{re.escape(bad)}\b", good, w["text"])
    return words


# Extra project nouns Whisper should spell right but that aren't in CORRECTIONS' typo map.
KNOWN_NOUNS = ["Ollama", "Unsloth", "VoxCPM", "HexStrike", "NetScaler", "Gemma", "Hermes", "Nous", "Miso", "Arup"]


def build_noun_hint(narration) -> str:
    """A SHORT proper-noun vocabulary string to bias Whisper's spelling (e.g. 'Ollama, VoxCPM,
    MFA, LLM'). Deliberately NOT the full narration: feeding whole sentences makes the decoder
    skip the opening. We seed with KNOWN_NOUNS, then add acronyms (ALL-CAPS, 2+ chars) and
    CamelCase tokens found in this post's narration so new names get biased too."""
    import re
    vocab = list(dict.fromkeys(KNOWN_NOUNS))  # ordered, de-duped
    seen = {v.lower() for v in vocab}
    text = " ".join((n.get("text") or "") for n in narration)
    for tok in re.findall(r"[A-Za-z][A-Za-z0-9]+", text):
        is_acronym = tok.isupper() and len(tok) >= 2          # MFA, LLM, API, OWASP
        is_camel = bool(re.search(r"[a-z][A-Z]", tok))        # VoxCPM, NetScaler, PoCs
        if (is_acronym or is_camel) and tok.lower() not in seen:
            vocab.append(tok); seen.add(tok.lower())
    return ", ".join(vocab) + "."


def trim_trailing_hallucination(words, narration, voice_wav):
    """VoxCPM2 cloning sometimes keeps talking past the script, appending a few seconds of
    hallucinated audio (e.g. '...I really think it needs to be done'). Detect it by anchoring on
    the narration's final 3 words: if Whisper produced extra words AFTER the script ends, trim
    both the caption word list AND voice.wav to the end of the real narration. Conservative — only
    fires when the anchor is found and there is >0.4s of trailing extra past the last 75% of audio,
    so a clean render or a missed anchor is never wrongly truncated."""
    import re
    import shutil
    import subprocess

    norm = lambda s: re.sub(r"[^a-z0-9]+", "", s.lower())
    ntoks = [norm(t) for n in narration for t in (n.get("text") or "").split()]
    ntoks = [t for t in ntoks if t]
    if len(ntoks) < 3 or len(words) < 4:
        return words
    anchor = ntoks[-3:]
    wn = [norm(w["text"]) for w in words]
    cut = None
    for j in range(len(wn) - 1, 1, -1):                 # last occurrence of the 3-word anchor
        if wn[j - 2:j + 1] == anchor:
            cut = j
            break
    if cut is None or cut >= len(words) - 1:
        return words                                    # no anchor found, or nothing trailing it
    end_t = words[cut]["end"]
    total = words[-1]["end"]
    extra = total - end_t
    if extra < 0.4 or end_t < 0.75 * total:             # too little trailing, or anchor too early
        return words
    new_end = round(end_t + 0.20, 3)                    # small pad so the last word isn't clipped
    tmp = voice_wav + ".trim.wav"
    try:
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", voice_wav,
                        "-t", f"{new_end}", "-c:a", "pcm_s16le", tmp], check=True)
        shutil.move(tmp, voice_wav)
    except Exception as e:                              # leave audio untouched if ffmpeg fails
        print(f"  ⚠ detected a {extra:.1f}s hallucinated tail but could not trim audio ({e}).")
        return words
    print(f"  ↳ trimmed {extra:.1f}s of clone hallucination past the script (audio now {new_end:.1f}s).")
    return words[:cut + 1]


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
    # Bias Whisper toward our proper nouns with a SHORT vocabulary hint, NOT the full script.
    # Feeding the whole narration as initial_prompt makes the decoder think it already spoke the
    # opening lines and skip ahead, dropping the first ~10-20s of captions entirely (the audio is
    # fine; only the transcript is truncated). A short noun-only hint biases spelling without the
    # skip. We assemble it from the known project terms (CORRECTIONS targets) plus any acronyms
    # (MFA, LLM) or CamelCase names (VoxCPM) found in this post's narration.
    hint = build_noun_hint(video.get("narration") or [])
    segments, _info = model.transcribe(voice_wav, word_timestamps=True, language="en", initial_prompt=hint or None)

    words = []  # absolute-time word list
    for seg in segments:
        for w in (seg.words or []):
            words.append({"text": w.word.strip(), "start": float(w.start), "end": float(w.end)})
    if not words:
        sys.exit("Whisper returned no words — check the audio.")
    # Per-post caption_corrections (e.g. {"new": "Nous"}) extend the global map for THIS post only,
    # so a phonetic narration spelling can be mapped back without risking other posts' captions.
    corrections = {**CORRECTIONS, **{str(k).lower(): str(v) for k, v in (video.get("caption_corrections") or {}).items()}}
    words = fix_proper_nouns(merge_hyphens(words), corrections)  # un-split compounds/numbers + fix proper nouns
    words = trim_trailing_hallucination(words, video.get("narration") or [], voice_wav)
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
