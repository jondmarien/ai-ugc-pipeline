import { beforeEach, describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { ALLOWED_STATE_FILES, readState, writeState } from "./store";

const tmp = path.join(import.meta.dir, "fixtures", "tmp-data");

beforeEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp, { recursive: true });
});

describe("store", () => {
  test("allowlist is exactly the three state files", () => {
    expect([...ALLOWED_STATE_FILES].sort()).toEqual([
      "hooks-meta.json",
      "schedule.json",
      "sources.json",
    ]);
  });

  test("rejects non-allowlisted names including traversal", () => {
    expect(() => readState("evil.json", tmp)).toThrow();
    expect(() => writeState("..\\..\\.env", {}, tmp)).toThrow();
    expect(() => writeState("../schedule.json", {}, tmp)).toThrow();
  });

  test("read of a missing file returns the default", () => {
    expect(readState("schedule.json", tmp)).toEqual({ items: [] });
    expect(readState("hooks-meta.json", tmp)).toEqual({ hooks: {} });
    expect(readState("sources.json", tmp)).toEqual([]);
  });

  test("write then read round-trips", () => {
    writeState("schedule.json", { items: [{ id: "x" }] }, tmp);
    expect(readState("schedule.json", tmp)).toEqual({ items: [{ id: "x" }] });
  });
});
