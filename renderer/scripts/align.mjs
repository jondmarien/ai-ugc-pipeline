// bun run align -- <post-key>
import { runPythonScript } from "./lib/python-runner.mjs";

const args = process.argv.slice(2);
if (!args.length) {
  console.error("Usage: bun run align -- <post-key>   (run `bun run voice -- <key>` first to make voice.wav)");
  process.exit(1);
}

process.exit(runPythonScript({ scriptBasename: "align-whisper.py", args }));