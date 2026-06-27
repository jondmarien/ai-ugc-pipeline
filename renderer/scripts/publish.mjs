// bun run publish -- <post-key> --platforms=youtube,tiktok [--dry-run] [--force] [--yes]
//
// Gated, idempotent publishing of a GENERATED (approved + rendered) post's reel to YouTube + TikTok.
// Instagram is a manual checklist (no Meta API). Authorize once per platform first:
//   bun run publish:auth youtube   ·   bun run publish:auth tiktok
//
// Flags:
//   --platforms=a,b   platforms to target (default youtube,tiktok; also: instagram = manual)
//   --dry-run         print the per-platform plan and post nothing
//   --force           re-publish a platform already marked published (does NOT bypass approval)
//   --yes             skip the interactive confirmation
//
// The post must be `generated` (approved AND rendered, so a reel exists). On full success the
// post flips to `upload_ready` and publish.state.json records each platform result.
import { runPublish } from "./publish/run.ts";

const argv = process.argv.slice(2);

const HELP = `
bun run publish — gated multi-platform publishing

USAGE
  bun run publish -- <post-key> --platforms=youtube,tiktok [--dry-run] [--force] [--yes]

FLAGS
  --platforms=a,b   youtube,tiktok (default) or instagram (manual checklist)
  --dry-run         print the plan, post nothing
  --force           re-publish an already-published platform (NOT an approval bypass)
  --yes             skip the confirm prompt

NOTES
  • Authorize once: bun run publish:auth youtube | tiktok
  • Only "generated" posts publish (approved AND rendered); success flips to upload_ready.
  • Privacy stays private/SELF_ONLY until each platform's audit passes (publish.config.json).
`;

if (argv.includes("--help") || argv.includes("-h")) {
  console.log(HELP);
  process.exit(0);
}

const key = argv.find((a) => !a.startsWith("--"));
if (!key) {
  console.error("✗ Missing <post-key>.");
  console.log(HELP);
  process.exit(1);
}

const platformsArg = argv.find((a) => a.startsWith("--platforms="))?.split("=")[1];
const platforms = platformsArg
  ? platformsArg.split(",").map((s) => s.trim()).filter(Boolean)
  : ["youtube", "tiktok"];

const opts = {
  dryRun: argv.includes("--dry-run"),
  force: argv.includes("--force"),
  yes: argv.includes("--yes"),
};

try {
  await runPublish(key, platforms, opts);
} catch (err) {
  console.error(`\n✗ ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}
