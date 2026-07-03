import { expect, test } from "bun:test";
import {
  findNewPosts,
  mediaLinksFromRow,
  normalizeNotification,
} from "./detect.ts";
import type { IgMediaRow, RelayWatchState } from "./types.ts";

const ctx = { igUserId: "1789", username: "chron0s_cyb3r_w0rld.ai", nowMs: 1_700_000_000_000 };

test("bootstrap: no prior state yields zero notifications and sets cursor", () => {
  const media: IgMediaRow[] = [
    {
      id: "post_b",
      timestamp: "2026-07-01T12:00:00+0000",
      permalink: "https://www.instagram.com/p/BBB/",
      media_type: "IMAGE",
      media_url: "https://cdn.example/b.jpg",
    },
    {
      id: "post_a",
      timestamp: "2026-06-30T12:00:00+0000",
      media_type: "VIDEO",
      media_url: "https://cdn.example/a.mp4",
    },
  ];
  const { notifications, nextState } = findNewPosts(media, null, ctx);
  expect(notifications).toHaveLength(0);
  expect(nextState.lastSeenMediaId).toBe("post_b");
  expect(nextState.lastSeenTimestamp).toBe("2026-07-01T12:00:00+0000");
});

test("one new post triggers exactly one notification payload", () => {
  const prior: RelayWatchState = {
    igUserId: "1789",
    username: "chron0s_cyb3r_w0rld.ai",
    lastSeenMediaId: "post_b",
    lastSeenTimestamp: "2026-07-01T12:00:00+0000",
    updatedAt: 1,
  };
  const media: IgMediaRow[] = [
    {
      id: "post_c",
      caption: "new drop",
      timestamp: "2026-07-02T09:00:00+0000",
      permalink: "https://www.instagram.com/reel/CCC/",
      media_type: "VIDEO",
      media_url: "https://cdn.example/c.mp4",
      thumbnail_url: "https://cdn.example/c-thumb.jpg",
    },
    {
      id: "post_b",
      timestamp: "2026-07-01T12:00:00+0000",
      media_type: "IMAGE",
    },
  ];
  const { notifications } = findNewPosts(media, prior, ctx);
  expect(notifications).toHaveLength(1);
  expect(notifications[0].event).toBe("instagram.new_post");
  expect(notifications[0].mediaId).toBe("post_c");
  expect(notifications[0].postUrl).toBe("https://www.instagram.com/reel/CCC/");
  expect(notifications[0].caption).toBe("new drop");
  expect(notifications[0].mediaLinks).toContain("https://cdn.example/c.mp4");
  expect(notifications[0].postedAt).toBe("2026-07-02T09:00:00+0000");
});

test("re-polling same feed does not re-notify (cursor at newest)", () => {
  const prior: RelayWatchState = {
    igUserId: "1789",
    username: "chron0s_cyb3r_w0rld.ai",
    lastSeenMediaId: "post_c",
    lastSeenTimestamp: "2026-07-02T09:00:00+0000",
    updatedAt: 2,
  };
  const media: IgMediaRow[] = [
    { id: "post_c", timestamp: "2026-07-02T09:00:00+0000", media_type: "VIDEO" },
    { id: "post_b", timestamp: "2026-07-01T12:00:00+0000", media_type: "IMAGE" },
  ];
  const { notifications } = findNewPosts(media, prior, ctx);
  expect(notifications).toHaveLength(0);
});

test("carousel collects child media links", () => {
  const row: IgMediaRow = {
    id: "car1",
    media_type: "CAROUSEL_ALBUM",
    children: {
      data: [
        { media_url: "https://cdn.example/1.png", media_type: "IMAGE" },
        { media_url: "https://cdn.example/2.png", media_type: "IMAGE" },
      ],
    },
  };
  expect(mediaLinksFromRow(row)).toEqual([
    "https://cdn.example/1.png",
    "https://cdn.example/2.png",
  ]);
});

test("normalizeNotification sets event type and detectedAt", () => {
  const n = normalizeNotification(
    {
      id: "x",
      timestamp: "2026-07-02T09:00:00+0000",
      permalink: "https://www.instagram.com/p/x/",
      media_type: "IMAGE",
    },
    ctx,
  );
  expect(n.event).toBe("instagram.new_post");
  expect(n.detectedAt).toBe(ctx.nowMs);
});