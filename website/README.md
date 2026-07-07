<div align="center">

# 🌐 website/

### [aiugc.chron0.tech](https://aiugc.chron0.tech) — the landing site, plus the quiet IG-publishing infra that has to stay up

Vite · React 19 · TypeScript · Tailwind v4 · three.js (react-three-fiber) · GSAP · Vercel

[Quick start](#-quick-start) · [Routes](#-routes) · [The hero](#-the-threejs-hero) · [Publish-temp API](#-the-publish-temp-api-load-bearing) · [Deploy](#-deploy-vercel)

</div>

---

Two jobs live in this one small app:

1. **The marketing site** for *Chrono's Cyber World of AI* — a cinematic dark "quiet command center" landing page introducing the brand (*real threats, real tools, no fake panic*), plus the `/terms` and `/privacy` pages required by the TikTok/YouTube/Meta app applications.
2. **The Instagram publishing relay.** `api/publish-temp.ts` and `api/publish-temp-delete.ts` are Vercel serverless functions that give the renderer's Instagram adapter a public HTTPS URL — because Instagram's Graph API *fetches* a `video_url` instead of accepting byte uploads. **If this site is down or misconfigured, Instagram publishing breaks even though the renderer is fine.** YouTube/TikTok are unaffected.

## ⚡ Quick start

```bash
cd website
bun install            # Bun only — never npm
bun run dev            # http://localhost:4319
bun run build          # type-check + production build → dist/
bun run preview        # serve the production build (smoother than dev)
```

## 🗺️ Routes

| Route | Page | Content |
| --- | --- | --- |
| `/` | `pages/Home.tsx` | `Nav → Hero → Thesis → Pillars → Pipeline → Story → CTA → Footer` — one component per section in `src/sections/`, copy centralized in `src/lib/content.ts`. Pillars mirrors the renderer's five `theme=` colours; Story introduces Jon ("chrono"). |
| `/terms` · `/privacy` | `pages/Legal.tsx` | Structured legal content from `src/lib/legal.ts` (source markdown in [`../docs/publishing/legal/`](../docs/publishing/legal/)). |
| `*` | fallback → Home | `vercel.json` rewrites everything to `index.html` so the client-side router owns routing. |

`@vercel/analytics` is mounted at the app root.

## ✨ The three.js hero

`src/three/HeroCanvas.tsx` is a custom `SignalField`: ~2,800 points (1,200 on mobile) on a golden-angle Fibonacci sphere, coloured through a 5-stop gradient matching the brand themes, with custom GLSL shaders doing the twinkle and glow (no post-processing bloom pass). Performance notes:

- A hand-rolled `FpsGuard` drops the pixel ratio if FPS sustains below 45 (avoids pulling in the whole `drei` barrel).
- Pointer-reactive rotation, disabled under `prefers-reduced-motion`.
- An `IntersectionObserver` pauses the `frameloop` when scrolled out of view.
- `lazy()` code-splitting keeps the three.js bundle off the first paint.

## 🔌 The publish-temp API (load-bearing)

```mermaid
sequenceDiagram
    autonumber
    participant R as renderer (Instagram adapter)
    participant W as /api/publish-temp
    participant B as Vercel Blob
    participant M as Meta Graph API

    R->>W: POST raw reel bytes — Authorization: Bearer PUBLISH_TEMP_SECRET
    W->>B: put("publish-temp/<ts>-<name>", public, video/mp4, random suffix)
    B-->>R: { url, pathname }
    R->>M: create media container (video_url = url, is_ai_generated = true)
    M->>B: fetches the video
    M-->>R: container FINISHED → publish
    R->>W: POST /api/publish-temp-delete { pathname }
    W->>B: del()   — best-effort; a failed delete leaves an orphaned blob, not a broken publish
```

- **Auth** is a shared-secret handshake, not end-user auth: both functions 401 unless `Authorization: Bearer ${PUBLISH_TEMP_SECRET}` matches. **The same secret must be set in `renderer/.env` and in this Vercel project's env.**
- `publish-temp.ts` reads the raw body itself (`bodyParser: false` — it receives video bytes, not JSON).
- Intentionally minimal: no rate limiting, no upload ledger; correctness relies on the caller's cleanup plus timestamped, random-suffixed paths.
- Caller side: `renderer/scripts/publish/adapters/lib/temp-hosting.ts` (`PUBLISH_TEMP_HOST` overrides the host for testing).

## 🚀 Deploy (Vercel)

| Setting | Value |
| --- | --- |
| **Root Directory** | **`website`** — the repo root is *not* the site |
| Framework preset | Vite |
| Build / output | `vite build` → `dist` |
| Install | bun (`bun.lock` present) |
| Rewrites | `vercel.json`: `/(.*)` → `/index.html` (so `/terms` and `/privacy` resolve client-side) |
| Domain | `aiugc.chron0.tech` |
| Env | `PUBLISH_TEMP_SECRET` (must match `renderer/.env`) · Vercel Blob store connected |
