/// <reference types="node" />

// xai-client.mjs — xAI adapter using Hermes xAI OAuth (via Python bridge)

import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RENDERER = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const BRIDGE = path.join(RENDERER, "scripts", "xai-hermes-bridge.py");

function callBridge(mode, prompt, imageUrl = null) {
  const args = [mode, prompt];
  if (imageUrl) args.push(imageUrl);

  try {
    const output = execSync(
      `python3 ${BRIDGE} ${args.map(a => `"${a}"`).join(" ")}`,
      { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }
    );
    return JSON.parse(output.trim());
  } catch (err) {
    throw new Error(`Hermes xAI bridge failed: ${err.message}`);
  }
}

export async function generateImage(postKey, opts = {}) {
  const { dryRun = false, model = "grok-imagine-image" } = opts;

  if (dryRun) {
    console.log(`[xai] DRY-RUN image (Hermes OAuth) for ${postKey}`);
    return { success: true, dryRun: true, model };
  }

  console.log(`[xai] Generating image via Hermes xAI OAuth for ${postKey}`);
  const result = callBridge("image", "Dark cinematic cybersecurity slide background");
  return { success: true, url: result.url, model };
}

export async function generateVideo(postKey, opts = {}) {
  const { dryRun = false, model = "grok-imagine-video-1.5-preview" } = opts;

  if (dryRun) {
    console.log(`[xai] DRY-RUN video (Hermes OAuth) for ${postKey}`);
    return { success: true, dryRun: true, model };
  }

  console.log(`[xai] Generating video via Hermes xAI OAuth for ${postKey}`);
  // In real use we would pass a real image_url from the art stage
  const result = callBridge("video", "Slow cinematic camera push-in", "https://example.com/placeholder.jpg");
  return { success: true, url: result.url, model };
}