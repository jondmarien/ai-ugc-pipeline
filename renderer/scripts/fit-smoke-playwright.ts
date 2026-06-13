// Helper for fit-smoke.test.mjs — runs UNDER NODE via tsx (not Bun).
// Playwright's Chromium hangs when launched from the Bun runtime; this
// thin script is spawned as a Node subprocess so Chromium runs outside Bun.
//
// Usage: tsx scripts/fit-smoke-playwright.ts <url>
// Exits 0 and prints a JSON object to stdout:
//   { natural, avail, scale, floored }
// Exits 1 and prints an error message on failure.

import { chromium } from "playwright";

const url = process.argv[2];
if (!url) {
  console.error("Usage: tsx fit-smoke-playwright.ts <url>");
  process.exit(1);
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: "load", timeout: 30000 });
  await page.waitForSelector('html[data-render-ready="1"]', { timeout: 30000 });

  const dbg = await page.evaluate(() => {
    const w = window as unknown as { __fitDebug?: { natural: number; avail: number; scale: number; floored: boolean } };
    return w.__fitDebug ?? null;
  });

  if (!dbg) {
    console.error("__fitDebug is not defined on window after render-ready");
    process.exit(1);
  }

  // Output as JSON on stdout — the bun:test parent reads and parses this.
  console.log(JSON.stringify(dbg));
} finally {
  await browser.close();
}
