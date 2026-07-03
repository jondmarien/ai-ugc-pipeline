// bun run relay -- [--dry-run] [--bootstrap] [--discord]
//
// Poll Instagram Graph API for new posts on the configured business account
// (default username @chron0s_cyb3r_w0rld.ai). Persists cursor in renderer/.relay/instagram-watch.json.
//
// Without --discord: emits one JSON line per new post on stdout (event: instagram.new_post).
// With --discord: same poll + posts each new post to Discord (see relay:discord env).
//
// Prerequisites: IG_ACCESS_TOKEN + IG_USER_ID in env, or `bun run publish:auth meta`.
import { runInstagramDiscordPipeline } from "./relay/pipeline.ts";
import { runInstagramWatch } from "./relay/watch.ts";

const argv = process.argv.slice(2);

const HELP = `
bun run relay — detect new Instagram posts (Graph API poll)

USAGE
  bun run relay -- [--dry-run] [--bootstrap] [--discord]

FLAGS
  --dry-run     Fetch and compute notifications without writing state
                With --discord: also dry-run Discord POST (token redacted)
  --bootstrap   Initialize cursor only (no emit / no Discord), then exit
  --discord     End-to-end: poll IG → notify Discord channel

ENV (Instagram)
  IG_ACCESS_TOKEN, IG_USER_ID   Long-lived token + IG business user id (dashboard/.env)
  META_APP_SECRET or IG_APP_SECRET   For appsecret_proof when required
  IG_TARGET_USERNAME            Default: chron0s_cyb3r_w0rld.ai

ENV (Discord, when using --discord)
  DISCORD_BOT_TOKEN + DISCORD_CHANNEL_ID   (e.g. 1522416855061495848)
  DISCORD_GUILD_ID optional (e.g. 150356208589602817)
  or DISCORD_WEBHOOK_URL

See docs/relay/INSTAGRAM_POST_DETECTION.md and docs/relay/INSTAGRAM_TO_DISCORD.md
`;

if (argv.includes("--help") || argv.includes("-h")) {
  console.log(HELP);
  process.exit(0);
}

const dryRun = argv.includes("--dry-run");
const bootstrapOnly = argv.includes("--bootstrap");
const withDiscord = argv.includes("--discord");

try {
  if (withDiscord) {
    const { notifications, bootstrapped, discordResults } =
      await runInstagramDiscordPipeline({
        dryRun,
        bootstrapOnly,
        discordDryRun: dryRun,
      });
    if (bootstrapped) {
      console.error("[relay] bootstrapped cursor (no notifications on first run)");
    }
    console.error(
      `[relay] done: ${notifications.length} new post(s), ${discordResults.length} Discord notification(s)`,
    );
  } else {
    const { notifications, bootstrapped } = await runInstagramWatch({
      dryRun,
      bootstrapOnly,
      onNewPost: dryRun
        ? (n) => console.error(`[dry-run] would emit: ${n.mediaId}`)
        : undefined,
    });
    if (bootstrapped) {
      console.error("[relay] bootstrapped cursor (no notifications on first run)");
    }
    console.error(`[relay] done: ${notifications.length} new post(s)`);
  }
} catch (e) {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
}