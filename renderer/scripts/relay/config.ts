import { z } from "zod";

const SnowflakeSchema = z.string().regex(/^\d{17,20}$/, "expected Discord snowflake id");

const RelayConfigSchema = z
  .object({
    discordBotToken: z.string().min(1).optional(),
    discordChannelId: SnowflakeSchema.optional(),
    discordGuildId: SnowflakeSchema.optional(),
    discordWebhookUrl: z.string().url().optional(),
  })
  .superRefine((cfg, ctx) => {
    const hasWebhook = Boolean(cfg.discordWebhookUrl);
    const hasBot = Boolean(cfg.discordBotToken && cfg.discordChannelId);
    if (!hasWebhook && !hasBot) {
      ctx.addIssue({
        code: "custom",
        message:
          "Set DISCORD_WEBHOOK_URL or both DISCORD_BOT_TOKEN and DISCORD_CHANNEL_ID",
      });
    }
  });

export type RelayConfig = z.infer<typeof RelayConfigSchema>;

export function loadRelayConfigFromEnv(
  env: Record<string, string | undefined> = process.env,
): RelayConfig {
  return RelayConfigSchema.parse({
    discordBotToken: env.DISCORD_BOT_TOKEN?.trim() || undefined,
    discordChannelId: env.DISCORD_CHANNEL_ID?.trim() || undefined,
    discordGuildId: env.DISCORD_GUILD_ID?.trim() || undefined,
    discordWebhookUrl: env.DISCORD_WEBHOOK_URL?.trim() || undefined,
  });
}