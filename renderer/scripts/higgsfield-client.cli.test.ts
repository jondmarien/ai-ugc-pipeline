import { afterEach, expect, test } from "bun:test";
import {
  buildCliCreateArgs,
  cliAspectRatio,
  estimateCost,
  hasRestCreds,
  imageModelCost,
  imageModelFamily,
  MODEL_CATALOG,
  parseCliCreateJson,
  resolveCliBin,
  resolveMode,
  videoModelCost,
} from "./higgsfield-client.mjs";

// Snapshot + restore the env keys these tests mutate so order doesn't matter.
const ENV_KEYS = [
  "HIGGSFIELD_MODE",
  "HIGGSFIELD_API_KEY",
  "HIGGSFIELD_API_SECRET",
  "HF_CREDENTIALS",
  "HIGGSFIELD_API_TOKEN",
];
const saved: Record<string, string | undefined> = {};
for (const k of ENV_KEYS) saved[k] = process.env[k];
afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

test("resolveMode honors an explicit mode", () => {
  expect(resolveMode("cli")).toBe("cli");
  expect(resolveMode("rest")).toBe("rest");
  expect(resolveMode("mcp")).toBe("mcp");
  expect(resolveMode("MCP")).toBe("mcp");
});

test("resolveMode rejects an unknown mode", () => {
  expect(() => resolveMode("banana")).toThrow("UnknownHiggsfieldMode");
});

test("resolveMode auto-selects cli without REST creds, rest with them", () => {
  for (const k of ENV_KEYS) delete process.env[k];
  expect(hasRestCreds()).toBe(false);
  expect(resolveMode()).toBe("cli");

  process.env.HIGGSFIELD_API_KEY = "k";
  process.env.HIGGSFIELD_API_SECRET = "s";
  expect(hasRestCreds()).toBe(true);
  expect(resolveMode()).toBe("rest");
});

test("resolveMode env override beats auto-detection", () => {
  process.env.HIGGSFIELD_API_KEY = "k";
  process.env.HIGGSFIELD_API_SECRET = "s";
  process.env.HIGGSFIELD_MODE = "cli";
  expect(resolveMode()).toBe("cli");
});

test("cliAspectRatio maps the carousel ratio (4:5) to 3:4", () => {
  expect(cliAspectRatio(1080, 1350)).toBe("3:4"); // 0.8 → portrait
  expect(cliAspectRatio(1024, 1280)).toBe("3:4"); // 0.8 → portrait
  expect(cliAspectRatio(1080, 1920)).toBe("9:16"); // tall reel
  expect(cliAspectRatio(1024, 1024)).toBe("1:1");
  expect(cliAspectRatio(1920, 1080)).toBe("16:9");
});

test("buildCliCreateArgs assembles a valid `generate create` argv", () => {
  const args = buildCliCreateArgs({
    jobSetType: "text2image_soul_v2",
    prompt: "dark cyber bg, no text",
    aspectRatio: "3:4",
    extraArgs: ["--quality", "2k"],
  });
  expect(args.slice(0, 3)).toEqual([
    "generate",
    "create",
    "text2image_soul_v2",
  ]);
  expect(args).toContain("--prompt");
  expect(args[args.indexOf("--prompt") + 1]).toBe("dark cyber bg, no text");
  expect(args[args.indexOf("--aspect_ratio") + 1]).toBe("3:4");
  expect(args).toContain("--quality");
  expect(args).toContain("--wait");
  expect(args).toContain("--json");
});

test("buildCliCreateArgs requires jobSetType and prompt", () => {
  expect(() => buildCliCreateArgs({ prompt: "x" } as any)).toThrow(
    "jobSetType",
  );
  expect(() => buildCliCreateArgs({ jobSetType: "flux_2" } as any)).toThrow(
    "prompt",
  );
});

test("parseCliCreateJson reads result_url + seed from the job array", () => {
  const json = JSON.stringify([
    {
      id: "abc",
      status: "completed",
      job_set_type: "text2image_soul_v2",
      result_url: "https://cdn/x.png",
      params: { seed: 919383 },
    },
  ]);
  const out = parseCliCreateJson(json);
  expect(out.url).toBe("https://cdn/x.png");
  expect(out.seed).toBe(919383);
  expect(out.id).toBe("abc");
});

test("parseCliCreateJson tolerates a single object and alternate url fields", () => {
  expect(
    parseCliCreateJson(
      JSON.stringify({
        status: "completed",
        image: { url: "https://cdn/y.png" },
      }),
    ).url,
  ).toBe("https://cdn/y.png");
});

test("parseCliCreateJson throws on a non-completed job and on missing url", () => {
  expect(() =>
    parseCliCreateJson(JSON.stringify([{ status: "failed" }])),
  ).toThrow("job failed");
  expect(() =>
    parseCliCreateJson(JSON.stringify([{ status: "completed" }])),
  ).toThrow("no result_url");
  expect(() => parseCliCreateJson("not json")).toThrow("did not return JSON");
});

test("resolveCliBin returns a bin + shell shape", () => {
  const r = resolveCliBin();
  expect(typeof r.bin).toBe("string");
  expect(r.bin.length).toBeGreaterThan(0);
  expect(typeof r.shell).toBe("boolean");
});

test("every image catalog entry has a cliJobSetType + promptFamily", () => {
  for (const m of MODEL_CATALOG.image) {
    expect(typeof m.cliJobSetType).toBe("string");
    expect((m.cliJobSetType as string).length).toBeGreaterThan(0);
    expect(["flux", "soul", "seedream", "gpt"]).toContain(m.promptFamily);
  }
});

test("credit cost table reflects the verified Higgsfield rates", () => {
  expect(imageModelCost("soul-2.0")).toBe(0.12);
  expect(imageModelCost("flux")).toBe(1);
  expect(imageModelCost("seedream-4.5")).toBe(1);
  expect(imageModelCost("gpt-image-2")).toBe(7); // the one that must be gated by --budget
  expect(imageModelCost("cinema-studio-3.0")).toBe(1); // null → conservative fallback
});

test("imageModelFamily maps models to composers", () => {
  expect(imageModelFamily("flux")).toBe("flux");
  expect(imageModelFamily("soul-2.0")).toBe("soul");
  expect(imageModelFamily("seedream-4.5")).toBe("seedream");
  expect(imageModelFamily("gpt-image-2")).toBe("gpt");
});

test("videoModelCost reflects verified i2v clip rates (and rejects image ids)", () => {
  expect(videoModelCost("dop")).toBe(7.5);
  expect(videoModelCost("seedance-2.0")).toBe(7.5);
  expect(videoModelCost("veo-3.1")).toBe(22); // the one the motion gate must block
  expect(() => videoModelCost("flux")).toThrow("UnknownHiggsfieldVideoModel");
});

test("estimateCost returns the table credit value", async () => {
  expect(await estimateCost("gpt-image-2")).toBe(7);
  expect(await estimateCost("soul-2.0")).toBe(0.12);
});
