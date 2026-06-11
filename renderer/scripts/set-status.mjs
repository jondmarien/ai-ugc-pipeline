#!/usr/bin/env node
// bun run status -- <new-status> <post-key|substring> [<key> ...] [--from=<current>] [--dry-run]
// Sets the lifecycle `status` field on matching post JSONs in content/posts/ — nothing else.
// Targeted single-line replace (preserves formatting). Validates against the status enum.
// Does NOT render. Lifecycle: draft → approved → generated → upload_ready.
//   bun run status -- approved 2026-06-10 2026-06-11      # every 06-10 + 06-11 post
//   bun run status -- upload_ready --from=generated       # promote a whole tier
//   bun run status -- approved my-slug --dry-run          # preview only
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RENDERER = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const POSTS = path.join(RENDERER, "content", "posts");
const STATUSES = ["draft", "approved", "generated", "upload_ready"];

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const opt = (n, d) => { const h = args.find((a) => a.startsWith(`--${n}=`)); return h ? h.split("=")[1] : d; };
const positional = args.filter((a) => !a.startsWith("--"));
const DRY = flags.has("--dry-run");

const HELP = `
bun run status — set the lifecycle status on post JSONs (no render)

USAGE
  bun run status -- <new-status> <post-key|substring> [<key> ...] [--from=<current>] [--dry-run]

  <new-status>      one of: ${STATUSES.join(" | ")}   (lifecycle: ${STATUSES.join(" → ")})
  <post-key>        full key or any substring (e.g. "2026-06-10" matches every 06-10 post)
  --from=<status>   also select every post currently at <status> (promote/demote a whole tier)
  --dry-run         show old → new for each match, change nothing

EXAMPLES
  bun run status -- approved 2026-06-10 2026-06-11
  bun run status -- upload_ready --from=generated
  bun run status -- approved redsun-windows-lpe --dry-run
`;
if (flags.has("--help") || flags.has("-h") || args.includes("-h")) { console.log(HELP); process.exit(0); }

const newStatus = positional[0];
if (!STATUSES.includes(newStatus)) {
  console.error(`✗ new-status must be one of: ${STATUSES.join(", ")} (got "${newStatus ?? ""}")\n${HELP}`);
  process.exit(1);
}
const fromStatus = opt("from", "");
if (fromStatus && !STATUSES.includes(fromStatus)) { console.error(`✗ --from must be one of: ${STATUSES.join(", ")}`); process.exit(1); }
const keyArgs = positional.slice(1);

const allFiles = readdirSync(POSTS).filter((f) => f.endsWith(".json"));
const STATUS_RE = /^(\s*)"status": "(?:draft|approved|generated|upload_ready)"/m;
const readStatus = (f) => { const m = readFileSync(path.join(POSTS, f), "utf8").match(/"status": "(draft|approved|generated|upload_ready)"/); return m ? m[1] : null; };

let targets = [];
if (fromStatus) targets.push(...allFiles.filter((f) => readStatus(f) === fromStatus));
for (const k of keyArgs) {
  const m = allFiles.filter((f) => f.includes(k));
  if (!m.length) console.warn(`  ⚠ no post matches "${k}"`);
  targets.push(...m);
}
targets = [...new Set(targets)].sort();
if (!targets.length) { console.error("✗ no posts selected. Pass post key(s) and/or --from=<status>.\n" + HELP); process.exit(1); }

let n = 0;
for (const f of targets) {
  const fp = path.join(POSTS, f);
  const s = readFileSync(fp, "utf8");
  const old = readStatus(f);
  const key = f.replace(/\.json$/, "");
  if (old === newStatus) { console.log(`  = ${key} already ${newStatus}`); continue; }
  if (!STATUS_RE.test(s)) { console.warn(`  ⚠ ${key}: no status line, skipped`); continue; }
  if (!DRY) writeFileSync(fp, s.replace(STATUS_RE, (_, ind) => `${ind}"status": "${newStatus}"`));
  console.log(`  ${DRY ? "would set" : "✓"} ${key}: ${old} → ${newStatus}`);
  n++;
}
console.log(`\n${DRY ? "(dry-run) " : ""}${n} post(s) ${DRY ? "would change" : "set"} to "${newStatus}".`);
