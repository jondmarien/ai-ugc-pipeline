# Privacy Policy — Chrono's Cyber World of AI

_Last updated: 2026-06-13_

## 1. Summary

"Chrono's Cyber World of AI" (the "App") is a personal, single-operator tool that publishes the Operator's own videos to the Operator's own TikTok and YouTube accounts. **It does not collect, store, process, or share the personal data of any other person.** There are no third-party users, no analytics on visitors, no advertising, and nothing is sold or shared.

## 2. What data the App handles

The only data the App handles is the **Operator's own** authentication data for the Operator's own accounts:

- **OAuth tokens** (access tokens and refresh tokens) issued by TikTok and YouTube/Google when the Operator authorizes the App to post to the Operator's own accounts.
- Basic account identifiers returned by those platforms (e.g., the Operator's own username/channel id) used to confirm the correct account is connected and to satisfy each platform's posting-compliance UI.

The App does **not** request, receive, or store any data belonging to other TikTok or YouTube users.

## 3. How that data is stored and used

- Tokens are stored **locally on the Operator's own machine**, in files that are excluded from version control, and are never transmitted anywhere except directly to the official TikTok and Google API endpoints for the sole purpose of publishing the Operator's content (and, in a future version, reading the Operator's own post statistics).
- Tokens are not shared with, sold to, or disclosed to any third party.

## 4. Scopes requested and why

- **TikTok `video.publish`** — to post the Operator's own videos to the Operator's own TikTok account.
- **TikTok `user.info.basic`** — to read the Operator's own username/avatar so the App can display the correct connected account and honor TikTok's posting-compliance requirements.
- **YouTube `youtube.upload`** — to upload the Operator's own videos to the Operator's own channel.
- **YouTube `youtube.readonly`** — to read the Operator's own channel/video metadata (used now to confirm uploads, and by a future version to display the Operator's own statistics).

## 5. Data retention and revocation

- Tokens persist locally only until the Operator deletes them or revokes the App's access.
- The Operator can revoke access at any time in their TikTok settings (Manage app permissions) or Google Account settings (Third-party access), which invalidates the stored tokens.

## 6. Children's privacy

The App is a private tool for its adult Operator and is not directed to children.

## 7. Changes

This policy may be updated; the "Last updated" date reflects the current version.

## 8. Contact

Privacy questions: **contact@chron0.tech**
