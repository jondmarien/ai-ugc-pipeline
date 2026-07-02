// Spawn renderer/scripts/*.py with consistent Python discovery.
//
// Order: renderer/.venv python → `uv run python` → system python3 (warn + packagesHint).
// cwd is always RENDERER_ROOT so relative paths in Python match legacy behavior.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { RENDERER_ROOT } from "./paths.mjs";

/**
 * Run a renderer Python script with .venv → uv run → system python fallback.
 * @param {{ scriptBasename: string, args?: string[], env?: Record<string,string>, packagesHint?: string }} opts
 * @returns {number} exit code
 */
export function runPythonScript({
  scriptBasename,
  args = [],
  env,
  packagesHint,
}) {
  const script = path.join(RENDERER_ROOT, "scripts", scriptBasename);
  const venvPy =
    process.platform === "win32"
      ? path.join(RENDERER_ROOT, ".venv", "Scripts", "python.exe")
      : path.join(RENDERER_ROOT, ".venv", "bin", "python");

  let cmd;
  let cmdArgs;
  if (existsSync(venvPy)) {
    cmd = venvPy;
    cmdArgs = [script, ...args];
  } else if (
    spawnSync(process.platform === "win32" ? "where" : "which", ["uv"])
      .status === 0
  ) {
    cmd = "uv";
    cmdArgs = ["run", "python", script, ...args];
  } else {
    cmd = process.platform === "win32" ? "python" : "python3";
    cmdArgs = [script, ...args];
    if (packagesHint) {
      console.warn(
        `⚠ No .venv or uv — using system python. Recommended: ${packagesHint}`,
      );
    }
  }

  const res = spawnSync(cmd, cmdArgs, {
    cwd: RENDERER_ROOT,
    stdio: "inherit",
    env: env ? { ...process.env, ...env } : process.env,
  });
  return res.status ?? 1;
}
