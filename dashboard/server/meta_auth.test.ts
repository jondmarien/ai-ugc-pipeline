import { afterEach, describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { appSecretProof, readMetaStore, requireMetaStore } from "./meta_auth";

const tmpPath = path.join(import.meta.dir, "fixtures", "tmp-meta-secrets.json");

afterEach(() => fs.rmSync(tmpPath, { force: true }));

describe("readMetaStore", () => {
  test("returns null when the file doesn't exist", () => {
    expect(readMetaStore(tmpPath)).toBeNull();
  });

  test("parses a valid store file", () => {
    fs.writeFileSync(
      tmpPath,
      JSON.stringify({
        page_id: "1",
        page_access_token: "tok",
        ig_user_id: "2",
      }),
    );
    expect(readMetaStore(tmpPath)).toEqual({
      page_id: "1",
      page_access_token: "tok",
      ig_user_id: "2",
    });
  });

  test("returns null for malformed JSON instead of throwing", () => {
    fs.writeFileSync(tmpPath, "not json");
    expect(readMetaStore(tmpPath)).toBeNull();
  });
});

describe("requireMetaStore", () => {
  test("throws NoMetaCredentialsError when the file is missing", () => {
    expect(() => requireMetaStore(tmpPath)).toThrow(/publish:auth meta/);
  });

  test("throws when the store is missing a required field", () => {
    fs.writeFileSync(tmpPath, JSON.stringify({ page_id: "1" }));
    expect(() => requireMetaStore(tmpPath)).toThrow(/publish:auth meta/);
  });

  test("returns the store when all fields are present", () => {
    fs.writeFileSync(
      tmpPath,
      JSON.stringify({
        page_id: "1",
        page_access_token: "tok",
        ig_user_id: "2",
      }),
    );
    expect(requireMetaStore(tmpPath)).toEqual({
      page_id: "1",
      page_access_token: "tok",
      ig_user_id: "2",
    });
  });
});

describe("appSecretProof", () => {
  test("is deterministic for the same token+secret", () => {
    const a = appSecretProof("tok", "secret");
    const b = appSecretProof("tok", "secret");
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  test("differs when the token or secret changes", () => {
    const a = appSecretProof("tok1", "secret");
    const b = appSecretProof("tok2", "secret");
    const c = appSecretProof("tok1", "other-secret");
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
  });
});
