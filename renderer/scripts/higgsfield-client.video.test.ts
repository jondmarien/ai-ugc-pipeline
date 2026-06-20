import { test, expect } from "bun:test";
import { MODEL_CATALOG } from "./higgsfield-client.mjs";

test("video catalog is present but secondary", () => {
  expect(Array.isArray(MODEL_CATALOG.video)).toBe(true);
  expect(MODEL_CATALOG.video.length).toBeGreaterThanOrEqual(3);
});
