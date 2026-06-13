import { test, expect } from "bun:test";
import { checkCopyBudget } from "./content-checks";

const slide = (over: Record<string, unknown>) => ({
  slide: 1, role: "mechanism", kicker: "", subline: "", visual_prompt: "x",
  on_slide_copy: "", background_asset: "", asset_status: "generated", cta: "", notes: "",
  ...over,
});
const post = (slides: unknown[]) => ({ slides } as any);

test("body on_slide_copy over 14 words warns", () => {
  const w = checkCopyBudget(post([slide({
    on_slide_copy: "one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen",
  })]));
  expect(w.some((m) => m.includes("on_slide_copy") && m.includes("word"))).toBe(true);
});

test("body on_slide_copy within budget is clean", () => {
  const w = checkCopyBudget(post([slide({ on_slide_copy: "Attackers write four bytes into any file." })]));
  expect(w.length).toBe(0);
});

test("cover capped at 8 words", () => {
  const w = checkCopyBudget(post([slide({ role: "cover",
    on_slide_copy: "one two three four five six seven eight nine" })]));
  expect(w.length).toBe(1);
});

test("markers are stripped before counting", () => {
  const w = checkCopyBudget(post([slide({ role: "takeaway",
    on_slide_copy: "[[Patch the kernel.]] {{Not the module.}}" })]));
  expect(w.length).toBe(0);
});

test("long subline warns", () => {
  const long = Array(31).fill("word").join(" ");
  const w = checkCopyBudget(post([slide({ on_slide_copy: "Short claim here.", subline: long })]));
  expect(w.some((m) => m.includes("subline"))).toBe(true);
});
