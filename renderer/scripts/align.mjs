// bun run align -- <post-key>
//
// Pipeline step: Whisper alignment → word/beat timings in post JSON for Remotion captions.
// Requires voice.wav from `bun run voice -- <key>` (or pipeline voice step).
// Wrapper around scripts/align-whisper.py.
import { runPythonScript } from "./lib/python-runner.mjs";
import { flagSet, postKeyFromArgv, showHelpAndExit } from "./lib/cli.mjs";

const args = process.argv.slice(2);
const flags = flagSet(args);

const HELP = `
bun run align — sync captions to narration (Whisper)

USAGE
  bun run align -- <post-key>

  <post-key>   full slug or substring

PREREQUISITE
  bun run voice -- <post-key>   (creates public/audio/<prefix>/voice.wav)

PIPELINE
  After voice, before reel: bun run pipeline -- <key>

EXAMPLES
  bun run align -- my-post
`;

if (flags.has("--help") || flags.has("-h") || args.includes("-h")) showHelpAndExit(HELP);

const key = postKeyFromArgv(args);
if (!key) {
  console.error(HELP);
  process.exit(1);
}

process.exit(runPythonScript({ scriptBasename: "align-whisper.py", args }));