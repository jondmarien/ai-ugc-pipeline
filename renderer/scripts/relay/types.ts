/** Normalized Instagram post notification for Discord relay. */
export type InstagramPostUpdate = {
  permalink: string;
  caption: string;
  mediaPreviewUrl?: string | null;
  mediaType?: "reel" | "carousel" | "image" | "story";
  postId?: string;
};

export type DiscordMessagePayload = {
  content?: string;
  embeds?: Array<{
    title?: string;
    description?: string;
    url?: string;
    color?: number;
    image?: { url: string };
    thumbnail?: { url: string };
    footer?: { text: string };
  }>;
};

/** Graph poll → downstream detection event (stdout JSON line). */
export type NewPostNotification = {
  event: "instagram.new_post";
  igUserId: string;
  username: string;
  mediaId: string;
  postUrl: string;
  caption: string | null;
  mediaType: string;
  mediaLinks: string[];
  postedAt: string;
  detectedAt: number;
};

export type IgMediaRow = {
  id: string;
  caption?: string | null;
  media_type?: string;
  timestamp?: string;
  permalink?: string | null;
  media_url?: string | null;
  thumbnail_url?: string | null;
  children?: { data?: { id?: string; media_url?: string; media_type?: string }[] };
};

export type RelayWatchState = {
  igUserId: string;
  username: string;
  lastSeenMediaId: string | null;
  lastSeenTimestamp: string | null;
  updatedAt: number;
};

/** Map detection payload → Discord relay input. */
export function notificationToPostUpdate(n: NewPostNotification): InstagramPostUpdate {
  const mt = n.mediaType?.toUpperCase() ?? "";
  let mediaType: InstagramPostUpdate["mediaType"];
  if (mt === "VIDEO") mediaType = "reel";
  else if (mt === "CAROUSEL_ALBUM") mediaType = "carousel";
  else if (mt === "IMAGE") mediaType = "image";
  return {
    permalink: n.postUrl,
    caption: n.caption ?? "",
    mediaPreviewUrl: n.mediaLinks[0] ?? null,
    mediaType,
    postId: n.mediaId,
  };
}