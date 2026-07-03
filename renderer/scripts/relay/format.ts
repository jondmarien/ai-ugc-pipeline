import type { DiscordMessagePayload, InstagramPostUpdate } from "./types.ts";

/** Discord message content hard limit. */
export const DISCORD_CONTENT_MAX = 2000;
/** Embed description limit (we stay under for safety). */
export const DISCORD_EMBED_DESCRIPTION_MAX = 4096;

export function truncateCaption(caption: string, max = 1500): string {
  const trimmed = caption.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

/**
 * Build a Discord message for a new/updated Instagram post.
 * Includes permalink, truncated caption, optional media preview embed.
 */
export function formatInstagramDiscordMessage(
  update: InstagramPostUpdate,
): DiscordMessagePayload {
  const caption = truncateCaption(update.caption, 1500);
  const typeLabel = update.mediaType ? ` (${update.mediaType})` : "";
  const title = `New Instagram post${typeLabel}`;

  const embed: NonNullable<DiscordMessagePayload["embeds"]>[number] = {
    title,
    url: update.permalink,
    description: caption || "_No caption_",
    color: 0xe1306c, // Instagram-ish accent
    footer: update.postId
      ? { text: `IG id: ${update.postId}` }
      : { text: "ai-ugc-pipeline relay" },
  };

  const preview = update.mediaPreviewUrl?.trim();
  if (preview) {
    embed.image = { url: preview };
  }

  return {
    content: update.permalink,
    embeds: [embed],
  };
}

/** Ensure total payload fits Discord limits (truncate embed description if needed). */
export function clampDiscordPayload(
  payload: DiscordMessagePayload,
): DiscordMessagePayload {
  const out: DiscordMessagePayload = { ...payload };
  if (out.content && out.content.length > DISCORD_CONTENT_MAX) {
    out.content = `${out.content.slice(0, DISCORD_CONTENT_MAX - 1)}…`;
  }
  if (out.embeds?.[0]?.description) {
    const d = out.embeds[0].description;
    if (d.length > DISCORD_EMBED_DESCRIPTION_MAX) {
      out.embeds = [
        {
          ...out.embeds[0],
          description: `${d.slice(0, DISCORD_EMBED_DESCRIPTION_MAX - 1)}…`,
        },
      ];
    }
  }
  return out;
}