export type ApiEnvelope<T> = {
  data: T | null;
  error: string | null;
  /** epoch ms when the underlying upstream data was fetched; null = live/local read */
  fetchedAt: number | null;
};

export type ModuleKey =
  | "overview"
  | "hooks"
  | "analytics"
  | "competitors"
  | "scheduler"
  | "calendar"
  | "trending"
  | "meta"
  | "comments";

export type IgComment = {
  id: string;
  text: string;
  username?: string;
  timestamp: string;
  like_count?: number;
  hidden?: boolean;
  replies?: IgComment[];
};

/** Mirrors renderer/scripts/publish/state.ts's PublishResult shape — not imported,
 * since dashboard has no dependency on the renderer project. */
export type PublishResult = {
  platform: string;
  status: string;
  id?: string | null;
  url?: string | null;
  privacy?: string;
  at: number;
  error?: string;
};

export type MetaPostType = "reel" | "carousel" | "fb_video";

export type MetaInsights = {
  views?: number;
  reach?: number;
  likes?: number;
  comments?: number;
  saves?: number;
  shares?: number;
};

export type PublishedMetaPost = {
  renderDir: string;
  slug: string;
  date: string | null;
  platform: "facebook" | "instagram";
  postType: MetaPostType;
  mediaId: string | null;
  url: string | null;
  privacy: string | null;
  /** Always true — every Instagram post this pipeline makes sets is_ai_generated=true. */
  isAiGenerated: true;
  caption: string;
  hashtags: string[];
  publishedAt: number;
  insights: MetaInsights | null;
  insightsError: string | null;
};
