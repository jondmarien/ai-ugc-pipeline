import type { IgMediaRow, NewPostNotification, RelayWatchState } from "./types.ts";

const DEFAULT_TARGET_USERNAME = "chron0s_cyb3r_w0rld.ai";

export function targetUsernameFromEnv(): string {
  const v = process.env.IG_TARGET_USERNAME?.trim();
  return v || DEFAULT_TARGET_USERNAME;
}

/** Collect public media URLs for reels, images, and carousel children. */
export function mediaLinksFromRow(row: IgMediaRow): string[] {
  const links: string[] = [];
  if (row.media_url) links.push(row.media_url);
  if (row.thumbnail_url && row.thumbnail_url !== row.media_url) {
    links.push(row.thumbnail_url);
  }
  for (const child of row.children?.data ?? []) {
    if (child.media_url) links.push(child.media_url);
  }
  return [...new Set(links)];
}

export function normalizeNotification(
  row: IgMediaRow,
  ctx: { igUserId: string; username: string; nowMs?: number },
): NewPostNotification {
  const postedAt = row.timestamp ?? new Date(0).toISOString();
  return {
    event: "instagram.new_post",
    igUserId: ctx.igUserId,
    username: ctx.username,
    mediaId: row.id,
    postUrl: row.permalink ?? `https://www.instagram.com/p/${row.id}/`,
    caption: row.caption ?? null,
    mediaType: row.media_type ?? "UNKNOWN",
    mediaLinks: mediaLinksFromRow(row),
    postedAt,
    detectedAt: ctx.nowMs ?? Date.now(),
  };
}

function parseTs(iso: string | null | undefined): number {
  if (!iso) return 0;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

/**
 * Returns posts newer than the saved cursor (newest-first feed).
 * Empty prior state => bootstrap only (no notifications).
 */
export function findNewPosts(
  media: IgMediaRow[],
  prior: RelayWatchState | null,
  ctx: { igUserId: string; username: string; nowMs?: number },
): { notifications: NewPostNotification[]; nextState: RelayWatchState } {
  const sorted = [...media].sort(
    (a, b) => parseTs(b.timestamp) - parseTs(a.timestamp),
  );
  const newest = sorted[0];
  const nowMs = ctx.nowMs ?? Date.now();

  if (!newest) {
    return {
      notifications: [],
      nextState: {
        igUserId: ctx.igUserId,
        username: ctx.username,
        lastSeenMediaId: prior?.lastSeenMediaId ?? null,
        lastSeenTimestamp: prior?.lastSeenTimestamp ?? null,
        updatedAt: nowMs,
      },
    };
  }

  if (!prior?.lastSeenMediaId) {
    return {
      notifications: [],
      nextState: {
        igUserId: ctx.igUserId,
        username: ctx.username,
        lastSeenMediaId: newest.id,
        lastSeenTimestamp: newest.timestamp ?? null,
        updatedAt: nowMs,
      },
    };
  }

  const cursorTs = parseTs(prior.lastSeenTimestamp);
  const cursorId = prior.lastSeenMediaId;

  const fresh: IgMediaRow[] = [];
  for (const row of sorted) {
    if (row.id === cursorId) break;
    const rowTs = parseTs(row.timestamp);
    if (rowTs > cursorTs) fresh.push(row);
  }

  fresh.reverse();

  const notifications = fresh.map((row) =>
    normalizeNotification(row, ctx),
  );

  return {
    notifications,
    nextState: {
      igUserId: ctx.igUserId,
      username: ctx.username,
      lastSeenMediaId: newest.id,
      lastSeenTimestamp: newest.timestamp ?? prior.lastSeenTimestamp,
      updatedAt: nowMs,
    },
  };
}

export function assertUsernameMatches(
  actual: string | undefined,
  expected: string,
): void {
  if (!actual) return;
  const a = actual.replace(/^@/, "").toLowerCase();
  const e = expected.replace(/^@/, "").toLowerCase();
  if (a !== e) {
    throw new Error(
      `IG account username "${actual}" does not match IG_TARGET_USERNAME "${expected}"`,
    );
  }
}