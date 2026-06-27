#!/usr/bin/env bun
// reel-xai.mjs — xAI wrapper for per-beat reel motion (i2v)
// Usage: bun run reel:xai -- <post-key> [--dry-run] [--only=N] [--model=...]

import { generateVideo } from "./xai-client.mjs";

const args = process.argv.slice(2);
const postKey = args[0];
const dryRun = args.includes("--dry-run");
const only = args.find(a => a.startsWith("--only="))?.split("=")[1] || null;
const model = args.find(a => a.startsWith("--model="))?.split("=")[1] || undefined;

if (!postKey) {
  console.error("Usage: bun run reel:xai -- <post-key> [--dry-run] [--only=N]");
  process.exit(1);
}

console.log(`[reel-xai] Starting for ${postKey} (dryRun=${dryRun})`);

const result = await generateVideo(postKey, { dryRun, only, model });
console.log("[reel-xai] Done:", result);