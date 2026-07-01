// On-site legal copy. Substance matches docs/publishing/legal/*.md.
import { BRAND } from "./content";

type Block = { h: string; p?: string[]; ul?: string[] };
type Doc = { title: string; updated: string; intro: string; blocks: Block[] };

export const LEGAL: Record<"terms" | "privacy", Doc> = {
  terms: {
    title: "Terms of Service",
    updated: "2026-07-01",
    intro: `"${BRAND.name}" (the "App") is a personal, single-operator content-publishing tool. It is operated solely by its owner to publish the owner's own short-form videos and image carousels about AI and cybersecurity to the owner's own connected social-media accounts (currently TikTok, YouTube, Facebook, and Instagram). It is not a public or multi-tenant service: no third-party accounts, no marketplace, nothing sold.`,
    blocks: [
      {
        h: "Acceptable use",
        p: ["The App is used only to authenticate the operator's own TikTok, YouTube, Facebook, and Instagram accounts via each platform's official OAuth flow, and to upload and publish the operator's own original videos and images to those accounts. The operator ensures all published content complies with the terms and community guidelines of every platform it reaches, and discloses AI-generated media where each platform requires it."],
      },
      {
        h: "Third-party platforms",
        p: ["The App integrates with TikTok (Login Kit and Content Posting API), YouTube (YouTube Data API), and Meta (Facebook Graph API and Instagram Graph API, via Facebook Login for Business). Use of those platforms is governed by their own terms. The App is not affiliated with, endorsed by, or sponsored by TikTok, Google, or Meta."],
      },
      {
        h: "No warranty",
        p: ['The App is provided "as is", without warranty of any kind, and the operator is not liable for any loss arising from its use.'],
      },
      { h: "Changes", p: ["These terms may be updated; the date above reflects the current version."] },
      { h: "Contact", p: [BRAND.contact] },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    updated: "2026-07-01",
    intro: `"${BRAND.name}" (the "App") is a personal, single-operator tool that publishes the operator's own videos and image carousels to the operator's own TikTok, YouTube, Facebook, and Instagram accounts. It does not collect, store, process, or share the personal data of any other person. No third-party users, no visitor analytics, no advertising, nothing sold.`,
    blocks: [
      {
        h: "What data the App handles",
        p: ["The only data handled is the operator's own authentication data for the operator's own accounts:"],
        ul: [
          "OAuth tokens (access and refresh) issued by TikTok and Google when the operator authorizes the App to post to the operator's own accounts.",
          "A Meta User access token and a derived Facebook Page access token, issued via Facebook Login for Business when the operator authorizes the App to post to their own Facebook Page and linked Instagram professional account.",
          "Basic account identifiers (e.g. the operator's own username/channel id, Facebook Page ID, and Instagram Business Account ID) used to confirm the correct account and satisfy each platform's posting-compliance UI.",
        ],
      },
      {
        h: "How it's stored and used",
        ul: [
          "Tokens are stored locally on the operator's own machine, excluded from version control, and transmitted only to the official TikTok, Google, and Meta (graph.facebook.com) API endpoints to publish the operator's own content (and, in a future version, read the operator's own post statistics).",
          "Instagram's Graph API requires publishing media to be fetched from a public URL rather than uploaded as raw bytes. The App temporarily stages each video or image on its own infrastructure (aiugc.chron0.tech, backed by Vercel Blob) solely so Meta's servers can retrieve it, then deletes it immediately once Meta confirms the post is processed. No one other than Meta's own fetch of that one-time URL ever accesses the file.",
          "Tokens are never shared with, sold to, or disclosed to any third party.",
        ],
      },
      {
        h: "Scopes requested and why",
        ul: [
          "TikTok video.publish — post the operator's own videos to the operator's own account.",
          "TikTok user.info.basic — read the operator's own username/avatar to confirm the connected account and render TikTok's required posting-compliance UI.",
          "YouTube youtube.upload — upload the operator's own videos to the operator's own channel.",
          "YouTube youtube.readonly — read the operator's own channel/video metadata (confirm uploads now; display the operator's own stats in a future version).",
          "Meta pages_show_list, pages_read_engagement — list the operator's own Facebook Pages and resolve the linked Instagram Business Account.",
          "Meta pages_manage_posts — publish the operator's own videos to the operator's own Facebook Page.",
          "Meta instagram_basic — read the operator's own Instagram Business Account id.",
          "Meta instagram_content_publish — publish the operator's own Reels, carousels, and images to the operator's own Instagram account.",
        ],
      },
      {
        h: "AI-generated content disclosure",
        p: ["Every post this App publishes to Instagram is labeled with Meta's is_ai_generated self-disclosure flag at publish time, since all of the operator's content is produced with AI tools. This is a platform-required label on the published post, not personal data about any user."],
      },
      {
        h: "Retention and revocation",
        ul: [
          "Tokens persist locally only until the operator deletes them or revokes access.",
          "Access can be revoked anytime in TikTok settings (Manage app permissions), Google Account settings (Third-party access), or Facebook settings (Business Integrations / Apps and Websites), which invalidates the stored tokens.",
        ],
      },
      { h: "Children's privacy", p: ["The App is a private tool for its adult operator and is not directed to children."] },
      { h: "Changes", p: ["This policy may be updated; the date above reflects the current version."] },
      { h: "Contact", p: [BRAND.contact] },
    ],
  },
};
