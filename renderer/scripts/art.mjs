// bun run art:diffusers -- <post-key> [flags]
//
// LEGACY local FLUX via HuggingFace diffusers (scripts/art-flux.py).
// Default pipeline art uses ComfyUI: package.json "art" → art-comfyui.mjs.
// Use this only when you intentionally run diffusers on the host GPU.

import { flagSet, postKeyFromArgv, showHelpAndExit } from "./lib/cli.mjs";
import { runPythonScript } from "./lib/python-runner.mjs";

const args = process.argv.slice(2);
const flags = flagSet(args);

const HELP = `
bun run art:diffusers — local diffusers FLUX backgrounds (legacy)

USAGE
  bun run art:diffusers -- <post-key> [flags]

  <post-key>   full slug or substring

NOTE
  Normal workflow: bun run art -- <key>  (ComfyUI FLUX.2 Klein via art-comfyui.mjs)
  This command runs art-flux.py instead.

FLAGS
  Forwarded to art-flux.py (see script for --steps, --model, etc.)
  --help, -h

EXAMPLES
  bun run art:diffusers -- my-post
`;

if (flags.has("--help") || flags.has("-h") || args.includes("-h"))
  showHelpAndExit(HELP);

const key = postKeyFromArgv(args);
if (!key) {
  console.error(HELP);
  process.exit(1);
}

process.exit(
  runPythonScript({
    scriptBasename: "art-flux.py",
    args,
    packagesHint: "`uv pip install diffusers torch` (see renderer/README.md)",
  }),
);
