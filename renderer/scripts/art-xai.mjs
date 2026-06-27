#!/usr/bin/env bun
// art-xai.mjs — xAI wrapper for slide background generation
// Usage: bun run art:xai -- <post-key> [--dry-run] [--only=N] [--model=...]

import { generateImage } from "./xai-client.mjs";

const args = process.argv.slice(2);
const postKey = args[0];
const dryRun = args.includes("--dry-run");
const only = args.find(a => a.startsWith("--only="))?.split("=")[1] || null;
const model = args.find(a => a.startsWith("--model="))?.split("=")[1] || undefined;

if (!postKey) {
  console.error("Usage: bun run art:xai -- <post-key> [--dry-run] [--only=N]");
  process.exit(1);
}

console.log(`[art-xai] Starting for ${postKey} (dryRun=${dryRun})`);

const result = await generateImage(postKey, { dryRun, only, model });
console.log("[art-xai] Done:", result);