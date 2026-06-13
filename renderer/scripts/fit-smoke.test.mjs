// Integration smoke test: proves carousel shrink-to-fit means slide copy never clips.
//
// Architecture note: Playwright's Chromium hangs when launched from the Bun runtime
// (same issue as Remotion + Bun). This test runs under Bun (bun:test) but spawns a
// tsx/Node subprocess for the Playwright work, passing __fitDebug values back as JSON.
//
// IMPORTANT: spawnSync blocks the Bun event loop, which prevents the vite preview HTTP
// server from accepting connections. We therefore use Bun.spawn (async) and await its
// completion, keeping the event loop alive throughout so the preview server stays live.
//
// Run explicitly:   cd renderer && bun test scripts/fit-smoke.test.mjs
// (bun test auto-discovers this file; see Task 7 notes on co-existing with unit tests)

import { test, expect, afterAll, beforeAll } from "bun:test";
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

let server = null;

beforeAll(async () => {
  // Build once (deterministic — no dev server HMR noise).
  console.log("  [fit-smoke] vite build…");
  await build({ root: ROOT, logLevel: "warn", build: { outDir: "dist", emptyOutDir: true } });

  // Serve the static build on port 4317.
  console.log("  [fit-smoke] vite preview…");
  server = await preview({ root: ROOT, preview: { port: PORT, strictPort: true } });
  console.log("  [fit-smoke] server ready on :" + PORT);
}, 90_000);

afterAll(async () => {
  if (server) {
    await new Promise((res) => server.httpServer.close(() => res()));
    server = null;
  }
});

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
      setTimeout(() => reject(new Error(`subprocess timeout after ${timeoutMs}ms`)), timeoutMs),
    ),
  ]);

  return { stdout, stderr, exitCode };
}

test(
  "slide copy fits frame: natural * scale <= avail (no overflow)",
  async () => {
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

    // Parse the JSON __fitDebug written to stdout.
    const dbg = JSON.parse(stdout.trim());

    console.log("  [fit-smoke] __fitDebug =", JSON.stringify(dbg));

    // --- Assertions ---

    // Object must be defined.
    expect(dbg).toBeDefined();

    // Scale must be positive.
    expect(dbg.scale).toBeGreaterThan(0);

    // Scaled content height must fit within the available frame height (1px tolerance).
    expect(dbg.natural * dbg.scale).toBeLessThanOrEqual(dbg.avail + 1);
  },
  120_000, // generous timeout: vite build + browser launch + page render
);
