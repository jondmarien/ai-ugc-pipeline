import { describe, expect, test } from "bun:test";
import { logLine } from "./refresh_token";

describe("logLine", () => {
  test("valid token logs OK with expiry", () => {
    expect(
      logLine("2026-01-01T00:00:00.000Z", { is_valid: true, expires_at: 123 }),
    ).toBe("2026-01-01T00:00:00.000Z OK expires_at=123\n");
  });

  test("invalid token logs FAIL with re-auth instructions", () => {
    expect(logLine("2026-01-01T00:00:00.000Z", { is_valid: false })).toBe(
      "2026-01-01T00:00:00.000Z FAIL token invalid — run `bun run publish:auth meta` in renderer/ to re-authenticate\n",
    );
  });
});
