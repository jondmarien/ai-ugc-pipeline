# Privacy Policy — Chrono's Cyber World of AI

_Last updated: 2026-07-01_

## 1. Summary

"Chrono's Cyber World of AI" (the "App") is a personal, single-operator tool that publishes the Operator's own videos and image carousels to the Operator's own TikTok, YouTube, Facebook, and Instagram accounts. **It does not collect, store, process, or share the personal data of any other person.** There are no third-party users, no analytics on visitors, no advertising, and nothing is sold or shared.

## 2. What data the App handles

The only data the App handles is the **Operator's own** authentication data for the Operator's own accounts:

- **OAuth tokens** (access tokens and refresh tokens) issued by TikTok and YouTube/Google when the Operator authorizes the App to post to the Operator's own accounts.
- A **Meta User access token** and a derived **Facebook Page access token**, issued via Facebook Login for Business when the Operator authorizes the App to post to their own Facebook Page and linked Instagram professional account.
- Basic account identifiers returned by those platforms (e.g., the Operator's own username/channel id, Facebook Page ID, and Instagram Business Account ID) used to confirm the correct account is connected and to satisfy each platform's posting-compliance UI.

The App does **not** request, receive, or store any data belonging to other TikTok, YouTube, Facebook, or Instagram users.

## 3. How that data is stored and used

- Tokens are stored **locally on the Operator's own machine**, in files that are excluded from version control, and are never transmitted anywhere except directly to the official TikTok, Google, and Meta (`graph.facebook.com`) API endpoints for the sole purpose of publishing the Operator's content (and, in a future version, reading the Operator's own post statistics).
- Instagram's Graph API requires the media being published to be fetched from a public URL rather than uploaded as raw bytes. The App temporarily stages each video or image on its own infrastructure (`aiugc.chron0.tech`, backed by Vercel Blob) solely so Meta's servers can retrieve it, then deletes it immediately once Meta confirms the post has finished processing. No party other than Meta's own one-time fetch of that URL ever accesses the file.
- Tokens are not shared with, sold to, or disclosed to any third party.

## 4. Scopes requested and why

- **TikTok `video.publish`** — to post the Operator's own videos to the Operator's own TikTok account.
- **TikTok `user.info.basic`** — to read the Operator's own username/avatar so the App can display the correct connected account and honor TikTok's posting-compliance requirements.
- **YouTube `youtube.upload`** — to upload the Operator's own videos to the Operator's own channel.
- **YouTube `youtube.readonly`** — to read the Operator's own channel/video metadata (used now to confirm uploads, and by a future version to display the Operator's own statistics).
- **Meta `pages_show_list`, `pages_read_engagement`** — to list the Operator's own Facebook Pages and resolve the linked Instagram Business Account.
- **Meta `pages_manage_posts`** — to publish the Operator's own videos to the Operator's own Facebook Page.
- **Meta `instagram_basic`** — to read the Operator's own Instagram Business Account id.
- **Meta `instagram_content_publish`** — to publish the Operator's own Reels, carousels, and images to the Operator's own Instagram account.

## 5. AI-generated content disclosure

Every post the App publishes to Instagram is labeled with Meta's `is_ai_generated` self-disclosure flag at publish time, since all of the Operator's content is produced with AI tools. This is a platform-required label attached to the published post itself, not personal data about any user, and is not configurable per post.

## 6. Data retention and revocation

- Tokens persist locally only until the Operator deletes them or revokes the App's access.
- The Operator can revoke access at any time in their TikTok settings (Manage app permissions), Google Account settings (Third-party access), or Facebook settings (Business Integrations / Apps and Websites), which invalidates the stored tokens.

## 7. Children's privacy

The App is a private tool for its adult Operator and is not directed to children.

## 8. Changes

This policy may be updated; the "Last updated" date reflects the current version.

## 9. Contact

Privacy questions: **contact@chron0.tech**
