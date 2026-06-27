import { test, expect } from "bun:test";
import { accessTokenIsFresh, mergeToken } from "./oauth";

test("token is fresh only with >60s headroom", () => {
  expect(accessTokenIsFresh({ access_token: "a", expires_at: 1000 }, 900)).toBe(true);  // 100s left
  expect(accessTokenIsFresh({ access_token: "a", expires_at: 1000 }, 950)).toBe(false); // 50s left
  expect(accessTokenIsFresh({}, 0)).toBe(false);                                        // no token
});

test("mergeToken keeps existing refresh_token and computes expires_at", () => {
  const m = mergeToken({ refresh_token: "R", access_token: "old" }, { access_token: "new", expires_in: 3600 }, 1000);
  expect(m.refresh_token).toBe("R");
  expect(m.access_token).toBe("new");
  expect(m.expires_at).toBe(1000 + 3600);
});

test("mergeToken adopts a rotated refresh_token when the refresh response includes one", () => {
  const m = mergeToken({ refresh_token: "R" }, { access_token: "new", expires_in: 3600, refresh_token: "R2" }, 0);
  expect(m.refresh_token).toBe("R2");
});
