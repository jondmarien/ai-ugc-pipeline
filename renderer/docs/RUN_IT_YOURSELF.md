# RUN_IT_YOURSELF.md — Running the renderer in your terminal

No agent required. This is the full self-serve guide to producing carousels + reels and adding new content. Pairs with `../../pipeline/content/CONTENT_PIPELINE.md` (the upstream content workflow).

---

## 1. One-time setup

```bash
cd renderer
bun install
bunx playwright install chromium     # carousel screenshots
bunx remotion browser ensure         # reels (downloads a headless browser once)
```

## 2. The commands

Every command takes a **post key** = any unique substring of a file in `content/posts/` (the `slug` or `filename_prefix` both work).

| Command | Output |
| --- | --- |
| `bun run new -- <YYYY-MM-DD> <slug> <pillar>` | scaffold a new blank, schema-valid post JSON |
| `bun run validate -- <key>` | check a post JSON is well-formed (fails loud on mistakes) |
| `bun run export -- <key>` | 8 carousel PNGs (1080×1350) → `pipeline/renders/<date_slug>/` |
| `bun run package -- <key>` | `caption.txt`, `alt_text.txt`, `sources.md`, `LICENSES.md`, `render_qa_checklist.md` |
| `bun run reel -- <key>` | `<date_slug>_reel.mp4` (1080×1920 @30fps) — only if `video.enabled: true` |
| `bun run voice -- <key>` | generate narration → `public/audio/<prefix>/voice.wav` (routes by `voice_mode`) |
| `bun run align -- <key>` | Whisper word-timestamps → `beat.words[]` for exact `word`/`highlight` caption sync |
| `bun run art -- <key>` | generate AI backgrounds for inner slides (FLUX.1-schnell, local) → `public/backgrounds/<prefix>/` |
| `bun run dev` | live preview at `http://localhost:4317/?post=<slug>&mode=deck` |
| `bun run typecheck` | typecheck app + remotion |

`pillar` ∈ `offensive_ai · model_security · data_leakage · defensive_ai · governance · myth_busting`.

> **Runtime note:** this project runs on **Bun** (package manager + script runner; Bun runs the `.ts`/`.mjs` scripts natively — no `tsx`/`node` needed). Two carve-outs run on **Node** because Bun's runtime can't drive their Chromium: `bun run export` invokes `tsx` (Node) for Playwright, and `bun run reel` shells `bunx remotion` (Node-backed render). You don't do anything differently — the `bun run` commands handle it.

### Typical full run for one post
```bash
bun run validate -- 2026-06-02_ai-phishing-training
bun run export   -- 2026-06-02_ai-phishing-training
bun run package  -- 2026-06-02_ai-phishing-training
bun run reel     -- 2026-06-02_ai-phishing-training
```

---

## 2b. Automated drafting (uses the skills — idea → rendered, no manual JSON)

If you have the `claude` CLI installed and logged in, you don't have to fill JSON by hand. The repo ships two skills in `.claude/skills/` (`ai-cybersecurity-ugc-carousel` writes the content, `react-remotion-instagram-renderer` maps it to the schema) and a command that drives them end to end.

**Interactive (recommended)** — open Claude Code in the repo root and run:
```
/draft-post AI agents leaking RAG data | model_security
```
It researches real sources (WebSearch), writes a schema-valid `content/posts/<date>_<slug>.json`, validates, and renders the carousel + reel into `pipeline/renders/`. It reports which claims are sourced vs `[Scenario]` and what still needs a human eye.

**Headless / one-liner / CI:**
```bash
cd renderer
bun run draft -- "AI agents leaking RAG data" model_security
#   add [YYYY-MM-DD] to set the date
#   --captions=block|word|highlight   reel subtitle animation (default block)
#   --no-render       stop after JSON + validate (review before rendering)
#   --carousel-only   skip the reel
#   --yolo            unattended (claude --permission-mode bypassPermissions)
#   --dry-run         print the claude command/prompt, make no API calls
```

**Batch a whole week (up to 5 ideas):**
```
# interactive:
/draft-week voice clone fraud::offensive_ai | RAG leaks::model_security::captions=highlight | shadow AI::governance
# headless:
cd renderer && bun run draft-week -- "voice clone fraud::offensive_ai" "RAG leaks::model_security::captions=highlight" "shadow AI::governance"
```
Spreads posts across pillars, assigns sequential weekday dates, drafts + renders each into `pipeline/renders/`, and prints a week table. Per-idea options: `::pillar` and `::captions=word|highlight`. (Token-heavy — add `--no-render` to review copy first.)

> The LLM does the **content + source research**; your deterministic `bun` scripts do the **rendering**. The no-fabrication rule still applies — **review the generated `sources[]` and confirm the links are real before you post.** Quote the idea so it's one argument.

---

## 3. Make a NEW reel / carousel — by hand

### Fastest: scaffold + fill
```bash
bun run new -- 2026-06-13 ai-agent-permissions model_security
# → content/posts/2026-06-13_ai-agent-permissions.json  (8 slides, reel enabled, all TODOs)
```
Then open the file and replace every `TODO`:
- `core_claim`, `caption`, `comment_prompt`
- each slide's `on_slide_copy` / `subline` (kickers are pre-filled per role)
- `alt_text[]` (one per slide — count must stay at 8)
- `sources[]` (at least one real source — this keeps it factual)
- `score` axes (keep `total` = the sum of the five axes)
- reel `beats[]` captions + `narration[]` (or set `video.enabled: false` for carousel-only)

Then:
```bash
bun run validate -- 2026-06-13_ai-agent-permissions    # confirm it's clean
bun run export -- 2026-06-13_ai-agent-permissions && bun run package -- 2026-06-13_ai-agent-permissions && bun run reel -- 2026-06-13_ai-agent-permissions
```

### Alternative: copy an existing post
```bash
cp content/posts/2026-06-02_ai-phishing-training.json content/posts/2026-06-13_my-topic.json
# edit, then validate/export/package/reel as above
```

### Backgrounds
- **Inner slides** default to `asset_status: "procedural"` → a CSS-generated cyber background (dark + accent glow + grid). No image needed, but it's minimalist — that's the "blank-ish" look.
- **Real AI imagery on every slide:** `bun run art -- <key>` generates a background per inner slide with **FLUX.1-schnell** (local, Apache-2.0, commercial-OK — no server/Docker), writing to `public/backgrounds/<prefix>/` and flipping each slide to `asset_status: "generated"`. It builds each prompt from the slide's `visual_prompt` (or its on-slide copy + the post's core claim, so the image matches the topic). Then `bun run export` bakes them in.
  - Setup (uv): `uv pip install "diffusers>=0.31" transformers accelerate torch sentencepiece protobuf pillow`. Fits 8GB via cpu-offload (~10–20s/image after a one-time weights download). Preview prompts with `--dry-run`; include the cover too with `--all`; swap models with `ART_MODEL` (e.g. an SDXL repo). Log the model in the package `LICENSES.md`.
- **Cover** (or any slide) can use a hand-made image: drop a text-free PNG in `public/backgrounds/`, set `background_asset` + `asset_status: "existing"`.
- The scaffolder pre-points the cover at `public/backgrounds/<prefix>_cover.png` with status `needed` (renders procedurally until the file exists + you flip it to `existing`).

### Reels specifically
A reel renders from the post's `video` block. Each `beat` = `{start, end, slide_ref, purpose, motion, caption}`; the beat with `"purpose": "cta"` becomes the end card. Keep beats 3–6s, hook in the first ~2s. Full model: `REMOTION_REEL_WORKFLOW.md`.

**Subtitle style** is `video.caption_mode`: `block` (paragraph per scene, default), `word` (one word at a time), or `highlight` (full line, active word lit). Set it with `bun run new -- … --captions=<mode>` (or `--captions=` on draft, `captions=` in the slash commands), or just edit `video.caption_mode` in the JSON and re-run `bun run reel`.

**Exact word sync (Whisper):** by default `word`/`highlight` distribute word timing evenly across each beat (good enough). For *lip-tight* sync, after you've generated `voice.wav`, run **`bun run align -- <key>`** — it transcribes the audio with Whisper (`faster-whisper`, word timestamps, uses your `.venv`/GPU) and writes real per-word timings into `video.beats[].words[]`. Then `bun run reel -- <key>` snaps each word to the audio. Setup: `uv pip install faster-whisper`. Model via `WHISPER_MODEL` (default `base.en`). Whisper is **speech→text** — it aligns the existing narration, it does not generate the voice.

**Audio** is `video.audio` and is optional + file-driven (default = silent):
- `voice_mode`: `none` | `voxcpm2` (generate locally) | `file` (you supply `voice.wav`).
- `music_mode`: `none` | `free` | `licensed` | `generated` | `file`.
- Files live in `renderer/public/audio/<prefix>/` (`voice.wav`, `music.mp3`). Music is auto-ducked under the voice (`music_gain_db`, default −18).
- `voice_mode` choices: `none` · **`voxcpm2`** (local model) · **`http`** (OpenAI-compatible TTS server) · `file` (your own WAV).
- Set modes at generation: `bun run new -- … --voice=voxcpm2 --music=free` (also `--voice=`/`--music=` on `bun run draft`).
- **Generate narration:** `bun run voice -- <key>` (routes by `voice_mode`; override with `--voxcpm2`/`--http`):
  - **voxcpm2** — local model. Setup with **uv**: `cd renderer && uv venv && uv pip install voxcpm soundfile torch`. The dispatcher auto-uses `.venv`. VoxCPM2 ≈ 5 GB / 48 kHz; smaller via `VOXCPM_MODEL=openbmb/VoxCPM1.5`.
  - **http** — no download. Run a TTS server, then `bun run voice -- <key> --http`. Easiest: **Kokoro-FastAPI** `docker run -p 8880:8880 ghcr.io/remsky/kokoro-fastapi-gpu` (~80 MB, Apache-2.0). Configure with `TTS_BASE_URL` / `TTS_MODEL` / `TTS_VOICE` / `TTS_FORMAT`. **LM Studio (:1234) does not serve `/v1/audio/speech`, and Gemma is an LLM — use a TTS server.**
  - Apply the AI-audio disclosure; use a synthetic or your own authorized voice.
- **Music:** drop a commercial-safe track at `public/audio/<prefix>/music.mp3` (Pixabay / YouTube Audio Library / Mixkit — see `../../pipeline/media/MUSIC_SFX_GUIDE.md`). **Don't want music? Set `music_mode: none`** → voice-only reel; **commands don't change** (`bun run voice` then `bun run reel`).
- **If a file is missing**, `bun run reel` warns and renders **silent/voice-only** (it won't crash) — add files later and re-run `bun run reel -- <key>`. Log every audio asset in `LICENSES.md` (QA Gate 7). **Never use F5-TTS base weights commercially (CC-BY-NC).** The PoC reel has **no audio** — to add narration (VoxCPM2) + music, follow that doc's "Growing the stub into a narrated cut" section and log everything in `LICENSES.md`.

### Render the rest of Week 1
Only Post 1 ships as JSON. Posts 2–5 are Markdown in `../../pipeline/content/WEEK_1_POSTS.md` — scaffold one JSON per post (`bun run new …`), paste that post's slides/caption/sources, then export.

---

## 4. New ideas / Week 2 (the upstream content workflow)

The renderer only draws decided content. New ideas come from the content kit (human Markdown, no script):

1. **Capture** ideas → add rows to `../../pipeline/content/IDEA_BACKLOG.md`.
2. **Score & pick** → keep the 5 best (produce if total ≥ 18); vary the pillars.
3. **Draft** → use `../../pipeline/content/POST_TEMPLATE.md` (8-slide script + caption + sources).
4. **QA** → run `../../pipeline/content/QA_CHECKLIST.md`.
5. **Render** → `bun run new …`, fill it from your draft, then export/package/reel.

Weekly cadence (Mon intake → Tue score → Wed script → Thu render → Fri QA/post) lives in `../../pipeline/content/CONTENT_PIPELINE.md`. "Week 2" is just repeating that loop and dropping new JSON into `content/posts/`.

---

## 5. Troubleshooting

| Symptom | Fix |
| --- | --- |
| `export`/`dev` hangs at startup | A stale dev server holds port 4317. Find + kill it: `netstat -ano \| grep :4317` then `taskkill //PID <pid> //F`. |
| `reel` errors "setting up headless browser" | Run `bunx remotion browser ensure` once. |
| `reel` prints a `zod version mismatch` warning | Harmless — the renderer doesn't use Remotion's zod feature. Ignore it. |
| `validate`/`export` exits non-zero with field errors | The JSON is incomplete/inconsistent. Fix the named field — the renderer never guesses. Common ones: `alt_text` count ≠ 8, `score.total` ≠ sum, slide 1 not `cover`. |
| Cover renders blank/procedural when you expected an image | The PNG isn't in `public/backgrounds/` or `asset_status` isn't `"existing"`. |

## 6. After rendering → manual upload
Open `pipeline/renders/<date_slug>/`: upload the PNGs in filename order (01→08), paste `caption.txt`, add per-slide alt text from `alt_text.txt`, and post the reel MP4 separately if used. Keep `sources.md` + `LICENSES.md` for your records. (API auto-posting stays out of scope until Meta access clears.)
