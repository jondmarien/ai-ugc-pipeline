import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { createServer, type ViteDevServer } from "vite";
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
  console.log(`Canvas ${width}×${height}, ${post.slides.length} slides\n`);

  let server: ViteDevServer | undefined;
  let browser;
  const problems: string[] = [];
  try {
    server = await createServer({ root: ROOT, server: { port: PORT, strictPort: true }, logLevel: "warn" });
    await server.listen();

    browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });

    for (let i = 0; i < post.slides.length; i++) {
      const slide = post.slides[i];
      const url = `http://localhost:${PORT}/?post=${encodeURIComponent(post.upload_package.filename_prefix)}&slide=${i + 1}`;
      await page.goto(url, { waitUntil: "networkidle" });
      await page.waitForSelector('html[data-render-ready="1"]', { timeout: 15000 });
      const el = page.locator("#slide-root");
      await el.waitFor({ state: "visible" });

      const fname = slideFilename(post, i);
      const filePath = path.join(outDir, fname);
      const buf = await el.screenshot({ type: "png" });
      writeFileSync(filePath, buf);

      const size = pngSize(buf);
      const ok = size.width === width && size.height === height && buf.length > 1000;
      const status = ok ? "✓" : "✗";
      console.log(`  ${status} ${fname}  (${size.width}×${size.height}, ${(buf.length / 1024).toFixed(0)} KB)`);
      if (!ok) problems.push(`${fname}: got ${size.width}×${size.height}, expected ${width}×${height}`);
    }

    await browser.close();
    browser = undefined;
  } finally {
    if (browser) await browser.close();
    if (server) await server.close();
  }

  // Render-side QA gate: fail loud on wrong dimensions / empty output.
  if (problems.length) {
    console.error("\nRENDER QA FAILED:");
    for (const p of problems) console.error("  - " + p);
    process.exit(1);
  }

  // Confirm the reused background asset actually exists in public/ (else cover is blank).
  const coverBg = post.slides[0].background_asset;
  if (coverBg && post.slides[0].asset_status === "existing") {
    const pub = path.join(ROOT, "public", coverBg.replace(/^\//, ""));
    if (!existsSync(pub)) console.warn(`\n⚠ cover background not found at ${pub} — cover may be procedural-only.`);
  }

  console.log(`\n✓ ${post.slides.length} slides exported to ${outDir}`);
  // readFileSync touch to keep import used if needed later; no-op guard.
  void readFileSync;
}

main()
  .then(() => process.exit(0)) // Vite dev server keeps the loop alive; exit explicitly.
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
