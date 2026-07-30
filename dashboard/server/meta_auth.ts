import { createHmac } from "node:crypto";
import fs from "node:fs";
import { META_SECRETS_PATH } from "./paths";

// ---------------------------------------------------------------------------
// Reads the token the renderer's `bun run publish:auth meta` flow already
// resolved (renderer/scripts/publish/auth/meta.ts), rather than re-implementing
// Meta OAuth in the dashboard. Read-only: the dashboard never writes this file.
// ---------------------------------------------------------------------------

// Single source of truth for the dashboard's Graph API version — bump here
// only. Mirrors (but isn't imported from) renderer/scripts/publish/auth/meta.ts's
// own GRAPH_API_VERSION const, since the dashboard has no dependency on renderer.
export const GRAPH_API_VERSION = "v26.0";
export const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export type MetaStore = {
  page_id?: string;
  page_access_token?: string;
  ig_user_id?: string;
};

export function readMetaStore(
  secretsPath: string = META_SECRETS_PATH,
): MetaStore | null {
  try {
    return JSON.parse(fs.readFileSync(secretsPath, "utf-8")) as MetaStore;
  } catch {
    return null;
  }
}

/**
 * HMAC-SHA256(access_token, app_secret) — required as `appsecret_proof` on every
 * Graph API call authenticated with a Page access token once the Meta app's
 * "Require app secret" setting is enabled (it is, for this app). Mirrors
 * renderer/scripts/publish/auth/meta.ts's appSecretProof — not imported, since
 * the dashboard has no dependency on the renderer project.
 */
export function appSecretProof(accessToken: string, appSecret: string): string {
  return createHmac("sha256", appSecret).update(accessToken).digest("hex");
}

export class NoMetaCredentialsError extends Error {
  constructor() {
    super(
      "No Meta credentials found — run `bun run publish:auth meta` in renderer/ first.",
    );
    this.name = "NoMetaCredentialsError";
  }
}

/** Throws NoMetaCredentialsError (not a generic Error) so callers can distinguish
 * "not set up yet" from a real Graph API failure. */
export function requireMetaStore(secretsPath?: string): Required<MetaStore> {
  const store = readMetaStore(secretsPath);
  if (!store?.page_access_token || !store.page_id || !store.ig_user_id) {
    throw new NoMetaCredentialsError();
  }
  return store as Required<MetaStore>;
}
