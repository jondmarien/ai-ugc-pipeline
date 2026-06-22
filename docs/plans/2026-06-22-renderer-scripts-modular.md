# Renderer scripts modularization — implementation plan

> **For agentic workers:** Use executing-plans or subagent-driven-development for remaining tasks.  
> **Branch:** `refactor/renderer-scripts-modular`  
> **Design:** `docs/superpowers/specs/2026-06-22-renderer-scripts-modular-design.md`

**Goal:** DRY `renderer/scripts/*.mjs` via `renderer/scripts/lib/` without changing CLI behavior.

**Architecture:** Small ESM libs; entry scripts stay orchestrators. `pipeline.mjs` gets a second pass (not fully modularized in pass 1).

**Tech stack:** Bun, Node ESM `.mjs`, existing Python subprocess scripts unchanged.

---

## Completed (pass 1)

- [x] Git: `main` pulled; branch `refactor/renderer-scripts-modular`
- [x] Lib modules: `paths`, `post-resolve`, `post-io`, `public-asset`, `slide-filename`, `flux-negative-prompt`, `art-targeting`, `comfyui-env`, `python-runner`, `cli`, `post-selection`
- [x] `art-comfyui.mjs` → `art-slide-prompt`, shared negative, targeting, post load/save
- [x] `art-higgsfield.mjs`, `higgsfield-client.mjs` (filenames + negative prompt)
- [x] `art.mjs`, `voice.mjs`, `align.mjs` → `python-runner`
- [x] `import-bg.mjs`, `upscale-comfyui.mjs`, `free-comfyui.mjs`
- [x] `bun test` — 24 pass

---

## Task 2: Wire `lib/post-status.mjs` to shared paths (optional)

**Files:** `renderer/scripts/lib/post-status.mjs`

- Import `POSTS_DIR` from `./paths.mjs` instead of local `fileURLToPath` block.

**Verify:** `bun test`

---

## Task 3: `pipeline.mjs` — post selection + paths only

**Files:** `renderer/scripts/pipeline.mjs`

- Replace `ALL_KEYS` / skip / status filter with `expandKeysBySubstring`, `filterByStatus`, `applySkipTerms` from `lib/post-selection.mjs`.
- Import `REPO_ROOT`, `RENDERER_ROOT` from `lib/paths.mjs`.
- **Do not** refactor `runStep` / `runArt` in this task (behavior risk).

**Verify:** `bun run pipeline -- --help` (or dry list keys with invalid key + help)

---

## Task 4: Remaining entry scripts (mechanical)

**Files:** `validate.mjs`, `export.mjs`, `set-status.mjs`, `reel.mjs`, `reel-higgsfield.mjs`, `reel-comfyui.mjs`, `art-diffusers.mjs`

For each:

- `loadPostByKey` / `POSTS_DIR` instead of `readdirSync` post lookup
- `writePostJson` where post JSON is written
- `REPO_ROOT` / `RENDERER_ROOT` from `paths.mjs` where duplicated

**Verify:** `bun test`; `bun run validate -- <known-key>` if JSON exists on host

---

## Task 5: `lib/process-runner.mjs` (optional)

Extract `spawnSync` + `stdio: inherit` pattern from `pipeline.mjs` `runStep` — only after Task 3 is stable.

---

## Task 6: Host smoke (Jon)

On Windows host with ComfyUI / venv:

1. `bun run art -- <key> --dry-run`
2. `bun run art:higgsfield -- <key> --dry-run`
3. One real slide or full pipeline on a draft post

---

## Subagent execution notes

Parallelizable: Task 4 can be split per-script (4 subagents, `toolsets: ['file','terminal']`).  
Serial: Task 3 before Task 5.  
Audit reference: subagent report from 2026-06-22 (duplication map + module boundaries).