import { test, expect } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildArtPlan, ingestArtPlan } from "./higgsfield-mcp.mjs";

const RENDERER = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

function makePost(prefix: string) {
  return {
    post_id: prefix,
    slug: "mcp-smoke",
    pillar: "offensive_ai",
    theme: "offensive",
    core_claim: "smoke claim",
    canvas: { width: 1080, height: 1350 },
    upload_package: { filename_prefix: prefix },
    slides: [
      { slide: 1, role: "cover", asset_status: "needed", visual_prompt: "abstract dark tech cover" },
      { slide: 2, role: "context", asset_status: "needed", visual_prompt: "abstract dark tech body" },
      { slide: 3, role: "takeaway", asset_status: "existing", background_asset: "/backgrounds/x/03_takeaway.png" },
    ],
    asset_licenses: [],
  };
}

test("buildArtPlan emits one entry per needy slide with prompt + paths", () => {
  const post = makePost(`mcp-test-${Date.now()}`);
  const plan = buildArtPlan(post, { artExists: () => false });
  // slide 3 is "existing" → excluded
  expect(plan.slides.map((s: any) => s.slide)).toEqual([1, 2]);
  expect(plan.canvas.aspect_ratio).toBe("3:4");
  for (const s of plan.slides) {
    expect(typeof s.prompt).toBe("string");
    expect(s.prompt.length).toBeGreaterThan(10);
    expect(s.asset_path).toBe(`/backgrounds/${post.upload_package.filename_prefix}/${String(s.slide).padStart(2, "0")}_${s.role}.png`);
    expect(s.out_path).toContain(path.join("public", "backgrounds"));
    expect(s.aspect_ratio).toBe("3:4");
  }
});

test("buildArtPlan --only filters and --force includes existing", () => {
  const post = makePost(`mcp-test-${Date.now()}`);
  expect(buildArtPlan(post, { onlySet: new Set([2]), artExists: () => false }).slides.map((s: any) => s.slide)).toEqual([2]);
  expect(buildArtPlan(post, { force: true, artExists: () => true }).slides.map((s: any) => s.slide)).toEqual([1, 2, 3]);
});

test("ingestArtPlan patches the post from generated PNGs and reports missing", () => {
  const prefix = `mcp-ingest-${Date.now()}`;
  const post = makePost(prefix);
  const postPath = path.join(RENDERER, ".cache", "higgsfield", `${prefix}.post.json`);
  fs.mkdirSync(path.dirname(postPath), { recursive: true });

  const plan = buildArtPlan(post, { artExists: () => false });
  // Generate slide 1's PNG only; leave slide 2 missing.
  const s1 = plan.slides.find((s: any) => s.slide === 1);
  fs.mkdirSync(path.dirname(s1.out_path), { recursive: true });
  fs.writeFileSync(s1.out_path, Buffer.from([0x89, 0x50, 0x4e, 0x47]));

  try {
    const res = ingestArtPlan(post, postPath, { plan });
    expect(res.ingested).toBe(1);
    expect(res.missing.length).toBe(1);
    const slide1 = post.slides.find((s: any) => s.slide === 1)!;
    expect(slide1.asset_status).toBe("generated");
    expect(slide1.background_asset).toBe(s1.asset_path);
    expect(post.asset_licenses.some((l: any) => l.asset === s1.asset_path)).toBe(true);
    expect((post as any).renderMetadata.provider).toBe("higgsfield-mcp");
    expect(fs.existsSync(postPath)).toBe(true);
  } finally {
    try { fs.unlinkSync(s1.out_path); } catch {}
    try { fs.unlinkSync(postPath); } catch {}
  }
});
