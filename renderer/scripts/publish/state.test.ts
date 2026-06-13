import { test, expect } from "bun:test";
import { readState, recordResult, shouldSkip } from "./state";
import { mkdtempSync } from "node:fs"; import { tmpdir } from "node:os"; import { join } from "node:path";

test("absent state is empty; record round-trips; skip honors force", () => {
  const dir = mkdtempSync(join(tmpdir(), "pub-"));
  expect(readState(dir)).toEqual({});
  recordResult(dir, { platform: "youtube", status: "published", id: "abc", url: "u", privacy: "private", at: 1 });
  const s = readState(dir);
  expect(s.youtube.status).toBe("published");
  expect(shouldSkip(s, "youtube", false)).toBe(true);
  expect(shouldSkip(s, "youtube", true)).toBe(false);
  expect(shouldSkip(s, "tiktok", false)).toBe(false);
});
