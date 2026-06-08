import { describe, expect, test } from "bun:test";
import { rewriteEnv } from "./refresh_token";

describe("rewriteEnv", () => {
  test("replaces only IG_ACCESS_TOKEN, preserves everything else", () => {
    const env = "IG_APP_ID=123\nIG_ACCESS_TOKEN=old\nIG_USER_ID=456\n";
    expect(rewriteEnv(env, "newtok")).toBe("IG_APP_ID=123\nIG_ACCESS_TOKEN=newtok\nIG_USER_ID=456\n");
  });
  test("appends the key when missing", () => {
    expect(rewriteEnv("IG_APP_ID=123\n", "t")).toBe("IG_APP_ID=123\nIG_ACCESS_TOKEN=t\n");
  });
});
