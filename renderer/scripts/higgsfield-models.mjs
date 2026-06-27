// bun run higgsfield:models [--live]
//
// List the Higgsfield models the pipeline accepts (the catalog ids you pass to
// --higgsfield-model= for art and --motion-model= for reel image-to-video), with their CLI
// job-set-type mapping. With --live, also dump the full provider catalog from the authed CLI
// (`higgsfield model list`) so you can see everything Higgsfield offers.

import { spawnSync } from "node:child_process";
import {
  MODEL_CATALOG,
  DEFAULT_IMAGE_MODEL,
  DEFAULT_VIDEO_MODEL,
  resolveCliBin,
} from "./higgsfield-client.mjs";

const args = process.argv.slice(2);
const LIVE = args.includes("--live") || args.includes("--cli");
const HELP = args.includes("--help") || args.includes("-h");

if (HELP) {
  console.log(`bun run higgsfield:models [--live]

  Lists the catalog ids the pipeline accepts:
    image → --higgsfield-model=<id>   (art backgrounds)
    video → --motion-model=<id>       (reel image-to-video, with --motion=higgsfield)

  --live   also print the full provider catalog via the authed CLI (higgsfield model list)`);
  process.exit(0);
}

function table(rows) {
  const cols = Math.max(...rows.map((r) => r.length));
  const widths = Array(cols).fill(0);
  for (const r of rows) r.forEach((c, i) => (widths[i] = Math.max(widths[i], String(c).length)));
  for (const r of rows) console.log("  " + r.map((c, i) => String(c).padEnd(widths[i])).join("   ").trimEnd());
}

function imageSection() {
  console.log(`\nIMAGE  (pipeline flag: --higgsfield-model=<id>)`);
  table([
    ["ID", "NAME", "CR/IMG", "FAMILY", "CLI JOB TYPE"],
    ["--", "----", "------", "------", "------------"],
    ...MODEL_CATALOG.image.map((m) => [
      m.id + (m.id === DEFAULT_IMAGE_MODEL ? " (default)" : ""),
      m.name,
      typeof m.creditCost === "number" ? String(m.creditCost) : "?",
      m.promptFamily ?? "flux",
      m.cliJobSetType ?? "—",
    ]),
  ]);
  console.log(`  (cr/img = credits per image; an 8-slide post ≈ 8× that. "?" = needs extra params / unverified.)`);
}

function videoSection() {
  console.log(`\nVIDEO  (pipeline flag: --motion-model=<id>, with --motion=higgsfield)`);
  table([
    ["ID", "NAME", "CLI JOB TYPE"],
    ["--", "----", "------------"],
    ...MODEL_CATALOG.video.map((m) => [m.id + (m.id === DEFAULT_VIDEO_MODEL ? " (default)" : ""), m.name, m.cliJobSetType ?? "—"]),
  ]);
}

console.log("Higgsfield models the pipeline accepts:");
imageSection();
videoSection();

console.log(`\nExamples:`);
console.log(`  bun run pipeline -- <key> --higgsfield --higgsfield-model=flux`);
console.log(`  bun run pipeline -- <key> --higgsfield --motion=higgsfield --motion-model=dop`);
console.log(`  bun run art:higgsfield -- <key> --model=seedream-4.5`);

if (LIVE) {
  const { bin, shell } = resolveCliBin();
  console.log(`\n── full provider catalog (live: ${bin} model list) ──`);
  const r = spawnSync(bin, ["model", "list"], { stdio: "inherit", shell, timeout: 60_000 });
  if (r.status !== 0) {
    console.error(`\n⚠ Could not query the live catalog (is the higgsfield CLI installed + authed?).`);
    process.exit(r.status ?? 1);
  }
} else {
  console.log(`\n(Run with --live to also list the full Higgsfield provider catalog via the CLI.)`);
}
