import { test, expect } from "bun:test";
import { instagramAdapter } from "./instagram";
import type { RenderPackage } from "../types";

const pkg: RenderPackage = {
  key: "2026-06-11_bluehammer-cve-2026-33825",
  dir: "/renders/2026-06-11_bluehammer-cve-2026-33825",
  reelPath: "/renders/2026-06-11_bluehammer-cve-2026-33825/2026-06-11_bluehammer-cve-2026-33825_reel.mp4",
  post: { post_id: "2026-06-11_bluehammer-cve-2026-33825", caption: "BlueHammer.", hashtags: ["BlueHammer"] },
};

test("instagram adapter is manual and never claims a publish", async () => {
  const r = await instagramAdapter.publish(pkg, {});
  expect(instagramAdapter.kind).toBe("manual");
  expect(r.platform).toBe("instagram");
  expect(r.status).toBe("manual");
  expect(r.url).toBeNull();
});

test("manual checklist points at the reel and the render folder", async () => {
  const r = await instagramAdapter.publish(pkg, {});
  expect(r.message).toContain(pkg.reelPath);
  expect(r.message).toContain(pkg.dir);
});
