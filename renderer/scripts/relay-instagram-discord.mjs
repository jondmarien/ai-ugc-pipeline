// bun run relay:discord -- [--dry-run] [--payload=path.json]
//
// Post an Instagram update notification to Discord (bot token + channel or webhook).
// Env: DISCORD_BOT_TOKEN, DISCORD_CHANNEL_ID, DISCORD_GUILD_ID (optional),
//      or DISCORD_WEBHOOK_URL.
//
import { flagOpt, showHelpAndExit } from "./lib/cli.mjs";
import { loadPayloadFile, runRelayInstagramDiscord } from "./relay/discord-cli.ts";

const argv = process.argv.slice(2);

const HELP = `
bun run relay:discord — notify Discord when an Instagram post goes live

USAGE
  bun run relay:discord -- [--dry-run] [--payload=fixtures/instagram-discord-payload.json]

FLAGS
  --dry-run     Log the exact Discord API request (token redacted); do not post
  --payload=    JSON file with { permalink, caption, mediaPreviewUrl?, mediaType?, postId? }

ENV (no secrets in repo)
  DISCORD_BOT_TOKEN + DISCORD_CHANNEL_ID   Bot API (channel in guild DISCORD_GUILD_ID optional)
  DISCORD_WEBHOOK_URL                      Alternative: incoming webhook URL

EXAMPLE
  DISCORD_CHANNEL_ID=1522416855061495848 DISCORD_GUILD_ID=150356208589602817 \\
    bun run relay:discord -- --dry-run --payload=scripts/relay/fixtures/instagram-discord-payload.json
`;

if (argv.includes("--help") || argv.includes("-h")) {
  showHelpAndExit(HELP);
}

const dryRun = argv.includes("--dry-run");
const payloadPath =
  flagOpt(argv, "payload", "scripts/relay/fixtures/instagram-discord-payload.json") ??
  "scripts/relay/fixtures/instagram-discord-payload.json";

let update;
try {
  update = loadPayloadFile(payloadPath);
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e);
  console.error(`✗ Failed to load payload (${payloadPath}): ${msg}`);
  process.exit(1);
}

// Dry-run can use placeholder env so operators can verify wiring without a token.
const env = { ...process.env };
if (dryRun && !env.DISCORD_WEBHOOK_URL && !env.DISCORD_BOT_TOKEN) {
  env.DISCORD_BOT_TOKEN = "dry-run-placeholder-token";
  env.DISCORD_CHANNEL_ID = env.DISCORD_CHANNEL_ID ?? "1522416855061495848";
  env.DISCORD_GUILD_ID = env.DISCORD_GUILD_ID ?? "150356208589602817";
}

const result = await runRelayInstagramDiscord(update, { dryRun, env });

if (!result.ok) {
  console.error(`✗ ${result.error}`);
  process.exit(1);
}

if (result.mode === "dry-run") {
  console.log("DRY-RUN Discord request:");
  console.log(JSON.stringify(result.request, null, 2));
  process.exit(0);
}

console.log(
  `✓ Posted to Discord${result.messageId ? ` (message id ${result.messageId})` : ""}`,
);