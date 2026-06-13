# Readable Tech Posts + Independent Reel Scripts — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make tech-heavy CVE/LPE carousel posts readable (one plain-language idea per slide, copy that never clips), give reels an independent full-sentence spoken script, enforce both in the pipeline, and retrofit 15 existing posts.

**Architecture:** Three small, independently testable code units — a pure **content-checks** module (copy-budget + visual_prompt lint) wired into the validator as warnings; a pure **fit-scale** function backing a measured shrink-to-fit in the carousel renderer with a render-ready gate; plus **doctrine edits** to the skill/command and **content retrofits** to 15 post JSONs. Voice/align/reel regen is deferred to a user-run batch.

**Tech Stack:** Bun, TypeScript, React 19, Vite, Playwright (carousel export), Remotion (reel), Zod (schema). Tests via `bun test`.

**Spec:** `docs/superpowers/specs/2026-06-12-readable-tech-posts-and-reel-scripts-design.md`

---

## File Structure

| File | Responsibility | Action |
| --- | --- | --- |
| `renderer/src/lib/content-checks.ts` | Pure functions: `checkCopyBudget(post)`, `lintVisualPrompts(post)` → warning arrays. No I/O. | Create |
| `renderer/src/lib/content-checks.test.ts` | Unit tests for the two pure functions. | Create |
| `renderer/scripts/validate.ts` | Import + run the checks; print warnings; keep exit-0 (advisory). | Modify |
| `renderer/src/design/fit.ts` | Pure `computeFitScale(contentPx, framePx, minScale)`. | Create |
| `renderer/src/design/fit.test.ts` | Unit tests for `computeFitScale`. | Create |
| `renderer/src/components/carousel/useFitToFrame.ts` | DOM hook: measure block vs frame, apply scale via `computeFitScale`, signal "fit settled". | Create |
| `renderer/src/components/carousel/CarouselSlide.tsx` | Host the fit hook on the text block; expose settle signal. | Modify |
| `renderer/src/components/carousel/slides.tsx` | Stop using char-count `fitHeadline`; use fixed per-role base sizes (fit hook scales the block). | Modify |
| `renderer/src/design/tokens.ts` | Add fit floors (`fitFloors`); keep `fitHeadline` only if still referenced (else remove). | Modify |
| `renderer/src/App.tsx` | Gate `data-render-ready` on fit-settled in addition to fonts+images. | Modify |
| `renderer/scripts/export-carousel.ts` | (No change if it already waits on `data-render-ready`; verify.) | Verify |
| `renderer/scripts/fit-smoke.test.mjs` | Playwright integration: render worst-offender slide, assert no overflow. | Create |
| `.claude/skills/ai-cybersecurity-ugc-carousel/SKILL.md` | One-idea-per-slide + per-role copy budgets + acronym-on-subline rule. | Modify |
| `.claude/commands/draft-post.md` | Independent reel-script doctrine + visual_prompt lint gate + copy-budget gate. | Modify |
| `renderer/content/posts/2026-06-10_dirtydecrypt-linux-lpe.json` | Slide 2 prompt + alt_text (still garbling). | Modify |
| `renderer/content/posts/2026-06-10_fragnesia-linux-lpe.json` | Slides 6 & 8 prompt + alt_text (still garbling). | Modify |
| 15 post JSONs (see Task 9) | Copy + narration retrofit. | Modify |
| `package.json` (renderer) | Add `"test": "bun test"`. | Modify |

---

## Task 1: Add the test script

**Files:**
- Modify: `renderer/package.json`

- [ ] **Step 1: Add a test script**

In `renderer/package.json` `"scripts"`, add:
```json
"test": "bun test",
```

- [ ] **Step 2: Verify bun test runs (no tests yet = ok)**

Run: `cd renderer && bun test`
Expected: prints "0 test files" and exits **non-zero** — this is fine, it resolves as soon as Task 2 adds the first test file. (Do not treat the non-zero exit as a failure of this task.)

- [ ] **Step 3: Commit**

```bash
git add renderer/package.json
git commit -m "chore(renderer): add bun test script"
```

---

## Task 2: Copy-budget pure function (TDD)

**Files:**
- Create: `renderer/src/lib/content-checks.ts`
- Test: `renderer/src/lib/content-checks.test.ts`

Budgets (from spec §B). Word count = whitespace-split of the marker-stripped string (`[[`/`]]`/`{{`/`}}` removed). Char count = stripped length.

| Role | Field | Max words | Max chars |
| --- | --- | --- | --- |
| cover | on_slide_copy | 8 | — |
| context/risk/mechanism/failure_point/defense/point | on_slide_copy | 14 | 90 |
| takeaway | on_slide_copy | 22 | — |
| (all) | subline | 30 | 180 |

- [ ] **Step 1: Write failing tests**

```ts
// renderer/src/lib/content-checks.test.ts
import { test, expect } from "bun:test";
import { checkCopyBudget } from "./content-checks";

const slide = (over: Record<string, unknown>) => ({
  slide: 1, role: "mechanism", kicker: "", subline: "", visual_prompt: "x",
  on_slide_copy: "", background_asset: "", asset_status: "generated", cta: "", notes: "",
  ...over,
});
const post = (slides: unknown[]) => ({ slides } as any);

test("body on_slide_copy over 14 words warns", () => {
  const w = checkCopyBudget(post([slide({
    on_slide_copy: "one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen",
  })]));
  expect(w.some((m) => m.includes("on_slide_copy") && m.includes("word"))).toBe(true);
});

test("body on_slide_copy within budget is clean", () => {
  const w = checkCopyBudget(post([slide({ on_slide_copy: "Attackers write four bytes into any file." })]));
  expect(w.length).toBe(0);
});

test("cover capped at 8 words", () => {
  const w = checkCopyBudget(post([slide({ role: "cover",
    on_slide_copy: "one two three four five six seven eight nine" })]));
  expect(w.length).toBe(1);
});

test("markers are stripped before counting", () => {
  const w = checkCopyBudget(post([slide({ role: "takeaway",
    on_slide_copy: "[[Patch the kernel.]] {{Not the module.}}" })]));
  expect(w.length).toBe(0);
});

test("long subline warns", () => {
  const long = Array(31).fill("word").join(" ");
  const w = checkCopyBudget(post([slide({ on_slide_copy: "Short claim here.", subline: long })]));
  expect(w.some((m) => m.includes("subline"))).toBe(true);
});
```

- [ ] **Step 2: Run, verify FAIL**

Run: `cd renderer && bun test src/lib/content-checks.test.ts`
Expected: FAIL (module/function missing).

- [ ] **Step 3: Implement**

```ts
// renderer/src/lib/content-checks.ts
type AnySlide = { slide?: number; role?: string; on_slide_copy?: string; subline?: string; visual_prompt?: string };
type AnyPost = { slides?: AnySlide[] };

const strip = (s: string) => (s ?? "").replace(/\[\[|\]\]|\{\{|\}\}/g, "").trim();
const words = (s: string) => (strip(s) ? strip(s).split(/\s+/).length : 0);
const chars = (s: string) => strip(s).length;

const BODY = new Set(["context", "risk", "mechanism", "failure_point", "defense", "point"]);

export function checkCopyBudget(post: AnyPost): string[] {
  const out: string[] = [];
  for (const s of post.slides ?? []) {
    const where = `slide ${s.slide} [${s.role}]`;
    const copy = s.on_slide_copy ?? "";
    if (s.role === "cover" && words(copy) > 8)
      out.push(`${where} on_slide_copy ${words(copy)} words (cover max 8)`);
    else if (BODY.has(s.role ?? "")) {
      if (words(copy) > 14) out.push(`${where} on_slide_copy ${words(copy)} words (body max 14)`);
      if (chars(copy) > 90) out.push(`${where} on_slide_copy ${chars(copy)} chars (body max 90)`);
    } else if (s.role === "takeaway" && words(copy) > 22)
      out.push(`${where} on_slide_copy ${words(copy)} words (takeaway max 22)`);

    const sub = s.subline ?? "";
    if (words(sub) > 30) out.push(`${where} subline ${words(sub)} words (max 30)`);
    if (chars(sub) > 180) out.push(`${where} subline ${chars(sub)} chars (max 180)`);
  }
  return out;
}
```

- [ ] **Step 4: Run, verify PASS**

Run: `cd renderer && bun test src/lib/content-checks.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add renderer/src/lib/content-checks.ts renderer/src/lib/content-checks.test.ts
git commit -m "feat(validator): copy-budget check (pure fn + tests)"
```

---

## Task 3: visual_prompt lint pure function (TDD)

**Files:**
- Modify: `renderer/src/lib/content-checks.ts` (add `lintVisualPrompts`)
- Modify: `renderer/src/lib/content-checks.test.ts`

Denylist nouns (word-boundary, case-insensitive): `diff, commit, log, terminal, console, dashboard, panel, label, labeled, marked, logo, snippet, email, thread, code, script, plaintext, version, map`. Plus an ALL-CAPS run of ≥2 consecutive tokens that are ≥2 chars and all-caps/underscore (e.g. `ALGIF_AEAD BLOCKED`, `ESP RxRPC` no — RxRPC is mixed; require fully `[A-Z0-9_]{2,}`).

- [ ] **Step 1: Write failing tests**

```ts
import { lintVisualPrompts } from "./content-checks";

test("labeled + ALL-CAPS run trips lint", () => {
  const w = lintVisualPrompts(post([slide({
    visual_prompt: "a shield marked ALGIF_AEAD BLOCKED with two paths labeled around it",
  })]));
  expect(w.length).toBeGreaterThan(0);
  expect(w.join(" ")).toContain("ALGIF_AEAD");
});

test("clean abstract prose passes", () => {
  const w = lintVisualPrompts(post([slide({
    visual_prompt: "A single hard rim light catches a glowing red sliver of light in a dark void, premium dark editorial key art.",
  })]));
  expect(w.length).toBe(0);
});

test("denylist noun trips lint", () => {
  const w = lintVisualPrompts(post([slide({ visual_prompt: "a patch diff glows in a dark void" })]));
  expect(w.join(" ")).toContain("diff");
});
```

- [ ] **Step 2: Run, verify FAIL**

Run: `cd renderer && bun test src/lib/content-checks.test.ts`
Expected: FAIL (lintVisualPrompts missing).

- [ ] **Step 3: Implement (append to content-checks.ts)**

```ts
const DENY = ["diff","commit","log","terminal","console","dashboard","panel","label","labeled",
  "marked","logo","snippet","email","thread","code","script","plaintext","version","map"];
const DENY_RE = new RegExp(`\\b(${DENY.join("|")})\\b`, "i");
const CAPS_RUN_RE = /\b[A-Z0-9_]{2,}\b(\s+\b[A-Z0-9_]{2,}\b)+/;

export function lintVisualPrompts(post: AnyPost): string[] {
  const out: string[] = [];
  for (const s of post.slides ?? []) {
    const p = s.visual_prompt ?? "";
    const where = `slide ${s.slide} [${s.role}] visual_prompt`;
    const deny = p.match(DENY_RE);
    if (deny) out.push(`${where}: text-summoning noun "${deny[1]}"`);
    const caps = p.match(CAPS_RUN_RE);
    if (caps) out.push(`${where}: ALL-CAPS run "${caps[0]}"`);
  }
  return out;
}
```

- [ ] **Step 4: Run, verify PASS**

Run: `cd renderer && bun test src/lib/content-checks.test.ts`
Expected: PASS (8 tests total).

- [ ] **Step 5: Commit**

```bash
git add renderer/src/lib/content-checks.ts renderer/src/lib/content-checks.test.ts
git commit -m "feat(validator): visual_prompt text-summoning lint (pure fn + tests)"
```

---

## Task 4: Wire checks into the validator (warnings)

**Files:**
- Modify: `renderer/scripts/validate.ts`

- [ ] **Step 1: Import + run after the existing valid print**

Add near the top: `import { checkCopyBudget, lintVisualPrompts } from "../src/lib/content-checks";`
After the post validates, append (do NOT change exit code — advisory):
```ts
const copyWarn = checkCopyBudget(post);
const promptWarn = lintVisualPrompts(post);
if (copyWarn.length || promptWarn.length) {
  console.warn(`\n⚠ content advisories (${copyWarn.length + promptWarn.length}):`);
  for (const w of [...copyWarn, ...promptWarn]) console.warn(`   • ${w}`);
}
```

- [ ] **Step 2: Verify on a known-bad post**

Run: `cd renderer && bun run validate -- 2026-06-10_dirtydecrypt-linux-lpe`
Expected: still prints `✓ … valid`, THEN a `⚠ content advisories` block listing overlong body slides (the wall-of-text ones) and any `visual_prompt` hits (slide 2 panel/message). Exit 0.

- [ ] **Step 3: Verify a clean-ish post has fewer/none**

Run: `cd renderer && bun run validate -- 2026-06-10_cohere-north-mini-code`
Expected: valid; advisories may be few/none (cohere is not in scope).

- [ ] **Step 4: Commit**

```bash
git add renderer/scripts/validate.ts
git commit -m "feat(validator): surface copy-budget + visual_prompt advisories"
```

---

## Task 5: Fit-scale pure function (TDD)

**Files:**
- Create: `renderer/src/design/fit.ts`
- Test: `renderer/src/design/fit.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { test, expect } from "bun:test";
import { computeFitScale } from "./fit";

test("fits already → scale 1", () => { expect(computeFitScale(600, 800, 0.5)).toBe(1); });
test("overflow → proportional shrink", () => { expect(computeFitScale(1000, 800, 0.5)).toBeCloseTo(0.8); });
test("never below floor", () => { expect(computeFitScale(4000, 800, 0.5)).toBe(0.5); });
test("guards zero/neg", () => { expect(computeFitScale(0, 800, 0.5)).toBe(1); });
```

- [ ] **Step 2: Run, verify FAIL** — `cd renderer && bun test src/design/fit.test.ts`

- [ ] **Step 3: Implement**

```ts
// renderer/src/design/fit.ts
// Visual shrink-to-fit factor for a bottom/centre-aligned text block.
// contentPx = natural block height, framePx = available height, minScale = legibility floor.
export function computeFitScale(contentPx: number, framePx: number, minScale: number): number {
  if (contentPx <= 0 || framePx <= 0 || contentPx <= framePx) return 1;
  return Math.max(minScale, framePx / contentPx);
}
```

- [ ] **Step 4: Run, verify PASS** — `cd renderer && bun test src/design/fit.test.ts`

- [ ] **Step 5: Commit**

```bash
git add renderer/src/design/fit.ts renderer/src/design/fit.test.ts
git commit -m "feat(renderer): computeFitScale pure fn + tests"
```

---

## Task 6: Measured shrink-to-fit in the carousel renderer

**Files:**
- Modify: `renderer/src/design/tokens.ts` (add floors; per-role base sizes)
- Create: `renderer/src/components/carousel/useFitToFrame.ts`
- Modify: `renderer/src/components/carousel/CarouselSlide.tsx`
- Modify: `renderer/src/components/carousel/slides.tsx`
- Modify: `renderer/src/App.tsx`

**Approach:** keep per-role base font sizes fixed (no more char-count `fitHeadline`). After layout, `useFitToFrame` measures the text block's natural height against the frame's inner height, computes a scale with `computeFitScale` (floor = `max(44/headlineBase, 30/sublineBase)` so headline ≥44px / subline ≥30px), and applies it as `transform: scale(s)` on the block (transform-origin matches the align: bottom for `end`, center for `center`). It sets a per-slide "fit settled" flag on `window.__fitSettled` once measured.

- [ ] **Step 1: Add floors + base sizes to tokens.ts**

```ts
export const fitFloors = { headline: 44, subline: 30 } as const;
// Per-role base headline size (replaces fitHeadline tiers). Block scales DOWN from here.
export const headlineBase = { cover: 104, takeaway: 92, body: 72, chain: 34 } as const;
```
Leave `fitHeadline` in place only if other code still imports it; otherwise delete it and its references.

- [ ] **Step 2: Create the fit hook**

```tsx
// renderer/src/components/carousel/useFitToFrame.ts
import { useLayoutEffect, useRef, useState } from "react";
import { computeFitScale } from "@/design/fit";

// Measures `blockRef` natural height against `frameRef` inner height; returns a scale
// (floored at minScale) and marks window.__fitSettled when done. Re-runs on text change.
export function useFitToFrame(minScale: number, deps: unknown[]) {
  const frameRef = useRef<HTMLDivElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const frame = frameRef.current, block = blockRef.current;
    if (!frame || !block) return;
    // natural height = scrollHeight at scale 1 (block must be rendered unscaled first)
    const natural = block.scrollHeight;
    const avail = frame.clientHeight;
    const s = computeFitScale(natural, avail, minScale);
    setScale(s);
    (window as any).__fitSettled = ((window as any).__fitSettled ?? 0) + 1;
    (window as any).__fitDebug = { natural, avail, scale: s, floored: s === minScale && natural > avail };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { frameRef, blockRef, scale };
}
```

- [ ] **Step 3: Host the hook in CarouselSlide**

Wrap the children block: attach `frameRef` to the bounded content frame (`top:frameTop … bottom:safe_margin`, keep `overflow:hidden` as the hard backstop) and `blockRef` to the inner column; apply `transform: scale(scale)` + `transformOrigin` (`"50% 100%"` for `end`, `"50% 50%"` for `center`, `"50% 0%"` for `fill`). Pass `minScale` from the role's base (compute `Math.max(fitFloors.headline/headlineBase[..], fitFloors.subline/type.subline)`). Expose nothing else.

- [ ] **Step 4: Update slides.tsx**

Replace `fitHeadline(slide.on_slide_copy, …)` calls with the fixed `headlineBase[role]` value; the block scaling now handles overflow. Cover uses `headlineBase.cover`, takeaway `headlineBase.takeaway`, body `headlineBase.body`, chain `34`.

- [ ] **Step 5: Gate render-ready on fit**

In `App.tsx`, before `markReady()`, also wait one extra animation frame after fonts+images so `useLayoutEffect` has applied the scale (or check `window.__fitSettled` ≥ number of slides rendered = 1 for single-slide export). Simplest: after images settle, `requestAnimationFrame(() => requestAnimationFrame(markReady))`.

- [ ] **Step 6: Manual visual check (dev server)**

Run: `cd renderer && bun run dev` then open `http://localhost:4317/?post=2026-06-10_dirtydecrypt-linux-lpe&slide=5`
Expected: the long copy is fully visible (shrunk), NOT clipped at the bottom.

- [ ] **Step 7: Commit**

```bash
git add renderer/src/design/tokens.ts renderer/src/components/carousel/useFitToFrame.ts renderer/src/components/carousel/CarouselSlide.tsx renderer/src/components/carousel/slides.tsx renderer/src/App.tsx
git commit -m "feat(renderer): measured shrink-to-fit so slide copy never clips"
```

---

## Task 7: Export-smoke integration test (no-clip guarantee)

**Files:**
- Create: `renderer/scripts/fit-smoke.test.mjs`

- [ ] **Step 1: Write the smoke test**

Use the same Playwright launch pattern as `export-carousel.ts` (read it for the exact vite/preview boot + `data-render-ready` wait). Render `?post=2026-06-10_dirtydecrypt-linux-lpe&slide=5`, then:
```js
const dbg = await page.evaluate(() => window.__fitDebug);
// scaled content must fit the frame: natural*scale <= avail + 1px tolerance
if (!(dbg.natural * dbg.scale <= dbg.avail + 1)) throw new Error("text overflows frame: " + JSON.stringify(dbg));
```
Mark the test pass/fail accordingly (throw → fail).

- [ ] **Step 2: Run, verify PASS**

Run: `cd renderer && bun test scripts/fit-smoke.test.mjs`
Expected: PASS (after Task 6). If `bunx remotion browser ensure` / playwright browser is needed, run it once first.

- [ ] **Step 3: Commit**

```bash
git add renderer/scripts/fit-smoke.test.mjs
git commit -m "test(renderer): export-smoke asserts slide copy never clips"
```

---

## Task 8: Doctrine edits (future posts)

**Files:**
- Modify: `.claude/skills/ai-cybersecurity-ugc-carousel/SKILL.md`
- Modify: `.claude/commands/draft-post.md`

- [ ] **Step 1: SKILL.md — copy budgets + one-idea rule**

In the slide copy-pattern table (≈lines 56–65), add explicit budgets: cover ≤8 words; body slides ≤14 words / one short plain sentence; takeaway ≤22 words; subline ≤30 words. Add a paragraph after the table: "**One idea per slide, plain language.** Each body slide states ONE claim in one short sentence. Expand each acronym in plain words on its **subline**, not the body line (e.g. body: 'Attackers rewrite a trusted system file.' subline: 'The bug is in algif_aead, the kernel's crypto socket API.'). If a slide carries more than one idea, split it into another `point` slide. Tech-heavy posts may run 10–14 slides; for multi-step mechanisms prefer the `chain` role (clean step diagram, no AI background)."

- [ ] **Step 2: draft-post.md — reel-script + lint/budget gate**

In step 4 (the humanize/proofread step), add: "**Reel narration is an INDEPENDENT spoken script** — 4–7 connected complete sentences that tell the story in plain English, acronyms spoken naturally. It must NOT equal the `on_slide_copy` lines and must NOT be a concatenation of `beats[].caption`. `beats[].caption` stays the short on-screen keyword line; `video.narration[].text` is the voiceover prose."
In step 5/6 (pre-render), add: "Run `bun run validate -- <key>` and resolve every **content advisory** (copy over budget, `visual_prompt` text-summoning nouns / ALL-CAPS runs) before rendering."

- [ ] **Step 3: Sanity check the markdown renders (no broken tables)**

Run: `cd "J:/projects/personal-projects/ai-ugc-pipeline" && sed -n '54,72p' .claude/skills/ai-cybersecurity-ugc-carousel/SKILL.md`
Expected: the table + new paragraph are well-formed.

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/ai-cybersecurity-ugc-carousel/SKILL.md .claude/commands/draft-post.md
git commit -m "docs(pipeline): one-idea copy budgets + independent reel-script doctrine + validate gate"
```

---

## Task 9: Finish the garbled backgrounds (3 prompts)

**Files:**
- Modify: `renderer/content/posts/2026-06-10_dirtydecrypt-linux-lpe.json` (slide 2 visual_prompt + alt_text[1])
- Modify: `renderer/content/posts/2026-06-10_fragnesia-linux-lpe.json` (slides 6 & 8 visual_prompt + alt_text[5], alt_text[7])

These still render text because the prompts name panel/message/map nouns and an embedded phrase ("module blocklist", "page cache"). Rewrite fully abstract.

- [ ] **Step 1: dirtydecrypt slide 2** — replace the "two facing panels of light, a message rising…" prompt with a panel/message-free metaphor (e.g. "Low raking light grazes two opposing shapes of light in the dark, one reaching toward the other while the other stays cold and turned away, the space between them empty and unanswered, dark editorial photography, set high over a calm empty lower third."). Update `alt_text[1]` to match.

- [ ] **Step 2: fragnesia slide 6** — the current prompt's "single mitigation (three module blocklist)" caused "modute blcdklick". Replace with no parenthetical/no "blocklist": e.g. "A balanced split composition in the dark: on the left three separate red breaches converging toward one point, on the right a single barrier of light sealing all three paths at once, a thin divider between them, premium editorial key art, generous negative space below." Update `alt_text[5]`.

- [ ] **Step 3: fragnesia slide 8** — "subsystem map … page cache" caused "Page caloce". Replace with no "map"/no "page cache": e.g. "Soft pooled light isolates three thin red threads of light on a clean dark end-card surface, all converging into a single bright node, premium editorial cybersecurity key art, the convergence small in vast negative space with the lower third open." Update `alt_text[7]`.

- [ ] **Step 4: Validate — zero visual_prompt advisories on these two posts**

Run: `cd renderer && bun run validate -- 2026-06-10_dirtydecrypt-linux-lpe && bun run validate -- 2026-06-10_fragnesia-linux-lpe`
Expected: valid; NO `visual_prompt` advisories for slides 2 / 6 / 8 (copy advisories may still remain until Task 10).

- [ ] **Step 5: Commit**

```bash
git add renderer/content/posts/2026-06-10_dirtydecrypt-linux-lpe.json renderer/content/posts/2026-06-10_fragnesia-linux-lpe.json
git commit -m "fix(art): fully abstract the 3 still-garbling backgrounds (dirtydecrypt s2, fragnesia s6/s8)"
```

---

## Task 10: Retrofit the 15 posts (copy + narration)

**Posts (15):**
06-10: `copy-fail-linux-lpe`, `cve-2026-23111-one-char`, `dirty-frag-linux-lpe`, `dirtydecrypt-linux-lpe`, `fragnesia-linux-lpe`, `nightmare-eclipse-github-removal`, `rogueplanet-windows-zero-day`
06-11: `bluehammer-cve-2026-33825`, `greatxml-bitlocker-bypass`, `greenplasma-system-lpe`, `miniplasma-patched-lpe`, `redsun-windows-lpe`, `undefend-defender-dos`, `yellowkey-cve-2026-50507`
06-12: `fable5-jailbreak-panic`

**Per-post procedure (repeat; one commit per post):**

- [ ] **Step A: Read the post + its sources.** Note the verified facts (never alter a sourced claim or `claim_tag`). Run `bun run validate -- <key>` and record the copy advisories (which slides are over budget).

- [ ] **Step B: Rewrite `on_slide_copy` per slide to ONE plain-language idea within budget.** Cover ≤8 words; body ≤14 words / ≤90 chars; takeaway ≤22 words (keep `[[…]]`/`{{…}}` markers). Move acronym expansions + supporting detail to the `subline` (≤30 words). Keep the house voice; do not invent facts.

- [ ] **Step C: Split only where a slide still holds >1 idea.** If splitting: insert a `point` slide (renumber `slide` fields), add its `on_slide_copy`/`subline`/`visual_prompt` (run it past the lint mentally — abstract, no text nouns)/`background_asset` path, append a matching `alt_text` entry (array length MUST equal slide count), add to `expected_files`, and add a `beats[]` entry. Keep cover first, cta last, takeaway at N−1.

- [ ] **Step D: Rewrite `video.narration[]` as an independent spoken script.** 4–7 connected complete sentences, acronyms spoken naturally, telling the story as prose — NOT the slide lines and NOT the `beats[].caption` lines. Keep `beats[].caption` as short keyword lines. (Narration timings can stay; the deferred `align` pass re-syncs to the new audio.)

- [ ] **Step E: Run the copy chain on the new copy.** Apply `humanizer` → `stop-slop` → `professional-proofreader` to `on_slide_copy`, `subline`, `caption`, and `video.narration[].text`. No em-dashes, no fragments.

- [ ] **Step F: Validate — zero copy advisories.**

Run: `cd renderer && bun run validate -- <key>`
Expected: `✓ valid`; NO copy advisories (visual_prompt advisories already cleared for the 06-10 set; for 06-11/06-12 clear any that appear).

- [ ] **Step G: Commit the post.**

```bash
git add renderer/content/posts/<file>.json
git commit -m "content(<key>): one-idea plain-language copy + independent reel script"
```

- [ ] **Step H:** Repeat A–G for each of the 15 posts.

---

## Task 11: Deferred-regen batch + handoff

**Files:** none (produces a command list for the user).

- [ ] **Step 1: For each retrofitted post, determine which slides changed background** (only split slides / the 3 garbled ones need art regen; pure copy changes need only re-export).

- [ ] **Step 2: Emit the batch** — for posts needing art: `bun run art -- <key> --only=<list>`; then for ALL retrofitted posts: re-export carousel + reel WITH fresh voice+align (narration changed, so voice MUST regen): `bun run pipeline -- <key> --force` (full pipeline incl. voice/align/reel). Note the 8GB one-model-at-a-time ordering (art batch first, then `free-comfyui`, then voice/align/reel).

- [ ] **Step 3: Present the batch to the user** (pwsh + bash forms) and stop — user runs it when GPU is free.

---

## Notes for the implementer
- **Never alter a sourced fact, `claim_tag`, or source** to make copy shorter or smoother — shorten by cutting words, not changing claims. If a fact cannot fit the budget, move it to the subline or split the slide.
- The validator stays **exit-0** on advisories (so existing/out-of-scope posts don't break CI); the draft command treats advisories as a fix-it gate for NEW posts.
- Retrofit reels are **stale until the user runs the Task 11 batch** — the carousel re-export is current, the reel/captions follow the new narration only after voice+align+reel re-render.
