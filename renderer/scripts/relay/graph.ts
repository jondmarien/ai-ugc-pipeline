import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  GRAPH_BASE,
  appSecretProof,
  getMetaCredentials,
} from "../publish/auth/meta.ts";
import type { IgMediaRow } from "./types.ts";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const RENDERER_ROOT = join(__dirname, "..", "..");
const META_SECRETS = join(RENDERER_ROOT, ".secrets", "meta.json");

export type IgCredentials = {
  token: string;
  igUserId: string;
  appSecret: string;
};

type MetaStore = {
  page_access_token?: string;
  ig_user_id?: string;
};

export async function resolveIgCredentials(
  fetchImpl: typeof fetch = fetch,
): Promise<IgCredentials> {
  const envToken = process.env.IG_ACCESS_TOKEN?.trim();
  const envUserId = process.env.IG_USER_ID?.trim();
  const appSecret = process.env.META_APP_SECRET?.trim() ?? process.env.IG_APP_SECRET?.trim() ?? "";

  if (envToken && envUserId) {
    return { token: envToken, igUserId: envUserId, appSecret };
  }

  try {
    const creds = await getMetaCredentials({ fetchImpl });
    return {
      token: creds.pageAccessToken,
      igUserId: creds.igUserId,
      appSecret,
    };
  } catch {
    try {
      const raw = readFileSync(META_SECRETS, "utf8");
      const store = JSON.parse(raw) as MetaStore;
      if (store.page_access_token && store.ig_user_id) {
        return {
          token: store.page_access_token,
          igUserId: store.ig_user_id,
          appSecret,
        };
      }
    } catch {
      /* fall through */
    }
  }

  throw new Error(
    "No IG credentials. Set IG_ACCESS_TOKEN + IG_USER_ID (dashboard/.env) or run `bun run publish:auth meta` in renderer/.",
  );
}

export async function graphGet(
  pathAndQuery: string,
  creds: IgCredentials,
  fetchImpl: typeof fetch = fetch,
): Promise<unknown> {
  const sep = pathAndQuery.includes("?") ? "&" : "?";
  const proof =
    creds.appSecret && creds.token
      ? `&appsecret_proof=${appSecretProof(creds.token, creds.appSecret)}`
      : "";
  const url = `${GRAPH_BASE}${pathAndQuery}${sep}access_token=${encodeURIComponent(creds.token)}${proof}`;
  const res = await fetchImpl(url);
  const body = await res.json();
  if (!res.ok || (body as { error?: unknown }).error) {
    const err = (body as { error?: { message?: string; code?: number } }).error;
    const msg = err?.message ?? `HTTP ${res.status}`;
    throw new Error(`IG Graph API: ${msg}`);
  }
  return body;
}

const MEDIA_FIELDS =
  "id,caption,media_type,timestamp,permalink,media_url,thumbnail_url,children{media_url,media_type}";

export async function fetchAccountUsername(
  creds: IgCredentials,
  fetchImpl: typeof fetch = fetch,
): Promise<{ username: string }> {
  const body = (await graphGet(
    `/${creds.igUserId}?fields=username`,
    creds,
    fetchImpl,
  )) as { username?: string };
  return { username: body.username ?? "" };
}

export async function fetchRecentMedia(
  creds: IgCredentials,
  limit = 25,
  fetchImpl: typeof fetch = fetch,
): Promise<IgMediaRow[]> {
  const body = (await graphGet(
    `/${creds.igUserId}/media?limit=${limit}&fields=${MEDIA_FIELDS}`,
    creds,
    fetchImpl,
  )) as { data?: IgMediaRow[] };
  return body.data ?? [];
}

/** Emit one JSON line per notification for log-based downstream consumers. */
export function emitNewPostEvent(notification: import("./types.ts").NewPostNotification): void {
  console.log(JSON.stringify(notification));
}