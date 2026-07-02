// bun run art:higgsfield -- <post-key> [--all] [--dry-run] [--model=ID]
//
// Pipeline art step when using --higgsfield: cloud image generation via higgsfield-client.mjs.
// Writes public/backgrounds/<prefix>/NN_role.png and patches post JSON (licenses, URLs for reel).
// Prompt assembly: lib/art-slide-prompt.mjs (same visual contract as Comfy art).
//
// Requires HIGGSFIELD_API_URL + credentials in env. Next: export, optional reel:higgsfield, reel.

import {
  DEFAULT_IMAGE_MODEL,
  healthCheck,
  imageModelCost,
  imageModelFamily,
  renderSlide,
  resolveMode,
} from "./higgsfield-client.mjs";
import {
  buildArtPlan,
  ingestArtPlan,
  writeArtPlan,
} from "./higgsfield-mcp.mjs";
import {
  buildPromptSpec,
  composePromptForFamily,
  postSeedOffset,
  postThemeContext,
} from "./lib/art-slide-prompt.mjs";
import { parseOnlySlides, selectArtSlides } from "./lib/art-targeting.mjs";
import { RENDERER_ROOT as RENDERER } from "./lib/paths.mjs";
import { writePostJson } from "./lib/post-io.mjs";
import { loadPostByKey, POSTS_DIR } from "./lib/post-resolve.mjs";
import { slideBackgroundExists } from "./lib/public-asset.mjs";

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const opt = (name, def) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=").slice(1).join("=") : def;
};
const key = args.find((a) => !a.startsWith("--") && a !== "-h");

const HELP = `
bun run art:higgsfield — per-slide backgrounds via Higgsfield (CLI / REST / MCP)

USAGE
  bun run art:higgsfield -- <post-key> [flags]

  Same slide targeting as \`bun run art\` (missing art by default; --all forces regen).

PROVIDER MODE  (--mode=, else HIGGSFIELD_MODE, else auto)
  cli   shell out to the authed \`higgsfield\` CLI (default — no API key needed).
  rest  HTTP platform API (auto when HIGGSFIELD_API_KEY+SECRET / HF_CREDENTIALS are set).
  mcp   agent-driven via the Higgsfield MCP generate_image tool — a two-step flow:
          --plan    write the generation manifest (.cache/higgsfield/<prefix>.art-plan.json)
          (agent generates each slide's PNG to its out_path via MCP generate_image)
          --ingest  patch the post JSON from the generated PNGs, then export as usual

FLAGS
  --mode=cli|rest|mcp provider mode (default: auto)
  --all | --force     regenerate every non-"existing" slide
  --only=N[,N]        regenerate specific slide numbers
  --model=ID          catalog id (default: ${DEFAULT_IMAGE_MODEL}) — see: bun run higgsfield:models
  --budget=N          abort if the estimated credit cost exceeds N (default 20; 0 = unlimited)
  --yes               override the budget gate
  --plan              (mcp) write the art manifest and print agent instructions
  --ingest            (mcp) ingest already-generated PNGs into the post JSON
  --dry-run           print prompts only
  --help, -h

EXAMPLES
  bun run art:higgsfield -- my-post                       # auto → CLI
  bun run art:higgsfield -- my-post --mode=cli --model=flux
  bun run art:higgsfield -- my-post --mode=mcp --plan     # then generate via MCP, then:
  bun run art:higgsfield -- my-post --mode=mcp --ingest
  bun run pipeline -- my-post --higgsfield                # full pipeline (CLI backgrounds)
`;

if (flags.has("--help") || flags.has("-h") || args.includes("-h")) {
  console.log(HELP);
  process.exit(0);
}
if (!key) {
  console.error(HELP);
  process.exit(1);
}

const DRY = flags.has("--dry-run");
const MODE = resolveMode(opt("mode", ""));
const MODEL = opt(
  "model",
  process.env.HIGGSFIELD_IMAGE_MODEL || DEFAULT_IMAGE_MODEL,
);
const SEED_BASE = Number(opt("seed", process.env.ART_SEED || "42")) || 42;
const COOLDOWN_MS = Number(process.env.ART_COOLDOWN_MS || "3000") || 0;
// Credit budget gate: estimated cost (slides × model rate) must stay ≤ BUDGET unless --yes. Default
// 20 credits/post blocks an accidental expensive run (e.g. gpt-image-2 at 7/img); 0 = unlimited.
const BUDGET = Number(opt("budget", process.env.HIGGSFIELD_BUDGET ?? "20"));
const YES = flags.has("--yes");

const loaded = loadPostByKey(key);
if (!loaded) {
  console.error(`No post JSON in ${POSTS_DIR} matching "${key}".`);
  process.exit(1);
}
const { postPath, post } = loaded;
const prefix = post.upload_package?.filename_prefix;
if (!prefix) {
  console.error("post.upload_package.filename_prefix is required");
  process.exit(1);
}

const themeCtx = postThemeContext(post);
const postBaseSeed = SEED_BASE + postSeedOffset(prefix);
const artExistsFn = (s) => slideBackgroundExists(RENDERER, s);
const onlySetEarly = parseOnlySlides(opt("only", ""));
const FORCE_EARLY = flags.has("--all") || flags.has("--force");

// ── MCP mode: agent-driven plan / ingest (no network from here) ───────────────
if (MODE === "mcp") {
  if (flags.has("--ingest")) {
    const { ingested, missing } = ingestArtPlan(post, postPath);
    console.log(`✓ MCP ingest: patched ${ingested} slide(s) into ${prefix}.`);
    if (missing.length) {
      console.warn(
        `⚠ ${missing.length} still missing:\n  - ${missing.join("\n  - ")}`,
      );
      console.warn(
        `  Generate the missing PNGs (MCP generate_image → out_path), then re-run --ingest.`,
      );
    } else {
      console.log(`  Next: bun run export -- ${key}`);
    }
    process.exit(missing.length ? 2 : 0);
  }
  // default / --plan: write the manifest the agent will execute.
  const plan = buildArtPlan(post, {
    model: MODEL,
    artExists: artExistsFn,
    onlySet: onlySetEarly,
    force: FORCE_EARLY,
  });
  if (!plan.slides.length) {
    console.log(
      "No slides need Higgsfield art for this post (all have backgrounds).",
    );
    process.exit(0);
  }
  const file = writeArtPlan(prefix, plan);
  console.log(`✓ MCP art plan written → ${file}`);
  console.log(
    `  ${plan.slides.length} slide(s) · model=${MODEL} · aspect=${plan.canvas.aspect_ratio}\n`,
  );
  console.log(`AGENT STEPS (Claude / Hermes):`);
  console.log(`  For each slide in the plan, call the Higgsfield MCP tool:`);
  console.log(
    `    generate_image({ prompt: <slide.prompt>, aspect_ratio: "${plan.canvas.aspect_ratio}" })`,
  );
  console.log(
    `  Download the resulting image to <slide.out_path> (and optionally write the`,
  );
  console.log(
    `  source URL to <slide.url_sidecar> for the reel image-to-video step). Then run:`,
  );
  console.log(`    bun run art:higgsfield -- ${key} --mode=mcp --ingest`);
  process.exit(0);
}

if (!DRY) {
  const hc = await healthCheck(MODE);
  console.log(`Higgsfield [${hc.mode}] @ ${hc.baseUrl} · model=${MODEL}`);
}

const onlySet = parseOnlySlides(opt("only", ""));
const FORCE = flags.has("--all") || flags.has("--force");
const artExists = (s) => slideBackgroundExists(RENDERER, s);
const targets = selectArtSlides(post.slides ?? [], {
  onlySet,
  force: FORCE,
  artExists,
});

if (!targets.length) {
  console.log("No slides need Higgsfield art for this post.");
  process.exit(0);
}

// Prompt family + per-image rate for the chosen model, then the pre-flight credit estimate/gate.
const family = imageModelFamily(MODEL);
const unitCost = imageModelCost(MODEL);
const estTotal = Number((unitCost * targets.length).toFixed(2));
console.log(
  `Estimated cost: ${targets.length} slide(s) × ${unitCost} cr (${MODEL}, family=${family}) ≈ ${estTotal} credits.`,
);
if (BUDGET > 0 && estTotal > BUDGET && !YES && !DRY) {
  console.error(
    `\n✋ Estimated ${estTotal} credits exceeds the budget cap of ${BUDGET}.\n` +
      `   Pick a cheaper model (bun run higgsfield:models), raise the cap with --budget=${Math.ceil(estTotal)},\n` +
      `   set HIGGSFIELD_BUDGET, or pass --yes to override.`,
  );
  process.exit(1);
}

let totalCost =
  typeof post.renderMetadata?.costEstimate === "number"
    ? post.renderMetadata.costEstimate
    : 0;

let n = 0;
for (let ti = 0; ti < targets.length; ti++) {
  const slide = targets[ti];
  const slideIndex = post.slides.indexOf(slide);
  const styleFusion = String(
    slide.style_fusion || themeCtx.postStyleFusion || "",
  ).trim();
  const spec = buildPromptSpec(slide, { ...themeCtx, styleFusion });
  // Model-aware prompt: no Higgsfield image model takes a negative param, so exclusions (incl. "no
  // text") are baked into the positive prompt; flux gets the rich house prose, others natural language.
  const { prompt: promptText, negative } = composePromptForFamily(spec, family);
  const seed = postBaseSeed + slide.slide;

  if (DRY) {
    console.log(
      `\n[slide ${slide.slide} ${slide.role}] seed=${seed} family=${family}\n  ${promptText}${negative ? `\n  (negative: ${negative.slice(0, 80)}…)` : ""}`,
    );
    continue;
  }

  if (COOLDOWN_MS && ti > 0)
    await new Promise((r) => setTimeout(r, COOLDOWN_MS));

  process.stdout.write(`  slide ${slide.slide} (${slide.role})… `);
  const t0 = Date.now();
  try {
    totalCost += unitCost;
    await renderSlide({
      post,
      slideIndex,
      prompt: promptText,
      model: MODEL,
      negativePrompt: negative,
      width: 1024,
      height: 1280,
      seed,
      mode: MODE,
      timeoutMs: Number(process.env.HIGGSFIELD_TIMEOUT_MS || "600000"),
    });
    post.renderMetadata = {
      provider: MODE === "cli" ? "higgsfield-cli" : "higgsfield",
      model: MODEL,
      costEstimate: Number(totalCost.toFixed(4)),
    };
    process.stdout.write(
      `\r  slide ${slide.slide} (${slide.role})… ✓ (${((Date.now() - t0) / 1000).toFixed(0)}s)\n`,
    );
    n++;
  } catch (e) {
    process.stdout.write(
      `\r  slide ${slide.slide} (${slide.role})… ✗ ${e.message}\n`,
    );
  }
}

if (!DRY && n > 0) {
  writePostJson(postPath, post);
  console.log(
    `\n✓ Higgsfield generated ${n}/${targets.length} background(s) → public/backgrounds/${prefix}/`,
  );
  console.log(`  Next: bun run export -- ${key}`);
}
