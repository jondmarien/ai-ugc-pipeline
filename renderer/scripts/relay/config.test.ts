import { expect, test } from "bun:test";
import { loadRelayConfigFromEnv } from "./config.ts";

test("loadRelayConfigFromEnv accepts webhook URL only", () => {
  const cfg = loadRelayConfigFromEnv({
    DISCORD_WEBHOOK_URL: "https://discord.com/api/webhooks/1/abc",
  });
  expect(cfg.discordWebhookUrl).toContain("webhooks");
});

test("loadRelayConfigFromEnv accepts bot token + channel id", () => {
  const cfg = loadRelayConfigFromEnv({
    DISCORD_BOT_TOKEN: "tok",
    DISCORD_CHANNEL_ID: "1522416855061495848",
    DISCORD_GUILD_ID: "150356208589602817",
  });
  expect(cfg.discordChannelId).toBe("1522416855061495848");
  expect(cfg.discordGuildId).toBe("150356208589602817");
});

test("loadRelayConfigFromEnv rejects missing credentials", () => {
  expect(() => loadRelayConfigFromEnv({})).toThrow();
});