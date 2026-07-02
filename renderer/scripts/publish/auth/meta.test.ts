import { test, expect } from "bun:test";
import { extractGrantedIds, pickPageWithInstagram, isRecentlyVerified } from "./meta";

test("extractGrantedIds prefers pages_manage_posts / instagram_content_publish targets", () => {
  const { pageId, igUserId } = extractGrantedIds([
    { scope: "pages_show_list", target_ids: ["111"] },
    { scope: "pages_manage_posts", target_ids: ["222"] },
    { scope: "instagram_basic", target_ids: ["333"] },
    { scope: "instagram_content_publish", target_ids: ["444"] },
  ]);
  expect(pageId).toBe("222");
  expect(igUserId).toBe("444");
});

test("extractGrantedIds falls back through pages_show_list / instagram_basic when narrower scopes are absent", () => {
  const { pageId, igUserId } = extractGrantedIds([
    { scope: "pages_show_list", target_ids: ["111"] },
    { scope: "instagram_basic", target_ids: ["333"] },
  ]);
  expect(pageId).toBe("111");
  expect(igUserId).toBe("333");
});

test("extractGrantedIds returns nulls when granular_scopes is missing or empty", () => {
  expect(extractGrantedIds(undefined)).toEqual({ pageId: null, igUserId: null });
  expect(extractGrantedIds([])).toEqual({ pageId: null, igUserId: null });
});

test("pickPageWithInstagram finds the first Page with a linked IG account", () => {
  const accounts = [
    { id: "1", name: "No IG", access_token: "t1" },
    { id: "2", name: "Has IG", access_token: "t2", instagram_business_account: { id: "ig1" } },
  ];
  expect(pickPageWithInstagram(accounts)?.id).toBe("2");
  expect(pickPageWithInstagram([{ id: "1", name: "No IG", access_token: "t1" }])).toBeUndefined();
});

test("isRecentlyVerified respects the 24h window", () => {
  const now = 1_000_000;
  expect(isRecentlyVerified({ last_verified_at: now - 60 * 60 }, now)).toBe(true);
  expect(isRecentlyVerified({ last_verified_at: now - 25 * 60 * 60 }, now)).toBe(false);
  expect(isRecentlyVerified({}, now)).toBe(false);
});
