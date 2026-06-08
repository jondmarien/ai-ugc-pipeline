import { describe, expect, test } from "bun:test";
import path from "node:path";
import fs from "node:fs";
import { parseFeed } from "./trends";

const fx = path.join(import.meta.dir, "fixtures");

describe("parseFeed", () => {
  test("parses RSS 2.0", () => {
    const items = parseFeed(fs.readFileSync(path.join(fx, "rss-sample.xml"), "utf8"), "Fixture");
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({
      title: "AI agent CVE drops", url: "https://example.com/1",
      publishedAt: Date.parse("Sat, 06 Jun 2026 10:00:00 GMT"), sourceLabel: "Fixture",
    });
  });
  test("parses Atom", () => {
    const items = parseFeed(fs.readFileSync(path.join(fx, "atom-sample.xml"), "utf8"), "Atom");
    expect(items).toHaveLength(2);
    expect(items[0].url).toBe("https://example.com/a1");
    expect(items[0].publishedAt).toBe(Date.parse("2026-06-06T12:00:00Z"));
  });
  test("garbage input returns empty array, does not throw", () => {
    expect(parseFeed("<html>not a feed</html>", "x")).toEqual([]);
  });
});
