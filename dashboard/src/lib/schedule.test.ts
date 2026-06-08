import { describe, expect, test } from "bun:test";
import { transition, type ScheduleItem } from "./schedule";

const item: ScheduleItem = {
  id: "2026-06-07_hermes-desktop", renderDir: "2026-06-07_hermes-desktop",
  date: "2026-06-10", time: "18:00", platforms: ["instagram"], status: "queued",
};

describe("schedule transitions", () => {
  test("queued -> posted and queued -> skipped are legal", () => {
    expect(transition(item, "posted").status).toBe("posted");
    expect(transition(item, "skipped").status).toBe("skipped");
  });
  test("posted and skipped are terminal", () => {
    expect(() => transition({ ...item, status: "posted" }, "skipped")).toThrow();
    expect(() => transition({ ...item, status: "skipped" }, "posted")).toThrow();
  });
  test("posted stamps postedAt", () => {
    expect(transition(item, "posted").postedAt).toBeString();
  });
});
