// bun run voice -- <post-key> [flags]
//
// Pipeline step: TTS narration for reels (writes public/audio/<prefix>/voice.wav).
// Thin wrapper around scripts/voice-voxcpm.py via lib/python-runner.mjs (.venv → uv → python3).
//
// Does NOT render carousel/reel — run after art (or free-comfyui) and before align.
// Flags are forwarded to the Python script (see --help).
import { runPythonScript } from "./lib/python-runner.mjs";
import { flagSet, postKeyFromArgv, showHelpAndExit } from "./lib/cli.mjs";

const args = process.argv.slice(2);
const flags = flagSet(args);

const HELP = `
bun run voice — generate narration WAV for a post (VoxCPM / Bark / HTTP modes)

USAGE
  bun run voice -- <post-key> [flags]

  <post-key>   full slug or substring (e.g. 2026-06-10)

FLAGS (forwarded to voice-voxcpm.py)
  --voice=MODE     voxcpm2 | voxcpm2-0.5b | bark | http | none
  --custom-voice <path>       reference WAV for cloning
  --custom-voice-text <text>  transcript for reference clip
  --seed=N         TTS seed (consistent speaker)
  --no-hifi        skip hi-fi pass
  --no-clone       skip clone path
  --help, -h

PIPELINE
  Usually invoked by: bun run pipeline -- <key>
  Next step: bun run align -- <key>

EXAMPLES
  bun run voice -- my-post
  bun run voice -- my-post --voice=voxcpm2-0.5b --seed=42
`;

if (flags.has("--help") || flags.has("-h") || args.includes("-h")) showHelpAndExit(HELP);

const key = postKeyFromArgv(args);
if (!key) {
  console.error(HELP);
  process.exit(1);
}

process.exit(
  runPythonScript({
    scriptBasename: "voice-voxcpm.py",
    args,
    env: { PYTHONIOENCODING: "utf-8" },
    packagesHint: "`uv pip install torch torchaudio soundfile` (see renderer/README.md)",
  }),
);