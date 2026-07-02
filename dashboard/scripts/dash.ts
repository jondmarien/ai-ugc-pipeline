import path from "node:path";
import { spawn } from "bun";

const dash = path.resolve(import.meta.dir, "..");
const procs = [
  spawn(["bun", "server/index.ts"], {
    cwd: dash,
    stdout: "inherit",
    stderr: "inherit",
  }),
  spawn(["bunx", "vite"], { cwd: dash, stdout: "inherit", stderr: "inherit" }),
];
process.on("SIGINT", () => {
  for (const p of procs) p.kill();
  process.exit(0);
});
await Promise.all(procs.map((p) => p.exited));
