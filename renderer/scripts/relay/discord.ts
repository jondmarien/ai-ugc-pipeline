import { clampDiscordPayload, formatInstagramDiscordMessage } from "./format.ts";
import type { RelayConfig } from "./config.ts";
import type { DiscordMessagePayload, InstagramPostUpdate } from "./types.ts";

export type PostInstagramUpdateResult =
  | { ok: true; mode: "live"; messageId?: string }
  | { ok: true; mode: "dry-run"; request: DryRunRequestLog }
  | { ok: false; error: string };

export type DryRunRequestLog = {
  method: "POST";
  url: string;
  headers: Record<string, string>;
  body: DiscordMessagePayload;
};

export type DiscordClientDeps = {
  fetchImpl?: typeof fetch;
  config: RelayConfig;
};

function redactAuthHeader(token: string): string {
  if (token.length <= 8) return "Bot [REDACTED]";
  return `Bot ${token.slice(0, 4)}…${token.slice(-4)} [REDACTED]`;
}

export function resolveDiscordPostUrl(config: RelayConfig): {
  url: string;
  useWebhook: boolean;
} {
  if (config.discordWebhookUrl) {
    return { url: config.discordWebhookUrl, useWebhook: true };
  }
  const channelId = config.discordChannelId;
  if (!channelId) {
    throw new Error("DISCORD_CHANNEL_ID is required when not using a webhook");
  }
  return {
    url: `https://discord.com/api/v10/channels/${channelId}/messages`,
    useWebhook: false,
  };
}

export function buildDryRunLog(
  config: RelayConfig,
  body: DiscordMessagePayload,
): DryRunRequestLog {
  const { url, useWebhook } = resolveDiscordPostUrl(config);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (!useWebhook && config.discordBotToken) {
    headers.Authorization = redactAuthHeader(config.discordBotToken);
  }
  return {
    method: "POST",
    url,
    headers,
    body,
  };
}

export async function postInstagramUpdateToDiscord(
  update: InstagramPostUpdate,
  opts: { dryRun?: boolean } & DiscordClientDeps,
): Promise<PostInstagramUpdateResult> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const payload = clampDiscordPayload(formatInstagramDiscordMessage(update));

  if (opts.dryRun) {
    return {
      ok: true,
      mode: "dry-run",
      request: buildDryRunLog(opts.config, payload),
    };
  }

  const token = opts.config.discordBotToken;
  const { url, useWebhook } = resolveDiscordPostUrl(opts.config);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (!useWebhook) {
    if (!token) {
      return { ok: false, error: "DISCORD_BOT_TOKEN is required for bot API posts" };
    }
    headers.Authorization = `Bot ${token}`;
  }

  let res: Response;
  try {
    res = await fetchImpl(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `Discord request failed: ${msg}` };
  }

  const text = await res.text();
  if (!res.ok) {
    return {
      ok: false,
      error: `Discord API ${res.status}: ${text.slice(0, 500)}`,
    };
  }

  let messageId: string | undefined;
  try {
    const json = JSON.parse(text) as { id?: string };
    messageId = json.id;
  } catch {
    // non-json success is still ok for some webhook paths
  }

  return { ok: true, mode: "live", messageId };
}