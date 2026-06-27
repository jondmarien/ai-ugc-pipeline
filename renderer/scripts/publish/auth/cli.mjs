/**
 * publish:auth — one-time interactive OAuth CLI
 *
 * Usage:
 *   bun run publish:auth <youtube|tiktok>
 *
 * Obtains a refresh token via the loopback OAuth flow and writes:
 *   renderer/.secrets/<platform>.json  →  { refresh_token, access_token, expires_at }
 *
 * IMPORTANT: Register exactly this redirect URI in each platform's developer console:
 *   http://localhost:8788/callback
 *
 * Env vars required (set in renderer/.env):
 *   YouTube  → YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET
 *   TikTok   → TIKTOK_CLIENT_KEY,  TIKTOK_CLIENT_SECRET
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
// renderer/.secrets/ — three levels up from renderer/scripts/publish/auth/
const SECRETS_DIR = join(__dirname, "..", "..", "..", ".secrets");
const REDIRECT_URI = "http://localhost:8788/callback";
const PORT = 8788;

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

const platform = process.argv[2]?.toLowerCase();

if (!platform || !["youtube", "tiktok"].includes(platform)) {
  console.error("Usage: bun run publish:auth <youtube|tiktok>");
  process.exit(1);
}

function checkEnv(vars) {
  const missing = vars.filter((v) => !process.env[v]);
  return missing;
}

const PLATFORM_ENV = {
  youtube: ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET"],
  tiktok: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"],
};

const missing = checkEnv(PLATFORM_ENV[platform]);
if (missing.length > 0) {
  console.error(
    `Missing credentials for ${platform}. Set the following in renderer/.env:\n` +
      missing.map((v) => `  ${v}`).join("\n"),
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function writeSecrets(pl, token) {
  mkdirSync(SECRETS_DIR, { recursive: true });
  const path = join(SECRETS_DIR, `${pl}.json`);
  writeFileSync(path, JSON.stringify(token, null, 2), "utf-8");
}

/** Best-effort: open the URL in the OS default browser. Printing is the reliable path. */
async function tryOpenBrowser(url) {
  const opener =
    process.platform === "win32"
      ? ["cmd", ["/c", "start", "", url]]
      : process.platform === "darwin"
        ? ["open", [url]]
        : ["xdg-open", [url]];
  try {
    const proc = Bun.spawn(opener[0], opener[1], { stdout: "ignore", stderr: "ignore" });
    await proc.exited;
  } catch {
    // Ignore — the printed URL is the reliable path.
  }
}

// ---------------------------------------------------------------------------
// PKCE helpers for TikTok
// ---------------------------------------------------------------------------

function base64urlEncode(buf) {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

async function generatePKCE() {
  const verifierBytes = crypto.getRandomValues(new Uint8Array(32));
  const codeVerifier = base64urlEncode(verifierBytes);
  const challengeBytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(codeVerifier),
  );
  const codeChallenge = base64urlEncode(new Uint8Array(challengeBytes));
  return { codeVerifier, codeChallenge };
}

// ---------------------------------------------------------------------------
// YouTube flow
// ---------------------------------------------------------------------------

async function runYouTube() {
  const { OAuth2Client } = await import("google-auth-library");
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;

  const client = new OAuth2Client(clientId, clientSecret, REDIRECT_URI);

  const { scopes } = await import("./youtube.js");

  const authUrl = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
  });

  console.log(`\n[publish:auth] YouTube`);
  console.log(`[publish:auth] Redirect URI (register this in Google Cloud Console):`);
  console.log(`  ${REDIRECT_URI}\n`);
  console.log(`[publish:auth] Opening authorization URL in browser...`);
  console.log(`[publish:auth] If it does not open, paste this URL manually:\n`);
  console.log(`  ${authUrl}\n`);
  await tryOpenBrowser(authUrl);

  return new Promise((resolve, reject) => {
    const server = Bun.serve({
      port: PORT,
      async fetch(req) {
        const url = new URL(req.url);
        if (url.pathname !== "/callback") {
          return new Response("Not found", { status: 404 });
        }

        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");

        if (error || !code) {
          const msg = `Authorization failed: ${error ?? "no code returned"}`;
          server.stop();
          reject(new Error(msg));
          return new Response(`<html><body><h2>Authorization failed</h2><p>${msg}</p></body></html>`, {
            status: 400,
            headers: { "Content-Type": "text/html" },
          });
        }

        try {
          const { tokens } = await client.getToken(code);
          const nowSec = Math.floor(Date.now() / 1000);
          const stored = {
            refresh_token: tokens.refresh_token ?? undefined,
            access_token: tokens.access_token ?? undefined,
            expires_at: tokens.expiry_date
              ? Math.floor(tokens.expiry_date / 1000)
              : nowSec + 3600,
          };

          writeSecrets("youtube", stored);

          console.log(`\n[publish:auth] YouTube authorization complete.`);
          console.log(`[publish:auth] Granted scopes: ${scopes.join(", ")}`);
          console.log(`[publish:auth] Token written to renderer/.secrets/youtube.json`);

          server.stop();
          resolve();

          return new Response(
            `<html><body><h2>YouTube authorized.</h2><p>You can close this tab.</p></body></html>`,
            { headers: { "Content-Type": "text/html" } },
          );
        } catch (err) {
          server.stop();
          reject(err);
          return new Response(
            `<html><body><h2>Token exchange failed</h2><p>${err.message}</p></body></html>`,
            { status: 500, headers: { "Content-Type": "text/html" } },
          );
        }
      },
    });

    console.log(`[publish:auth] Waiting for callback on ${REDIRECT_URI} ...`);
  });
}

// ---------------------------------------------------------------------------
// TikTok flow
// ---------------------------------------------------------------------------

async function runTikTok() {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

  const { scopes } = await import("./tiktok.js");
  const { codeVerifier, codeChallenge } = await generatePKCE();
  const state = base64urlEncode(crypto.getRandomValues(new Uint8Array(16)));

  const params = new URLSearchParams({
    client_key: clientKey,
    scope: scopes.join(","),
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  const authUrl = `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;

  console.log(`\n[publish:auth] TikTok`);
  console.log(`[publish:auth] Redirect URI (register this in TikTok Developer portal):`);
  console.log(`  ${REDIRECT_URI}\n`);
  console.log(`[publish:auth] Opening authorization URL in browser...`);
  console.log(`[publish:auth] If it does not open, paste this URL manually:\n`);
  console.log(`  ${authUrl}\n`);
  await tryOpenBrowser(authUrl);

  return new Promise((resolve, reject) => {
    const server = Bun.serve({
      port: PORT,
      async fetch(req) {
        const url = new URL(req.url);
        if (url.pathname !== "/callback") {
          return new Response("Not found", { status: 404 });
        }

        const code = url.searchParams.get("code");
        const returnedState = url.searchParams.get("state");
        const error = url.searchParams.get("error");

        if (error || !code) {
          const msg = `Authorization failed: ${error ?? "no code returned"}`;
          server.stop();
          reject(new Error(msg));
          return new Response(`<html><body><h2>Authorization failed</h2><p>${msg}</p></body></html>`, {
            status: 400,
            headers: { "Content-Type": "text/html" },
          });
        }

        if (returnedState !== state) {
          const msg = "State mismatch — possible CSRF. Aborting.";
          server.stop();
          reject(new Error(msg));
          return new Response(`<html><body><h2>${msg}</h2></body></html>`, {
            status: 400,
            headers: { "Content-Type": "text/html" },
          });
        }

        try {
          const body = new URLSearchParams({
            client_key: clientKey,
            client_secret: clientSecret,
            code,
            grant_type: "authorization_code",
            redirect_uri: REDIRECT_URI,
            code_verifier: codeVerifier,
          });

          const resp = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: body.toString(),
          });

          if (!resp.ok) {
            const text = await resp.text();
            throw new Error(`TikTok token exchange failed: ${resp.status} — ${text}`);
          }

          const data = await resp.json();
          const nowSec = Math.floor(Date.now() / 1000);
          const stored = {
            refresh_token: data.refresh_token ?? undefined,
            access_token: data.access_token ?? undefined,
            expires_at: nowSec + (data.expires_in ?? 3600),
          };

          writeSecrets("tiktok", stored);

          const grantedScopes = data.scope ?? scopes.join(",");
          console.log(`\n[publish:auth] TikTok authorization complete.`);
          console.log(`[publish:auth] Granted scopes: ${grantedScopes}`);
          console.log(`[publish:auth] Token written to renderer/.secrets/tiktok.json`);

          server.stop();
          resolve();

          return new Response(
            `<html><body><h2>TikTok authorized.</h2><p>You can close this tab.</p></body></html>`,
            { headers: { "Content-Type": "text/html" } },
          );
        } catch (err) {
          server.stop();
          reject(err);
          return new Response(
            `<html><body><h2>Token exchange failed</h2><p>${err.message}</p></body></html>`,
            { status: 500, headers: { "Content-Type": "text/html" } },
          );
        }
      },
    });

    console.log(`[publish:auth] Waiting for callback on ${REDIRECT_URI} ...`);
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

try {
  if (platform === "youtube") {
    await runYouTube();
  } else {
    await runTikTok();
  }
  process.exit(0);
} catch (err) {
  console.error(`\n[publish:auth] Error: ${err.message}`);
  process.exit(1);
}
