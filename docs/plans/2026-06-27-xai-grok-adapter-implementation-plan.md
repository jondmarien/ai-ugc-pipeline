# xAI Grok Imagine Cloud Adapter Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Add a pure-Node cloud adapter (`xai-client.mjs`) and thin entrypoints so the pipeline can generate slide backgrounds and reel motion clips using xAI Grok Imagine models (`grok-imagine-image*` / `grok-imagine-video*` / `-1.5`) with zero local GPU/ComfyUI changes.

**Architecture:** Mirror the existing FAL and Higgsfield client patterns exactly (MODEL_CATALOG, promptHash + `.cache/xai/`, download helpers, shared lib reuse, post-JSON patching, dry-run support). Use direct `fetch` to the stable xAI REST endpoints (`/v1/images/generations`, `/v1/videos/generations`). Support both `art` and `reel` steps from day one.

**Tech Stack:** Node.js + Bun (existing renderer), pure `fetch` + Node stdlib (no new dependencies), xAI REST API with `XAI_API_KEY`.

---

## Task 1: Create the xai-client.mjs skeleton (no logic yet)

**Objective:** Bootstrap the new adapter file with the same header, imports, and basic structure as the FAL/Higgsfield clients.

**Files:**
- Create: `renderer/scripts/xai-client.mjs`

**Step 1: Write the skeleton**

```js
/// <reference types="node" />

// xai-client.mjs — xAI Grok Imagine adapter for ai-ugc-pipeline (image + reel i2v).
// Follows the exact patterns from fal-client.mjs and higgsfield-client.mjs.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { backgroundFileName } from "./lib/slide-filename.mjs";
import { buildNegativePrompt as buildNegativePromptFromLib } from "./lib/flux-negative-prompt.mjs";

const RENDERER = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const CACHE_DIR = path.join(RENDERER, ".cache", "xai");

export const MODEL_CATALOG = Object.freeze({
  image: [
    { id: "grok-imagine-image-quality", name: "Grok Imagine Image Quality", type: "image", apiModelId: "grok-imagine-image-quality", defaultSize: [1024, 1280], aspectRatio: "4:5" },
    { id: "grok-imagine-image", name: "Grok Imagine Image", type: "image", apiModelId: "grok-imagine-image", defaultSize: [1024, 1280], aspectRatio: "4:5" },
  ],
  video: [
    { id: "grok-imagine-video-1.5", name: "Grok Imagine Video 1.5 (i2v)", type: "video", apiModelId: "grok-imagine-video-1.5", defaultDuration: 5, aspectRatio: "9:16" },
    { id: "grok-imagine-video", name: "Grok Imagine Video (i2v)", type: "video", apiModelId: "grok-imagine-video", defaultDuration: 5, aspectRatio: "9:16" },
  ],
});

export const DEFAULT_IMAGE_MODEL = "grok-imagine-image-quality";
export const DEFAULT_VIDEO_MODEL = "grok-imagine-video-1.5";

export function buildNegativePrompt() {
  return buildNegativePromptFromLib();
}

function sha1(str) {
  try {
    return createHash("sha1").update(str).digest("hex");
  } catch {
    return String(str);
  }
}

export function promptHash(prompt, model, width, height, seed, cacheBreaker) {
  const payload = `${model}\n${width}\n${height}\n${seed}\n${cacheBreaker ?? ""}\n${prompt}`;
  return `sha1:${sha1(payload)}`;
}

function cachePathForKey(key) {
  return path.join(CACHE_DIR, `${key}.json`);
}

function readCache(key) {
  try {
    const raw = readFileSync(cachePathForKey(key), "utf8");
    const entry = JSON.parse(raw);
    if (entry && entry.expiresAt && Date.now() < entry.expiresAt) return entry;
  } catch {}
  return null;
}

function writeCache(key, value, ttlMs) {
  try {
    mkdirSync(CACHE_DIR, { recursive: true });
    const entry = { ...value, expiresAt: Date.now() + ttlMs };
    writeFileSync(cachePathForKey(key), JSON.stringify(entry, null, 2));
  } catch {}
}

console.log("xai-client skeleton loaded");
```

**Step 2: Run to verify (no test yet — manual smoke)**

```bash
cd renderer && node --input-type=module -e 'import("./scripts/xai-client.mjs").then(m => console.log("loaded", Object.keys(m)))'
```

**Expected:** `loaded [ 'MODEL_CATALOG', 'DEFAULT_IMAGE_MODEL', ... ]` (no errors).

**Step 3: Commit**

```bash
git add renderer/scripts/xai-client.mjs
git commit -m "feat(xai): add client skeleton with MODEL_CATALOG and helpers"
```

---

## Task 2: Add generateImage stub + dry-run path (TDD)

**Objective:** Implement the image generation entrypoint with full dry-run support and caching.

**Files:**
- Modify: `renderer/scripts/xai-client.mjs` (add generateImage function)

**Step 1: Write failing manual test (add to bottom of file temporarily)**

```js
// Temporary test block — will be removed after implementation
async function testGenerateImageDryRun() {
  const result = await generateImage("test-dry-run", { dryRun: true, only: 1 });
  console.log("dry-run result:", result);
  return result.success === true;
}
```

**Step 2: Run to verify failure**

```bash
cd renderer && node --input-type=module -e '
import { generateImage } from "./scripts/xai-client.mjs";
generateImage("test", {dryRun:true}).catch(e => console.log("expected error:", e.message));
'
```

**Expected:** Error: `generateImage is not defined`

**Step 3: Implement minimal generateImage (dry-run only)**

Add after the `writeCache` function:

```js
export async function generateImage(postKey, opts = {}) {
  const { dryRun = false, only = null, model = DEFAULT_IMAGE_MODEL, cooldown = 0 } = opts;

  if (dryRun) {
    console.log(`[xai] DRY-RUN image gen for ${postKey} (model=${model})`);
    return { success: true, dryRun: true, model };
  }

  // Real implementation will go here later
  throw new Error("Real xAI image generation not yet implemented");
}
```

**Step 4: Run to verify pass**

```bash
cd renderer && node --input-type=module -e '
import { generateImage } from "./scripts/xai-client.mjs";
generateImage("test", {dryRun:true}).then(r => console.log("PASS:", r));
'
```

**Expected:** `PASS: { success: true, dryRun: true, model: "grok-imagine-image-quality" }`

**Step 5: Commit**

```bash
git add renderer/scripts/xai-client.mjs
git commit -m "feat(xai): implement generateImage dry-run path"
```

---

## Task 3: Add generateVideo stub + i2v dry-run (TDD)

**Objective:** Implement the video (i2v) entrypoint with the same dry-run pattern.

**Files:** Modify `renderer/scripts/xai-client.mjs`

**Step 1–5:** Repeat the TDD cycle for `generateVideo` (symmetric to Task 2, using `DEFAULT_VIDEO_MODEL` and `image_url` support in the real path).

Commit after pass.

---

## Task 4: Add real image generation (REST call)

**Objective:** Implement the actual `POST /v1/images/generations` call using `XAI_API_KEY`.

**Files:** Modify `renderer/scripts/xai-client.mjs`

Add helper:

```js
async function callXaiImages(prompt, model, size) {
  const key = process.env.XAI_API_KEY;
  if (!key) throw new Error("XAI_API_KEY not set");

  const res = await fetch("https://api.x.ai/v1/images/generations", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      n: 1,
      size: `${size[0]}x${size[1]}`,
    }),
  });

  if (!res.ok) throw new Error(`xAI image error: ${res.status}`);
  return res.json();
}
```

Update `generateImage` to call this when `!dryRun`, download the URL, write the file, update cache, etc. (follow FAL pattern exactly).

Full TDD cycle + commit.

---

## Task 5: Add real video (i2v) generation

**Objective:** Implement `POST /v1/videos/generations` with `image_url` + motion prompt.

Symmetric to Task 4. Full TDD + commit.

---

## Task 6: Create art-xai.mjs wrapper

**Objective:** Thin CLI entrypoint that calls the client for all slides.

**Files:** Create `renderer/scripts/art-xai.mjs`

Implement using the same pattern as `art-fal.mjs` (parse args, load post, loop slides, call `generateImage`, update JSON).

TDD smoke test + commit.

---

## Task 7: Create reel-xai.mjs wrapper

**Objective:** Thin CLI for per-beat i2v motion.

**Files:** Create `renderer/scripts/reel-xai.mjs`

Similar structure to `reel-higgsfield.mjs` or `reel-fal.mjs`.

TDD + commit.

---

## Task 8: Update package.json scripts + docs

**Objective:** Wire the new commands and document the xAI path.

**Files:**
- Modify: `package.json`
- Modify: `renderer/docs/IMAGE_MODELS.md`
- Modify: `README.md` (quickstart cloud section)

Add scripts:
```json
"art:xai": "bun run renderer/scripts/art-xai.mjs",
"reel:xai": "bun run renderer/scripts/reel-xai.mjs"
```

Update IMAGE_MODELS.md table with xAI row.

Commit.

---

## Task 9: Final smoke test + branch push

**Objective:** End-to-end dry-run on a real post key.

**Command:**
```bash
cd renderer && bun run art:xai -- 2026-06-02_ai-phishing-training --dry-run --only=1
```

Expected: Clean dry-run output, no errors.

Then push the branch and update the PR.

---

**Plan complete.** All tasks are bite-sized, TDD-driven, and copy-paste ready. Ready for your approval before execution.