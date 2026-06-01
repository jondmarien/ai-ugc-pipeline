# Open-AI-UGC Evaluation Notes

Repository: https://github.com/Anil-matcha/Open-AI-UGC

## What it claims to be

Open-AI-UGC describes itself as a free/open-source alternative to Arcads and MakeUGC for generating AI UGC video ads. It presents a Next.js studio that can generate 9:16 vertical UGC ads using MUAPI-backed video models, including Grok Video, Veo 3.1, Seedance 2, and Happy Horse 1. It advertises image-to-video and text-to-video workflows, reference image uploads, async generation, credits, Stripe billing, Google sign-in, Prisma/Postgres persistence, and a SaaS-style dashboard.

## What the repository metadata shows

GitHub CLI metadata reports 94 stars, 15 forks, default branch `main`, and no license detected (`licenseInfo: null`). The repo is public and was updated on 2026-06-01. The package manifest describes it as private Next.js app using Next 16.2.3, React 19.2.4, Prisma, NextAuth, Stripe, Framer Motion, and Postgres.

## Important implementation caveats

The repo depends on external services. The `.env.example` requires Postgres, NextAuth, Google OAuth, Stripe, and a `UGC_API_KEY` plus `WEBHOOK_URL`, implying it is not a fully local open-source generation model. It is best understood as a self-hostable interface/orchestration layer for paid or metered video APIs, especially MUAPI.

A local shallow clone showed only a small set of source files under `src/`, including `src/app/page.js`, but no `src/app/api/*` routes were present in the checked files despite the README describing `/api/generate`, `/api/upload`, `/api/creations`, and webhooks. The UI code references `/api/upload`, `/api/generate`, and `/api/creations/[id]`, but those server routes were not visible in the cloned source tree. This means the repo may be incomplete, recently rewritten, or the README may be ahead of the actual implementation.

## Fit for Jon's pipeline

Open-AI-UGC should be included as a candidate tool in the Claude addendum, but not as a primary dependency. It is useful for Claude to understand because it represents the kind of UGC generation studio Jon might eventually want: script input, reference image upload, model selection, async jobs, history, and credit tracking. However, it should be treated as an evaluation target or possible UI scaffold, not a plug-and-play open-source replacement for Higgsfield/Arcads/MakeUGC.

## Recommendation

Include it in the Claude addendum with the following positioning:

1. Use it as a possible self-hosted UGC studio scaffold.
2. Do not assume it eliminates generation costs because it calls MUAPI-backed models.
3. Do not assume it is production-ready without verifying missing API routes, license terms, deployment, webhook behavior, storage, auth, security, and billing.
4. If Claude builds a pipeline, it should first evaluate whether Open-AI-UGC can be run locally, whether the API routes exist or need to be implemented, and whether replacing MUAPI with open-source video/TTS models is realistic.
5. For Jon's immediate manual-first content production pipeline, Open-AI-UGC is optional and lower priority than TTS testing, asset templates, CapCut/Canva assembly, and manual publishing.
