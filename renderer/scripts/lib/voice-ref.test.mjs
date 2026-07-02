import { describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveVoiceRef } from "./voice-ref.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RENDERER = path.resolve(HERE, "..", "..");
const VOICEREF = path.join(RENDERER, "public", "audio", "_voiceref");

describe("resolveVoiceRef", () => {
  test("returns null when noClone", () => {
    expect(
      resolveVoiceRef({ noClone: true, explicitPath: "/nope.wav" }),
    ).toBeNull();
  });

  test("prefers explicit path when it exists", () => {
    const dir = path.join(RENDERER, "public", "audio");
    mkdirSync(dir, { recursive: true });
    const tmp = path.join(dir, "_test_ref.wav");
    writeFileSync(tmp, "RIFF");
    try {
      const r = resolveVoiceRef({ explicitPath: tmp });
      expect(r?.path).toBe(tmp);
      expect(r?.source).toBe("--custom-voice");
    } finally {
      rmSync(tmp, { force: true });
    }
  });

  test("finds jon_48.wav under repo _voiceref when present", () => {
    const repoRoot = path.resolve(RENDERER, "..");
    const dir = path.join(repoRoot, "_voiceref");
    mkdirSync(dir, { recursive: true });
    const target = path.join(dir, "jon_48.wav");
    const had = existsSync(target);
    if (!had) writeFileSync(target, "RIFF");
    try {
      const r = resolveVoiceRef({});
      expect(r?.path).toBe(target);
      expect(r?.source).toContain("jon_48.wav");
    } finally {
      if (!had) rmSync(target, { force: true });
    }
  });
});
