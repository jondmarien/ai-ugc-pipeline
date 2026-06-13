// Pure metadata mapper: post JSON → per-platform publish payloads.
// No filesystem or network calls — takes already-read data.

export interface PostData {
  post_id: string;
  caption: string;
  hashtags: string[];
}

// ── YouTube ─────────────────────────────────────────────────────────────────

export interface YouTubeConfig {
  privacy: string;
  categoryId: string;
}

export interface YouTubeSnippet {
  title: string;
  description: string;
  tags: string[];
  categoryId: string;
}

export interface YouTubeStatus {
  privacyStatus: string;
  selfDeclaredMadeForKids: false;
}

export interface YouTubePayload {
  snippet: YouTubeSnippet;
  status: YouTubeStatus;
}

/** Truncate `text` to at most `max` chars on a word boundary (no trailing partial word). */
function truncateWords(text: string, max: number): string {
  if (text.length <= max) return text;
  // Find the last space at or before position `max`
  const cut = text.lastIndexOf(" ", max);
  if (cut <= 0) {
    // No space found — hard-cut (pathological: single word > 100 chars)
    return text.slice(0, max);
  }
  return text.slice(0, cut).trimEnd();
}

/** Extract the first non-empty line from a multi-line string. */
function firstLine(caption: string): string {
  for (const line of caption.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.length > 0) return trimmed;
  }
  return caption.trim();
}

export function youtubeMetadata(post: PostData, cfg: YouTubeConfig): YouTubePayload {
  const rawTitle = firstLine(post.caption);
  const title = truncateWords(rawTitle, 100);

  const hashtagStr = post.hashtags.map((t) => `#${t}`).join(" ");
  const description = `${post.caption}\n\n${hashtagStr}\n\n#Shorts`;

  return {
    snippet: {
      title,
      description,
      tags: post.hashtags,
      categoryId: cfg.categoryId,
    },
    status: {
      privacyStatus: cfg.privacy,
      selfDeclaredMadeForKids: false,
    },
  };
}

// ── TikTok ───────────────────────────────────────────────────────────────────

export interface TikTokConfig {
  privacy: string;
  disableComment: boolean;
  disableDuet: boolean;
  disableStitch: boolean;
}

export interface TikTokPostInfo {
  title: string;
  privacy_level: string;
  disable_comment: boolean;
  disable_duet: boolean;
  disable_stitch: boolean;
}

export interface TikTokPayload {
  post_info: TikTokPostInfo;
  media_type: "VIDEO";
}

const TIKTOK_TITLE_MAX = 2200;

export function tiktokMetadata(post: PostData, cfg: TikTokConfig): TikTokPayload {
  const hashtagStr = post.hashtags.map((t) => `#${t}`).join(" ");
  const fullTitle = `${post.caption}\n\n${hashtagStr}`;
  const title = fullTitle.length <= TIKTOK_TITLE_MAX
    ? fullTitle
    : fullTitle.slice(0, TIKTOK_TITLE_MAX);

  return {
    post_info: {
      title,
      privacy_level: cfg.privacy,
      disable_comment: cfg.disableComment,
      disable_duet: cfg.disableDuet,
      disable_stitch: cfg.disableStitch,
    },
    media_type: "VIDEO",
  };
}
