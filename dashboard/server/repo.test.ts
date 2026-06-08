import { describe, expect, test } from "bun:test";
import path from "node:path";
import { listPosts, listRenders, parseRenderDirName } from "./repo";

const fx = path.join(import.meta.dir, "fixtures");

describe("listPosts", () => {
  test("reads posts JSON with cover hook extracted", () => {
    const posts = listPosts(path.join(fx, "posts"));
    expect(posts).toHaveLength(1);
    const p = posts[0];
    expect(p.slug).toBe("fixture-post");
    expect(p.date).toBe("2026-06-07");
    expect(p.theme).toBe("defensive");
    expect(p.coverHook).toBe("Your AI agent reads everything. So do attackers.");
    expect(p.slideCount).toBe(2);
  });
});

describe("parseRenderDirName", () => {
  test("conforming name yields date+slug", () => {
    expect(parseRenderDirName("2026-06-07_hermes-desktop"))
      .toEqual({ date: "2026-06-07", slug: "hermes-desktop" });
  });
  test("non-conforming name yields null date", () => {
    expect(parseRenderDirName("week 1")).toEqual({ date: null, slug: "week 1" });
  });
});

describe("listRenders", () => {
  test("lists packages incl. non-conforming dirs, with assets", () => {
    const renders = listRenders(path.join(fx, "renders"));
    const names = renders.map((r) => r.dirName).sort();
    expect(names).toEqual(["2026-06-07_fixture-post", "week 1"]);
    const ok = renders.find((r) => r.dirName === "2026-06-07_fixture-post")!;
    expect(ok.date).toBe("2026-06-07");
    expect(ok.hasCaption).toBe(true);
    expect(ok.hasReel).toBe(true);
    expect(ok.slides).toEqual(["2026-06-07_fixture-post_01_cover.png"]);
    const bad = renders.find((r) => r.dirName === "week 1")!;
    expect(bad.date).toBeNull();
  });
});
