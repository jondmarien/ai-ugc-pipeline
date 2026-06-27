# YouTube Data API — compliance audit application

Paste-ready answers for the YouTube API Services audit (required to lift the unverified-project cap that forces uploads to stay **private**). Single operator, single channel, the operator's own original content.

- **Website URL:** https://aiugc.chron0.tech
- **Terms of Service:** https://aiugc.chron0.tech/terms
- **Privacy Policy:** https://aiugc.chron0.tech/privacy
- **OAuth client type:** Desktop app · **Redirect URI:** http://localhost:8788/callback
- **API:** YouTube Data API v3
- **App name:** Chrono's Cyber World of AI · **Category:** Others

## 1. What the app does

A personal, single-operator desktop tool that uploads the operator's **own** short cybersecurity-education videos to the operator's **own** YouTube channel, from a local content-production pipeline. It is not a multi-tenant service; no other person's account or data is involved.

## 2. Scopes requested and why

- **`https://www.googleapis.com/auth/youtube.upload`** — to upload the operator's own rendered MP4 (a vertical <3-minute Short) to the operator's own channel via `videos.insert` (resumable upload).
- **`https://www.googleapis.com/auth/youtube.readonly`** — to confirm the operator's own uploads and read the operator's own channel/video metadata. It is requested now so a future operator-facing statistics dashboard can reuse the token without re-authorizing; it reads only the operator's own data.

## 3. How OAuth works in the app

1. One time, the operator runs `bun run publish:auth youtube`. The app uses Google's OAuth2 (via `google-auth-library`) to open the consent screen, runs a localhost loopback (`http://localhost:8788/callback`), and exchanges the returned code for an access token + refresh token.
2. Tokens are stored only on the operator's own machine (gitignored `renderer/.secrets/youtube.json`) and sent only to `oauth2.googleapis.com` / `googleapis.com`. They are never shared with third parties.
3. On each publish, the access token is refreshed if it has under 60 seconds of life left, then used for one `videos.insert`.

## 4. API usage and quota

- `videos.insert` = 1,600 of the default 10,000 daily quota units (about 6 uploads/day).
- Expected real usage: roughly 1–5 uploads/day, all the operator's own original content.
- Uploads are created with `privacyStatus: private` and `selfDeclaredMadeForKids: false` until this audit passes; the operator then flips `publish.config.json` to `public`/`unlisted`.

## 5. Compliance notes

- Only the operator's own original videos are uploaded, to the operator's own channel.
- No YouTube data of any other user is requested, stored, or processed.
- The app honors the YouTube API Services Terms of Service and Developer Policies; tokens are revocable any time from the operator's Google Account third-party-access settings.

## 6. Demo (if a screencast is requested)

Record the operator running `bun run publish -- <approved-key> --platforms=youtube` in a terminal: the confirmation prompt, the resumable upload progressing, and the resulting **private** video appearing on the operator's own channel. Do not show any token values.
