import { test, expect } from "bun:test";
import { captionTxt, slideCaptionsTxt } from "./caption-export";
import type { TPostData } from "./schema.ts";

test("captionTxt unchanged for legacy single-caption posts", () => {
  const out = captionTxt({
    caption: "Main hook and takeaway.",
    hashtags: ["AI security", "cybersecurity"],
  });
  expect(out).toBe("Main hook and takeaway.\n\n[AI security, cybersecurity]\n");
});

test("slideCaptionsTxt returns null when multiple_captions is off", () => {
  expect(
    slideCaptionsTxt({
      features: { multiple_captions: false },
      slides: [{}, {}, {}] as unknown as TPostData["slides"],
      slide_captions: ["a", "b", "c"],
      hashtags: [],
    }),
  ).toBeNull();
});

test("slideCaptionsTxt emits distinct blocks with topics on last slide only", () => {
  const out = slideCaptionsTxt({
    features: { multiple_captions: true },
    slides: [{}, {}, {}] as unknown as TPostData["slides"],
    slide_captions: ["Cover caption.", "Middle caption.", "CTA caption."],
    hashtags: ["threat intel"],
  });
  expect(out).toBe(
    "Cover caption.\n\nMiddle caption.\n\nCTA caption.\n[threat intel]\n",
  );
});