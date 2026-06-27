import { test, expect } from "bun:test";
import { planPublish } from "./run";

const key = "2026-06-11_bluehammer-cve-2026-33825";

test("planPublish throws when the post is not approved (status draft)", () => {
  expect(() => planPublish(key, ["youtube"], { status: "draft", state: {}, force: false })).toThrow(
    /approved|generated/i,
  );
});

test("planPublish throws when status is null/missing", () => {
  expect(() => planPublish(key, ["youtube"], { status: null, state: {}, force: false })).toThrow();
});

test("planPublish accepts both approved and generated (the human-approval gate)", () => {
  expect(planPublish(key, ["youtube"], { status: "approved", state: {}, force: false }).toRun).toEqual(["youtube"]);
  expect(planPublish(key, ["youtube"], { status: "generated", state: {}, force: false }).toRun).toEqual(["youtube"]);
});

test("planPublish skips an already-published platform unless force", () => {
  const state = { youtube: { platform: "youtube", status: "published", at: 1 } };
  const p1 = planPublish(key, ["youtube", "tiktok"], { status: "approved", state, force: false });
  expect(p1.toRun).toEqual(["tiktok"]);
  expect(p1.skipped).toEqual(["youtube"]);

  const p2 = planPublish(key, ["youtube", "tiktok"], { status: "approved", state, force: true });
  expect(p2.toRun).toEqual(["youtube", "tiktok"]);
  expect(p2.skipped).toEqual([]);
});

test("planPublish returns human-readable summary lines naming each platform + action", () => {
  const state = { youtube: { platform: "youtube", status: "published", at: 1 } };
  const p = planPublish(key, ["youtube", "tiktok"], { status: "approved", state, force: false });
  const text = p.summary.join("\n");
  expect(text).toContain("tiktok");
  expect(text).toContain("youtube");
  expect(text.toLowerCase()).toContain("skip");
});

test("planPublish --force does NOT bypass the approval gate", () => {
  expect(() => planPublish(key, ["youtube"], { status: "draft", state: {}, force: true })).toThrow(
    /approved|generated/i,
  );
});
