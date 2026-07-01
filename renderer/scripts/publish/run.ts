import { existsSync } from "node:fs";
import path from "node:path";
import { loadPost, outputDir, slideFilename } from "../lib.ts";
import { readStatus, setStatus } from "../lib/post-status.mjs";
import { readState, recordResult, type PublishResult } from "./state";
import type { PlatformAdapter, RenderPackage, AdapterResult } from "./types";
import { youtubeAdapter } from "./adapters/youtube";
import { tiktokAdapter } from "./adapters/tiktok";
import { facebookAdapter } from "./adapters/facebook";
import { instagramAdapter } from "./adapters/instagram";

// The publish gate: ONLY `generated` posts may publish. A post reaches `generated` by being
// human-approved AND rendered (`bun run pipeline` flips approved → generated after a successful
// render), so `generated` means "approved and has a reel to post". `draft`/`approved` are
// rejected (approved-but-unrendered has no reel). --force NEVER bypasses this.
const PUBLISHABLE_STATUSES = ["generated"];

const ADAPTERS: Record<string, PlatformAdapter> = {
  youtube: youtubeAdapter,
  tiktok: tiktokAdapter,
  facebook: facebookAdapter,
  instagram: instagramAdapter,
};

export type PlanInput = {
  status: string | null;
  state: Record<string, Pick<PublishResult, "status"> & Partial<PublishResult>>;
  force: boolean;
};

export type PublishPlan = {
  toRun: string[];
  skipped: string[];
  summary: string[];
};

/**
 * PURE decision function: given a post's status, prior publish state, and the --force
 * flag, decide which platforms to publish to.
 *
 * - Throws unless status is `generated` (approved AND rendered). --force does NOT bypass this.
 * - Skips a platform already `published` in state unless --force.
 * - Returns dry-run-ready summary lines.
 */
export function planPublish(
  key: string,
  platforms: string[],
  { status, state, force }: PlanInput,
): PublishPlan {
  if (!status || !PUBLISHABLE_STATUSES.includes(status)) {
    throw new Error(
      `Post "${key}" has status "${status ?? "none"}" — publishing requires a "generated" post ` +
        `(approved AND rendered; --force does not bypass this). Render it first: bun run pipeline -- ${key}`,
    );
  }

  const toRun: string[] = [];
  const skipped: string[] = [];
  const summary: string[] = [];

  for (const platform of platforms) {
    const alreadyPublished = state[platform]?.status === "published";
    if (alreadyPublished && !force) {
      skipped.push(platform);
      summary.push(`  • ${platform}: SKIP (already published; use --force to re-publish)`);
    } else {
      toRun.push(platform);
      summary.push(`  • ${platform}: publish${alreadyPublished ? " (FORCE re-publish)" : ""}`);
    }
  }

  return { toRun, skipped, summary };
}

// ---------------------------------------------------------------------------
// IO helpers
// ---------------------------------------------------------------------------

function resolvePackage(key: string): { canonicalKey: string; dir: string; pkg: RenderPackage } {
  const post = loadPost(key);
  const dir = outputDir(post);
  const reelName = post.video?.export_name ?? `${post.upload_package.filename_prefix}_reel.mp4`;
  const slides = post.slides.map((_, i) => ({
    path: path.join(dir, slideFilename(post, i)),
    altText: post.alt_text[i] ?? "",
  }));
  const pkg: RenderPackage = {
    key: post.post_id,
    dir,
    reelPath: path.join(dir, reelName),
    slides,
    post: { post_id: post.post_id, caption: post.caption, hashtags: post.hashtags },
  };
  return { canonicalKey: post.post_id, dir, pkg };
}

function toStateResult(r: AdapterResult): PublishResult {
  return {
    platform: r.platform,
    status: r.status,
    id: r.id ?? null,
    url: r.url ?? null,
    privacy: r.privacy,
    at: Math.floor(Date.now() / 1000),
    error: r.error,
  };
}

function logResult(r: AdapterResult): void {
  if (r.status === "published") {
    console.log(`  ✓ ${r.platform}: published${r.url ? ` → ${r.url}` : ""}${r.privacy ? ` (${r.privacy})` : ""}`);
  } else if (r.status === "manual") {
    console.log(`  • ${r.platform}: manual\n${(r.message ?? "").split("\n").map((l) => `      ${l}`).join("\n")}`);
  } else {
    console.log(`  ✗ ${r.platform}: FAILED — ${r.error ?? "unknown error"}`);
  }
}

async function confirmPrompt(question: string): Promise<boolean> {
  process.stdout.write(question);
  // Node/Bun's Console implements Symbol.asyncIterator at runtime (reads stdin line by line);
  // the DOM lib's Console type (pulled in for browser-shared code) doesn't model that overload.
  for await (const line of console as unknown as AsyncIterable<string>) {
    return /^y(es)?$/i.test(line.trim());
  }
  return false;
}

export type RunOpts = { dryRun?: boolean; force?: boolean; yes?: boolean };

/**
 * Orchestrate a gated, idempotent publish of one post's reel to the requested platforms.
 * Resolves the post + render package, enforces the approval gate via planPublish, runs each
 * adapter independently, records publish.state.json, and flips the post to `upload_ready`
 * only when every requested platform succeeded.
 */
export async function runPublish(key: string, platforms: string[], opts: RunOpts = {}): Promise<void> {
  const { canonicalKey, dir, pkg } = resolvePackage(key);
  const status = readStatus(canonicalKey);
  const state = readState(dir);

  // planPublish throws on the approval gate — let it propagate to a clear CLI error.
  const plan = planPublish(canonicalKey, platforms, { status, state, force: opts.force ?? false });

  console.log(`\nPublish plan for ${canonicalKey} (status: ${status}):`);
  for (const line of plan.summary) console.log(line);

  if (plan.toRun.length === 0) {
    console.log("\nNothing to publish — all requested platforms are already published (use --force to re-publish).");
    return;
  }

  if (opts.dryRun) {
    console.log("\n(dry-run) Nothing was posted.");
    return;
  }

  if (!opts.yes) {
    const ok = await confirmPrompt(`\nPublish to ${plan.toRun.join(", ")}? [y/N] `);
    if (!ok) {
      console.log("Aborted. Nothing was posted.");
      return;
    }
  }

  // API adapters need the reel file; the manual (instagram) adapter just points at it.
  const needsReel = plan.toRun.some((p) => ADAPTERS[p]?.kind === "api");
  if (needsReel && !existsSync(pkg.reelPath)) {
    throw new Error(`Reel not found: ${pkg.reelPath} — render it first (bun run pipeline -- ${canonicalKey}).`);
  }

  const results: AdapterResult[] = [];
  for (const platform of plan.toRun) {
    const adapter = ADAPTERS[platform];
    if (!adapter) {
      console.warn(`  ⚠ unknown platform "${platform}" — skipping (known: ${Object.keys(ADAPTERS).join(", ")})`);
      continue;
    }
    const r = await adapter.publish(pkg, { dryRun: false }); // independent; adapters catch their own errors
    recordResult(dir, toStateResult(r));
    results.push(r);
    logResult(r);
  }

  // Flip to upload_ready only when every adapter we ran did not fail.
  const allOk = results.length > 0 && results.every((r) => r.status !== "failed");
  if (allOk) {
    const t = setStatus(canonicalKey, "upload_ready", { onlyFrom: PUBLISHABLE_STATUSES });
    if (t.changed) console.log(`\n✓ status: ${t.old} → upload_ready`);
  } else {
    console.log(`\n⚠ Some platforms failed; status left at "${status}". Fix and re-run (published platforms are skipped).`);
  }
}
