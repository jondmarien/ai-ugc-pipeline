// bun run relay -- [--dry-run] [--bootstrap]
//
// Poll Instagram Graph API for new posts on the configured business account
// (default username @chron0s_cyb3r_w0rld.ai). Persists cursor in renderer/.relay/instagram-watch.json.
// Emits one JSON line per new post on stdout (event: instagram.new_post).
//
// Prerequisites: IG_ACCESS_TOKEN + IG_USER_ID in env, or `bun run publish:auth meta`.
import { runInstagramWatch } from "./relay/watch.ts";

const argv = process.argv.slice(2);

const HELP = `
bun run relay — detect new Instagram posts (Graph API poll)

USAGE
  bun run relay -- [--dry-run] [--bootstrap]

FLAGS
  --dry-run     Fetch and compute notifications without writing state or emitting
  --bootstrap   Initialize cursor only (no emit), then exit

ENV
  IG_ACCESS_TOKEN, IG_USER_ID   Long-lived token + IG business user id (dashboard/.env)
  META_APP_SECRET or IG_APP_SECRET   For appsecret_proof when required
  IG_TARGET_USERNAME            Default: chron0s_cyb3r_w0rld.ai

See docs/relay/INSTAGRAM_POST_DETECTION.md
`;

if (argv.includes("--help") || argv.includes("-h")) {
  console.log(HELP);
  process.exit(0);
}

const dryRun = argv.includes("--dry-run");
const bootstrapOnly = argv.includes("--bootstrap");

try {
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
} catch (e) {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
}