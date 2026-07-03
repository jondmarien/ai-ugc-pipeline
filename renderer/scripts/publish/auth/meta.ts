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

import { createHmac } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
// renderer/.secrets/ — three levels up from renderer/scripts/publish/auth/
const SECRETS_DIR = join(__dirname, "..", "..", "..", ".secrets");
const SECRETS_PATH = join(SECRETS_DIR, "meta.json");

export const GRAPH_API_VERSION = "v25.0";
export const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

// Meta's new use-case-driven app flow: "Manage everything on your Page" +
// "Manage messaging & content on Instagram" together grant these scopes.
// instagram_manage_insights is required separately for reading reach/saves/
// shares/views via the Graph API insights endpoint (publishing scopes alone
// don't cover it) — without it every insights call 403s with (#10)
// "Application does not have permission for this action", which the
// dashboard was silently swallowing into zeroed-out stats.
// instagram_manage_comments (hide/delete/reply) and instagram_manage_engagement
// (like/unlike) power the dashboard's Comments moderation panel
// (dashboard/server/comments.ts) — same Page-token flow as publishing/insights.
// POST/DELETE /{ig-user-id}/likes is documented at graph.facebook.com under
// Meta's classic Instagram Graph API reference (not the separate Instagram
// Login product), requiring exactly instagram_basic + instagram_manage_engagement
// — no second app or OAuth flow needed, unlike an earlier (wrong) assumption
// that it required Instagram Login's instagram_business_* scopes.
export const scopes = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "instagram_basic",
  "instagram_content_publish",
  "instagram_manage_insights",
  "instagram_manage_comments",
  "instagram_manage_engagement",
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
export function pickPageWithInstagram(
  accounts: PageAccount[],
): PageAccount | undefined {
  return accounts.find((a) => a.instagram_business_account?.id);
}

/**
 * Extract the Page id + Instagram user id from a token's granular_scopes.
 *
 * Meta's newer asset-scoped consent flow (triggered by the IG_API_ONBOARDING extras
 * param) grants access to specific Page/IG asset ids without necessarily making that
 * Page enumerable via the legacy GET /me/accounts endpoint — that endpoint only lists
 * Pages the user broadly manages, not ones granted via narrow asset-scoped consent.
 * When /me/accounts comes back empty, the granted ids are still right here on the
 * token and can be used directly instead.
 */
export function extractGrantedIds(
  granularScopes: DebugTokenData["granular_scopes"],
): { pageId: string | null; igUserId: string | null } {
  const targetFor = (scope: string): string | null =>
    granularScopes?.find((g) => g.scope === scope)?.target_ids?.[0] ?? null;
  const pageId =
    targetFor("pages_manage_posts") ??
    targetFor("pages_show_list") ??
    targetFor("pages_read_engagement");
  const igUserId =
    targetFor("instagram_content_publish") ?? targetFor("instagram_basic");
  return { pageId, igUserId };
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
  const resp = await fetchImpl(
    `${GRAPH_BASE}/oauth/access_token?${params.toString()}`,
  );
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(
      `Meta long-lived token exchange failed: ${resp.status} — ${text}`,
    );
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
    // Expanding instagram_business_account{id,username} (rather than the bare field)
    // is the pattern Meta's own current examples use; some accounts don't populate the
    // bare field but do populate the expanded one.
    fields: "id,name,access_token,instagram_business_account{id,username}",
    access_token: userAccessToken,
    appsecret_proof: appSecretProof(userAccessToken, appSecret),
  });
  const resp = await fetchImpl(
    `${GRAPH_BASE}/me/accounts?${params.toString()}`,
  );
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Meta /me/accounts failed: ${resp.status} — ${text}`);
  }
  const json = (await resp.json()) as { data?: PageAccount[] };
  return json.data ?? [];
}

/**
 * Fallback per-Page lookup: some accounts don't populate instagram_business_account on
 * the aggregate /me/accounts call but do return it when queried directly on the Page,
 * using the PAGE's own access token rather than the user token.
 */
export async function fetchInstagramAccountForPage(
  pageId: string,
  pageAccessToken: string,
  appSecret: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ id: string; username?: string } | null> {
  const params = new URLSearchParams({
    fields: "instagram_business_account{id,username}",
    access_token: pageAccessToken,
    appsecret_proof: appSecretProof(pageAccessToken, appSecret),
  });
  const resp = await fetchImpl(`${GRAPH_BASE}/${pageId}?${params.toString()}`);
  if (!resp.ok) {
    const text = await resp.text();
    console.error(
      `[publish:auth] Per-Page IG lookup for ${pageId} failed: ${resp.status} — ${text}`,
    );
    return null;
  }
  const json = (await resp.json()) as {
    instagram_business_account?: { id: string; username?: string };
  };
  return json.instagram_business_account ?? null;
}

/**
 * Direct by-id Page lookup — the counterpart to extractGrantedIds(). Fetches the Page's
 * name + access token using the USER access token, bypassing /me/accounts entirely.
 * Used when the token was granted via the narrow asset-scoped consent flow, where the
 * granted Page id is already known (from granular_scopes) but isn't enumerable via
 * /me/accounts.
 */
export async function fetchPageDetails(
  pageId: string,
  userAccessToken: string,
  appSecret: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ id: string; name: string; access_token: string } | null> {
  const params = new URLSearchParams({
    fields: "id,name,access_token",
    access_token: userAccessToken,
    appsecret_proof: appSecretProof(userAccessToken, appSecret),
  });
  const resp = await fetchImpl(`${GRAPH_BASE}/${pageId}?${params.toString()}`);
  if (!resp.ok) {
    const text = await resp.text();
    console.error(
      `[publish:auth] Direct Page lookup for ${pageId} failed: ${resp.status} — ${text}`,
    );
    return null;
  }
  return (await resp.json()) as {
    id: string;
    name: string;
    access_token: string;
  };
}

export type DebugTokenData = {
  is_valid: boolean;
  expires_at?: number;
  scopes?: string[];
  granular_scopes?: Array<{ scope: string; target_ids?: string[] }>;
};

/** GET /debug_token — liveness check for a Page access token, and (used at auth time) a way to see the actual granted scopes/assets on a token, ground-truth vs. what the consent dialog displayed. */
export async function debugToken(
  inputToken: string,
  appId: string,
  appSecret: string,
  fetchImpl: typeof fetch = fetch,
): Promise<DebugTokenData> {
  const params = new URLSearchParams({
    input_token: inputToken,
    access_token: `${appId}|${appSecret}`,
  });
  const resp = await fetchImpl(
    `${GRAPH_BASE}/debug_token?${params.toString()}`,
  );
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Meta /debug_token failed: ${resp.status} — ${text}`);
  }
  const json = (await resp.json()) as { data?: DebugTokenData };
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
export async function getMetaCredentials(
  deps?: Partial<Deps>,
): Promise<MetaCredentials> {
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
    return {
      pageId: store.page_id,
      pageAccessToken: store.page_access_token,
      igUserId: store.ig_user_id,
    };
  }

  const appId = process.env.META_APP_ID ?? "";
  const appSecret = process.env.META_APP_SECRET ?? "";
  const check = await debugToken(
    store.page_access_token,
    appId,
    appSecret,
    fetchImpl,
  );

  if (!check.is_valid) {
    throw new Error(
      `Meta Page token is invalid or expired — run \`bun run publish:auth meta\` to re-authenticate.`,
    );
  }

  writeStore({ ...store, last_verified_at: nowSec });

  return {
    pageId: store.page_id,
    pageAccessToken: store.page_access_token,
    igUserId: store.ig_user_id,
  };
}
