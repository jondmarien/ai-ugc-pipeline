// bun run voice -- <post-key>
import { runPythonScript } from "./lib/python-runner.mjs";

const args = process.argv.slice(2);
if (!args.length) {
  console.error("Usage: bun run voice -- <post-key>");
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