# Instagram Login (Business Login for Instagram) — Implementation Plan — ABANDONED

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**ABANDONED (2026-07-02) — do not implement anything below.** The premise (comment like/unlike needs a second OAuth flow) was wrong. `/{ig-user-id}/likes` works on the existing Facebook Login Page token with the `instagram_manage_engagement` scope added — see the final correction note in `docs/superpowers/specs/2026-07-02-instagram-login-comment-engagement-design.md`. Everything this plan built (`instagram_login.ts`, `instagram_auth.ts`, the `publish:auth instagram` CLI branch) was deleted. Kept below for the audit trail only.

**Original goal (superseded):** Add a second, parallel OAuth flow (Instagram Login) so the dashboard's Comments panel can like/unlike comments — an endpoint (`/{ig-user-id}/likes`) that was believed to require an Instagram User access token, which the existing Facebook Login Page-token flow supposedly could not provide. That belief was wrong.

**Spec:** `docs/superpowers/specs/2026-07-02-instagram-login-comment-engagement-design.md` — read it first, especially its final correction note.

**Manual prerequisite (outside this repo, blocks Task 9 testing):** if the Instagram product / "API setup with Instagram login" tab isn't already present on the existing Meta App, add it, then register `http://localhost:8788/callback` as its redirect URI and add yourself as a tester under "Generate access tokens." No new App ID/Secret to obtain — see the correction above.

---

## Verified facts the implementer must not re-litigate

Checked against the repo and Meta's Instagram Platform docs on 2026-07-02:

- **`renderer/scripts/publish/auth/cli.mjs`** dispatches `bun run publish:auth <youtube|tiktok|meta>` via `PLATFORM_ENV` (line ~48) and a `platform === "..."` chain (line ~599). Adding `instagram-login` means: add it to the allowed-platforms array (line ~38), add `PLATFORM_ENV.instagram-login = ["INSTAGRAM_APP_ID", "INSTAGRAM_APP_SECRET"]`, add a `runInstagramLogin()` function (model on `runMeta()`, lines 356+), add a dispatch branch.
- **`runMeta()`'s shape**: builds an authorize URL with `URLSearchParams`, opens it via `tryOpenBrowser`, spins up a one-shot `Bun.serve` loopback callback server on port 8788, exchanges the code, and writes `renderer/.secrets/meta.json` via `writeSecrets()`. Reuse `tryOpenBrowser`, `writeSecrets`, `PORT`, `REDIRECT_URI` as-is; do NOT duplicate them.
- **Endpoints for the new flow** (confirmed via Meta docs, differ from Facebook Login's):
  - Authorize: `GET https://www.instagram.com/oauth/authorize?client_id=<IG_APP_ID>&redirect_uri=...&response_type=code&scope=instagram_business_basic,instagram_business_manage_engagement`
  - Code exchange (short-lived): `POST https://api.instagram.com/oauth/access_token` (form-encoded: `client_id`, `client_secret`, `grant_type=authorization_code`, `redirect_uri`, `code`) → `{ data: [{ access_token, user_id, permissions }] }` — note the response is wrapped in a `data` array, unlike Facebook Login's flat JSON.
  - Long-lived exchange: `GET https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=<SECRET>&access_token=<SHORT_LIVED>` → `{ access_token, token_type, expires_in }` (60 days).
  - Refresh (future use, not required for this pass to function once): `GET https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=<CURRENT>`.
  - Like/unlike call site (already drafted, was removed in the previous session — see git history on `dashboard/server/comments.ts` around commit `99e3087`): `POST/DELETE https://graph.instagram.com/v25.0/<IG_USER_ID>/likes?comment_id=<ID>&access_token=<IG_USER_TOKEN>`. **Host is `graph.instagram.com`, not `graph.facebook.com`** — this is the actual fix; the old attempt failed because it reused the Page token against the wrong token *type*, not because of a wrong host, but using the correct host + token together is what Meta's docs specify.
- **`scripts/refresh_token.ts`** (repo root) is UNRELATED legacy code for the old manual `dashboard/.env IG_ACCESS_TOKEN` scheme (pre-dates `meta.ts`'s OAuth flow, still pinned to Graph API v23.0). Do not extend it or model the new refresh cadence on it — it's a dead-end pattern being phased out, not a generic refresh utility.
- **`dashboard/server/meta_auth.ts`** is the pattern to mirror for the new `dashboard/server/instagram_auth.ts`: `readMetaStore()`/`requireMetaStore()` reading a JSON secrets file, `NoMetaCredentialsError` for "not set up yet" vs a real API failure, `appSecretProof` — but note the Instagram Login token likely does NOT need `appsecret_proof` (that's specifically a Page/User-token-via-Facebook-Login requirement tied to the Facebook App's "Require app secret" setting); confirm this against Meta's docs during implementation rather than assuming either way, and cover it with a comment either way.
- **Comments panel currently degrades gracefully** by design (`dashboard/src/modules/comments/Comments.tsx`, `EmptyState` on `comments.error`) — the new Like/Unlike buttons must follow the same pattern: check for `instagram.json` presence server-side and return a clear, actionable error (not a stack trace) when absent, mirroring `NoMetaCredentialsError`'s message style ("run `bun run publish:auth meta` first").

## File structure (diff plan)

```
renderer/
  .env.example                          MODIFY: add INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET
  scripts/publish/auth/
    cli.mjs                             MODIFY: add "instagram-login" to allowed platforms,
                                         PLATFORM_ENV entry, runInstagramLogin(), dispatch branch
    instagram_login.ts                  NEW: scopes[], exchangeLongLivedToken(), GRAPH_BASE
                                         (graph.instagram.com), mirrors meta.ts's shape but for
                                         the Instagram Login token lifecycle (no Page/IG-account
                                         resolution step needed — the token IS the IG user token)
  .secrets/
    instagram.json                      NEW at runtime (gitignored already via .secrets/ pattern
                                         — confirm .gitignore covers the whole dir, not just meta.json)
dashboard/
  server/
    instagram_auth.ts                   NEW: readInstagramStore()/requireInstagramStore(),
                                         mirrors meta_auth.ts
    comments.ts                         MODIFY: reintroduce likeComment/unlikeComment using
                                         graph.instagram.com + the Instagram Login token;
                                         GET/hide/delete/reply UNCHANGED (still Page token)
    index.ts                            MODIFY: reinstate POST/DELETE /api/comments/:id/like routes
  src/modules/comments/
    Comments.tsx                        MODIFY: reinstate Like/Unlike buttons; disable + tooltip
                                         when the like endpoints return "not set up" rather than
                                         a generic ACTION FAILED banner
CLAUDE.md                               MODIFY: document the second auth flow + its own scope list
docs/publishing/PUBLISHING.md           MODIFY: add a section for instagram-login auth, parallel
                                         to the existing meta/youtube/tiktok sections
```

## Tasks

- [x] **Task 1 — `renderer/scripts/publish/auth/instagram_login.ts`**: scopes array (`instagram_business_basic`, `instagram_business_manage_engagement`), `TOKEN_HOST`/`AUTHORIZE_BASE` for `graph.instagram.com`/`instagram.com`, `exchangeCodeForToken`/`exchangeLongLivedToken`/`fetchIgUserId` per the verified endpoints, `isRecentlyVerified`. 5 unit tests (`instagram_login.test.ts`), covering both documented response shapes + the host-fallback path.
- [x] **Task 2 — `renderer/scripts/publish/auth/cli.mjs` wiring**: `"instagram"` (renamed from the originally planned `"instagram-login"`) added to the allowed-platform list, `PLATFORM_ENV.instagram` (reuses `META_APP_ID`/`META_APP_SECRET` — see correction note above, not new vars), `runInstagramLogin()` modeled on `runMeta()`. Writes `renderer/.secrets/instagram.json` via the existing `writeSecrets()` helper.
- [x] **Task 3 — `renderer/.env.example`**: SKIPPED — no new env vars needed (reuses `META_APP_ID`/`META_APP_SECRET`, see correction note above). Also: sandbox policy blocks editing `.env*` files directly regardless.
- [x] **Task 4 — `dashboard/server/instagram_auth.ts`**: `readInstagramStore()`/`requireInstagramStore()` mirroring `meta_auth.ts`, throwing a distinct `NoInstagramCredentialsError` with the message "run `bun run publish:auth instagram` in renderer/ first".
- [x] **Task 5 — `dashboard/server/comments.ts`**: reintroduced `likeComment(commentId)`/`unlikeComment(commentId)` calling `graph.instagram.com` with the Instagram Login token (via Task 4's store). Confirmed live (see Task 9) that the route returns the actionable "not set up" error correctly when the token doesn't exist yet.
- [x] **Task 6 — `dashboard/server/index.ts`**: reinstated the `/api/comments/:id/like` POST/DELETE routes.
- [x] **Task 7 — `dashboard/src/modules/comments/Comments.tsx`**: reinstated Like/Unlike buttons; on the "not set up" error, both buttons disable with a tooltip instead of repeating the generic `ACTION FAILED` banner.
- [x] **Task 8 — Docs**: `CLAUDE.md` and `docs/publishing/PUBLISHING.md` updated, including the post-implementation correction that this reuses the existing Meta app/credentials rather than needing a second app.
- [ ] **Task 9 — Verification**: confirmed the dashboard starts cleanly and the like route returns the correct "not set up" error pre-auth. **Still pending**: run `bun run publish:auth instagram` (after adding the Instagram product's redirect URI + tester per the corrected prerequisite above) and confirm a real Like/Unlike round-trip against a live comment — blocked on the user completing that one-time App Dashboard step.

## Out of scope (per spec)

Messaging/DM features (`instagram_business_manage_messages`), migrating publishing/insights/comment-moderation onto the new token, and the App Review submission process itself.
