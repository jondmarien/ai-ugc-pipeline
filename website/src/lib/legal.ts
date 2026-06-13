// On-site legal copy. Substance matches docs/publishing/legal/*.md.
import { BRAND } from "./content";

type Block = { h: string; p?: string[]; ul?: string[] };
type Doc = { title: string; updated: string; intro: string; blocks: Block[] };

export const LEGAL: Record<"terms" | "privacy", Doc> = {
  terms: {
    title: "Terms of Service",
    updated: "2026-06-13",
    intro: `"${BRAND.name}" (the "App") is a personal, single-operator content-publishing tool. It is operated solely by its owner to publish the owner's own short-form videos about AI and cybersecurity to the owner's own connected social-media accounts (currently TikTok and YouTube). It is not a public or multi-tenant service: no third-party accounts, no marketplace, nothing sold.`,
    blocks: [
      {
        h: "Acceptable use",
        p: ["The App is used only to authenticate the operator's own TikTok and YouTube accounts via each platform's official OAuth flow, and to upload and publish the operator's own original videos to those accounts. The operator ensures all published content complies with the terms and community guidelines of every platform it reaches."],
      },
      {
        h: "Third-party platforms",
        p: ["The App integrates with TikTok (Login Kit and Content Posting API) and YouTube (YouTube Data API). Use of those platforms is governed by their own terms. The App is not affiliated with, endorsed by, or sponsored by TikTok or Google."],
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
    updated: "2026-06-13",
    intro: `"${BRAND.name}" (the "App") is a personal, single-operator tool that publishes the operator's own videos to the operator's own TikTok and YouTube accounts. It does not collect, store, process, or share the personal data of any other person. No third-party users, no visitor analytics, no advertising, nothing sold.`,
    blocks: [
      {
        h: "What data the App handles",
        p: ["The only data handled is the operator's own authentication data for the operator's own accounts:"],
        ul: [
          "OAuth tokens (access and refresh) issued by TikTok and Google when the operator authorizes the App to post to the operator's own accounts.",
          "Basic account identifiers (e.g. the operator's own username/channel id) used to confirm the correct account and satisfy each platform's posting-compliance UI.",
        ],
      },
      {
        h: "How it's stored and used",
        ul: [
          "Tokens are stored locally on the operator's own machine, excluded from version control, and transmitted only to the official TikTok and Google API endpoints to publish the operator's own content (and, in a future version, read the operator's own post statistics).",
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
        ],
      },
      {
        h: "Retention and revocation",
        ul: [
          "Tokens persist locally only until the operator deletes them or revokes access.",
          "Access can be revoked anytime in TikTok settings (Manage app permissions) or Google Account settings (Third-party access), which invalidates the stored tokens.",
        ],
      },
      { h: "Children's privacy", p: ["The App is a private tool for its adult operator and is not directed to children."] },
      { h: "Changes", p: ["This policy may be updated; the date above reflects the current version."] },
      { h: "Contact", p: [BRAND.contact] },
    ],
  },
};
