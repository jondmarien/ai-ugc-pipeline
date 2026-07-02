/**
 * Meta (Facebook Page + Instagram) token lifecycle.
 *
 * Meta's token model does not fit oauth.ts's refresh_token pattern: a short-lived
 * User access token (from Facebook Login for Business) is exchanged once for a
 * long-lived one, then GET /me/accounts resolves a Page access token + linked IG
 * Business Account ID. Page tokens derived this way don't rotate on a timer — they
 * are checked for liveness via GET /debug_token instead of refreshed. Both the
 * Facebook and Instagram adapters read from this module directly (not oauth.ts).
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHmac } from "node:crypto";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
// renderer/.secrets/ — three levels up from renderer/scripts/publish/auth/
const SECRETS_DIR = join(__dirname, "..", "..", "..", ".secrets");
const SECRETS_PATH = join(SECRETS_DIR, "meta.json");

export const GRAPH_API_VERSION = "v25.0";
export const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

// Meta's new use-case-driven app flow: "Manage everything on your Page" +
// "Manage messaging & content on Instagram" together grant these scopes.
export const scopes = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "instagram_basic",
  "instagram_content_publish",
];

// A Page token derived from a long-lived user token is re-verified at most once
// per this window to avoid burning an API call on every publish run.
const VERIFY_INTERVAL_SEC = 24 * 60 * 60;

/**
 * HMAC-SHA256(access_token, app_secret) — required as `appsecret_proof` on every
 * Graph API call authenticated with a User or Page access token once the app's
 * "Require app secret" setting is enabled (App Dashboard > Settings > Advanced).
 * Not needed for calls using an app access token (e.g. `appId|appSecret` as the
 * `access_token` value, as debugToken does) since that already proves app identity.
 */
export function appSecretProof(accessToken: string, appSecret: string): string {
  return createHmac("sha256", appSecret).update(accessToken).digest("hex");
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MetaStore = {
  user_access_token?: string;
  user_token_expires_at?: number;
  page_id?: string;
  page_access_token?: string;
  ig_user_id?: string;
  last_verified_at?: number;
};

export type MetaCredentials = {
  pageId: string;
  pageAccessToken: string;
  igUserId: string;
};

type PageAccount = {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: { id: string };
};

type Deps = {
  readStore: () => MetaStore;
  writeStore: (store: MetaStore) => void;
  fetchImpl: typeof fetch;
  nowSec: number;
};

// ---------------------------------------------------------------------------
// Default I/O (swapped out in tests)
// ---------------------------------------------------------------------------

function defaultReadStore(): MetaStore {
  try {
    return JSON.parse(readFileSync(SECRETS_PATH, "utf-8")) as MetaStore;
  } catch {
    return {};
  }
}

function defaultWriteStore(store: MetaStore): void {
  mkdirSync(SECRETS_DIR, { recursive: true });
  writeFileSync(SECRETS_PATH, JSON.stringify(store, null, 2), "utf-8");
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/** True only when the store was verified live within the last VERIFY_INTERVAL_SEC. */
export function isRecentlyVerified(store: MetaStore, nowSec: number): boolean {
  if (!store.last_verified_at) return false;
  return nowSec - store.last_verified_at < VERIFY_INTERVAL_SEC;
}

/** Pick the Page (and its linked IG account) that has an instagram_business_account. */
export function pickPageWithInstagram(accounts: PageAccount[]): PageAccount | undefined {
  return accounts.find((a) => a.instagram_business_account?.id);
}

// ---------------------------------------------------------------------------
// Network steps
// ---------------------------------------------------------------------------

/** Exchange a short-lived User access token for a long-lived one (~60 days). */
export async function exchangeLongLivedToken(
  shortLivedToken: string,
  appId: string,
  appSecret: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ access_token: string; expires_in: number }> {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortLivedToken,
  });
  const resp = await fetchImpl(`${GRAPH_BASE}/oauth/access_token?${params.toString()}`);
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Meta long-lived token exchange failed: ${resp.status} — ${text}`);
  }
  return (await resp.json()) as { access_token: string; expires_in: number };
}

/** GET /me/accounts — Pages the user manages, each with a Page token + linked IG account. */
export async function fetchPageAccounts(
  userAccessToken: string,
  appSecret: string,
  fetchImpl: typeof fetch = fetch,
): Promise<PageAccount[]> {
  const params = new URLSearchParams({
    fields: "id,name,access_token,instagram_business_account",
    access_token: userAccessToken,
    appsecret_proof: appSecretProof(userAccessToken, appSecret),
  });
  const resp = await fetchImpl(`${GRAPH_BASE}/me/accounts?${params.toString()}`);
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Meta /me/accounts failed: ${resp.status} — ${text}`);
  }
  const json = (await resp.json()) as { data?: PageAccount[] };
  return json.data ?? [];
}

/** GET /debug_token — liveness check for a Page access token. */
export async function debugToken(
  inputToken: string,
  appId: string,
  appSecret: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ is_valid: boolean; expires_at?: number }> {
  const params = new URLSearchParams({
    input_token: inputToken,
    access_token: `${appId}|${appSecret}`,
  });
  const resp = await fetchImpl(`${GRAPH_BASE}/debug_token?${params.toString()}`);
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Meta /debug_token failed: ${resp.status} — ${text}`);
  }
  const json = (await resp.json()) as { data?: { is_valid: boolean; expires_at?: number } };
  return json.data ?? { is_valid: false };
}

// ---------------------------------------------------------------------------
// getMetaCredentials — the entry point adapters call
// ---------------------------------------------------------------------------

/**
 * Returns the Page ID, Page access token, and linked IG Business Account ID.
 *
 * - Requires `bun run publish:auth meta` to have run at least once (writes .secrets/meta.json).
 * - Re-verifies liveness via /debug_token at most once per VERIFY_INTERVAL_SEC.
 * - Throws an actionable error (no silent auto-refresh — Meta gives us no refresh_token
 *   for Page tokens) telling the user to re-run publish:auth meta.
 */
export async function getMetaCredentials(deps?: Partial<Deps>): Promise<MetaCredentials> {
  const nowSec = deps?.nowSec ?? Math.floor(Date.now() / 1000);
  const readStore = deps?.readStore ?? defaultReadStore;
  const writeStore = deps?.writeStore ?? defaultWriteStore;
  const fetchImpl = deps?.fetchImpl ?? fetch;

  const store = readStore();

  if (!store.page_access_token || !store.page_id || !store.ig_user_id) {
    throw new Error(
      `No Meta credentials found — run \`bun run publish:auth meta\` first to link your Facebook Page and Instagram account.`,
    );
  }

  if (isRecentlyVerified(store, nowSec)) {
    return { pageId: store.page_id, pageAccessToken: store.page_access_token, igUserId: store.ig_user_id };
  }

  const appId = process.env.META_APP_ID ?? "";
  const appSecret = process.env.META_APP_SECRET ?? "";
  const check = await debugToken(store.page_access_token, appId, appSecret, fetchImpl);

  if (!check.is_valid) {
    throw new Error(
      `Meta Page token is invalid or expired — run \`bun run publish:auth meta\` to re-authenticate.`,
    );
  }

  writeStore({ ...store, last_verified_at: nowSec });

  return { pageId: store.page_id, pageAccessToken: store.page_access_token, igUserId: store.ig_user_id };
}
