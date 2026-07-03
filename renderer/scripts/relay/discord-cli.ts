import { readFileSync } from "node:fs";
import { loadRelayConfigFromEnv } from "./config.ts";
import { postInstagramUpdateToDiscord } from "./discord.ts";
import type { InstagramPostUpdate } from "./types.ts";

export type RunRelayDiscordOptions = {
  dryRun?: boolean;
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
};

export function parseInstagramUpdateJson(raw: string): InstagramPostUpdate {
  const data = JSON.parse(raw) as Partial<InstagramPostUpdate>;
  if (!data.permalink || typeof data.permalink !== "string") {
    throw new Error("payload must include string permalink");
  }
  if (data.caption === undefined || typeof data.caption !== "string") {
    throw new Error("payload must include string caption");
  }
  return {
    permalink: data.permalink,
    caption: data.caption,
    mediaPreviewUrl: data.mediaPreviewUrl ?? null,
    mediaType: data.mediaType,
    postId: data.postId,
  };
}

export async function runRelayInstagramDiscord(
  update: InstagramPostUpdate,
  opts: RunRelayDiscordOptions = {},
) {
  const config = loadRelayConfigFromEnv(opts.env ?? process.env);
  return postInstagramUpdateToDiscord(update, {
    config,
    dryRun: opts.dryRun,
    fetchImpl: opts.fetchImpl,
  });
}

export function loadPayloadFile(path: string): InstagramPostUpdate {
  return parseInstagramUpdateJson(readFileSync(path, "utf-8"));
}