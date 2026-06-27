# TikTok Content Posting API — audit submission answers

Paste-ready answers for the TikTok app review form. **Trim the app to exactly these products/scopes first** (remove Share Kit, `video.upload`, `video.list`, `user.info.profile`, `user.info.stats`) so every selected item is demonstrated in the demo video — otherwise review is delayed.

- **Website URL:** https://aiugc.chron0.tech
- **Terms of Service:** https://aiugc.chron0.tech/terms
- **Privacy Policy:** https://aiugc.chron0.tech/privacy
- **Redirect URI:** http://localhost:8788/callback (Desktop platform)
- **App name:** Chrono's Cyber World of AI · **Category:** Others
- **Description (≤120):** Publishes my own AI-and-cybersecurity short videos to my TikTok account from my content production pipeline.

## 1. How each product and scope works within the app

**Login Kit** — Used once, locally, so the operator can authorize the app to act on the operator's **own** TikTok account. The desktop tool opens TikTok's OAuth authorization page (`https://www.tiktok.com/v2/auth/authorize/`) with PKCE, the operator approves, and the app exchanges the returned code for an access token and refresh token that are stored only on the operator's own machine. This is the standard sign-in/authorization step; no other person's account is involved.

**Content Posting API (Direct Post)** — The core function. After the operator finishes producing a short video in their content pipeline and marks it approved, the app:
1. calls `/v2/post/publish/creator_info/query/` to read the operator's own posting options (allowed privacy levels, interaction settings, max duration) and displays them,
2. honors those settings and the operator's chosen privacy level, then
3. calls `/v2/post/publish/video/init/` with `source=FILE_UPLOAD`, uploads the operator's own MP4 reel, and polls `/v2/post/publish/status/fetch/` until the post completes.
Only the operator's own original videos are posted, to the operator's own account.

**Scope `video.publish`** — Authorizes the Direct Post calls above (init + publish of the operator's own video to the operator's own account). Without it the publish step cannot run.

**Scope `user.info.basic`** — Read-only access to the operator's own display name and avatar, used to (a) confirm the correct account is connected before posting and (b) render the creator information required by TikTok's posting-compliance UI.

> Analytics scopes (`user.info.stats`, `user.info.profile`, `video.list`) are intentionally **not** requested in this version. They will be added in a future revision when the operator-facing statistics dashboard exists and can be demonstrated.

## 2. Demo video shot list (sandbox, end-to-end)

Record one screen-capture (mp4/mov, ≤50MB) on the actual desktop tool, in the **sandbox** environment, with the operator's own TikTok account added as a **Target User** (private account, `SELF_ONLY`). Show the website domain `aiugc.chron0.tech` at the start so it matches the registered website. Sequence:

1. **Intro (website match):** Briefly show `https://aiugc.chron0.tech` in a browser (the app's website) so the reviewer can match the domain.
2. **Login Kit:** In a terminal, run `bun run publish:auth tiktok`. Show the printed authorization URL, the TikTok consent screen, approving it, and the "authorized — scopes: video.publish, user.info.basic" success message. (Demonstrates Login Kit + both scopes being granted.)
3. **Creator info (compliance):** Run `bun run publish -- <approved-key> --platforms=tiktok`. Show the app querying creator info and displaying the operator's username + the allowed privacy options, with the operator selecting `SELF_ONLY`. (Demonstrates `user.info.basic` + the compliance UI.)
4. **Content Posting API:** Show the confirmation prompt, the upload progressing, and the status poll reaching complete. (Demonstrates Content Posting API + `video.publish`.)
5. **Result:** Open the TikTok app/account and show the newly posted video sitting in `SELF_ONLY` (private) mode.

Keep the UI and each interaction clearly visible. Do not show any token values.

## 3. Usage estimates (for the form)

- Single operator, single TikTok account.
- ~1–5 posts per day, all the operator's own original cybersecurity-education content.
- No third-party users; not a multi-tenant service.
