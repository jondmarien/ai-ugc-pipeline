import { describe, expect, test } from "bun:test";
import path from "node:path";
import { normalizeHook, parseCaptionBankHooks, aggregateHooks } from "./hooks";

const fx = path.join(import.meta.dir, "fixtures");

describe("normalizeHook", () => {
  test("lowercases, collapses whitespace, strips trailing punctuation", () => {
    expect(normalizeHook("  Your AI agent  reads EVERYTHING. ")).toBe("your ai agent reads everything");
  });
});

describe("parseCaptionBankHooks", () => {
  test("takes second cell of body rows in section 1 only", () => {
    const hooks = parseCaptionBankHooks(path.join(fx, "CAPTION_BANK_fixture.md"));
    expect(hooks).toEqual([
      "Someone used AI to clone a CFO's voice on a video call",
      "Stop pasting production logs into chatbots",
    ]);
  });
});

describe("aggregateHooks", () => {
  test("merges sources, dedupes by normalized text, counts uses from posts", () => {
    const rows = aggregateHooks({
      posts: [
        { coverHook: "Stop pasting production logs into chatbots", slug: "a", date: "2026-06-01" },
        { coverHook: "Stop pasting production logs into chatbots.", slug: "b", date: "2026-06-02" },
        { coverHook: "Unique post hook", slug: "c", date: "2026-06-03" },
      ],
      ingested: [{ coverHook: "Steal my fixture system", fileName: "x.md", date: "2026-06-07" }],
      captionBank: ["Stop pasting production logs into chatbots"],
    });
    const stop = rows.find((r) => r.text.startsWith("Stop pasting"))!;
    expect(stop.timesUsed).toBe(2);
    expect(stop.sources.sort()).toEqual(["caption-bank", "post"]);
    expect(rows.find((r) => r.text === "Steal my fixture system")!.sources).toEqual(["ingested"]);
    expect(rows.find((r) => r.text === "Unique post hook")!.timesUsed).toBe(1);
  });
});
