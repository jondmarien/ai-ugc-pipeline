# WEEK_1_RENDER_TESTS.md

Render tests using the real Week-1 posts from `../../pipeline/content/WEEK_1_POSTS.md` as fixtures (not synthetic data). Slice order matches the handoff: prove the static carousel on existing assets first, then a new-visual post, then the reel.

## Status

| # | Test | Post | Mode | State |
| --- | --- | --- | --- | --- |
| 1 | First static carousel | Post 1 — AI phishing | existing cover bg + procedural inners | ✅ **DONE** — 8× 1080×1350 PNGs rendered & validated |
| 1b | Package files | Post 1 | caption/alt/sources/licenses/QA | ✅ **DONE** |
| 1c | Reel stub | Post 1 | Remotion 1080×1920@30fps (no audio) | ✅ **DONE** — ffprobe-verified |
| 2 | Second static carousel | Post 4 — deepfake CFO *(or Post 5 — shadow AI)* | **new** text-free visuals | ⛔ TODO |
| 3 | Narrated reel | Post 1 | + VoxCPM2 voice + licensed music + LICENSES | ⛔ TODO |
| 4 | Batch smoke test | Posts 1–5 | one command | ⛔ TODO |

## Test 1 — Post 1 (DONE): acceptance evidence
- `npm run validate -- 2026-06-02_ai-phishing-training` → valid (8 slides, 22/25, 8 alt-text, 2 sources).
- `npm run export -- …` → 8 PNGs, each parsed at exactly **1080×1350**, into `pipeline/renders/2026-06-02_ai-phishing-training/`.
- Cover reuses the text-free `cover_bg_01_ai_phishing.png`; React renders the headline on top. Inner slides use procedural CSS backgrounds.
- `npm run package -- …` → `caption.txt`, `alt_text.txt`, `sources.md`, `LICENSES.md`, `render_qa_checklist.md`.
- `npm run reel -- …` → `…_reel.mp4` (1080×1920, H.264, 30fps), hook + 4 beats + CTA end card.

## Test 2 — Post 4 or 5 (TODO): proves new-visual mode
The first post reused an existing background. Post 4 (deepfake helpdesk) and Post 5 (shadow AI) have **no pre-made backgrounds**, so they prove the design system generalizes.

Steps:
1. Map the Markdown post → `content/posts/<date>_<slug>.json` (no invented fields; carry NCSC/Arup/OWASP sources + claim tags exactly).
2. Either (a) leave inner slides `asset_status: "procedural"` (works today, zero new art), or (b) generate text-free backgrounds per `../../pipeline/content/VISUAL_PROMPT_BANK.md`, drop them in `public/backgrounds/<slug>/`, and set `asset_status: "generated"` + `background_asset`.
3. `npm run export` / `package` / `reel`.

Acceptance: 8 PNGs at 1080×1350 with the correct pillar accent (Post 4 cyan/amber offensive_ai; Post 5 amber governance), QA file generated, cover legible as a thumbnail.

## Test 3 — Narrated reel (TODO)
Follow `REMOTION_REEL_WORKFLOW.md` → "Growing the stub into a narrated cut": VoxCPM2 voice (apply AI-audio disclosure), royalty-free bed, `<AudioBed>`, populate `LICENSES.md`. **Do not** use F5-TTS base weights (CC-BY-NC).

## Test 4 — Batch (TODO)
Add `scripts/build-all.ts` that runs validate→export→package(→reel) over every JSON in `content/posts/`, printing a per-post pass/fail summary. Acceptance: Posts 1–5 export without per-slide manual work; filename sorting correct across the week.

## Notes
- Posts 1–3 can reuse the existing finished demo carousels for manual posting, but the renderer path **rebuilds** them deterministically from the text-free cover backgrounds — preferred because the existing finished slides carry AI-rendered text that needs a spelling pass.
