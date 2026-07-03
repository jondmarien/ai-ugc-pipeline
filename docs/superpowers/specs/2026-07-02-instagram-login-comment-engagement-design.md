# Design Spec: Instagram Login (Business Login for Instagram) for Comment Engagement — ABANDONED

**Date**: 2026-07-02
**Status**: **Abandoned and reverted (2026-07-02).** The feature this spec targeted (comment like/unlike) shipped a different, much simpler way — see the final correction below. This document and its implementation plan are kept for the audit trail only; do not build against them.
**Related**: dashboard Comments moderation panel (`dashboard/server/comments.ts`, `dashboard/src/modules/comments/Comments.tsx`), existing Facebook Login flow (`renderer/scripts/publish/auth/meta.ts`)

> **Correction #1 (2026-07-02):** this spec originally claimed Instagram Login needs a separate Instagram App ID/Secret from a second app registration. A research pass (Perplexity + Meta's app-creation guide) said that was wrong and that Meta apps share one App ID/Secret across all products — so the implementation was changed to reuse `META_APP_ID`/`META_APP_SECRET`.
>
> **Correction #2, final (2026-07-02):** Correction #1 was also wrong. The user's actual Meta App Dashboard (screenshots, ground truth) showed a genuinely distinct Instagram App ID/Secret under "API setup with Instagram login," and using the Meta App ID there failed live with `Invalid platform app`. **But the deeper problem was upstream of both corrections**: `instagram_business_manage_engagement` — the scope this whole Instagram Login flow existed to request — **is not a real Meta permission**. It was fabricated by pattern-matching the `instagram_business_` prefix without checking Meta's actual reference docs. The real requirement, per Meta's [Like a Media or Comment reference](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/user-likes) (filed under the classic Instagram Graph API, not Instagram Login): `POST/DELETE graph.facebook.com/v25.0/{ig-user-id}/likes` needs only `instagram_basic` + `instagram_manage_engagement` (no `business_` prefix) — scopes the existing Facebook Login **Page token already qualifies for**. **The entire premise of this spec — that like/unlike needs a second OAuth system — was wrong from the start.** The fix that shipped: add `instagram_manage_engagement` to `renderer/scripts/publish/auth/meta.ts`'s existing `scopes` array, re-run `bun run publish:auth meta`, and call the endpoint with the existing Page token. `instagram_login.ts`, `instagram_auth.ts`, and the `publish:auth instagram(-login)` CLI branch were all deleted. Lesson: verify a scope name actually exists in Meta's reference docs before designing an entire architecture around it, and prefer checking the target platform's own dashboard (ground truth) over a general web-search pass when they conflict.

## 1. Problem Statement & Goals

The dashboard's Comments panel currently supports list/hide/delete/reply using the existing Facebook Login for Business Page access token (`renderer/.secrets/meta.json`). Liking/unliking a comment (`POST/DELETE /{ig-user-id}/likes`) is NOT implemented, because that endpoint requires an **Instagram User access token** minted via a structurally different OAuth flow — Instagram Login / Business Login for Instagram — not the Facebook Login Page token this app is built on.

**Goal**: Add a second, parallel auth flow (Instagram Login) so the dashboard can also call IG User-token-only endpoints, starting with like/unlike on comments, without disturbing the existing Facebook Login flow that publishing/insights/comment-moderation already depend on.

**Non-goals**:
- No changes to the existing Facebook Login flow, its scopes, or its token file.
- No migration of publishing/insights/comment-moderation onto the new token — those stay on the Page token.
- No messaging/DM features in this pass (instagram_business_manage_messages), even though the same Instagram Login flow would unlock them — separate future spec if wanted.

## 2. Why Two Separate Systems (Confirmed via Meta docs)

| | Facebook Login (existing) | Instagram Login (new) |
|---|---|---|
| Authorize URL | `facebook.com/v25.0/dialog/oauth` | `instagram.com/oauth/authorize` |
| Token exchange | `graph.facebook.com/oauth/access_token` | `api.instagram.com/oauth/access_token` |
| Long-lived exchange | Facebook's standard `fb_exchange_token` | `graph.instagram.com/access_token?grant_type=ig_exchange_token` |
| Refresh | not time-based; liveness checked via `/debug_token` | `ig_refresh_token` cycle (60-day token, refreshable) |
| Call host | `graph.facebook.com` | `graph.instagram.com` |
| Credentials | `META_APP_ID`/`META_APP_SECRET` (Facebook App) | a **separate Instagram App ID/Secret**, configured under the "Instagram" product tab of the same Meta App dashboard |
| Token type | Page access token | Instagram User access token |
| Scope names | `instagram_content_publish`, `instagram_manage_comments`, `instagram_manage_insights`, ... | differently-named twins: `instagram_business_content_publish`, `instagram_business_manage_comments`, `instagram_business_manage_engagement`, `instagram_business_manage_insights`, ... |

Both flows can target the *same* underlying IG Business account (ours is Page-linked, so either works), but they are not mergeable — "combining tokens" in practice means storing both credential sets side by side and routing each API call to whichever token/host it actually needs.

## 3. Proposed Architecture

- New file `renderer/scripts/publish/auth/instagram_login.ts`, modeled on `meta.ts`'s structure (constants, `scopes`, token exchange, secrets read/write) but pointed at the Instagram Login endpoints/hosts above.
- New CLI entry: `bun run publish:auth instagram` (extends `renderer/scripts/publish/auth/cli.mjs`'s existing `meta`/`youtube`/`tiktok` dispatch).
- New secrets file: `renderer/.secrets/instagram.json` (gitignored, same pattern as `meta.json`) holding `{ access_token, ig_user_id, expires_at }`.
- New env vars: `INSTAGRAM_APP_ID` / `INSTAGRAM_APP_SECRET` in `renderer/.env` (a second app registration under the same Meta App, per Instagram's product setup docs).
- `dashboard/server/comments.ts`: reintroduce `likeComment`/`unlikeComment`, reading from the new `instagram.json` store via a new `dashboard/server/instagram_auth.ts` (mirrors `meta_auth.ts`'s `readMetaStore`/`requireMetaStore` pattern), calling `graph.instagram.com` instead of `graph.facebook.com`.
- `dashboard/src/modules/comments/Comments.tsx`: reinstate Like/Unlike buttons; if `instagram.json` isn't present, disable those two buttons with a tooltip ("run `bun run publish:auth instagram`") rather than failing at click time — the panel must degrade gracefully when only the Facebook Login token exists.
- Scopes requested: `instagram_business_basic`, `instagram_business_manage_engagement` (minimum for likes). Not requesting `instagram_business_manage_comments`/`_content_publish`/`_manage_messages` in this pass since those responsibilities stay on the Page token.

## 4. Refresh & Liveness

Unlike the Page token (checked via `/debug_token`, doesn't rotate on a timer), the Instagram Login token is a genuine 60-day long-lived token requiring periodic refresh via `GET graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token`. Needs either:
- a manual reminder path (mirrors the dashboard's existing `TOKEN {ageDays}D OLD` sidebar indicator, extended to a second token), or
- a scheduled refresh script, similar in spirit to `renderer/scripts/refresh_token.ts` (used for another platform's token today) — needs checking whether that script is YouTube-specific or generic before deciding.

## 5. Risks / Open Questions

- Requires setting up a second app registration (Instagram App ID/Secret) in the Meta Developer dashboard before any code can be tested — a manual one-time step outside this repo.
- Two secrets files, two refresh cadences, two liveness checks adds real ongoing maintenance surface for a single-owner tool, for the sake of one button (like/unlike a comment).
- If Meta's Instagram Login flow requires **App Review** for `instagram_business_manage_engagement` (unclear pre-research; needs confirming against current dashboard "Ready for testing" vs "Live" status, same as the username-field gating already hit in the Comments panel), the feature may be blocked on review regardless of implementation.
- Worth re-confirming scope names/endpoints against current Meta docs at implementation time — Meta's Instagram Platform docs have changed shape multiple times in this project's history already (v23 → v25 Graph API bump alone).

## 6. Scope & Deliverables (once approved)

**In scope**:
- `renderer/scripts/publish/auth/instagram_login.ts` + CLI wiring
- `renderer/.secrets/instagram.json` (gitignored)
- `dashboard/server/instagram_auth.ts`
- `dashboard/server/comments.ts`: `likeComment`/`unlikeComment` restored
- `dashboard/src/modules/comments/Comments.tsx`: Like/Unlike buttons restored, gracefully disabled when the token is absent
- `CLAUDE.md` + `docs/publishing/PUBLISHING.md` updates documenting the second auth flow

**Out of scope**: messaging/DM features, migrating any existing Page-token functionality, App Review submission itself (separate manual process, same as YouTube/TikTok audits already documented).

## 7. Next Steps

This spec is for review only. On approval: write an implementation plan (file-by-file diff plan + test plan), get that approved, then execute.
