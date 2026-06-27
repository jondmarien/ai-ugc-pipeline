/// <reference types="node" />

// higgsfield-mcp.mjs
//
// MCP (agent-driven) provider for the Higgsfield art path.
//
// A headless Node script cannot call the Claude MCP tools, so "mcp mode" is a two-step,
// agent-orchestrated flow instead of a single API call:
//
//   1. PLAN    `bun run art:higgsfield -- <key> --mode=mcp --plan`
//              writes a generation manifest (.cache/higgsfield/<prefix>.art-plan.json) with one
//              entry per slide: the literal prompt, aspect ratio, target PNG path, and a model
//              hint. The post JSON is NOT touched.
//
//   2. GENERATE  An agent (Claude, Hermes, …) reads the manifest and, for each entry, calls the
//                Higgsfield MCP `generate_image` tool with `prompt` + `aspect_ratio`, then saves
//                the produced PNG to the entry's `out_path` (downloading the returned media URL).
//                Optionally it writes the source URL to `<out_path>.url.txt` so the reel
//                image-to-video step can reuse it.
//
//   3. INGEST  `bun run art:higgsfield -- <key> --mode=mcp --ingest`
//              verifies each `out_path` exists and patches the post JSON (background_asset,
//              asset_status, asset_licenses, renderMetadata). Then the normal pipeline continues
//              (export → package → reel).
//
// buildArtPlan() and ingestArtPlan() are pure-ish (filesystem only, no network) so they unit-test
// without an account.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { RENDERER_ROOT as RENDERER } from "./lib/paths.mjs";
import { backgroundFileName } from "./lib/slide-filename.mjs";
import { buildSlidePrompt, postThemeContext } from "./lib/art-slide-prompt.mjs";
import { buildNegativePrompt } from "./lib/flux-negative-prompt.mjs";
import { MODEL_CATALOG, DEFAULT_IMAGE_MODEL, cliAspectRatio } from "./higgsfield-client.mjs";

const CACHE_DIR = path.join(RENDERER, ".cache", "higgsfield");

export function planPath(prefix) {
  return path.join(CACHE_DIR, `${prefix}.art-plan.json`);
}

function catalogImage(model) {
  return MODEL_CATALOG.image.find((m) => m.id === model);
}

/**
 * Build the MCP art manifest for a post.
 * @param {object} post  the post JSON
 * @param {object} [opts]
 * @param {string} [opts.model]   image model id (default DEFAULT_IMAGE_MODEL)
 * @param {(slide:object)=>boolean} [opts.artExists]  predicate: slide already has a background
 * @param {Set<number>|null} [opts.onlySet]  restrict to these slide numbers
 * @param {boolean} [opts.force]  include slides that already have art
 */
export function buildArtPlan(post, opts = {}) {
  const { model = DEFAULT_IMAGE_MODEL, artExists = () => false, onlySet = null, force = false } = opts;
  const prefix = post?.upload_package?.filename_prefix;
  if (!prefix) throw new Error("post.upload_package.filename_prefix is required for the MCP art plan");
  const catalog = catalogImage(model);
  if (!catalog) throw new Error(`UnknownHiggsfieldModel: ${model}`);

  const themeCtx = postThemeContext(post);
  const negative = buildNegativePrompt();
  const width = post?.canvas?.width ?? 1080;
  const height = post?.canvas?.height ?? 1350;
  const aspectRatio = cliAspectRatio(width, height);

  const slides = (post.slides ?? [])
    .filter((s) => {
      if (onlySet && !onlySet.has(s.slide)) return false;
      if (force) return true;
      if (s.asset_status === "existing") return false;
      return !artExists(s);
    })
    .map((slide) => {
      const styleFusion = String(slide.style_fusion || themeCtx.postStyleFusion || "").trim();
      const prompt = buildSlidePrompt(slide, { ...themeCtx, styleFusion });
      const outName = backgroundFileName({ slide: slide.slide, role: slide.role });
      return {
        slide: slide.slide,
        role: slide.role,
        prompt,
        negative_prompt: negative,
        aspect_ratio: aspectRatio,
        width,
        height,
        model,
        model_hint: catalog.mcpModel ?? model,
        out_path: path.join(RENDERER, "public", "backgrounds", prefix, outName),
        asset_path: `/backgrounds/${prefix}/${outName}`,
        url_sidecar: path.join(RENDERER, "public", "backgrounds", prefix, `${outName}.url.txt`),
      };
    });

  return {
    post_id: post.post_id,
    prefix,
    mode: "mcp",
    model,
    tool: "Higgsfield MCP generate_image",
    canvas: { width, height, aspect_ratio: aspectRatio },
    slides,
  };
}

export function writeArtPlan(prefix, plan) {
  mkdirSync(CACHE_DIR, { recursive: true });
  const file = planPath(prefix);
  writeFileSync(file, `${JSON.stringify(plan, null, 2)}\n`, "utf8");
  return file;
}

export function readArtPlan(prefix) {
  const file = planPath(prefix);
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf8"));
}

/**
 * After an agent has generated PNGs to each plan entry's out_path, patch the post JSON.
 * Returns { ingested: number, missing: string[] }.
 */
export function ingestArtPlan(post, postPath, opts = {}) {
  const prefix = post?.upload_package?.filename_prefix;
  const plan = opts.plan ?? readArtPlan(prefix);
  if (!plan) throw new Error(`No MCP art plan found for "${prefix}". Run --mode=mcp --plan first.`);
  const slideByNum = new Map((post.slides ?? []).map((s) => [s.slide, s]));

  post.asset_licenses = Array.isArray(post.asset_licenses) ? post.asset_licenses : [];
  let ingested = 0;
  const missing = [];

  for (const entry of plan.slides ?? []) {
    const slide = slideByNum.get(entry.slide);
    if (!slide) {
      missing.push(`slide ${entry.slide} (not in post)`);
      continue;
    }
    if (!existsSync(entry.out_path)) {
      missing.push(`slide ${entry.slide} → ${entry.asset_path} (file not generated)`);
      continue;
    }
    slide.background_asset = entry.asset_path;
    slide.asset_status = "generated";
    // Optional: the agent may drop the source URL next to the PNG for the reel i2v step.
    if (existsSync(entry.url_sidecar)) {
      const url = readFileSync(entry.url_sidecar, "utf8").trim();
      if (url.startsWith("http")) slide.higgsfield_image_url = url;
    }
    if (!post.asset_licenses.some((l) => l?.asset === entry.asset_path)) {
      post.asset_licenses.push({
        asset: entry.asset_path,
        source: `Higgsfield MCP / ${entry.model}`,
        license_or_terms: "Pending confirmation from Higgsfield provider terms.",
        commercial_use_allowed: false,
        disclosure_required: true,
        notes: "Generated via the Higgsfield MCP generate_image tool (agent-driven); confirm terms before publish.",
      });
    }
    ingested++;
  }

  post.renderMetadata = {
    provider: "higgsfield-mcp",
    model: plan.model,
    costEstimate: typeof post.renderMetadata?.costEstimate === "number" ? post.renderMetadata.costEstimate : null,
  };

  if (ingested > 0) writeFileSync(postPath, `${JSON.stringify(post, null, 2)}\n`, "utf8");
  return { ingested, missing };
}

export default { planPath, buildArtPlan, writeArtPlan, readArtPlan, ingestArtPlan };
