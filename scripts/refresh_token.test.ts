import { describe, expect, test } from "bun:test";
import { mergeToken } from "./refresh_token";

describe("mergeToken", () => {
  test("replaces page_access_token, preserves everything else", () => {
    const store = { page_id: "1", page_access_token: "old", ig_user_id: "2" };
    expect(mergeToken(store, "newtok")).toEqual({
      page_id: "1",
      page_access_token: "newtok",
      ig_user_id: "2",
    });
  });
});
