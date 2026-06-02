# RUN_IT_YOURSELF.md — Running the renderer in your terminal

No agent required. This is the full self-serve guide to producing carousels + reels and adding new content. Pairs with `../../pipeline/content/CONTENT_PIPELINE.md` (the upstream content workflow).

---

## 1. One-time setup

```bash
cd renderer
npm install
npx playwright install chromium     # carousel screenshots
npx remotion browser ensure         # reels (downloads a headless browser once)
```

## 2. The commands

Every command takes a **post key** = any unique substring of a file in `content/posts/` (the `slug` or `filename_prefix` both work).

| Command | Output |
| --- | --- |
| `npm run new -- <YYYY-MM-DD> <slug> <pillar>` | scaffold a new blank, schema-valid post JSON |
| `npm run validate -- <key>` | check a post JSON is well-formed (fails loud on mistakes) |
| `npm run export -- <key>` | 8 carousel PNGs (1080×1350) → `pipeline/renders/<date_slug>/` |
| `npm run package -- <key>` | `caption.txt`, `alt_text.txt`, `sources.md`, `LICENSES.md`, `render_qa_checklist.md` |
| `npm run reel -- <key>` | `<date_slug>_reel.mp4` (1080×1920 @30fps) — only if `video.enabled: true` |
| `npm run dev` | live preview at `http://localhost:4317/?post=<slug>&mode=deck` |

`pillar` ∈ `offensive_ai · model_security · data_leakage · defensive_ai · governance · myth_busting`.

### Typical full run for one post
```bash
npm run validate -- 2026-06-02_ai-phishing-training
npm run export   -- 2026-06-02_ai-phishing-training
npm run package  -- 2026-06-02_ai-phishing-training
npm run reel     -- 2026-06-02_ai-phishing-training
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
npm run draft -- "AI agents leaking RAG data" model_security
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
cd renderer && npm run draft-week -- "voice clone fraud::offensive_ai" "RAG leaks::model_security::captions=highlight" "shadow AI::governance"
```
Spreads posts across pillars, assigns sequential weekday dates, drafts + renders each into `pipeline/renders/`, and prints a week table. Per-idea options: `::pillar` and `::captions=word|highlight`. (Token-heavy — add `--no-render` to review copy first.)

> The LLM does the **content + source research**; your deterministic `npm` scripts do the **rendering**. The no-fabrication rule still applies — **review the generated `sources[]` and confirm the links are real before you post.** Quote the idea so it's one argument.

---

## 3. Make a NEW reel / carousel — by hand

### Fastest: scaffold + fill
```bash
npm run new -- 2026-06-13 ai-agent-permissions model_security
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
npm run validate -- 2026-06-13_ai-agent-permissions    # confirm it's clean
npm run export -- 2026-06-13_ai-agent-permissions && npm run package -- 2026-06-13_ai-agent-permissions && npm run reel -- 2026-06-13_ai-agent-permissions
```

### Alternative: copy an existing post
```bash
cp content/posts/2026-06-02_ai-phishing-training.json content/posts/2026-06-13_my-topic.json
# edit, then validate/export/package/reel as above
```

### Backgrounds
- **Inner slides** default to `asset_status: "procedural"` → CSS-generated cyber background, no image needed.
- **Cover** (or any slide) can use a real image: drop a **1080×1350** text-free PNG in `public/backgrounds/`, set the slide's `background_asset: "/backgrounds/<file>.png"` and `asset_status: "existing"`.
- The scaffolder pre-points the cover at `public/backgrounds/<prefix>_cover.png` with status `needed` (renders procedurally until the file exists + you flip it to `existing`).

### Reels specifically
A reel renders from the post's `video` block. Each `beat` = `{start, end, slide_ref, purpose, motion, caption}`; the beat with `"purpose": "cta"` becomes the end card. Keep beats 3–6s, hook in the first ~2s. Full model: `REMOTION_REEL_WORKFLOW.md`.

**Subtitle style** is `video.caption_mode`: `block` (paragraph per scene, default), `word` (one word at a time), or `highlight` (full line, active word lit). Set it with `npm run new -- … --captions=<mode>` (or `--captions=` on draft, `captions=` in the slash commands), or just edit `video.caption_mode` in the JSON and re-run `npm run reel`.

**Audio** is `video.audio` and is optional + file-driven (default = silent):
- `voice_mode`: `none` | `voxcpm2` (generate locally) | `file` (you supply `voice.wav`).
- `music_mode`: `none` | `free` | `licensed` | `generated` | `file`.
- Files live in `renderer/public/audio/<prefix>/` (`voice.wav`, `music.mp3`). Music is auto-ducked under the voice (`music_gain_db`, default −18).
- Set modes at generation: `npm run new -- … --voice=voxcpm2 --music=free` (also `--voice=`/`--music=` on `npm run draft`).
- **Generate narration:** `npm run voice -- <key>` runs VoxCPM2 (needs a local install: `python -m pip install voxcpm soundfile`, CUDA torch recommended) → writes `voice.wav`. Apply the AI-audio disclosure VoxCPM2 requires; use a synthetic or your own authorized voice.
- **Music:** drop a commercial-safe track at `public/audio/<prefix>/music.mp3` (Pixabay / YouTube Audio Library / Mixkit — see `../../pipeline/media/MUSIC_SFX_GUIDE.md`). Hate licensing? Leave `music_mode: none` → silent is fine.
- **If a file is missing**, `npm run reel` warns and renders **silent** (it won't crash) — so you can ship a silent reel now and add audio later by dropping the files and re-running `npm run reel -- <key>`. Log every audio asset in the package's `LICENSES.md` (QA Gate 7). **Never use F5-TTS base weights commercially (CC-BY-NC).** The PoC reel has **no audio** — to add narration (VoxCPM2) + music, follow that doc's "Growing the stub into a narrated cut" section and log everything in `LICENSES.md`.

### Render the rest of Week 1
Only Post 1 ships as JSON. Posts 2–5 are Markdown in `../../pipeline/content/WEEK_1_POSTS.md` — scaffold one JSON per post (`npm run new …`), paste that post's slides/caption/sources, then export.

---

## 4. New ideas / Week 2 (the upstream content workflow)

The renderer only draws decided content. New ideas come from the content kit (human Markdown, no script):

1. **Capture** ideas → add rows to `../../pipeline/content/IDEA_BACKLOG.md`.
2. **Score & pick** → keep the 5 best (produce if total ≥ 18); vary the pillars.
3. **Draft** → use `../../pipeline/content/POST_TEMPLATE.md` (8-slide script + caption + sources).
4. **QA** → run `../../pipeline/content/QA_CHECKLIST.md`.
5. **Render** → `npm run new …`, fill it from your draft, then export/package/reel.

Weekly cadence (Mon intake → Tue score → Wed script → Thu render → Fri QA/post) lives in `../../pipeline/content/CONTENT_PIPELINE.md`. "Week 2" is just repeating that loop and dropping new JSON into `content/posts/`.

---

## 5. Troubleshooting

| Symptom | Fix |
| --- | --- |
| `export`/`dev` hangs at startup | A stale dev server holds port 4317. Find + kill it: `netstat -ano \| grep :4317` then `taskkill //PID <pid> //F`. |
| `reel` errors "setting up headless browser" | Run `npx remotion browser ensure` once. |
| `reel` prints a `zod version mismatch` warning | Harmless — the renderer doesn't use Remotion's zod feature. Ignore it. |
| `validate`/`export` exits non-zero with field errors | The JSON is incomplete/inconsistent. Fix the named field — the renderer never guesses. Common ones: `alt_text` count ≠ 8, `score.total` ≠ sum, slide 1 not `cover`. |
| Cover renders blank/procedural when you expected an image | The PNG isn't in `public/backgrounds/` or `asset_status` isn't `"existing"`. |

## 6. After rendering → manual upload
Open `pipeline/renders/<date_slug>/`: upload the PNGs in filename order (01→08), paste `caption.txt`, add per-slide alt text from `alt_text.txt`, and post the reel MP4 separately if used. Keep `sources.md` + `LICENSES.md` for your records. (API auto-posting stays out of scope until Meta access clears.)
