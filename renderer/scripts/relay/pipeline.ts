import { emitNewPostEvent } from "./graph.ts";
import { runRelayInstagramDiscord } from "./discord-cli.ts";
import { runInstagramWatch, type InstagramWatchOpts } from "./watch.ts";
import { notificationToPostUpdate } from "./types.ts";
import type { NewPostNotification } from "./types.ts";
import type { PostInstagramUpdateResult } from "./discord.ts";

export type InstagramDiscordPipelineOpts = InstagramWatchOpts & {
  /** When true, log Discord POST without network (uses placeholder token if unset). */
  discordDryRun?: boolean;
  /** Env for Discord config (defaults to process.env). */
  discordEnv?: Record<string, string | undefined>;
  /** Max Discord POST attempts per new post (default 3). */
  discordMaxAttempts?: number;
  /** Base delay ms between Discord retries (doubles each attempt, default 1000). */
  discordRetryBaseMs?: number;
  /** Still emit stdout JSON lines when posting to Discord (default true). */
  emitStdout?: boolean;
};

export type PipelineDiscordResult = {
  mediaId: string;
  result: PostInstagramUpdateResult;
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function discordEnvForDryRun(
  env: Record<string, string | undefined>,
): Record<string, string | undefined> {
  const out = { ...env };
  if (out.DISCORD_WEBHOOK_URL || out.DISCORD_BOT_TOKEN) return out;
  out.DISCORD_BOT_TOKEN = "dry-run-placeholder-token";
  out.DISCORD_CHANNEL_ID = out.DISCORD_CHANNEL_ID ?? "1522416855061495848";
  out.DISCORD_GUILD_ID = out.DISCORD_GUILD_ID ?? "150356208589602817";
  return out;
}

export async function postNotificationToDiscordWithRetry(
  n: NewPostNotification,
  opts: {
    dryRun?: boolean;
    env?: Record<string, string | undefined>;
    fetchImpl?: typeof fetch;
    maxAttempts?: number;
    retryBaseMs?: number;
  },
): Promise<PostInstagramUpdateResult> {
  const maxAttempts = Math.max(1, opts.maxAttempts ?? 3);
  const retryBaseMs = opts.retryBaseMs ?? 1000;
  const update = notificationToPostUpdate(n);
  const env = opts.dryRun ? discordEnvForDryRun(opts.env ?? process.env) : (opts.env ?? process.env);

  let last: PostInstagramUpdateResult = { ok: false, error: "no attempts" };
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    last = await runRelayInstagramDiscord(update, {
      dryRun: opts.dryRun,
      env,
      fetchImpl: opts.fetchImpl,
    });
    if (last.ok) return last;
    if (attempt < maxAttempts && !opts.dryRun) {
      await sleep(retryBaseMs * 2 ** (attempt - 1));
    }
  }
  return last;
}

/**
 * Poll Instagram for new posts; for each, emit stdout JSON (optional) and post to Discord.
 * Watch cursor is persisted only after all handlers succeed (throws on Discord failure).
 */
export async function runInstagramDiscordPipeline(
  opts: InstagramDiscordPipelineOpts = {},
) {
  const emitStdout = opts.emitStdout !== false;
  const discordResults: PipelineDiscordResult[] = [];
  const {
    discordDryRun,
    discordEnv,
    discordMaxAttempts,
    discordRetryBaseMs,
    emitStdout: _es,
    onNewPost: _ignoredHook,
    ...watchOpts
  } = opts;

  const watchResult = await runInstagramWatch({
    ...watchOpts,
    onNewPost: async (n) => {
      if (emitStdout) emitNewPostEvent(n);
      const result = await postNotificationToDiscordWithRetry(n, {
        dryRun: discordDryRun,
        env: discordEnv,
        fetchImpl: opts.fetchImpl,
        maxAttempts: discordMaxAttempts,
        retryBaseMs: discordRetryBaseMs,
      });
      discordResults.push({ mediaId: n.mediaId, result });
      if (!result.ok) {
        throw new Error(
          `Discord post failed for media ${n.mediaId} after retries: ${result.error}`,
        );
      }
    },
  });

  return { ...watchResult, discordResults };
}