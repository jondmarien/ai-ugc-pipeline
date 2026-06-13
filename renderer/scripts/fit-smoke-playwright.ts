// Helper for fit-smoke.test.mjs — runs UNDER NODE via tsx (not Bun).
// Playwright's Chromium hangs when launched from the Bun runtime; this
// thin script is spawned as a Node subprocess so Chromium runs outside Bun.
//
// Usage: tsx scripts/fit-smoke-playwright.ts <url>
// Exits 0 and writes exactly one sentinel line to stdout:
//   __FITDEBUG__{"natural":…,"avail":…,"scale":…,"floored":…}
// ALL other output (warnings, banners, diagnostics) goes to stderr.
// Exits 1 and prints an error message on stderr on failure.

import { chromium } from "playwright";

const SENTINEL = "__FITDEBUG__";

const url = process.argv[2];
if (!url) {
  console.error("Usage: tsx fit-smoke-playwright.ts <url>");
  process.exit(1);
}

console.error(`[fit-smoke-playwright] launching Chromium for ${url}`);
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });

  // Route Playwright console messages to stderr so they never pollute stdout.
  page.on("console", (msg) => console.error(`[page:${msg.type()}] ${msg.text()}`));

  console.error("[fit-smoke-playwright] navigating…");
  await page.goto(url, { waitUntil: "load", timeout: 30000 });

  console.error('[fit-smoke-playwright] waiting for data-render-ready="1"…');
  await page.waitForSelector('html[data-render-ready="1"]', { timeout: 30000 });

  const dbg = await page.evaluate(() => {
    const w = window as unknown as { __fitDebug?: { natural: number; avail: number; scale: number; floored: boolean } };
    return w.__fitDebug ?? null;
  });

  if (!dbg) {
    console.error("[fit-smoke-playwright] FAIL: __fitDebug is not defined on window after render-ready");
    process.exit(1);
  }

  console.error("[fit-smoke-playwright] got __fitDebug, writing sentinel to stdout");
  // ONLY stdout write: sentinel-prefixed JSON so the parent can extract it
  // even if tsx/Node emits warnings or version banners on stdout.
  process.stdout.write(SENTINEL + JSON.stringify(dbg) + "\n");
} finally {
  await browser.close();
  console.error("[fit-smoke-playwright] browser closed");
}
