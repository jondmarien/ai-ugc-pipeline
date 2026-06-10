# Content Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A local-only Bun + Vite + React dashboard at `dashboard/` for running the `@chron0s_cyb3r_w0rld.ai` Instagram operation: Overview, Hook Vault, Analytics, Competitor Tracker, Scheduler, Calendar, What's Trending.

**Architecture:** A Bun HTTP server (port 4400) proxies the IG Graph API, reads repo data read-only, fetches RSS, and persists local state to `dashboard/data/` only. A Vite + React app (port 4410, `/api` proxied to 4400) renders everything from disk caches with the chron0s design system copied in as raw source. One-way data flow; nothing publishes anywhere.

**Tech Stack:** Bun (server + tests), Vite + React + TypeScript (UI), TanStack Query v5 (client server-state: dedupe, in-memory cache, mutations — NOT TanStack Router or Table, deliberately), `fast-xml-parser` (RSS), Playwright (screenshots), chron0s DS tokens/primitives from `Content Dashboard Plan Reference/chron0s_cyb3r_w0rld Design System`.

**Two-cache convention (binding):** the server's disk cache (IG 6h, trends 1h) is the single source of freshness truth; the client QueryClient is a thin dedupe/memory layer (`staleTime` 30s, `refetchOnWindowFocus` off). All staleness UI (`CACHED 14H AGO`, token age) reads the SERVER's `fetchedAt` from the envelope, never TanStack's internal timestamps. Refresh actions bypass the server cache via `?refresh=1`, then update the client cache with the result.

**Spec:** `docs/superpowers/specs/2026-06-07-content-dashboard-design.md` — read it first. Its rules are binding; this plan operationalizes them.

---

## Verified facts the implementer must not re-litigate

These were checked against the repo and the live web on 2026-06-07:

- **IG metrics:** `impressions` and `plays` are deprecated for ALL Graph API versions since 2025-04-21; `views` replaced them but is scoped to FEED/STORY/REELS product types only. VIDEO (Reels) insights: `views,reach,saved,shares,total_interactions,ig_reels_avg_watch_time,ig_reels_video_view_total_time`. IMAGE / CAROUSEL_ALBUM insights: `reach,saved,shares,total_interactions` — **NO `views`**: requesting it on the carousel-album container or an image returns HTTP 400 (#100) "does not support the views metric for this media product type" (Meta docs + Airbyte connector canary PR #72266). The insights call is all-or-nothing, so the proxy MUST split by `media_type` AND retries once with a bedrock `reach,saved` set if a request 400s, so one unsupported metric never blanks a post.
- **There is no root `package.json`** in the repo. Task 1 creates one (scripts only). `renderer/` keeps its own package untouched.
- **Design system folder** has `tokens/*.css` (colors, effects, fonts, spacing, typography), `components/primitives/*.jsx` (BrandMark, Chip, ClaimTag, Headline, Kicker, Pagination, Subline) with `.d.ts` files. Theme classes `.theme-defensive|offensive|hacking|purple-team|ai` set `--accent`/`--accent-2` and exist in `tokens/colors.css`. Do NOT use `_ds_bundle.js`.
- **Ingested docs** (`pipeline/content/ingested/YYYY-MM-DD_*.md`): line 2 is a bold metadata line like `**Source:** <url> · **Handle:** @handle (…) · **Captured:** …`. Not YAML. Some docs have no `**Handle:**`. `INDEX.md` lives in the folder and must be skipped.
- **Ingested hook source:** the `## Slide map` section contains a markdown table whose `Role` column has a `Cover` row; the hook is the quoted text in that row's third cell.
- **CAPTION_BANK hooks:** section `## 1. Cover Hook Formulas` contains a markdown table; the hook examples are the SECOND cell of each body row.
- **Posts JSON** (`renderer/content/posts/*.json`): top-level keys include `post_id,date,slug,pillar,theme,slides,caption,…`; each slide has `slide,role,kicker,on_slide_copy,subline,…`; cover slide has `role: "cover"`.
- **Render packages** (`pipeline/renders/<dir>/`): conforming dirs are `YYYY-MM-DD_slug` containing `*_NN_role.png`, **`<dirName>_reel.mp4`** (the reel is prefixed, e.g. `2026-06-07_hermes-desktop_reel.mp4` — there is NO bare `reel.mp4`), `caption.txt`, `sources.md`, `LICENSES.md`. A non-conforming `week 1/` dir exists and contains NESTED conforming package dirs; v1 deliberately does not recurse — those packages appear in the Scheduler picker only as the `week 1` entry and never on the Calendar (documented decision; recursion is v2).

## File structure

```
package.json                      NEW (repo root, scripts only: "dash")
dashboard/
  package.json                    NEW dashboard workspace (own deps)
  tsconfig.json                   NEW
  vite.config.ts                  NEW (port 4410, /api -> 4400 proxy)
  index.html                      NEW
  .env.example                    NEW (IG_ACCESS_TOKEN, IG_USER_ID, IG_APP_ID, IG_APP_SECRET)
  .gitignore                      NEW (.env, data/ig-cache, data/trends-cache)
  shared/types.ts                 NEW shared TS types (server + UI)
  server/
    index.ts                      NEW Bun.serve router + {data,error} envelope
    paths.ts                      NEW one place that resolves repo paths
    store.ts                      NEW local JSON state, allowlisted files
    repo.ts                       NEW posts/renders readers
    ingested.ts                   NEW ingested-doc parsing (handle attribution)
    hooks.ts                      NEW hook aggregation from 3 sources
    ig.ts                         NEW IG Graph proxy + disk cache
    trends.ts                     NEW RSS fetch/parse + disk cache
    *.test.ts                     NEW bun tests beside each module
    fixtures/                     NEW recorded IG + RSS fixture payloads
  src/
    main.tsx, App.tsx             NEW shell: sidebar nav + module switch
    app.css                       NEW dashboard-specific layout css (imports tokens)
    design/                       COPIED from the DS folder (tokens/*.css, primitives/*.jsx + .d.ts)
    lib/api.ts                    NEW TanStack Query layer: queryClient, useApi, useStateFile, refreshAll
    lib/analytics.ts              NEW pure metric computations (unit-tested)
    lib/analytics.test.ts         NEW
    lib/schedule.ts               NEW schedule state transitions (unit-tested)
    lib/schedule.test.ts          NEW
    components/                   NEW Shell.tsx, StatCard.tsx, StalenessBanner.tsx,
                                  Bars.tsx (minimal chart), EmptyState.tsx, Panel.tsx
    modules/
      overview/Overview.tsx       NEW
      hooks/HookVault.tsx         NEW
      analytics/Analytics.tsx     NEW
      competitors/Competitors.tsx NEW
      scheduler/Scheduler.tsx     NEW
      calendar/Calendar.tsx       NEW
      trending/Trending.tsx       NEW
  data/
    sources.json                  NEW seed feeds
    schedule.json, hooks-meta.json  created at runtime by store.ts
    ig-cache/, trends-cache/      runtime caches (gitignored)
  e2e/screenshots.spec.ts         NEW Playwright per-module screenshot pass
scripts/
  refresh_token.ts                NEW token refresh + log
  register_token_task.ps1         NEW Windows Task Scheduler registration
```

**Build order is binding:** Tasks 1–8 (server + contracts) before any module task. Module tasks 10–17 each depend only on Tasks 1–9 and may then be done in any order.

**Commit convention:** every task ends in a commit on the working branch. Run server tests from `dashboard/` with `bun test server src`.

---

### Task 1: Scaffold + run skeleton

**Files:**
- Create: `package.json` (repo root)
- Create: `dashboard/package.json`, `dashboard/tsconfig.json`, `dashboard/vite.config.ts`, `dashboard/index.html`, `dashboard/.gitignore`, `dashboard/.env.example`
- Create: `dashboard/server/index.ts`, `dashboard/server/paths.ts`
- Create: `dashboard/src/main.tsx`, `dashboard/src/App.tsx`, `dashboard/src/app.css` (placeholder)
- Create: `dashboard/scripts/dash.ts`
- Create: `dashboard/shared/types.ts`

- [x] **Step 1: Root package.json**

```json
{
  "name": "ai-ugc-pipeline",
  "private": true,
  "scripts": {
    "dash": "bun dashboard/scripts/dash.ts"
  }
}
```

- [x] **Step 2: Dashboard package + config**

`dashboard/package.json`:

```json
{
  "name": "dashboard",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "server": "bun server/index.ts",
    "test": "bun test server src",
    "e2e": "playwright test e2e"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.90.0",
    "fast-xml-parser": "^4.5.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.49.0",
    "@tanstack/react-query-devtools": "^5.90.0",
    "@types/bun": "latest",
    "@types/react": "^19.2.0",
    "@types/react-dom": "^19.2.0",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.7.2",
    "vite": "^6.0.0"
  }
}
```

Run `cd dashboard && bun install`. React 19 matches the renderer (`renderer/package.json` pins `^19.2.0`); the dashboard uses no 19-specific APIs, so the version only matters for consistency.

`dashboard/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "allowJs": true,
    "noEmit": true,
    "types": ["bun-types"],
    "paths": { "@shared/*": ["./shared/*"] },
    "baseUrl": "."
  },
  "include": ["src", "server", "shared", "e2e", "scripts"]
}
```

`dashboard/vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4410,
    strictPort: true,
    proxy: { "/api": "http://localhost:4400" },
  },
  resolve: {
    alias: { "@shared": path.resolve(__dirname, "shared") },
  },
});
```

`dashboard/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>chron0s — content dashboard</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`dashboard/.gitignore`:

```
.env
data/ig-cache/
data/trends-cache/
node_modules/
token_refresh.log
e2e/shots/
```

`dashboard/.env.example`:

```
IG_ACCESS_TOKEN=
IG_USER_ID=
IG_APP_ID=
IG_APP_SECRET=
```

- [x] **Step 3: paths.ts (single source for repo locations)**

`dashboard/server/paths.ts`:

```ts
import path from "node:path";

/** dashboard/server -> repo root is two levels up. */
export const REPO_ROOT = path.resolve(import.meta.dir, "..", "..");
export const DASH_ROOT = path.resolve(import.meta.dir, "..");
export const DATA_DIR = path.join(DASH_ROOT, "data");
export const IG_CACHE_DIR = path.join(DATA_DIR, "ig-cache");
export const TRENDS_CACHE_DIR = path.join(DATA_DIR, "trends-cache");
export const POSTS_DIR = path.join(REPO_ROOT, "renderer", "content", "posts");
export const RENDERS_DIR = path.join(REPO_ROOT, "pipeline", "renders");
export const INGESTED_DIR = path.join(REPO_ROOT, "pipeline", "content", "ingested");
export const CAPTION_BANK = path.join(REPO_ROOT, "pipeline", "content", "CAPTION_BANK.md");
```

- [x] **Step 4: Shared types (starter set, grown by later tasks)**

`dashboard/shared/types.ts`:

```ts
export type ApiEnvelope<T> = {
  data: T | null;
  error: string | null;
  /** epoch ms when the underlying upstream data was fetched; null = live/local read */
  fetchedAt: number | null;
};

export type ModuleKey =
  | "overview" | "hooks" | "analytics" | "competitors"
  | "scheduler" | "calendar" | "trending";
```

- [x] **Step 5: Minimal server with /api/health**

`dashboard/server/index.ts`:

```ts
import { serve } from "bun";

export function envelope<T>(data: T | null, error: string | null = null, fetchedAt: number | null = null) {
  return Response.json({ data, error, fetchedAt });
}

const server = serve({
  port: 4400,
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/api/health") return envelope({ ok: true });
    return envelope(null, `unknown route: ${url.pathname}`);
  },
});

console.log(`[dash] server on http://localhost:${server.port}`);
```

- [x] **Step 6: Minimal React app**

`dashboard/src/main.tsx`:

```tsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./app.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

`dashboard/src/App.tsx` (placeholder, replaced in Task 9):

```tsx
export default function App() {
  return <main>chron0s content dashboard — scaffold OK</main>;
}
```

`dashboard/src/app.css` may be empty for now.

- [x] **Step 7: dash.ts launcher**

`dashboard/scripts/dash.ts`:

```ts
import { spawn } from "bun";
import path from "node:path";

const dash = path.resolve(import.meta.dir, "..");
const procs = [
  spawn(["bun", "server/index.ts"], { cwd: dash, stdout: "inherit", stderr: "inherit" }),
  spawn(["bunx", "vite"], { cwd: dash, stdout: "inherit", stderr: "inherit" }),
];
process.on("SIGINT", () => { for (const p of procs) p.kill(); process.exit(0); });
await Promise.all(procs.map((p) => p.exited));
```

Note: Bun auto-loads `dashboard/.env` because the server's cwd is `dashboard/`.

- [x] **Step 8: Verify**

Run: `bun run dash` from repo root. Expected: server log line; `curl http://localhost:4400/api/health` returns `{"data":{"ok":true},"error":null,"fetchedAt":null}`; `http://localhost:4410` shows the scaffold text. Ctrl-C stops both.

- [x] **Step 9: Commit**

```bash
git add package.json dashboard
git commit -m "feat(dashboard): scaffold Bun server + Vite React app, bun run dash"
```

---

### Task 2: store.ts — allowlisted local JSON state

**Files:**
- Create: `dashboard/server/store.ts`
- Test: `dashboard/server/store.test.ts`
- Create: `dashboard/data/sources.json` (seed)

- [ ] **Step 1: Write the failing tests**

`dashboard/server/store.test.ts`:

```ts
import { describe, expect, test, beforeEach } from "bun:test";
import path from "node:path";
import fs from "node:fs";
import { readState, writeState, ALLOWED_STATE_FILES } from "./store";

const tmp = path.join(import.meta.dir, "fixtures", "tmp-data");

beforeEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp, { recursive: true });
});

describe("store", () => {
  test("allowlist is exactly the three state files", () => {
    expect([...ALLOWED_STATE_FILES].sort()).toEqual(
      ["hooks-meta.json", "schedule.json", "sources.json"]);
  });

  test("rejects non-allowlisted names including traversal", () => {
    expect(() => readState("evil.json", tmp)).toThrow();
    expect(() => writeState("..\\..\\.env", {}, tmp)).toThrow();
    expect(() => writeState("../schedule.json", {}, tmp)).toThrow();
  });

  test("read of a missing file returns the default", () => {
    expect(readState("schedule.json", tmp)).toEqual({ items: [] });
    expect(readState("hooks-meta.json", tmp)).toEqual({ hooks: {} });
    expect(readState("sources.json", tmp)).toEqual([]);
  });

  test("write then read round-trips", () => {
    writeState("schedule.json", { items: [{ id: "x" }] }, tmp);
    expect(readState("schedule.json", tmp)).toEqual({ items: [{ id: "x" }] });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd dashboard && bun test server/store.test.ts`
Expected: FAIL (`Cannot find module './store'`).

- [ ] **Step 3: Implement store.ts**

```ts
import path from "node:path";
import fs from "node:fs";
import { DATA_DIR } from "./paths";

export const ALLOWED_STATE_FILES = new Set([
  "schedule.json",
  "hooks-meta.json",
  "sources.json",
]);

const DEFAULTS: Record<string, unknown> = {
  "schedule.json": { items: [] },
  "hooks-meta.json": { hooks: {} },
  "sources.json": [],
};

function resolveStateFile(name: string, dir: string): string {
  if (!ALLOWED_STATE_FILES.has(name)) {
    throw new Error(`state file not allowed: ${name}`);
  }
  return path.join(dir, name);
}

export function readState(name: string, dir: string = DATA_DIR): unknown {
  const file = resolveStateFile(name, dir);
  if (!fs.existsSync(file)) return DEFAULTS[name];
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function writeState(name: string, value: unknown, dir: string = DATA_DIR): void {
  const file = resolveStateFile(name, dir);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
}
```

The `Set` membership check is the whole defense: `"../schedule.json"` is not in the set, so traversal is impossible by construction.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd dashboard && bun test server/store.test.ts` — Expected: PASS (4 tests).

- [ ] **Step 5: Seed sources.json**

`dashboard/data/sources.json`:

```json
[
  { "url": "https://hnrss.org/frontpage", "label": "Hacker News front page", "enabled": true },
  { "url": "https://www.bleepingcomputer.com/feed/", "label": "BleepingComputer", "enabled": true },
  { "url": "https://simonwillison.net/atom/everything/", "label": "Simon Willison", "enabled": true }
]
```

- [ ] **Step 6: Commit**

```bash
git add dashboard/server/store.ts dashboard/server/store.test.ts dashboard/data/sources.json
git commit -m "feat(dashboard): allowlisted local JSON state store with seeds"
```

---

### Task 3: repo.ts — posts + renders readers

**Files:**
- Create: `dashboard/server/repo.ts`
- Test: `dashboard/server/repo.test.ts`
- Create: `dashboard/server/fixtures/posts/2026-06-07_fixture-post.json`
- Create: `dashboard/server/fixtures/renders/2026-06-07_fixture-post/` (touch `caption.txt`, `sources.md`, `2026-06-07_fixture-post_01_cover.png`, `2026-06-07_fixture-post_reel.mp4` — note the PREFIXED reel name, matching real packages), `dashboard/server/fixtures/renders/week 1/` (dir with one stray file; the REAL `week 1/` contains nested package dirs instead, but `listRenders` treats both identically since neither has top-level PNGs or caption.txt)

- [x] **Step 1: Write the failing tests**

`dashboard/server/repo.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import path from "node:path";
import { listPosts, listRenders, parseRenderDirName } from "./repo";

const fx = path.join(import.meta.dir, "fixtures");

describe("listPosts", () => {
  test("reads posts JSON with cover hook extracted", () => {
    const posts = listPosts(path.join(fx, "posts"));
    expect(posts).toHaveLength(1);
    const p = posts[0];
    expect(p.slug).toBe("fixture-post");
    expect(p.date).toBe("2026-06-07");
    expect(p.theme).toBe("defensive");
    expect(p.coverHook).toBe("Your AI agent reads everything. So do attackers.");
    expect(p.slideCount).toBe(2);
  });
});

describe("parseRenderDirName", () => {
  test("conforming name yields date+slug", () => {
    expect(parseRenderDirName("2026-06-07_hermes-desktop"))
      .toEqual({ date: "2026-06-07", slug: "hermes-desktop" });
  });
  test("non-conforming name yields null date", () => {
    expect(parseRenderDirName("week 1")).toEqual({ date: null, slug: "week 1" });
  });
});

describe("listRenders", () => {
  test("lists packages incl. non-conforming dirs, with assets", () => {
    const renders = listRenders(path.join(fx, "renders"));
    const names = renders.map((r) => r.dirName).sort();
    expect(names).toEqual(["2026-06-07_fixture-post", "week 1"]);
    const ok = renders.find((r) => r.dirName === "2026-06-07_fixture-post")!;
    expect(ok.date).toBe("2026-06-07");
    expect(ok.hasCaption).toBe(true);
    expect(ok.hasReel).toBe(true);
    expect(ok.slides).toEqual(["2026-06-07_fixture-post_01_cover.png"]);
    const bad = renders.find((r) => r.dirName === "week 1")!;
    expect(bad.date).toBeNull();
  });
});
```

Fixture post JSON (`fixtures/posts/2026-06-07_fixture-post.json`) — a trimmed real-shape post:

```json
{
  "post_id": "2026-06-07_fixture-post",
  "date": "2026-06-07",
  "slug": "fixture-post",
  "pillar": "model-security",
  "theme": "defensive",
  "caption": "Fixture caption.",
  "slides": [
    { "slide": 1, "role": "cover", "kicker": "AI SECURITY",
      "on_slide_copy": "Your AI agent reads everything. So do attackers.",
      "subline": "Fixture subline." },
    { "slide": 2, "role": "cta", "kicker": "FOLLOW",
      "on_slide_copy": "Follow for more.", "subline": "" }
  ]
}
```

- [x] **Step 2: Run tests to verify they fail**

Run: `cd dashboard && bun test server/repo.test.ts` — Expected: FAIL (module not found).

- [x] **Step 3: Implement repo.ts**

```ts
import fs from "node:fs";
import path from "node:path";
import { POSTS_DIR, RENDERS_DIR } from "./paths";

export type RepoPost = {
  postId: string; date: string; slug: string; pillar: string; theme: string;
  caption: string; coverHook: string; slideCount: number; fileName: string;
};

export type RenderPackage = {
  dirName: string; date: string | null; slug: string;
  slides: string[]; hasCaption: boolean; hasSources: boolean; hasReel: boolean;
};

const DIR_RE = /^(\d{4}-\d{2}-\d{2})_(.+)$/;

export function parseRenderDirName(dirName: string): { date: string | null; slug: string } {
  const m = dirName.match(DIR_RE);
  return m ? { date: m[1], slug: m[2] } : { date: null, slug: dirName };
}

export function listPosts(dir: string = POSTS_DIR): RepoPost[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((fileName) => {
      const j = JSON.parse(fs.readFileSync(path.join(dir, fileName), "utf8"));
      const slides: any[] = Array.isArray(j.slides) ? j.slides : [];
      const cover = slides.find((s) => s.role === "cover");
      return {
        postId: j.post_id ?? fileName.replace(/\.json$/, ""),
        date: j.date ?? "", slug: j.slug ?? "", pillar: j.pillar ?? "",
        theme: j.theme ?? "", caption: j.caption ?? "",
        coverHook: cover?.on_slide_copy ?? "",
        slideCount: slides.length, fileName,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function listRenders(dir: string = RENDERS_DIR): RenderPackage[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => {
      const full = path.join(dir, e.name);
      const files = fs.readdirSync(full);
      const { date, slug } = parseRenderDirName(e.name);
      return {
        dirName: e.name, date, slug,
        slides: files.filter((f) => /\.png$/i.test(f)).sort(),
        hasCaption: files.includes("caption.txt"),
        hasSources: files.includes("sources.md"),
        hasReel: files.some((f) => /_reel\.mp4$/i.test(f)), // reels are '<dirName>_reel.mp4'
      };
    })
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

export function readRenderFile(dirName: string, file: "caption.txt" | "sources.md", dir: string = RENDERS_DIR): string | null {
  // dirName comes from listRenders output; still refuse separators defensively.
  if (dirName.includes("/") || dirName.includes("\\") || dirName.includes("..")) return null;
  const p = path.join(dir, dirName, file);
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null;
}
```

- [x] **Step 4: Run tests to verify they pass**

Run: `cd dashboard && bun test server/repo.test.ts` — Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add dashboard/server/repo.ts dashboard/server/repo.test.ts dashboard/server/fixtures
git commit -m "feat(dashboard): read-only repo readers for posts and render packages"
```

---

### Task 4: ingested.ts — analysis-doc parsing with handle attribution

**Files:**
- Create: `dashboard/server/ingested.ts`
- Test: `dashboard/server/ingested.test.ts`
- Create: `dashboard/server/fixtures/ingested/2026-06-07_with-handle.md`, `2026-06-07_no-handle.md`, `INDEX.md`

- [x] **Step 1: Fixtures (mirror the real shape exactly)**

`fixtures/ingested/2026-06-07_with-handle.md`:

```markdown
# Ingested: "Fixture System" (3 rules)
**Source:** https://www.instagram.com/p/FIXTURE/ · **Handle:** @growithalex (creative strategist) · **Captured:** 2026-06-07 · **Posted:** May 18 · **Engagement:** 5.2K likes

## Slide map

| # | Role | Idea (paraphrased) |
|---|------|--------------------|
| 1 | Cover | "Steal my fixture system. 3 rules. No exceptions." |
| 2 | Rule 1 | The cover stops the scroll. |
```

`fixtures/ingested/2026-06-07_no-handle.md`:

```markdown
# Ingested: best-practices research
**Source:** various · **Captured:** 2026-06-07

## Notes
General research, no single creator.
```

`fixtures/ingested/INDEX.md`: any one line (must be excluded by the parser).

- [x] **Step 2: Write the failing tests**

`dashboard/server/ingested.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import path from "node:path";
import { listIngested, parseHandle, parseCoverHook } from "./ingested";

const fx = path.join(import.meta.dir, "fixtures", "ingested");

describe("parseHandle", () => {
  test("extracts bare handle from the metadata line", () => {
    expect(parseHandle("**Source:** x · **Handle:** @growithalex (strategist) · **Captured:** y"))
      .toBe("@growithalex");
  });
  test("returns null when absent", () => {
    expect(parseHandle("**Source:** various · **Captured:** 2026-06-07")).toBeNull();
  });
});

describe("parseCoverHook", () => {
  test("pulls quoted cover text from the slide-map table", () => {
    const md = `## Slide map\n\n| # | Role | Idea |\n|---|---|---|\n| 1 | Cover | "Steal my fixture system. 3 rules. No exceptions." |\n| 2 | Rule 1 | x |`;
    expect(parseCoverHook(md)).toBe("Steal my fixture system. 3 rules. No exceptions.");
  });
  test("null when no cover row", () => {
    expect(parseCoverHook("## Notes\nnothing")).toBeNull();
  });
});

describe("listIngested", () => {
  test("excludes INDEX.md, attributes by handle, groups unattributed", () => {
    const docs = listIngested(fx);
    expect(docs).toHaveLength(2);
    const withH = docs.find((d) => d.handle === "@growithalex")!;
    expect(withH.date).toBe("2026-06-07");
    expect(withH.title).toContain("Fixture System");
    expect(withH.coverHook).toContain("Steal my fixture system");
    const noH = docs.find((d) => d.handle === null)!;
    expect(noH.fileName).toBe("2026-06-07_no-handle.md");
  });
});
```

- [x] **Step 3: Run tests to verify they fail**

Run: `cd dashboard && bun test server/ingested.test.ts` — Expected: FAIL.

- [x] **Step 4: Implement ingested.ts**

```ts
import fs from "node:fs";
import path from "node:path";
import { INGESTED_DIR } from "./paths";

export type IngestedDoc = {
  fileName: string; date: string | null; title: string;
  handle: string | null; sourceUrl: string | null; coverHook: string | null;
  mtimeMs: number;
};

const FILE_RE = /^(\d{4}-\d{2}-\d{2})_.+\.md$/;

export function parseHandle(line: string): string | null {
  const m = line.match(/\*\*Handle:\*\*\s*(@[\w.\-]+)/);
  return m ? m[1] : null;
}

export function parseCoverHook(md: string): string | null {
  const section = md.split(/^## Slide map\s*$/m)[1];
  if (!section) return null;
  for (const line of section.split("\n")) {
    const cells = line.split("|").map((c) => c.trim());
    // | # | Role | Idea | -> ["", "#", "Role", "Idea", ""]
    if (cells.length >= 4 && /^cover$/i.test(cells[2])) {
      const m = cells[3].match(/[“"]([^”"]+)[”"]/);
      return m ? m[1] : cells[3] || null;
    }
    if (/^## /.test(line) && !/^## Slide map/.test(line)) break;
  }
  return null;
}

export function listIngested(dir: string = INGESTED_DIR): IngestedDoc[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => FILE_RE.test(f)) // excludes INDEX.md and any non-dated file
    .map((fileName) => {
      const full = path.join(dir, fileName);
      const md = fs.readFileSync(full, "utf8");
      const lines = md.split("\n");
      const metaLine = lines.find((l) => l.startsWith("**Source:**")) ?? "";
      const title = (lines[0] ?? "").replace(/^#\s*/, "");
      const url = metaLine.match(/\*\*Source:\*\*\s*(\S+)/)?.[1] ?? null;
      return {
        fileName,
        date: fileName.match(FILE_RE)?.[1] ?? null,
        title,
        handle: parseHandle(metaLine),
        sourceUrl: url && url.startsWith("http") ? url : null,
        coverHook: parseCoverHook(md),
        mtimeMs: fs.statSync(full).mtimeMs,
      };
    })
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}
```

- [x] **Step 5: Run tests to verify they pass**

Run: `cd dashboard && bun test server/ingested.test.ts` — Expected: PASS. Also sanity-check against real data: `cd dashboard && bun -e 'import {listIngested} from "./server/ingested"; console.log(listIngested())'` — expect the two @growithalex docs attributed, `best-practices-research` unattributed, no INDEX.md.

- [x] **Step 6: Commit**

```bash
git add dashboard/server/ingested.ts dashboard/server/ingested.test.ts dashboard/server/fixtures/ingested
git commit -m "feat(dashboard): ingested-doc parser with handle attribution"
```

---

### Task 5: hooks.ts — hook aggregation from three sources

**Files:**
- Create: `dashboard/server/hooks.ts`
- Test: `dashboard/server/hooks.test.ts`
- Create: `dashboard/server/fixtures/CAPTION_BANK_fixture.md`

**Times-used rule (from spec):** computed, not manual — the count of posts whose normalized `coverHook` equals the normalized hook text. Normalize = lowercase, collapse whitespace, strip trailing punctuation.

- [x] **Step 1: Caption-bank fixture** (`fixtures/CAPTION_BANK_fixture.md`) — mirror the real table shape:

```markdown
## 1. Cover Hook Formulas

Formula = whatever.

| Formula | Cybersecurity example |
| --- | --- |
| `Someone used AI to [action]` | Someone used AI to clone a CFO's voice on a video call |
| `Stop [behavior] before [consequence]` | Stop pasting production logs into chatbots |

---

## 2. Caption Frameworks
ignored
```

- [x] **Step 2: Write the failing tests**

`dashboard/server/hooks.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import path from "node:path";
import { normalizeHook, parseCaptionBankHooks, aggregateHooks } from "./hooks";

const fx = path.join(import.meta.dir, "fixtures");

describe("normalizeHook", () => {
  test("lowercases, collapses whitespace, strips trailing punctuation", () => {
    expect(normalizeHook("  Your AI agent  reads EVERYTHING. ")).toBe("your ai agent reads everything");
  });
});

describe("parseCaptionBankHooks", () => {
  test("takes second cell of body rows in section 1 only", () => {
    const hooks = parseCaptionBankHooks(path.join(fx, "CAPTION_BANK_fixture.md"));
    expect(hooks).toEqual([
      "Someone used AI to clone a CFO's voice on a video call",
      "Stop pasting production logs into chatbots",
    ]);
  });
});

describe("aggregateHooks", () => {
  test("merges sources, dedupes by normalized text, counts uses from posts", () => {
    const rows = aggregateHooks({
      posts: [
        { coverHook: "Stop pasting production logs into chatbots", slug: "a", date: "2026-06-01" },
        { coverHook: "Stop pasting production logs into chatbots.", slug: "b", date: "2026-06-02" },
        { coverHook: "Unique post hook", slug: "c", date: "2026-06-03" },
      ],
      ingested: [{ coverHook: "Steal my fixture system", fileName: "x.md", date: "2026-06-07" }],
      captionBank: ["Stop pasting production logs into chatbots"],
    });
    const stop = rows.find((r) => r.text.startsWith("Stop pasting"))!;
    expect(stop.timesUsed).toBe(2);
    expect(stop.sources.sort()).toEqual(["caption-bank", "post"]);
    expect(rows.find((r) => r.text === "Steal my fixture system")!.sources).toEqual(["ingested"]);
    expect(rows.find((r) => r.text === "Unique post hook")!.timesUsed).toBe(1);
  });
});
```

- [x] **Step 3: Run tests to verify they fail** — `cd dashboard && bun test server/hooks.test.ts` → FAIL.

- [x] **Step 4: Implement hooks.ts**

```ts
import fs from "node:fs";
import { CAPTION_BANK } from "./paths";

export type HookSource = "post" | "ingested" | "caption-bank";
export type HookRow = {
  id: string;          // normalized text (stable key for hooks-meta.json tags)
  text: string;        // first-seen original casing
  sources: HookSource[];
  timesUsed: number;   // count of posts with matching normalized coverHook
  lastUsed: string | null;
};

export function normalizeHook(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim().replace(/[.,!?:;]+$/, "");
}

export function parseCaptionBankHooks(file: string = CAPTION_BANK): string[] {
  if (!fs.existsSync(file)) return [];
  const md = fs.readFileSync(file, "utf8");
  const section = md.split(/^## 1\. Cover Hook Formulas\s*$/m)[1]?.split(/^## /m)[0];
  if (!section) return [];
  const hooks: string[] = [];
  for (const line of section.split("\n")) {
    const cells = line.split("|").map((c) => c.trim());
    if (cells.length < 4) continue;                   // not a 2-col table row
    if (/^-+$/.test(cells[1].replace(/\s/g, "")) ) continue; // separator row
    if (/^formula$/i.test(cells[1])) continue;        // header row
    if (cells[2]) hooks.push(cells[2]);
  }
  return hooks;
}

type AggInput = {
  posts: { coverHook: string; slug: string; date: string }[];
  ingested: { coverHook: string | null; fileName: string; date: string | null }[];
  captionBank: string[];
};

export function aggregateHooks({ posts, ingested, captionBank }: AggInput): HookRow[] {
  const map = new Map<string, HookRow>();
  const upsert = (text: string, source: HookSource) => {
    const id = normalizeHook(text);
    if (!id) return;
    const row = map.get(id) ?? { id, text, sources: [], timesUsed: 0, lastUsed: null };
    if (!row.sources.includes(source)) row.sources.push(source);
    map.set(id, row);
  };
  for (const p of posts) if (p.coverHook) upsert(p.coverHook, "post");
  for (const d of ingested) if (d.coverHook) upsert(d.coverHook, "ingested");
  for (const h of captionBank) upsert(h, "caption-bank");
  // usage counts come only from posts
  for (const p of posts) {
    const row = map.get(normalizeHook(p.coverHook));
    if (!row) continue;
    row.timesUsed += 1;
    if (!row.lastUsed || p.date > row.lastUsed) row.lastUsed = p.date;
  }
  return [...map.values()].sort((a, b) => b.timesUsed - a.timesUsed || a.text.localeCompare(b.text));
}
```

- [x] **Step 5: Run tests to verify they pass** — `cd dashboard && bun test server/hooks.test.ts` → PASS.

- [x] **Step 6: Commit**

```bash
git add dashboard/server/hooks.ts dashboard/server/hooks.test.ts dashboard/server/fixtures/CAPTION_BANK_fixture.md
git commit -m "feat(dashboard): hook aggregation with computed times-used"
```

---

### Task 6: ig.ts — Graph API proxy with disk cache (fixture-tested)

**Files:**
- Create: `dashboard/server/ig.ts`
- Test: `dashboard/server/ig.test.ts`
- Create: `dashboard/server/fixtures/ig/account.json`, `dashboard/server/fixtures/ig/media.json`, `dashboard/server/fixtures/ig/insights-video.json`, `dashboard/server/fixtures/ig/insights-image.json`

**Hard constraints:** token never reaches the browser (it lives only in `process.env` server-side); metrics split by `media_type`; every response cached to `data/ig-cache/` with `fetchedAt`; cache served when upstream fails. **Do not request `impressions` or `plays` — deprecated.**

- [x] **Step 1: Fixtures.** Recorded-shape Graph API payloads:

`fixtures/ig/account.json`:

```json
{ "id": "17841400000000000", "username": "chron0s_cyb3r_w0rld.ai", "biography": "Real threats, real tools, no fake panic.", "followers_count": 412, "media_count": 9, "profile_picture_url": "https://example.com/p.jpg" }
```

`fixtures/ig/media.json` (two items, one VIDEO one CAROUSEL_ALBUM):

```json
{ "data": [
  { "id": "m1", "caption": "Reel caption", "media_type": "VIDEO", "timestamp": "2026-06-05T14:00:00+0000",
    "like_count": 50, "comments_count": 6, "media_url": "https://example.com/r.mp4",
    "thumbnail_url": "https://example.com/r.jpg", "permalink": "https://www.instagram.com/reel/x/" },
  { "id": "m2", "caption": "Carousel caption", "media_type": "CAROUSEL_ALBUM", "timestamp": "2026-06-03T09:00:00+0000",
    "like_count": 80, "comments_count": 12, "media_url": "https://example.com/c1.jpg",
    "permalink": "https://www.instagram.com/p/y/" }
] }
```

`fixtures/ig/insights-video.json`:

```json
{ "data": [
  { "name": "views", "values": [{ "value": 1200 }] },
  { "name": "reach", "values": [{ "value": 900 }] },
  { "name": "saved", "values": [{ "value": 30 }] },
  { "name": "shares", "values": [{ "value": 12 }] },
  { "name": "total_interactions", "values": [{ "value": 98 }] },
  { "name": "ig_reels_avg_watch_time", "values": [{ "value": 8200 }] },
  { "name": "ig_reels_video_view_total_time", "values": [{ "value": 9840000 }] }
] }
```

`fixtures/ig/insights-image.json`: same shape with only `views, reach, saved, shares, total_interactions`.

- [x] **Step 2: Write the failing tests**

`dashboard/server/ig.test.ts`:

```ts
import { describe, expect, test, beforeEach } from "bun:test";
import path from "node:path";
import fs from "node:fs";
import { metricsFor, parseInsights, fetchWithCache } from "./ig";

const fx = path.join(import.meta.dir, "fixtures", "ig");
const tmpCache = path.join(import.meta.dir, "fixtures", "tmp-ig-cache");
beforeEach(() => fs.rmSync(tmpCache, { recursive: true, force: true }));

describe("metricsFor", () => {
  test("VIDEO gets reel metrics, never impressions/plays", () => {
    const m = metricsFor("VIDEO");
    expect(m).toContain("ig_reels_avg_watch_time");
    expect(m).toContain("views");
    expect(m).not.toContain("impressions");
    expect(m).not.toContain("plays");
  });
  test("IMAGE and CAROUSEL_ALBUM get feed metrics only", () => {
    for (const t of ["IMAGE", "CAROUSEL_ALBUM"] as const) {
      const m = metricsFor(t);
      expect(m).toEqual(["views", "reach", "saved", "shares", "total_interactions"]);
    }
  });
});

describe("parseInsights", () => {
  test("flattens Graph insights array to a record", () => {
    const raw = JSON.parse(fs.readFileSync(path.join(fx, "insights-video.json"), "utf8"));
    const r = parseInsights(raw);
    expect(r.views).toBe(1200);
    expect(r.ig_reels_avg_watch_time).toBe(8200);
  });
});

describe("fetchWithCache", () => {
  test("serves fresh cache WITHOUT calling upstream (cache-first)", async () => {
    let calls = 0;
    const fetcher = async () => { calls++; return { ok: calls }; };
    const a = await fetchWithCache("k", fetcher, tmpCache);           // cold: fetches
    const b = await fetchWithCache("k", fetcher, tmpCache);           // warm: cache only
    expect(calls).toBe(1);
    expect(b.data).toEqual({ ok: 1 });
    expect(b.fetchedAt).toBe(a.fetchedAt);
  });
  test("force bypasses fresh cache", async () => {
    let calls = 0;
    const fetcher = async () => { calls++; return { ok: calls }; };
    await fetchWithCache("k2", fetcher, tmpCache);
    const b = await fetchWithCache("k2", fetcher, tmpCache, { force: true });
    expect(calls).toBe(2);
    expect(b.data).toEqual({ ok: 2 });
  });
  test("stale cache triggers refetch", async () => {
    let calls = 0;
    const fetcher = async () => { calls++; return { ok: calls }; };
    await fetchWithCache("k3", fetcher, tmpCache, { maxAgeMs: -1 }); // everything is instantly stale
    await fetchWithCache("k3", fetcher, tmpCache, { maxAgeMs: -1 });
    expect(calls).toBe(2);
  });
  test("serves stale cache with error when upstream fails", async () => {
    let calls = 0;
    const fetcher = async () => { calls++; if (calls > 1) throw new Error("down"); return { ok: 1 }; };
    const a = await fetchWithCache("k4", fetcher, tmpCache);
    const b = await fetchWithCache("k4", fetcher, tmpCache, { force: true }); // fetcher throws now
    expect(b.data).toEqual({ ok: 1 });   // cache served
    expect(b.error).toContain("down");   // error surfaced alongside
    expect(b.fetchedAt).toBe(a.fetchedAt);
  });
  test("failure with no cache returns null data + error", async () => {
    const r = await fetchWithCache("missing", async () => { throw new Error("nope"); }, tmpCache);
    expect(r.data).toBeNull();
    expect(r.error).toContain("nope");
  });
});
```

- [x] **Step 3: Run tests to verify they fail** — `cd dashboard && bun test server/ig.test.ts` → FAIL.

- [x] **Step 4: Implement ig.ts**

```ts
import fs from "node:fs";
import path from "node:path";
import { IG_CACHE_DIR } from "./paths";

const GRAPH = "https://graph.facebook.com/v23.0";

export type MediaType = "VIDEO" | "IMAGE" | "CAROUSEL_ALBUM";

const REEL_METRICS = ["views", "reach", "saved", "shares", "total_interactions",
  "ig_reels_avg_watch_time", "ig_reels_video_view_total_time"];
const FEED_METRICS = ["views", "reach", "saved", "shares", "total_interactions"];

export function metricsFor(type: MediaType): string[] {
  return type === "VIDEO" ? [...REEL_METRICS] : [...FEED_METRICS];
}

export function parseInsights(raw: { data?: { name: string; values?: { value: number }[] }[] }): Record<string, number> {
  const out: Record<string, number> = {};
  for (const m of raw.data ?? []) out[m.name] = m.values?.[0]?.value ?? 0;
  return out;
}

type Cached<T> = { data: T | null; error: string | null; fetchedAt: number | null };
export type CacheOpts = { maxAgeMs?: number; force?: boolean };
const DEFAULT_MAX_AGE_MS = 6 * 3_600_000; // IG data: 6h is plenty for a daily-use tool

/**
 * Cache-first (per spec "the UI renders from cache instantly and refreshes on demand"):
 * fresh cache is served WITHOUT touching upstream; `force` (the Refresh button) and
 * staleness trigger a refetch; a failed refetch falls back to stale cache + error.
 */
export async function fetchWithCache<T>(
  key: string, fetcher: () => Promise<T>, dir: string = IG_CACHE_DIR, opts: CacheOpts = {},
): Promise<Cached<T>> {
  const { maxAgeMs = DEFAULT_MAX_AGE_MS, force = false } = opts;
  const file = path.join(dir, `${key}.json`);
  const cached = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
  if (cached && !force && Date.now() - cached.fetchedAt <= maxAgeMs) {
    return { data: cached.data, error: null, fetchedAt: cached.fetchedAt };
  }
  try {
    const data = await fetcher();
    const fetchedAt = Date.now();
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify({ fetchedAt, data }));
    return { data, error: null, fetchedAt };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    if (cached) return { data: cached.data, error, fetchedAt: cached.fetchedAt };
    return { data: null, error, fetchedAt: null };
  }
}

function token(): string {
  const t = process.env.IG_ACCESS_TOKEN;
  if (!t) throw new Error("IG_ACCESS_TOKEN missing. Copy .env.example to dashboard/.env and fill it in.");
  return t;
}

async function graphGet(pathAndQuery: string): Promise<any> {
  const sep = pathAndQuery.includes("?") ? "&" : "?";
  const res = await fetch(`${GRAPH}${pathAndQuery}${sep}access_token=${token()}`);
  const body = await res.json();
  if (!res.ok || body.error) {
    const msg = body?.error?.message ?? `HTTP ${res.status}`;
    if (/expired|invalid/i.test(msg) || body?.error?.code === 190) {
      throw new Error(`IG token expired or invalid. Fix: bun scripts/refresh_token.ts (repo root). [${msg}]`);
    }
    throw new Error(`IG API: ${msg}`);
  }
  return body;
}

export async function getAccount(force = false) {
  const id = process.env.IG_USER_ID;
  return fetchWithCache("account", () =>
    graphGet(`/${id}?fields=id,username,biography,followers_count,media_count,profile_picture_url`),
    undefined, { force });
}

export async function getMedia(force = false) {
  const id = process.env.IG_USER_ID;
  return fetchWithCache("media", async () => {
    const media = await graphGet(
      `/${id}/media?limit=50&fields=id,caption,media_type,timestamp,like_count,comments_count,media_url,thumbnail_url,permalink`);
    const items = [];
    for (const m of media.data ?? []) {
      let insights: Record<string, number> = {};
      try {
        insights = parseInsights(await graphGet(`/${m.id}/insights?metric=${metricsFor(m.media_type).join(",")}`));
      } catch { /* per-post insights can fail (e.g. very old media); keep the post */ }
      items.push({ ...m, insights });
    }
    return items;
  }, undefined, { force });
}
```

Notes for the implementer: the per-post insights call count (≤50 sequential requests) is fine for a manual Refresh button; do not add concurrency until rate limits actually bite (YAGNI). `getAccount`/`getMedia` are NOT unit-tested live — only their pure parts (`metricsFor`, `parseInsights`, `fetchWithCache`) are, per the spec's "no live calls in tests".

- [x] **Step 5: Run tests to verify they pass** — `cd dashboard && bun test server/ig.test.ts` → PASS.

- [x] **Step 6: Commit**

```bash
git add dashboard/server/ig.ts dashboard/server/ig.test.ts dashboard/server/fixtures/ig
git commit -m "feat(dashboard): IG Graph proxy with type-split metrics and disk cache"
```

---

### Task 7: trends.ts — RSS/Atom fetch + parse + cache

**Files:**
- Create: `dashboard/server/trends.ts`
- Test: `dashboard/server/trends.test.ts`
- Create: `dashboard/server/fixtures/rss-sample.xml`, `dashboard/server/fixtures/atom-sample.xml`

- [x] **Step 1: Fixtures.** `rss-sample.xml` (RSS 2.0, two items with `title`, `link`, `pubDate`) and `atom-sample.xml` (Atom, two `entry` elements with `title`, `link href`, `updated`). Keep them minimal but valid.

```xml
<?xml version="1.0"?>
<rss version="2.0"><channel><title>Fixture Feed</title>
<item><title>AI agent CVE drops</title><link>https://example.com/1</link><pubDate>Sat, 06 Jun 2026 10:00:00 GMT</pubDate></item>
<item><title>Second item</title><link>https://example.com/2</link><pubDate>Fri, 05 Jun 2026 10:00:00 GMT</pubDate></item>
</channel></rss>
```

```xml
<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom"><title>Fixture Atom</title>
<entry><title>Atom entry one</title><link href="https://example.com/a1"/><updated>2026-06-06T12:00:00Z</updated></entry>
<entry><title>Atom entry two</title><link href="https://example.com/a2"/><updated>2026-06-04T12:00:00Z</updated></entry>
</feed>
```

- [x] **Step 2: Write the failing tests**

`dashboard/server/trends.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import path from "node:path";
import fs from "node:fs";
import { parseFeed } from "./trends";

const fx = path.join(import.meta.dir, "fixtures");

describe("parseFeed", () => {
  test("parses RSS 2.0", () => {
    const items = parseFeed(fs.readFileSync(path.join(fx, "rss-sample.xml"), "utf8"), "Fixture");
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({
      title: "AI agent CVE drops", url: "https://example.com/1",
      publishedAt: Date.parse("Sat, 06 Jun 2026 10:00:00 GMT"), sourceLabel: "Fixture",
    });
  });
  test("parses Atom", () => {
    const items = parseFeed(fs.readFileSync(path.join(fx, "atom-sample.xml"), "utf8"), "Atom");
    expect(items).toHaveLength(2);
    expect(items[0].url).toBe("https://example.com/a1");
    expect(items[0].publishedAt).toBe(Date.parse("2026-06-06T12:00:00Z"));
  });
  test("garbage input returns empty array, does not throw", () => {
    expect(parseFeed("<html>not a feed</html>", "x")).toEqual([]);
  });
});
```

- [x] **Step 3: Run tests to verify they fail** — `cd dashboard && bun test server/trends.test.ts` → FAIL.

- [x] **Step 4: Implement trends.ts**

```ts
import { XMLParser } from "fast-xml-parser";
import { TRENDS_CACHE_DIR } from "./paths";
import { readState } from "./store";
import { fetchWithCache } from "./ig"; // generic cache helper, reused

export type TrendItem = { title: string; url: string; publishedAt: number; sourceLabel: string };
export type SourceEntry = { url: string; label: string; enabled: boolean };

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
const asArray = <T>(x: T | T[] | undefined): T[] => (x == null ? [] : Array.isArray(x) ? x : [x]);

export function parseFeed(xml: string, sourceLabel: string): TrendItem[] {
  let doc: any;
  try { doc = parser.parse(xml); } catch { return []; }
  const out: TrendItem[] = [];
  for (const it of asArray(doc?.rss?.channel?.item)) {
    out.push({ title: String(it.title ?? ""), url: String(it.link ?? ""),
      publishedAt: Date.parse(it.pubDate ?? "") || 0, sourceLabel });
  }
  for (const e of asArray(doc?.feed?.entry)) {
    const link = asArray(e.link).find((l: any) => l["@_href"]) as any;
    out.push({ title: typeof e.title === "object" ? e.title["#text"] ?? "" : String(e.title ?? ""),
      url: link?.["@_href"] ?? "", publishedAt: Date.parse(e.updated ?? e.published ?? "") || 0, sourceLabel });
  }
  return out.filter((i) => i.title && i.url);
}

export async function getTrends(force = false) {
  const sources = (readState("sources.json") as SourceEntry[]).filter((s) => s.enabled);
  return fetchWithCache("trends", async () => {
    const results = await Promise.allSettled(sources.map(async (s) => {
      const res = await fetch(s.url, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return parseFeed(await res.text(), s.label);
    }));
    const items = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
    const deadSources = sources
      .filter((_, i) => results[i].status === "rejected")
      .map((s, ) => s.label);
    items.sort((a, b) => b.publishedAt - a.publishedAt);
    return { items, deadSources };
  }, TRENDS_CACHE_DIR, { maxAgeMs: 3_600_000, force }); // trends go stale faster: 1h
}
```

Dead sources never throw the whole fetch — they're collected into `deadSources` and flagged in the UI per the spec.

- [x] **Step 5: Run tests to verify they pass** — `cd dashboard && bun test server/trends.test.ts` → PASS.

- [x] **Step 6: Commit**

```bash
git add dashboard/server/trends.ts dashboard/server/trends.test.ts dashboard/server/fixtures/*.xml
git commit -m "feat(dashboard): RSS/Atom trends fetcher with dead-source flagging"
```

---

### Task 8: Server routing — wire everything into index.ts

**Files:**
- Modify: `dashboard/server/index.ts`

- [x] **Step 1: Replace index.ts with the full router**

```ts
import { serve } from "bun";
import { getAccount, getMedia } from "./ig";
import { listPosts, listRenders, readRenderFile } from "./repo";
import { listIngested } from "./ingested";
import { aggregateHooks, parseCaptionBankHooks } from "./hooks";
import { getTrends } from "./trends";
import { readState, writeState, ALLOWED_STATE_FILES } from "./store";
import { RENDERS_DIR, DASH_ROOT } from "./paths";
import path from "node:path";
import fs from "node:fs";

function env<T>(data: T | null, error: string | null = null, fetchedAt: number | null = null) {
  return Response.json({ data, error, fetchedAt });
}

const server = serve({
  port: 4400,
  async fetch(req) {
    const url = new URL(req.url);
    const p = url.pathname;
    const force = url.searchParams.get("refresh") === "1"; // Refresh button bypasses fresh cache
    try {
      if (p === "/api/health") return env({ ok: true });

      if (p === "/api/ig/account") { const r = await getAccount(force); return env(r.data, r.error, r.fetchedAt); }
      if (p === "/api/ig/media")   { const r = await getMedia(force);   return env(r.data, r.error, r.fetchedAt); }
      if (p === "/api/ig/token-age") {
        // Token age = time since the last successful refresh (token_refresh.log OK line),
        // falling back to .env mtime when the log does not exist yet.
        const log = path.join(DASH_ROOT, "token_refresh.log");
        const envFile = path.join(DASH_ROOT, ".env");
        let since: number | null = null;
        if (fs.existsSync(log)) {
          const ok = fs.readFileSync(log, "utf8").split("\n").filter((l) => l.includes(" OK ")).at(-1);
          if (ok) since = Date.parse(ok.slice(0, 24)) || null;
        }
        if (!since && fs.existsSync(envFile)) since = fs.statSync(envFile).mtimeMs;
        return env(since ? { ageDays: Math.floor((Date.now() - since) / 86_400_000) } : null,
          since ? null : "no token yet");
      }

      if (p === "/api/repo/posts")    return env(listPosts());
      if (p === "/api/repo/renders")  return env(listRenders());
      if (p === "/api/repo/ingested") return env(listIngested());
      if (p === "/api/repo/hooks") {
        return env(aggregateHooks({
          posts: listPosts(), ingested: listIngested(), captionBank: parseCaptionBankHooks(),
        }));
      }

      // render package text files + slide thumbnails
      const renderFile = p.match(/^\/api\/repo\/renders\/([^/]+)\/(caption\.txt|sources\.md)$/);
      if (renderFile) return env(readRenderFile(decodeURIComponent(renderFile[1]), renderFile[2] as any));
      const thumb = p.match(/^\/api\/repo\/renders\/([^/]+)\/slide\/([^/]+\.png)$/i);
      if (thumb) {
        const dir = decodeURIComponent(thumb[1]); const file = decodeURIComponent(thumb[2]);
        if ([dir, file].some((s) => s.includes("..") || s.includes("/") || s.includes("\\")))
          return env(null, "bad path");
        const full = path.join(RENDERS_DIR, dir, file);
        if (!fs.existsSync(full)) return env(null, "not found");
        return new Response(Bun.file(full));
      }

      if (p === "/api/trends") { const r = await getTrends(force); return env(r.data, r.error, r.fetchedAt); }

      const state = p.match(/^\/api\/state\/([\w.\-]+)$/);
      if (state) {
        const name = state[1];
        if (!ALLOWED_STATE_FILES.has(name)) return env(null, `state file not allowed: ${name}`);
        if (req.method === "GET") return env(readState(name));
        if (req.method === "PUT") { writeState(name, await req.json()); return env({ ok: true }); }
      }

      return env(null, `unknown route: ${p}`);
    } catch (e) {
      return env(null, e instanceof Error ? e.message : String(e));
    }
  },
});

console.log(`[dash] server on http://localhost:${server.port}`);
```

- [x] **Step 2: Verify by hand**

Run `bun run dash`, then:
- `curl localhost:4400/api/repo/posts` → real posts array, `error: null`.
- `curl localhost:4400/api/repo/hooks` → aggregated hook rows from real repo data.
- `curl localhost:4400/api/repo/ingested` → @growithalex docs attributed, no INDEX.md.
- `curl localhost:4400/api/state/evil.json` → `error: "state file not allowed: evil.json"`.
- `curl localhost:4400/api/ig/account` without `.env` → `data: null`, `error` mentions `IG_ACCESS_TOKEN missing` — server still up.
- `curl localhost:4400/api/trends` → live items (network permitting) and a `trends-cache/trends.json` file appears.

- [x] **Step 3: Run the whole server test suite**

Run: `cd dashboard && bun test server` — Expected: all pass.

- [x] **Step 4: Commit**

```bash
git add dashboard/server/index.ts
git commit -m "feat(dashboard): wire all API routes with {data,error,fetchedAt} envelope"
```

---

### Task 9: Design layer + app shell

**Files:**
- Copy: `Content Dashboard Plan Reference/chron0s_cyb3r_w0rld Design System/tokens/*.css` → `dashboard/src/design/tokens/`
- Copy: `.../components/primitives/*.jsx` and `*.d.ts` → `dashboard/src/design/primitives/` (NOT `_ds_bundle.js`, NOT `.prompt.md` files)
- Create: `dashboard/src/app.css` (full version), `dashboard/src/lib/api.ts`
- Create: `dashboard/src/components/Shell.tsx`, `StatCard.tsx`, `StalenessBanner.tsx`, `Panel.tsx`, `EmptyState.tsx`, `Bars.tsx`
- Modify: `dashboard/src/App.tsx`

Design-pass skills apply to Tasks 9–17: follow @impeccable and @design-taste-frontend for hierarchy/interaction; the DS tokens are the override authority when guidance conflicts (per spec).

- [x] **Step 1: Copy the DS sources**

```bash
mkdir -p dashboard/src/design/tokens dashboard/src/design/primitives
cp "Content Dashboard Plan Reference/chron0s_cyb3r_w0rld Design System/tokens/"*.css dashboard/src/design/tokens/
cp "Content Dashboard Plan Reference/chron0s_cyb3r_w0rld Design System/components/primitives/"*.jsx dashboard/src/design/primitives/
cp "Content Dashboard Plan Reference/chron0s_cyb3r_w0rld Design System/components/primitives/"*.d.ts dashboard/src/design/primitives/
```

The DS folder remains upstream source of truth — never edit files under `src/design/tokens/` or `src/design/primitives/`; dashboard-specific styles go in `app.css`. Check `tokens/fonts.css` for `@font-face`/import strategy; if it expects font files, add `@fontsource/archivo`, `@fontsource/inter`, `@fontsource/jetbrains-mono` to `dashboard/package.json` (same packages the renderer uses) and import them in `main.tsx` instead.

- [x] **Step 2: app.css** — imports tokens, then dashboard layout. Key rules (complete file):

```css
@import "./design/tokens/colors.css";
@import "./design/tokens/effects.css";
@import "./design/tokens/fonts.css";
@import "./design/tokens/spacing.css";
@import "./design/tokens/typography.css";

* { box-sizing: border-box; }
html, body, #root { height: 100%; margin: 0; }
body { background: var(--bg-deep); color: var(--fg); font-family: Inter, system-ui, sans-serif; }

.shell { display: grid; grid-template-columns: 240px 1fr; height: 100%; }
.sidebar {
  background: var(--bg); border-right: 1px solid var(--hairline);
  display: flex; flex-direction: column; padding: 24px 16px; gap: 4px;
}
.sidebar .brand { margin-bottom: 24px; }
.nav-item {
  font-family: "JetBrains Mono", monospace; font-weight: 500; font-size: 12px;
  text-transform: uppercase; letter-spacing: 0.12em;
  color: var(--muted); padding: 10px 12px; border-radius: 8px;
  background: none; border: none; text-align: left; cursor: pointer;
  transition: color 240ms cubic-bezier(0.22, 0.61, 0.36, 1);
}
.nav-item:hover, .nav-item.active { color: var(--accent); }
.sidebar-footer { margin-top: auto; display: flex; flex-direction: column; gap: 8px; }
.meta-caps {
  font-family: "JetBrains Mono", monospace; font-size: 10px; letter-spacing: 0.14em;
  text-transform: uppercase; color: var(--muted);
}

.main { overflow-y: auto; padding: 32px 40px; background: var(--bg); }
.page-title { font-family: Archivo, sans-serif; font-weight: 800; font-size: 28px; margin: 0 0 24px; }

.panel {
  background: var(--panel); border: 1px solid var(--hairline);
  border-radius: 28px; padding: 24px;
}
.stat-card { border-top: 2px solid var(--accent); }
.stat-card .num {
  font-family: Archivo, sans-serif; font-weight: 800; font-size: 36px;
  text-shadow: 0 0 24px color-mix(in srgb, var(--accent) 45%, transparent);
}
.chip {
  font-family: "JetBrains Mono", monospace; font-size: 10px; letter-spacing: 0.1em;
  text-transform: uppercase; border: 1px solid var(--hairline); border-radius: 999px;
  padding: 4px 10px; color: var(--muted); background: none; cursor: pointer;
}
.chip.active { color: var(--accent); border-color: var(--accent); }
.grid { display: grid; gap: 16px; }
.grid.cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid.cols-4 { grid-template-columns: repeat(4, 1fr); }
.staleness {
  font-family: "JetBrains Mono", monospace; font-size: 10px; letter-spacing: 0.14em;
  text-transform: uppercase; color: var(--danger); padding: 8px 12px;
  border: 1px solid var(--hairline); border-radius: 8px; margin-bottom: 16px;
}
button { font: inherit; color: inherit; }
a { color: var(--accent); }
```

Flat, shadow-free, glow only on focal numbers, 28px panel radii, 999px chips, the spec's easing — all per the spec's Visual design section.

- [x] **Step 3: lib/api.ts (TanStack Query layer)**

The QueryClient is a thin dedupe/memory layer over the server's disk cache (see the two-cache
convention in the header). `useApi` keeps the `{ data, error, fetchedAt, loading, reload }`
shape so module code reads identically; `useStateFile` wraps state writes in a `useMutation`
with optimistic cache updates, replacing hand-rolled local mirrors in the modules.

```ts
import { useCallback } from "react";
import {
  QueryClient, useMutation, useQuery, useQueryClient,
} from "@tanstack/react-query";
import type { ApiEnvelope } from "@shared/types";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,            // memory layer only; the server cache owns real freshness
      refetchOnWindowFocus: false,  // a local tool refocused 50x/day must not spam the server
      retry: 1,
    },
  },
});

async function getEnvelope<T>(path: string, force = false): Promise<ApiEnvelope<T>> {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(force ? `${path}${sep}refresh=1` : path);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const keyFor = (path: string) => ["api", path] as const;

export function useApi<T>(path: string): ApiEnvelope<T> & { loading: boolean; reload: () => void } {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: keyFor(path), queryFn: () => getEnvelope<T>(path) });
  const env: ApiEnvelope<T> = query.data ?? { data: null, error: null, fetchedAt: null };
  const reload = useCallback(async () => {
    // Per-module forced refresh: bypass the SERVER disk cache, then update the client cache.
    const fresh = await getEnvelope<T>(path, true).catch(
      (e): ApiEnvelope<T> => ({ data: env.data, error: String(e), fetchedAt: env.fetchedAt }));
    qc.setQueryData(keyFor(path), fresh);
  }, [path, qc, env.data, env.fetchedAt]);
  return {
    ...env,
    error: env.error ?? (query.error ? String(query.error) : null),
    loading: query.isPending,
    reload,
  };
}

/**
 * Local-state file (schedule.json / hooks-meta.json / sources.json) as a query + mutation.
 * save() optimistically writes the client cache, PUTs, then invalidates so the cache converges.
 * Callers must still guard against saving while `loading` (a write before the first GET
 * resolves would clobber keys owned by other modules in the same file).
 */
export function useStateFile<T>(name: string) {
  const qc = useQueryClient();
  const path = `/api/state/${name}`;
  const api = useApi<T>(path);
  const mutation = useMutation({
    mutationFn: async (value: T) => {
      const res = await fetch(path, { method: "PUT", body: JSON.stringify(value) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return value;
    },
    onMutate: async (value) => {
      await qc.cancelQueries({ queryKey: keyFor(path) });
      const snapshot = qc.getQueryData<ApiEnvelope<T>>(keyFor(path));
      qc.setQueryData<ApiEnvelope<T>>(keyFor(path), { data: value, error: null, fetchedAt: null });
      return { snapshot };
    },
    onError: (_e, _v, ctx) => { if (ctx?.snapshot) qc.setQueryData(keyFor(path), ctx.snapshot); },
    onSettled: () => qc.invalidateQueries({ queryKey: keyFor(path) }),
  });
  return {
    ...api,
    save: (value: T) => {
      // Central guard for all four callers: never write while the first GET is pending
      // OR errored (an unreadable file must not be overwritten with defaults).
      if (api.loading || api.error) return;
      mutation.mutate(value);
    },
  };
}

/** Sidebar Refresh: bypass the server disk caches for upstream data, then refetch everything. */
export async function refreshAll(qc: QueryClient) {
  await Promise.allSettled(
    ["/api/ig/account", "/api/ig/media", "/api/trends"].map((p) => getEnvelope(p, true)));
  await qc.invalidateQueries({ queryKey: ["api"] });
}

export function ageLabel(fetchedAt: number | null): string {
  if (!fetchedAt) return "NEVER FETCHED";
  const h = (Date.now() - fetchedAt) / 3_600_000;
  return h < 1 ? `CACHED ${Math.round(h * 60)}M AGO` : `CACHED ${Math.round(h)}H AGO`;
}
```

`main.tsx` gains the provider (replace the render block):

```tsx
import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import App from "./App";
import { queryClient } from "./lib/api";
import "./app.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      {import.meta.env.DEV && !import.meta.env.VITE_E2E && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </React.StrictMode>
);
```

- [x] **Step 4: Shared components** (each its own file; complete code)

`components/Panel.tsx`:

```tsx
export function Panel({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <section className={`panel ${className}`}>{children}</section>;
}
```

`components/StatCard.tsx`:

```tsx
import { Panel } from "./Panel";
export function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Panel className="stat-card">
      <div className="meta-caps">{label}</div>
      <div className="num">{value}</div>
      {sub ? <div className="meta-caps">{sub}</div> : null}
    </Panel>
  );
}
```

`components/StalenessBanner.tsx`:

```tsx
import { ageLabel } from "../lib/api";
export function StalenessBanner({ label, error, fetchedAt }: { label: string; error: string | null; fetchedAt: number | null }) {
  if (!error) return null;
  return <div className="staleness">{label} · {ageLabel(fetchedAt)} · {error}</div>;
}
```

`components/EmptyState.tsx`:

```tsx
import { Panel } from "./Panel";
export function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <Panel>
      <div className="meta-caps">{title}</div>
      <p style={{ color: "var(--muted)" }}>{hint}</p>
    </Panel>
  );
}
```

`components/Bars.tsx` (the only chart primitive; accent-colored, transparent background):

```tsx
export function Bars({ values, labels, height = 96 }: { values: number[]; labels?: string[]; height?: number }) {
  const max = Math.max(...values, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height }}>
      {values.map((v, i) => (
        <div key={i} title={labels?.[i]} style={{
          flex: 1, height: `${(v / max) * 100}%`, minHeight: 2,
          background: "var(--accent)", opacity: 0.85, borderRadius: 2,
        }} />
      ))}
    </div>
  );
}
```

- [x] **Step 5: Shell + App with per-module theme scopes**

`components/Shell.tsx`:

```tsx
import { useQueryClient } from "@tanstack/react-query";
import type { ModuleKey } from "@shared/types";
import { BrandMark } from "../design/primitives/BrandMark";
import { ageLabel, refreshAll, useApi } from "../lib/api";

export const MODULES: { key: ModuleKey; label: string; theme: string }[] = [
  { key: "overview",    label: "Overview",        theme: "theme-defensive" },
  { key: "hooks",       label: "Hook Vault",      theme: "theme-hacking" },
  { key: "analytics",   label: "Analytics",       theme: "theme-defensive" },
  { key: "competitors", label: "Competitors",     theme: "theme-offensive" },
  { key: "scheduler",   label: "Scheduler",       theme: "theme-purple-team" },
  { key: "calendar",    label: "Calendar",        theme: "theme-purple-team" },
  { key: "trending",    label: "What's Trending", theme: "theme-ai" },
];

export function Shell({ active, onNav, children }: {
  active: ModuleKey; onNav: (m: ModuleKey) => void; children: React.ReactNode;
}) {
  const qc = useQueryClient();
  const account = useApi<any>("/api/ig/account");
  const tokenAge = useApi<{ ageDays: number }>("/api/ig/token-age");
  const theme = MODULES.find((m) => m.key === active)!.theme;
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><BrandMark /></div>
        {MODULES.map((m) => (
          <button key={m.key} className={`nav-item ${m.theme} ${m.key === active ? "active" : ""}`}
            onClick={() => onNav(m.key)}>{m.label}</button>
        ))}
        <div className="sidebar-footer">
          <button className="chip" onClick={() => refreshAll(qc)}>Refresh</button>
          <span className="meta-caps">IG {ageLabel(account.fetchedAt)}</span>
          <span className="meta-caps" style={tokenAge.data && tokenAge.data.ageDays > 50 ? { color: "var(--danger)" } : undefined}>
            TOKEN {tokenAge.data ? `${tokenAge.data.ageDays}D OLD` : "NOT SET"}
          </span>
        </div>
      </aside>
      <main className={`main ${theme}`}>{children}</main>
    </div>
  );
}
```

Each nav item carries its module's theme class so it previews that accent (spec). If `BrandMark.jsx` needs props or doesn't render standalone, check its `.d.ts` and pass the minimum; fall back to a mono-caps `chron0s_cyb3r_w0rld` span only if the primitive is slide-bound.

`App.tsx`:

```tsx
import { useState } from "react";
import type { ModuleKey } from "@shared/types";
import { Shell } from "./components/Shell";
import { Overview } from "./modules/overview/Overview";
import { HookVault } from "./modules/hooks/HookVault";
import { Analytics } from "./modules/analytics/Analytics";
import { Competitors } from "./modules/competitors/Competitors";
import { Scheduler } from "./modules/scheduler/Scheduler";
import { CalendarView } from "./modules/calendar/Calendar";
import { Trending } from "./modules/trending/Trending";

const VIEWS: Record<ModuleKey, React.ComponentType> = {
  overview: Overview, hooks: HookVault, analytics: Analytics, competitors: Competitors,
  scheduler: Scheduler, calendar: CalendarView, trending: Trending,
};

export default function App() {
  const [active, setActive] = useState<ModuleKey>("overview");
  const View = VIEWS[active];
  return (
    <Shell active={active} onNav={setActive}>
      <View key={active} />
    </Shell>
  );
}
```

Global Refresh works via `refreshAll(queryClient)`: it bypasses the server's disk caches for the three upstream endpoints, then invalidates every `["api", …]` query so mounted hooks refetch. Module mounts hit the in-memory query cache first (30s staleTime), then the server's disk cache, so switching modules never hammers upstream and identical concurrent requests (e.g. Shell + Overview both reading `/api/ig/account`) are deduplicated by TanStack Query. Until Tasks 10–17 land, stub each module file with `export function X() { return <h1 className="page-title">X</h1>; }` so the app compiles.

- [x] **Step 6: Verify** — `bun run dash`, open `http://localhost:4410`: sidebar with 7 mono-caps items, accents per module, dark chron0s surfaces, module switch works.

- [x] **Step 7: Commit**

```bash
git add dashboard/src
git commit -m "feat(dashboard): chron0s design layer, app shell, module scaffolds"
```

---

### Task 10: Pure UI logic — analytics.ts + schedule.ts (TDD)

**Files:**
- Create: `dashboard/src/lib/analytics.ts`, `dashboard/src/lib/analytics.test.ts`
- Create: `dashboard/src/lib/schedule.ts`, `dashboard/src/lib/schedule.test.ts`

- [x] **Step 1: Write the failing analytics tests**

`src/lib/analytics.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { engagementRate, tierFor, summarize, dayOfWeekBuckets, hashtagStats, type MediaItem } from "./analytics";

const reel: MediaItem = {
  id: "m1", media_type: "VIDEO", timestamp: "2026-06-05T14:00:00+0000",
  like_count: 50, comments_count: 6, caption: "hello #AISecurity #InfoSec", permalink: "",
  insights: { views: 1200, reach: 900, saved: 30, shares: 12, total_interactions: 98,
    ig_reels_avg_watch_time: 8200, ig_reels_video_view_total_time: 9840000 },
};
const img: MediaItem = {
  id: "m2", media_type: "CAROUSEL_ALBUM", timestamp: "2026-06-03T09:00:00+0000",
  like_count: 80, comments_count: 12, caption: "post #InfoSec", permalink: "",
  insights: { views: 600, reach: 0, saved: 10, shares: 2, total_interactions: 104 },
};

describe("engagementRate", () => {
  test("(likes+comments+saved+shares)/reach*100", () => {
    expect(engagementRate(reel)).toBeCloseTo(((50 + 6 + 30 + 12) / 900) * 100, 5);
  });
  test("falls back to views when reach is 0", () => {
    expect(engagementRate(img)).toBeCloseTo(((80 + 12 + 10 + 2) / 600) * 100, 5);
  });
  test("0 when both denominators are missing", () => {
    expect(engagementRate({ ...img, insights: {} })).toBe(0);
  });
});

describe("tierFor", () => {
  test("≥5 green, ≥2 accent, else muted", () => {
    expect(tierFor(5)).toBe("green");
    expect(tierFor(2)).toBe("accent");
    expect(tierFor(1.9)).toBe("muted");
  });
});

describe("summarize", () => {
  test("averages and totals across posts", () => {
    const s = summarize([reel, img]);
    expect(s.avgLikes).toBe(65);
    expect(s.avgComments).toBe(9);
    expect(s.totalReelViews).toBe(1200); // VIDEO only
    expect(s.savesRate).toBeCloseTo((40 / 1500) * 100, 5); // saved sum / reach-or-views sum
  });
});

describe("dayOfWeekBuckets", () => {
  test("only buckets with ≥1 post appear", () => {
    const b = dayOfWeekBuckets([reel, img]);
    expect(Object.keys(b).length).toBe(2);
  });
});

describe("hashtagStats", () => {
  test("only tags used 2+ times, case-insensitive", () => {
    const stats = hashtagStats([reel, img]);
    expect(stats.map((s) => s.tag)).toEqual(["#infosec"]);
    expect(stats[0].count).toBe(2);
  });
});
```

- [x] **Step 2: Run to verify failure** — `cd dashboard && bun test src/lib/analytics.test.ts` → FAIL.

- [x] **Step 3: Implement analytics.ts**

```ts
export type MediaItem = {
  id: string; media_type: "VIDEO" | "IMAGE" | "CAROUSEL_ALBUM";
  timestamp: string; like_count: number; comments_count: number;
  caption: string; permalink: string;
  media_url?: string; thumbnail_url?: string;
  insights: Partial<Record<
    "views" | "reach" | "saved" | "shares" | "total_interactions" |
    "ig_reels_avg_watch_time" | "ig_reels_video_view_total_time", number>>;
};

export function denominator(m: MediaItem): number {
  return m.insights.reach || m.insights.views || 0;
}

export function engagementRate(m: MediaItem): number {
  const d = denominator(m);
  if (!d) return 0;
  return ((m.like_count + m.comments_count + (m.insights.saved ?? 0) + (m.insights.shares ?? 0)) / d) * 100;
}

export type Tier = "green" | "accent" | "muted";
export function tierFor(rate: number): Tier {
  return rate >= 5 ? "green" : rate >= 2 ? "accent" : "muted";
}

export function summarize(items: MediaItem[]) {
  const n = items.length || 1;
  const sum = (f: (m: MediaItem) => number) => items.reduce((a, m) => a + f(m), 0);
  const reachSum = sum(denominator);
  return {
    avgLikes: sum((m) => m.like_count) / n,
    avgComments: sum((m) => m.comments_count) / n,
    avgReach: sum((m) => m.insights.reach ?? 0) / n,
    avgSaves: sum((m) => m.insights.saved ?? 0) / n,
    avgEngagement: sum(engagementRate) / n,
    totalReelViews: sum((m) => (m.media_type === "VIDEO" ? m.insights.views ?? 0 : 0)),
    savesRate: reachSum ? (sum((m) => m.insights.saved ?? 0) / reachSum) * 100 : 0,
    sharesRate: reachSum ? (sum((m) => m.insights.shares ?? 0) / reachSum) * 100 : 0,
  };
}

export function reelWatchStats(items: MediaItem[]) {
  const reels = items.filter((m) => m.media_type === "VIDEO" && m.insights.ig_reels_avg_watch_time != null);
  if (!reels.length) return null;
  const best = [...reels].sort((a, b) =>
    (b.insights.ig_reels_avg_watch_time ?? 0) - (a.insights.ig_reels_avg_watch_time ?? 0))[0];
  return {
    avgWatchMs: reels.reduce((a, m) => a + (m.insights.ig_reels_avg_watch_time ?? 0), 0) / reels.length,
    totalWatchMs: reels.reduce((a, m) => a + (m.insights.ig_reels_video_view_total_time ?? 0), 0),
    totalViews: reels.reduce((a, m) => a + (m.insights.views ?? 0), 0),
    best,
  };
}

export function dayOfWeekBuckets(items: MediaItem[]): Record<string, { count: number; avgEngagement: number }> {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const out: Record<string, { count: number; avgEngagement: number }> = {};
  for (const m of items) {
    const d = days[new Date(m.timestamp).getDay()];
    const cur = out[d] ?? { count: 0, avgEngagement: 0 };
    cur.avgEngagement = (cur.avgEngagement * cur.count + engagementRate(m)) / (cur.count + 1);
    cur.count += 1;
    out[d] = cur;
  }
  return out;
}

export function hourBuckets(items: MediaItem[]): Record<string, { count: number; avgEngagement: number }> {
  const label = (h: number) => (h < 6 ? "00-06" : h < 12 ? "06-12" : h < 18 ? "12-18" : "18-24");
  const out: Record<string, { count: number; avgEngagement: number }> = {};
  for (const m of items) {
    const k = label(new Date(m.timestamp).getHours());
    const cur = out[k] ?? { count: 0, avgEngagement: 0 };
    cur.avgEngagement = (cur.avgEngagement * cur.count + engagementRate(m)) / (cur.count + 1);
    cur.count += 1;
    out[k] = cur;
  }
  return out;
}

export function hashtagStats(items: MediaItem[]): { tag: string; count: number; avgEngagement: number }[] {
  const map = new Map<string, { count: number; total: number }>();
  for (const m of items) {
    for (const raw of m.caption?.match(/#[\w]+/g) ?? []) {
      const tag = raw.toLowerCase();
      const cur = map.get(tag) ?? { count: 0, total: 0 };
      cur.count += 1; cur.total += engagementRate(m);
      map.set(tag, cur);
    }
  }
  return [...map.entries()]
    .filter(([, v]) => v.count >= 2)
    .map(([tag, v]) => ({ tag, count: v.count, avgEngagement: v.total / v.count }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement)
    .slice(0, 12);
}
```

- [x] **Step 4: Run analytics tests** — PASS.

- [x] **Step 5: Write the failing schedule tests**

`src/lib/schedule.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { transition, type ScheduleItem } from "./schedule";

const item: ScheduleItem = {
  id: "2026-06-07_hermes-desktop", renderDir: "2026-06-07_hermes-desktop",
  date: "2026-06-10", time: "18:00", platforms: ["instagram"], status: "queued",
};

describe("schedule transitions", () => {
  test("queued -> posted and queued -> skipped are legal", () => {
    expect(transition(item, "posted").status).toBe("posted");
    expect(transition(item, "skipped").status).toBe("skipped");
  });
  test("posted and skipped are terminal", () => {
    expect(() => transition({ ...item, status: "posted" }, "skipped")).toThrow();
    expect(() => transition({ ...item, status: "skipped" }, "posted")).toThrow();
  });
  test("posted stamps postedAt", () => {
    expect(transition(item, "posted").postedAt).toBeString();
  });
});
```

- [x] **Step 6: Implement schedule.ts**

```ts
export type ScheduleStatus = "queued" | "posted" | "skipped";
export type ScheduleItem = {
  id: string; renderDir: string; date: string; time: string;
  platforms: string[]; status: ScheduleStatus; postedAt?: string;
};

const LEGAL: Record<ScheduleStatus, ScheduleStatus[]> = {
  queued: ["posted", "skipped"],
  posted: [],
  skipped: [],
};

export function transition(item: ScheduleItem, to: ScheduleStatus): ScheduleItem {
  if (!LEGAL[item.status].includes(to)) {
    throw new Error(`illegal transition: ${item.status} -> ${to}`);
  }
  return { ...item, status: to, ...(to === "posted" ? { postedAt: new Date().toISOString() } : {}) };
}
```

- [x] **Step 7: Run all lib tests** — `cd dashboard && bun test src/lib` → PASS.

- [x] **Step 8: Commit**

```bash
git add dashboard/src/lib
git commit -m "feat(dashboard): tested analytics computations and schedule transitions"
```

---

## Module tasks (11–17)

Logic is already tested in Tasks 2–10; these tasks are UI assembly. Verification per module = dev server check now + the Playwright pass in Task 19. UI copy obeys the spec's chrome rules: no em-dashes, no fragments where a sentence is expected, mono-caps metadata.

### Task 11: Overview module

**Files:**
- Modify: `dashboard/src/modules/overview/Overview.tsx`

- [x] **Step 1: Implement**

```tsx
import { useApi } from "../../lib/api";
import { StatCard } from "../../components/StatCard";
import { Panel } from "../../components/Panel";
import { StalenessBanner } from "../../components/StalenessBanner";
import { summarize, type MediaItem } from "../../lib/analytics";

const weekAgo = () => Date.now() - 7 * 86_400_000;

export function Overview() {
  const account = useApi<any>("/api/ig/account");
  const media = useApi<MediaItem[]>("/api/ig/media");
  const posts = useApi<any[]>("/api/repo/posts");
  const hooks = useApi<any[]>("/api/repo/hooks");
  const ingested = useApi<any[]>("/api/repo/ingested");
  const schedule = useApi<{ items: any[] }>("/api/state/schedule.json");
  const meta = useApi<any>("/api/state/hooks-meta.json");
  const trends = useApi<{ items: any[] }>("/api/trends");

  const items = media.data ?? [];
  const recent = items.filter((m) => Date.parse(m.timestamp) > weekAgo());
  const views7d = recent.reduce((a, m) => a + (m.insights.views ?? 0), 0);
  const rendered7d = (posts.data ?? []).filter((p) => Date.parse(p.date) > weekAgo()).length;
  const nextSlots = (schedule.data?.items ?? []).filter((i) => i.status === "queued").slice(0, 3);
  const hooksNew7d = (hooks.data ?? []).filter((h) => h.lastUsed && Date.parse(h.lastUsed) > weekAgo()).length;
  const watchlistCount = (meta.data?.watchlist ?? []).length;
  const hookWorthy = Object.values(meta.data?.trendTags ?? {}).filter((t) => t === "hook").length;
  const s = summarize(items);

  return (
    <>
      <h1 className="page-title">
        Hey Jon. {account.data ? `@${account.data.username} is at ${account.data.followers_count} followers.` : "IG data is loading."}
      </h1>
      <StalenessBanner label="IG DATA" error={media.error} fetchedAt={media.fetchedAt} />
      <div className="grid cols-3" style={{ marginBottom: 16 }}>
        <StatCard label="IG VIEWS · 7D" value={views7d.toLocaleString()} />
        <StatCard label="AVG ENGAGEMENT" value={`${s.avgEngagement.toFixed(1)}%`} />
        <StatCard label="POSTS RENDERED · 7D" value={rendered7d} />
      </div>
      <div className="grid cols-4">
        <Panel><div className="meta-caps">HOOK VAULT</div><div className="num">{hooks.data?.length ?? 0}</div>
          <div className="meta-caps">{hooksNew7d} USED THIS WEEK</div></Panel>
        <Panel><div className="meta-caps">WATCHLIST</div><div className="num">{watchlistCount}</div>
          <div className="meta-caps">{ingested.data?.length ?? 0} INGESTED · LAST {ingested.data?.[0]?.date ?? "NONE"}</div></Panel>
        <Panel><div className="meta-caps">QUEUED SLOTS</div><div className="num">{nextSlots.length}</div>
          {nextSlots.map((i) => <div key={i.id} className="meta-caps">{i.date} {i.time}</div>)}</Panel>
        <Panel><div className="meta-caps">HOOK-WORTHY TRENDS</div><div className="num">{hookWorthy}</div>
          <div className="meta-caps">OF {trends.data?.items?.length ?? 0} ITEMS</div></Panel>
      </div>
    </>
  );
}
```

Follower delta needs history the API doesn't give; v1 shows the current count (YAGNI — a snapshot history file is a v2 item, do not build it now).

- [x] **Step 2: Verify in dev server, then commit**

```bash
git add dashboard/src/modules/overview
git commit -m "feat(dashboard): overview module"
```

---

### Task 12: Hook Vault module

**Files:**
- Modify: `dashboard/src/modules/hooks/HookVault.tsx`

- [x] **Step 1: Implement.** Behavior: list `/api/repo/hooks` rows; search box filters by substring; chip filters by source and by user tag; tag select per row (swap / build / claim / list / contrarian) persisted to `hooks-meta.json` keyed by `row.id`; "Use this" copies `/draft-post <hook> | <pillar>` to clipboard with a pillar prompt. Persistence goes through `useStateFile` (optimistic mutation), so no local mirror state is needed.

```tsx
import { useMemo, useState } from "react";
import { useApi, useStateFile } from "../../lib/api";
import { Panel } from "../../components/Panel";
import { EmptyState } from "../../components/EmptyState";

type HookRow = { id: string; text: string; sources: string[]; timesUsed: number; lastUsed: string | null };
// hooks-meta.json is SHARED: HookVault owns `hooks`, Competitors owns `watchlist`,
// Trending owns `trendTags`. Every save() must spread the full current value.
export type HooksMeta = {
  hooks: Record<string, { type?: string }>;
  watchlist?: string[];
  trendTags?: Record<string, "hook" | "explainer" | "skip">;
};
const TYPES = ["swap", "build", "claim", "list", "contrarian"] as const;
// Repo pillar vocabulary is UNDERSCORED (see DRAFT_POST_REFERENCE.md + posts JSON `pillar` field).
export const PILLARS = ["offensive_ai", "model_security", "data_leakage", "defensive_ai", "governance", "myth_busting"];

export function HookVault() {
  const hooks = useApi<HookRow[]>("/api/repo/hooks");
  const meta = useStateFile<HooksMeta>("hooks-meta.json");
  const [q, setQ] = useState("");
  const [srcFilter, setSrcFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const tags = meta.data?.hooks ?? {};

  const rows = useMemo(() => (hooks.data ?? []).filter((r) =>
    (!q || r.text.toLowerCase().includes(q.toLowerCase())) &&
    (!srcFilter || r.sources.includes(srcFilter)) &&
    (!typeFilter || tags[r.id]?.type === typeFilter)
  ), [hooks.data, q, srcFilter, typeFilter, tags]);

  const setTag = (id: string, type: string) => {
    if (meta.loading) return; // writing before the GET resolves would clobber watchlist/trendTags
    meta.save({ ...(meta.data ?? { hooks: {} }), hooks: { ...tags, [id]: { ...tags[id], type } } });
  };
  const use = (text: string) => {
    const pillar = window.prompt(`Pillar? (${PILLARS.join(" | ")})`, PILLARS[1]) ?? PILLARS[1];
    navigator.clipboard.writeText(`/draft-post ${text} | ${pillar}`);
  };

  if (!hooks.loading && !hooks.data?.length)
    return <EmptyState title="HOOK VAULT EMPTY" hint="Hooks appear here once posts, ingested docs, or CAPTION_BANK entries exist." />;

  return (
    <>
      <h1 className="page-title">Hook Vault</h1>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search hooks"
          style={{ background: "var(--panel)", border: "1px solid var(--hairline)", borderRadius: 999, padding: "8px 16px", color: "var(--fg)" }} />
        {["post", "ingested", "caption-bank"].map((s) => (
          <button key={s} className={`chip ${srcFilter === s ? "active" : ""}`}
            onClick={() => setSrcFilter(srcFilter === s ? null : s)}>{s}</button>
        ))}
        {TYPES.map((t) => (
          <button key={t} className={`chip ${typeFilter === t ? "active" : ""}`}
            onClick={() => setTypeFilter(typeFilter === t ? null : t)}>{t}</button>
        ))}
      </div>
      {rows.map((r) => (
        <Panel key={r.id} className="" >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
            <div>
              <div>{r.text}</div>
              <div className="meta-caps">
                {r.sources.join(" · ")} · USED {r.timesUsed}× {r.lastUsed ? `· LAST ${r.lastUsed}` : ""}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select value={tags[r.id]?.type ?? ""} onChange={(e) => setTag(r.id, e.target.value)}
                style={{ background: "var(--panel)", color: "var(--fg)", border: "1px solid var(--hairline)", borderRadius: 8, padding: 4 }}>
                <option value="">type</option>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <button className="chip" onClick={() => use(r.text)}>Use this</button>
            </div>
          </div>
        </Panel>
      ))}
    </>
  );
}
```

Add `margin-bottom: 8px` for stacked panels via a `.panel + .panel { margin-top: 8px }` rule in `app.css` if spacing looks cramped.

- [x] **Step 2: Verify (tag persists across reload; clipboard contains the command), then commit**

```bash
git add dashboard/src/modules/hooks dashboard/src/app.css
git commit -m "feat(dashboard): hook vault with tags, filters, draft-post copy"
```

---

### Task 13: Analytics module

**Files:**
- Modify: `dashboard/src/modules/analytics/Analytics.tsx`

- [x] **Step 1: Implement.** All sections from the spec, all computed client-side from `/api/ig/media` via the tested `lib/analytics.ts`:

```tsx
import { useMemo, useState } from "react";
import { useApi } from "../../lib/api";
import { Panel } from "../../components/Panel";
import { StatCard } from "../../components/StatCard";
import { StalenessBanner } from "../../components/StalenessBanner";
import { EmptyState } from "../../components/EmptyState";
import { Bars } from "../../components/Bars";
import {
  engagementRate, tierFor, summarize, reelWatchStats,
  dayOfWeekBuckets, hourBuckets, hashtagStats, type MediaItem,
} from "../../lib/analytics";

const SORTS = ["recent", "likes", "comments", "reach", "engagement", "saves", "views"] as const;
type Sort = (typeof SORTS)[number];

const sortFn: Record<Sort, (a: MediaItem, b: MediaItem) => number> = {
  recent: (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp),
  likes: (a, b) => b.like_count - a.like_count,
  comments: (a, b) => b.comments_count - a.comments_count,
  reach: (a, b) => (b.insights.reach ?? 0) - (a.insights.reach ?? 0),
  engagement: (a, b) => engagementRate(b) - engagementRate(a),
  saves: (a, b) => (b.insights.saved ?? 0) - (a.insights.saved ?? 0),
  views: (a, b) => (b.insights.views ?? 0) - (a.insights.views ?? 0),
};

const tierColor: Record<string, string> = {
  green: "var(--theme-hacking)", accent: "var(--accent)", muted: "var(--muted)",
};

export function Analytics() {
  const account = useApi<any>("/api/ig/account");
  const media = useApi<MediaItem[]>("/api/ig/media");
  const [sort, setSort] = useState<Sort>("recent");
  const items = media.data ?? [];
  const s = useMemo(() => summarize(items), [items]);
  const watch = useMemo(() => reelWatchStats(items), [items]);
  const byEng = useMemo(() => [...items].sort(sortFn.engagement), [items]);
  const days = useMemo(() => dayOfWeekBuckets(items), [items]);
  const hours = useMemo(() => hourBuckets(items), [items]);
  const tags = useMemo(() => hashtagStats(items), [items]);
  const sorted = useMemo(() => [...items].sort(sortFn[sort]), [items, sort]);
  const last20 = useMemo(() => [...items].sort(sortFn.recent).slice(0, 20).reverse(), [items]);

  if (!media.loading && !items.length)
    return (<>
      <StalenessBanner label="IG DATA" error={media.error} fetchedAt={media.fetchedAt} />
      <EmptyState title="NO IG DATA YET" hint="Set up dashboard/.env per the spec prerequisites, then press Refresh." />
    </>);

  return (
    <>
      <h1 className="page-title">Analytics{account.data ? ` · @${account.data.username}` : ""}</h1>
      <StalenessBanner label="IG DATA" error={media.error} fetchedAt={media.fetchedAt} />

      <div className="grid cols-3" style={{ marginBottom: 16 }}>
        <StatCard label="AVG LIKES" value={s.avgLikes.toFixed(0)} />
        <StatCard label="AVG COMMENTS" value={s.avgComments.toFixed(0)} />
        <StatCard label="AVG REACH" value={s.avgReach.toFixed(0)} />
        <StatCard label="AVG SAVES" value={s.avgSaves.toFixed(0)} />
        <StatCard label="ENGAGEMENT RATE" value={`${s.avgEngagement.toFixed(1)}%`} />
        <StatCard label="TOTAL REEL VIEWS" value={s.totalReelViews.toLocaleString()} />
      </div>

      {watch && (
        <div className="grid cols-4" style={{ marginBottom: 16 }}>
          <StatCard label="AVG WATCH TIME" value={`${(watch.avgWatchMs / 1000).toFixed(1)}s`} />
          <StatCard label="TOTAL WATCH TIME" value={`${(watch.totalWatchMs / 60000).toFixed(0)}m`} />
          <StatCard label="REEL VIEWS" value={watch.totalViews.toLocaleString()} />
          <StatCard label="BEST WATCH-TIME REEL" value={`${((watch.best.insights.ig_reels_avg_watch_time ?? 0) / 1000).toFixed(1)}s`}
            sub={watch.best.caption?.slice(0, 40)} />
        </div>
      )}

      <div className="grid cols-3" style={{ marginBottom: 16 }}>
        <Panel>
          <div className="meta-caps">SAVES RATE (BENCHMARK 2%)</div>
          <div className="num">{s.savesRate.toFixed(2)}%</div>
          <p className="meta-caps">SAVES ÷ REACH. ABOVE 2% MEANS THE ALGORITHM PUSHES IT.</p>
        </Panel>
        <Panel>
          <div className="meta-caps">SHARES RATE (BENCHMARK 1%)</div>
          <div className="num">{s.sharesRate.toFixed(2)}%</div>
          <p className="meta-caps">SHARES ÷ REACH. ABOVE 1% IS A STRONG DISTRIBUTION SIGNAL.</p>
        </Panel>
        <Panel>
          <div className="meta-caps">ENGAGEMENT · LAST {last20.length} POSTS</div>
          <Bars values={last20.map((m) => m.like_count + m.comments_count)}
            labels={last20.map((m) => m.timestamp.slice(0, 10))} />
        </Panel>
      </div>

      <div className="grid cols-3" style={{ marginBottom: 16 }}>
        <Panel>
          <div className="meta-caps">TOP 3</div>
          {byEng.slice(0, 3).map((m) => <PostRow key={m.id} m={m} />)}
        </Panel>
        <Panel>
          <div className="meta-caps">BOTTOM 3</div>
          {byEng.slice(-3).map((m) => <PostRow key={m.id} m={m} />)}
        </Panel>
        <Panel>
          <div className="meta-caps">BEST DAY / TIME</div>
          <Bars values={Object.values(days).map((v) => v.avgEngagement)}
            labels={Object.entries(days).map(([d, v]) => `${d} · ${v.avgEngagement.toFixed(1)}% · ${v.count} posts`)}
            height={64} />
          <div className="meta-caps">{Object.keys(days).join(" · ")}</div>
          <Bars values={Object.values(hours).map((v) => v.avgEngagement)}
            labels={Object.entries(hours).map(([h, v]) => `${h}h · ${v.avgEngagement.toFixed(1)}% · ${v.count} posts`)}
            height={64} />
          <div className="meta-caps">{Object.keys(hours).join(" · ")}</div>
        </Panel>
      </div>

      {tags.length > 0 && (
        <Panel className="" >
          <div className="meta-caps" style={{ marginBottom: 8 }}>HASHTAGS (USED 2+)</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {tags.map((t) => <span key={t.tag} className="chip">{t.tag} · {t.avgEngagement.toFixed(1)}% · {t.count}×</span>)}
          </div>
        </Panel>
      )}

      <div style={{ display: "flex", gap: 8, margin: "16px 0" }}>
        {SORTS.map((k) => (
          <button key={k} className={`chip ${sort === k ? "active" : ""}`} onClick={() => setSort(k)}>{k}</button>
        ))}
      </div>
      <div className="grid cols-4">
        {sorted.map((m) => <Panel key={m.id}><PostRow m={m} full /></Panel>)}
      </div>
    </>
  );
}

function PostRow({ m, full = false }: { m: MediaItem; full?: boolean }) {
  const rate = engagementRate(m);
  return (
    <div style={{ padding: "6px 0" }}>
      <div className="meta-caps">{m.media_type} · {m.timestamp.slice(0, 10)}</div>
      <div style={{ fontSize: 13 }}>{(m.caption ?? "").slice(0, 60)}</div>
      <div className="meta-caps">
        ♥{m.like_count} 💬{m.comments_count} {full ? `· R${m.insights.reach ?? 0} · S${m.insights.saved ?? 0} · V${m.insights.views ?? 0}` : ""}
        <span className="chip" style={{ color: tierColor[tierFor(rate)], marginLeft: 8 }}>{rate.toFixed(1)}%</span>
      </div>
      {full && <a href={m.permalink} target="_blank" rel="noreferrer" className="meta-caps">OPEN ON IG</a>}
    </div>
  );
}
```

Replace the `♥`/`💬` glyphs with mono-caps labels (`L`, `C`) if they fight the type system visually — implementer's call during the design pass.

- [x] **Step 2: Verify against fixture-cached data, then commit**

To verify before real IG creds exist: copy `server/fixtures/ig/media.json`-derived items into `dashboard/data/ig-cache/media.json` as `{ "fetchedAt": <now>, "data": [ ...items with insights records...] }` so the cache path renders. All sections must render; reel watch cards appear only because fixture VIDEO has watch-time metrics.

```bash
git add dashboard/src/modules/analytics
git commit -m "feat(dashboard): full analytics module"
```

---

### Task 14: Competitor Tracker module

**Files:**
- Modify: `dashboard/src/modules/competitors/Competitors.tsx`

- [x] **Step 1: Implement.** Watchlist lives in `hooks-meta.json`? No — it gets its own key in local state. Use `sources.json`? Also no. **Decision: watchlist persists in `schedule.json`? No.** It needs its own file… but the allowlist is fixed by the spec to three files. **Resolution: the watchlist lives in `hooks-meta.json` under a separate top-level key `watchlist: string[]`** — the file is already the "user metadata" store, and the spec's allowlist stays intact. Document this in the file's shape: `{ hooks: {...}, watchlist: ["@growithalex"] }` (store.ts default stays `{ hooks: {} }`; treat a missing `watchlist` as `[]`).

Per-creator view: group `/api/repo/ingested` docs by `handle`; "unattributed" group for `handle === null`. New-since-last-visit: persist `lastVisit` epoch in `localStorage` (UI-only concern, not repo state); count docs with `mtimeMs > lastVisit`.

```tsx
import { useEffect, useMemo, useState } from "react";
import { useApi, useStateFile } from "../../lib/api";
import { Panel } from "../../components/Panel";
import { EmptyState } from "../../components/EmptyState";
import type { HooksMeta } from "../hooks/HookVault";

type Doc = { fileName: string; date: string | null; title: string; handle: string | null; sourceUrl: string | null; mtimeMs: number };

export function Competitors() {
  const ingested = useApi<Doc[]>("/api/repo/ingested");
  const meta = useStateFile<HooksMeta>("hooks-meta.json");
  const watchlist = meta.data?.watchlist ?? [];
  const [input, setInput] = useState("");
  const lastVisit = useMemo(() => Number(localStorage.getItem("competitors-last-visit") ?? 0), []);
  useEffect(() => { localStorage.setItem("competitors-last-visit", String(Date.now())); }, []);

  const groups = useMemo(() => {
    const map = new Map<string, Doc[]>();
    for (const d of ingested.data ?? []) {
      const k = d.handle ?? "unattributed";
      map.set(k, [...(map.get(k) ?? []), d]);
    }
    return map;
  }, [ingested.data]);

  const save = (next: string[]) => {
    if (meta.loading) return; // see HookVault: never write the shared file before it has loaded
    meta.save({ ...(meta.data ?? { hooks: {} }), watchlist: next });
  };
  const add = () => {
    const h = input.trim().startsWith("@") ? input.trim() : `@${input.trim()}`;
    if (h.length > 1 && !watchlist.includes(h)) save([...watchlist, h]);
    setInput("");
  };
  const queueIngest = () => {
    const url = window.prompt("Instagram post URL to ingest?");
    if (url) navigator.clipboard.writeText(`/ingest-post ${url}`);
  };

  const allHandles = [...new Set([...watchlist, ...groups.keys()])];

  return (
    <>
      <h1 className="page-title">Competitor Tracker</h1>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="@handle"
          onKeyDown={(e) => e.key === "Enter" && add()}
          style={{ background: "var(--panel)", border: "1px solid var(--hairline)", borderRadius: 999, padding: "8px 16px", color: "var(--fg)" }} />
        <button className="chip" onClick={add}>Watch</button>
        <button className="chip" onClick={queueIngest}>Queue ingest</button>
      </div>
      {allHandles.length === 0 && (
        <EmptyState title="NO CREATORS TRACKED" hint="Add a handle to the watchlist, then ingest their posts with /ingest-post." />
      )}
      {allHandles.map((h) => {
        const docs = (groups.get(h) ?? []).sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
        const fresh = docs.filter((d) => d.mtimeMs > lastVisit).length;
        return (
          <Panel key={h}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <strong>{h}</strong>
                <div className="meta-caps">
                  {docs.length} INGESTED {fresh > 0 ? `· ${fresh} NEW` : ""} {docs[0]?.date ? `· LAST ${docs[0].date}` : "· NEVER INGESTED"}
                </div>
              </div>
              {watchlist.includes(h) && (
                <button className="chip" onClick={() => save(watchlist.filter((w) => w !== h))}>Unwatch</button>
              )}
            </div>
            {docs.map((d) => (
              <div key={d.fileName} className="meta-caps" style={{ paddingTop: 6 }}>
                {d.date} · {d.title} {d.sourceUrl ? <a href={d.sourceUrl} target="_blank" rel="noreferrer">SOURCE</a> : null}
              </div>
            ))}
          </Panel>
        );
      })}
    </>
  );
}
```

- [x] **Step 2: Verify (real @growithalex docs group correctly; unattributed bucket appears), then commit**

```bash
git add dashboard/src/modules/competitors
git commit -m "feat(dashboard): competitor tracker over ingested docs"
```

---

### Task 15: Scheduler module

**Files:**
- Modify: `dashboard/src/modules/scheduler/Scheduler.tsx`

- [x] **Step 1: Implement.** Package picker = all `/api/repo/renders` (including `week 1`); queue rows persist to `schedule.json` via the tested `transition()`. Explicitly never publishes.

```tsx
import { useApi, useStateFile } from "../../lib/api";
import { Panel } from "../../components/Panel";
import { EmptyState } from "../../components/EmptyState";
import { transition, type ScheduleItem } from "../../lib/schedule";

type RenderPkg = { dirName: string; date: string | null; slug: string; hasCaption: boolean; hasReel: boolean };
const PLATFORMS = ["instagram", "tiktok", "linkedin"];

export function Scheduler() {
  const renders = useApi<RenderPkg[]>("/api/repo/renders");
  const schedule = useStateFile<{ items: ScheduleItem[] }>("schedule.json");
  const items = schedule.data?.items ?? [];

  const persist = (next: ScheduleItem[]) => {
    if (schedule.loading) return; // never write before the first GET resolves
    schedule.save({ items: next });
  };

  const queue = (pkg: RenderPkg) => {
    const date = window.prompt("Date (YYYY-MM-DD)?", pkg.date ?? "") ?? "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    const time = window.prompt("Time (HH:MM)?", "18:00") ?? "18:00";
    persist([...items, {
      id: `${pkg.dirName}-${Date.now()}`, renderDir: pkg.dirName,
      date, time, platforms: ["instagram"], status: "queued",
    }]);
  };
  const move = (id: string, to: "posted" | "skipped") =>
    persist(items.map((i) => (i.id === id ? transition(i, to) : i)));
  const togglePlatform = (id: string, p: string) =>
    persist(items.map((i) => i.id === id
      ? { ...i, platforms: i.platforms.includes(p) ? i.platforms.filter((x) => x !== p) : [...i.platforms, p] }
      : i));

  const unqueued = (renders.data ?? []).filter((r) => !items.some((i) => i.renderDir === r.dirName && i.status === "queued"));

  return (
    <>
      <h1 className="page-title">Scheduler</h1>
      <p className="meta-caps">PLANNING QUEUE ONLY. NOTHING HERE PUBLISHES ANYWHERE.</p>
      <Panel>
        <div className="meta-caps" style={{ marginBottom: 8 }}>RENDERED PACKAGES</div>
        {unqueued.length === 0 && <span className="meta-caps">ALL PACKAGES QUEUED OR NONE RENDERED.</span>}
        {unqueued.map((r) => (
          <div key={r.dirName} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
            <span>{r.dirName} {r.hasReel ? "· reel" : ""} {r.hasCaption ? "· caption" : ""}</span>
            <button className="chip" onClick={() => queue(r)}>Queue</button>
          </div>
        ))}
      </Panel>
      {items.length === 0
        ? <EmptyState title="QUEUE EMPTY" hint="Queue a rendered package above to plan its posting slot." />
        : items.map((i) => (
          <Panel key={i.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div>
                <strong>{i.renderDir}</strong>
                <div className="meta-caps">{i.date} {i.time} · {i.status.toUpperCase()}{i.postedAt ? ` AT ${i.postedAt.slice(0, 16)}` : ""}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {PLATFORMS.map((p) => (
                  <button key={p} className={`chip ${i.platforms.includes(p) ? "active" : ""}`}
                    onClick={() => togglePlatform(i.id, p)} disabled={i.status !== "queued"}>{p}</button>
                ))}
                {i.status === "queued" && <>
                  <button className="chip" onClick={() => move(i.id, "posted")}>Mark posted</button>
                  <button className="chip" onClick={() => move(i.id, "skipped")}>Skip</button>
                </>}
              </div>
            </div>
          </Panel>
        ))}
    </>
  );
}
```

- [x] **Step 2: Verify (queue → mark posted persists across reload; terminal states hide actions), then commit**

```bash
git add dashboard/src/modules/scheduler
git commit -m "feat(dashboard): scheduler planning queue with manual mark-posted"
```

---

### Task 16: Content Calendar module

**Files:**
- Modify: `dashboard/src/modules/calendar/Calendar.tsx`

- [x] **Step 1: Implement.** Month grid; slots from `schedule.json` items placed by `date` plus rendered packages placed by parsed folder date; `week 1` (null date) excluded from the grid per spec. Clicking a slot opens a side panel with caption, sources, slide thumbnails served by the Task 8 thumbnail route.

```tsx
import { useMemo, useState } from "react";
import { useApi } from "../../lib/api";
import { Panel } from "../../components/Panel";
import type { ScheduleItem } from "../../lib/schedule";

type RenderPkg = { dirName: string; date: string | null; slug: string; slides: string[] };

function monthDays(year: number, month: number): string[] {
  const out: string[] = [];
  const last = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= last; d++) out.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  return out;
}

export function CalendarView() {
  const renders = useApi<RenderPkg[]>("/api/repo/renders");
  const schedule = useApi<{ items: ScheduleItem[] }>("/api/state/schedule.json");
  const now = new Date();
  const [ym, setYm] = useState<[number, number]>([now.getFullYear(), now.getMonth()]);
  const [openDir, setOpenDir] = useState<string | null>(null);
  const caption = useApi<string>(openDir ? `/api/repo/renders/${encodeURIComponent(openDir)}/caption.txt` : "/api/health");
  const sources = useApi<string>(openDir ? `/api/repo/renders/${encodeURIComponent(openDir)}/sources.md` : "/api/health");

  const byDate = useMemo(() => {
    type Slot = { label: string; dir: string | null; kind: "queued" | "posted" | "rendered"; platform: string | null };
    const map = new Map<string, Slot[]>();
    for (const i of schedule.data?.items ?? []) {
      if (i.status === "skipped") continue;
      map.set(i.date, [...(map.get(i.date) ?? []), {
        label: i.renderDir, dir: i.renderDir,
        kind: i.status === "posted" ? "posted" : "queued",
        platform: i.platforms[0] ?? null,
      }]);
    }
    for (const r of renders.data ?? []) {
      if (!r.date) continue; // 'week 1' etc: no grid placement
      if ((map.get(r.date) ?? []).some((s) => s.dir === r.dirName)) continue;
      map.set(r.date, [...(map.get(r.date) ?? []), { label: r.slug, dir: r.dirName, kind: "rendered", platform: null }]);
    }
    return map;
  }, [schedule.data, renders.data]);

  // Platform-colored slot chips (spec): platform picks the hue, posted dims it, rendered-only is muted.
  const platformColor: Record<string, string> = {
    instagram: "var(--theme-purple-team)", tiktok: "var(--theme-hacking)", linkedin: "var(--theme-defensive)",
  };
  const slotColor = (s: { kind: string; platform: string | null }) =>
    s.kind === "rendered" ? "var(--muted)" : (platformColor[s.platform ?? ""] ?? "var(--accent)");
  const openPkg = (renders.data ?? []).find((r) => r.dirName === openDir);

  return (
    <>
      <h1 className="page-title">Content Calendar</h1>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button className="chip" onClick={() => setYm(([y, m]) => (m === 0 ? [y - 1, 11] : [y, m - 1]))}>Prev</button>
        <span className="meta-caps">{ym[0]}-{String(ym[1] + 1).padStart(2, "0")}</span>
        <button className="chip" onClick={() => setYm(([y, m]) => (m === 11 ? [y + 1, 0] : [y, m + 1]))}>Next</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
        {monthDays(ym[0], ym[1]).map((date) => (
          <Panel key={date} className="">
            <div className="meta-caps">{date.slice(8)}</div>
            {(byDate.get(date) ?? []).map((s, i) => (
              <button key={i} className="chip" style={{ color: slotColor(s), borderColor: slotColor(s), display: "block", marginTop: 4, opacity: s.kind === "posted" ? 0.6 : 1 }}
                onClick={() => s.dir && setOpenDir(s.dir)}>{s.label.slice(0, 18)}</button>
            ))}
          </Panel>
        ))}
      </div>
      {openDir && (
        <Panel className="" >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>{openDir}</strong>
            <button className="chip" onClick={() => setOpenDir(null)}>Close</button>
          </div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", margin: "12px 0" }}>
            {openPkg?.slides.map((f) => (
              <img key={f} src={`/api/repo/renders/${encodeURIComponent(openDir)}/slide/${encodeURIComponent(f)}`}
                style={{ height: 160, borderRadius: 8 }} alt={f} />
            ))}
          </div>
          <div className="meta-caps">CAPTION</div>
          {/* typeof guard is load-bearing: while closed, these hooks point at /api/health and
              data is an object; rendering it as a child would crash React on first slot click. */}
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>{typeof caption.data === "string" ? caption.data : ""}</pre>
          <div className="meta-caps">SOURCES</div>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>{typeof sources.data === "string" ? sources.data : ""}</pre>
        </Panel>
      )}
    </>
  );
}
```

Implementation note: the conditional `useApi` URL trick (pointing at `/api/health` when closed) keeps hook order stable; it's deliberate, not an accident — leave a comment in code.

- [x] **Step 2: Verify (June 2026 shows the real 2026-06-07 packages; `week 1` absent from grid but present in Scheduler picker; side panel shows real thumbnails + caption), then commit**

```bash
git add dashboard/src/modules/calendar
git commit -m "feat(dashboard): month calendar with package side panel"
```

---

### Task 17: What's Trending module

**Files:**
- Modify: `dashboard/src/modules/trending/Trending.tsx`

- [x] **Step 1: Implement.** Items from `/api/trends`; per-item tag hook/explainer/skip persisted in `sources.json`? No — tags are item-level, persisted under `hooks-meta.json` key `trendTags: Record<url, "hook" | "explainer" | "skip">` (same rationale as the watchlist; allowlist stays at three files). Dead sources flagged. "Hook this" copies `/draft-post <headline> | <pillar>`.

```tsx
import { useApi, useStateFile } from "../../lib/api";
import { Panel } from "../../components/Panel";
import { StalenessBanner } from "../../components/StalenessBanner";
import { EmptyState } from "../../components/EmptyState";
import { PILLARS, type HooksMeta } from "../hooks/HookVault"; // underscored pillar vocabulary, single source

type TrendItem = { title: string; url: string; publishedAt: number; sourceLabel: string };
type Trends = { items: TrendItem[]; deadSources: string[] };
type Tag = "hook" | "explainer" | "skip";

export function Trending() {
  const trends = useApi<Trends>("/api/trends");
  const meta = useStateFile<HooksMeta>("hooks-meta.json");
  const tags = meta.data?.trendTags ?? {};

  const setTag = (url: string, t: Tag) => {
    if (meta.loading) return; // see HookVault: never write the shared file before it has loaded
    meta.save({ ...(meta.data ?? { hooks: {} }), trendTags: { ...tags, [url]: t } });
  };
  const hookThis = (title: string) => {
    const pillar = window.prompt(`Pillar? (${PILLARS.join(" | ")})`, PILLARS[1]) ?? PILLARS[1];
    navigator.clipboard.writeText(`/draft-post ${title} | ${pillar}`);
  };

  const items = (trends.data?.items ?? []).filter((i) => tags[i.url] !== "skip");

  return (
    <>
      <h1 className="page-title">What's Trending</h1>
      <StalenessBanner label="TRENDS" error={trends.error} fetchedAt={trends.fetchedAt} />
      {(trends.data?.deadSources?.length ?? 0) > 0 && (
        <p className="meta-caps" style={{ color: "var(--danger)" }}>
          DEAD SOURCES: {trends.data!.deadSources.join(", ")}. EDIT data/sources.json TO FIX OR DISABLE.
        </p>
      )}
      {!trends.loading && items.length === 0 && (
        <EmptyState title="NO TRENDING ITEMS" hint="Enable sources in data/sources.json and press Refresh." />
      )}
      {items.map((i) => (
        <Panel key={i.url}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <div>
              <a href={i.url} target="_blank" rel="noreferrer">{i.title}</a>
              <div className="meta-caps">{i.sourceLabel} · {new Date(i.publishedAt).toISOString().slice(0, 10)}</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {(["hook", "explainer", "skip"] as Tag[]).map((t) => (
                <button key={t} className={`chip ${tags[i.url] === t ? "active" : ""}`} onClick={() => setTag(i.url, t)}>{t}</button>
              ))}
              <button className="chip" onClick={() => hookThis(i.title)}>Hook this</button>
            </div>
          </div>
        </Panel>
      ))}
    </>
  );
}
```

Auto-tagging is explicitly out of scope (spec); the tag buttons are manual only.

- [x] **Step 2: Verify with live feeds, then commit**

```bash
git add dashboard/src/modules/trending
git commit -m "feat(dashboard): trending feed reader with manual tagging"
```

---

### Task 18: Token refresh script + Windows Task Scheduler

**Files:**
- Create: `scripts/refresh_token.ts` (repo root `scripts/`, per spec)
- Create: `scripts/register_token_task.ps1`

- [x] **Step 1: Write the failing test for the pure part**

Add to `dashboard/server/store.test.ts`? No — this script is standalone. Create `scripts/refresh_token.test.ts` testing only `rewriteEnv` (the pure function):

```ts
import { describe, expect, test } from "bun:test";
import { rewriteEnv } from "./refresh_token";

describe("rewriteEnv", () => {
  test("replaces only IG_ACCESS_TOKEN, preserves everything else", () => {
    const env = "IG_APP_ID=123\nIG_ACCESS_TOKEN=old\nIG_USER_ID=456\n";
    expect(rewriteEnv(env, "newtok")).toBe("IG_APP_ID=123\nIG_ACCESS_TOKEN=newtok\nIG_USER_ID=456\n");
  });
  test("appends the key when missing", () => {
    expect(rewriteEnv("IG_APP_ID=123\n", "t")).toBe("IG_APP_ID=123\nIG_ACCESS_TOKEN=t\n");
  });
});
```

Run `bun test scripts/refresh_token.test.ts` from repo root → FAIL.

- [x] **Step 2: Implement refresh_token.ts**

```ts
import fs from "node:fs";
import path from "node:path";

const ENV_FILE = path.resolve(import.meta.dir, "..", "dashboard", ".env");
const LOG_FILE = path.resolve(import.meta.dir, "..", "dashboard", "token_refresh.log");

export function rewriteEnv(content: string, newToken: string): string {
  if (/^IG_ACCESS_TOKEN=.*$/m.test(content)) {
    return content.replace(/^IG_ACCESS_TOKEN=.*$/m, `IG_ACCESS_TOKEN=${newToken}`);
  }
  return content + `IG_ACCESS_TOKEN=${newToken}\n`;
}

function parseEnv(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

async function main() {
  const content = fs.readFileSync(ENV_FILE, "utf8");
  const env = parseEnv(content);
  // Long-lived token exchange (Facebook Login flow, walkthrough Step 1):
  const url = `https://graph.facebook.com/v23.0/oauth/access_token?grant_type=fb_exchange_token` +
    `&client_id=${env.IG_APP_ID}&client_secret=${env.IG_APP_SECRET}&fb_exchange_token=${env.IG_ACCESS_TOKEN}`;
  const res = await fetch(url);
  const body = await res.json();
  const stamp = new Date().toISOString();
  if (!res.ok || !body.access_token) {
    fs.appendFileSync(LOG_FILE, `${stamp} FAIL ${JSON.stringify(body?.error ?? body)}\n`);
    console.error("Token refresh failed. See dashboard/token_refresh.log.");
    process.exit(1);
  }
  fs.writeFileSync(ENV_FILE, rewriteEnv(content, body.access_token));
  fs.appendFileSync(LOG_FILE, `${stamp} OK expires_in=${body.expires_in ?? "n/a"}\n`);
  console.log("Token refreshed.");
}

if (import.meta.main) await main();
```

If Jon's app uses the newer "Instagram API with Instagram Login" instead, the endpoint is `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=<token>` — same script shape, swap the URL. Decide based on which setup Step 1 of the walkthrough actually produced; log which one in the commit message.

- [x] **Step 3: Run the test** — `bun test scripts/refresh_token.test.ts` → PASS.

- [x] **Step 4: Task Scheduler registration** (`scripts/register_token_task.ps1`):

```powershell
$action = New-ScheduledTaskAction -Execute "bun" `
  -Argument "scripts/refresh_token.ts" -WorkingDirectory "J:\projects\personal-projects\ai-ugc-pipeline"
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddDays(1) `
  -RepetitionInterval (New-TimeSpan -Days 58)
Register-ScheduledTask -TaskName "ai-ugc-ig-token-refresh" -Action $action -Trigger $trigger `
  -Description "Refresh the 60-day IG long-lived token every 58 days."
Write-Host "Registered. Verify with: Get-ScheduledTask -TaskName ai-ugc-ig-token-refresh"
```

Running the ps1 is a manual, user-approved step (it touches the OS scheduler) — the implementer creates the file and tells Jon to run it; do not execute it from the implementation session.

- [x] **Step 5: Commit**

```bash
git add scripts/refresh_token.ts scripts/refresh_token.test.ts scripts/register_token_task.ps1
git commit -m "feat(dashboard): token refresh script + Task Scheduler registration"
```

---

### Task 19: Playwright screenshot pass + final verification

**Files:**
- Create: `dashboard/e2e/screenshots.spec.ts`, `dashboard/playwright.config.ts`

- [x] **Step 1: Playwright config** (`dashboard/playwright.config.ts`):

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  use: { baseURL: "http://localhost:4410", viewport: { width: 1440, height: 900 } },
  webServer: [
    { command: "bun server/index.ts", port: 4400, reuseExistingServer: true },
    { command: "bunx vite", port: 4410, reuseExistingServer: true, env: { VITE_E2E: "1" } }, // hides the query devtools toggle in screenshots
  ],
});
```

- [x] **Step 2: Screenshot spec** (`dashboard/e2e/screenshots.spec.ts`):

```ts
import { test, expect } from "@playwright/test";

const MODULES = ["Overview", "Hook Vault", "Analytics", "Competitors", "Scheduler", "Calendar", "What's Trending"];

test("every module renders and screenshots", async ({ page }) => {
  await page.goto("/");
  for (const label of MODULES) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await page.waitForTimeout(600); // let useApi settle; cached data renders instantly
    await expect(page.locator(".main")).toBeVisible();
    await page.screenshot({ path: `e2e/shots/${label.toLowerCase().replace(/[^a-z]+/g, "-")}.png`, fullPage: true });
  }
});

test("analytics shows fixture-cached stats", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Analytics", exact: true }).click();
  await expect(page.locator(".page-title")).toContainText("Analytics");
});
```

Before running, seed `dashboard/data/ig-cache/` from the server fixtures so the pass exercises real rendering without live creds. Concretely, from `dashboard/`:

```bash
bun -e '
import fs from "node:fs";
import { parseInsights } from "./server/ig";
fs.mkdirSync("data/ig-cache", { recursive: true });
const account = JSON.parse(fs.readFileSync("server/fixtures/ig/account.json", "utf8"));
const media = JSON.parse(fs.readFileSync("server/fixtures/ig/media.json", "utf8"));
const vid = parseInsights(JSON.parse(fs.readFileSync("server/fixtures/ig/insights-video.json", "utf8")));
const img = parseInsights(JSON.parse(fs.readFileSync("server/fixtures/ig/insights-image.json", "utf8")));
const items = media.data.map((m) => ({ ...m, insights: m.media_type === "VIDEO" ? vid : img }));
fs.writeFileSync("data/ig-cache/account.json", JSON.stringify({ fetchedAt: Date.now(), data: account }));
fs.writeFileSync("data/ig-cache/media.json", JSON.stringify({ fetchedAt: Date.now(), data: items }));
console.log("seeded", items.length, "media items");
'
```

(The cache-first server then renders this without any live call — do NOT press Refresh during the e2e run.) Run: `cd dashboard && bunx playwright install chromium && bun run e2e`. Expected: PASS, 7 PNGs in `e2e/shots/` (already gitignored).

- [x] **Step 3: Full test suite**

Run: `cd dashboard && bun test server src`, then from REPO ROOT `bun test scripts` (bun test scans from cwd; running it from `dashboard/` would silently match nothing) — Expected: all green.

- [x] **Step 4: Final gate — verification-before-completion**

Use @verification-before-completion: with `bun run dash` running, walk every module against REAL repo data; confirm the six spec error-handling behaviors (cache-on-failure banner, token one-line fix, type-split prevention, empty states, dead-RSS flagging, `{data,error}` envelope). Confirm the dashboard wrote nothing outside `dashboard/data/` (`git status` shows no changes under `renderer/` or `pipeline/`).

- [x] **Step 5: Commit**

```bash
git add dashboard/e2e dashboard/playwright.config.ts dashboard/.gitignore
git commit -m "test(dashboard): playwright screenshot pass per module"
```

---

## Decisions made by this plan (so the implementer doesn't re-open them)

1. **State allowlist stays at three files.** Competitor watchlist (`watchlist`) and trend tags (`trendTags`) live as extra top-level keys in `hooks-meta.json` rather than new files.
2. **TanStack Query yes; TanStack Router and Table no.** Query (~13.6 KB gz) earns its place by deduplicating shared fetches (Shell + Overview both read `/api/ig/account`), replacing a homegrown refresh event bus with `invalidateQueries`, and replacing the hand-rolled optimistic-write paths (four modules across three state files) with one `useMutation` wrapper. Router is pointless for 7 `useState`-switched views with no URLs, and Table is headless overkill for ~50-row sorted lists that must use chron0s markup anyway. No other state library; charts are the `Bars` component (the spec demands custom minimal charts).
2a. **Two-cache convention:** server disk cache owns freshness (6h IG / 1h trends, `fetchedAt` in the envelope drives all staleness UI); the QueryClient is a 30s-staleTime dedupe layer with `refetchOnWindowFocus` off. Refresh paths always hit `?refresh=1` so the server cache is actually bypassed, never just the memory cache.
3. **React 19, matching the renderer's `^19.2.0`.** No 19-specific APIs are used; standard hooks only.
4. **`fetchWithCache` lives in `ig.ts` and is reused by `trends.ts`.** If a third consumer appears, extract to `cache.ts` — not before.
5. **Follower delta deferred:** the Graph API gives no follower history; Overview shows current count. Building a snapshot file is v2.
6. **Per-post insights fetched sequentially** (≤50 calls on manual refresh). No concurrency until it's actually slow.
7. **Thumbnails are served by the Bun server** from `pipeline/renders/` (read-only) with separator-rejecting path checks.
8. **Cache-first reads:** fresh disk cache (IG 6h, trends 1h) is served without touching upstream; only `?refresh=1` (the Refresh button / per-module reload) or staleness triggers a live fetch. Module switching never hits the Graph API.
9. **Pillar vocabulary is underscored** (`model_security`, …), matching `DRAFT_POST_REFERENCE.md` and the posts JSON `pillar` field; `PILLARS` is exported once from HookVault.
10. **`week 