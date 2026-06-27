# Publishing Architecture

How a rendered post's `reel.mp4` gets published to **YouTube Shorts** and **TikTok** — gated, idempotent, single-operator. **Instagram is a manual checklist** (no Meta API access). For the system-wide view see [PROJECT_ARCHITECTURE.md](./PROJECT_ARCHITECTURE.md); for the render engine that produces the reel see [PIPELINE_ARCHITECTURE.md](./PIPELINE_ARCHITECTURE.md); for operator setup (create the apps, env, auth, audits) see [../../docs/publishing/PUBLISHING.md](../../docs/publishing/PUBLISHING.md).

**Positioning:** a human approves before anything ships. Publishing never runs silently and never posts a `draft`.

---

## 1. The adapter contract

Every platform implements one small interface (`renderer/scripts/publish/types.ts`), so the orchestrator treats YouTube, TikTok, and Instagram uniformly.

```ts
RenderPackage  { key, dir, reelPath, post: { post_id, caption, hashtags, … } }
AdapterResult  { platform, kind: "api"|"manual", status: "published"|"manual"|"failed", id?, url?, privacy?, message?, error? }
PlatformAdapter{ name, kind, publish(pkg, { dryRun }): Promise<AdapterResult> }
```

Adapters are built by **dependency-injection factories** (`makeYoutubeAdapter(deps)`, `makeTiktokAdapter(deps)`) whose deps wrap config, token minting, `fetch`, and file reads. That lets every adapter be **fixture-tested with no live credentials** — the network is injected. The default exports (`youtubeAdapter`, `tiktokAdapter`, `instagramAdapter`) wire the real implementations.

---

## 2. Component inventory

| Component | File | Responsibility |
|---|---|---|
| **Adapter contract** | `publish/types.ts` | `RenderPackage`, `AdapterResult`, `PlatformAdapter` interface. |
| **Config** | `publish/config.ts` | Load + zod-validate `publish.config.json` (per-platform enabled/privacy/interaction). |
| **Metadata mapper** | `publish/metadata.ts` | Pure post → per-platform payload (YouTube `snippet`/`status`, TikTok `post_info`); title truncation, hashtags, `#Shorts`. |
| **Publish state** | `publish/state.ts` | Read/write `pipeline/renders/<key>/publish.state.json`; `shouldSkip()` idempotency. |
| **OAuth / token** | `publish/auth/oauth.ts` | `getAccessToken(platform)` — reads the stored token, refreshes if stale (<60 s), persists. Pure `accessTokenIsFresh` / `mergeToken`. |
| **Auth config** | `publish/auth/youtube.ts`, `tiktok.ts` | Per-platform token endpoint, scopes, refresh-body builder. |
| **Auth CLI** | `publish/auth/cli.mjs` | `bun run publish:auth <platform>` — one-time interactive OAuth (loopback `:8788`). |
| **YouTube adapter** | `publish/adapters/youtube.ts` | `videos.insert` via the raw **resumable REST** flow (init session → PUT bytes). |
| **TikTok adapter** | `publish/adapters/tiktok.ts` | Direct Post: `creator_info` → privacy → `video/init` → PUT chunk → poll status. |
| **Instagram adapter** | `publish/adapters/instagram.ts` | Manual: returns a paste-ready upload checklist; no network. |
| **Orchestrator** | `publish/run.ts` | `planPublish()` (pure gate/skip decision) + `runPublish()` (resolve → plan → run adapters → record → flip status). |
| **CLI entry** | `publish.mjs` | Thin argv parser → `runPublish` (`--platforms --dry-run --force --yes`). |
| **Fixtures** | `publish/fixtures/*.json` | Canned API responses for the adapter tests. |

---

## 3. The gate and lifecycle

Publishing is the terminal transition of the post lifecycle `draft → approved → generated → upload_ready`.

- **Only a `generated` post may publish.** `generated` means *approved AND rendered* (`bun run pipeline` flips `approved → generated` after a successful render), so it is the only status that actually has a reel on disk. `draft` and unrendered `approved` are rejected by `planPublish()` with a "render it first" message.
- **`--force` does not bypass the gate.** It only re-publishes a platform already marked `published` in state; it never lifts the `generated` requirement.
- On success across every requested platform, the post flips **`generated → upload_ready`** (`setStatus(key, "upload_ready", { onlyFrom: ["generated"] })`). A partial failure leaves the status untouched so a re-run can finish the rest.

```mermaid
stateDiagram-v2
    direction LR
    draft --> approved : QA gates pass [human]
    approved --> generated : rendered [pipeline]
    generated --> upload_ready : published to all requested platforms [code]
    note right of generated
        publish gate: status MUST be generated.
        --force never bypasses this
    end note
```

---

## 4. OAuth / token lifecycle

One-time, local, single-operator. Tokens live in gitignored `renderer/.secrets/<platform>.json` (`{ refresh_token, access_token?, expires_at? }`).

- **`publish:auth`** starts a loopback server on `http://localhost:8788/callback`, opens the consent URL, captures the `code`, and exchanges it for tokens.
  - **YouTube** uses `google-auth-library`'s OAuth2 client (Desktop, offline access).
  - **TikTok** uses raw OAuth with **PKCE (S256)** and a **CSRF `state`** check.
- **`getAccessToken(platform)`** is used at publish time: if the stored access token has >60 s of life it's returned as-is; otherwise it POSTs the platform's refresh endpoint, merges the response (keeping the existing refresh token unless a rotated one is returned), persists, and returns the fresh token.
- **Scopes are minimal:** YouTube `youtube.upload` + `youtube.readonly`; TikTok `video.publish` + `user.info.basic`. (Analytics scopes are deferred to the future dashboard spec.)

---

## 5. The publish run

```mermaid
sequenceDiagram
    participant CLI as publish.mjs
    participant RUN as run.ts
    participant ST as post-status.mjs
    participant PL as planPublish (pure)
    participant AD as platform adapter
    participant STATE as publish.state.json
    CLI->>RUN: runPublish(key, platforms, opts)
    RUN->>ST: readStatus(key)
    RUN->>STATE: readState(dir)
    RUN->>PL: planPublish(status, state, force)
    PL-->>RUN: { toRun, skipped, summary }  (throws unless "generated")
    Note over RUN: print the plan, then dry run stops<br/>or confirm before posting (yes flag skips it)
    loop each platform in toRun
        RUN->>AD: publish(pkg, { dryRun:false })
        AD-->>RUN: AdapterResult (independent try/catch)
        RUN->>STATE: recordResult(...)
    end
    RUN->>ST: if all ok → setStatus upload_ready (onlyFrom generated)
```

**Per-adapter API flow:**
- **YouTube** — `getAccessToken` → `POST .../upload/youtube/v3/videos?uploadType=resumable` (JSON metadata, capture `Location`) → `PUT` the reel bytes → shape `{ id, url: youtu.be/<id> }`. Friendly hints for `quotaExceeded` / 401.
- **TikTok** — `creator_info/query` → `pickPrivacy()` (must be in the creator's allowed options, else a clear mismatch error) → `video/init` (`FILE_UPLOAD`, single chunk) → `PUT` bytes **with `Content-Range` + `Content-Type: video/mp4`** (required) → poll `status/fetch` until `PUBLISH_COMPLETE`. Friendly hints for unaudited/scope/privacy errors.
- **Instagram** — no API; returns the manual upload checklist as `message`.

---

## 6. Idempotency & state

`pipeline/renders/<key>/publish.state.json` records one result per platform (`{ status, id, url, privacy, at, error }`). `shouldSkip(state, platform, force)` returns true only when that platform is already `published` and `--force` is absent — so re-running after a partial failure retries only what failed, and a full re-run is a no-op unless forced.

---

## 7. Privacy-interim & audits

Until each platform's API audit passes, uploads are created **private** (YouTube) / **`SELF_ONLY`** (TikTok). Going public is a one-value change in `publish.config.json` (`youtube.privacy` / `tiktok.privacy`) — no code change. Audit applications: [`../../docs/publishing/YOUTUBE_AUDIT_APPLICATION.md`](../../docs/publishing/YOUTUBE_AUDIT_APPLICATION.md), [`../../docs/publishing/TIKTOK_AUDIT_SUBMISSION.md`](../../docs/publishing/TIKTOK_AUDIT_SUBMISSION.md).

---

## 8. Adjacent: cloud art/video clients (FAL / Higgsfield)

The cloud art path (`--fal` / `--higgsfield`) shares this subsystem's "inject the network, key off env" shape but feeds the **render** stage, not publishing: `fal-client.mjs` / `higgsfield-client.mjs` generate slide backgrounds and per-beat image-to-video motion, keyed on `FAL_KEY` / `HIGGSFIELD_API_URL`, cached under `renderer/.cache/<provider>/`. See [IMAGE_MODELS.md](./IMAGE_MODELS.md) → Cloud art + video.

---

## 9. Security model

- Tokens are stored only on the operator's machine (`renderer/.secrets/`, gitignored) and sent only to the official `oauth2.googleapis.com` / `open.tiktokapis.com` endpoints — never to third parties, never logged.
- Client credentials come from `renderer/.env` (`YOUTUBE_CLIENT_ID/SECRET`, `TIKTOK_CLIENT_KEY/SECRET`), also gitignored.
- TikTok auth uses PKCE + a CSRF `state` check; tokens refresh non-interactively and are revocable any time from the operator's platform settings.
- Single-operator only: one owned account per platform, so OAuth is one-time and per-user rate caps are irrelevant.
