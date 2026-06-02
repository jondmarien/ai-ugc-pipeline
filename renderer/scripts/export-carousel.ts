// NOTE: this script runs on Node via tsx (see package.json "export"), NOT the Bun
// runtime. Driving Playwright's Chromium from inside the Bun runtime hangs (same
// Bun↔Chromium issue that affects Remotion). Everything else in this repo runs on Bun;
// only this Playwright-in-process script is carved out to Node.
//
// We screenshot a STATIC `vite build` served by `vite preview` — NOT the dev server.
// The dev server cold-bundles deps on first request and runs an HMR socket, which
// made Playwright navigation time out unpredictably. A static build is deterministic:
// build once, then 8 fast screenshots.
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { build, preview, type PreviewServer } from "vite";
import { chromium } from "playwright";
import { loadPost, slideFilename, outputDir, ROOT } from "./lib.ts";

const PORT = 4317;

// Parse width/height from a PNG IHDR chunk (bytes 16–24) to verify exact size.
function pngSize(buf: Buffer): { width: number; height: number } {
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

async function main() {
  const key = process.argv[2] ?? "2026-06-02_ai-phishing-training";
  const post = loadPost(key);
  const { width, height } = post.canvas;
  const outDir = outputDir(post);
  mkdirSync(outDir, { recursive: true });

  console.log(`Rendering ${post.post_id} → ${outDir}`);
  console.log(`Canvas ${width}×${height}, ${post.slides.length} slides`);

  // 1) Build the preview app to static assets (deterministic; no dev server).
  console.log("Building preview app (vite build)…");
  await build({ root: ROOT, logLevel: "warn", build: { outDir: "dist", emptyOutDir: true } });

  let server: PreviewServer | undefined;
  let browser;
  const problems: string[] = [];
  try {
    // 2) Serve the static build (sirv under the hood — no transforms, no HMR).
    server = await preview({ root: ROOT, preview: { port: PORT, strictPort: true } });

    browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });

    for (let i = 0; i < post.slides.length; i++) {
      const url = `http://localhost:${PORT}/?post=${encodeURIComponent(post.upload_package.filename_prefix)}&slide=${i + 1}`;
      await page.goto(url, { waitUntil: "load", timeout: 30000 });
      // The real readiness signal: set after document.fonts.ready + all images loaded.
      await page.waitForSelector('html[data-render-ready="1"]', { timeout: 30000 });
      const el = page.locator("#slide-root");
      await el.waitFor({ state: "visible" });

      const fname = slideFilename(post, i);
      const buf = await el.screenshot({ type: "png" });
      writeFileSync(path.join(outDir, fname), buf);

      const size = pngSize(buf);
      const ok = size.width === width && size.height === height && buf.length > 1000;
      console.log(`  ${ok ? "✓" : "✗"} ${fname}  (${size.width}×${size.height}, ${(buf.length / 1024).toFixed(0)} KB)`);
      if (!ok) problems.push(`${fname}: got ${size.width}×${size.height}, expected ${width}×${height}`);
    }

    await browser.close();
    browser = undefined;
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise<void>((res) => server!.httpServer.close(() => res()));
  }

  if (problems.length) {
    console.error("\nRENDER QA FAILED:");
    for (const p of problems) console.error("  - " + p);
    process.exit(1);
  }

  const coverBg = post.slides[0].background_asset;
  if (coverBg && post.slides[0].asset_status === "existing") {
    const pub = path.join(ROOT, "public", coverBg.replace(/^\//, ""));
    if (!existsSync(pub)) console.warn(`\n⚠ cover background not found at ${pub} — cover may be procedural-only.`);
  }

  console.log(`\n✓ ${post.slides.length} slides exported to ${outDir}`);
}

main()
  .then(() => process.exit(0)) // preview server keeps the loop alive; exit explicitly.
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
