// Integration smoke check: proves carousel shrink-to-fit means slide copy never clips.
//
// Architecture note: Playwright's Chromium hangs when launched from the Bun runtime
// (same issue as Remotion + Bun). This script spawns a tsx/Node subprocess for the
// Playwright work, passing __fitDebug values back as JSON.
//
// IMPORTANT: spawnSync blocks the Bun event loop, which prevents the vite preview HTTP
// server from accepting connections. We therefore use Bun.spawn (async) and await its
// completion, keeping the event loop alive throughout so the preview server stays live.
//
// NOTE: This file is intentionally named fit-smoke.mjs (no ".test.") so that
// `bun test` does NOT auto-discover it. Run explicitly via:
//   cd renderer && bun run test:smoke
// or:
//   cd renderer && bun scripts/fit-smoke.mjs

import { build, preview } from "vite";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PORT = 4317;
const POST_KEY = "2026-06-10_dirtydecrypt-linux-lpe";
const SLIDE = 5; // worst offender — long copy on the failure_point slide

// Resolve tsx binary from local node_modules (not a globally-installed tsx).
const TSX_BIN = path.join(ROOT, "node_modules", ".bin", "tsx");

// Sentinel prefix written by fit-smoke-playwright.ts to stdout.
// Every other output from that script goes to stderr.
const SENTINEL = "__FITDEBUG__";

// Spawn a subprocess asynchronously and collect stdout/stderr/exit.
// We MUST use async spawn (not spawnSync) to keep the Bun event loop alive
// so the vite preview HTTP server can accept connections while the subprocess runs.
async function spawnAsync(cmd, args, timeoutMs) {
  const proc = Bun.spawn([cmd, ...args], {
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env },
  });

  // Collect output while the event loop remains free to serve HTTP.
  const [stdout, stderr, exitCode] = await Promise.race([
    Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ]),
    new Promise((_, reject) =>
      setTimeout(() => {
        // Kill the child so a hung Chromium isn't orphaned.
        try { proc.kill(); } catch (_) {}
        reject(new Error(`subprocess timeout after ${timeoutMs}ms`));
      }, timeoutMs),
    ),
  ]);

  return { stdout, stderr, exitCode };
}

// --- Plain-script async entry point (no bun:test runner) ---
(async () => {
  let server = null;
  let failed = false;

  try {
    // Build once (deterministic — no dev server HMR noise).
    console.log("  [fit-smoke] vite build…");
    await build({ root: ROOT, logLevel: "warn", build: { outDir: "dist", emptyOutDir: true } });

    // Serve the static build on port 4317.
    console.log("  [fit-smoke] vite preview…");
    server = await preview({ root: ROOT, preview: { port: PORT, strictPort: true } });
    console.log("  [fit-smoke] server ready on :" + PORT);

    const url = `http://localhost:${PORT}/?post=${encodeURIComponent(POST_KEY)}&slide=${SLIDE}`;
    const helperScript = path.join(__dirname, "fit-smoke-playwright.ts");

    // Spawn Playwright under Node/tsx — avoids the Bun↔Chromium hang.
    // Async spawn keeps the Bun event loop alive so the vite preview can serve the page.
    const { stdout, stderr, exitCode } = await spawnAsync(TSX_BIN, [helperScript, url], 60_000);

    if (exitCode !== 0) {
      throw new Error(
        `Playwright helper exited ${exitCode}.\nstdout: ${stdout}\nstderr: ${stderr}`,
      );
    }

    // Extract the sentinel line from stdout — any other lines may be tsx/Node
    // warnings or version banners and are intentionally ignored here.
    const sentinelLine = stdout.split("\n").find((l) => l.startsWith(SENTINEL));
    if (!sentinelLine) {
      throw new Error(
        `No sentinel line (${SENTINEL}…) found in subprocess stdout.\nstdout: ${stdout}\nstderr: ${stderr}`,
      );
    }
    const dbg = JSON.parse(sentinelLine.slice(SENTINEL.length));

    console.log("  [fit-smoke] __fitDebug =", JSON.stringify(dbg));

    // --- Assertions ---

    // Object must be defined.
    if (!dbg) throw new Error("FAIL: dbg is not defined");

    // Scale must be positive and at most 1.
    if (!(dbg.scale > 0)) throw new Error(`FAIL: scale must be > 0, got ${dbg.scale}`);
    if (!(dbg.scale <= 1)) throw new Error(`FAIL: scale must be <= 1, got ${dbg.scale}`);

    // Contract: copy never silently clips — it fits at the chosen scale, or it hit the
    // legibility floor (in which case the copy-budget validator flags it for shortening).
    // Once slide 5's copy is retrofitted within budget, the `fits` branch holds strictly
    // (floored will be false and natural * scale <= avail + 1).
    const fits = dbg.natural * dbg.scale <= dbg.avail + 1;
    if (!(fits || dbg.floored === true)) {
      throw new Error(
        `FAIL: no-silent-clip contract violated — fits=${fits}, floored=${dbg.floored}` +
          ` (natural=${dbg.natural}, scale=${dbg.scale}, avail=${dbg.avail})`,
      );
    }

    console.log("  [fit-smoke] PASS");
  } catch (err) {
    console.error("  [fit-smoke] FAIL:", err.message);
    failed = true;
  } finally {
    if (server) {
      await new Promise((res) => server.httpServer.close(() => res()));
    }
  }

  process.exit(failed ? 1 : 0);
})();
