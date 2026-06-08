import { describe, expect, test } from "bun:test";
import path from "node:path";
import { listIngested, parseHandle, parseCoverHook } from "./ingested";

const fx = path.join(import.meta.dir, "fixtures", "ingested");

describe("parseHandle", () => {
  test("extracts bare handle from the metadata line", () => {
    expect(parseHandle("**Source:** x · **Handle:** @growithalex (strategist) · **Captured:** y"))
      .toBe("@growithalex");
  });
  test("returns null when absent", () => {
    expect(parseHandle("**Source:** various · **Captured:** 2026-06-07")).toBeNull();
  });
});

describe("parseCoverHook", () => {
  test("pulls quoted cover text from the slide-map table", () => {
    const md = `## Slide map\n\n| # | Role | Idea |\n|---|---|---|\n| 1 | Cover | "Steal my fixture system. 3 rules. No exceptions." |\n| 2 | Rule 1 | x |`;
    expect(parseCoverHook(md)).toBe("Steal my fixture system. 3 rules. No exceptions.");
  });
  test("null when no cover row", () => {
    expect(parseCoverHook("## Notes\nnothing")).toBeNull();
  });
});

describe("listIngested", () => {
  test("excludes INDEX.md, attributes by handle, groups unattributed", () => {
    const docs = listIngested(fx);
    expect(docs).toHaveLength(2);
    const withH = docs.find((d) => d.handle === "@growithalex")!;
    expect(withH.date).toBe("2026-06-07");
    expect(withH.title).toContain("Fixture System");
    expect(withH.coverHook).toContain("Steal my fixture system");
    const noH = docs.find((d) => d.handle === null)!;
    expect(noH.fileName).toBe("2026-06-07_no-handle.md");
  });
});
