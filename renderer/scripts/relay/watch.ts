import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertUsernameMatches,
  findNewPosts,
  targetUsernameFromEnv,
} from "./detect.ts";
import {
  emitNewPostEvent,
  fetchAccountUsername,
  fetchRecentMedia,
  resolveIgCredentials,
} from "./graph.ts";
import {
  defaultStatePath,
  readWatchState,
  writeWatchState,
} from "./state.ts";
import type { NewPostNotification } from "./types.ts";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const RENDERER_ROOT = join(__dirname, "..", "..");

export type InstagramWatchOpts = {
  dryRun?: boolean;
  bootstrapOnly?: boolean;
  statePath?: string;
  onNewPost?: (n: NewPostNotification) => void;
  fetchImpl?: typeof fetch;
};

export async function runInstagramWatch(
  opts: InstagramWatchOpts = {},
): Promise<{ notifications: NewPostNotification[]; bootstrapped: boolean }> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const statePath = opts.statePath ?? defaultStatePath(RENDERER_ROOT);
  const creds = await resolveIgCredentials(fetchImpl);
  const expectedUser = targetUsernameFromEnv();
  const { username } = await fetchAccountUsername(creds, fetchImpl);
  assertUsernameMatches(username, expectedUser);

  const media = await fetchRecentMedia(creds, 25, fetchImpl);
  const prior = readWatchState(statePath);
  const { notifications, nextState } = findNewPosts(media, prior, {
    igUserId: creds.igUserId,
    username: username || expectedUser,
  });

  const bootstrapped = !prior?.lastSeenMediaId && notifications.length === 0;

  if (opts.bootstrapOnly) {
    if (!opts.dryRun) writeWatchState(statePath, nextState);
    return { notifications: [], bootstrapped };
  }

  const emit = opts.onNewPost ?? emitNewPostEvent;
  for (const n of notifications) emit(n);

  if (!opts.dryRun) writeWatchState(statePath, nextState);

  return { notifications, bootstrapped };
}