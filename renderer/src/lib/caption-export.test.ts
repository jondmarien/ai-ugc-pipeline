import { expect, test } from "bun:test";
import { captionTxt, slideCaptionsTxt, sourcesBlock } from "./caption-export";
import type { TPostData } from "./schema.ts";

test("captionTxt unchanged for legacy single-caption posts with no sources", () => {
  const out = captionTxt({
    caption: "Main hook and takeaway.",
    hashtags: ["AI security", "cybersecurity"],
    sources: [],
  });
  expect(out).toBe("Main hook and takeaway.\n\n[AI security, cybersecurity]\n");
});

test("captionTxt inserts a paste-ready sources block before the topic line", () => {
  const out = captionTxt({
    caption: "Main hook and takeaway.",
    hashtags: ["AI security"],
    sources: [
      {
        source: "Sakana AI",
        link: "https://sakana.ai/fugu-release/",
        supports: "the claim",
        confidence: "high",
        claim_tag: "reported_fact",
      },
      {
        source: "OpenRouter",
        link: "https://openrouter.ai/sakana/fugu-ultra",
        supports: "availability",
        confidence: "high",
        claim_tag: "reported_fact",
      },
    ],
  });
  expect(out).toBe(
    "Main hook and takeaway.\n\n" +
      "Sources:\n" +
      "1. Sakana AI — https://sakana.ai/fugu-release/\n" +
      "2. OpenRouter — https://openrouter.ai/sakana/fugu-ultra\n\n" +
      "[AI security]\n",
  );
});

test("sourcesBlock returns empty string when there are no sources", () => {
  expect(sourcesBlock({ sources: [] })).toBe("");
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
