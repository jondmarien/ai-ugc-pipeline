/**
 * publish:auth — one-time interactive OAuth CLI
 *
 * Usage:
 *   bun run publish:auth <youtube|tiktok|meta>
 *
 * Obtains a refresh token via the loopback OAuth flow and writes:
 *   renderer/.secrets/<platform>.json  →  { refresh_token, access_token, expires_at }
 *
 * `meta` is different: Facebook/Instagram Page tokens don't rotate via refresh_token.
 * It writes renderer/.secrets/meta.json → { user_access_token, page_id, page_access_token,
 * ig_user_id, ... } — see auth/meta.ts for the token lifecycle this feeds.
 *
 * IMPORTANT: Register exactly this redirect URI in each platform's developer console:
 *   http://localhost:8788/callback
 *
 * Env vars required (set in renderer/.env):
 *   YouTube  → YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET
 *   TikTok   → TIKTOK_CLIENT_KEY,  TIKTOK_CLIENT_SECRET
 *   Meta     → META_APP_ID, META_APP_SECRET
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
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

if (!platform || !["youtube", "tiktok", "meta"].includes(platform)) {
  console.error("Usage: bun run publish:auth <youtube|tiktok|meta>");
  process.exit(1);
}

function checkEnv(vars) {
  const missing = vars.filter((v) => !process.env[v]);
  return missing;
}

const PLATFORM_ENV = {
  youtube: ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET"],
  tiktok: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"],
  meta: ["META_APP_ID", "META_APP_SECRET"],
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
    const proc = Bun.spawn(opener[0], opener[1], {
      stdout: "ignore",
      stderr: "ignore",
    });
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
  console.log(
    `[publish:auth] Redirect URI (register this in Google Cloud Console):`,
  );
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
          return new Response(
            `<html><body><h2>Authorization failed</h2><p>${msg}</p></body></html>`,
            {
              status: 400,
              headers: { "Content-Type": "text/html" },
            },
          );
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
          console.log(
            `[publish:auth] Token written to renderer/.secrets/youtube.json`,
          );

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
  console.log(
    `[publish:auth] Redirect URI (register this in TikTok Developer portal):`,
  );
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
          return new Response(
            `<html><body><h2>Authorization failed</h2><p>${msg}</p></body></html>`,
            {
              status: 400,
              headers: { "Content-Type": "text/html" },
            },
          );
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

          const resp = await fetch(
            "https://open.tiktokapis.com/v2/oauth/token/",
            {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: body.toString(),
            },
          );

          if (!resp.ok) {
            const text = await resp.text();
            throw new Error(
              `TikTok token exchange failed: ${resp.status} — ${text}`,
            );
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
          console.log(
            `[publish:auth] Token written to renderer/.secrets/tiktok.json`,
          );

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
// Meta (Facebook Login for Business) flow
//
// Unlike YouTube/TikTok, this does NOT store a refresh_token — Meta Page tokens
// derived from a long-lived User token don't rotate on a timer (see auth/meta.ts).
// This flow: loopback OAuth (response_type=token, implicit grant — Meta returns
// the token directly in the redirect fragment) → exchange for long-lived →
// GET /me/accounts to resolve the Page + linked IG Business Account.
// ---------------------------------------------------------------------------

async function runMeta() {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const {
    scopes,
    exchangeLongLivedToken,
    fetchPageAccounts,
    fetchInstagramAccountForPage,
    fetchPageDetails,
    pickPageWithInstagram,
    extractGrantedIds,
    debugToken,
    GRAPH_BASE,
    GRAPH_API_VERSION,
  } = await import("./meta.js");

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: scopes.join(","),
    // Required to trigger the Instagram asset-picker during consent — without these,
    // Facebook Login only grants Page access and /me/accounts never returns
    // instagram_business_account, even for a Page that IS linked to an IG account.
    display: "page",
    extras: JSON.stringify({ setup: { channel: "IG_API_ONBOARDING" } }),
  });
  const authUrl = `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth?${params.toString()}`;

  console.log(`\n[publish:auth] Meta (Facebook Page + Instagram)`);
  console.log(
    `[publish:auth] Redirect URI (register this under Facebook Login for Business settings):`,
  );
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
          return new Response(
            `<html><body><h2>Authorization failed</h2><p>${msg}</p></body></html>`,
            {
              status: 400,
              headers: { "Content-Type": "text/html" },
            },
          );
        }

        try {
          // Exchange the auth code for a short-lived User access token.
          const tokenParams = new URLSearchParams({
            client_id: appId,
            client_secret: appSecret,
            redirect_uri: REDIRECT_URI,
            code,
          });
          const codeResp = await fetch(
            `${GRAPH_BASE}/oauth/access_token?${tokenParams.toString()}`,
          );
          if (!codeResp.ok) {
            throw new Error(
              `Meta code exchange failed: ${codeResp.status} — ${await codeResp.text()}`,
            );
          }
          const { access_token: shortLivedToken } = await codeResp.json();

          // Exchange short-lived → long-lived (~60 days) User access token.
          const longLived = await exchangeLongLivedToken(
            shortLivedToken,
            appId,
            appSecret,
          );
          const nowSec = Math.floor(Date.now() / 1000);

          // Ground truth: what scopes/assets actually landed on the token, vs. what the
          // consent dialog displayed. granular_scopes[].target_ids shows which Page/asset
          // ids each permission was actually granted for.
          let debug = null;
          try {
            debug = await debugToken(longLived.access_token, appId, appSecret);
            console.log(
              `\n[publish:auth] Token scopes: ${(debug.scopes ?? []).join(", ") || "(none)"}`,
            );
            if (debug.granular_scopes?.length) {
              console.log(`[publish:auth] Granular scopes:`);
              for (const g of debug.granular_scopes) {
                console.log(
                  `  - ${g.scope}: ${g.target_ids?.length ? g.target_ids.join(", ") : "(all)"}`,
                );
              }
            } else {
              console.log(
                `[publish:auth] No granular_scopes on this token (permissions apply broadly, not asset-scoped).`,
              );
            }
          } catch (e) {
            console.error(
              `[publish:auth] (debug_token check failed, continuing anyway: ${e.message})`,
            );
          }

          // Resolve the Page (+ linked IG Business Account) the user manages.
          const accounts = await fetchPageAccounts(
            longLived.access_token,
            appSecret,
          );

          console.log(
            `\n[publish:auth] Pages returned by /me/accounts: ${accounts.length}`,
          );
          for (const a of accounts) {
            console.log(
              `  - ${a.name} (${a.id}) — instagram_business_account: ${
                a.instagram_business_account
                  ? `${a.instagram_business_account.id} (@${a.instagram_business_account.username ?? "?"})`
                  : "none"
              }`,
            );
          }

          let page = pickPageWithInstagram(accounts);

          // Fallback 1: some accounts don't populate instagram_business_account on the
          // aggregate call but do when queried directly per-Page with the Page's own token.
          if (!page) {
            for (const a of accounts) {
              const ig = await fetchInstagramAccountForPage(
                a.id,
                a.access_token,
                appSecret,
              );
              if (ig) {
                console.log(
                  `[publish:auth] Found via per-Page fallback lookup: ${a.name} -> ${ig.id}`,
                );
                page = { ...a, instagram_business_account: ig };
                break;
              }
            }
          }

          // Fallback 2: /me/accounts only lists Pages the user broadly manages — it does
          // NOT enumerate Pages/assets granted via the newer asset-scoped consent flow
          // (the IG_API_ONBOARDING picker). If granular_scopes already told us exactly
          // which Page + IG user id were granted, fetch that Page directly by id instead.
          if (!page && debug?.granular_scopes) {
            const { pageId, igUserId } = extractGrantedIds(
              debug.granular_scopes,
            );
            if (pageId && igUserId) {
              console.log(
                `[publish:auth] /me/accounts had no match — using granted asset ids directly: page=${pageId} ig=${igUserId}`,
              );
              const details = await fetchPageDetails(
                pageId,
                longLived.access_token,
                appSecret,
              );
              if (details) {
                page = {
                  ...details,
                  instagram_business_account: { id: igUserId },
                };
              }
            }
          }

          if (!page) {
            throw new Error(
              `No Facebook Page with a linked Instagram Business account was found across ${accounts.length} ` +
                `Page(s) (see the list printed above), and no usable Page+Instagram asset ids were found on the ` +
                `token's granular_scopes either. Checklist: (1) the Instagram account must be a Professional ` +
                `(Business or Creator) account, not Personal; (2) re-link it fresh via the Facebook Page's own ` +
                `Settings > Linked Accounts > Instagram; (3) confirm the Page and IG account both appear together ` +
                `under the same asset in Meta Business Suite > Business assets; (4) confirm you're logging in as ` +
                `an admin of that specific Page. Then re-run \`bun run publish:auth meta\`.`,
            );
          }

          const stored = {
            user_access_token: longLived.access_token,
            user_token_expires_at: nowSec + longLived.expires_in,
            page_id: page.id,
            page_access_token: page.access_token,
            ig_user_id: page.instagram_business_account.id,
            last_verified_at: nowSec,
          };

          writeSecrets("meta", stored);

          console.log(`\n[publish:auth] Meta authorization complete.`);
          console.log(`[publish:auth] Page: ${page.name} (${page.id})`);
          console.log(
            `[publish:auth] Instagram Business Account: ${page.instagram_business_account.id}`,
          );
          console.log(`[publish:auth] Granted scopes: ${scopes.join(", ")}`);
          console.log(
            `[publish:auth] Token written to renderer/.secrets/meta.json`,
          );

          server.stop();
          resolve();

          return new Response(
            `<html><body><h2>Meta authorized.</h2><p>You can close this tab.</p></body></html>`,
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
  } else if (platform === "tiktok") {
    await runTikTok();
  } else {
    await runMeta();
  }
  process.exit(0);
} catch (err) {
  console.error(`\n[publish:auth] Error: ${err.message}`);
  process.exit(1);
}
