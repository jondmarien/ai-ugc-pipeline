import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
// renderer/.secrets/ — three levels up from renderer/scripts/publish/auth/
const SECRETS_DIR = join(__dirname, "..", "..", "..", ".secrets");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StoredToken = {
  refresh_token?: string;
  access_token?: string;
  expires_at?: number;
};

type RefreshResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
};

type PlatformConfig = {
  tokenEndpoint: string;
  scopes: string[];
  buildRefreshBody(cfgEnv: Record<string, string>, refreshToken: string): Record<string, string>;
};

type Deps = {
  readStore: (platform: string) => StoredToken;
  writeStore: (platform: string, token: StoredToken) => void;
  fetchImpl: typeof fetch;
  nowSec: number;
};

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/**
 * Returns true only when an access token exists AND has more than 60 s of
 * lifetime remaining relative to nowSec.
 */
export function accessTokenIsFresh(token: StoredToken, nowSec: number): boolean {
  if (!token.access_token) return false;
  if (!token.expires_at) return false;
  return token.expires_at - nowSec > 60;
}

/**
 * Merges a refresh response into the stored token.
 * - Adopts the new access_token and computes expires_at = nowSec + expires_in.
 * - Keeps the existing refresh_token unless the response provides a rotated one.
 */
export function mergeToken(
  stored: StoredToken,
  refreshed: RefreshResponse,
  nowSec: number,
): StoredToken {
  return {
    access_token: refreshed.access_token,
    refresh_token: refreshed.refresh_token ?? stored.refresh_token,
    expires_at: nowSec + refreshed.expires_in,
  };
}

// ---------------------------------------------------------------------------
// Default I/O implementations (swapped out in tests)
// ---------------------------------------------------------------------------

function defaultReadStore(platform: string): StoredToken {
  const path = join(SECRETS_DIR, `${platform}.json`);
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as StoredToken;
  } catch {
    return {};
  }
}

function defaultWriteStore(platform: string, token: StoredToken): void {
  mkdirSync(SECRETS_DIR, { recursive: true });
  const path = join(SECRETS_DIR, `${platform}.json`);
  writeFileSync(path, JSON.stringify(token, null, 2), "utf-8");
}

// ---------------------------------------------------------------------------
// Per-platform config registry
// ---------------------------------------------------------------------------

async function loadPlatformConfig(platform: string): Promise<PlatformConfig> {
  if (platform === "youtube") {
    const mod = await import("./youtube.js");
    return mod as unknown as PlatformConfig;
  }
  if (platform === "tiktok") {
    const mod = await import("./tiktok.js");
    return mod as unknown as PlatformConfig;
  }
  throw new Error(`Unknown platform: ${platform}`);
}

// ---------------------------------------------------------------------------
// getAccessToken
// ---------------------------------------------------------------------------

/**
 * Returns a valid access token for the given platform.
 *
 * - If the stored token is still fresh (>60 s remaining), returns it immediately.
 * - Otherwise, posts to the platform's token endpoint with the stored refresh
 *   token, persists the response, and returns the new access token.
 *
 * Accepts injectable deps so it can be unit-tested without touching disk or net.
 */
export async function getAccessToken(
  platform: string,
  deps?: Partial<Deps>,
): Promise<string> {
  const nowSec = deps?.nowSec ?? Math.floor(Date.now() / 1000);
  const readStore = deps?.readStore ?? defaultReadStore;
  const writeStore = deps?.writeStore ?? defaultWriteStore;
  const fetchImpl = deps?.fetchImpl ?? fetch;

  const stored = readStore(platform);

  if (accessTokenIsFresh(stored, nowSec)) {
    return stored.access_token!;
  }

  if (!stored.refresh_token) {
    throw new Error(
      `No refresh token for platform "${platform}" — run \`bun run publish:auth ${platform}\` first`,
    );
  }

  const config = await loadPlatformConfig(platform);

  const cfgEnv: Record<string, string> = {
    YOUTUBE_CLIENT_ID: process.env.YOUTUBE_CLIENT_ID ?? "",
    YOUTUBE_CLIENT_SECRET: process.env.YOUTUBE_CLIENT_SECRET ?? "",
    TIKTOK_CLIENT_KEY: process.env.TIKTOK_CLIENT_KEY ?? "",
    TIKTOK_CLIENT_SECRET: process.env.TIKTOK_CLIENT_SECRET ?? "",
  };

  const body = config.buildRefreshBody(cfgEnv, stored.refresh_token);
  const formEncoded = new URLSearchParams(body).toString();

  const response = await fetchImpl(config.tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formEncoded,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Token refresh failed for "${platform}": ${response.status} ${response.statusText} — ${text}`,
    );
  }

  const refreshed = (await response.json()) as RefreshResponse;
  const updated = mergeToken(stored, refreshed, nowSec);
  writeStore(platform, updated);

  return updated.access_token!;
}
