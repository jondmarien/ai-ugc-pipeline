# aiugc.chron0.tech — landing site

The official website for **Chrono's Cyber World of AI**. A cinematic, dark
"quiet command center" landing page that introduces the brand (real threats,
real tools, no fake panic) and hosts the `/terms` and `/privacy` pages used by
the TikTok / YouTube / social app applications.

## Stack

Vite + React + TypeScript + Tailwind v4, with a three.js hero (react-three-fiber)
and GSAP for the load + scroll motion. **Bun only — never npm.**

## Develop

```bash
cd website
bun install
bun run dev        # http://localhost:4319
```

## Build / preview

```bash
bun run build      # type-check + production build → dist/
bun run preview    # serve the production build (smoother than dev)
```

## Deploy (Vercel)

- **Root Directory: `website`** (the repo root is not the site).
- Framework preset: **Vite** · build `vite build` · output `dist` · install via bun (`bun.lock` present).
- `vercel.json` rewrites all routes to `index.html` so `/terms` and `/privacy`
  resolve under the client-side router.
- Domain: `aiugc.chron0.tech`.

## Routes

- `/` — landing page (hero, thesis, coverage pillars, pipeline, story, CTA)
- `/terms` — Terms of Service
- `/privacy` — Privacy Policy

Content lives in `src/lib/content.ts` (brand copy) and `src/lib/legal.ts` (legal pages).
