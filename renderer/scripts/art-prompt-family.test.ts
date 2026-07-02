import { expect, test } from "bun:test";
import {
  buildPromptSpec,
  buildSlidePrompt,
  composeFluxPrompt,
  composePromptForFamily,
} from "./lib/art-slide-prompt.mjs";

const slide = {
  slide: 1,
  role: "cover",
  visual_prompt: "a cracked kernel ring on dark metal",
};
const ctx = {
  accentHex: "#ef4444",
  accentName: "red",
  topic: "linux lpe",
  mood: "tense",
  styleFusion: "",
};

test("buildSlidePrompt stays the FLUX house string (spec → composeFluxPrompt)", () => {
  expect(buildSlidePrompt(slide, ctx)).toBe(
    composeFluxPrompt(buildPromptSpec(slide, ctx)),
  );
});

test("flux family = rich prose (with #hex) + positive exclusions, empty negative", () => {
  const { prompt, negative } = composePromptForFamily(
    buildPromptSpec(slide, ctx),
    "flux",
  );
  expect(prompt).toContain("#ef4444"); // flux keeps the literal hex
  expect(prompt).toContain("a cracked kernel ring on dark metal");
  expect(prompt.toLowerCase()).toContain("no text");
  expect(negative).toBe(""); // no Higgsfield model accepts a negative param
});

test("natural families (soul/seedream/gpt) lead with exclusions and drop #hex", () => {
  for (const fam of ["soul", "seedream", "gpt"]) {
    const { prompt, negative } = composePromptForFamily(
      buildPromptSpec(slide, ctx),
      fam,
    );
    expect(prompt.toLowerCase().startsWith("pure abstract background")).toBe(
      true,
    );
    expect(prompt).not.toContain("#ef4444"); // hex dropped for natural-language models
    expect(prompt.toLowerCase()).toContain("no text");
    expect(negative).toBe("");
  }
});

test("every family forbids text explicitly (cover-text fix)", () => {
  for (const fam of ["flux", "soul", "seedream", "gpt"]) {
    const { prompt } = composePromptForFamily(buildPromptSpec(slide, ctx), fam);
    expect(prompt.toLowerCase()).toContain("no typography");
  }
});
