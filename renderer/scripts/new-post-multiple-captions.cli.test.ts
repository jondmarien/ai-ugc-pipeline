import { afterAll, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { POSTS_DIR } from "./lib.ts";

const rendererRoot = path.resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "..",
);
// Use the bun binary running this test (cross-platform; the old $BUN_INSTALL/bin/bun guess
// missed the .exe on Windows and broke the spawn).
const bun = process.execPath;

const slug = `kanban-multi-cap-${Date.now()}`;
const jsonName = `2099-01-01_${slug}.json`;
const jsonPath = path.join(POSTS_DIR, jsonName);

afterAll(() => {
  if (existsSync(jsonPath)) unlinkSync(jsonPath);
});

test("new-post --multiple-captions scaffolds one slide_captions entry per slide", () => {
  const result = spawnSync(
    bun,
    [
      "scripts/new-post.ts",
      "2099-01-01",
      slug,
      "model_security",
      "--slides=5",
      "--multiple-captions",
    ],
    { cwd: rendererRoot, encoding: "utf8" },
  );
  expect(result.status).toBe(0);
  expect(existsSync(jsonPath)).toBe(true);
  const raw = JSON.parse(readFileSync(jsonPath, "utf8")) as {
    features: { multiple_captions: boolean };
    slides: unknown[];
    slide_captions: string[];
    upload_package: { expected_files: string[] };
  };
  expect(raw.features.multiple_captions).toBe(true);
  expect(raw.slide_captions.length).toBe(5);
  expect(raw.slides.length).toBe(5);
  expect(raw.upload_package.expected_files).toContain("slide_captions.txt");
});

test("new-post without flag omits slide_captions", () => {
  const slug2 = `${slug}-single`;
  const json2 = path.join(POSTS_DIR, `2099-01-02_${slug2}.json`);
  try {
    const result = spawnSync(
      bun,
      [
        "scripts/new-post.ts",
        "2099-01-02",
        slug2,
        "model_security",
        "--slides=4",
      ],
      { cwd: rendererRoot, encoding: "utf8" },
    );
    expect(result.status).toBe(0);
    const raw = JSON.parse(readFileSync(json2, "utf8")) as {
      features?: { multiple_captions?: boolean };
      slide_captions?: string[];
    };
    expect(raw.features?.multiple_captions ?? false).toBe(false);
    expect(raw.slide_captions).toBeUndefined();
  } finally {
    if (existsSync(json2)) unlinkSync(json2);
  }
});
