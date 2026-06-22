// bun run art -- <post-key>  (local diffusers FLUX — legacy)
import { runPythonScript } from "./lib/python-runner.mjs";

const args = process.argv.slice(2);
if (!args.length) {
  console.error("Usage: bun run art -- <post-key>");
  process.exit(1);
}

process.exit(
  runPythonScript({
    scriptBasename: "art-flux.py",
    args,
    packagesHint: "`uv pip install diffusers torch` (see renderer/README.md)",
  }),
);