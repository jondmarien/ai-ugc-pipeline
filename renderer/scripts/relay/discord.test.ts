import { expect, test } from "bun:test";
import { loadRelayConfigFromEnv } from "./config.ts";
import {
  buildDryRunLog,
  postInstagramUpdateToDiscord,
  resolveDiscordPostUrl,
} from "./discord.ts";
import { formatInstagramDiscordMessage, truncateCaption } from "./format.ts";
import type { InstagramPostUpdate } from "./types.ts";

const sample: InstagramPostUpdate = {
  permalink: "https://www.instagram.com/reel/TEST/",
  caption: "Hello Discord",
  mediaPreviewUrl: "https://example.com/preview.png",
  mediaType: "reel",
  postId: "123",
};

test("truncateCaption adds ellipsis when over limit", () => {
  const long = "a".repeat(2000);
  const out = truncateCaption(long, 100);
  expect(out.length).toBe(100);
  expect(out.endsWith("…")).toBe(true);
});

test("formatInstagramDiscordMessage includes link and embed", () => {
  const msg = formatInstagramDiscordMessage(sample);
  expect(msg.content).toBe(sample.permalink);
  expect(msg.embeds?.[0]?.url).toBe(sample.permalink);
  expect(msg.embeds?.[0]?.image?.url).toBe(sample.mediaPreviewUrl);
});

test("resolveDiscordPostUrl uses channel id for bot API", () => {
  const cfg = loadRelayConfigFromEnv({
    DISCORD_BOT_TOKEN: "x",
    DISCORD_CHANNEL_ID: "1522416855061495848",
    DISCORD_GUILD_ID: "150356208589602817",
  });
  const { url, useWebhook } = resolveDiscordPostUrl(cfg);
  expect(useWebhook).toBe(false);
  expect(url).toBe(
    "https://discord.com/api/v10/channels/1522416855061495848/messages",
  );
});

test("dry-run does not call fetch", async () => {
  let called = false;
  const cfg = loadRelayConfigFromEnv({
    DISCORD_BOT_TOKEN: "test-token-value",
    DISCORD_CHANNEL_ID: "1522416855061495848",
  });
  const r = await postInstagramUpdateToDiscord(sample, {
    config: cfg,
    dryRun: true,
    fetchImpl: async () => {
      called = true;
      return new Response("{}");
    },
  });
  expect(called).toBe(false);
  expect(r.ok).toBe(true);
  if (r.ok && r.mode === "dry-run") {
    expect(r.request.method).toBe("POST");
    expect(r.request.url).toContain("1522416855061495848");
    expect(r.request.headers.Authorization).toContain("[REDACTED]");
    expect(r.request.body.content).toBe(sample.permalink);
  }
});

test("buildDryRunLog redacts bot token in Authorization", () => {
  const cfg = loadRelayConfigFromEnv({
    DISCORD_BOT_TOKEN: "abcdefghijklmnop",
    DISCORD_CHANNEL_ID: "1522416855061495848",
  });
  const log = buildDryRunLog(cfg, formatInstagramDiscordMessage(sample));
  expect(log.headers.Authorization).not.toContain("abcdefghijklmnop");
  expect(log.headers.Authorization).toMatch(/REDACTED/);
});

test("live post uses fetch with Authorization header", async () => {
  const cfg = loadRelayConfigFromEnv({
    DISCORD_BOT_TOKEN: "secret-bot-token",
    DISCORD_CHANNEL_ID: "1522416855061495848",
  });
  let seenAuth = "";
  const r = await postInstagramUpdateToDiscord(sample, {
    config: cfg,
    dryRun: false,
    fetchImpl: async (_url, init) => {
      const h = init?.headers as Record<string, string> | undefined;
      seenAuth = h?.Authorization ?? "";
      return new Response(JSON.stringify({ id: "999" }), { status: 200 });
    },
  });
  expect(seenAuth).toBe("Bot secret-bot-token");
  expect(r.ok).toBe(true);
  if (r.ok && r.mode === "live") {
    expect(r.messageId).toBe("999");
  }
});